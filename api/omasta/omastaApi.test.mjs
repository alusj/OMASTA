import test from 'node:test';
import assert from 'node:assert/strict';
import status from './status.js';
import { createHandler } from './index.js';

function response(){return {code:0,body:null,setHeader(){},status(code){this.code=code;return this;},json(body){this.body=body;return this;}};}
const post=(body,headers={})=>({method:'POST',headers:{host:'omasta.vercel.app',...headers},body});
test('deployed status reports configuration without exposing the key',()=>{const res=response();status({method:'GET'},res);assert.equal(res.code,200);assert.equal(typeof res.body.configured,'boolean');assert.ok(!('apiKey' in res.body));});
test('deployed chat endpoint passes the server key and returns the reply',async()=>{let options;const handler=createHandler({env:{GEMINI_API_KEY:'test-only'},reply:async(input,o)=>{options=o;return {text:'Answer',provider:'Gemini'};}});const res=response();await handler(post({message:'Hi'},{origin:'https://omasta.vercel.app','x-forwarded-for':'10.0.0.1'}),res);assert.equal(res.code,200);assert.equal(res.body.text,'Answer');assert.equal(options.apiKey,'test-only');});
test('deployed chat endpoint rejects wrong method, cross-origin calls and surfaces bounded errors',async()=>{const handler=createHandler({env:{},reply:async()=>{throw Object.assign(new Error('Gemini is not configured.'),{status:503});}});const get=response();await handler({method:'GET',headers:{}},get);assert.equal(get.code,405);const cross=response();await handler(post({message:'Hi'},{origin:'https://evil.example'}),cross);assert.equal(cross.code,403);const res=response();await handler(post({message:'Hi'},{'x-forwarded-for':'10.0.0.2'}),res);assert.equal(res.code,503);assert.match(res.body.error,/not configured/);});
test('deployed chat endpoint rate limits a single address',async()=>{const handler=createHandler({env:{GEMINI_API_KEY:'k'},reply:async()=>({text:'ok'})});let last;for(let i=0;i<13;i++){last=response();await handler(post({message:'Hi'},{'x-forwarded-for':'10.0.0.3'}),last);}assert.equal(last.code,429);});
