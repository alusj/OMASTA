import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitiseContext, createOmastaReply } from './omasta.mjs';
test('AI context excludes raw customers, credentials and arbitrary metadata', () => {
  const context=sanitiseContext({department:'B2C',source:'sample',summary:{count:12,observedChurnRate:25,usage:{day:{minutes:10,calls:3,charges:2}},phone:'secret'},customers:[{phone:'secret'}],apiKey:'secret'});
  assert.equal(context.summary.count,12);
  assert.ok(!JSON.stringify(context).includes('secret'));
});
test('missing key is clearly unavailable and does not fabricate an AI reply', async () => {
  await assert.rejects(()=>createOmastaReply({message:'Explain churn',context:{}},{apiKey:''}), /not configured/);
});
test('provider receives only aggregate context and key-free reply is returned', async () => {
  let captured;
  const result=await createOmastaReply({message:'Explain churn',context:{department:'B2C',summary:{count:10},customers:[{name:'PRIVATE'}]}},{apiKey:'test-only',generate:async args=>{captured=args;return {text:'Review support patterns.'};},modelFactory:()=> 'mock-model'});
  assert.equal(result.text,'Review support patterns.');
  assert.ok(!JSON.stringify(captured.prompt).includes('PRIVATE'));
  assert.ok(captured.instructions.includes('not a trained churn prediction'));
});
test('bad requests and provider failures are bounded and sanitised', async () => {
  await assert.rejects(()=>createOmastaReply({message:'x'.repeat(2001)},{apiKey:'test'}),/2000/);
  await assert.rejects(()=>createOmastaReply({message:'Hello'},{apiKey:'test',modelFactory:()=> 'mock',generate:async()=>{throw new Error('test secret provider details');}}), error=>!error.message.includes('secret'));
});
