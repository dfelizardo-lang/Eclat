import importlib.util, unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('importer',Path(__file__).with_name('import-wikisource.py'))
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class SourceExtraction(unittest.TestCase):
    def test_embedded_caption_does_not_corrupt_author_paragraph(self):
        source='<div class="mw-parser-output"><p>Du pain et de l’eau <span style="page-break-inside:avoid"><img src="photo"/><span>Légende étrangère au paragraphe.</span></span>pour dîner, disait-elle.</p><p>Le récit continue dans son propre paragraphe.</p></div>'
        parser=module.Paragraphs();parser.feed(module.clean_source(source))
        self.assertEqual(parser.paras,['Du pain et de l’eau pour dîner, disait-elle.','Le récit continue dans son propre paragraphe.'])
if __name__=='__main__':unittest.main()
