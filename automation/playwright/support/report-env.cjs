'use strict';
const path=require('node:path');
// Newer Playwright versions resolve JUnit names relative to the config file.
// The Squash provider collects it from the workspace's HTML report directory.
function configureSquashReports(env=process.env,cwd=process.cwd()){
 if(!env.PLAYWRIGHT_JUNIT_OUTPUT_FILE&&!env.PLAYWRIGHT_JUNIT_OUTPUT_DIR&&env.PLAYWRIGHT_JUNIT_OUTPUT_NAME&&env.PLAYWRIGHT_HTML_REPORT){
  env.PLAYWRIGHT_JUNIT_OUTPUT_FILE=path.resolve(cwd,env.PLAYWRIGHT_HTML_REPORT,env.PLAYWRIGHT_JUNIT_OUTPUT_NAME);
 }
 return env.PLAYWRIGHT_JUNIT_OUTPUT_FILE;
}
module.exports={configureSquashReports};
