import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Bharosa,BharosaMarket,ValidationError,InvalidResponseError} from '../dist/index.mjs';
import {createTransport} from '../dist/transport.cjs';
const contract=JSON.parse(fs.readFileSync(new URL('./market-search.openapi.json',import.meta.url),'utf8'));
const path='/v1/market-data/schemes/search';
const example=()=>structuredClone(contract.paths[path].get.responses['200'].content['application/json'].example);
const account='acct_0123456789abcdef0123456789abcdef';

test('market search uses canonical baseline route for simple, legacy, delegated and market-only clients',async()=>{
 let sent=0;
 const fetcher:typeof fetch=async(input,init)=>{sent++;const u=new URL(String(input));assert.equal(u.origin,'https://api.bharosa.finance');assert.equal(u.pathname,path);assert.equal(u.searchParams.get('query'),'  equity%_  ');assert.equal(u.searchParams.get('limit'),'5');assert.equal(init?.method,'GET');assert.equal(new Headers(init?.headers).get('Authorization'),'Bearer synthetic');assert.equal(new Headers(init?.headers).get('Bharosa-User-Authorization'),null);return Response.json(example());};
 const clients=[new Bharosa({apiKey:'synthetic',fetch:fetcher}).markets,new Bharosa({account,auth:{type:'account_key',apiKey:'synthetic'},fetch:fetcher}).markets,new Bharosa({account,auth:{type:'delegated_application',apiKey:'synthetic',userAccessToken:'synthetic-user'},fetch:fetcher}).markets,new BharosaMarket({apiKey:'synthetic',fetch:fetcher})];
 for(const client of clients){const result=await client.schemes.search({query:'  equity%_  ',limit:5});assert.equal(result.data[0]?.scheme_id,'101');assert.equal(result.data[0]?.instrument.id,'ins_markets_scheme_101');}
 assert.equal(sent,4);
});
test('market search rejects invalid and unsupported inputs without transport',async()=>{
 let sent=0;const client=new Bharosa({apiKey:'synthetic',fetch:async()=>{sent++;throw Error('unexpected transport');}});
 for(const query of [{query:''},{query:'a'},{query:'  '},{query:' a '},{query:'a'.repeat(101)},{query:'equity',limit:0},{query:'equity',limit:21},{query:'equity',limit:1.5},{query:'equity',asOf:'2026-10-01'},{query:'equity',startingAfter:'101'}])await assert.rejects(client.markets.schemes.search(query as never),ValidationError);
 assert.equal(sent,0);
});
test('market search preserves empty and truncated results without inventing cursor pagination',async()=>{
 for(const empty of [true,false]){
  const response=example();if(empty)response.data=[];response.has_more=!empty;
  const client=new Bharosa({apiKey:'synthetic',fetch:async(input)=>{assert.equal(new URL(String(input)).searchParams.has('limit'),false);return Response.json(response);}});
  const result=await client.markets.schemes.search({query:'equity'});assert.equal(result.has_more,!empty);assert.equal(result.data.length,empty?0:1);
 }
});
test('market search rejects malformed schemas, wrong routes and impossible bounded lists',async()=>{
 const bad=[{...example(),url:'/v1/accounts/me/mutual_funds'},{...example(),data:[],has_more:true},{...example(),data:Array(21).fill(example().data[0])},{...example(),data:[{scheme_id:'101'}]}];
 for(const response of bad){const client=new Bharosa({apiKey:'synthetic',fetch:async()=>Response.json(response)});await assert.rejects(client.markets.schemes.search({query:'equity',limit:20}),InvalidResponseError);}
});
test('market search preserves 401, 403 and quota 429 errors',async()=>{
 for(const status of [401,403,429]){const client=new Bharosa({apiKey:'synthetic',fetch:async()=>Response.json({error:{type:'permission_error',code:'synthetic_denial',message:'denied',param:null,request_id:'req_test'}},{status})});await assert.rejects(client.markets.schemes.search({query:'equity'}),{status});}
});
test('market search allowlist denies private methods; explicit scheme search uses baseline authentication',async()=>{
 let sent=0;const call=createTransport({apiKey:'synthetic',fetch:async()=>{sent++;return Response.json(example());}},true);
 await assert.rejects(call('retrieve_account'),{code:'market_only_operation'});await assert.rejects(call('search_funds',{query:'equity'}),{code:'market_only_operation'});assert.equal(sent,0);
 const client=new Bharosa({account,auth:{type:'delegated_application',apiKey:'synthetic',userAccessToken:'synthetic-user'},fetch:async(input,init)=>{assert.equal(new URL(String(input)).pathname,'/v1/market-data/schemes/search');assert.equal(new Headers(init?.headers).get('Bharosa-User-Authorization'),null);return Response.json({...example(),url:'/v1/market-data/schemes/search'});}});
 assert.equal((await client.mutualFundSchemes.search({query:'equity'})).data[0]?.scheme_id,'101');
});
test('market search respects cancellation before sending',async()=>{
 let sent=0;const client=new Bharosa({apiKey:'synthetic',fetch:async()=>{sent++;return Response.json(example());}});const controller=new AbortController();controller.abort();await assert.rejects(client.markets.schemes.search({query:'equity'},{signal:controller.signal}));assert.equal(sent,0);
});
