import { useEffect, useRef, useState } from 'react';
import { Sparkles, Send, RefreshCw, ShieldCheck } from 'lucide-react';

function AnswerText({text}) {
  return text.split('\n').map((line,index)=>{
    const bullet=/^\s*[-*]\s/.test(line),content=line.replace(/^\s*[-*]\s/,'');
    return <div key={index} className={bullet?'answer-line answer-bullet':'answer-line'}>{bullet&&<span aria-hidden="true">•</span>}<span>{content.split(/(\*\*[^*]+\*\*)/g).map((part,i)=>part.startsWith('**')&&part.endsWith('**')?<strong key={i}>{part.slice(2,-2)}</strong>:part)}</span></div>;
  });
}
export default function OmastaAssistant({department,source,summary}) {
  const [status,setStatus]=useState({configured:false,loading:true}),[turns,setTurns]=useState([]),[question,setQuestion]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const request=useRef(null),scroll=useRef(null);
  useEffect(()=>{
    const controller=new AbortController();
    fetch('/api/omasta/status',{signal:controller.signal}).then(async response=>{if(!response.ok)throw new Error();return response.json();}).then(result=>setStatus({...result,loading:false})).catch(()=>{if(!controller.signal.aborted)setStatus({configured:false,loading:false});});
    return()=>{controller.abort();request.current?.abort();};
  },[]);
  useEffect(()=>{if(scroll.current)scroll.current.scrollTop=scroll.current.scrollHeight;},[turns,busy,error]);
  async function send(text=question) {
    if(busy||!status.configured||!text.trim())return;
    const message=text.trim();setError('');setBusy(true);setQuestion('');
    const history=turns.slice(-8);setTurns(previous=>[...previous,{role:'user',text:message}]);
    const controller=new AbortController();request.current=controller;
    try {
      const response=await fetch('/api/omasta',{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({message,history,context:{department,source,summary}})});
      let result;try{result=await response.json();}catch{throw new Error('OMASTA is unavailable. Run the local development server to connect Gemini.');}
      if(!response.ok)throw new Error(result.error||'OMASTA could not answer. Please retry.');
      setTurns(previous=>[...previous,{role:'assistant',text:result.text}]);
    }catch(err){if(!controller.signal.aborted)setError(err.message);}finally{if(!controller.signal.aborted)setBusy(false);}
  }
  return <section className="assistant omasta-assistant"><div className="assistant-heading"><span><Sparkles size={21}/></span><div><strong>OMASTA</strong><small><i className={status.configured?'connected':'disconnected'}/>{status.loading?'Checking Gemini…':status.configured?'Gemini ready':'Gemini unavailable'}</small></div><span className="assistant-beta">AI</span></div><div className="omasta-context"><span className="assistant-label">YOUR DATA, EXPLAINED</span><h3>From customer signals<br/>to meaningful action.</h3><p>{summary.count?`${summary.count.toLocaleString()} customer records · ${department}`:`No telecom records for ${department}`}</p><span className="omasta-data-tag">{source==='imported'?'Imported CSV':'Sample dataset'} · Aggregates only</span></div><div className="chat-transcript" ref={scroll} aria-live="polite" aria-label="OMASTA conversation">{!turns.length&&<div className="omasta-welcome"><p>Ask me to explain usage, compare plans or suggest where your team should follow up.</p><p>Review signals are rules, not churn predictions.</p></div>}{turns.map((turn,i)=><div key={i} className={`chat-turn ${turn.role}`}><small>{turn.role==='user'?'YOU':'OMASTA'}</small><div>{turn.role==="assistant"?<AnswerText text={turn.text}/>:turn.text}</div></div>)}{busy&&<div className="chat-thinking"><Sparkles size={13}/>OMASTA is analysing the summary…</div>}{error&&<div className="chat-error" role="alert">{error}<button onClick={()=>send(turns.filter(t=>t.role==='user').at(-1)?.text||'Summarise this dataset')} disabled={busy}><RefreshCw size={12}/>Retry</button></div>}</div>{!turns.length&&<div className="omasta-prompts"><button disabled={!status.configured||busy} onClick={()=>send('Summarise this customer dataset and its limits.')}>Summarise the dataset <Sparkles size={13}/></button><button disabled={!status.configured||busy} onClick={()=>send('What should our retention team review first, based on these aggregate signals?')}>Where should we focus? <Sparkles size={13}/></button></div>}<form className="assistant-input" onSubmit={e=>{e.preventDefault();send();}}><input aria-label="Ask OMASTA" placeholder={status.configured?'Ask OMASTA about your data…':'Gemini connection unavailable'} value={question} onChange={e=>setQuestion(e.target.value)} maxLength={2000} disabled={busy||!status.configured}/><button aria-label="Send to OMASTA" disabled={busy||!status.configured||!question.trim()}><Send size={17}/></button></form><div className="assistant-footer"><ShieldCheck size={10}/> Gemini receives aggregate metrics and your messages</div>{!status.loading&&!status.configured&&<p className="omasta-setup">Configure the server’s GEMINI_API_KEY and restart the local preview. Imported customer rows stay in your browser.</p>}</section>;
}
