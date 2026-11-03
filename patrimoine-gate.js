const crypto=require('node:crypto');
const key=crypto.randomBytes(32),cookieName='eclat_salon';
const questions=[
 {text:'Une cassette audio mâchouillée… Quel outil de haute technologie sauvait la soirée ?',choices:['Un crayon à papier, avec un petit tour de poignet.','Un abonnement premium au nuage.','Une fourchette, en mode grille-pain.'],answer:0},
 {text:'Votre Tamagotchi des années 90 bipait en pleine réunion. Il réclamait plutôt…',choices:['Le mot de passe du Wi-Fi.','À manger et un peu d’attention, ce petit tyran.','Une mise à jour de son GPS.'],answer:1},
 {text:'Au vidéoclub, avant de rendre une VHS, le geste du parfait gentleman était de…',choices:['Lui offrir des fleurs.','La secouer pour remettre les scènes dans l’ordre.','La rembobiner : le prochain spectateur vous disait merci.'],answer:2}
];
function sign(data){const payload=Buffer.from(JSON.stringify(data)).toString('base64url');return payload+'.'+crypto.createHmac('sha256',key).update(payload).digest('base64url');}
function verify(token,type){try{const [p,s,...rest]=String(token||'').split('.');if(rest.length||!p||!s)return null;const expected=crypto.createHmac('sha256',key).update(p).digest();const actual=Buffer.from(s,'base64url');if(actual.length!==expected.length||!crypto.timingSafeEqual(actual,expected))return null;const data=JSON.parse(Buffer.from(p,'base64url'));return data.type===type&&data.exp>Date.now()?data:null;}catch{return null;}}
function allowed(req){const token=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName+'='));return !!verify(token?.slice(cookieName.length+1),'access');}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function gate(res,message='',questionIndex=crypto.randomInt(questions.length)){
 const q=questions[questionIndex],challenge=sign({type:'question',q:questionIndex,exp:Date.now()+600000});
 return res.set({'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow','Vary':'Cookie'}).type('html').send(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Le salon rétro — Éclat</title><link rel="stylesheet" href="/patrimoine.css"></head><body><header><a class="brand" href="/">ÉCLAT<span>.</span></a><a href="/">Retour à l’accueil</a></header><main class="retro-gate"><div class="eyebrow">ESPACE RÉSERVÉ AUX ADULTES</div><h1>Minute, papillon.<br><em>Le videur est resté en 1992.</em></h1><p class="intro">Avant d’ouvrir le salon, une petite question rétro. Pas besoin de ressortir votre coupe mulet.</p>${message?`<p class="gate-message" role="alert">${esc(message)}</p>`:''}<form action="/patrimoine-libertin/entrer" method="post"><input type="hidden" name="challenge" value="${challenge}"><fieldset><legend>${esc(q.text)}</legend>${q.choices.map((c,i)=>`<label class="retro-choice"><input type="radio" name="answer" value="${i}" required> <span>${esc(c)}</span></label>`).join('')}</fieldset><label class="retro-choice adult-confirm"><input type="checkbox" name="adult" value="yes" required><span>Je confirme avoir 18 ans ou plus et souhaite accéder à cet espace adulte.</span></label><button type="submit">Tenter ma chance et entrer</button></form><p class="source-note">Ce clin d’œil culturel ne vérifie pas l’âge. Aucun nom ni date de naissance ne sont demandés. L’accès est retenu pendant 12 heures dans ce navigateur.</p><a href="/">Je retourne aux grandes histoires</a></main></body></html>`);
}
function enter(req,res){
 res.set({'Cache-Control':'private, no-store','Vary':'Cookie'});
 if(req.headers.origin){try{if(new URL(req.headers.origin).host!==req.get('host'))return res.status(403).send('Origine refusée');}catch{return res.status(403).send('Origine refusée');}}
 const challenge=verify(req.body?.challenge,'question'),q=questions[challenge?.q];
 if(!q)return gate(res,'Le videur a perdu votre ticket. Une nouvelle question, et on recommence !');
 if(req.body?.adult!=='yes')return gate(res,'Ce salon est réservé aux adultes de 18 ans et plus.',challenge.q);
 if(req.body?.answer!==String(q.answer))return gate(res,'Raté ! Le modem fait encore « biiip ». Réessayez : le videur est patient.',challenge.q);
 const secure=req.secure||req.get('x-forwarded-proto')==='https';
 res.cookie(cookieName,sign({type:'access',exp:Date.now()+43200000}),{httpOnly:true,sameSite:'lax',secure,maxAge:43200000,path:'/'});
 return res.redirect(303,'/patrimoine-libertin');
}
function protectPage(handler){return (req,res)=>{res.set({'Cache-Control':'private, no-store','Vary':'Cookie','X-Robots-Tag':'noindex, nofollow'});return allowed(req)?handler(req,res):gate(res);};}
function protectApi(req,res,next){res.set({'Cache-Control':'private, no-store','Vary':'Cookie'});return allowed(req)?next():res.status(403).json({error:'Répondez à la question du salon adulte pour ouvrir cette collection.'});}
module.exports={protectPage,protectApi,enter};
