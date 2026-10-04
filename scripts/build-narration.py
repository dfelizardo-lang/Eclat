"""Render the actual child reader index once at build time; no inference API."""
import hashlib, json, os, pathlib, subprocess, sys, wave

ROOT=pathlib.Path(__file__).resolve().parent.parent
OUT=pathlib.Path(os.environ.get('NARRATION_OUTPUT',ROOT/'narration'))
PIPER=pathlib.Path(os.environ.get('PIPER_BINARY','/opt/piper/piper'))
MODELS=pathlib.Path(os.environ.get('PIPER_MODELS','/opt/piper-models'))
REV='c10ece1aade47bb51c153c893d14e5bf8e5b7117'

def build():
    passages=json.loads(subprocess.check_output(['node',str(ROOT/'scripts/narration-input.cjs')]))
    OUT.mkdir(parents=True,exist_ok=True)
    manifest={'version':1,'engine':'Piper 2023.11.14-2','modelRevision':REV,
      'defaultVoice':'female','voices':{
        'female':{'name':'Siwis','label':'Conteuse','model':'fr_FR-siwis-medium','datasetLicense':'CC-BY-4.0','source':'https://datashare.is.ed.ac.uk/handle/10283/2353'},
        'male':{'name':'Tom','label':'Conteur','model':'fr_FR-tom-medium','datasetLicense':'AGPL-3.0','source':'https://git.bksp.space/Tjiho/French-tts-model-piper'}},'passages':{}}
    for p in passages:
        manifest['passages'][p['id']]={k:p[k] for k in ['digest','textHash','workId','source']}
        manifest['passages'][p['id']]['voices']={}
    env=dict(os.environ)
    env['LD_LIBRARY_PATH']=str(PIPER.parent)+':'+env.get('LD_LIBRARY_PATH','')
    for kind,name in [('female','siwis'),('male','tom')]:
        jobs=[]
        for p in passages:
            folder=OUT/p['digest'];folder.mkdir(exist_ok=True)
            wav=folder/(kind+'.wav')
            jobs.append(json.dumps({'text':p['text'],'output_file':str(wav)},ensure_ascii=False))
        subprocess.run([str(PIPER),'-m',str(MODELS/(name+'.onnx')),'--espeak_data',str(PIPER.parent/'espeak-ng-data'),'--json-input','--length_scale','1.10','--sentence_silence','0.35'],input='\n'.join(jobs)+'\n',text=True,env=env,check=True,timeout=1200)
        for p in passages:
            folder=OUT/p['digest'];wav=folder/(kind+'.wav');mp3=folder/(kind+'.mp3')
            with wave.open(str(wav),'rb') as stream:
                duration=stream.getnframes()/stream.getframerate()
            if duration<2:raise ValueError('Audio incomplet: '+p['id'])
            subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(wav),'-af','loudnorm=I=-18:TP=-2:LRA=7','-ac','1','-ar','24000','-codec:a','libmp3lame','-b:a','48k',str(mp3)],check=True)
            sha=hashlib.sha256(mp3.read_bytes()).hexdigest()
            size=mp3.stat().st_size
            immutable=OUT/sha;immutable.mkdir(exist_ok=True)
            mp3.replace(immutable/(kind+'.mp3'))
            manifest['passages'][p['id']]['voices'][kind]={'url':'/api/narration/audio/'+sha+'/'+kind+'.mp3','duration':round(duration,2),'bytes':size,'sha256':sha}
            wav.unlink()
        print('Narration prête: '+kind+' / '+str(len(passages))+' extraits',flush=True)
    for folder in OUT.iterdir():
        if folder.is_dir() and not any(folder.iterdir()):folder.rmdir()
    (OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False),encoding='utf8')
    print('Deux voix générées pour '+str(len(passages))+' lectures enfants',flush=True)

if __name__=='__main__':build()
