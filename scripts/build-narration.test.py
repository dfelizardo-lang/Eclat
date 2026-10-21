import hashlib, importlib.util, io, json, pathlib, tempfile, unittest
from unittest.mock import patch

spec=importlib.util.spec_from_file_location('narration',pathlib.Path(__file__).with_name('build-narration.py'))
narration=importlib.util.module_from_spec(spec);spec.loader.exec_module(narration)

class CacheTest(unittest.TestCase):
    def test_previous_siwis_female_is_reused_but_old_tom_male_is_not(self):
        female_binary=b'verified siwis recording';female_sha=hashlib.sha256(female_binary).hexdigest()
        male_binary=b'old tom recording';male_sha=hashlib.sha256(male_binary).hexdigest()
        female={'url':'/api/narration/audio/'+female_sha+'/female.mp3','sha256':female_sha,'bytes':len(female_binary)}
        male={'url':'/api/narration/audio/'+male_sha+'/male.mp3','sha256':male_sha,'bytes':len(male_binary)}
        previous={'engine':'Piper 2023.11.14-2','modelRevision':narration.REV,'passages':{'p':{'digest':'same','voices':{'female':female,'male':male}}}}
        calls=[]
        def request(url,timeout):
            calls.append(url)
            if url.endswith('/api/narration'):return io.BytesIO(json.dumps(previous).encode())
            if url.endswith('/female.mp3'):return io.BytesIO(female_binary)
            return io.BytesIO(male_binary)
        with tempfile.TemporaryDirectory(dir=pathlib.Path(__file__).parent) as folder,patch.object(narration,'OUT',pathlib.Path(folder)),patch.object(narration,'urlopen',request),patch.dict(narration.os.environ,{'NARRATION_SEED_URL':'https://example.org'}):
            result=narration.seed([{'id':'p','digest':'same'}])
            self.assertEqual(set(result['p']),{'female'})
            self.assertEqual(result['p']['female']['sha256'],female_sha)
            self.assertEqual((pathlib.Path(folder)/female_sha/'female.mp3').read_bytes(),female_binary)
            self.assertFalse(any(url.endswith('/male.mp3') for url in calls))

    def test_matching_siwis_dual_profile_reuses_both_timbres(self):
        binary=b'verified recording';sha=hashlib.sha256(binary).hexdigest()
        female={'url':'/api/narration/audio/'+sha+'/female.mp3','sha256':sha,'bytes':len(binary)}
        male={'url':'/api/narration/audio/'+sha+'/male.mp3','sha256':sha,'bytes':len(binary)}
        previous={'engine':'Piper 2023.11.14-2','modelRevision':narration.REV,'voiceProfile':narration.PROFILE,'passages':{'p':{'digest':'same','voices':{'female':female,'male':male}}}}
        def request(url,timeout):
            return io.BytesIO(json.dumps(previous).encode() if url.endswith('/api/narration') else binary)
        with tempfile.TemporaryDirectory(dir=pathlib.Path(__file__).parent) as folder,patch.object(narration,'OUT',pathlib.Path(folder)),patch.object(narration,'urlopen',request),patch.dict(narration.os.environ,{'NARRATION_SEED_URL':'https://example.org'}):
            result=narration.seed([{'id':'p','digest':'same'}])
            self.assertEqual(set(result['p']),{'female','male'})

if __name__=='__main__':unittest.main()
