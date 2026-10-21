const cases=require('../squash-cases.json');
const finalSelection=require('../final-regression-cases.json');
for(const group of ['implemented','partial','blocked','manual']){
 const selected=cases.filter(c=>c.status===group);console.log('\n'+group+' : '+selected.length);
 for(const c of selected)console.log(c.reference+' — '+c.name+(c.reason?' : '+c.reason:''));
}
console.log('\nrégression finale ciblée : '+finalSelection.references.length);
for(const ref of finalSelection.references){
 const c=cases.find(item=>item.reference===ref);
 if(!c)throw new Error('Référence finale absente de squash-cases.json : '+ref);
 console.log(ref+' — '+c.name);
}
console.log('\nLes scénarios codés attendent leur exécution Squash. Un scénario bloqué, partiel ou manuel ne doit pas être compté comme réussi.');
