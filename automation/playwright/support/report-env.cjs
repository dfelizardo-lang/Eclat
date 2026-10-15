'use strict';
const path=require('node:path');
function configureSquashReports(env=process.env,cwd=process.cwd(),configDir){
 const fromSquash=configDir&&path.resolve(cwd,'Eclat/automation/playwright')===path.resolve(configDir);
 // The provider collects both reports from its workspace, while recent
 // Playwright versions otherwise resolve relative names from the config file.
 if(fromSquash&&!env.PLAYWRIGHT_HTML_OUTPUT_DIR&&!env.PLAYWRIGHT_HTML_REPORT)env.PLAYWRIGHT_HTML_OUTPUT_DIR=path.resolve(cwd,'playwright-report');
 if(!env.PLAYWRIGHT_JUNIT_OUTPUT_FILE&&!env.PLAYWRIGHT_JUNIT_OUTPUT_DIR){
  const name=env.PLAYWRIGHT_JUNIT_OUTPUT_NAME||(fromSquash?'pw_junit_report.xml':undefined);
  const htmlDir=env.PLAYWRIGHT_HTML_OUTPUT_DIR||env.PLAYWRIGHT_HTML_REPORT;
  if(name&&path.dirname(name)!=='.')env.PLAYWRIGHT_JUNIT_OUTPUT_FILE=path.resolve(cwd,name);
  else if(name&&htmlDir)env.PLAYWRIGHT_JUNIT_OUTPUT_FILE=path.resolve(cwd,htmlDir,name);
  else if(name&&fromSquash)env.PLAYWRIGHT_JUNIT_OUTPUT_FILE=path.resolve(cwd,'playwright-report',name);
 }
 return env.PLAYWRIGHT_JUNIT_OUTPUT_FILE;
}
module.exports={configureSquashReports};
