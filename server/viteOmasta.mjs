import { createOmastaReply } from './omasta.mjs';
import { loadChurnArtifact, predictChurn, summariseModel } from './churnModel.mjs';
export function omastaPlugin(env,{reply=createOmastaReply}={}) {
  return {name:'omasta-local-api',configureServer(server){
    server.middlewares.use('/api/churn-model',async(req,res)=>{
      res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
      const respond=(status,data)=>{res.statusCode=status;res.end(JSON.stringify(data));};
      const host=(req.headers.host??'').split(':')[0];
      if(!['127.0.0.1','localhost'].includes(host))return respond(403,{error:'Churn prototype API is available on localhost only.'});
      if(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`)return respond(403,{error:'Use the same-origin preview to access the churn prototype.'});
      let artifact;try{artifact=await loadChurnArtifact(new URL('../ml/model/churn-prototype.json',import.meta.url));}catch{return respond(503,{error:'Model not trained. Run the local trainer first.'});}
      if(req.url==='/status'&&req.method==='GET')return respond(200,summariseModel(artifact));
      if((req.url==='/'||req.url==='')&&req.method==='POST'){let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>16000)return respond(413,{error:'Prediction input is too large.'});}try{const input=JSON.parse(body);return respond(200,predictChurn(artifact,input));}catch{return respond(400,{error:'Send one valid customer record as JSON.'});}}
      return respond(404,{error:'Unknown endpoint.'});
    });
    const requests=new Map();
    server.middlewares.use('/api/omasta',async(req,res)=>{
      res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
      const respond=(status,data)=>{res.statusCode=status;res.end(JSON.stringify(data));};
      const host=(req.headers.host??'').split(':')[0];
      if(!['127.0.0.1','localhost'].includes(host))return respond(403,{error:'OMASTA preview API is available on localhost only.'});
      if(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`)return respond(403,{error:'Use the same-origin preview to access OMASTA.'});
      if(req.url==='/status'&&req.method==='GET')return respond(200,{configured:Boolean(env.GEMINI_API_KEY),provider:'Gemini',model:env.GEMINI_MODEL||'gemini-3.8-flash'});
      if(req.url!=='/'&&req.url!=='')return respond(404,{error:'Unknown endpoint.'});
      if(req.method!=='POST')return respond(405,{error:'Use POST for OMASTA questions.'});
      const address=req.socket.remoteAddress??'local',now=Date.now(),recent=(requests.get(address)??[]).filter(t=>now-t<60000);
      if(recent.length>=12)return respond(429,{error:'Too many questions. Wait a minute and retry.'});
      requests.set(address,[...recent,now]);
      try {
        let body='';req.setTimeout(15000,()=>req.destroy());
        for await(const chunk of req){body+=chunk.toString();if(Buffer.byteLength(body)>32000)return respond(413,{error:'The request is too large. Send aggregate context only.'});}
        req.setTimeout(0);
        let input;try {input=JSON.parse(body);}catch {return respond(400,{error:'Invalid JSON request.'});}
        respond(200,await reply(input,{apiKey:env.GEMINI_API_KEY,model:env.GEMINI_MODEL,onError:diagnostic=>console.error('OMASTA provider status:',JSON.stringify(diagnostic))}));
      }catch(error){respond(error.status??500,{error:error.status?error.message:'OMASTA is unavailable. Please retry.'});}
    });
  }};
}
