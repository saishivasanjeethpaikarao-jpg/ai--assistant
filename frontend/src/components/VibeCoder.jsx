import { useState, useRef, useEffect, useCallback } from 'react';
import {
  FiCode, FiPlay, FiMic, FiMicOff, FiZap, FiTerminal,
  FiCopy, FiCheck, FiLoader, FiAlertCircle, FiEye, FiRefreshCw, FiMonitor,
} from 'react-icons/fi';

const SpeechRecognitionAPI =
  typeof window !== 'undefined' &&
  (window.SpeechRecognition || window.webkitSpeechRecognition);

const AGENT_COLORS = {
  frontend:   '#a78bfa',
  backend:    '#34d399',
  trading:    '#fbbf24',
  automation: '#f87171',
  debug:      '#fb923c',
};

// ── Language detection ──────────────────────────────────────────────────────

function detectLanguage(raw) {
  if (!raw) return 'unknown';
  const m = raw.match(/^```(\w+)/m);
  if (m) {
    const lang = m[1].toLowerCase();
    if (['html', 'htm'].includes(lang)) return 'html';
    if (['jsx', 'tsx', 'react'].includes(lang)) return 'react';
    if (['js', 'javascript', 'ts', 'typescript'].includes(lang)) return 'javascript';
    if (lang === 'css') return 'css';
    if (['python', 'py'].includes(lang)) return 'python';
    return lang;
  }
  const clean = raw.trim();
  if (clean.startsWith('<!DOCTYPE') || clean.startsWith('<html')) return 'html';
  if (/import React|from 'react'|from "react"/.test(clean)) return 'react';
  if (/<[A-Z][a-zA-Z]+/.test(clean) && /return\s*\(/.test(clean)) return 'react';
  if (clean.includes('def ') || clean.includes('import ') && !clean.includes('from \'react\'')) return 'python';
  return 'unknown';
}

function canPreview(lang) {
  return ['html', 'react', 'javascript', 'css'].includes(lang);
}

function buildPreviewHtml(code, lang) {
  const baseStyle = `
    body { margin: 0; padding: 16px; background: #0f0f0f; color: #e8e8e8;
           font-family: system-ui, -apple-system, sans-serif; }
    * { box-sizing: border-box; }
    ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #1a1a1a; }
    ::-webkit-scrollbar-thumb { background: #3a3a3a; border-radius: 3px; }
  `;

  if (lang === 'html') {
    if (code.trim().startsWith('<!DOCTYPE') || code.trim().startsWith('<html')) return code;
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>${baseStyle}</style></head><body>${code}</body></html>`;
  }

  if (lang === 'react') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<script src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<style>${baseStyle}
  #__err { padding: 12px 16px; background: #1a0a0a; border: 1px solid #4a1a1a;
           border-radius: 6px; color: #f87171; font-size: 12px; font-family: monospace;
           white-space: pre-wrap; margin: 16px; }
</style>
</head><body>
<div id="root"></div>
<script type="text/babel" data-presets="react">
${code}
;(function(){
  const root = document.getElementById('root');
  const names = ['App','Dashboard','Home','Main','Page','Component','Layout','UI','Widget'];
  let Comp = null;
  for(const n of names){ try{ if(typeof eval(n) !== 'undefined'){ Comp = eval(n); break; } }catch(e){} }
  if(!Comp){
    const fns = Object.keys(window).filter(k => /^[A-Z]/.test(k) && typeof window[k]==='function');
    if(fns.length) Comp = window[fns[0]];
  }
  try {
    if(Comp) ReactDOM.createRoot(root).render(React.createElement(Comp));
    else root.innerHTML = '<div id="__err">No mountable component found.\\nMake sure your component is named App, Dashboard, etc.</div>';
  } catch(e) {
    root.innerHTML = '<div id="__err">Render error: ' + e.message + '</div>';
  }
})();
</script></body></html>`;
  }

  if (lang === 'javascript') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>${baseStyle}
  #out { font-family: 'Cascadia Code', 'Fira Code', monospace; font-size: 12px;
         line-height: 1.6; white-space: pre-wrap; }
  .err { color: #f87171; } .log { color: #abb2bf; }
</style></head><body>
<div id="out"></div>
<script>
const out = document.getElementById('out');
const _log = console.log;
console.log = (...a) => { out.innerHTML += '<span class="log">' + a.map(x=>typeof x==='object'?JSON.stringify(x,null,2):String(x)).join(' ') + '\\n</span>'; _log(...a); };
console.error = (...a) => { out.innerHTML += '<span class="err">ERROR: ' + a.join(' ') + '\\n</span>'; };
try { ${code} } catch(e) { out.innerHTML += '<span class="err">Error: ' + e.message + '</span>'; }
</script></body></html>`;
  }

  if (lang === 'css') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>${baseStyle}${code}</style></head>
<body>
<div class="container">
  <div class="card"><h1 class="title">Preview</h1><p class="text">Sample content to preview your CSS styles.</p>
    <button class="btn">Click me</button></div>
  <nav class="nav"><a class="nav-link" href="#">Home</a><a class="nav-link" href="#">About</a></nav>
  <div class="grid"><div class="item">Item 1</div><div class="item">Item 2</div><div class="item">Item 3</div></div>
</div>
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
    <button onClick={() => onClick(agent.id)}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      title={agent.desc}
      style={{
        display:'flex', alignItems:'center', gap:'6px', padding:'5px 12px',
        borderRadius:'20px', whiteSpace:'nowrap', flexShrink:0,
        backgroundColor: active ? color+'22' : hov ? '#1a1a1a' : 'transparent',
        border:`1px solid ${active ? color : hov ? '#2a2a2a' : '#1e1e1e'}`,
        color: active ? color : hov ? '#aaa' : '#606060',
        fontSize:'12px', fontWeight: active?'600':'400',
        cursor:'pointer', transition:'all 0.15s',
      }}>
      <span>{agent.emoji}</span><span>{agent.label}</span>
    </button>
  );
};

const CopyBtn = ({ text }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(()=>setCopied(false),1500); }); }}
      title="Copy code"
      style={{
        display:'flex', alignItems:'center', gap:'4px', padding:'3px 8px',
        borderRadius:'4px', fontSize:'11px', cursor:'pointer', transition:'all 0.15s',
        backgroundColor: copied?'#0a2a1a':'transparent',
        border:`1px solid ${copied?'#10b98166':'#2a2a2a'}`,
        color: copied?'#10b981':'#5a5a5a',
      }}>
      {copied ? <FiCheck size={11}/> : <FiCopy size={11}/>}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
};

const TabBtn = ({ active, onClick, children }) => (
  <button onClick={onClick} style={{
    display:'flex', alignItems:'center', gap:'5px',
    padding:'0 14px', height:'100%', border:'none',
    borderBottom: active ? '2px solid #a78bfa' : '2px solid transparent',
    backgroundColor:'transparent', color: active?'#e8e8e8':'#5a5a5a',
    fontSize:'12px', cursor:'pointer', transition:'all 0.15s', fontWeight: active?'500':'400',
  }}>{children}</button>
);

// ── Preview iframe ──────────────────────────────────────────────────────────

const LivePreview = ({ html, lang, onRefresh }) => {
  const iframeRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState(0);

  const refresh = () => { setKey(k=>k+1); setLoading(true); onRefresh?.(); };

  if (!html) {
    return (
      <div style={{
        flex:1, display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center', gap:'12px',
        backgroundColor:'#0d0d0d',
      }}>
        <FiMonitor size={32} style={{color:'#2a2a2a'}}/>
        <div style={{fontSize:'13px', color:'#4a4a4a'}}>No visual preview for {lang} code</div>
        <div style={{fontSize:'11px', color:'#3a3a3a', textAlign:'center', maxWidth:'280px', lineHeight:'1.6'}}>
          Use <strong style={{color:'#5a5a5a'}}>Run Python</strong> to execute and see output in the terminal below.
        </div>
      </div>
    );
  }

  return (
    <div style={{flex:1, display:'flex', flexDirection:'column', position:'relative', backgroundColor:'#0d0d0d'}}>
      {/* Preview toolbar */}
      <div style={{
        height:'30px', backgroundColor:'#0f0f0f', borderBottom:'1px solid #1a1a1a',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0 12px', flexShrink:0,
      }}>
        <div style={{display:'flex', alignItems:'center', gap:'6px'}}>
          <div style={{width:'8px', height:'8px', borderRadius:'50%', backgroundColor:'#f87171'}}/>
          <div style={{width:'8px', height:'8px', borderRadius:'50%', backgroundColor:'#fbbf24'}}/>
          <div style={{width:'8px', height:'8px', borderRadius:'50%', backgroundColor:'#34d399'}}/>
          <span style={{fontSize:'11px', color:'#3a3a3a', marginLeft:'6px'}}>Live Preview</span>
          {lang === 'react' && (
            <span style={{
              fontSize:'10px', padding:'1px 6px', borderRadius:'10px',
              backgroundColor:'#1a0f2a', border:'1px solid #a78bfa33', color:'#a78bfa',
            }}>React + Babel</span>
          )}
        </div>
        <button onClick={refresh} title="Refresh preview"
          style={{
            display:'flex', alignItems:'center', gap:'4px',
            padding:'2px 8px', borderRadius:'4px', fontSize:'11px',
            backgroundColor:'transparent', border:'1px solid #2a2a2a',
            color:'#5a5a5a', cursor:'pointer', transition:'all 0.15s',
          }}
          onMouseEnter={e=>{e.currentTarget.style.color='#aaa';e.currentTarget.style.borderColor='#3a3a3a';}}
          onMouseLeave={e=>{e.currentTarget.style.color='#5a5a5a';e.currentTarget.style.borderColor='#2a2a2a';}}
        >
          <FiRefreshCw size={10}/> Refresh
        </button>
      </div>

      {loading && (
        <div style={{
          position:'absolute', top:'30px', left:0, right:0, bottom:0,
          display:'flex', alignItems:'center', justifyContent:'center',
          backgroundColor:'#0d0d0d', zIndex:1,
        }}>
          <div style={{display:'flex', gap:'6px'}}>
            {[0,0.15,0.3].map((d,i)=>(
              <div key={i} style={{
                width:'6px', height:'6px', borderRadius:'50%',
                backgroundColor:'#a78bfa',
                animation:`pulse 1.2s ease-in-out ${d}s infinite`,
              }}/>
            ))}
          </div>
        </div>
      )}

      <iframe
        key={key}
        ref={iframeRef}
        srcDoc={html}
        sandbox="allow-scripts allow-modals"
        title="Live Preview"
        onLoad={() => setLoading(false)}
        style={{
          flex:1, border:'none', width:'100%',
          backgroundColor:'#0f0f0f',
          opacity: loading ? 0 : 1, transition:'opacity 0.2s',
        }}
      />
    </div>
  );
};

// ── Main component ──────────────────────────────────────────────────────────

const VibeCoder = ({ initialPrompt = '' }) => {
  const [agents, setAgents] = useState([
    { id:'frontend',   name:'FrontendAgent',  emoji:'🎨', label:'Frontend',   color:'#a78bfa', desc:'React, HTML, CSS, UI/UX' },
    { id:'backend',    name:'BackendAgent',    emoji:'⚙️', label:'Backend',    color:'#34d399', desc:'Python, APIs, databases' },
    { id:'trading',    name:'TradingAgent',    emoji:'📈', label:'Trading',    color:'#fbbf24', desc:'NSE/BSE, yfinance, pandas' },
    { id:'automation', name:'AutomationAgent', emoji:'🤖', label:'Automation', color:'#f87171', desc:'Windows automation, scripts' },
    { id:'debug',      name:'DebugAgent',      emoji:'🔍', label:'Debug',      color:'#fb923c', desc:'Find and fix bugs' },
  ]);
  const [selectedAgent, setSelectedAgent] = useState('auto');
  const [prompt, setPrompt]   = useState(initialPrompt);
  const [isBuilding, setIsBuilding] = useState(false);
  const [isRunning,  setIsRunning]  = useState(false);
  const [result,     setResult]     = useState(null);
  const [terminalOutput, setTerminalOutput] = useState(null);
  const [listening,  setListening]  = useState(false);
  const [error,      setError]      = useState('');
  const [viewMode,   setViewMode]   = useState('code'); // 'code' | 'preview'
  const [previewKey, setPreviewKey] = useState(0);
  const textareaRef = useRef(null);
  const recRef      = useRef(null);

  useEffect(() => {
    fetch('/api/vibe/agents').then(r=>r.json()).then(d=>{ if(d.agents) setAgents(d.agents); }).catch(()=>{});
  }, []);

  useEffect(() => { if (initialPrompt) setPrompt(initialPrompt); }, [initialPrompt]);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  };

  const extractCode = (raw) => {
    if (!raw) return '';
    const m = raw.match(/```(?:python|javascript|jsx|tsx|js|ts|html|css|bash|sh|sql|react)?\n?([\s\S]*?)```/);
    return m ? m[1].trim() : raw;
  };

  const handleBuild = async () => {
    if (!prompt.trim() || isBuilding) return;
    setIsBuilding(true); setError(''); setResult(null); setTerminalOutput(null);
    try {
      const r = await fetch('/api/vibe/code', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ prompt: prompt.trim(), agent_id: selectedAgent }),
      });
      const d = await r.json();
      if (!r.ok || d.error) throw new Error(d.error || 'Backend error');
      setResult(d);
      // Auto-switch to preview for visual languages
      const lang = detectLanguage(d.code || '');
      if (canPreview(lang)) {
        setViewMode('preview');
        setPreviewKey(k=>k+1);
      } else {
        setViewMode('code');
      }
    } catch(e) {
      setError(e.message || 'Failed to generate code');
    } finally {
      setIsBuilding(false);
    }
  };

  const handleRun = async () => {
    if (!result?.code || isRunning) return;
    setIsRunning(true); setTerminalOutput(null);
    try {
      const r = await fetch('/api/vibe/run', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ code: result.code, language:'python' }),
      });
      const d = await r.json();
      setTerminalOutput(d);
    } catch(e) {
      setTerminalOutput({ success:false, error:e.message, output:'' });
    } finally {
      setIsRunning(false);
    }
  };

  const startListening = useCallback(() => {
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

  const stopListening = useCallback(() => { recRef.current?.stop(); setListening(false); },[]);

  const activeAgent = agents.find(a=>a.id===selectedAgent);
  const rawCode     = result ? extractCode(result.code) : '';
  const codeLang    = result ? detectLanguage(result.code || '') : 'unknown';
  const previewHtml = result ? buildPreviewHtml(rawCode, codeLang) : null;
  const agentInfo   = result ? agents.find(a=>a.id===result.agent_id)||{emoji:'⚙️',name:result.agent_id} : null;
  const agentColor  = result ? (AGENT_COLORS[result.agent_id]||'#a78bfa') : '#a78bfa';

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', backgroundColor:'#0a0a0a', overflow:'hidden', minWidth:0 }}>

      {/* Top tab bar */}
      <div style={{
        height:'36px', backgroundColor:'#111111', borderBottom:'1px solid #1e1e1e',
        display:'flex', alignItems:'stretch', flexShrink:0,
      }}>
        <div style={{
          display:'flex', alignItems:'center', padding:'0 16px',
          borderRight:'1px solid #1e1e1e', borderBottom:'1px solid #a78bfa',
          backgroundColor:'#0a0a0a', fontSize:'13px', color:'#e8e8e8', gap:'6px',
        }}>
          <FiCode size={13} style={{color:'#a78bfa'}}/>
          <span>vibe-coder</span>
        </div>
        <div style={{display:'flex', alignItems:'center', padding:'0 16px', fontSize:'11px', color:'#3a3a3a', gap:'6px'}}>
          <FiZap size={11} style={{color:'#a78bfa'}}/>
          <span>5 specialist agents · Auto-routes · Live preview</span>
        </div>
      </div>

      {/* 3-column layout */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

        {/* ── Left: Prompt pane ─────────────────────────────────────────── */}
        <div style={{
          width:'340px', flexShrink:0, display:'flex', flexDirection:'column',
          borderRight:'1px solid #1e1e1e', backgroundColor:'#0d0d0d',
        }}>
          {/* Agent selector */}
          <div style={{
            padding:'12px 14px 10px', borderBottom:'1px solid #1a1a1a',
            display:'flex', flexDirection:'column', gap:'8px', flexShrink:0,
          }}>
            <div style={{fontSize:'10px', color:'#3a3a3a', letterSpacing:'0.08em', textTransform:'uppercase'}}>
              Specialist Agent
            </div>
            <div style={{display:'flex', flexWrap:'wrap', gap:'5px'}}>
              <button onClick={()=>setSelectedAgent('auto')} style={{
                display:'flex', alignItems:'center', gap:'5px', padding:'4px 10px',
                borderRadius:'20px', fontSize:'12px', cursor:'pointer', transition:'all 0.15s',
                backgroundColor: selectedAgent==='auto'?'#3b82f622':'transparent',
                border:`1px solid ${selectedAgent==='auto'?'#3b82f6':'#1e1e1e'}`,
                color: selectedAgent==='auto'?'#3b82f6':'#606060',
              }}>
                <FiZap size={10}/><span>Auto</span>
              </button>
              {agents.map(a=>(
                <AgentPill key={a.id} agent={a} active={selectedAgent===a.id} onClick={setSelectedAgent}/>
              ))}
            </div>
            {selectedAgent!=='auto' && activeAgent && (
              <div style={{fontSize:'11px', color:'#4a4a4a', lineHeight:'1.4'}}>
                {activeAgent.emoji} {activeAgent.desc}
              </div>
            )}
          </div>

          {/* Prompt textarea */}
          <div style={{flex:1, display:'flex', flexDirection:'column', padding:'12px 14px', gap:'10px', overflow:'hidden'}}>
            <div style={{fontSize:'10px', color:'#3a3a3a', letterSpacing:'0.08em', textTransform:'uppercase'}}>
              Describe what to build
            </div>
            <div style={{
              flex:1, backgroundColor:'#111111', border:'1px solid #2a2a2a',
              borderRadius:'6px', display:'flex', flexDirection:'column', transition:'border-color 0.15s', minHeight:0,
            }}
              onFocusCapture={e=>e.currentTarget.style.borderColor='#a78bfa55'}
              onBlurCapture={e=>e.currentTarget.style.borderColor='#2a2a2a'}
            >
              <textarea ref={textareaRef} value={prompt}
                onChange={e=>{setPrompt(e.target.value);autoResize();}}
                onKeyDown={e=>{ if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)) handleBuild(); }}
                placeholder={`Describe what to build...\n\nExamples:\n• React dark dashboard with charts\n• FastAPI JWT auth API\n• NIFTY 50 RSI screener\n• Auto-rename files script\n• Debug my Python code\n\nCtrl+Enter to build`}
                style={{
                  flex:1, minHeight:'140px', backgroundColor:'transparent',
                  border:'none', outline:'none', color:'#e8e8e8',
                  fontSize:'13px', lineHeight:'1.7', resize:'none',
                  fontFamily:"'Geist', sans-serif", padding:'12px',
                }}
              />
            </div>

            {/* Buttons */}
            <div style={{display:'flex', gap:'8px', flexShrink:0}}>
              {SpeechRecognitionAPI && (
                <button onClick={listening?stopListening:startListening} title={listening?'Stop':'Voice input'}
                  style={{
                    width:'38px', height:'38px', display:'flex', alignItems:'center', justifyContent:'center',
                    borderRadius:'6px', flexShrink:0, cursor:'pointer', transition:'all 0.15s',
                    backgroundColor: listening?'#0a2a1a':'#111111',
                    border:`1px solid ${listening?'#10b98166':'#2a2a2a'}`,
                    color: listening?'#10b981':'#5a5a5a',
                    animation: listening?'pulse 1.5s ease-in-out infinite':'none',
                  }}>
                  {listening?<FiMic size={15}/>:<FiMicOff size={15}/>}
                </button>
              )}
              <button onClick={handleBuild} disabled={!prompt.trim()||isBuilding}
                style={{
                  flex:1, height:'38px', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                  borderRadius:'6px', border:'none', fontSize:'13px', fontWeight:'600', transition:'all 0.15s',
                  backgroundColor:(prompt.trim()&&!isBuilding)?'#a78bfa':'#1a1a1a',
                  color:(prompt.trim()&&!isBuilding)?'#ffffff':'#3a3a3a',
                  cursor:(prompt.trim()&&!isBuilding)?'pointer':'not-allowed',
                }}>
                {isBuilding
                  ? <><FiLoader size={14} style={{animation:'spin 1s linear infinite'}}/><span>Building...</span></>
                  : <><FiZap size={14}/><span>Build (Ctrl+↵)</span></>
                }
              </button>
            </div>

            {error && (
              <div style={{
                display:'flex', alignItems:'flex-start', gap:'8px',
                padding:'10px 12px', borderRadius:'6px', flexShrink:0,
                backgroundColor:'#1a0a0a', border:'1px solid #4a1a1a',
                color:'#f87171', fontSize:'12px', lineHeight:'1.5',
              }}>
                <FiAlertCircle size={13} style={{flexShrink:0, marginTop:'1px'}}/>
                <span>{error}</span>
              </div>
            )}

            {/* Quick ideas */}
            {!result && !isBuilding && (
              <div style={{padding:'10px 12px', borderRadius:'6px', backgroundColor:'#111111', border:'1px solid #1a1a1a', flexShrink:0}}>
                <div style={{fontSize:'10px', color:'#3a3a3a', letterSpacing:'0.06em', marginBottom:'8px', textTransform:'uppercase'}}>
                  Quick ideas
                </div>
                {[
                  '🎨 React dark dashboard with charts',
                  '🎨 Animated landing page with CSS',
                  '⚙️ FastAPI user auth with JWT',
                  '📈 NIFTY RSI momentum screener',
                  '🤖 Auto-rename files in folder',
                ].map((tip,i)=>(
                  <button key={i}
                    onClick={()=>{ setPrompt(tip.slice(3)); setTimeout(autoResize,10); }}
                    style={{
                      display:'block', width:'100%', textAlign:'left',
                      padding:'5px 0', backgroundColor:'transparent', border:'none',
                      color:'#4a4a4a', fontSize:'12px', cursor:'pointer',
                      transition:'color 0.1s', lineHeight:'1.5',
                    }}
                    onMouseEnter={e=>e.currentTarget.style.color='#8b8b8b'}
                    onMouseLeave={e=>e.currentTarget.style.color='#4a4a4a'}
                  >{tip}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Code + Preview ─────────────────────────────────────── */}
        <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}>

          {isBuilding ? (
            <div style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'16px'}}>
              <div style={{
                width:'56px', height:'56px', borderRadius:'14px',
                backgroundColor:'#111111', border:'1px solid #a78bfa33',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <FiZap size={24} style={{color:'#a78bfa', animation:'pulse 1s ease-in-out infinite'}}/>
              </div>
              <div style={{fontSize:'14px', color:'#6a6a6a'}}>
                {selectedAgent==='auto' ? 'Routing to specialist agent...' : `${activeAgent?.emoji} ${activeAgent?.name} is coding...`}
              </div>
              <div style={{display:'flex', gap:'6px'}}>
                {[0,0.2,0.4].map((d,i)=>(
                  <div key={i} style={{
                    width:'6px', height:'6px', borderRadius:'50%', backgroundColor:'#a78bfa',
                    animation:`pulse 1.2s ease-in-out ${d}s infinite`,
                  }}/>
                ))}
              </div>
            </div>

          ) : result ? (
            <>
              {/* Code/Preview tab header */}
              <div style={{
                height:'36px', backgroundColor:'#111111', borderBottom:'1px solid #1e1e1e',
                display:'flex', alignItems:'stretch', justifyContent:'space-between',
                flexShrink:0,
              }}>
                <div style={{display:'flex', alignItems:'stretch'}}>
                  <TabBtn active={viewMode==='code'} onClick={()=>setViewMode('code')}>
                    <FiCode size={12}/> Code
                  </TabBtn>
                  <TabBtn active={viewMode==='preview'} onClick={()=>setViewMode('preview')}>
                    <FiEye size={12}/> Preview
                    {canPreview(codeLang) && (
                      <span style={{
                        fontSize:'10px', padding:'1px 5px', borderRadius:'8px',
                        backgroundColor: viewMode==='preview'?'#a78bfa22':'#1a1a1a',
                        border:'1px solid #a78bfa44', color:'#a78bfa', marginLeft:'2px',
                      }}>live</span>
                    )}
                  </TabBtn>
                  <div style={{display:'flex', alignItems:'center', padding:'0 10px', gap:'6px'}}>
                    <span style={{fontSize:'12px'}}>{agentInfo?.emoji}</span>
                    <span style={{fontSize:'11px', color:agentColor, fontWeight:'500'}}>{agentInfo?.name}</span>
                    <span style={{
                      fontSize:'10px', padding:'1px 6px', borderRadius:'10px',
                      backgroundColor: agentColor+'11', border:`1px solid ${agentColor}33`, color:agentColor,
                    }}>{codeLang}</span>
                  </div>
                </div>
                <div style={{display:'flex', alignItems:'center', gap:'8px', paddingRight:'14px'}}>
                  <CopyBtn text={rawCode}/>
                  {codeLang==='python' && (
                    <button onClick={handleRun} disabled={isRunning}
                      style={{
                        display:'flex', alignItems:'center', gap:'5px',
                        padding:'3px 10px', borderRadius:'4px', fontSize:'11px', transition:'all 0.15s',
                        backgroundColor: isRunning?'#0a1a0a':'#0a2a1a',
                        border:`1px solid ${isRunning?'#1a3a1a':'#10b98166'}`,
                        color: isRunning?'#3a8a5a':'#10b981',
                        cursor: isRunning?'not-allowed':'pointer',
                      }}>
                      {isRunning?<FiLoader size={11} style={{animation:'spin 1s linear infinite'}}/>:<FiPlay size={11}/>}
                      <span>{isRunning?'Running...':'Run Python'}</span>
                    </button>
                  )}
                  {canPreview(codeLang) && viewMode==='preview' && (
                    <button onClick={()=>setPreviewKey(k=>k+1)} title="Refresh preview"
                      style={{
                        display:'flex', alignItems:'center', gap:'4px', padding:'3px 8px',
                        borderRadius:'4px', fontSize:'11px', cursor:'pointer', transition:'all 0.15s',
                        backgroundColor:'transparent', border:'1px solid #2a2a2a', color:'#5a5a5a',
                      }}
                      onMouseEnter={e=>e.currentTarget.style.color='#aaa'}
                      onMouseLeave={e=>e.currentTarget.style.color='#5a5a5a'}
                    >
                      <FiRefreshCw size={11}/> Refresh
                    </button>
                  )}
                </div>
              </div>

              {/* Code view */}
              {viewMode==='code' && (
                <div style={{
                  flex:1, overflowY:'auto', overflowX:'auto',
                  padding:'16px 20px', backgroundColor:'#0d0d0d',
                  fontFamily:"'Geist Mono','Fira Code','Cascadia Code',monospace",
                  fontSize:'13px', lineHeight:'1.7',
                }}>
                  <pre style={{margin:0, whiteSpace:'pre', color:'#abb2bf'}}>
                    <code dangerouslySetInnerHTML={{__html: highlightCode(rawCode||result.code)}}/>
                  </pre>
                </div>
              )}

              {/* Preview view */}
              {viewMode==='preview' && (
                <LivePreview
                  key={previewKey}
                  html={previewHtml}
                  lang={codeLang}
                  onRefresh={()=>setPreviewKey(k=>k+1)}
                />
              )}

              {/* Terminal panel */}
              {terminalOutput && (
                <div style={{
                  height:'200px', flexShrink:0, display:'flex', flexDirection:'column',
                  borderTop:'1px solid #1e1e1e', backgroundColor:'#080808',
                }}>
                  <div style={{
                    height:'30px', backgroundColor:'#0f0f0f', borderBottom:'1px solid #1a1a1a',
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'0 14px', flexShrink:0,
                  }}>
                    <div style={{display:'flex', alignItems:'center', gap:'6px'}}>
                      <FiTerminal size={12} style={{color:'#4a4a4a'}}/>
                      <span style={{fontSize:'11px', color:'#4a4a4a'}}>Terminal Output</span>
                      <span style={{
                        fontSize:'10px', padding:'1px 6px', borderRadius:'10px',
                        backgroundColor: terminalOutput.success?'#0a2a1a':'#2a0a0a',
                        color: terminalOutput.success?'#10b981':'#f87171',
                        border:`1px solid ${terminalOutput.success?'#10b98133':'#f8717133'}`,
                      }}>
                        {terminalOutput.success?'✓ Success':'✗ Error'}
                      </span>
                      {terminalOutput.runtime_ms>0 && (
                        <span style={{fontSize:'10px', color:'#3a3a3a'}}>{terminalOutput.runtime_ms}ms</span>
                      )}
                    </div>
                    <button onClick={()=>setTerminalOutput(null)}
                      style={{background:'none', border:'none', color:'#3a3a3a', cursor:'pointer', fontSize:'16px', lineHeight:1, padding:'0 4px'}}>
                      ×
                    </button>
                  </div>
                  <div style={{flex:1, overflowY:'auto', padding:'10px 14px'}}>
                    {terminalOutput.output && (
                      <pre style={{margin:0, fontFamily:"'Geist Mono',monospace", fontSize:'12px', color:'#a8cc8c', lineHeight:'1.6', whiteSpace:'pre-wrap', wordBreak:'break-word'}}>
                        {terminalOutput.output}
                      </pre>
                    )}
                    {terminalOutput.error && (
                      <pre style={{margin:terminalOutput.output?'8px 0 0':0, fontFamily:"'Geist Mono',monospace", fontSize:'12px', color:'#f87171', lineHeight:'1.6', whiteSpace:'pre-wrap', wordBreak:'break-word'}}>
                        {terminalOutput.error}
                      </pre>
                    )}
                    {!terminalOutput.output && !terminalOutput.error && (
                      <span style={{color:'#3a3a3a', fontSize:'12px'}}>(no output)</span>
                    )}
                  </div>
                </div>
              )}
            </>

          ) : (
            /* Empty state */
            <div style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'12px', padding:'40px'}}>
              <div style={{
                width:'64px', height:'64px', borderRadius:'16px',
                backgroundColor:'#111111', border:'1px solid #1e1e1e',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <FiCode size={28} style={{color:'#2a2a2a'}}/>
              </div>
              <div style={{fontSize:'15px', color:'#4a4a4a', fontWeight:'500'}}>Describe what you want to build</div>
              <div style={{fontSize:'12px', color:'#3a3a3a', textAlign:'center', maxWidth:'360px', lineHeight:'1.7'}}>
                The specialist agent is auto-selected. Generated code appears here with syntax highlighting.
                HTML and React components open directly in the <strong style={{color:'#5a5a5a'}}>Live Preview</strong> tab.
              </div>
              <div style={{display:'flex', gap:'8px', marginTop:'4px', flexWrap:'wrap', justifyContent:'center'}}>
                {agents.map(a=>(
                  <span key={a.id} style={{
                    fontSize:'11px', padding:'3px 10px', borderRadius:'20px',
                    backgroundColor:'#111111', border:'1px solid #1e1e1e',
                    color:AGENT_COLORS[a.id]||'#5a5a5a',
                  }}>{a.emoji} {a.label}</span>
                ))}
              </div>
              <div style={{
                display:'flex', alignItems:'center', gap:'8px',
                padding:'8px 16px', borderRadius:'8px', marginTop:'8px',
                backgroundColor:'#111111', border:'1px solid #1a1a1a',
              }}>
                <FiEye size={13} style={{color:'#a78bfa'}}/>
                <span style={{fontSize:'11px', color:'#5a5a5a'}}>
                  HTML & React code auto-opens in Live Preview · Python runs in terminal
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
};

export default VibeCoder;
