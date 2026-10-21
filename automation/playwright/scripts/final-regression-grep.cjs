'use strict';
const selection=require('../final-regression-cases.json');
const refs=selection.references||[];
if(!refs.length)throw new Error('Sélection finale Squash vide.');
for(const ref of refs)if(!/^ECL-TC-\d{3}$/.test(ref))throw new Error('Référence Squash invalide : '+ref);
const numbers=refs.map(ref=>ref.slice(-3));
process.stdout.write('ECL-TC-('+numbers.join('|')+')');
