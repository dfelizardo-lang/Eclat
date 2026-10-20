const cases=require('../squash-cases.json');
for(const group of ['implemented','partial','blocked','manual']){
 const selected=cases.filter(c=>c.status===group);console.log('\n'+group+' : '+selected.length);
 for(const c of selected)console.log(c.reference+' — '+c.name+(c.reason?' : '+c.reason:''));
}
console.log('\nLes scénarios codés attendent leur exécution Squash. Un scénario bloqué ou partiel ne doit pas être compté comme réussi.');
