import { useState, useRef, useEffect, useCallback } from 'react';
import {
  FiEdit3, FiSquare, FiCircle, FiMinus, FiTrash2, FiDownload,
  FiRotateCcw, FiType, FiZap,
} from 'react-icons/fi';

const B = '#437DFD';

const COLORS = ['#0C0C0C','#437DFD','#FD5B5D','#00C48C','#FF8C42','#7B61FF','#fff','#6b7280'];

const TOOLS = [
  { id:'pen',    label:'Pen',       icon: FiEdit3 },
  { id:'line',   label:'Line',      icon: FiMinus },
  { id:'rect',   label:'Rectangle', icon: FiSquare },
  { id:'circle', label:'Circle',    icon: FiCircle },
  { id:'text',   label:'Text',      icon: FiType },
  { id:'eraser', label:'Eraser',    icon: FiZap },
];

const SIZES = [2, 4, 8, 14, 22];

export default function CanvasBoard({ isMobile = false }) {
  const canvasRef     = useRef(null);
  const [tool,        setTool]        = useState('pen');
  const [color,       setColor]       = useState('#0C0C0C');
  const [size,        setSize]        = useState(4);
  const [drawing,     setDrawing]     = useState(false);
  const [start,       setStart]       = useState({ x:0, y:0 });
  const [history,     setHistory]     = useState([]);   // ImageData snapshots
  const [textInput,   setTextInput]   = useState('');
  const [textPos,     setTextPos]     = useState(null);
  const [customColor, setCustomColor] = useState('#437DFD');

  // Resize canvas to fill container
  const containerRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const snap = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
      canvas.width  = container.clientWidth;
      canvas.height = container.clientHeight;
      // Restore white background
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Try to restore drawing
      try { ctx.putImageData(snap, 0, 0); } catch {}
      setupCtx(ctx);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  const setupCtx = (ctx) => {
    ctx.lineCap   = 'round';
    ctx.lineJoin  = 'round';
  };

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect   = canvas.getBoundingClientRect();
    const touch  = e.touches ? e.touches[0] : e;
    return {
      x: (touch.clientX - rect.left) * (canvas.width / rect.width),
      y: (touch.clientY - rect.top)  * (canvas.height / rect.height),
    };
  };

  const saveSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory(h => [...h.slice(-20), snap]);
  }, []);

  const drawPreview = (pos) => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    if (history.length === 0) return;
    // Restore last snapshot, then draw preview shape
    ctx.putImageData(history[history.length - 1], 0, 0);
    ctx.strokeStyle = color;
    ctx.lineWidth   = size;
    ctx.fillStyle   = 'transparent';
    setupCtx(ctx);

    if (tool === 'rect') {
      ctx.strokeRect(start.x, start.y, pos.x - start.x, pos.y - start.y);
    } else if (tool === 'circle') {
      const rx = Math.abs(pos.x - start.x) / 2;
      const ry = Math.abs(pos.y - start.y) / 2;
      const cx = start.x + (pos.x - start.x) / 2;
      const cy = start.y + (pos.y - start.y) / 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (tool === 'line') {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  };

  const onPointerDown = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    const pos    = getPos(e);

    if (tool === 'text') {
      setTextPos(pos);
      setTextInput('');
      return;
    }

    saveSnapshot();
    setDrawing(true);
    setStart(pos);

    if (tool === 'pen' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.strokeStyle = tool === 'eraser' ? '#fff' : color;
      ctx.lineWidth   = tool === 'eraser' ? size * 3 : size;
      setupCtx(ctx);
    }
  };

  const onPointerMove = (e) => {
    e.preventDefault();
    if (!drawing) return;
    const pos = getPos(e);
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');

    if (tool === 'pen' || tool === 'eraser') {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else {
      drawPreview(pos);
    }
  };

  const onPointerUp = (e) => {
    e.preventDefault();
    if (!drawing) return;
    const pos    = getPos(e);
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');

    if (tool !== 'pen' && tool !== 'eraser') {
      ctx.strokeStyle = color;
      ctx.lineWidth   = size;
      setupCtx(ctx);
      if (tool === 'rect') {
        ctx.strokeRect(start.x, start.y, pos.x - start.x, pos.y - start.y);
      } else if (tool === 'circle') {
        const rx = Math.abs(pos.x - start.x) / 2;
        const ry = Math.abs(pos.y - start.y) / 2;
        const cx = start.x + (pos.x - start.x) / 2;
        const cy = start.y + (pos.y - start.y) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (tool === 'line') {
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }
    }
    setDrawing(false);
  };

  const commitText = () => {
    if (!textInput.trim() || !textPos) { setTextPos(null); return; }
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    saveSnapshot();
    ctx.fillStyle = color;
    ctx.font      = `${size * 4 + 8}px DM Sans, system-ui, sans-serif`;
    ctx.fillText(textInput, textPos.x, textPos.y);
    setTextPos(null); setTextInput('');
  };

  const undo = () => {
    if (history.length === 0) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    const prev   = history[history.length - 1];
    ctx.putImageData(prev, 0, 0);
    setHistory(h => h.slice(0, -1));
  };

  const clearCanvas = () => {
    saveSnapshot();
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const downloadPng = () => {
    const canvas = canvasRef.current;
    const link   = document.createElement('a');
    link.download = 'canvas.png';
    link.href     = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'#F5F4F2' }}>

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div style={{ background:'#fff', borderBottom:'1px solid rgba(0,0,0,0.08)', display:'flex', alignItems:'center', gap:4, padding:'6px 12px', flexShrink:0, flexWrap:isMobile?'wrap':'nowrap', overflowX:'auto' }}>

        {/* Tools */}
        <div style={{ display:'flex', gap:2, marginRight:6 }}>
          {TOOLS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTool(id)} title={label}
              style={{ display:'flex', alignItems:'center', justifyContent:'center', width:32, height:32, borderRadius:8, border:'none', cursor:'pointer', transition:'all 0.15s', background: tool===id ? `rgba(67,125,253,0.12)` : 'transparent', color: tool===id ? B : '#aaa', outline: tool===id ? `1.5px solid ${B}40` : 'none' }}>
              <Icon size={15}/>
            </button>
          ))}
        </div>

        <div style={{ width:1, height:24, background:'rgba(0,0,0,0.08)', flexShrink:0, marginRight:6 }}/>

        {/* Colors */}
        <div style={{ display:'flex', gap:4, alignItems:'center', marginRight:6, flexWrap:'wrap' }}>
          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)} title={c}
              style={{ width:20, height:20, borderRadius:'50%', border:color===c?`2px solid ${B}`:'2px solid rgba(0,0,0,0.1)', cursor:'pointer', background:c, flexShrink:0, transition:'transform 0.1s', transform:color===c?'scale(1.25)':'scale(1)' }}/>
          ))}
          <input type="color" value={customColor}
            onChange={e=>{ setCustomColor(e.target.value); setColor(e.target.value); }}
            title="Custom color"
            style={{ width:24, height:24, borderRadius:'50%', border:COLORS.includes(color)?'2px solid rgba(0,0,0,0.1)':`2px solid ${B}`, cursor:'pointer', padding:0, background:'transparent', outline:'none' }}/>
        </div>

        <div style={{ width:1, height:24, background:'rgba(0,0,0,0.08)', flexShrink:0, marginRight:6 }}/>

        {/* Stroke sizes */}
        <div style={{ display:'flex', gap:5, alignItems:'center', marginRight:6 }}>
          {SIZES.map(s => (
            <button key={s} onClick={() => setSize(s)} title={`${s}px`}
              style={{ display:'flex', alignItems:'center', justifyContent:'center', width:28, height:28, borderRadius:7, border:'none', cursor:'pointer', background: size===s?`rgba(67,125,253,0.1)`:'transparent', transition:'all 0.1s' }}>
              <div style={{ width:s+2, height:s+2, borderRadius:'50%', background: size===s?B:'#aaa', transition:'all 0.1s' }}/>
            </button>
          ))}
        </div>

        <div style={{ marginLeft:'auto', display:'flex', gap:4 }}>
          <button onClick={undo} title="Undo" style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:8, border:'1px solid rgba(0,0,0,0.1)', cursor:'pointer', background:'transparent', fontSize:11, color:'#888' }}>
            <FiRotateCcw size={12}/> Undo
          </button>
          <button onClick={clearCanvas} title="Clear all" style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:8, border:'1px solid rgba(220,38,38,0.2)', cursor:'pointer', background:'rgba(220,38,38,0.05)', fontSize:11, color:'#dc2626' }}>
            <FiTrash2 size={12}/> Clear
          </button>
          <button onClick={downloadPng} title="Download PNG" style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 12px', borderRadius:8, border:'none', cursor:'pointer', background:`linear-gradient(135deg,${B},#2C76FF)`, fontSize:11, color:'#fff', fontWeight:600, boxShadow:'0 2px 8px rgba(67,125,253,0.25)' }}>
            <FiDownload size={12}/> Export PNG
          </button>
        </div>
      </div>

      {/* ── Canvas area ──────────────────────────────────────────────────── */}
      <div ref={containerRef} style={{ flex:1, position:'relative', overflow:'hidden', cursor: tool==='eraser'?'cell':tool==='text'?'text':'crosshair' }}>
        <canvas
          ref={canvasRef}
          onMouseDown={onPointerDown} onMouseMove={onPointerMove} onMouseUp={onPointerUp} onMouseLeave={onPointerUp}
          onTouchStart={onPointerDown} onTouchMove={onPointerMove} onTouchEnd={onPointerUp}
          style={{ display:'block', width:'100%', height:'100%', touchAction:'none', userSelect:'none' }}
        />

        {/* Text input overlay */}
        {textPos && (
          <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0 }} onClick={e => { if (e.target === e.currentTarget) setTextPos(null); }}>
            <input
              autoFocus
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              onKeyDown={e => { if (e.key==='Enter') commitText(); if (e.key==='Escape') setTextPos(null); }}
              placeholder="Type and press Enter…"
              style={{
                position:'absolute',
                left: textPos.x * (containerRef.current?.clientWidth / canvasRef.current?.width || 1),
                top:  textPos.y * (containerRef.current?.clientHeight / canvasRef.current?.height || 1) - 20,
                fontSize: size * 4 + 8,
                fontFamily: 'DM Sans, system-ui, sans-serif',
                color, background:'rgba(255,255,255,0.9)',
                border:`1.5px dashed ${B}66`,
                borderRadius:6, padding:'2px 6px',
                outline:'none', minWidth:120,
              }}
            />
          </div>
        )}

        {/* Hint when canvas is empty */}
        {history.length === 0 && (
          <div style={{ position:'absolute', bottom:24, left:'50%', transform:'translateX(-50%)', textAlign:'center', pointerEvents:'none' }}>
            <div style={{ fontSize:13, color:'#ccc', background:'rgba(255,255,255,0.8)', padding:'8px 16px', borderRadius:20, border:'1px solid rgba(0,0,0,0.07)' }}>
              ✏️ Draw freely or pick a shape tool above
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
