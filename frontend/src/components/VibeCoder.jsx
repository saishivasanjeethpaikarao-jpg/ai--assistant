import { useState, useRef, useEffect, useCallback } from 'react';
import {
  FiCode, FiPlay, FiMic, FiMicOff, FiZap, FiTerminal,
  FiCopy, FiCheck, FiLoader, FiAlertCircle, FiEye, FiRefreshCw,
  FiMonitor, FiSend, FiTool, FiPackage, FiPlus, FiColumns,
  FiSmartphone, FiTablet,
} from 'react-icons/fi';

// ── Design tokens ─────────────────────────────────────────────────────────────
const B    = '#437DFD';
const DARK = '#0d1117';

// ── Helpers ───────────────────────────────────────────────────────────────────

const SpeechRecognitionAPI =
  typeof window !== 'undefined' &&
  (window.SpeechRecognition || window.webkitSpeechRecognition);

function detectLanguage(raw) {
  if (!raw) return 'unknown';
  const m = raw.match(/^```(\w+)/m);
  if (m) {
    const l = m[1].toLowerCase();
    if (['html','htm'].includes(l))            return 'html';
    if (['jsx','tsx','react'].includes(l))     return 'react';
    if (['js','javascript','ts'].includes(l))  return 'javascript';
    if (l === 'css')   return 'css';
    if (['python','py'].includes(l)) return 'python';
    return l;
  }
  const c = raw.trim();
  if (c.startsWith('<!DOCTYPE') || c.startsWith('<html')) return 'html';
  if (/import React|from 'react'|from "react"/.test(c)) return 'react';
  return 'unknown';
}

function extractCode(raw) {
  if (!raw) return '';
  const m = raw.match(/```(?:\w+)?\n?([\s\S]*?)```/);
  return m ? m[1].trim() : raw.trim();
}

function canPreview(lang) {
  return ['html','react','javascript','css'].includes(lang);
}

function buildPreviewHtml(code, lang) {
  const base = `*{box-sizing:border-box}body{margin:0;padding:16px;font-family:system-ui,sans-serif;background:#fff;color:#111}`;
  if (lang === 'html') {
    if (code.trim().startsWith('<!DOCTYPE') || code.trim().startsWith('<html')) return code;
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${base}</style></head><body>${code}</body></html>`;
  }
  if (lang === 'react') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<script src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<style>${base}#__err{padding:12px;background:#fff0f0;border:1px solid #fca5a5;border-radius:6px;color:#dc2626;font-size:12px;font-family:monospace;white-space:pre-wrap;margin:12px}</style>
</head><body><div id="root"></div>
<script type="text/babel" data-presets="react">
${code}
;(function(){
  const root=document.getElementById('root');
  const names=['App','Dashboard','Home','Main','Page','Component','Layout','UI','Widget','Preview','Demo'];
  let Comp=null;
  for(const n of names){try{if(typeof eval(n)!=='undefined'){Comp=eval(n);break;}}catch(e){}}
  if(!Comp){const fns=Object.keys(window).filter(k=>/^[A-Z]/.test(k)&&typeof window[k]==='function');if(fns.length)Comp=window[fns[0]];}
  try{if(Comp)ReactDOM.createRoot(root).render(React.createElement(Comp));
  else root.innerHTML='<div id="__err">Name your component App, Dashboard, etc.</div>';}
  catch(e){root.innerHTML='<div id="__err">Error: '+e.message+'</div>';}
})();
</script></body></html>`;
  }
  if (lang === 'javascript') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${base}#out{font-family:monospace;font-size:12px;line-height:1.6;white-space:pre-wrap}.err{color:#dc2626}.log{color:#111}</style></head><body>
<div id="out"></div><script>
const out=document.getElementById('out');const _l=console.log;
console.log=(...a)=>{out.innerHTML+='<span class="log">'+a.map(x=>typeof x==='object'?JSON.stringify(x,null,2):String(x)).join(' ')+'\\n</span>';_l(...a);};
console.error=(...a)=>{out.innerHTML+='<span class="err">ERROR: '+a.join(' ')+'\\n</span>';};
try{${code}}catch(e){out.innerHTML+='<span class="err">Error: '+e.message+'</span>';}
</script></body></html>`;
  }
  if (lang === 'css') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${base}${code}</style></head><body>
<div class="container"><div class="card"><h1 class="title">Preview</h1><p class="text">Sample content to preview your CSS.</p><button class="btn">Button</button></div>
<nav class="nav"><a class="nav-link" href="#">Home</a><a class="nav-link" href="#">About</a></nav></div></body></html>`;
  }
  return null;
}

function highlightCode(code) {
  if (!code) return '';
  const esc = code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return esc
    .replace(/("""[\s\S]*?"""|'''[\s\S]*?''')/g,'<span style="color:#98c379">$1</span>')
    .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,'<span style="color:#98c379">$1</span>')
    .replace(/(#[^\n]*)/g,'<span style="color:#5c6370;font-style:italic">$1</span>')
    .replace(/(\/\/[^\n]*)/g,'<span style="color:#5c6370;font-style:italic">$1</span>')
    .replace(/\b(\d+\.?\d*)\b/g,'<span style="color:#d19a66">$1</span>')
    .replace(/\b(import|from|def|class|return|if|elif|else|for|while|in|not|and|or|True|False|None|try|except|with|as|async|await|lambda)\b/g,'<span style="color:#c678dd">$1</span>')
    .replace(/\b(const|let|var|function|export|default|return|if|else|for|while|of|new|this|typeof|async|await|try|catch|class|extends)\b/g,'<span style="color:#c678dd">$1</span>')
    .replace(/(&lt;\/?[A-Z][a-zA-Z]*)/g,'<span style="color:#e06c75">$1</span>')
    .replace(/\b([a-zA-Z_]\w*)\s*(?=\()/g,'<span style="color:#61afef">$1</span>');
}

// ── Reusable sub-components ────────────────────────────────────────────────────

const QUICK_IDEAS = [
  { emoji:'🎨', text:'A beautiful landing page hero section with gradient and CTA button' },
  { emoji:'🔐', text:'A login form with email, password and Google button' },
  { emoji:'📊', text:'A dashboard with stats cards, bar chart and recent activity' },
  { emoji:'🛒', text:'A product card with image, price, rating and add-to-cart button' },
  { emoji:'🧭', text:'A responsive navbar with logo, links and mobile hamburger menu' },
  { emoji:'💬', text:'A chat bubble UI with user and AI messages' },
];

const AGENT_META = {
  frontend:   { color:'#437DFD', bg:'rgba(67,125,253,0.1)',  emoji:'🎨' },
  backend:    { color:'#059669', bg:'rgba(5,150,105,0.1)',   emoji:'⚙️' },
  trading:    { color:'#d97706', bg:'rgba(217,119,6,0.1)',   emoji:'📈' },
  automation: { color:'#dc2626', bg:'rgba(220,38,38,0.1)',   emoji:'🤖' },
  data:       { color:'#7B61FF', bg:'rgba(123,97,255,0.1)',  emoji:'📊' },
  debug:      { color:'#ea580c', bg:'rgba(234,88,12,0.1)',   emoji:'🔍' },
};

// ── LivePreview ────────────────────────────────────────────────────────────────

const LivePreview = ({ html, lang, onRefresh, viewport }) => {
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState(0);

  const widths = { desktop:'100%', tablet:'768px', mobile:'375px' };
  const w = widths[viewport] || '100%';

  useEffect(() => { setLoading(true); setKey(k => k+1); }, [html]);

  if (!html) return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'12px', background:'#F5F4F2' }}>
      <FiMonitor size={36} style={{ color:'#ddd' }}/>
      <div style={{ fontSize:'13px', color:'#bbb' }}>No visual preview for {lang || 'this language'}</div>
    </div>
  );

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:'#e5e5e5', alignItems:'center', overflow:'auto', padding: w!=='100%'?'16px 0':'0' }}>
      {loading && (
        <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(245,244,242,0.9)', zIndex:5 }}>
          <div style={{ display:'flex', gap:'6px' }}>
            {[0,.15,.3].map((d,i)=><div key={i} style={{ width:'7px', height:'7px', borderRadius:'50%', background:B, animation:`vcPulse 1.2s ease-in-out ${d}s infinite` }}/>)}
          </div>
        </div>
      )}
      <iframe
        key={key}
        srcDoc={html}
        sandbox="allow-scripts allow-modals"
        title="Live Preview"
        onLoad={() => setLoading(false)}
        style={{ width:w, flex:'1', border:'none', background:'#fff', boxShadow: w!=='100%'?'0 4px 24px rgba(0,0,0,0.18)':'none', borderRadius: w!=='100%'?'8px':'0', minHeight:'300px' }}
      />
    </div>
  );
};

// ── PythonTerminal ─────────────────────────────────────────────────────────────

const PythonTerminal = ({ code, runTrigger }) => {
  const [output,  setOutput]  = useState('');
  const [errOut,  setErrOut]  = useState('');
  const [running, setRunning] = useState(false);
  const [success, setSuccess] = useState(null);
  const [ms,      setMs]      = useState(null);
  const outRef = useRef(null);

  const run = useCallback(async () => {
    if (running || !code) return;
    setRunning(true); setOutput(''); setErrOut(''); setSuccess(null); setMs(null);
    try {
      const r = await fetch('/api/vibe/run', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ code, language:'python' }) });
      const d = await r.json();
      setOutput(d.output||''); setErrOut(d.error||''); setSuccess(d.success); setMs(d.runtime_ms);
    } catch(e) { setErrOut('Failed to run: '+e.message); setSuccess(false); }
    finally { setRunning(false); }
  }, [code, running]);

  useEffect(() => { run(); }, [runTrigger]);
  useEffect(() => { if (outRef.current) outRef.current.scrollTop = outRef.current.scrollHeight; }, [output, errOut]);

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:DARK, overflow:'hidden' }}>
      <div style={{ height:'34px', background:'rgba(255,255,255,0.05)', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 14px', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <FiTerminal size={12} style={{ color:'#34d399' }}/>
          <span style={{ fontSize:'11px', color:'#6b7280', fontFamily:'monospace' }}>python — script.py</span>
          {success !== null && <span style={{ fontSize:'10px', padding:'1px 7px', borderRadius:'10px', background: success?'rgba(5,150,105,0.2)':'rgba(239,68,68,0.2)', color: success?'#34d399':'#f87171' }}>{success?'✓ exit 0':'✗ exit 1'}</span>}
          {ms !== null && <span style={{ fontSize:'10px', color:'#4b5563' }}>{ms}ms</span>}
        </div>
        <button onClick={run} disabled={running}
          style={{ display:'flex', alignItems:'center', gap:'4px', padding:'2px 8px', borderRadius:'4px', fontSize:'11px', cursor: running?'not-allowed':'pointer', background:'transparent', border:`1px solid ${running?'#2a2a2a':'#34d39944'}`, color: running?'#3a3a3a':'#34d399' }}>
          {running ? <FiLoader size={10} style={{ animation:'vcSpin 1s linear infinite' }}/> : <FiPlay size={10}/>}
          {running ? 'Running...' : 'Re-run'}
        </button>
      </div>
      <div ref={outRef} style={{ flex:1, overflowY:'auto', padding:'14px 16px', fontFamily:"'Fira Code',Consolas,monospace", fontSize:'12px', lineHeight:'1.7' }}>
        {running && <div style={{ color:'#5a5a5a', display:'flex', alignItems:'center', gap:'8px' }}><FiLoader size={11} style={{ animation:'vcSpin 1s linear infinite', color:'#a78bfa' }}/> Executing...</div>}
        {!running && output && <pre style={{ margin:0, whiteSpace:'pre-wrap', wordBreak:'break-word', color:'#a8cc8c' }}>{output}</pre>}
        {!running && errOut && <pre style={{ margin: output?'8px 0 0':0, whiteSpace:'pre-wrap', wordBreak:'break-word', color:'#f87171' }}>{errOut}</pre>}
        {!running && !output && !errOut && <span style={{ color:'#444', fontSize:'12px' }}>(no output)</span>}
      </div>
    </div>
  );
};

// ── Main VibeCoder ─────────────────────────────────────────────────────────────

const VibeCoder = ({ isMobile = false }) => {
  // Conversation
  const [messages,     setMessages]     = useState([]);
  const [input,        setInput]        = useState('');
  const [isWorking,    setIsWorking]    = useState(false);

  // Code
  const [code,         setCode]         = useState('');
  const [lang,         setLang]         = useState('unknown');
  const [agentId,      setAgentId]      = useState(null);
  const [deps,         setDeps]         = useState([]);
  const [runTrigger,   setRunTrigger]   = useState(0);

  // View
  const [viewTab,      setViewTab]      = useState('split'); // 'code' | 'preview' | 'split'
  const [viewport,     setViewport]     = useState('desktop');
  const [listening,    setListening]    = useState(false);

  const inputRef   = useRef(null);
  const recRef     = useRef(null);
  const msgsEndRef = useRef(null);

  useEffect(() => { msgsEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  const addMsg = (role, text, meta = null) => {
    setMessages(prev => [...prev, { role, text, meta, id: Date.now() }]);
  };

  // ── Sending ────────────────────────────────────────────────────────────────

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || isWorking) return;
    setInput('');
    if (inputRef.current) { inputRef.current.style.height = 'auto'; }

    addMsg('user', msg);
    setIsWorking(true);

    try {
      if (!code) {
        // ── Initial generation ──────────────────────────────────────────────
        const r = await fetch('/api/vibe/code', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ prompt: msg, agent_id:'auto' }),
        });
        const d = await r.json();
        if (!r.ok || d.error) throw new Error(d.error || 'Backend error');

        const rawCode = extractCode(d.code || '');
        const detectedLang = detectLanguage(d.code || '');
        setCode(rawCode);
        setLang(detectedLang);
        setAgentId(d.agent_id || null);
        setDeps(d.dependencies || []);

        const lines = rawCode.split('\n').length;
        const agent = AGENT_META[d.agent_id];
        addMsg('assistant', `Built! ${lines} lines of ${detectedLang.toUpperCase()}${agent ? ` via ${agent.emoji}` : ''}. ${d.description || ''}`, { type:'built', agentId: d.agent_id, lines, lang: detectedLang });

        // Auto-show preview for visual code, terminal for python
        if (detectedLang === 'python') {
          setViewTab('preview'); setRunTrigger(k => k+1);
        } else if (canPreview(detectedLang)) {
          setViewTab('split');
        } else {
          setViewTab('code');
        }
      } else {
        // ── Update existing code ───────────────────────────────────────────
        const r = await fetch('/api/vibe/chat', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ message: msg, code_context: code }),
        });
        const d = await r.json();
        const reply = d.reply || '';

        // Extract code from reply
        const newCode = extractCode(reply);
        const hasNewCode = newCode && newCode.length > 40 && newCode !== code;

        if (hasNewCode) {
          const newLang = detectLanguage(reply) !== 'unknown' ? detectLanguage(reply) : lang;
          setCode(newCode);
          setLang(newLang);
          // Strip code block from the reply to get the description
          const desc = reply.replace(/```[\s\S]*?```/g, '').trim();
          addMsg('assistant', (desc || 'Updated the code!') + ' ✓', { type:'updated' });
        } else {
          // No code in reply — it's a question or explanation
          addMsg('assistant', reply, { type:'chat' });
        }
      }
    } catch(e) {
      addMsg('error', e.message || 'Something went wrong');
    } finally {
      setIsWorking(false);
    }
  };

  // ── Voice ──────────────────────────────────────────────────────────────────

  const startListening = useCallback(() => {
    if (!SpeechRecognitionAPI) { alert('Speech recognition requires Chrome or Edge.'); return; }
    if (recRef.current) recRef.current.stop();
    const rec = new SpeechRecognitionAPI();
    rec.lang='en-US'; rec.interimResults=false; rec.continuous=false;
    rec.onstart  = () => setListening(true);
    rec.onresult = (e) => { setInput(p => p ? p+' '+e.results[0][0].transcript : e.results[0][0].transcript); };
    rec.onerror  = () => setListening(false);
    rec.onend    = () => setListening(false);
    recRef.current = rec; rec.start();
  }, []);
  const stopListening = useCallback(() => { recRef.current?.stop(); setListening(false); }, []);

  const autoResize = () => {
    const el = inputRef.current; if (!el) return;
    el.style.height='auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  };

  const handleNewProject = () => {
    setMessages([]); setCode(''); setLang('unknown'); setAgentId(null); setDeps([]);
    setInput(''); setViewTab('split');
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const previewHtml = code && canPreview(lang) ? buildPreviewHtml(code, lang) : null;
  const agentMeta   = agentId ? AGENT_META[agentId] : null;
  const hasCode     = !!code;

  // Mobile: only show split as stacked
  const effectiveTab = isMobile ? 'split' : viewTab;

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0, background:'#F5F4F2' }}>

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div style={{ height:'44px', background:'#fff', borderBottom:'1px solid rgba(0,0,0,0.08)', display:'flex', alignItems:'stretch', justifyContent:'space-between', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', padding:'0 16px', borderBottom:`2px solid ${B}`, background:'rgba(67,125,253,0.04)', gap:'8px', fontSize:'13px', color:'#0C0C0C', fontWeight:'600' }}>
          <FiCode size={14} style={{ color:B }}/>
          <span>vibe-coder</span>
          {agentMeta && <span style={{ fontSize:'10px', padding:'2px 8px', borderRadius:'20px', background:agentMeta.bg, color:agentMeta.color, fontWeight:'600', border:`1px solid ${agentMeta.color}30` }}>{agentMeta.emoji} {agentId}</span>}
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:'4px', padding:'0 12px' }}>
          {/* View tabs */}
          {hasCode && !isMobile && (
            <div style={{ display:'flex', background:'rgba(0,0,0,0.05)', borderRadius:'8px', padding:'3px', marginRight:'4px' }}>
              {[
                { id:'code',    icon: FiCode,    label:'Code' },
                { id:'preview', icon: FiEye,     label:'Preview' },
                { id:'split',   icon: FiColumns, label:'Split' },
              ].map(({ id, icon: Icon, label }) => (
                <button key={id} onClick={() => setViewTab(id)} style={{
                  display:'flex', alignItems:'center', gap:'4px', padding:'4px 10px', borderRadius:'6px', border:'none', cursor:'pointer', fontSize:'11px', fontWeight:'500',
                  background: viewTab===id ? '#fff' : 'transparent',
                  color: viewTab===id ? '#0C0C0C' : '#999',
                  boxShadow: viewTab===id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  transition:'all 0.15s',
                }}>
                  <Icon size={11}/> {label}
                </button>
              ))}
            </div>
          )}

          {/* Viewport toggle (only in preview/split) */}
          {hasCode && ['preview','split'].includes(effectiveTab) && !isMobile && (
            <div style={{ display:'flex', gap:'2px', marginRight:'4px' }}>
              {[
                { id:'desktop', icon: FiMonitor },
                { id:'tablet',  icon: FiTablet },
                { id:'mobile',  icon: FiSmartphone },
              ].map(({ id, icon: Icon }) => (
                <button key={id} onClick={() => setViewport(id)} style={{
                  display:'flex', alignItems:'center', justifyContent:'center', width:'28px', height:'28px', borderRadius:'6px', border:'none', cursor:'pointer',
                  background: viewport===id ? 'rgba(67,125,253,0.1)' : 'transparent',
                  color: viewport===id ? B : '#bbb', transition:'all 0.15s',
                }}>
                  <Icon size={12}/>
                </button>
              ))}
            </div>
          )}

          {/* Copy */}
          {hasCode && <CopyBtn text={code}/>}

          {/* New project */}
          {hasCode && (
            <button onClick={handleNewProject} style={{ display:'flex', alignItems:'center', gap:'4px', padding:'5px 10px', borderRadius:'8px', fontSize:'11px', cursor:'pointer', background:'transparent', border:'1px solid rgba(0,0,0,0.1)', color:'#888', transition:'all 0.15s' }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor=B; e.currentTarget.style.color=B; }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor='rgba(0,0,0,0.1)'; e.currentTarget.style.color='#888'; }}>
              <FiPlus size={11}/> New
            </button>
          )}
        </div>
      </div>

      {/* ── Main layout ─────────────────────────────────────────────────── */}
      <div style={{ flex:1, display:'flex', overflow:'hidden', flexDirection: isMobile?'column':'row' }}>

        {/* ── Left: Chat panel ──────────────────────────────────────────── */}
        <div style={{
          width: isMobile ? '100%' : '300px',
          flexShrink: 0,
          display:'flex', flexDirection:'column',
          borderRight: isMobile ? 'none' : '1px solid rgba(0,0,0,0.08)',
          borderBottom: isMobile ? '1px solid rgba(0,0,0,0.08)' : 'none',
          background:'#fff', overflow:'hidden',
          maxHeight: isMobile ? '260px' : undefined,
        }}>

          {/* Messages */}
          <div style={{ flex:1, overflowY:'auto', padding:'12px', display:'flex', flexDirection:'column', gap:'8px' }}>
            {messages.length === 0 ? (
              <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center' }}>
                <div style={{ marginBottom:'16px' }}>
                  <div style={{ fontSize:'15px', fontWeight:'700', color:'#0C0C0C', marginBottom:'4px', letterSpacing:'-0.02em' }}>What do you want to build?</div>
                  <div style={{ fontSize:'12px', color:'#999', lineHeight:'1.6' }}>Describe your idea and Airis generates working code with a live preview. Type to iterate.</div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                  {QUICK_IDEAS.map((idea, i) => (
                    <button key={i} onClick={() => { setInput(idea.text); inputRef.current?.focus(); }}
                      style={{
                        textAlign:'left', padding:'8px 10px', borderRadius:'8px', fontSize:'12px', lineHeight:'1.5',
                        background:'#F5F4F2', border:'1px solid transparent', color:'#555', cursor:'pointer',
                        transition:'all 0.15s',
                      }}
                      onMouseEnter={e=>{ e.currentTarget.style.background='rgba(67,125,253,0.06)'; e.currentTarget.style.borderColor='rgba(67,125,253,0.15)'; e.currentTarget.style.color='#437DFD'; }}
                      onMouseLeave={e=>{ e.currentTarget.style.background='#F5F4F2'; e.currentTarget.style.borderColor='transparent'; e.currentTarget.style.color='#555'; }}>
                      {idea.emoji} {idea.text.length > 52 ? idea.text.slice(0,52)+'…' : idea.text}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map(msg => <ChatMessage key={msg.id} msg={msg}/>)
            )}
            {isWorking && (
              <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px', borderRadius:'10px', background:'rgba(67,125,253,0.05)', border:'1px solid rgba(67,125,253,0.1)' }}>
                <div style={{ width:'28px', height:'28px', borderRadius:'8px', background:'linear-gradient(135deg,#437DFD,#2C76FF)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <FiZap size={13} style={{ color:'#fff', animation:'vcPulse 0.8s ease-in-out infinite' }}/>
                </div>
                <div>
                  <div style={{ fontSize:'11px', fontWeight:'600', color:B, marginBottom:'2px' }}>Airis is coding…</div>
                  <div style={{ display:'flex', gap:'4px' }}>
                    {[0,.15,.3].map((d,i)=><div key={i} style={{ width:'5px', height:'5px', borderRadius:'50%', background:'rgba(67,125,253,0.4)', animation:`vcPulse 1.2s ease-in-out ${d}s infinite` }}/>)}
                  </div>
                </div>
              </div>
            )}
            <div ref={msgsEndRef}/>
          </div>

          {/* Deps banner */}
          {deps.length > 0 && (
            <div style={{ padding:'6px 12px', background:'rgba(217,119,6,0.05)', borderTop:'1px solid rgba(217,119,6,0.1)', display:'flex', alignItems:'center', gap:'6px', flexShrink:0 }}>
              <FiPackage size={11} style={{ color:'#d97706', flexShrink:0 }}/>
              <code style={{ fontSize:'10px', color:'#d97706' }}>pip install {deps.join(' ')}</code>
              <button onClick={() => navigator.clipboard.writeText(`pip install ${deps.join(' ')}`)}
                style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'2px', padding:'2px 6px', borderRadius:'4px', fontSize:'10px', background:'transparent', border:'1px solid rgba(217,119,6,0.3)', color:'#d97706', cursor:'pointer' }}>
                <FiCopy size={8}/> Copy
              </button>
            </div>
          )}

          {/* Input area */}
          <div style={{ borderTop:'1px solid rgba(0,0,0,0.07)', padding:'10px', flexShrink:0 }}>
            <div style={{
              display:'flex', flexDirection:'column', gap:'8px',
              background:'#F5F4F2', border:`1.5px solid rgba(67,125,253,0.15)`, borderRadius:'12px', padding:'10px 10px 8px',
              transition:'border-color 0.15s, box-shadow 0.15s',
            }}
              onFocusCapture={e=>{ e.currentTarget.style.borderColor=B; e.currentTarget.style.boxShadow=`0 0 0 3px rgba(67,125,253,0.1)`; }}
              onBlurCapture={e=>{ e.currentTarget.style.borderColor='rgba(67,125,253,0.15)'; e.currentTarget.style.boxShadow='none'; }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => { setInput(e.target.value); autoResize(); }}
                onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={hasCode ? 'Describe a change… (Enter to apply)' : 'Describe what to build… (Enter to generate)'}
                rows={1}
                style={{ background:'transparent', border:'none', outline:'none', color:'#0C0C0C', fontSize:'13px', lineHeight:'1.65', resize:'none', fontFamily:'inherit', minHeight:'22px', maxHeight:'160px' }}
              />
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ display:'flex', gap:'4px' }}>
                  {SpeechRecognitionAPI && (
                    <button onClick={listening ? stopListening : startListening}
                      style={{ display:'flex', alignItems:'center', justifyContent:'center', width:'28px', height:'28px', borderRadius:'7px', border:'none', cursor:'pointer',
                        background: listening ? 'rgba(0,196,140,0.1)' : 'transparent',
                        color: listening ? '#00C48C' : '#bbb',
                        transition:'all 0.15s',
                      }}>
                      {listening ? <FiMic size={13}/> : <FiMicOff size={13}/>}
                    </button>
                  )}
                  {lang === 'python' && hasCode && (
                    <button onClick={() => { setViewTab('preview'); setRunTrigger(k=>k+1); }}
                      style={{ display:'flex', alignItems:'center', gap:'3px', padding:'4px 8px', borderRadius:'7px', border:'1px solid rgba(5,150,105,0.3)', cursor:'pointer', background:'transparent', color:'#059669', fontSize:'11px', fontWeight:'500' }}>
                      <FiPlay size={10}/> Run
                    </button>
                  )}
                </div>
                <button onClick={handleSend} disabled={!input.trim() || isWorking}
                  style={{
                    display:'flex', alignItems:'center', gap:'5px', padding:'6px 12px', borderRadius:'8px', border:'none', cursor: input.trim()&&!isWorking ? 'pointer' : 'not-allowed', fontSize:'12px', fontWeight:'600', transition:'all 0.18s',
                    background: input.trim()&&!isWorking ? `linear-gradient(135deg,${B},#2C76FF)` : 'rgba(67,125,253,0.08)',
                    color: input.trim()&&!isWorking ? '#fff' : 'rgba(67,125,253,0.3)',
                    boxShadow: input.trim()&&!isWorking ? '0 3px 12px rgba(67,125,253,0.35)' : 'none',
                  }}>
                  {isWorking ? <FiLoader size={12} style={{ animation:'vcSpin 1s linear infinite' }}/> : <FiSend size={12}/>}
                  {isWorking ? 'Working…' : hasCode ? 'Update' : 'Build'}
                </button>
              </div>
            </div>
            <div style={{ marginTop:'5px', textAlign:'center', fontSize:'10px', color:'#ccc' }}>Enter to {hasCode ? 'update' : 'generate'} · Shift+Enter for new line</div>
          </div>
        </div>

        {/* ── Right: Workspace ───────────────────────────────────────────── */}
        {!hasCode ? (
          <EmptyWorkspace/>
        ) : (
          <div style={{ flex:1, display:'flex', overflow:'hidden', flexDirection: effectiveTab==='split' ? (isMobile?'column':'row') : 'column' }}>

            {/* Code panel */}
            {(effectiveTab==='code' || effectiveTab==='split') && (
              <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0, minHeight:isMobile?'200px':undefined }}>
                <div style={{ height:'34px', background:'#161b22', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 14px', flexShrink:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <div style={{ display:'flex', gap:'5px' }}>
                      <div style={{ width:'9px', height:'9px', borderRadius:'50%', background:'#f87171' }}/>
                      <div style={{ width:'9px', height:'9px', borderRadius:'50%', background:'#fbbf24' }}/>
                      <div style={{ width:'9px', height:'9px', borderRadius:'50%', background:'#34d399' }}/>
                    </div>
                    <span style={{ fontSize:'11px', color:'#6b7280', fontFamily:'monospace' }}>
                      {lang === 'python' ? 'script.py' : lang === 'html' ? 'index.html' : lang === 'react' ? 'App.jsx' : lang === 'css' ? 'styles.css' : 'main.js'}
                    </span>
                    <span style={{ fontSize:'10px', padding:'1px 6px', borderRadius:'8px', background:'rgba(67,125,253,0.15)', color:B, border:`1px solid ${B}33` }}>{lang}</span>
                  </div>
                  <span style={{ fontSize:'10px', color:'#555', fontFamily:'monospace' }}>{code.split('\n').length} lines</span>
                </div>
                <div style={{ flex:1, overflowY:'auto', overflowX:'auto', background:DARK, padding:'16px 20px', fontFamily:"'Fira Code','Cascadia Code',Consolas,monospace", fontSize:'13px', lineHeight:'1.8' }}>
                  <pre style={{ margin:0, whiteSpace:'pre', color:'#abb2bf' }}>
                    <code dangerouslySetInnerHTML={{ __html: highlightCode(code) }}/>
                  </pre>
                </div>
              </div>
            )}

            {/* Divider (split mode) */}
            {effectiveTab === 'split' && !isMobile && (
              <div style={{ width:'1px', background:'rgba(255,255,255,0.06)', flexShrink:0 }}/>
            )}

            {/* Preview panel */}
            {(effectiveTab==='preview' || effectiveTab==='split') && (
              <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0, minHeight:isMobile?'240px':undefined }}>
                <div style={{ height:'34px', background:'#fff', borderBottom:'1px solid rgba(0,0,0,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 14px', flexShrink:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <div style={{ display:'flex', gap:'5px' }}>
                      <div style={{ width:'9px', height:'9px', borderRadius:'50%', background:'#f87171' }}/>
                      <div style={{ width:'9px', height:'9px', borderRadius:'50%', background:'#fbbf24' }}/>
                      <div style={{ width:'9px', height:'9px', borderRadius:'50%', background:'#34d399' }}/>
                    </div>
                    <span style={{ fontSize:'11px', color:'#888' }}>
                      {lang === 'python' ? 'Terminal' : 'Live Preview'}
                    </span>
                    {lang !== 'python' && <span style={{ fontSize:'10px', padding:'1px 6px', borderRadius:'8px', background:'rgba(0,196,140,0.1)', color:'#00C48C', border:'1px solid rgba(0,196,140,0.2)' }}>live</span>}
                  </div>
                  {lang !== 'python' && (
                    <button onClick={() => {}}
                      style={{ display:'flex', alignItems:'center', gap:'3px', padding:'2px 7px', borderRadius:'5px', fontSize:'10px', background:'transparent', border:'1px solid rgba(0,0,0,0.1)', color:'#aaa', cursor:'pointer' }}>
                      <FiRefreshCw size={9}/> Refresh
                    </button>
                  )}
                </div>
                {lang === 'python'
                  ? <PythonTerminal code={code} runTrigger={runTrigger}/>
                  : <LivePreview html={previewHtml} lang={lang} viewport={viewport}/>
                }
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes vcSpin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes vcPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </div>
  );
};

// ── Chat Message ───────────────────────────────────────────────────────────────

const ChatMessage = ({ msg }) => {
  const isUser  = msg.role === 'user';
  const isError = msg.role === 'error';
  const meta    = msg.meta;

  if (isUser) {
    return (
      <div style={{ display:'flex', justifyContent:'flex-end' }}>
        <div style={{
          maxWidth:'90%', padding:'9px 12px', borderRadius:'12px 12px 4px 12px',
          background:`linear-gradient(135deg,${B},#2C76FF)`,
          color:'#fff', fontSize:'13px', lineHeight:'1.6', wordBreak:'break-word',
          boxShadow:'0 2px 8px rgba(67,125,253,0.25)',
        }}>
          {msg.text}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ display:'flex', alignItems:'flex-start', gap:'8px' }}>
        <div style={{ width:'26px', height:'26px', borderRadius:'8px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <FiAlertCircle size={12} style={{ color:'#dc2626' }}/>
        </div>
        <div style={{ maxWidth:'90%', padding:'9px 12px', borderRadius:'4px 12px 12px 12px', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.15)', color:'#dc2626', fontSize:'12px', lineHeight:'1.6' }}>
          {msg.text}
        </div>
      </div>
    );
  }

  // Assistant message
  const agentMeta = meta?.agentId ? AGENT_META[meta.agentId] : null;
  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:'8px' }}>
      <div style={{
        width:'26px', height:'26px', borderRadius:'8px', flexShrink:0,
        background: agentMeta ? agentMeta.bg : 'rgba(67,125,253,0.1)',
        border: `1px solid ${agentMeta ? agentMeta.color+'30' : 'rgba(67,125,253,0.2)'}`,
        display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px',
      }}>
        {agentMeta ? agentMeta.emoji : '🤖'}
      </div>
      <div style={{ flex:1 }}>
        {meta?.type === 'built' && (
          <div style={{ display:'flex', gap:'5px', marginBottom:'5px', flexWrap:'wrap' }}>
            <span style={{ fontSize:'10px', padding:'2px 8px', borderRadius:'20px', background:'rgba(0,196,140,0.1)', color:'#00C48C', fontWeight:'600', border:'1px solid rgba(0,196,140,0.2)' }}>✓ Built</span>
            <span style={{ fontSize:'10px', padding:'2px 8px', borderRadius:'20px', background:'rgba(67,125,253,0.08)', color:B, border:`1px solid ${B}22` }}>{meta.lines} lines · {meta.lang}</span>
          </div>
        )}
        {meta?.type === 'updated' && (
          <div style={{ marginBottom:'4px' }}>
            <span style={{ fontSize:'10px', padding:'2px 8px', borderRadius:'20px', background:'rgba(67,125,253,0.08)', color:B, fontWeight:'600', border:`1px solid ${B}22` }}>↻ Updated</span>
          </div>
        )}
        <div style={{
          padding:'9px 12px', borderRadius:'4px 12px 12px 12px',
          background:'#F5F4F2', border:'1px solid rgba(0,0,0,0.07)',
          color:'#0C0C0C', fontSize:'12px', lineHeight:'1.7', wordBreak:'break-word',
        }}>
          {msg.text}
        </div>
      </div>
    </div>
  );
};

// ── CopyBtn ────────────────────────────────────────────────────────────────────

const CopyBtn = ({ text }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }}
      style={{ display:'flex', alignItems:'center', gap:'4px', padding:'5px 10px', borderRadius:'8px', fontSize:'11px', cursor:'pointer', transition:'all 0.15s', background: copied?'rgba(0,196,140,0.1)':'transparent', border:`1px solid ${copied?'rgba(0,196,140,0.3)':'rgba(0,0,0,0.1)'}`, color: copied?'#00C48C':'#888' }}>
      {copied ? <FiCheck size={11}/> : <FiCopy size={11}/>}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
};

// ── EmptyWorkspace ─────────────────────────────────────────────────────────────

const EmptyWorkspace = () => (
  <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'16px', background:'#F5F4F2', padding:'40px' }}>
    <div style={{ width:'72px', height:'72px', borderRadius:'20px', background:'rgba(67,125,253,0.08)', border:'1px solid rgba(67,125,253,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <FiCode size={30} style={{ color:'rgba(67,125,253,0.5)' }}/>
    </div>
    <div style={{ textAlign:'center', maxWidth:'320px' }}>
      <div style={{ fontSize:'16px', fontWeight:'700', color:'#0C0C0C', marginBottom:'6px', letterSpacing:'-0.02em' }}>Your code & preview appear here</div>
      <div style={{ fontSize:'13px', color:'#999', lineHeight:'1.7' }}>
        Type an idea in the chat panel on the left. The code and live preview will appear here side by side.
      </div>
    </div>
    <div style={{ display:'flex', gap:'8px', marginTop:'4px', flexWrap:'wrap', justifyContent:'center' }}>
      {['HTML', 'React', 'CSS', 'JavaScript', 'Python'].map(l => (
        <span key={l} style={{ fontSize:'11px', padding:'4px 12px', borderRadius:'20px', background:'rgba(67,125,253,0.06)', border:'1px solid rgba(67,125,253,0.12)', color:B, fontWeight:'500' }}>{l}</span>
      ))}
    </div>
  </div>
);

export default VibeCoder;
