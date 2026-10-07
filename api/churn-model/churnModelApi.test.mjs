import test from 'node:test';
import assert from 'node:assert/strict';
import status from './status.js';
import predict from './predict.js';

function response(){return {code:0,body:null,setHeader(){},status(code){this.code=code;return this;},json(body){this.body=body;return this;}};}
test('public deployed status endpoint returns model metrics',async()=>{const res=response();await status({method:'GET'},res);assert.equal(res.code,200);assert.equal(res.body.metrics.holdoutRows,667);});
test('public deployed prediction endpoint validates method and returns a bounded score',async()=>{const blocked=response();await predict({method:'GET'},blocked);assert.equal(blocked.code,405);const res=response();await predict({method:'POST',body:{'Account length':128,State:'KS','Area code':'415'}},res);assert.equal(res.code,200);assert.ok(res.body.probability>=0&&res.body.probability<=1);});
