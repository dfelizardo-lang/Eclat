"""Generate candidates, never modify the active catalogue. Run from a scratch directory with sources/; verify author, edition and rights before merging."""
import argparse, concurrent.futures, hashlib, json, re, subprocess, urllib.parse
from html.parser import HTMLParser
from lxml import html as html_tree
from pathlib import Path

class Paragraphs(HTMLParser):
    def __init__(self):
        super().__init__(); self.active=False; self.paras=[]; self.buf=None; self.skip=0
    def handle_starttag(self,t,a):
        a=dict(a)
        if 'mw-parser-output' in a.get('class',''): self.active=True
        if t=='p' and self.active: self.buf=[]
        if t in ('script','style'): self.skip+=1
        if t=='br' and self.buf is not None: self.buf.append('\n')
    def handle_endtag(self,t):
        if t in ('script','style'): self.skip=max(0,self.skip-1)
        if t=='p' and self.buf is not None:
            text=''.join(self.buf).strip(); self.buf=None
            if len(text)>10: self.paras.append(text)
    def handle_data(self,s):
        if self.buf is not None and not self.skip: self.buf.append(s)

def clean_source(source):
    tree=html_tree.fromstring(source)
    # Illustrations may interrupt a paragraph and repeat the narrative as a caption.
    # Remove presentation blocks, preserving the author's surrounding text.
    for node in tree.xpath('//figure | //span[contains(@style,"page-break-inside:avoid") and .//img] | //sup[contains(@class,"reference")]'):
        if node.getparent() is not None: node.drop_tree()
    return html_tree.tostring(tree,encoding='unicode')

def fetch(page):
    url='https://fr.wikisource.org/wiki/'+urllib.parse.quote(page.replace(' ','_'),safe='/(),_')
    p=subprocess.run(['curl','-fLsS','--max-time','50',url],capture_output=True)
    if p.returncode: raise RuntimeError(p.stderr.decode())
    return url,p.stdout.decode()

def extract(spec):
    slug,title,author,death,audience,year,tags,page,incipit=spec
    url='https://fr.wikisource.org/wiki/'+urllib.parse.quote(page.replace(' ','_'),safe='/(),_')
    cached=Path('sources/'+slug+'.html')
    html=cached.read_text() if cached.exists() else fetch(page)[1]
    parser=Paragraphs(); parser.feed(clean_source(html))
    start=next(i for i,p in enumerate(parser.paras) if incipit in p)
    paras=parser.paras[start:]
    for i,p in enumerate(paras):
        if 'Ce texte est dans le domaine public' in p or 'La dernière modification' in p:
            paras=paras[:i]; break
    # Three spaced groups of complete paragraphs. Never split an oversized paragraph.
    policy=json.loads(Path(__file__).resolve().parents[1].joinpath('data/catalogue-policy.json').read_text())
    maximum=policy['maxPassageCharacters']; minimum=policy['minPassageCharacters']
    groups=[]; previous_end=0
    for n in range(policy['passagesPerWork']):
        low=max(previous_end,len(paras)*n//3); high=max(low+1,len(paras)*(n+1)//3)
        candidates=[]
        for i in range(low,min(high,len(paras))):
            j=i; text=''
            while j<len(paras):
                joined=text+('\n\n' if text else '')+paras[j]
                if len(joined.encode('utf-16-le'))//2>maximum: break
                text=joined;j+=1
                if len(text)>=maximum*0.6:break
            if minimum<=len(text.encode('utf-16-le'))//2<=maximum:
                candidates.append((abs(len(text)-maximum*0.75),i,j,text))
        if not candidates: raise ValueError(f'{title}: no complete paragraphs under {maximum} in selection {n+1}')
        _,i,j,text=min(candidates)
        groups.append({'id':slug+f'-p{n+1:02}','text':text,'startParagraph':start+i,'endParagraph':start+j-1,'source':url}); previous_end=j
    edition=re.search(r'"prpSourceIndexPage":"([^"]+)"',html)
    if not edition: raise ValueError(title+': missing edition scan')
    revision=re.search(r'"wgCurRevisionId":(\d+)',html).group(1)
    Path('sources/'+slug+'.html').write_text(html)
    return dict(id=slug,title=title,author=author,audience=audience,year=year,tags=tags,genre=tags[0],source=url,edition=edition.group(1),rights={'status':'pending-review','territory':'France','authorDeathYear':death,'basis':'Texte français original; auteur décédé depuis plus de 70 ans; édition historique antérieure à 1930.','authorSource':'https://fr.wikisource.org/wiki/Auteur:'+urllib.parse.quote(author.replace(' ','_')),'verifiedAt':__import__('datetime').datetime.now().date().isoformat()},sourceRevision=revision,passages=groups,text=groups[0]['text'])

SPECS=[
('gautier-roman-momie','Le Roman de la momie','Théophile Gautier',1872,'adult','1858',['roman historique','amour','étrange','voyage'],'Le_Roman_de_la_momie/Chapitre_7','Lorsque le jour parut'),
('nerval-main-enchantee','La Main enchantée','Gérard de Nerval',1855,'adult','1832',['nouvelle','fantastique','frisson','secret'],'Œuvres_complètes_de_Gérard_de_Nerval_-_Tome_V/La_Main_enchantée','Rien n’est beau'),
('daudet-lettres-moulin','Lettres de mon moulin','Alphonse Daudet',1897,'adult','1869',['récit','nature','amour','contemplatif'],'Lettres_de_mon_moulin/Les_étoiles','Du temps que je gardais'),
('flaubert-trois-contes','Trois contes','Gustave Flaubert',1880,'adult','1877',['nouvelle','famille','émotion','société'],'Trois_Contes_(Flaubert)/Un_Cœur_simple','Pendant un demi-siècle'),
('verne-cinq-semaines','Cinq Semaines en ballon','Jules Verne',1905,'child','1863',['aventure','exploration','science','voyage'],'Cinq_Semaines_en_ballon/Texte_entier','Il y avait une grande affluence'),
('verne-tour-monde','Le Tour du monde en quatre-vingts jours','Jules Verne',1905,'child','1873',['aventure','voyage','courage'],'Le_Tour_du_monde_en_quatre-vingts_jours/Texte_entier','En l’année 1872'),
('verne-voyage-centre','Voyage au centre de la Terre','Jules Verne',1905,'child','1864',['aventure','science','exploration'],'Voyage_au_centre_de_la_Terre/Texte_entier','Le 24 mai 1863'),
('perrault-riquet','Riquet à la houppe','Charles Perrault',1703,'child','1697',['conte','magie','royaume','merveilleux'],'Contes_de_Perrault_(éd._1902)/Riquet_à_la_Houppe','Il était une fois une reine'),
]
if __name__=='__main__':
    args=argparse.ArgumentParser()
    args.add_argument('--spec-file', help='JSON array of source specifications')
    options=args.parse_args()
    specs=json.loads(Path(options.spec_file).read_text()) if options.spec_file else SPECS
    Path('sources').mkdir(exist_ok=True)
    works=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        futures={pool.submit(extract,s):s[0] for s in specs}
        for f in concurrent.futures.as_completed(futures):
            try:
                w=f.result(); works.append(w); print(w['id'],w['edition'],[(len(p['text']),p['text'][:100]) for p in w['passages']],flush=True)
            except Exception as e: print('FAILED',futures[f],str(e),flush=True)
    Path(__file__).resolve().parents[1].joinpath('data/reading-catalog-candidates.json').write_text(json.dumps({'schemaVersion':1,'works':sorted(works,key=lambda w:w['id'])},ensure_ascii=False,indent=2)+'\n')
