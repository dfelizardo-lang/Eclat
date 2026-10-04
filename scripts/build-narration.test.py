import hashlib, importlib.util, io, json, pathlib, tempfile, unittest
from unittest.mock import patch

spec=importlib.util.spec_from_file_location('narration',pathlib.Path(__file__).with_name('build-narration.py'))
narration=importlib.util.module_from_spec(spec);spec.loader.exec_module(narration)

class CacheTest(unittest.TestCase):
    def test_only_matching_and_intact_recordings_are_reused(self):
        binary=b'verified recording';sha=hashlib.sha256(binary).hexdigest()
        audio={'url':'/api/narration/audio/'+sha+'/female.mp3','sha256':sha,'bytes':len(binary)}
        previous={'engine':'Piper 2023.11.14-2','modelRevision':narration.REV,'passages':{'p':{'digest':'same','voices':{'female':audio}}}}
        calls=[]
        def request(url,timeout):
            calls.append(url);return io.BytesIO(json.dumps(previous).encode() if url.endswith('/api/narration') else binary)
        with tempfile.TemporaryDirectory(dir=pathlib.Path(__file__).parent) as folder,patch.object(narration,'OUT',pathlib.Path(folder)),patch.object(narration,'urlopen',request),patch.dict(narration.os.environ,{'NARRATION_SEED_URL':'https://example.org'}):
            result=narration.seed([{'id':'p','digest':'same'}])
            self.assertEqual(result['p']['female']['sha256'],sha)
            self.assertEqual((pathlib.Path(folder)/sha/'female.mp3').read_bytes(),binary)
            audio['bytes']+=1
            self.assertEqual(narration.seed([{'id':'p','digest':'same'}]),{})
            self.assertEqual(narration.seed([{'id':'p','digest':'changed'}]),{})
            audio['bytes']-=1;audio['url']='https://unrelated.example/private'
            self.assertEqual(narration.seed([{'id':'p','digest':'same'}]),{})
            self.assertFalse(any('unrelated' in url for url in calls))

if __name__=='__main__':unittest.main()
