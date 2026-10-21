"""Render the actual reader index once at build time; no inference API."""
import hashlib, json, os, pathlib, re, subprocess, wave
from urllib.request import urlopen
from concurrent.futures import ThreadPoolExecutor

ROOT=pathlib.Path(__file__).resolve().parent.parent
OUT=pathlib.Path(os.environ.get('NARRATION_OUTPUT',ROOT/'narration'))
PIPER=pathlib.Path(os.environ.get('PIPER_BINARY','/opt/piper/piper'))
MODELS=pathlib.Path(os.environ.get('PIPER_MODELS','/opt/piper-models'))
REV='c10ece1aade47bb51c153c893d14e5bf8e5b7117'
PROFILE='siwis-dual-2026-10-21'

def seed(passages):
    origin=os.environ.get('NARRATION_SEED_URL','').rstrip('/')
    if not origin:return {}
    try:
        with urlopen(origin+'/api/narration',timeout=20) as response:previous=json.load(response)
        if previous.get('modelRevision')!=REV or previous.get('engine')!='Piper 2023.11.14-2':return {}
    except Exception:
        print('Cache de narration indisponible ; génération locale.',flush=True)
        return {}
    tasks=[]
    same_profile=previous.get('voiceProfile')==PROFILE
    for p in passages:
        cached=previous.get('passages',{}).get(p['id'],{})
        if cached.get('digest')!=p['digest']:continue
        for kind,a in cached.get('voices',{}).items():
            # The former female Siwis recordings are still valid. Old male recordings
            # used Tom and must not be reused unless they were already built by PROFILE.
            if kind not in ['female','male'] or (kind=='male' and not same_profile):continue
            if re.fullmatch(r'/api/narration/audio/[a-f0-9]{64}/'+kind+r'\.mp3',a.get('url','')) and re.fullmatch('[a-f0-9]{64}',a.get('sha256','')):
                tasks.append((p['id'],kind,a))
    def retrieve(task):
        pid,kind,a=task
        try:
            with urlopen(origin+a['url'],timeout=30) as response:binary=response.read(2000001)
            if len(binary)!=a['bytes'] or len(binary)>2000000 or hashlib.sha256(binary).hexdigest()!=a['sha256']:return None
            folder=OUT/a['sha256'];folder.mkdir(exist_ok=True)
            (folder/(kind+'.mp3')).write_bytes(binary)
            return pid,kind,a
        except Exception:return None
    result={}
    with ThreadPoolExecutor(max_workers=6) as pool:
        for item in pool.map(retrieve,tasks):
            if item:pid,kind,a=item;result.setdefault(pid,{})[kind]=a
    print('Enregistrements précédents vérifiés et réutilisés : '+str(sum(len(v) for v in result.values())),flush=True)
    return result

def store_audio(path,kind,duration):
    sha=hashlib.sha256(path.read_bytes()).hexdigest()
    size=path.stat().st_size
    immutable=OUT/sha;immutable.mkdir(exist_ok=True)
    path.replace(immutable/(kind+'.mp3'))
    return {'url':'/api/narration/audio/'+sha+'/'+kind+'.mp3','duration':round(duration,2),'bytes':size,'sha256':sha}

def probe_duration(path):
    value=subprocess.check_output([
        'ffprobe','-v','error','-show_entries','format=duration',
        '-of','default=noprint_wrappers=1:nokey=1',str(path)
    ],text=True).strip()
    return float(value)

def build():
    passages=json.loads(subprocess.check_output(['node',str(ROOT/'scripts/narration-input.cjs')]))
    OUT.mkdir(parents=True,exist_ok=True)
    manifest={'version':1,'engine':'Piper 2023.11.14-2','modelRevision':REV,'voiceProfile':PROFILE,
      'defaultVoice':'female','audienceLabels':{'child':{'female':'Conteuse','male':'Conteur'},'adult':{'female':'Narratrice','male':'Narrateur'}},'voices':{
        'female':{'name':'Siwis','label':'Conteuse','model':'fr_FR-siwis-medium','datasetLicense':'CC-BY-4.0','source':'https://datashare.is.ed.ac.uk/handle/10283/2353'},
        'male':{'name':'Siwis grave','label':'Conteur','model':'fr_FR-siwis-medium','transform':'pitch-0.90-eq','datasetLicense':'CC-BY-4.0','source':'https://datashare.is.ed.ac.uk/handle/10283/2353'}},'passages':{}}
    cached=seed(passages)
    for p in passages:
        manifest['passages'][p['id']]={k:p[k] for k in ['digest','textHash','workId','source','audience']}
        manifest['passages'][p['id']]['voices']=cached.get(p['id'],{})

    env=dict(os.environ)
    env['LD_LIBRARY_PATH']=str(PIPER.parent)+':'+env.get('LD_LIBRARY_PATH','')

    # Generate or reuse the original SIWIS voice first.
    pending=[p for p in passages if 'female' not in manifest['passages'][p['id']]['voices']]
    jobs=[]
    for p in pending:
        folder=OUT/p['digest'];folder.mkdir(exist_ok=True)
        wav=folder/'female.wav'
        jobs.append(json.dumps({'text':p['text'],'output_file':str(wav)},ensure_ascii=False))
    if jobs:
        subprocess.run([
            str(PIPER),'-m',str(MODELS/'siwis.onnx'),
            '--espeak_data',str(PIPER.parent/'espeak-ng-data'),
            '--json-input','--length_scale','1.10','--sentence_silence','0.35'
        ],input='\n'.join(jobs)+'\n',text=True,env=env,check=True,timeout=1200)
    for p in pending:
        folder=OUT/p['digest'];wav=folder/'female.wav';mp3=folder/'female.mp3'
        with wave.open(str(wav),'rb') as stream:
            duration=stream.getnframes()/stream.getframerate()
        if duration<2:raise ValueError('Audio incomplet: '+p['id'])
        subprocess.run([
            'ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(wav),
            '-af','loudnorm=I=-18:TP=-2:LRA=7','-ac','1','-ar','24000',
            '-codec:a','libmp3lame','-b:a','48k',str(mp3)
        ],check=True)
        manifest['passages'][p['id']]['voices']['female']=store_audio(mp3,'female',duration)
        wav.unlink()
    print('Narration prête: female / '+str(len(passages))+' extraits',flush=True)

    # Derive the narrator from the same SIWIS recording. Piper's SIWIS model is
    # single-speaker, so the second timbre is a transparent lower-pitch variant,
    # not a different corpus or a hidden third-party voice.
    pending=[p for p in passages if 'male' not in manifest['passages'][p['id']]['voices']]
    for p in pending:
        voice=manifest['passages'][p['id']]['voices']['female']
        source=OUT/voice['sha256']/'female.mp3'
        folder=OUT/p['digest'];folder.mkdir(exist_ok=True)
        mp3=folder/'male.mp3'
        subprocess.run([
            'ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(source),
            '-af','asetrate=24000*0.90,aresample=24000,atempo=1.111111,equalizer=f=1250:t=q:w=1.2:g=-2.5,loudnorm=I=-18:TP=-2:LRA=7',
            '-ac','1','-ar','24000','-codec:a','libmp3lame','-b:a','48k',str(mp3)
        ],check=True)
        duration=probe_duration(mp3)
        if duration<2:raise ValueError('Audio narrateur incomplet: '+p['id'])
        manifest['passages'][p['id']]['voices']['male']=store_audio(mp3,'male',duration)
    print('Narration prête: male / '+str(len(passages))+' extraits (Siwis grave)',flush=True)

    for folder in OUT.iterdir():
        if folder.is_dir() and not any(folder.iterdir()):folder.rmdir()
    (OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False),encoding='utf8')
    print('Deux timbres SIWIS disponibles pour '+str(len(passages))+' lectures enfants et adultes',flush=True)

if __name__=='__main__':build()
