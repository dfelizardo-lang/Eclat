const fs=require('node:fs');const path=require('node:path');const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');process.chdir(root);
execFileSync(process.execPath,[path.join(root,'scripts/fetch-narration.cjs')],{stdio:'inherit'});
const cap=path.join(root,'node_modules/@capacitor/cli/bin/capacitor');
if(!fs.existsSync('android'))execFileSync(process.execPath,[cap,'add','android'],{stdio:'inherit'});
execFileSync(process.execPath,[cap,'sync','android'],{stdio:'inherit'});
const manifest='android/app/src/main/AndroidManifest.xml';
let xml=fs.readFileSync(manifest,'utf8');
// Personal notebooks do not enter Android cloud backups. System intent handles camera.
xml=xml.replace('android:allowBackup="true"','android:allowBackup="false"');
if(!xml.includes('<queries>'))xml=xml.replace('</manifest>','<queries><intent><action android:name="android.media.action.IMAGE_CAPTURE" /></intent></queries></manifest>');
const res='android/app/src/main/res';
fs.mkdirSync(path.join(res,'drawable'),{recursive:true});
fs.copyFileSync('resources/icon.xml',path.join(res,'drawable/eclat_icon.xml'));
xml=xml.replace(/@mipmap\/ic_launcher_round/g,'@drawable/eclat_icon').replace(/@mipmap\/ic_launcher/g,'@drawable/eclat_icon');fs.writeFileSync(manifest,xml);
fs.chmodSync('android/gradlew',0o755);
