import {test} from "node:test";
import assert from "node:assert/strict";
import {Bharosa,ValidationError} from "../dist/index.mjs";
const account="acct_0123456789abcdef0123456789abcdef";
test("simple API key defaults origin and me; explicit account remains",async()=>{
 for(const selected of [undefined,account]){
  let called=0;const sdk=new Bharosa({apiKey:"synthetic",...(selected?{account:selected}:{}),fetch:async(input,init)=>{called++;assert.equal(String(input),`https://api.bharosa.finance/v1/accounts/${selected??"me"}`);assert.equal(new Headers(init?.headers).get("Authorization"),"Bearer synthetic");assert.equal(new Headers(init?.headers).get("Bharosa-User-Authorization"),null);assert.equal(init?.redirect,"error");return Response.json({id:account,object:"account",created:0,primary_investor:null});}});
  await sdk.accounts.retrieve();assert.equal(called,1);
 }
});
test("simple API key rejects ambiguous credential forms before sending",()=>{
 let sent=0;const base={apiKey:"synthetic",fetch:async()=>{sent++;throw Error("unexpected");}};
 for(const extra of [{auth:{type:"account_key",apiKey:"second"}},{transport:{send:async()=>Response.json({})}},{account:null},{apiKey:""},{unexpected:true}])assert.throws(()=>Reflect.construct(Bharosa,[{...base,...extra}]),ValidationError);
 assert.equal(sent,0);
});
test("simple key does not turn server scope denial into account access",async()=>{
 const sdk=new Bharosa({apiKey:"synthetic",fetch:async()=>Response.json({error:{type:"permission_error",code:"insufficient_scope",message:"denied",param:null,request_id:"req_synthetic"}},{status:403})});
 await assert.rejects(sdk.accounts.retrieve(),{status:403});
});

test("one key uses baseline monthly routes without account permissions or delegated token",async()=>{
 const calls:string[]=[];
 const fetcher:typeof fetch=async(input,init)=>{const u=new URL(String(input));calls.push(u.pathname);assert.equal(new Headers(init?.headers).get("Bharosa-User-Authorization"),null);assert.equal(new Headers(init?.headers).get("Authorization"),"Bearer synthetic");return Response.json({object:"market_snapshot",requested_date:"2026-10-01",observation_date:null,status:"missing",data:null});};
 for(const config of [{apiKey:"synthetic",fetch:fetcher},{account:"me",auth:{type:"account_key" as const,apiKey:"synthetic"},fetch:fetcher},{account:"me",auth:{type:"delegated_application" as const,apiKey:"synthetic",userAccessToken:"synthetic-user"},fetch:fetcher}]){
  const sdk=new Bharosa(config);await sdk.markets.schemes.nav("45139",{asOf:"2026-10-01"});
 }
 assert.deepEqual(calls,Array(3).fill("/v1/market-data/schemes/45139/navs"));
});

test("baseline latest NAV omits as_of and handles available or missing snapshots",async()=>{
 for(const available of [true,false]){
  const sdk=new Bharosa({apiKey:"synthetic",fetch:async(input)=>{assert.equal(String(input),"https://api.bharosa.finance/v1/market-data/schemes/45139/navs");return Response.json({object:"market_snapshot",requested_date:"2026-10-31",observation_date:available?"2026-10-30":null,status:available?"available":"missing",data:available?{id:"1",scheme_id:"45139",date:"2026-10-30",amount:"14.8174",currency:"INR"}:null});}});
  const result=await sdk.markets.schemes.nav("45139");assert.equal(result.status,available?"available":"missing");
 }
});
test("optional latest selection does not relax explicit monthly dates",async()=>{
 const sdk=new Bharosa({apiKey:"synthetic",fetch:async()=>{throw Error("must not send");}});
 await assert.rejects(sdk.markets.schemes.nav("45139",{asOf:"2026-10-02"}),ValidationError);
 await assert.rejects(sdk.marketSnapshots.schemes.nav("45139",{asOf:"2026-10-02"}),ValidationError);
});

test("account-scoped latest NAV follows the canonical optional-date contract",async()=>{
 const sdk=new Bharosa({apiKey:"synthetic",fetch:async(input)=>{assert.equal(String(input),"https://api.bharosa.finance/v1/accounts/me/market-data/schemes/45139/navs");return Response.json({object:"market_snapshot",requested_date:"2026-10-31",observation_date:null,status:"missing",data:null});}});
 assert.equal((await sdk.mutualFundSchemes.navs.retrieve("45139")).status,"missing");
});
