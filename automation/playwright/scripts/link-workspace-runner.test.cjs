'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const {linkWorkspaceRunner}=require('./link-workspace-runner.cjs');
const root=path.resolve(__dirname,'../../..');
async function fixture(fn){
 const tmp=await fs.mkdtemp(path.join(process.env.TMPDIR||require('node:os').tmpdir(),'eclat-runner-'));
 const project=path.join(tmp,'Eclat/automation/playwright');
 try{
  await fs.cp(path.join(root,'automation/playwright'),project,{recursive:true,filter:source=>!['node_modules','playwright-report','test-results','devices-report'].includes(path.basename(source))});
  await fs.symlink(path.join(root,'automation/playwright/node_modules'),path.join(project,'node_modules'),'dir');
  await fn(tmp,project);
 }finally{await fs.rm(tmp,{recursive:true,force:true});}
}
test('the Squash parent-directory npx runner discovers the selected test',()=>fixture(async(workspace,project)=>{
 const result=linkWorkspaceRunner(project);assert.equal(result.version,require('../package.json').devDependencies['@playwright/test']);
 assert.deepEqual(linkWorkspaceRunner(project),result);
 const cli=path.join(workspace,'node_modules/playwright/cli.js');
 const run=spawnSync('npx',['--no-install','playwright','test','Eclat/automation/playwright/tests/accueil.spec.js','--config=Eclat/automation/playwright/playwright.config.js','--grep=ECL-TC-001','--list'],{cwd:workspace,encoding:'utf8',timeout:30000,env:{...process.env,npm_config_offline:'true',npm_config_cache:path.join(workspace,'npm-cache')}});
 assert.equal(run.status,0,run.stdout+run.stderr);assert.match(run.stdout,/ECL-TC-001/);assert.match(run.stdout,/Total: 1 test in 1 file/);
 const all=spawnSync(process.execPath,[cli,'test','--config=Eclat/automation/playwright/playwright.config.js','--list'],{cwd:workspace,encoding:'utf8',timeout:30000});
 assert.equal(all.status,0,all.stdout+all.stderr);assert.match(all.stdout,/Total: 99 tests in 4 files/);
}));
test('a foreign workspace runner is refused without overwriting its files',()=>fixture(async(workspace,project)=>{
 const dir=path.join(workspace,'node_modules/playwright');await fs.mkdir(dir,{recursive:true});const file=path.join(dir,'package.json');const content='{"name":"playwright","version":"0.0.0"}';await fs.writeFile(file,content);
 assert.throws(()=>linkWorkspaceRunner(project),/autre Playwright/);assert.equal(await fs.readFile(file,'utf8'),content);
}));
test('the provider receives JUnit at the expected workspace report path',()=>fixture(async(workspace,project)=>{
 linkWorkspaceRunner(project);
 await fs.writeFile(path.join(project,'tests/report-probe.spec.js'),"const {test,expect}=require('@playwright/test');test('REPORT-PROBE',()=>expect(1).toBe(1));\n");
 const env={...process.env,PLAYWRIGHT_JUNIT_OUTPUT_NAME:'pw_junit_report.xml',PLAYWRIGHT_HTML_REPORT:'playwright-report',PW_TEST_HTML_REPORT_OPEN:'never',PLAYWRIGHT_HTML_OPEN:'never'};
 delete env.PLAYWRIGHT_JUNIT_OUTPUT_FILE;delete env.PLAYWRIGHT_JUNIT_OUTPUT_DIR;
 const run=spawnSync(process.execPath,[path.join(workspace,'node_modules/playwright/cli.js'),'test','--config=Eclat/automation/playwright/playwright.config.js','--grep=REPORT-PROBE','--reporter=html,junit'],{cwd:workspace,encoding:'utf8',timeout:30000,env});
 assert.equal(run.status,0,run.stdout+run.stderr);
 const xml=await fs.readFile(path.join(workspace,'playwright-report/pw_junit_report.xml'),'utf8');
 assert.match(xml,/REPORT-PROBE/);assert.match(xml,/failures="0"/);
}));
test('an explicit JUnit output destination is preserved',()=>{
 const {configureSquashReports}=require('../support/report-env.cjs');
 const a={PLAYWRIGHT_JUNIT_OUTPUT_FILE:'/custom/report.xml',PLAYWRIGHT_JUNIT_OUTPUT_NAME:'pw.xml',PLAYWRIGHT_HTML_REPORT:'html'};
 configureSquashReports(a,'/workspace');assert.equal(a.PLAYWRIGHT_JUNIT_OUTPUT_FILE,'/custom/report.xml');
 const b={PLAYWRIGHT_JUNIT_OUTPUT_DIR:'/custom',PLAYWRIGHT_JUNIT_OUTPUT_NAME:'pw.xml',PLAYWRIGHT_HTML_REPORT:'html'};
 configureSquashReports(b,'/workspace');assert.equal(b.PLAYWRIGHT_JUNIT_OUTPUT_FILE,undefined);
});
test('Squash report layouts work with modern, filename-only and absent provider variables',()=>fixture(async(workspace,project)=>{
 linkWorkspaceRunner(project);
 await fs.writeFile(path.join(project,'tests/report-probe.spec.js'),"const {test}=require('@playwright/test');test('REPORT-PROBE',()=>{});\n");
 for(const variant of [
  {PLAYWRIGHT_JUNIT_OUTPUT_NAME:'playwright-report/pw_junit_report.xml',PLAYWRIGHT_HTML_OUTPUT_DIR:'playwright-report'},
  {PLAYWRIGHT_JUNIT_OUTPUT_NAME:'pw_junit_report.xml'},
  {}
 ]){
  await fs.rm(path.join(workspace,'playwright-report'),{recursive:true,force:true});
  const env={...process.env,PLAYWRIGHT_HTML_OPEN:'never'};
  for(const key of ['PLAYWRIGHT_HTML_REPORT','PLAYWRIGHT_HTML_OUTPUT_DIR','PLAYWRIGHT_JUNIT_OUTPUT_NAME','PLAYWRIGHT_JUNIT_OUTPUT_FILE','PLAYWRIGHT_JUNIT_OUTPUT_DIR'])delete env[key];
  Object.assign(env,variant);
  const run=spawnSync(process.execPath,[path.join(workspace,'node_modules/playwright/cli.js'),'test','--config=Eclat/automation/playwright/playwright.config.js','--grep=REPORT-PROBE','--reporter=html,junit'],{cwd:workspace,encoding:'utf8',timeout:30000,env});
  assert.equal(run.status,0,run.stdout+run.stderr);
  assert.match(await fs.readFile(path.join(workspace,'playwright-report/pw_junit_report.xml'),'utf8'),/REPORT-PROBE/);
  assert.ok((await fs.stat(path.join(workspace,'playwright-report/index.html'))).size>0);
 }
}));
