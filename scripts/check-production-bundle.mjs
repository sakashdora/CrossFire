import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {parse} from 'dotenv';
const root=path.resolve('dist');
async function files(dir){return (await Promise.all((await readdir(dir,{withFileTypes:true})).map(item=>item.isDirectory()?files(path.join(dir,item.name)):path.join(dir,item.name)))).flat();}
const env=parse(await readFile('.env','utf8').catch(()=>''));
const secrets=Object.entries({...process.env,...env}).filter(([key,value])=>!key.startsWith('VITE_')&&/DIRECT_URL|DATABASE_URL|SERVICE_ROLE|SECRET|PASSWORD|ACCESS_TOKEN/.test(key)&&value?.length>=12).map(([,value])=>value);
const paths=await files(root);let textFiles=0;
for(const file of paths){
  if(/\.map$|(?:^|[\\/])\.env|schema\.sql$/i.test(file))throw new Error('Private build artifact found: '+path.relative(root,file));
  if(!/\.(?:html|js|css|json|txt)$/i.test(file))continue;
  const content=await readFile(file,'utf8');textFiles++;
  if(secrets.some(secret=>content.includes(secret))||/sb_secret_[A-Za-z0-9_-]+/.test(content))throw new Error('A server credential was detected in a public artifact. The value is intentionally not printed.');
  if(/CROSSFIRE-PREVIEW|fixture-only-password|crossfire_ops_preview_users/.test(content))throw new Error('Test-only data was detected in the bundle.');
}
console.log(`Checked ${textFiles} text artifacts: no source maps, environment files, SQL schema, known server secrets or test credentials found. Browser JavaScript remains inspectable.`);
