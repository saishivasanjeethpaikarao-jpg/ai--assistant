import { useState, useRef, useEffect, useCallback } from 'react';
import {
  FiCode, FiPlay, FiMic, FiMicOff, FiZap, FiTerminal,
  FiCopy, FiCheck, FiLoader, FiAlertCircle, FiEye, FiRefreshCw,
  FiMonitor, FiMessageSquare, FiSend, FiTool, FiPackage, FiChevronDown,
} from 'react-icons/fi';

const SpeechRecognitionAPI =
  typeof window !== 'undefined' &&
  (window.SpeechRecognition || window.webkitSpeechRecognition);

const AGENT_COLORS = {
  frontend:   '#a78bfa',
  backend:    '#34d399',
  trading:    '#fbbf24',
  automation: '#f87171',
  data:       '#38bdf8',
  debug:      '#fb923c',
};

const DEFAULT_AGENTS = [
  { id:'frontend',   name:'FrontendAgent',   emoji:'🎨', label:'Frontend',   color:'#a78bfa', desc:'React, HTML, CSS, UI/UX, animations', example:'A responsive navbar with logo and mobile hamburger menu' },
  { id:'backend',    name:'BackendAgent',     emoji:'⚙️', label:'Backend',    color:'#34d399', desc:'Python, FastAPI, APIs, databases',    example:'A Python function to send emails with attachments' },
  { id:'trading',    name:'TradingAgent',     emoji:'📈', label:'Trading',    color:'#fbbf24', desc:'NSE/BSE stocks, yfinance, pandas',    example:'NIFTY 50 RSI indicator and buy/sell signals' },
  { id:'automation', name:'AutomationAgent',  emoji:'🤖', label:'Automation', color:'#f87171', desc:'Windows automation, pyautogui, files', example:'Auto-rename all files in a folder by date' },
  { id:'data',       name:'DataAgent',        emoji:'📊', label:'Data',       color:'#38bdf8', desc:'Pandas, plotly, CSV, visualization',  example:'Plot sales data from CSV with bar and line charts' },
  { id:'debug',      name:'DebugAgent',       emoji:'🔍', label:'Debug',      color:'#fb923c', desc:'Find & fix bugs, code review',        example:'Review this code and fix all the bugs: [paste]' },
];

// ── Language detection ──────────────────────────────────────────────────────

function detectLanguage(raw) {
  if (!raw) return 'unknown';
  const m = raw.match(/^```(\w+)/m);
  if (m) {
    const lang = m[1].toLowerCase();
    if (['html','htm'].includes(lang)) return 'html';
    if (['jsx','tsx','react'].includes(lang)) return 'react';
    if (['js','javascript','ts','typescript'].includes(lang)) return 'javascript';
    if (lang === 'css') return 'css';
    if (['python','py'].includes(lang)) return 'python';
    return lang;
  }
  const c = raw.trim();
  if (c.startsWith('<!DOCTYPE') || c.startsWith('<html')) return 'html';
  if (/import React|from 'react'|from "react"/.test(c)) return 'react';
  if (/<[A-Z][a-zA-Z]+/.test(c) && /return\s*\(/.test(c)) return 'react';
  return 'unknown';
}

function canPreview(lang) {
  return ['html','react','javascript','css','python'].includes(lang);
}

function buildPreviewHtml(code, lang) {
  const base = `body{margin:0;padding:16px;background:#0f0f0f;color:#e8e8e8;font-family:system-ui,sans-serif}*{box-sizing:border-box}::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:#1a1a1a}::-webkit-scrollbar-thumb{background:#3a3a3a;border-radius:3px}`;
  if (lang==='html') {
    if (code.trim().startsWith('<!DOCTYPE') || code.trim().startsWith('<html')) return code;
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${base}</style></head><body>${code}</body></html>`;
  }
  if (lang==='react') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<script src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<style>${base}#__err{padding:12px 16px;background:#1a0a0a;border:1px solid #4a1a1a;border-radius:6px;color:#f87171;font-size:12px;font-family:monospace;white-space:pre-wrap;margin:16px}</style>
</head><body><div id="root"></div>
<script type="text/babel" data-presets="react">
${code}
;(function(){
  const root=document.getElementById('root');
  const names=['App','Dashboard','Home','Main','Page','Component','Layout','UI','Widget'];
  let Comp=null;
  for(const n of names){try{if(typeof eval(n)!=='undefined'){Comp=eval(n);break;}}catch(e){}}
  if(!Comp){const fns=Object.keys(window).filter(k=>/^[A-Z]/.test(k)&&typeof window[k]==='function');if(fns.length)Comp=window[fns[0]];}
  try{if(Comp)ReactDOM.createRoot(root).render(React.createElement(Comp));
  else root.innerHTML='<div id="__err">No mountable component found. Name your component App, Dashboard, etc.</div>';}
  catch(e){root.innerHTML='<div id="__err">Render error: '+e.message+'</div>';}
})();
</script></body></html>`;
  }
  if (lang==='javascript') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${base}#out{font-family:monospace;font-size:12px;line-height:1.6;white-space:pre-wrap}.err{color:#f87171}.log{color:#abb2bf}</style></head><body>
<div id="out"></div><script>
const out=document.getElementById('out');const _l=console.log;
console.log=(...a)=>{out.innerHTML+='<span class="log">'+a.map(x=>typeof x==='object'?JSON.stringify(x,null,2):String(x)).join(' ')+'\\n</span>';_l(...a);};
console.error=(...a)=>{out.innerHTML+='<span class="err">ERROR: '+a.join(' ')+'\\n</span>';};
try{${code}}catch(e){out.innerHTML+='<span class="err">Error: '+e.message+'</span>';}
</script></body></html>`;
  }
  if (lang==='css') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${base}${code}</style></head><body>
<div class="container"><div class="card"><h1 class="title">Preview</h1><p class="text">Sample content to preview your CSS.</p><button class="btn">Button</button></div>
<nav class="nav"><a class="nav-link" href="#">Home</a><a class="nav-link" href="#">About</a></nav>
<div class="grid"><div class="item">Item 1</div><div class="item">Item 2</div><div class="item">Item 3</div></div></div>
</body></html>`;
  }
  return null;
}

// ── Syntax highlighter ──────────────────────────────────────────────────────

function highlightCode(code) {
  if (!code) return '';
  const esc = code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return esc
    .replace(/("""[\s\S]*?"""|'''[\s\S]*?''')/g,'<span style="color:#98c379">$1</span>')
    .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,'<span style="color:#98c379">$1</span>')
    .replace(/(#[^\n]*)/g,'<span style="color:#5c6370;font-style:italic">$1</span>')
    .replace(/(\/\/[^\n]*)/g,'<span style="color:#5c6370;font-style:italic">$1</span>')
    .replace(/\b(\d+\.?\d*)\b/g,'<span style="color:#d19a66">$1</span>')
    .replace(/\b(import|from|def|class|return|if|elif|else|for|while|in|not|and|or|True|False|None|try|except|finally|with|as|pass|break|continue|raise|yield|async|await|lambda|global|nonlocal|del|assert|is)\b/g,'<span style="color:#c678dd">$1</span>')
    .replace(/\b(const|let|var|function|export|default|import|from|return|if|else|for|while|in|of|new|this|typeof|instanceof|async|await|try|catch|finally|throw|class|extends|super|static|get|set)\b/g,'<span style="color:#c678dd">$1</span>')
    .replace(/(@\w+)/g,'<span style="color:#e06c75">$1</span>')
    .replace(/\b(print|len|range|str|int|float|list|dict|set|tuple|bool|type|input|open|enumerate|zip|map|filter|sorted|sum|min|max|abs|round|isinstance|hasattr|getattr|setattr)\b/g,'<span style="color:#56b6c2">$1</span>')
    .replace(/(&lt;\/?[A-Z][a-zA-Z]*)/g,'<span style="color:#e06c75">$1</span>')
    .replace(/\b([a-zA-Z_]\w*)\s*(?=\()/g,'<span style="color:#61afef">$1</span>');
}

// ── Sub-components ──────────────────────────────────────────────────────────

const AgentPill = ({ agent, active, onClick }) => {
  const [hov, setHov] = useState(false);
  const color = AGENT_COLORS[agent.id] || '#3b82f6';
  return (
    <button onClick={()=>onClick(agent.id)}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      title={agent.desc}
      style={{
        display:'flex', alignItems:'center', gap:'5px', padding:'5px 10px',
        borderRadius:'20px', whiteSpace:'nowrap', flexShrink:0,
        backgroundColor: active?color+'22':hov?'#1a1a1a':'transparent',
        border:`1px solid ${active?color:hov?'#2a2a2a':'#1e1e1e'}`,
        color: active?color:hov?'#aaa':'#606060',
        fontSize:'12px', fontWeight:active?'600':'400',
        cursor:'pointer', transition:'all 0.15s',
      }}>
      <span>{agent.emoji}</span><span>{agent.label}</span>
    </button>
  );
};

const CopyBtn = ({ text }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={()=>{navigator.clipboard.writeText(text).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),1500);});}}
      title="Copy code"
      style={{
        display:'flex', alignItems:'center', gap:'4px', padding:'3px 8px',
        borderRadius:'4px', fontSize:'11px', cursor:'pointer', transition:'all 0.15s',
        backgroundColor:copied?'#0a2a1a':'transparent',
        border:`1px solid ${copied?'#10b98166':'#2a2a2a'}`,
        color:copied?'#10b981':'#5a5a5a',
      }}>
      {copied?<FiCheck size={11}/>:<FiCopy size={11}/>}
      {copied?'Copied':'Copy'}
    </button>
  );
};

const TabBtn = ({ active, onClick, children }) => (
  <button onClick={onClick} style={{
    display:'flex', alignItems:'center', gap:'5px',
    padding:'0 14px', height:'100%', border:'none',
    borderBottom:active?'2px solid #a78bfa':'2px solid transparent',
    backgroundColor:'transparent', color:active?'#e8e8e8':'#5a5a5a',
    fontSize:'12px', cursor:'pointer', transition:'all 0.15s', fontWeight:active?'500':'400',
  }}>{children}</button>
);

// ── Live Preview iframe ─────────────────────────────────────────────────────

const LivePreview = ({ html, lang, onRefresh }) => {
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState(0);
  if (!html) return (
    <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'12px',backgroundColor:'#0d0d0d'}}>
      <FiMonitor size={32} style={{color:'#2a2a2a'}}/>
      <div style={{fontSize:'13px',color:'#4a4a4a'}}>No visual preview for {lang}</div>
    </div>
  );
  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',position:'relative',backgroundColor:'#0d0d0d'}}>
      <div style={{height:'30px',backgroundColor:'#0f0f0f',borderBottom:'1px solid #1a1a1a',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 12px',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
          <div style={{width:'8px',height:'8px',borderRadius:'50%',backgroundColor:'#f87171'}}/>
          <div style={{width:'8px',height:'8px',borderRadius:'50%',backgroundColor:'#fbbf24'}}/>
          <div style={{width:'8px',height:'8px',borderRadius:'50%',backgroundColor:'#34d399'}}/>
          <span style={{fontSize:'11px',color:'#3a3a3a',marginLeft:'6px'}}>Live Preview</span>
          {lang==='react'&&<span style={{fontSize:'10px',padding:'1px 6px',borderRadius:'10px',backgroundColor:'#1a0f2a',border:'1px solid #a78bfa33',color:'#a78bfa'}}>React + Babel</span>}
        </div>
        <button onClick={()=>{setKey(k=>k+1);setLoading(true);onRefresh?.();}} style={{display:'flex',alignItems:'center',gap:'4px',padding:'2px 8px',borderRadius:'4px',fontSize:'11px',backgroundColor:'transparent',border:'1px solid #2a2a2a',color:'#5a5a5a',cursor:'pointer'}}
          onMouseEnter={e=>{e.currentTarget.style.color='#aaa';e.currentTarget.style.borderColor='#3a3a3a';}}
          onMouseLeave={e=>{e.currentTarget.style.color='#5a5a5a';e.currentTarget.style.borderColor='#2a2a2a';}}>
          <FiRefreshCw size={10}/> Refresh
        </button>
      </div>
      {loading&&<div style={{position:'absolute',top:'30px',left:0,right:0,bottom:0,display:'flex',alignItems:'center',justifyContent:'center',backgroundColor:'#0d0d0d',zIndex:1}}>
        <div style={{display:'flex',gap:'6px'}}>{[0,0.15,0.3].map((d,i)=><div key={i} style={{width:'6px',height:'6px',borderRadius:'50%',backgroundColor:'#a78bfa',animation:`pulse 1.2s ease-in-out ${d}s infinite`}}/>)}</div>
      </div>}
      <iframe key={key} srcDoc={html} sandbox="allow-scripts allow-modals" title="Live Preview" onLoad={()=>setLoading(false)}
        style={{flex:1,border:'none',width:'100%',backgroundColor:'#0f0f0f',opacity:loading?0:1,transition:'opacity 0.2s'}}/>
    </div>
  );
};

// ── Python Terminal Preview ─────────────────────────────────────────────────

const PythonPreview = ({ code, runTrigger, onError }) => {
  const [output, setOutput] = useState('');
  const [errOut, setErrOut] = useState('');
  const [running, setRunning] = useState(false);
  const [success, setSuccess] = useState(null);
  const [ms, setMs] = useState(null);
  const [ran, setRan] = useState(false);
  const outRef = useRef(null);

  const run = useCallback(async () => {
    if (running||!code) return;
    setRunning(true); setOutput(''); setErrOut(''); setSuccess(null); setMs(null);
    try {
      const r = await fetch('/api/vibe/run', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({code,language:'python'}) });
      const d = await r.json();
      setOutput(d.output||''); setErrOut(d.error||''); setSuccess(d.success); setMs(d.runtime_ms);
      if (!d.success && d.error && onError) onError(d.error);
    } catch(e) { setErrOut('Failed to run: '+e.message); setSuccess(false); }
    finally { setRunning(false); setRan(true); }
  }, [code, running, onError]);

  useEffect(()=>{run();},[runTrigger]);
  useEffect(()=>{ if(outRef.current) outRef.current.scrollTop=outRef.current.scrollHeight; },[output,errOut]);

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',backgroundColor:'#0d0d0d',overflow:'hidden'}}>
      <div style={{flex:1,display:'flex',flexDirection:'column',margin:'16px',borderRadius:'10px',overflow:'hidden',border:'1px solid #2a2a2a',boxShadow:'0 8px 32px rgba(0,0,0,0.5)'}}>
        <div style={{height:'34px',backgroundColor:'#1a1a1a',borderBottom:'1px solid #2a2a2a',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 12px',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:'7px'}}>
            <div style={{width:'11px',height:'11px',borderRadius:'50%',backgroundColor:'#f87171'}}/>
            <div style={{width:'11px',height:'11px',borderRadius:'50%',backgroundColor:'#fbbf24'}}/>
            <div style={{width:'11px',height:'11px',borderRadius:'50%',backgroundColor:'#34d399'}}/>
          </div>
          <span style={{fontSize:'12px',color:'#5a5a5a',fontFamily:'monospace'}}>python — script.py</span>
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            {ms!==null&&<span style={{fontSize:'10px',color:'#3a3a3a'}}>{ms}ms</span>}
            {success!==null&&<span style={{fontSize:'10px',padding:'1px 7px',borderRadius:'10px',backgroundColor:success?'#0a2a1a':'#2a0a0a',border:`1px solid ${success?'#10b98133':'#f8717133'}`,color:success?'#10b981':'#f87171'}}>{success?'✓ exit 0':'✗ exit 1'}</span>}
            <button onClick={run} disabled={running} style={{display:'flex',alignItems:'center',gap:'4px',padding:'2px 8px',borderRadius:'4px',fontSize:'11px',cursor:running?'not-allowed':'pointer',backgroundColor:'transparent',border:`1px solid ${running?'#2a2a2a':'#34d39966'}`,color:running?'#3a3a3a':'#34d399'}}>
              {running?<FiLoader size={10} style={{animation:'spin 1s linear infinite'}}/>:<FiPlay size={10}/>}
              {running?'Running...':'Re-run'}
            </button>
          </div>
        </div>
        <div ref={outRef} style={{flex:1,overflowY:'auto',overflowX:'auto',backgroundColor:'#0a0a0a',padding:'14px 16px',fontFamily:"'Geist Mono','Cascadia Code','Fira Code',monospace",fontSize:'13px',lineHeight:'1.7'}}>
          <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'6px',flexShrink:0}}>
            <span style={{color:'#34d399',fontWeight:'600'}}>➜</span>
            <span style={{color:'#a78bfa'}}>~/workspace</span>
            <span style={{color:'#e8e8e8'}}>python script.py</span>
          </div>
          {running&&<div style={{display:'flex',alignItems:'center',gap:'8px',color:'#5a5a5a'}}><FiLoader size={12} style={{animation:'spin 1s linear infinite',color:'#a78bfa'}}/><span style={{fontSize:'12px'}}>Executing...</span></div>}
          {!running&&!ran&&<div style={{color:'#3a3a3a',fontSize:'12px'}}>Starting Python runtime...</div>}
          {ran&&!output&&!errOut&&<div style={{color:'#5a5a5a',fontSize:'12px'}}>(no output)</div>}
          {output&&<pre style={{margin:0,whiteSpace:'pre-wrap',wordBreak:'break-word',color:'#a8cc8c',lineHeight:'1.7'}}>{output}</pre>}
          {errOut&&<><div style={{height:output?'8px':0}}/><pre style={{margin:0,whiteSpace:'pre-wrap',wordBreak:'break-word',color:'#f87171',lineHeight:'1.7'}}>{errOut}</pre></>}
          {!running&&ran&&<div style={{display:'flex',alignItems:'center',gap:'8px',marginTop:'6px'}}>
            <span style={{color:'#34d399',fontWeight:'600'}}>➜</span>
            <span style={{color:'#a78bfa'}}>~/workspace</span>
            <span style={{display:'inline-block',width:'8px',height:'15px',backgroundColor:'#e8e8e8',marginLeft:'2px',animation:'blink 1.1s step-end infinite'}}/>
          </div>}
        </div>
      </div>
    </div>
  );
};

// ── Main component ──────────────────────────────────────────────────────────

const VibeCoder = ({ initialPrompt = '', isMobile = false, isTablet = false }) => {
  const [agents, setAgents] = useState(DEFAULT_AGENTS);
  const [selectedAgent, setSelectedAgent] = useState('auto');
  const [prompt, setPrompt] = useState(initialPrompt);
  const [isBuilding, setIsBuilding] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [result, setResult] = useState(null);
  const [terminalOutput, setTerminalOutput] = useState(null);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('code');
  const [previewKey, setPreviewKey] = useState(0);
  const [runTrigger, setRunTrigger] = useState(0);
  const [autoDetect, setAutoDetect] = useState(null); // { agent_id, agent_name, agent_emoji, confidence }
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [lastRunError, setLastRunError] = useState('');
  const [depsOpen, setDepsOpen] = useState(false);
  const textareaRef = useRef(null);
  const recRef = useRef(null);
  const detectTimerRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(()=>{
    fetch('/api/vibe/agents').then(r=>r.json()).then(d=>{if(d.agents)setAgents(d.agents);}).catch(()=>{});
  },[]);

  useEffect(()=>{ if(initialPrompt){setPrompt(initialPrompt);autoResize();} },[initialPrompt]);

  useEffect(()=>{ chatEndRef.current?.scrollIntoView({behavior:'smooth'}); },[chatMessages]);

  // Debounced auto-detection as user types
  useEffect(()=>{
    clearTimeout(detectTimerRef.current);
    if (!prompt.trim() || prompt.trim().length < 8 || selectedAgent !== 'auto') {
      setAutoDetect(null); return;
    }
    detectTimerRef.current = setTimeout(async ()=>{
      try {
        const r = await fetch('/api/vibe/detect', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({prompt:prompt.trim()}) });
        const d = await r.json();
        if (d.agent_id) setAutoDetect(d);
      } catch(e) {}
    }, 350);
    return ()=>clearTimeout(detectTimerRef.current);
  },[prompt, selectedAgent]);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200)+'px';
  };

  const extractCode = (raw) => {
    if (!raw) return '';
    const m = raw.match(/```(?:python|javascript|jsx|tsx|js|ts|html|css|bash|sh|sql|react)?\n?([\s\S]*?)```/);
    return m ? m[1].trim() : raw;
  };

  const handleBuild = async () => {
    if (!prompt.trim() || isBuilding) return;
    setIsBuilding(true); setError(''); setResult(null); setTerminalOutput(null);
    setChatMessages([]); setLastRunError('');
    try {
      const r = await fetch('/api/vibe/code', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({prompt:prompt.trim(), agent_id:selectedAgent}) });
      const d = await r.json();
      if (!r.ok || d.error) throw new Error(d.error||'Backend error');
      setResult(d);
      const lang = detectLanguage(d.code||'');
      if (canPreview(lang)) {
        setViewMode('preview');
        setPreviewKey(k=>k+1);
        if (lang==='python') setRunTrigger(k=>k+1);
      } else {
        setViewMode('code');
      }
    } catch(e) { setError(e.message||'Failed to generate code'); }
    finally { setIsBuilding(false); }
  };

  const handleRun = async () => {
    if (!result?.code || isRunning) return;
    setIsRunning(true); setTerminalOutput(null); setLastRunError('');
    try {
      const r = await fetch('/api/vibe/run', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({code:result.code, language:'python'}) });
      const d = await r.json();
      setTerminalOutput(d);
      if (!d.success && d.error) setLastRunError(d.error);
    } catch(e) { setTerminalOutput({success:false, error:e.message, output:''}); }
    finally { setIsRunning(false); }
  };

  const handleFix = async () => {
    if (!result?.code || isFixing) return;
    setIsFixing(true);
    try {
      const r = await fetch('/api/vibe/fix', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({code:result.code, error:lastRunError}) });
      const d = await r.json();
      if (d.fixed_code) {
        setResult(prev => ({ ...prev, code: d.fixed_code }));
        setTerminalOutput(null); setLastRunError('');
        setViewMode('code');
      }
    } catch(e) {}
    finally { setIsFixing(false); }
  };

  const handleChat = async () => {
    if (!chatInput.trim() || isChatting) return;
    const msg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role:'user', content:msg }]);
    setIsChatting(true);
    try {
      const r = await fetch('/api/vibe/chat', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({message:msg, code_context:result?.code||''}) });
      const d = await r.json();
      setChatMessages(prev => [...prev, { role:'assistant', content:d.reply||'No response' }]);
    } catch(e) { setChatMessages(prev => [...prev, {role:'assistant', content:'Failed to get response.'}]); }
    finally { setIsChatting(false); }
  };

  const startListening = useCallback(()=>{
    if (!SpeechRecognitionAPI) { alert('Speech recognition not supported. Use Chrome or Edge.'); return; }
    if (recRef.current) recRef.current.stop();
    const rec = new SpeechRecognitionAPI();
    rec.lang='en-US'; rec.interimResults=false; rec.continuous=false;
    rec.onstart=()=>setListening(true);
    rec.onresult=(e)=>{ const t=e.results[0][0].transcript; setPrompt(p=>p?p+' '+t:t); setTimeout(autoResize,10); };
    rec.onerror=()=>setListening(false);
    rec.onend=()=>setListening(false);
    recRef.current=rec; rec.start();
  },[]);

  const stopListening = useCallback(()=>{ recRef.current?.stop(); setListening(false); },[]);

  const rawCode = result ? extractCode(result.code) : '';
  const codeLang = result ? detectLanguage(result.code||'') : 'unknown';
  const previewHtml = result ? buildPreviewHtml(rawCode, codeLang) : null;
  const agentInfo = result ? agents.find(a=>a.id===result.agent_id)||{emoji:'⚙️',name:result.agent_id} : null;
  const agentColor = result ? (AGENT_COLORS[result.agent_id]||'#a78bfa') : '#a78bfa';
  const deps = result?.dependencies || [];

  const QUICK_IDEAS = [
    { emoji:'🎨', text:'A responsive navbar with logo and mobile hamburger menu' },
    { emoji:'⚙️', text:'A Python function to send emails with attachments' },
    { emoji:'📈', text:'NIFTY 50 RSI indicator and buy/sell signals' },
    { emoji:'🤖', text:'Auto-rename all files in a folder by date' },
    { emoji:'📊', text:'Plot sales data from a CSV with bar and line charts' },
    { emoji:'🔍', text:'Review and fix this Python code: [paste code here]' },
  ];

  const GLASS = {background:'rgba(8,4,20,0.72)',backdropFilter:'blur(24px) saturate(180%)',WebkitBackdropFilter:'blur(24px) saturate(180%)'};
  const BORDER = '1px solid rgba(138,92,246,0.12)';

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0}}>

      {/* Top tab bar */}
      <div style={{height:'36px',...GLASS,borderBottom:BORDER,display:'flex',alignItems:'stretch',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',padding:'0 16px',borderRight:BORDER,borderBottom:'2px solid #a78bfa',background:'rgba(138,92,246,0.08)',fontSize:'13px',color:'rgba(240,234,255,0.9)',gap:'6px'}}>
          <FiCode size={13} style={{color:'#a78bfa'}}/><span>vibe-coder</span>
        </div>
        <div style={{display:'flex',alignItems:'center',padding:'0 16px',fontSize:'11px',color:'rgba(138,92,246,0.45)',gap:'6px'}}>
          <FiZap size={11} style={{color:'#a78bfa'}}/>
          <span>6 specialist agents · Auto-routes · Live preview · Follow-up chat</span>
        </div>
      </div>

      {/* Main layout */}
      <div style={{flex:1,display:'flex',overflow:'hidden',flexDirection:(isMobile||isTablet)?'column':'row'}}>

        {/* ── Left/Top: Prompt pane ──────────────────────────────────────── */}
        <div style={{
          width:(isMobile||isTablet)?'100%':'340px',
          maxHeight:(isMobile||isTablet&&result)?'260px':undefined,
          flexShrink:0,display:'flex',flexDirection:'column',
          borderRight:(isMobile||isTablet)?'none':BORDER,
          borderBottom:(isMobile||isTablet)?BORDER:'none',
          ...GLASS, overflow:'hidden',
        }}>

          {/* Agent selector */}
          <div style={{padding:'10px 14px 8px',borderBottom:BORDER,display:'flex',flexDirection:'column',gap:'7px',flexShrink:0}}>
            <div style={{fontSize:'10px',color:'rgba(138,92,246,0.4)',letterSpacing:'0.08em',textTransform:'uppercase'}}>Specialist Agent</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:'5px'}}>
              <button onClick={()=>setSelectedAgent('auto')} style={{display:'flex',alignItems:'center',gap:'5px',padding:'4px 10px',borderRadius:'20px',fontSize:'12px',cursor:'pointer',transition:'all 0.15s',backgroundColor:selectedAgent==='auto'?'#3b82f622':'transparent',border:`1px solid ${selectedAgent==='auto'?'#3b82f6':'#1e1e1e'}`,color:selectedAgent==='auto'?'#3b82f6':'#606060'}}>
                <FiZap size={10}/><span>Auto</span>
              </button>
              {agents.map(a=><AgentPill key={a.id} agent={a} active={selectedAgent===a.id} onClick={setSelectedAgent}/>)}
            </div>
            {selectedAgent!=='auto' && agents.find(a=>a.id===selectedAgent) && (
              <div style={{fontSize:'11px',color:'#4a4a4a',lineHeight:'1.4'}}>
                {agents.find(a=>a.id===selectedAgent).emoji} {agents.find(a=>a.id===selectedAgent).desc}
              </div>
            )}
          </div>

          {/* Prompt area */}
          <div style={{flex:1,display:'flex',flexDirection:'column',padding:'12px 14px',gap:'10px',overflow:'auto'}}>
            <div style={{fontSize:'10px',color:'rgba(138,92,246,0.4)',letterSpacing:'0.08em',textTransform:'uppercase'}}>Describe what to build</div>

            <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(138,92,246,0.18)',borderRadius:'8px',display:'flex',flexDirection:'column',transition:'border-color 0.15s,box-shadow 0.15s'}}
              onFocusCapture={e=>{e.currentTarget.style.borderColor='#8b5cf6';e.currentTarget.style.boxShadow='0 0 0 3px rgba(139,92,246,0.12)';}}
              onBlurCapture={e=>{e.currentTarget.style.borderColor='rgba(138,92,246,0.18)';e.currentTarget.style.boxShadow='none';}}>
              <textarea ref={textareaRef} value={prompt}
                onChange={e=>{setPrompt(e.target.value);autoResize();}}
                onKeyDown={e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey))handleBuild();}}
                placeholder={`Describe what to build...\n\ne.g. "a React login form with email\nand password"\n\nor "NIFTY options strategy script"\n\nCtrl+Enter to build`}
                style={{minHeight:'120px',backgroundColor:'transparent',border:'none',outline:'none',color:'rgba(240,234,255,0.9)',fontSize:'13px',lineHeight:'1.7',resize:'none',fontFamily:"'Geist',sans-serif",padding:'12px'}}
              />
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'4px 12px 8px',borderTop:BORDER}}>
                <span style={{fontSize:'10px',color:'rgba(138,92,246,0.4)'}}>{prompt.length} chars</span>
                <span style={{fontSize:'10px',color:'rgba(138,92,246,0.4)'}}>Ctrl+↵ to build</span>
              </div>
            </div>

            {/* Auto-detect preview */}
            {selectedAgent==='auto' && autoDetect && !isBuilding && (
              <div style={{display:'flex',alignItems:'center',gap:'6px',padding:'7px 10px',borderRadius:'6px',background:'rgba(255,255,255,0.04)',border:BORDER,fontSize:'11px'}}>
                <span>{autoDetect.agent_emoji}</span>
                <span style={{color:AGENT_COLORS[autoDetect.agent_id]||'#a78bfa',fontWeight:'500'}}>{autoDetect.agent_name}</span>
                <span style={{color:'#4a4a4a'}}>will handle this</span>
                <span style={{marginLeft:'auto',fontSize:'10px',padding:'1px 6px',borderRadius:'8px',backgroundColor:'#1a1a1a',border:'1px solid #2a2a2a',color:'#5a5a5a'}}>{autoDetect.confidence}% match</span>
              </div>
            )}

            {/* Action buttons */}
            <div style={{display:'flex',gap:'8px',flexShrink:0}}>
              {SpeechRecognitionAPI&&(
                <button onClick={listening?stopListening:startListening} title={listening?'Stop':'Voice input'}
                  style={{width:'38px',height:'38px',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'6px',flexShrink:0,cursor:'pointer',transition:'all 0.15s',background:listening?'rgba(16,185,129,0.12)':'rgba(255,255,255,0.04)',border:`1px solid ${listening?'rgba(16,185,129,0.4)':'rgba(138,92,246,0.2)'}`,color:listening?'#34d399':'rgba(196,181,253,0.5)',animation:listening?'pulse 1.5s ease-in-out infinite':'none'}}>
                  {listening?<FiMic size={15}/>:<FiMicOff size={15}/>}
                </button>
              )}
              <button onClick={handleBuild} disabled={!prompt.trim()||isBuilding}
                style={{flex:1,height:'38px',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',borderRadius:'8px',border:'none',fontSize:'13px',fontWeight:'600',transition:'all 0.15s',background:(prompt.trim()&&!isBuilding)?'linear-gradient(135deg,#8b5cf6,#7c3aed)':'rgba(255,255,255,0.04)',color:(prompt.trim()&&!isBuilding)?'#ffffff':'rgba(138,92,246,0.3)',cursor:(prompt.trim()&&!isBuilding)?'pointer':'not-allowed',boxShadow:(prompt.trim()&&!isBuilding)?'0 0 20px rgba(139,92,246,0.35)':'none'}}>
                {isBuilding?<><FiLoader size={14} style={{animation:'spin 1s linear infinite'}}/><span>Building...</span></>:<><FiZap size={14}/><span>Build (Ctrl+↵)</span></>}
              </button>
            </div>

            {error&&(
              <div style={{display:'flex',alignItems:'flex-start',gap:'8px',padding:'10px 12px',borderRadius:'6px',flexShrink:0,backgroundColor:'#1a0a0a',border:'1px solid #4a1a1a',color:'#f87171',fontSize:'12px',lineHeight:'1.5'}}>
                <FiAlertCircle size={13} style={{flexShrink:0,marginTop:'1px'}}/><span>{error}</span>
              </div>
            )}

            {/* Quick ideas */}
            {!result && !isBuilding && (
              <div style={{padding:'10px 12px',borderRadius:'6px',backgroundColor:'#111111',border:'1px solid #1a1a1a',flexShrink:0}}>
                <div style={{fontSize:'10px',color:'#3a3a3a',letterSpacing:'0.06em',marginBottom:'8px',textTransform:'uppercase'}}>Quick ideas</div>
                {QUICK_IDEAS.map((tip,i)=>(
                  <button key={i} onClick={()=>{setPrompt(tip.text);setTimeout(autoResize,10);}}
                    style={{display:'block',width:'100%',textAlign:'left',padding:'4px 0',backgroundColor:'transparent',border:'none',color:'#4a4a4a',fontSize:'12px',cursor:'pointer',transition:'color 0.1s',lineHeight:'1.5'}}
                    onMouseEnter={e=>e.currentTarget.style.color='#8b8b8b'}
                    onMouseLeave={e=>e.currentTarget.style.color='#4a4a4a'}>
                    {tip.emoji} {tip.text.length>48?tip.text.slice(0,48)+'…':tip.text}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Code + Preview ──────────────────────────────────── */}
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>

          {isBuilding ? (
            <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'16px'}}>
              <div style={{width:'56px',height:'56px',borderRadius:'14px',backgroundColor:'#111111',border:'1px solid #a78bfa33',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <FiZap size={24} style={{color:'#a78bfa',animation:'pulse 1s ease-in-out infinite'}}/>
              </div>
              <div style={{fontSize:'14px',color:'#6a6a6a'}}>
                {autoDetect ? `${autoDetect.agent_emoji} ${autoDetect.agent_name} is coding...` : 'Routing to specialist agent...'}
              </div>
              <div style={{display:'flex',gap:'6px'}}>
                {[0,0.2,0.4].map((d,i)=><div key={i} style={{width:'6px',height:'6px',borderRadius:'50%',backgroundColor:'#a78bfa',animation:`pulse 1.2s ease-in-out ${d}s infinite`}}/>)}
              </div>
            </div>

          ) : result ? (
            <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>

              {/* Tab header */}
              <div style={{height:'36px',...GLASS,borderBottom:BORDER,display:'flex',alignItems:'stretch',justifyContent:'space-between',flexShrink:0}}>
                <div style={{display:'flex',alignItems:'stretch'}}>
                  <TabBtn active={viewMode==='code'} onClick={()=>setViewMode('code')}><FiCode size={12}/> Code</TabBtn>
                  <TabBtn active={viewMode==='preview'} onClick={()=>setViewMode('preview')}>
                    <FiEye size={12}/> Preview
                    {canPreview(codeLang)&&<span style={{fontSize:'10px',padding:'1px 5px',borderRadius:'8px',backgroundColor:viewMode==='preview'?'#a78bfa22':'#1a1a1a',border:'1px solid #a78bfa44',color:'#a78bfa',marginLeft:'2px'}}>live</span>}
                  </TabBtn>
                  <div style={{display:'flex',alignItems:'center',padding:'0 10px',gap:'6px'}}>
                    <span style={{fontSize:'12px'}}>{agentInfo?.emoji}</span>
                    <span style={{fontSize:'11px',color:agentColor,fontWeight:'500'}}>{agentInfo?.name}</span>
                    <span style={{fontSize:'10px',padding:'1px 6px',borderRadius:'10px',backgroundColor:agentColor+'11',border:`1px solid ${agentColor}33`,color:agentColor}}>{codeLang}</span>
                    {result.confidence&&<span style={{fontSize:'10px',color:'#3a3a3a'}}>{result.confidence}% match</span>}
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'8px',paddingRight:'14px'}}>
                  <CopyBtn text={rawCode}/>
                  {lastRunError && (
                    <button onClick={handleFix} disabled={isFixing}
                      style={{display:'flex',alignItems:'center',gap:'5px',padding:'3px 10px',borderRadius:'4px',fontSize:'11px',transition:'all 0.15s',backgroundColor:isFixing?'#1a1000':'#1a1500',border:`1px solid ${isFixing?'#3a3000':'#fbbf2466'}`,color:isFixing?'#8a7000':'#fbbf24',cursor:isFixing?'not-allowed':'pointer'}}>
                      {isFixing?<FiLoader size={11} style={{animation:'spin 1s linear infinite'}}/>:<FiTool size={11}/>}
                      <span>{isFixing?'Fixing...':'Fix It'}</span>
                    </button>
                  )}
                  {codeLang==='python'&&viewMode==='code'&&(
                    <button onClick={handleRun} disabled={isRunning}
                      style={{display:'flex',alignItems:'center',gap:'5px',padding:'3px 10px',borderRadius:'4px',fontSize:'11px',transition:'all 0.15s',backgroundColor:isRunning?'#0a1a0a':'#0a2a1a',border:`1px solid ${isRunning?'#1a3a1a':'#10b98166'}`,color:isRunning?'#3a8a5a':'#10b981',cursor:isRunning?'not-allowed':'pointer'}}>
                      {isRunning?<FiLoader size={11} style={{animation:'spin 1s linear infinite'}}/>:<FiPlay size={11}/>}
                      <span>{isRunning?'Running...':'Run Python'}</span>
                    </button>
                  )}
                  {codeLang==='python'&&viewMode==='preview'&&(
                    <button onClick={()=>setRunTrigger(k=>k+1)} style={{display:'flex',alignItems:'center',gap:'4px',padding:'3px 8px',borderRadius:'4px',fontSize:'11px',cursor:'pointer',backgroundColor:'#0a1a0a',border:'1px solid #34d39944',color:'#34d399'}}>
                      <FiRefreshCw size={11}/> Re-run
                    </button>
                  )}
                  {canPreview(codeLang)&&viewMode==='preview'&&codeLang!=='python'&&(
                    <button onClick={()=>setPreviewKey(k=>k+1)} style={{display:'flex',alignItems:'center',gap:'4px',padding:'3px 8px',borderRadius:'4px',fontSize:'11px',cursor:'pointer',backgroundColor:'transparent',border:'1px solid #2a2a2a',color:'#5a5a5a'}}
                      onMouseEnter={e=>e.currentTarget.style.color='#aaa'} onMouseLeave={e=>e.currentTarget.style.color='#5a5a5a'}>
                      <FiRefreshCw size={11}/> Refresh
                    </button>
                  )}
                </div>
              </div>

              {/* Dependencies banner */}
              {deps.length>0&&(
                <div style={{background:'rgba(251,191,36,0.05)',borderBottom:BORDER,padding:'6px 14px',display:'flex',alignItems:'center',gap:'8px',flexShrink:0}}>
                  <FiPackage size={12} style={{color:'#fbbf24',flexShrink:0}}/>
                  <span style={{fontSize:'11px',color:'#5a5a5a'}}>Install first:</span>
                  <code style={{fontSize:'11px',color:'#fbbf24',backgroundColor:'#1a1500',padding:'2px 8px',borderRadius:'4px',border:'1px solid #fbbf2422',letterSpacing:'0.02em'}}>
                    pip install {deps.join(' ')}
                  </code>
                  <button onClick={()=>{navigator.clipboard.writeText(`pip install ${deps.join(' ')}`);}} style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:'3px',padding:'2px 6px',borderRadius:'4px',fontSize:'10px',backgroundColor:'transparent',border:'1px solid #2a2a2a',color:'#5a5a5a',cursor:'pointer'}}
                    onMouseEnter={e=>e.currentTarget.style.color='#aaa'} onMouseLeave={e=>e.currentTarget.style.color='#5a5a5a'}>
                    <FiCopy size={9}/> Copy
                  </button>
                </div>
              )}

              {/* Code / Preview */}
              {viewMode==='code'&&(
                <div style={{flex:1,overflowY:'auto',overflowX:'auto',padding:'16px 20px',background:'rgba(6,3,14,0.55)',fontFamily:"'Geist Mono','Fira Code','Cascadia Code',monospace",fontSize:'13px',lineHeight:'1.7'}}>
                  <pre style={{margin:0,whiteSpace:'pre',color:'#abb2bf'}}>
                    <code dangerouslySetInnerHTML={{__html:highlightCode(rawCode||result.code)}}/>
                  </pre>
                </div>
              )}
              {viewMode==='preview'&&codeLang!=='python'&&<LivePreview key={previewKey} html={previewHtml} lang={codeLang} onRefresh={()=>setPreviewKey(k=>k+1)}/>}
              {viewMode==='preview'&&codeLang==='python'&&<PythonPreview key={previewKey} code={rawCode} runTrigger={runTrigger} onError={e=>setLastRunError(e)}/>}

              {/* Code-view terminal panel */}
              {viewMode==='code'&&terminalOutput&&(
                <div style={{height:'200px',flexShrink:0,display:'flex',flexDirection:'column',borderTop:BORDER,...GLASS}}>
                  <div style={{height:'30px',backgroundColor:'#0f0f0f',borderBottom:'1px solid #1a1a1a',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 14px',flexShrink:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                      <FiTerminal size={12} style={{color:'#4a4a4a'}}/>
                      <span style={{fontSize:'11px',color:'#4a4a4a'}}>Terminal Output</span>
                      <span style={{fontSize:'10px',padding:'1px 6px',borderRadius:'10px',backgroundColor:terminalOutput.success?'#0a2a1a':'#2a0a0a',color:terminalOutput.success?'#10b981':'#f87171',border:`1px solid ${terminalOutput.success?'#10b98133':'#f8717133'}`}}>{terminalOutput.success?'✓ Success':'✗ Error'}</span>
                      {terminalOutput.runtime_ms>0&&<span style={{fontSize:'10px',color:'#3a3a3a'}}>{terminalOutput.runtime_ms}ms</span>}
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      {!terminalOutput.success&&lastRunError&&(
                        <button onClick={handleFix} disabled={isFixing}
                          style={{display:'flex',alignItems:'center',gap:'4px',padding:'2px 8px',borderRadius:'4px',fontSize:'11px',cursor:isFixing?'not-allowed':'pointer',backgroundColor:'#1a1500',border:'1px solid #fbbf2466',color:'#fbbf24'}}>
                          {isFixing?<FiLoader size={10} style={{animation:'spin 1s linear infinite'}}/>:<FiTool size={10}/>}
                          {isFixing?'Fixing...':'Fix It'}
                        </button>
                      )}
                      <button onClick={()=>setTerminalOutput(null)} style={{background:'none',border:'none',color:'#3a3a3a',cursor:'pointer',fontSize:'16px',lineHeight:1,padding:'0 4px'}}>×</button>
                    </div>
                  </div>
                  <div style={{flex:1,overflowY:'auto',padding:'10px 14px'}}>
                    {terminalOutput.output&&<pre style={{margin:0,fontFamily:"'Geist Mono',monospace",fontSize:'12px',color:'#a8cc8c',lineHeight:'1.6',whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{terminalOutput.output}</pre>}
                    {terminalOutput.error&&<pre style={{margin:terminalOutput.output?'8px 0 0':0,fontFamily:"'Geist Mono',monospace",fontSize:'12px',color:'#f87171',lineHeight:'1.6',whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{terminalOutput.error}</pre>}
                    {!terminalOutput.output&&!terminalOutput.error&&<span style={{color:'#3a3a3a',fontSize:'12px'}}>(no output)</span>}
                  </div>
                </div>
              )}

              {/* Follow-up chat */}
              <div style={{borderTop:BORDER,...GLASS,flexShrink:0}}>
                {chatMessages.length>0&&(
                  <div style={{maxHeight:'200px',overflowY:'auto',padding:'10px 14px',display:'flex',flexDirection:'column',gap:'8px'}}>
                    {chatMessages.map((m,i)=>(
                      <div key={i} style={{display:'flex',gap:'8px',alignItems:'flex-start'}}>
                        <span style={{fontSize:'11px',color:m.role==='user'?'#a78bfa':'#34d399',fontWeight:'600',flexShrink:0,paddingTop:'1px'}}>{m.role==='user'?'You':'AI'}</span>
                        <div style={{fontSize:'12px',color:m.role==='user'?'#c8c8c8':'#abb2bf',lineHeight:'1.6',whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{m.content}</div>
                      </div>
                    ))}
                    {isChatting&&<div style={{display:'flex',gap:'8px',alignItems:'center'}}><span style={{fontSize:'11px',color:'#34d399',fontWeight:'600'}}>AI</span><FiLoader size={11} style={{color:'#34d399',animation:'spin 1s linear infinite'}}/></div>}
                    <div ref={chatEndRef}/>
                  </div>
                )}
                <div style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px 12px',borderTop:chatMessages.length>0?'1px solid #1a1a1a':'none'}}>
                  <FiMessageSquare size={13} style={{color:'#3a3a3a',flexShrink:0}}/>
                  <input value={chatInput} onChange={e=>setChatInput(e.target.value)}
                    onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleChat();}}}
                    placeholder="Ask about this code... (Enter to send)"
                    style={{flex:1,backgroundColor:'transparent',border:'none',outline:'none',color:'#e8e8e8',fontSize:'12px',fontFamily:"'Geist',sans-serif"}}
                  />
                  <button onClick={handleChat} disabled={!chatInput.trim()||isChatting}
                    style={{display:'flex',alignItems:'center',justifyContent:'center',width:'28px',height:'28px',borderRadius:'6px',border:'none',cursor:chatInput.trim()&&!isChatting?'pointer':'not-allowed',backgroundColor:chatInput.trim()&&!isChatting?'#a78bfa22':'transparent',color:chatInput.trim()&&!isChatting?'#a78bfa':'#3a3a3a',flexShrink:0}}>
                    <FiSend size={12}/>
                  </button>
                </div>
              </div>
            </div>

          ) : (
            <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'12px',padding:'40px'}}>
              <div style={{width:'64px',height:'64px',borderRadius:'16px',backgroundColor:'#111111',border:'1px solid #1e1e1e',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <FiCode size={28} style={{color:'#2a2a2a'}}/>
              </div>
              <div style={{fontSize:'15px',color:'#4a4a4a',fontWeight:'500'}}>Describe what you want to build</div>
              <div style={{fontSize:'12px',color:'#3a3a3a',textAlign:'center',maxWidth:'400px',lineHeight:'1.7'}}>
                The specialist agent is auto-selected as you type. Generated code appears here with syntax highlighting.
                HTML and React open in <strong style={{color:'#5a5a5a'}}>Live Preview</strong>. Python auto-runs in the <strong style={{color:'#5a5a5a'}}>Terminal Preview</strong>.
              </div>
              <div style={{display:'flex',gap:'6px',marginTop:'4px',flexWrap:'wrap',justifyContent:'center'}}>
                {agents.map(a=>(
                  <span key={a.id} style={{fontSize:'11px',padding:'3px 10px',borderRadius:'20px',backgroundColor:'#111111',border:'1px solid #1e1e1e',color:AGENT_COLORS[a.id]||'#5a5a5a'}}>
                    {a.emoji} {a.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        ::-webkit-scrollbar { width:6px; height:6px; }
        ::-webkit-scrollbar-track { background:#111111; }
        ::-webkit-scrollbar-thumb { background:#2a2a2a; border-radius:3px; }
        ::-webkit-scrollbar-thumb:hover { background:#3a3a3a; }
      `}</style>
    </div>
  );
};

export default VibeCoder;
