import {test} from 'node:test';
import assert from 'node:assert/strict';
import {omastaPlugin} from './viteOmasta.mjs';
async function request({method='POST',url='/',host='127.0.0.1:5173',origin,body='{"message":"Hello"}'}={}) {
  let middleware;const timeouts=[];
  omastaPlugin({GEMINI_API_KEY:'test-only'},{reply:async()=>({text:'Answer',provider:'Gemini'})}).configureServer({middlewares:{use:(path,handler)=>{assert.equal(path,'/api/omasta');middleware=handler;}}});
  const req={method,url,headers:{host,...(origin?{origin}:{})},socket:{remoteAddress:'127.0.0.1'},setTimeout:value=>timeouts.push(value),async *[Symbol.asyncIterator](){yield body;}};
  let result;const res={setHeader(){},statusCode:200,end:text=>{result={status:res.statusCode,body:JSON.parse(text)};}};
  await middleware(req,res);return {...result,timeouts};
}
test('provider processing is not interrupted by the request-body timeout',async()=>{
  const result=await request();
  assert.equal(result.status,200);
  assert.deepEqual(result.timeouts,[15000,0]);
});
test('local API rejects remote hosts, cross-origin requests and malformed JSON',async()=>{
  assert.equal((await request({host:'example.com'})).status,403);
  assert.equal((await request({origin:'https://example.com'})).status,403);
  assert.equal((await request({body:'bad'})).status,400);
  assert.equal((await request({body:'x'.repeat(32001)})).status,413);
});
test('status contains configuration state without the API key',async()=>{
  const result=await request({method:'GET',url:'/status'});
  assert.equal(result.status,200);
  assert.equal(result.body.configured,true);
  assert.ok(!JSON.stringify(result.body).includes('test-only'));
});
