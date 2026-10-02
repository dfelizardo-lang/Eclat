const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const V73 = path.join(__dirname, "eclat_v73_deployable.html");
const { DAY, loadCatalog, createRotation } = require('./daily-themes');
const rotation = createRotation(loadCatalog(fs.readFileSync(V73, 'utf8')));
let dailyThemes = rotation();
function refreshThemes() {
  const next = rotation();
  if (next.period !== dailyThemes.period) {
    dailyThemes = next;
    console.log(`Éclat : propositions thématiques renouvelées (${next.period})`);
  }
  return dailyThemes;
}
function scheduleThemes() {
  refreshThemes();
  setTimeout(scheduleThemes, DAY - (Date.now() % DAY) + 10).unref();
}
scheduleThemes();
app.get('/api/propositions-thematiques', (req, res) => {
  res.set('Cache-Control', 'no-store').json(refreshThemes());
});
// Structured server-owned passages shared by the web reader and future mobile clients.
const readingCatalog = require('./reading-catalog');
app.get('/api/catalogue', (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600').json(readingCatalog);
});
app.get('/api/passages/:id', (req, res) => {
  for (const work of readingCatalog.works) {
    const passage = (work.passages || []).find(p => p.id === req.params.id);
    if (passage) return res.set('Cache-Control', 'public, max-age=3600').json({...passage, workId: work.id, title: work.title, author: work.author, audience: work.audience, edition: work.edition, rights: work.rights});
  }
  res.status(404).json({error: 'Extrait introuvable'});
});
app.get('/api/reading-catalog.js', (req, res) => {
  res.set('Cache-Control', 'no-cache').type('application/javascript').send('window.ECLAT_READING_CATALOG=' + JSON.stringify(readingCatalog).replace(/</g, '\\u003c') + ';');
});
const LIBRARIES_CSV = "https://www.data.gouv.fr/api/1/datasets/r/806a8aa1-952f-404d-9857-3f27b7c0ca86";
let libraryCache = { at: 0, rows: [] };

function norm(s="") { return String(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]/g,""); }
function parseCSV(text) {
  const firstLine = text.slice(0, text.indexOf("\n"));
  const sep = (firstLine.match(/;/g)||[]).length >= (firstLine.match(/,/g)||[]).length ? ";" : ",";
  const rows=[]; let row=[], field="", quoted=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(c==='"') { if(quoted && text[i+1]==='"'){field+='"';i++;} else quoted=!quoted; }
    else if(c===sep && !quoted){row.push(field);field="";}
    else if((c==='\n'||c==='\r') && !quoted){ if(c==='\r'&&text[i+1]==='\n') i++; row.push(field); field=""; if(row.some(v=>v!=="")) rows.push(row); row=[]; }
    else field+=c;
  }
  if(field||row.length){row.push(field);rows.push(row);}
  return rows;
}
function pick(obj, patterns){ const key=Object.keys(obj).find(k=>patterns.some(p=>p.test(norm(k)))); return key ? String(obj[key]||"").trim() : ""; }
async function getLibraries(){
  if(libraryCache.rows.length && Date.now()-libraryCache.at < 3600000) return libraryCache.rows;
  const r=await fetch(LIBRARIES_CSV,{headers:{"User-Agent":"Eclat/1.0"},signal:AbortSignal.timeout(20000)});
  if(!r.ok) throw new Error(`data.gouv.fr ${r.status}`);
  const matrix=parseCSV(await r.text());
  const headers=matrix.shift()||[];
  const rows=matrix.map(values=>Object.fromEntries(headers.map((h,i)=>[h,values[i]||""])));
  libraryCache={at:Date.now(),rows}; return rows;
}
app.get("/api/bibliotheques", async (req,res)=>{
  const cp=String(req.query.cp||"").replace(/\D/g,"").slice(0,5);
  if(!/^\d{5}$/.test(cp)) return res.status(400).json({error:"Entrez un code postal à 5 chiffres."});
  try{
    const rows=await getLibraries(); const seen=new Set(); const results=[];
    for(const r of rows){
      const postal=pick(r,[/^cp$/,/codepostal/,/postal/]).replace(/\D/g,"").slice(0,5); if(postal!==cp) continue;
      const item={name:pick(r,[/nom.*etablissement/,/nombibliotheque/,/^nom$/,/libelle/])||"Bibliothèque",address:pick(r,[/^adresse$/,/adresse1/,/adresse/]),postalCode:postal,city:pick(r,[/^commune$/,/ville/]),website:pick(r,[/siteinternet/,/siteweb/,/^url$/,/website/])};
      const key=norm(`${item.name}|${item.address}|${item.city}`); if(seen.has(key)) continue; seen.add(key); results.push(item);
    }
    res.set("Cache-Control","public, max-age=300"); res.json({postalCode:cp,count:results.length,results,source:"Ministère de la Culture / data.gouv.fr"});
  }catch(e){ console.error(e); res.status(502).json({error:"La recherche des bibliothèques est momentanément indisponible."}); }
});
const V1_PATCH = `<style>#eclat-version-v1{position:fixed;right:12px;bottom:8px;z-index:9999;font:600 11px/1 system-ui,sans-serif;letter-spacing:.04em;opacity:.38;pointer-events:none}</style><div id="eclat-version-v1" aria-label="Version 1.0">v1.0</div><script>(function(){function patch(){const i=document.getElementById('libraryPostal');if(i){i.value='';i.placeholder='Votre code postal';i.setAttribute('autocomplete','postal-code');i.setAttribute('inputmode','numeric');}}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',patch);else patch();})();<\/script>`;
function sendApp(req,res){fs.readFile(V73,"utf8",(err,html)=>{if(err)return res.status(500).send("Éclat indisponible");html=html.replace(/<\/head>/i,'<link rel="stylesheet" href="/accessible-contrast.css"></head>');const patch=V1_PATCH+'<script src="/daily-themes-client.js"></script><script src="/library-loans-client.js"></script>';const at=html.toLowerCase().lastIndexOf("</body>");res.type("html").send(at>=0?html.slice(0,at)+patch+html.slice(at):html+patch);});}
app.get(["/","/index.html"],sendApp); app.use(express.static(__dirname,{index:false})); app.use((req,res,next)=>{if(req.method==="GET"&&req.accepts("html"))return sendApp(req,res);next();}); app.listen(PORT,()=>console.log(`Éclat v1.0 disponible sur http://localhost:${PORT}`));
