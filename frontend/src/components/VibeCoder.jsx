import { useState, useRef, useEffect, useCallback } from 'react';
import {
  FiCode, FiPlay, FiMic, FiMicOff, FiZap, FiTerminal,
  FiCopy, FiCheck, FiLoader, FiAlertCircle, FiEye, FiRefreshCw,
  FiMonitor, FiSend, FiPlus, FiColumns, FiSmartphone, FiTablet,
  FiFolder, FiFile, FiTrash2, FiDownload, FiUpload, FiEdit3,
  FiChevronRight, FiChevronDown, FiX, FiMessageSquare,
  FiArrowLeft, FiImage, FiMoreVertical,
} from 'react-icons/fi';

// ── Storage ───────────────────────────────────────────────────────────────────
const PK  = 'airis_vp';
const FK  = id => `airis_vf_${id}`;
const LP  = () => { try { return JSON.parse(localStorage.getItem(PK) || '[]'); } catch { return []; } };
const SP  = p  => localStorage.setItem(PK, JSON.stringify(p));
const LF  = id => { try { return JSON.parse(localStorage.getItem(FK(id)) || '[]'); } catch { return []; } };
const SF  = (id,f) => localStorage.setItem(FK(id), JSON.stringify(f));

// ── Helpers ───────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const ts  = () => Date.now();

function getExt(name) { return (name.split('.').pop() || '').toLowerCase(); }

function getFileType(name) {
  const map = { html:'html', htm:'html', css:'css', js:'javascript', jsx:'react',
    ts:'typescript', tsx:'react', py:'python', json:'json', md:'markdown',
    txt:'text', png:'image', jpg:'image', jpeg:'image', gif:'image', svg:'image', webp:'image' };
  return map[getExt(name)] || 'text';
}

function getFileIcon(name) {
  const t = getFileType(name);
  const map = { html:'🌐', css:'🎨', javascript:'⚡', react:'⚛️', typescript:'💎',
    python:'🐍', json:'{ }', markdown:'📝', image:'🖼️', text:'📄' };
  return map[t] || '📄';
}

function langFromType(t) {
  const m = { html:'html', css:'css', javascript:'javascript', react:'react', typescript:'javascript', python:'python', json:'json', markdown:'text', text:'text' };
  return m[t] || 'text';
}

const SpeechRecognitionAPI = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

function detectLanguage(raw) {
  if (!raw) return 'unknown';
  const m = raw.match(/^```(\w+)/m);
  if (m) {
    const l = m[1].toLowerCase();
    if (['html','htm'].includes(l)) return 'html';
    if (['jsx','tsx','react'].includes(l)) return 'react';
    if (['js','javascript'].includes(l)) return 'javascript';
    if (l === 'css') return 'css';
    if (['py','python'].includes(l)) return 'python';
    return l;
  }
  const c = raw.trim();
  if (c.startsWith('<!DOCTYPE') || c.startsWith('<html')) return 'html';
  if (/import React|from 'react'/.test(c)) return 'react';
  return 'unknown';
}

function extractCode(raw) {
  if (!raw) return '';
  const m = raw.match(/```(?:\w+)?\n?([\s\S]*?)```/);
  return m ? m[1].trim() : raw.trim();
}

function extractFilenameFromReply(reply) {
  const m = reply.match(/(?:file|filename|create|named?|called?)\s+[`"']?([\w.-]+\.\w+)[`"']?/i)
    || reply.match(/`([\w.-]+\.\w+)`/);
  return m ? m[1] : null;
}

function downloadBlob(name, content, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

// ── Preview builder ───────────────────────────────────────────────────────────
function buildProjectPreview(files, activeFile) {
  if (!files.length) return null;
  const htmlFile = files.find(f => f.name === 'index.html')
    || files.find(f => getFileType(f.name) === 'html');

  if (!htmlFile && activeFile) {
    const t = getFileType(activeFile.name);
    if (t === 'css') return buildSinglePreview(activeFile.content, 'css');
    if (['javascript','react'].includes(t)) return buildSinglePreview(activeFile.content, t);
    return null;
  }
  if (!htmlFile) return null;

  let html = htmlFile.content;
  // Inline linked CSS
  html = html.replace(/<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*\/?>/gi, (_, href) => {
    const f = files.find(f => f.name === href || f.name.endsWith(href));
    return f ? `<style>${f.content}</style>` : '';
  });
  // Inline linked JS
  html = html.replace(/<script[^>]+src=["']([^"']+)["'][^>]*><\/script>/gi, (_, src) => {
    const f = files.find(f => f.name === src || f.name.endsWith(src));
    return f ? `<script>${f.content}</script>` : '';
  });
  return html;
}

function buildSinglePreview(code, lang) {
  const base = `*{box-sizing:border-box}body{margin:0;padding:16px;font-family:system-ui,sans-serif;background:#fff;color:#111}`;
  if (lang === 'html') {
    if (code.trim().startsWith('<!DOCTYPE') || code.trim().startsWith('<html')) return code;
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${base}</style></head><body>${code}</body></html>`;
  }
  if (lang === 'react') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<script src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<style>${base}</style></head><body><div id="root"></div>
<script type="text/babel" data-presets="react">
${code}
;(function(){
  const names=['App','Dashboard','Home','Main','Page','Component','Widget','Preview'];
  let C=null;for(const n of names){try{if(typeof eval(n)!=='undefined'){C=eval(n);break;}}catch(e){}}
  try{if(C)ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(C));
  else document.getElementById('root').innerHTML='<p style="color:red">Name component App, Dashboard, etc.</p>';}
  catch(e){document.getElementById('root').innerHTML='<p style="color:red">'+e.message+'</p>';}
})();
</script></body></html>`;
  }
  if (lang === 'javascript') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${base}pre{font-size:12px;line-height:1.6;white-space:pre-wrap;word-break:break-word}.e{color:#dc2626}</style></head><body><pre id="o"></pre>
<script>const o=document.getElementById('o');console.log=(...a)=>{o.textContent+=a.join(' ')+'\n';};
console.error=(...a)=>{o.innerHTML+='<span class="e">ERR: '+a.join(' ')+'</span>\n';};
try{${code}}catch(e){o.innerHTML+='<span class="e">'+e.message+'</span>';}</script></body></html>`;
  }
  if (lang === 'css') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${base}${code}</style></head><body>
<div class="container"><h1 class="title">Heading</h1><p class="text">Sample paragraph text for your CSS preview.</p>
<button class="btn">Button</button><nav class="nav"><a href="#" class="nav-link">Home</a><a href="#" class="nav-link">About</a></nav></div></body></html>`;
  }
  return null;
}

function canPreview(type) { return ['html','css','javascript','react'].includes(type); }

// ── Syntax highlighter ────────────────────────────────────────────────────────
function highlightCode(code) {
  if (!code) return '';
  const e = code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return e
    .replace(/("""[\s\S]*?"""|'''[\s\S]*?''')/g,'<span style="color:#98c379">$1</span>')
    .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,'<span style="color:#98c379">$1</span>')
    .replace(/(#[^\n]*)/g,'<span style="color:#5c6370;font-style:italic">$1</span>')
    .replace(/(\/\/[^\n]*)/g,'<span style="color:#5c6370;font-style:italic">$1</span>')
    .replace(/\b(\d+\.?\d*)\b/g,'<span style="color:#d19a66">$1</span>')
    .replace(/\b(import|from|def|class|return|if|elif|else|for|while|in|not|and|or|True|False|None|try|except|with|as|async|await|const|let|var|function|export|default|typeof|new|this|extends)\b/g,'<span style="color:#c678dd">$1</span>')
    .replace(/(&lt;\/?[A-Z][a-zA-Z]*)/g,'<span style="color:#e06c75">$1</span>')
    .replace(/\b([a-zA-Z_]\w*)\s*(?=\()/g,'<span style="color:#61afef">$1</span>');
}

// ── LivePreview ───────────────────────────────────────────────────────────────
const LivePreview = ({ html, viewport }) => {
  const [key, setKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const widths = { desktop:'100%', tablet:'768px', mobile:'375px' };
  const w = widths[viewport] || '100%';

  useEffect(() => { setLoading(true); setKey(k=>k+1); }, [html]);

  if (!html) return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, background:'#F5F4F2' }}>
      <FiMonitor size={36} style={{ color:'#ddd' }}/>
      <div style={{ fontSize:13, color:'#bbb' }}>No preview available for this file type</div>
    </div>
  );

  return (
    <div style={{ flex:1, position:'relative', background:'#e5e5e5', display:'flex', flexDirection:'column', alignItems:'center', overflowY: w!=='100%'?'auto':'hidden', padding: w!=='100%'?'16px 0':0 }}>
      {loading && (
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(245,244,242,0.9)', zIndex:5 }}>
          <div style={{ display:'flex', gap:5 }}>{[0,.15,.3].map((d,i)=><div key={i} style={{ width:7, height:7, borderRadius:'50%', background:'#437DFD', animation:`vcP 1.2s ease-in-out ${d}s infinite` }}/>)}</div>
        </div>
      )}
      <iframe
        key={key}
        srcDoc={html}
        sandbox="allow-scripts allow-modals allow-forms"
        title="Live Preview"
        onLoad={() => setLoading(false)}
        style={{ width:w, flex:1, minHeight: w!=='100%'?'500px':'100%', border:'none', background:'#fff', boxShadow: w!=='100%'?'0 4px 24px rgba(0,0,0,0.18)':'none', borderRadius: w!=='100%'?8:0 }}
      />
    </div>
  );
};

// ── PythonTerminal ────────────────────────────────────────────────────────────
const PythonTerminal = ({ code, runTrigger }) => {
  const [out, setOut] = useState(''); const [err, setErr] = useState('');
  const [running, setRunning] = useState(false); const [ok, setOk] = useState(null);
  const ref = useRef(null);
  const run = useCallback(async () => {
    if (!code||running) return;
    setRunning(true); setOut(''); setErr(''); setOk(null);
    try {
      const r = await fetch('/api/vibe/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code,language:'python'})});
      const d = await r.json();
      setOut(d.output||''); setErr(d.error||''); setOk(d.success);
    } catch(e) { setErr('Failed: '+e.message); setOk(false); }
    finally { setRunning(false); }
  }, [code,running]);
  useEffect(()=>{ run(); },[runTrigger]);
  useEffect(()=>{ if(ref.current) ref.current.scrollTop=ref.current.scrollHeight; },[out,err]);
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:'#0d1117', overflow:'hidden' }}>
      <div style={{ height:34, background:'rgba(255,255,255,0.04)', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 14px', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <FiTerminal size={12} style={{ color:'#34d399' }}/>
          <span style={{ fontSize:11, color:'#6b7280', fontFamily:'monospace' }}>python — script.py</span>
          {ok!==null && <span style={{ fontSize:10, padding:'1px 7px', borderRadius:10, background:ok?'rgba(52,211,153,0.15)':'rgba(248,113,113,0.15)', color:ok?'#34d399':'#f87171' }}>{ok?'✓ exit 0':'✗ exit 1'}</span>}
        </div>
        <button onClick={run} disabled={running} style={{ display:'flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:4, fontSize:11, cursor:running?'not-allowed':'pointer', background:'transparent', border:`1px solid ${running?'#333':'#34d39944'}`, color:running?'#444':'#34d399' }}>
          {running?<FiLoader size={10} style={{animation:'vcS 1s linear infinite'}}/>:<FiPlay size={10}/>} {running?'Running…':'Re-run'}
        </button>
      </div>
      <div ref={ref} style={{ flex:1, overflowY:'auto', padding:'14px 16px', fontFamily:"'Fira Code',monospace", fontSize:12, lineHeight:1.7 }}>
        {running&&<span style={{color:'#5a5a5a'}}>Executing...</span>}
        {!running&&out&&<pre style={{margin:0,whiteSpace:'pre-wrap',wordBreak:'break-word',color:'#a8cc8c'}}>{out}</pre>}
        {!running&&err&&<pre style={{margin:out?'8px 0 0':0,whiteSpace:'pre-wrap',wordBreak:'break-word',color:'#f87171'}}>{err}</pre>}
        {!running&&!out&&!err&&<span style={{color:'#444',fontSize:12}}>(no output)</span>}
      </div>
    </div>
  );
};

// ── Design tokens ─────────────────────────────────────────────────────────────
const B = '#437DFD';
const DARK = '#0d1117';

// ── Default starter files ─────────────────────────────────────────────────────
function makeDefaultFiles(projectId) {
  return [{
    id: uid(), projectId, name:'index.html',
    content:`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Project</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <h1>Hello World</h1>
  <p>Start editing or ask AI to build something!</p>
  <script src="app.js"></script>
</body>
</html>`,
    type:'html', createdAt:ts(),
  },{
    id: uid(), projectId, name:'styles.css',
    content:`* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: system-ui, sans-serif;
  background: #f8f9fa;
  color: #212529;
  padding: 40px;
}
h1 { font-size: 2rem; margin-bottom: 16px; color: #437DFD; }
p  { font-size: 1rem; color: #666; line-height: 1.6; }`,
    type:'css', createdAt:ts(),
  },{
    id: uid(), projectId, name:'app.js',
    content:`// Your JavaScript goes here
console.log('Project loaded!');`,
    type:'javascript', createdAt:ts(),
  }];
}

// ── Main VibeCoder ────────────────────────────────────────────────────────────
const VibeCoder = ({ isMobile = false }) => {
  const [projects,     setProjects]     = useState(LP);
  const [activeProj,   setActiveProj]   = useState(null);
  const [files,        setFiles]        = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);
  const [openTabs,     setOpenTabs]     = useState([]);
  const [leftTab,      setLeftTab]      = useState('chat');
  const [messages,     setMessages]     = useState([]);
  const [input,        setInput]        = useState('');
  const [isWorking,    setIsWorking]    = useState(false);
  const [viewTab,      setViewTab]      = useState('split');
  const [viewport,     setViewport]     = useState('desktop');
  const [editingCode,  setEditingCode]  = useState(false);
  const [runTrigger,   setRunTrigger]   = useState(0);
  const [listening,    setListening]    = useState(false);
  const [newProjName,  setNewProjName]  = useState('');
  const [newFileName,  setNewFileName]  = useState('');
  const [showNewProj,  setShowNewProj]  = useState(false);
  const [showNewFile,  setShowNewFile]  = useState(false);
  const [renamingId,   setRenamingId]   = useState(null);
  const [renameVal,    setRenameVal]    = useState('');
  const [expandedFolders, setExpandedFolders] = useState(new Set(['/']));
  const [contextMenu,  setContextMenu]  = useState(null); // { fileId, x, y }

  const inputRef   = useRef(null);
  const msgsEndRef = useRef(null);
  const recRef     = useRef(null);
  const fileInputRef = useRef(null);
  const codeEditRef = useRef(null);

  // ── Persist files ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeProj) SF(activeProj.id, files);
  }, [files, activeProj]);

  useEffect(() => {
    msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isWorking]);

  // ── Close context menu on click ────────────────────────────────────────────
  useEffect(() => {
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────────
  const activeFile  = files.find(f => f.id === activeFileId) || null;
  const activeType  = activeFile ? getFileType(activeFile.name) : 'text';
  const previewHtml = activeProj ? buildProjectPreview(files, activeFile) : null;

  // ── Project actions ────────────────────────────────────────────────────────
  const createProject = (name, initialFiles = null) => {
    const id = uid();
    const proj = { id, name: name || 'Untitled Project', createdAt: ts(), updatedAt: ts(), fileCount: 0 };
    const projFiles = initialFiles || makeDefaultFiles(id);
    SF(id, projFiles);
    const updated = [proj, ...projects];
    SP(updated);
    setProjects(updated);
    setActiveProj(proj);
    setFiles(projFiles);
    setActiveFileId(projFiles[0]?.id || null);
    setOpenTabs(projFiles.map(f => f.id).slice(0, 3));
    setMessages([]);
  };

  const openProject = (proj) => {
    const projFiles = LF(proj.id);
    setActiveProj(proj);
    setFiles(projFiles);
    setActiveFileId(projFiles[0]?.id || null);
    setOpenTabs(projFiles.map(f => f.id).slice(0, 3));
    setMessages([]);
    setInput('');
  };

  const closeProject = () => {
    setActiveProj(null); setFiles([]); setActiveFileId(null);
    setOpenTabs([]); setMessages([]); setInput('');
  };

  const deleteProject = (id) => {
    localStorage.removeItem(FK(id));
    const updated = projects.filter(p => p.id !== id);
    SP(updated); setProjects(updated);
    if (activeProj?.id === id) closeProject();
  };

  const updateProjMeta = (proj, extra = {}) => {
    const updated = projects.map(p => p.id === proj.id ? { ...p, updatedAt: ts(), fileCount: files.length, ...extra } : p);
    SP(updated); setProjects(updated);
  };

  // ── File actions ───────────────────────────────────────────────────────────
  const createFile = (name) => {
    if (!activeProj || !name.trim()) return;
    const file = { id: uid(), projectId: activeProj.id, name: name.trim(), content: '', type: getFileType(name.trim()), createdAt: ts() };
    const updated = [...files, file];
    setFiles(updated);
    setOpenTabs(t => [...t, file.id]);
    setActiveFileId(file.id);
    setShowNewFile(false); setNewFileName('');
    updateProjMeta(activeProj);
  };

  const deleteFile = (id) => {
    setFiles(f => f.filter(x => x.id !== id));
    setOpenTabs(t => t.filter(x => x !== id));
    if (activeFileId === id) {
      const remaining = files.filter(x => x.id !== id);
      setActiveFileId(remaining[0]?.id || null);
    }
    setContextMenu(null);
  };

  const renameFile = (id, newName) => {
    if (!newName.trim()) return;
    setFiles(f => f.map(x => x.id === id ? { ...x, name: newName.trim(), type: getFileType(newName.trim()) } : x));
    setRenamingId(null); setRenameVal('');
  };

  const updateFileContent = (id, content) => {
    setFiles(f => f.map(x => x.id === id ? { ...x, content } : x));
  };

  const openTab = (id) => {
    if (!openTabs.includes(id)) setOpenTabs(t => [...t, id]);
    setActiveFileId(id);
  };

  const closeTab = (id, e) => {
    e.stopPropagation();
    setOpenTabs(t => t.filter(x => x !== id));
    if (activeFileId === id) {
      const idx = openTabs.indexOf(id);
      const next = openTabs[idx + 1] || openTabs[idx - 1];
      setActiveFileId(next || null);
    }
  };

  const uploadFile = (e) => {
    const fileObj = e.target.files[0]; if (!fileObj || !activeProj) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const isImg = fileObj.type.startsWith('image/');
      const content = isImg ? ev.target.result : (ev.target.result || '');
      const file = { id: uid(), projectId: activeProj.id, name: fileObj.name, content, type: getFileType(fileObj.name), createdAt: ts() };
      const updated = [...files, file];
      setFiles(updated);
      setOpenTabs(t => [...t, file.id]);
      setActiveFileId(file.id);
      updateProjMeta(activeProj);
    };
    if (fileObj.type.startsWith('image/')) reader.readAsDataURL(fileObj);
    else reader.readAsText(fileObj);
    e.target.value = '';
  };

  const downloadFile = (file) => {
    if (getFileType(file.name) === 'image') {
      const a = document.createElement('a');
      a.href = file.content; a.download = file.name; a.click();
    } else {
      downloadBlob(file.name, file.content);
    }
    setContextMenu(null);
  };

  const downloadProject = () => {
    if (!files.length) return;
    files.forEach((f, i) => {
      setTimeout(() => downloadBlob(f.name, f.content), i * 100);
    });
  };

  // ── AI Chat ────────────────────────────────────────────────────────────────
  const addMsg = (role, text, meta = null) => setMessages(prev => [...prev, { role, text, meta, id: uid() }]);

  const handleSend = async () => {
    const msg = input.trim(); if (!msg || isWorking) return;
    setInput(''); if (inputRef.current) inputRef.current.style.height = 'auto';
    addMsg('user', msg);
    setIsWorking(true);

    try {
      if (!activeProj) {
        // Create a new project from the prompt
        const r = await fetch('/api/vibe/code', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ prompt: msg, agent_id:'auto' }) });
        const d = await r.json();
        if (!r.ok || d.error) throw new Error(d.error || 'Backend error');
        const raw = d.code || '';
        const lang = detectLanguage(raw);
        const code = extractCode(raw);
        const ext  = lang === 'react' ? 'jsx' : lang === 'unknown' ? 'txt' : lang;
        const fname = `index.${ext}`;
        const pid  = uid();
        const projName = msg.slice(0, 40);
        const proj = { id: pid, name: projName, createdAt: ts(), updatedAt: ts(), fileCount: 1 };
        const file = { id: uid(), projectId: pid, name: fname, content: code, type: lang, createdAt: ts() };
        SF(pid, [file]); SP([proj, ...projects]);
        setProjects(p => [proj, ...p]);
        setActiveProj(proj); setFiles([file]); setActiveFileId(file.id); setOpenTabs([file.id]);
        setViewTab(canPreview(lang) ? 'split' : 'code');
        if (lang === 'python') setRunTrigger(k=>k+1);
        addMsg('assistant', `✓ Created project "${projName}" with ${code.split('\n').length} lines of ${lang.toUpperCase()}.${d.description ? ' ' + d.description : ''}`, { type:'built' });
      } else if (!activeFile) {
        // No file selected — create a new one
        const r = await fetch('/api/vibe/code', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ prompt: msg, agent_id:'auto' }) });
        const d = await r.json();
        if (!r.ok || d.error) throw new Error(d.error || 'Backend error');
        const raw = d.code || '';
        const lang = detectLanguage(raw);
        const code = extractCode(raw);
        const suggestedName = extractFilenameFromReply(d.description || '') || `component.${lang === 'react' ? 'jsx' : lang}`;
        const file = { id: uid(), projectId: activeProj.id, name: suggestedName, content: code, type: lang, createdAt: ts() };
        setFiles(f => [...f, file]);
        setOpenTabs(t => [...t, file.id]); setActiveFileId(file.id);
        setViewTab(canPreview(lang) ? 'split' : 'code');
        addMsg('assistant', `✓ Created ${suggestedName} (${code.split('\n').length} lines).`, { type:'built' });
      } else {
        // Update active file
        const r = await fetch('/api/vibe/chat', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ message: msg, code_context: activeFile.content }) });
        const d = await r.json();
        const reply = d.reply || '';
        const newCode = extractCode(reply);
        const hasCode = newCode && newCode.length > 30 && newCode !== activeFile.content;
        if (hasCode) {
          updateFileContent(activeFileId, newCode);
          const desc = reply.replace(/```[\s\S]*?```/g, '').trim();
          addMsg('assistant', (desc || `Updated ${activeFile.name}!`) + ' ✓', { type:'updated' });
        } else {
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
    if (!SpeechRecognitionAPI) { alert('Speech recognition needs Chrome/Edge.'); return; }
    const rec = new SpeechRecognitionAPI();
    rec.lang='en-US'; rec.interimResults=false; rec.continuous=false;
    rec.onstart=()=>setListening(true);
    rec.onresult=(e)=>{ setInput(p=>p?p+' '+e.results[0][0].transcript:e.results[0][0].transcript); };
    rec.onerror=rec.onend=()=>setListening(false);
    recRef.current=rec; rec.start();
  }, []);
  const stopListening = useCallback(()=>{ recRef.current?.stop(); setListening(false); },[]);

  const autoResize = () => {
    const el = inputRef.current; if (!el) return;
    el.style.height='auto'; el.style.height=Math.min(el.scrollHeight,160)+'px';
  };

  // ── Project list view ──────────────────────────────────────────────────────
  if (!activeProj) {
    return (
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'#F5F4F2' }}>
        {/* Header */}
        <div style={{ height:44, background:'#fff', borderBottom:'1px solid rgba(0,0,0,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <FiCode size={15} style={{ color:B }}/>
            <span style={{ fontSize:13, fontWeight:700, color:'#0C0C0C', letterSpacing:'-0.02em' }}>Vibe Coder</span>
            <span style={{ fontSize:10, padding:'2px 8px', borderRadius:20, background:'rgba(67,125,253,0.08)', color:B, border:`1px solid ${B}22`, fontWeight:600 }}>IDE</span>
          </div>
          <button onClick={() => setShowNewProj(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:9, border:'none', cursor:'pointer', background:`linear-gradient(135deg,${B},#2C76FF)`, color:'#fff', fontSize:12, fontWeight:600, boxShadow:'0 3px 12px rgba(67,125,253,0.3)' }}>
            <FiPlus size={13}/> New Project
          </button>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'24px' }}>

          {/* New project dialog */}
          {showNewProj && (
            <div style={{ background:'#fff', borderRadius:16, border:'1px solid rgba(0,0,0,0.08)', padding:'20px', marginBottom:24, boxShadow:'0 4px 24px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#0C0C0C', marginBottom:12 }}>New Project</div>
              <input
                autoFocus value={newProjName} onChange={e=>setNewProjName(e.target.value)}
                onKeyDown={e=>{ if(e.key==='Enter') { createProject(newProjName); setNewProjName(''); setShowNewProj(false); }; if(e.key==='Escape') setShowNewProj(false); }}
                placeholder="Project name..."
                style={{ width:'100%', padding:'10px 14px', borderRadius:9, border:'1.5px solid rgba(67,125,253,0.3)', outline:'none', fontSize:13, fontFamily:'inherit', marginBottom:12 }}
              />
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => { createProject(newProjName); setNewProjName(''); setShowNewProj(false); }} style={{ flex:1, padding:'9px', borderRadius:9, border:'none', cursor:'pointer', background:`linear-gradient(135deg,${B},#2C76FF)`, color:'#fff', fontSize:12, fontWeight:600 }}>Create Project</button>
                <button onClick={() => setShowNewProj(false)} style={{ padding:'9px 16px', borderRadius:9, border:'1px solid rgba(0,0,0,0.1)', cursor:'pointer', background:'transparent', fontSize:12, color:'#888' }}>Cancel</button>
              </div>
            </div>
          )}

          {/* Projects grid */}
          {projects.length > 0 && (
            <div style={{ marginBottom:32 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#aaa', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:12 }}>Recent Projects</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:12 }}>
                {projects.map(p => (
                  <div key={p.id} onClick={() => openProject(p)}
                    style={{ background:'#fff', borderRadius:14, border:'1px solid rgba(0,0,0,0.07)', padding:'16px', cursor:'pointer', transition:'all 0.15s', position:'relative' }}
                    onMouseEnter={e=>{ e.currentTarget.style.boxShadow='0 4px 20px rgba(67,125,253,0.12)'; e.currentTarget.style.borderColor='rgba(67,125,253,0.2)'; }}
                    onMouseLeave={e=>{ e.currentTarget.style.boxShadow='none'; e.currentTarget.style.borderColor='rgba(0,0,0,0.07)'; }}>
                    <div style={{ fontSize:28, marginBottom:10 }}>📁</div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#0C0C0C', marginBottom:4, letterSpacing:'-0.01em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize:11, color:'#aaa' }}>{LF(p.id).length} files · {new Date(p.createdAt).toLocaleDateString()}</div>
                    <button onClick={e=>{ e.stopPropagation(); deleteProject(p.id); }}
                      style={{ position:'absolute', top:10, right:10, background:'none', border:'none', cursor:'pointer', color:'#ddd', padding:4, borderRadius:6, fontSize:14, transition:'all 0.15s' }}
                      onMouseEnter={e=>{ e.currentTarget.style.color='#dc2626'; e.currentTarget.style.background='rgba(220,38,38,0.08)'; }}
                      onMouseLeave={e=>{ e.currentTarget.style.color='#ddd'; e.currentTarget.style.background='none'; }}>
                      <FiTrash2 size={12}/>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick start */}
          <div style={{ background:'#fff', borderRadius:16, border:'1px solid rgba(0,0,0,0.07)', padding:'24px' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#0C0C0C', marginBottom:6 }}>Quick Start with AI</div>
            <div style={{ fontSize:12, color:'#999', marginBottom:16 }}>Describe what you want to build and AI will generate the project with working code and live preview.</div>
            <div style={{ display:'flex', gap:8 }}>
              <input
                value={input} onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>{ if(e.key==='Enter' && input.trim()) handleSend(); }}
                placeholder="e.g. A responsive landing page with hero section and pricing..."
                style={{ flex:1, padding:'11px 14px', borderRadius:10, border:'1.5px solid rgba(67,125,253,0.2)', outline:'none', fontSize:13, fontFamily:'inherit' }}
              />
              <button onClick={handleSend} disabled={!input.trim()||isWorking} style={{ display:'flex', alignItems:'center', gap:6, padding:'11px 18px', borderRadius:10, border:'none', cursor:input.trim()&&!isWorking?'pointer':'not-allowed', background:input.trim()&&!isWorking?`linear-gradient(135deg,${B},#2C76FF)`:'rgba(67,125,253,0.1)', color:input.trim()&&!isWorking?'#fff':'rgba(67,125,253,0.3)', fontSize:13, fontWeight:600 }}>
                {isWorking?<FiLoader size={13} style={{animation:'vcS 1s linear infinite'}}/>:<FiZap size={13}/>}
                {isWorking?'Building…':'Build'}
              </button>
            </div>
            {/* Quick idea chips */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:7, marginTop:14 }}>
              {[
                '🎨 Landing page with hero + CTA',
                '📋 Todo app with local storage',
                '🛒 Product card with add-to-cart',
                '🧭 Navbar with mobile menu',
                '📊 Dashboard with stats cards',
                '💬 Chat bubble UI',
              ].map((idea,i)=>(
                <button key={i} onClick={()=>setInput(idea.replace(/^[\w\W]{2}\s*/,''))}
                  style={{ padding:'6px 12px', borderRadius:20, fontSize:12, cursor:'pointer', background:'#F5F4F2', border:'1px solid transparent', color:'#666', transition:'all 0.15s' }}
                  onMouseEnter={e=>{ e.currentTarget.style.background='rgba(67,125,253,0.06)'; e.currentTarget.style.borderColor='rgba(67,125,253,0.2)'; e.currentTarget.style.color=B; }}
                  onMouseLeave={e=>{ e.currentTarget.style.background='#F5F4F2'; e.currentTarget.style.borderColor='transparent'; e.currentTarget.style.color='#666'; }}>
                  {idea}
                </button>
              ))}
            </div>
          </div>
        </div>
        <style>{`@keyframes vcS{from{transform:rotate(0)}to{transform:rotate(360deg)}}@keyframes vcP{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
      </div>
    );
  }

  // ── IDE View ───────────────────────────────────────────────────────────────
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'#F5F4F2' }}>

      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <div style={{ height:44, background:'#fff', borderBottom:'1px solid rgba(0,0,0,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, padding:'0 12px', gap:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
          <button onClick={closeProject} style={{ display:'flex', alignItems:'center', justifyContent:'center', width:28, height:28, borderRadius:7, border:'1px solid rgba(0,0,0,0.1)', cursor:'pointer', background:'transparent', color:'#888', flexShrink:0, transition:'all 0.15s' }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor=B; e.currentTarget.style.color=B; }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor='rgba(0,0,0,0.1)'; e.currentTarget.style.color='#888'; }}>
            <FiArrowLeft size={13}/>
          </button>
          <span style={{ fontSize:13, fontWeight:700, color:'#0C0C0C', letterSpacing:'-0.01em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{activeProj.name}</span>
          <span style={{ fontSize:10, padding:'2px 7px', borderRadius:20, background:'rgba(0,196,140,0.1)', color:'#00C48C', border:'1px solid rgba(0,196,140,0.2)', fontWeight:600, flexShrink:0 }}>{files.length} files</span>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          {/* View tabs */}
          {!isMobile && (
            <div style={{ display:'flex', background:'rgba(0,0,0,0.05)', borderRadius:8, padding:3, marginRight:4 }}>
              {[{id:'code',icon:FiCode,label:'Code'},{id:'preview',icon:FiEye,label:'Preview'},{id:'split',icon:FiColumns,label:'Split'}].map(({id,icon:Icon,label})=>(
                <button key={id} onClick={()=>setViewTab(id)} style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:6, border:'none', cursor:'pointer', fontSize:11, fontWeight:500, background:viewTab===id?'#fff':'transparent', color:viewTab===id?'#0C0C0C':'#999', boxShadow:viewTab===id?'0 1px 4px rgba(0,0,0,0.1)':'none', transition:'all 0.15s' }}>
                  <Icon size={11}/>{label}
                </button>
              ))}
            </div>
          )}
          {/* Viewport */}
          {['preview','split'].includes(viewTab) && !isMobile && (
            <div style={{ display:'flex', gap:2, marginRight:4 }}>
              {[{id:'desktop',icon:FiMonitor},{id:'tablet',icon:FiTablet},{id:'mobile',icon:FiSmartphone}].map(({id,icon:Icon})=>(
                <button key={id} onClick={()=>setViewport(id)} style={{ display:'flex', alignItems:'center', justifyContent:'center', width:28, height:28, borderRadius:6, border:'none', cursor:'pointer', background:viewport===id?'rgba(67,125,253,0.1)':'transparent', color:viewport===id?B:'#bbb', transition:'all 0.15s' }}>
                  <Icon size={12}/>
                </button>
              ))}
            </div>
          )}
          {/* Download */}
          <button onClick={downloadProject} title="Download all files" style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:8, border:'1px solid rgba(0,0,0,0.1)', cursor:'pointer', background:'transparent', fontSize:11, color:'#888', transition:'all 0.15s' }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor=B; e.currentTarget.style.color=B; }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor='rgba(0,0,0,0.1)'; e.currentTarget.style.color='#888'; }}>
            <FiDownload size={12}/>{!isMobile && ' Download'}
          </button>
          {/* New file */}
          <button onClick={()=>setShowNewFile(true)} title="New file" style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:8, border:'none', cursor:'pointer', background:`linear-gradient(135deg,${B},#2C76FF)`, fontSize:11, color:'#fff', fontWeight:600, boxShadow:'0 2px 8px rgba(67,125,253,0.25)' }}>
            <FiPlus size={12}/>{!isMobile && ' File'}
          </button>
        </div>
      </div>

      {/* ── IDE Body ─────────────────────────────────────────────────────── */}
      <div style={{ flex:1, display:'flex', overflow:'hidden', flexDirection:isMobile?'column':'row' }}>

        {/* ── Left Panel: Chat + Files ───────────────────────────────────── */}
        <div style={{ width:isMobile?'100%':270, flexShrink:0, display:'flex', flexDirection:'column', borderRight:isMobile?'none':'1px solid rgba(0,0,0,0.08)', borderBottom:isMobile?'1px solid rgba(0,0,0,0.08)':'none', background:'#fff', overflow:'hidden', maxHeight:isMobile?240:undefined }}>

          {/* Left tab switcher */}
          <div style={{ height:36, borderBottom:'1px solid rgba(0,0,0,0.07)', display:'flex', alignItems:'stretch', flexShrink:0 }}>
            {[{id:'chat',icon:FiMessageSquare,label:'Chat'},{id:'files',icon:FiFolder,label:'Files'}].map(({id,icon:Icon,label})=>(
              <button key={id} onClick={()=>setLeftTab(id)} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5, border:'none', cursor:'pointer', fontSize:11, fontWeight:600, background:'transparent', color:leftTab===id?B:'#bbb', borderBottom:leftTab===id?`2px solid ${B}`:'2px solid transparent', transition:'all 0.15s' }}>
                <Icon size={11}/>{label}
              </button>
            ))}
          </div>

          {/* Chat panel */}
          {leftTab === 'chat' && (
            <>
              <div style={{ flex:1, overflowY:'auto', padding:10, display:'flex', flexDirection:'column', gap:8 }}>
                {messages.length === 0 && (
                  <div style={{ padding:'8px 0', color:'#aaa', fontSize:12, lineHeight:1.6 }}>
                    {activeFile
                      ? <><strong style={{color:'#0C0C0C', display:'block', marginBottom:4}}>Editing: {activeFile.name}</strong>Describe a change or ask a question about the active file.</>
                      : <><strong style={{color:'#0C0C0C', display:'block', marginBottom:4}}>AI Assistant</strong>Ask me to build something, add a feature, fix a bug, or explain the code.</>}
                  </div>
                )}
                {messages.map(msg => <ChatMsg key={msg.id} msg={msg}/>)}
                {isWorking && (
                  <div style={{ display:'flex', alignItems:'center', gap:8, padding:10, borderRadius:10, background:'rgba(67,125,253,0.05)', border:`1px solid ${B}18` }}>
                    <div style={{ width:26, height:26, borderRadius:8, background:`linear-gradient(135deg,${B},#2C76FF)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <FiZap size={12} style={{ color:'#fff', animation:'vcP 0.8s ease-in-out infinite' }}/>
                    </div>
                    <div style={{ fontSize:11, fontWeight:600, color:B }}>AI is coding…</div>
                  </div>
                )}
                <div ref={msgsEndRef}/>
              </div>
              <div style={{ borderTop:'1px solid rgba(0,0,0,0.07)', padding:8, flexShrink:0 }}>
                <div style={{ display:'flex', flexDirection:'column', gap:6, background:'#F5F4F2', border:`1.5px solid rgba(67,125,253,0.15)`, borderRadius:11, padding:'8px 10px', transition:'all 0.15s' }}
                  onFocusCapture={e=>{ e.currentTarget.style.borderColor=B; e.currentTarget.style.boxShadow=`0 0 0 3px rgba(67,125,253,0.1)`; }}
                  onBlurCapture={e=>{ e.currentTarget.style.borderColor='rgba(67,125,253,0.15)'; e.currentTarget.style.boxShadow='none'; }}>
                  <textarea ref={inputRef} value={input} onChange={e=>{setInput(e.target.value);autoResize();}}
                    onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSend();} }}
                    placeholder={activeFile?`Modify ${activeFile.name}… (Enter)`:'Describe what to build… (Enter)'}
                    rows={1} style={{ background:'transparent', border:'none', outline:'none', color:'#0C0C0C', fontSize:12, lineHeight:1.65, resize:'none', fontFamily:'inherit', minHeight:20, maxHeight:120 }}/>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    {SpeechRecognitionAPI && (
                      <button onClick={listening?stopListening:startListening} style={{ display:'flex', alignItems:'center', justifyContent:'center', width:26, height:26, borderRadius:7, border:'none', cursor:'pointer', background:listening?'rgba(0,196,140,0.1)':'transparent', color:listening?'#00C48C':'#bbb' }}>
                        {listening?<FiMic size={12}/>:<FiMicOff size={12}/>}
                      </button>
                    )}
                    <button onClick={handleSend} disabled={!input.trim()||isWorking} style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:7, border:'none', cursor:input.trim()&&!isWorking?'pointer':'not-allowed', fontSize:11, fontWeight:600, background:input.trim()&&!isWorking?`linear-gradient(135deg,${B},#2C76FF)`:'rgba(67,125,253,0.08)', color:input.trim()&&!isWorking?'#fff':'rgba(67,125,253,0.3)', marginLeft:'auto', boxShadow:input.trim()&&!isWorking?'0 2px 8px rgba(67,125,253,0.3)':'none' }}>
                      {isWorking?<FiLoader size={11} style={{animation:'vcS 1s linear infinite'}}/>:<FiSend size={11}/>}
                      {isWorking?'…':activeFile?'Update':'Build'}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* File tree panel */}
          {leftTab === 'files' && (
            <div style={{ flex:1, overflowY:'auto', padding:'8px 0' }}>
              <input ref={fileInputRef} type="file" style={{ display:'none' }} onChange={uploadFile} accept="*/*"/>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 12px 8px', gap:6 }}>
                <span style={{ fontSize:10, fontWeight:700, color:'#aaa', letterSpacing:'0.08em', textTransform:'uppercase' }}>Files</span>
                <div style={{ display:'flex', gap:4 }}>
                  <button onClick={()=>fileInputRef.current?.click()} title="Upload file" style={{ display:'flex', alignItems:'center', gap:3, padding:'3px 7px', borderRadius:6, border:'1px solid rgba(0,0,0,0.08)', cursor:'pointer', background:'transparent', fontSize:10, color:'#888' }}>
                    <FiUpload size={10}/> Upload
                  </button>
                  <button onClick={()=>setShowNewFile(true)} style={{ display:'flex', alignItems:'center', gap:3, padding:'3px 7px', borderRadius:6, border:'none', cursor:'pointer', background:`rgba(67,125,253,0.1)`, fontSize:10, color:B, fontWeight:600 }}>
                    <FiPlus size={10}/> New
                  </button>
                </div>
              </div>
              {showNewFile && (
                <div style={{ padding:'0 8px 8px' }}>
                  <input autoFocus value={newFileName} onChange={e=>setNewFileName(e.target.value)}
                    onKeyDown={e=>{ if(e.key==='Enter')createFile(newFileName); if(e.key==='Escape'){setShowNewFile(false);setNewFileName('');} }}
                    placeholder="filename.html" style={{ width:'100%', padding:'6px 10px', borderRadius:7, border:`1.5px solid ${B}44`, outline:'none', fontSize:12, fontFamily:'inherit' }}/>
                </div>
              )}
              {files.map(f => (
                <FileRow key={f.id} file={f} active={activeFileId===f.id}
                  onOpen={()=>openTab(f.id)}
                  onContextMenu={(e)=>{ e.preventDefault(); setContextMenu({ fileId:f.id, x:e.clientX, y:e.clientY }); }}
                  renamingId={renamingId} renameVal={renameVal}
                  onRenameChange={setRenameVal} onRenameSubmit={()=>renameFile(renamingId,renameVal)} onRenameKey={e=>{ if(e.key==='Enter')renameFile(renamingId,renameVal); if(e.key==='Escape'){setRenamingId(null);setRenameVal('');} }}
                />
              ))}
              {files.length === 0 && <div style={{ padding:'12px 14px', fontSize:12, color:'#ccc' }}>No files yet. Create one!</div>}
            </div>
          )}
        </div>

        {/* ── Right: Editor + Preview ────────────────────────────────────── */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

          {/* File tabs */}
          <div style={{ height:36, background:'#fff', borderBottom:'1px solid rgba(0,0,0,0.08)', display:'flex', alignItems:'stretch', overflowX:'auto', flexShrink:0 }}>
            {openTabs.map(tid => {
              const f = files.find(x => x.id === tid); if (!f) return null;
              const active = tid === activeFileId;
              return (
                <div key={tid} onClick={()=>setActiveFileId(tid)} style={{ display:'flex', alignItems:'center', gap:6, padding:'0 12px', borderRight:'1px solid rgba(0,0,0,0.06)', cursor:'pointer', whiteSpace:'nowrap', flexShrink:0, background:active?'#F5F4F2':'transparent', borderBottom:active?`2px solid ${B}`:'2px solid transparent', fontSize:11, color:active?'#0C0C0C':'#999', transition:'all 0.15s' }}>
                  <span style={{ fontSize:12 }}>{getFileIcon(f.name)}</span>
                  <span style={{ fontWeight:active?600:400 }}>{f.name}</span>
                  <button onClick={e=>closeTab(tid,e)} style={{ display:'flex', alignItems:'center', justifyContent:'center', width:14, height:14, borderRadius:4, border:'none', cursor:'pointer', background:'transparent', color:active?'#999':'#ccc', fontSize:10, padding:0, marginLeft:2 }}>×</button>
                </div>
              );
            })}
            {files.filter(f => !openTabs.includes(f.id)).length > 0 && (
              <div style={{ display:'flex', alignItems:'center', padding:'0 8px', color:'#ccc', fontSize:11 }}>+{files.filter(f => !openTabs.includes(f.id)).length} more</div>
            )}
          </div>

          {!activeFile ? (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'#F5F4F2', flexDirection:'column', gap:12 }}>
              <FiCode size={32} style={{ color:'#ddd' }}/>
              <div style={{ fontSize:13, color:'#bbb' }}>Select a file to edit</div>
            </div>
          ) : getFileType(activeFile.name) === 'image' ? (
            /* Image viewer */
            <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, background:'#F5F4F2', overflow:'auto' }}>
              <img src={activeFile.content} alt={activeFile.name} style={{ maxWidth:'100%', maxHeight:'80%', borderRadius:8, boxShadow:'0 4px 20px rgba(0,0,0,0.12)' }}/>
              <div style={{ fontSize:12, color:'#999' }}>{activeFile.name}</div>
              <button onClick={()=>downloadFile(activeFile)} style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 14px', borderRadius:8, border:`1px solid ${B}44`, cursor:'pointer', background:'transparent', fontSize:12, color:B }}>
                <FiDownload size={12}/> Download
              </button>
            </div>
          ) : (
            /* Code editor + preview */
            <div style={{ flex:1, display:'flex', overflow:'hidden', flexDirection: viewTab==='split' ? (isMobile?'column':'row') : 'column' }}>

              {/* Code panel */}
              {(viewTab==='code'||viewTab==='split') && (
                <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0, minHeight:isMobile?180:undefined }}>
                  <div style={{ height:32, background:'#161b22', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 12px', flexShrink:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ display:'flex', gap:4 }}>
                        <div style={{ width:9, height:9, borderRadius:'50%', background:'#f87171' }}/>
                        <div style={{ width:9, height:9, borderRadius:'50%', background:'#fbbf24' }}/>
                        <div style={{ width:9, height:9, borderRadius:'50%', background:'#34d399' }}/>
                      </div>
                      <span style={{ fontSize:11, color:'#6b7280', fontFamily:'monospace' }}>{activeFile.name}</span>
                      <span style={{ fontSize:10, padding:'1px 6px', borderRadius:8, background:`rgba(67,125,253,0.15)`, color:B, border:`1px solid ${B}33` }}>{activeType}</span>
                    </div>
                    <div style={{ display:'flex', gap:6 }}>
                      <span style={{ fontSize:10, color:'#444', fontFamily:'monospace' }}>{activeFile.content.split('\n').length} lines</span>
                      <CopyBtn text={activeFile.content}/>
                      <button onClick={()=>downloadFile(activeFile)} style={{ display:'flex', alignItems:'center', gap:3, padding:'2px 7px', borderRadius:5, fontSize:10, cursor:'pointer', background:'transparent', border:'1px solid #333', color:'#666' }}>
                        <FiDownload size={9}/> Save
                      </button>
                      <button onClick={()=>setEditingCode(e=>!e)} style={{ display:'flex', alignItems:'center', gap:3, padding:'2px 7px', borderRadius:5, fontSize:10, cursor:'pointer', background:editingCode?'rgba(67,125,253,0.2)':'transparent', border:`1px solid ${editingCode?B+'66':'#333'}`, color:editingCode?B:'#666' }}>
                        <FiEdit3 size={9}/> {editingCode?'View':'Edit'}
                      </button>
                      {activeType==='python' && (
                        <button onClick={()=>{ setViewTab('preview'); setRunTrigger(k=>k+1); }} style={{ display:'flex', alignItems:'center', gap:3, padding:'2px 7px', borderRadius:5, fontSize:10, cursor:'pointer', background:'rgba(52,211,153,0.1)', border:'1px solid #34d39944', color:'#34d399' }}>
                          <FiPlay size={9}/> Run
                        </button>
                      )}
                    </div>
                  </div>
                  {editingCode ? (
                    <textarea
                      ref={codeEditRef}
                      value={activeFile.content}
                      onChange={e=>updateFileContent(activeFileId, e.target.value)}
                      spellCheck={false}
                      style={{ flex:1, background:DARK, color:'#abb2bf', border:'none', outline:'none', padding:'16px 20px', fontFamily:"'Fira Code','Cascadia Code',Consolas,monospace", fontSize:13, lineHeight:1.8, resize:'none', tabSize:2 }}
                    />
                  ) : (
                    <div style={{ flex:1, overflowY:'auto', overflowX:'auto', background:DARK, padding:'16px 20px', fontFamily:"'Fira Code','Cascadia Code',Consolas,monospace", fontSize:13, lineHeight:1.8 }}>
                      <pre style={{ margin:0, whiteSpace:'pre', color:'#abb2bf' }}>
                        <code dangerouslySetInnerHTML={{ __html: highlightCode(activeFile.content) }}/>
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {viewTab==='split' && !isMobile && <div style={{ width:1, background:'rgba(255,255,255,0.05)', flexShrink:0 }}/>}

              {/* Preview panel */}
              {(viewTab==='preview'||viewTab==='split') && (
                <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0, minHeight:isMobile?220:undefined }}>
                  <div style={{ height:32, background:'#fff', borderBottom:'1px solid rgba(0,0,0,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 12px', flexShrink:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ display:'flex', gap:4 }}>
                        <div style={{ width:9, height:9, borderRadius:'50%', background:'#f87171' }}/>
                        <div style={{ width:9, height:9, borderRadius:'50%', background:'#fbbf24' }}/>
                        <div style={{ width:9, height:9, borderRadius:'50%', background:'#34d399' }}/>
                      </div>
                      <span style={{ fontSize:11, color:'#888' }}>{activeType==='python'?'Terminal':'Live Preview'}</span>
                      {activeType!=='python' && <span style={{ fontSize:10, padding:'1px 6px', borderRadius:8, background:'rgba(0,196,140,0.1)', color:'#00C48C', border:'1px solid rgba(0,196,140,0.2)' }}>live</span>}
                    </div>
                  </div>
                  {activeType==='python'
                    ? <PythonTerminal code={activeFile.content} runTrigger={runTrigger}/>
                    : <LivePreview html={previewHtml} viewport={viewport}/>
                  }
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Context menu ──────────────────────────────────────────────────── */}
      {contextMenu && (() => {
        const f = files.find(x => x.id === contextMenu.fileId);
        if (!f) return null;
        return (
          <div style={{ position:'fixed', top:contextMenu.y, left:contextMenu.x, background:'#fff', border:'1px solid rgba(0,0,0,0.1)', borderRadius:10, padding:'4px', boxShadow:'0 8px 32px rgba(0,0,0,0.15)', zIndex:1000, minWidth:150 }}>
            <CtxItem icon={FiEdit3} label="Rename" onClick={()=>{ setRenamingId(f.id); setRenameVal(f.name); setLeftTab('files'); setContextMenu(null); }}/>
            <CtxItem icon={FiDownload} label="Download" onClick={()=>downloadFile(f)}/>
            <CtxItem icon={FiTrash2} label="Delete" danger onClick={()=>deleteFile(f.id)}/>
          </div>
        );
      })()}

      <style>{`@keyframes vcS{from{transform:rotate(0)}to{transform:rotate(360deg)}}@keyframes vcP{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  );
};

// ── Small reusable pieces ─────────────────────────────────────────────────────

const ChatMsg = ({ msg }) => {
  const isUser = msg.role === 'user';
  const isErr  = msg.role === 'error';
  if (isUser) return (
    <div style={{ display:'flex', justifyContent:'flex-end' }}>
      <div style={{ maxWidth:'90%', padding:'8px 11px', borderRadius:'12px 12px 4px 12px', background:`linear-gradient(135deg,${B},#2C76FF)`, color:'#fff', fontSize:12, lineHeight:1.6, wordBreak:'break-word' }}>{msg.text}</div>
    </div>
  );
  if (isErr) return (
    <div style={{ padding:'8px 11px', borderRadius:10, background:'rgba(220,38,38,0.06)', border:'1px solid rgba(220,38,38,0.15)', color:'#dc2626', fontSize:12, lineHeight:1.6 }}>{msg.text}</div>
  );
  return (
    <div style={{ display:'flex', gap:7, alignItems:'flex-start' }}>
      <div style={{ width:24, height:24, borderRadius:7, background:'rgba(67,125,253,0.1)', border:`1px solid ${B}22`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:12 }}>
        {msg.meta?.type==='built'?'🏗️':msg.meta?.type==='updated'?'✏️':'🤖'}
      </div>
      <div style={{ flex:1 }}>
        {msg.meta?.type==='built' && <span style={{ fontSize:10, padding:'1px 7px', borderRadius:20, background:'rgba(0,196,140,0.1)', color:'#00C48C', border:'1px solid rgba(0,196,140,0.2)', fontWeight:600, display:'inline-block', marginBottom:4 }}>✓ Built</span>}
        {msg.meta?.type==='updated' && <span style={{ fontSize:10, padding:'1px 7px', borderRadius:20, background:`rgba(67,125,253,0.08)`, color:B, border:`1px solid ${B}22`, fontWeight:600, display:'inline-block', marginBottom:4 }}>↻ Updated</span>}
        <div style={{ padding:'8px 11px', borderRadius:'4px 12px 12px 12px', background:'#F5F4F2', border:'1px solid rgba(0,0,0,0.07)', color:'#0C0C0C', fontSize:12, lineHeight:1.7, wordBreak:'break-word' }}>{msg.text}</div>
      </div>
    </div>
  );
};

const CopyBtn = ({ text }) => {
  const [c, setC] = useState(false);
  return (
    <button onClick={()=>{ navigator.clipboard.writeText(text).then(()=>{ setC(true); setTimeout(()=>setC(false),1500); }); }}
      style={{ display:'flex', alignItems:'center', gap:3, padding:'2px 7px', borderRadius:5, fontSize:10, cursor:'pointer', background:c?'rgba(52,211,153,0.1)':'transparent', border:`1px solid ${c?'#34d39944':'#333'}`, color:c?'#34d399':'#666' }}>
      {c?<FiCheck size={9}/>:<FiCopy size={9}/>} {c?'Copied!':'Copy'}
    </button>
  );
};

const FileRow = ({ file, active, onOpen, onContextMenu, renamingId, renameVal, onRenameChange, onRenameSubmit, onRenameKey }) => {
  const [hov, setHov] = useState(false);
  const isRenaming = renamingId === file.id;
  return (
    <div onClick={onOpen} onContextMenu={onContextMenu}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ display:'flex', alignItems:'center', gap:7, padding:'5px 12px', cursor:'pointer', background:active?'rgba(67,125,253,0.07)':hov?'rgba(0,0,0,0.03)':'transparent', borderLeft:active?`2px solid ${B}`:'2px solid transparent', transition:'all 0.1s', userSelect:'none' }}>
      <span style={{ fontSize:13, flexShrink:0 }}>{getFileType(file.name)==='image'?'🖼️':getFileIcon(file.name)}</span>
      {isRenaming ? (
        <input autoFocus value={renameVal} onChange={e=>onRenameChange(e.target.value)} onBlur={onRenameSubmit} onKeyDown={onRenameKey}
          style={{ flex:1, fontSize:12, padding:'1px 5px', border:`1px solid ${B}66`, borderRadius:4, outline:'none', fontFamily:'inherit' }}
          onClick={e=>e.stopPropagation()}/>
      ) : (
        <span style={{ fontSize:12, color:active?B:'#444', fontWeight:active?600:400, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{file.name}</span>
      )}
      <span style={{ fontSize:10, color:'#ccc' }}>{(file.content?.length||0)>1000?Math.round(file.content.length/1024)+'kb':''}</span>
    </div>
  );
};

const CtxItem = ({ icon: Icon, label, onClick, danger }) => {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ display:'flex', alignItems:'center', gap:9, padding:'7px 12px', borderRadius:7, cursor:'pointer', background:hov?(danger?'rgba(220,38,38,0.06)':'rgba(67,125,253,0.06)'):'transparent', color:danger?'#dc2626':'#0C0C0C', fontSize:12, transition:'all 0.1s' }}>
      <Icon size={12}/>{label}
    </div>
  );
};

export default VibeCoder;
