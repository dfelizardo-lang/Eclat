#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {createRequire}=require('node:module');
function linkWorkspaceRunner(projectDir){
 const project=path.resolve(projectDir),repo=path.resolve(project,'../..'),workspace=path.dirname(repo);
 if(path.basename(repo)!=='Eclat')throw new Error('Le hook attend le checkout Squash nommé Eclat.');
 const target=path.join(project,'node_modules'),link=path.join(workspace,'node_modules');
 const projectRequire=createRequire(path.join(project,'package.json'));
 const expected=fs.realpathSync(projectRequire.resolve('playwright/package.json'));
 let created=false;
 try{fs.lstatSync(link);}catch(error){if(error.code!=='ENOENT')throw error;fs.symlinkSync(target,link,'dir');created=true;}
 try{
  const workspaceRequire=createRequire(path.join(workspace,'__eclat_runner__.cjs'));
  const actual=fs.realpathSync(workspaceRequire.resolve('playwright/package.json'));
  if(actual!==expected)throw new Error('Un autre Playwright est installé dans le workspace de l’agent. Aucun fichier existant n’a été remplacé. Utiliser un workspace neuf.');
  const testActual=fs.realpathSync(workspaceRequire.resolve('@playwright/test/package.json'));
  const testExpected=fs.realpathSync(projectRequire.resolve('@playwright/test/package.json'));
  if(testActual!==testExpected)throw new Error('Le lanceur et les tests utilisent deux installations distinctes de @playwright/test.');
  return {workspace,runner:actual,version:projectRequire('playwright/package.json').version};
 }catch(error){if(created)fs.unlinkSync(link);throw error;}
}
if(require.main===module){try{const result=linkWorkspaceRunner(path.resolve(__dirname,'..'));console.log('Lanceur Squash partagé avec le projet : Playwright '+result.version);}catch(error){console.error(error.message);process.exitCode=1;}}
module.exports={linkWorkspaceRunner};
