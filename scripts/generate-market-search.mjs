import fs from 'node:fs';
import {createHash} from 'node:crypto';
const raw=fs.readFileSync(new URL('../test/market-search.openapi.json',import.meta.url));
const doc=JSON.parse(raw);
function expand(value, trail=[]){
 if(Array.isArray(value))return value.map(v=>expand(v,trail));
 if(value===null||typeof value!=='object')return value;
 if(value.$ref){
  const ref=value.$ref;
  if(!ref.startsWith('#/components/schemas/')||trail.includes(ref))throw Error('Unsupported or cyclic schema reference');
  const target=doc.components.schemas[ref.slice('#/components/schemas/'.length)];
  if(!target)throw Error('Missing schema reference');
  return expand(target,[...trail,ref]);
 }
 return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,expand(v,trail)]));
}
const operations={};
for(const [path,item] of Object.entries(doc.paths))for(const [method,op] of Object.entries(item)){
 const status=Object.keys(op.responses).find(k=>/^2\d\d$/.test(k));
 operations[op.operationId]={path,method:method.toUpperCase(),status:Number(status),marketData:true,readOnly:true,parameters:expand(op.parameters),response:expand(op.responses[status].content['application/json'].schema)};
}
const generated='"use strict";\n// Generated from the canonical market search contract; all references resolved locally.\nmodule.exports = '+JSON.stringify({operations},null,2)+';\n';
const files=[[new URL('../src/market-search.cjs',import.meta.url),generated],[new URL('../MARKET-SEARCH-CONTRACT-SHA256',import.meta.url),createHash('sha256').update(raw).digest('hex')+'\n']];
for(const [path,value] of files){if(process.argv.includes('--check')){if(fs.readFileSync(path,'utf8')!==value)throw Error('Market search contract drift');}else fs.writeFileSync(path,value);}
