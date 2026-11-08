import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const installed=path.resolve(process.argv[2]);
const text=fs.readFileSync(path.join(root,'docs/fund-aum.md'),'utf8').split('## v0.10 migration')[1];
const snippet=text.match(/```ts\n([\s\S]*?)\n```/)[1];
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'fund-migration-'));
try {
 const source=path.join(tmp,'example.mts');
 fs.writeFileSync(source,`import {Bharosa} from ${JSON.stringify(path.join(installed,'dist/index.mjs'))};\nasync function example(bharosa:Bharosa){\n${snippet}\n}\n`);
 const result=spawnSync(process.execPath,[path.join(root,'tooling/node_modules/typescript/bin/tsc'),'--strict','--noEmit','--target','ES2022','--module','NodeNext','--moduleResolution','NodeNext',source],{encoding:'utf8'});
 assert.equal(result.status,0,result.stdout+result.stderr);
 const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
 for (const scenario of ['empty-funds','empty-schemes','populated']) {
  const calls=[];
  const portfolio={holdings:async()=>{calls.push('holdings');return {data:[]};}};
  const fund={schemes:async()=>{calls.push('schemes');return {data:scenario==='populated'?[{id:'11'}]:[],has_more:false,next_cursor:null};},portfolio:async()=>{calls.push('portfolio');return portfolio;}};
  const client={mutualFunds:{search:async()=>{calls.push('search');return {data:scenario==='empty-funds'?[]:[{id:'7'}]};},retrieve:async id=>{assert.equal(id,'7');calls.push('retrieve-fund');return fund;}},mutualFundSchemes:{retrieve:async id=>{assert.equal(id,'11');calls.push('retrieve-scheme');return {fund:async()=>{calls.push('parent');return fund;},nav:async()=>{calls.push('nav');return {status:'missing',data:null};}};}}};
  await new AsyncFunction('bharosa',snippet)(client);
  assert.deepEqual(calls,scenario==='empty-funds'?['search']:scenario==='empty-schemes'?['search','retrieve-fund','schemes','portfolio','holdings']:['search','retrieve-fund','schemes','retrieve-scheme','parent','nav','portfolio','holdings']);
 }
 console.log('Exact migration example: installed declarations compile; empty funds, empty schemes and populated cases pass.');
} finally {fs.rmSync(tmp,{recursive:true,force:true});}
