import { useState, useEffect } from 'react';
import {
  FiMessageSquare, FiDatabase, FiTrendingUp, FiBell,
  FiZap, FiBarChart2, FiCpu, FiPlus, FiRefreshCw,
  FiCheckCircle, FiAlertTriangle, FiActivity, FiX, FiSearch,
} from 'react-icons/fi';
import { api } from '../services/api';

const B = '#437DFD';
const BORDER = 'rgba(0,0,0,0.07)';

const TITLES = {
  chat:      { label: 'Chats',        icon: FiMessageSquare },
  memory:    { label: 'Memory',       icon: FiDatabase },
  trading:   { label: 'Trading',      icon: FiTrendingUp },
  reminders: { label: 'Reminders',    icon: FiBell },
  skills:    { label: 'Capabilities', icon: FiZap },
  analytics: { label: 'Analytics',    icon: FiBarChart2 },
  brain:     { label: 'AI Brain',     icon: FiCpu },
};

const SectionHdr = ({ title, onAdd, onRefresh }) => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'4px 16px 4px 16px', height:'30px', flexShrink:0 }}>
    <span style={{ fontSize:'10px', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.10em', color:'#aaa' }}>{title}</span>
    <div style={{ display:'flex', gap:'2px' }}>
      {onRefresh && (
        <button onClick={onRefresh} style={{ display:'flex', alignItems:'center', justifyContent:'center', width:'20px', height:'20px', background:'none', border:'none', color:'#bbb', cursor:'pointer', borderRadius:'4px' }}
          onMouseEnter={e=>e.currentTarget.style.color=B} onMouseLeave={e=>e.currentTarget.style.color='#bbb'}>
          <FiRefreshCw size={11}/>
        </button>
      )}
      {onAdd && (
        <button onClick={onAdd} style={{ display:'flex', alignItems:'center', justifyContent:'center', width:'20px', height:'20px', background:'none', border:'none', color:'#bbb', cursor:'pointer', borderRadius:'4px' }}
          onMouseEnter={e=>e.currentTarget.style.color=B} onMouseLeave={e=>e.currentTarget.style.color='#bbb'}>
          <FiPlus size={11}/>
        </button>
      )}
    </div>
  </div>
);

const Row = ({ primary, secondary, active, dot, dotColor, avatar }) => {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        padding:'9px 16px', cursor:'pointer', transition:'background 0.12s',
        backgroundColor: active ? `rgba(67,125,253,0.08)` : hov ? 'rgba(67,125,253,0.04)' : 'transparent',
        borderRadius:'8px', margin:'1px 8px',
        display:'flex', alignItems:'center', gap:'10px',
      }}>
      {avatar && (
        <div style={{
          width:'32px', height:'32px', borderRadius:'10px', flexShrink:0,
          background: active ? `linear-gradient(135deg,${B},#2C76FF)` : 'rgba(67,125,253,0.1)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:'12px', fontWeight:'700',
          color: active ? '#fff' : B,
          boxShadow: active ? '0 2px 8px rgba(67,125,253,0.25)' : 'none',
        }}>
          {typeof avatar === 'string' ? avatar : '💬'}
        </div>
      )}
      <div style={{ flex:1, minWidth:0 }}>
        {dot && <div style={{ width:'6px', height:'6px', borderRadius:'50%', backgroundColor:dotColor||B, flexShrink:0, display:'inline-block', marginRight:'6px' }}/>}
        <div style={{ fontSize:'13px', color: active ? B : '#0C0C0C', fontWeight: active ? '600' : '400', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{primary}</div>
        {secondary && <div style={{ fontSize:'11px', color:'#aaa', marginTop:'1px' }}>{secondary}</div>}
      </div>
    </div>
  );
};

const ChatPanel = ({ history }) => {
  const [filter, setFilter] = useState('today');
  const [search, setSearch] = useState('');
  const items = history.length > 0 ? history.slice(-8).reverse() : [];
  const filtered = items.filter(i => !search || i.input?.toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <div style={{ padding:'10px 12px 6px', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'#fff', border:`1px solid ${BORDER}`, borderRadius:'10px', padding:'8px 12px' }}>
          <FiSearch size={13} style={{ color:'#bbb', flexShrink:0 }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search chats..."
            style={{ flex:1, border:'none', outline:'none', background:'transparent', fontSize:'13px', color:'#0C0C0C' }}/>
        </div>
      </div>
      <div style={{ display:'flex', gap:'4px', padding:'0 12px 8px', flexShrink:0 }}>
        {['today','yesterday','all'].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{
            padding:'4px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'500', cursor:'pointer', border:'none',
            background: filter===f ? B : 'transparent',
            color: filter===f ? '#fff' : '#888',
            transition:'all 0.15s',
          }}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>
        ))}
      </div>
      <div style={{ flex:1, overflowY:'auto' }}>
        <SectionHdr title={`Recent (${filtered.length})`} />
        {filtered.length === 0
          ? <p style={{ padding:'16px', fontSize:'12px', color:'#bbb', textAlign:'center' }}>Start chatting to see history here</p>
          : filtered.map((item,i) => (
            <Row key={i} primary={item.input}
              secondary={item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : 'Just now'}
              active={i===0}
              avatar={(item.input?.[0] || 'C').toUpperCase()}
            />
          ))
        }
      </div>
    </div>
  );
};

const MemoryPanel = ({ stats }) => {
  const items = [
    { label:'Strategies learned', value: stats?.total_strategies??'—' },
    { label:'User preferences',   value: stats?.total_preferences??'—' },
    { label:'Patterns detected',  value: stats?.total_patterns??'—' },
    { label:'Failures analysed',  value: stats?.total_failures??'—' },
  ];
  return (
    <div style={{ flex:1, overflowY:'auto' }}>
      <SectionHdr title="Adaptive Memory" />
      <div style={{ padding:'8px 16px 4px' }}>
        {items.map(it=>(
          <div key={it.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:`1px solid ${BORDER}` }}>
            <span style={{ fontSize:'12px', color:'#777' }}>{it.label}</span>
            <span style={{ fontSize:'12px', color:B, fontFamily:'monospace', fontWeight:'600' }}>{it.value}</span>
          </div>
        ))}
      </div>
      <SectionHdr title="Learning" />
      <div style={{ padding:'0 16px 8px' }}>
        <p style={{ fontSize:'12px', color:'#aaa', lineHeight:'1.7' }}>Airis learns from every interaction — strategies, preferences and patterns stored automatically.</p>
      </div>
    </div>
  );
};

const RemindersPanel = ({ reminders, onRefresh }) => {
  const [text, setText] = useState('');
  const [when, setWhen] = useState('tomorrow');
  const [adding, setAdding] = useState(false);
  const add = async () => {
    if (!text.trim()) return;
    setAdding(true);
    try { await api.addReminder(text.trim(), when); setText(''); onRefresh?.(); } catch {}
    setAdding(false);
  };
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <SectionHdr title={`Upcoming (${reminders.length})`} onRefresh={onRefresh} />
      <div style={{ flex:1, overflowY:'auto' }}>
        {reminders.length===0
          ? <p style={{ padding:'16px', fontSize:'12px', color:'#bbb', textAlign:'center' }}>No reminders yet</p>
          : reminders.map((r,i)=><Row key={i} primary={r.text||r.title||JSON.stringify(r)} secondary={r.when||r.time||''} dot dotColor={r.completed?'#00C48C':B} avatar="⏰"/>)
        }
      </div>
      <div style={{ borderTop:`1px solid ${BORDER}`, padding:'10px 12px', flexShrink:0 }}>
        <input value={text} onChange={e=>setText(e.target.value)} placeholder="New reminder..."
          onKeyDown={e=>e.key==='Enter'&&add()}
          style={{ width:'100%', marginBottom:'6px', padding:'8px 12px', background:'#fff', border:`1px solid ${BORDER}`, borderRadius:'8px', color:'#0C0C0C', fontSize:'13px', outline:'none', boxSizing:'border-box' }}
          onFocus={e=>e.target.style.borderColor=B} onBlur={e=>e.target.style.borderColor=BORDER}/>
        <div style={{ display:'flex', gap:'6px' }}>
          <input value={when} onChange={e=>setWhen(e.target.value)} placeholder="when (e.g. tomorrow 9am)"
            style={{ flex:1, padding:'8px 10px', background:'#fff', border:`1px solid ${BORDER}`, borderRadius:'8px', color:'#0C0C0C', fontSize:'12px', outline:'none' }}/>
          <button onClick={add} disabled={adding||!text.trim()}
            style={{ padding:'8px 14px', background:`linear-gradient(135deg,${B},#2C76FF)`, border:'none', borderRadius:'8px', color:'#fff', fontSize:'12px', cursor:'pointer', fontWeight:'500' }}>
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

const WATCHLIST = [
  { symbol:'RELIANCE' },
  { symbol:'TCS' },
  { symbol:'HDFC' },
  { symbol:'INFY' },
  { symbol:'WIPRO' },
  { symbol:'NIFTY50' },
];

const TradingPanel = () => (
  <div style={{ flex:1, overflowY:'auto' }}>
    <SectionHdr title="Watchlist" onRefresh={()=>{}}/>
    <div style={{ padding:'10px 16px 6px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'9px 12px', background:'rgba(67,125,253,0.06)', border:'1px solid rgba(67,125,253,0.15)', borderRadius:'8px', marginBottom:'8px' }}>
        <FiTrendingUp size={13} style={{ color:B }}/>
        <span style={{ fontSize:'11px', color:'#555' }}>Live prices load via backend. Ask Airis for NIFTY analysis.</span>
      </div>
    </div>
    {WATCHLIST.map(s=>(
      <div key={s.symbol}
        style={{ padding:'9px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', borderRadius:'8px', margin:'1px 8px', transition:'background 0.1s' }}
        onMouseEnter={e=>e.currentTarget.style.background='rgba(67,125,253,0.04)'}
        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
        <div>
          <div style={{ fontSize:'12px', color:'#0C0C0C', fontWeight:'600', fontFamily:'monospace' }}>{s.symbol}</div>
          <div style={{ fontSize:'11px', color:'#bbb', fontFamily:'monospace' }}>Ask Airis for price</div>
        </div>
        <span style={{ fontSize:'11px', color:'#ccc', fontFamily:'monospace' }}>—</span>
      </div>
    ))}
    <SectionHdr title="Quick Commands"/>
    {['Get NIFTY trend','Show portfolio','Top gainers today','Options analysis'].map(cmd=>(
      <Row key={cmd} primary={cmd}/>
    ))}
  </div>
);

const SkillsPanel = ({ caps }) => {
  const categories = [...new Set(caps.map(c=>c.category))];
  return (
    <div style={{ flex:1, overflowY:'auto' }}>
      {categories.map(cat=>(
        <div key={cat}>
          <SectionHdr title={cat}/>
          {caps.filter(c=>c.category===cat).map(c=>(
            <div key={c.id} style={{ padding:'8px 16px', borderBottom:`1px solid ${BORDER}` }}>
              <div style={{ fontSize:'13px', color:'#0C0C0C', display:'flex', alignItems:'center', gap:'8px' }}>
                <span style={{ fontSize:'16px' }}>{c.icon}</span><span style={{ fontWeight:'500' }}>{c.name}</span>
              </div>
              <div style={{ fontSize:'11px', color:'#aaa', marginTop:'2px' }}>{c.desc}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const AnalyticsPanel = ({ data }) => {
  const metrics = [
    { label:'Total interactions',  value: data?.interactions??0 },
    { label:'Commands run',        value: data?.total_executions??0 },
    { label:'Success rate',        value: data?.success_rate??'—' },
    { label:'Strategies learned',  value: data?.strategies_learned??0 },
    { label:'Patterns detected',   value: data?.patterns_detected??0 },
    { label:'Session messages',    value: data?.history_count??0 },
  ];
  return (
    <div style={{ flex:1, overflowY:'auto' }}>
      <SectionHdr title="This Session" onRefresh={()=>{}}/>
      <div style={{ padding:'8px 16px 4px' }}>
        {metrics.map(m=>(
          <div key={m.label} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:`1px solid ${BORDER}` }}>
            <span style={{ fontSize:'12px', color:'#777' }}>{m.label}</span>
            <span style={{ fontSize:'12px', color:B, fontFamily:'monospace', fontWeight:'600' }}>{m.value}</span>
          </div>
        ))}
      </div>
      <SectionHdr title="Status"/>
      <div style={{ padding:'8px 16px' }}>
        {[
          { ok:true,  label:'12-Layer AI Brain active' },
          { ok:true,  label:'Adaptive memory running' },
          { ok:false, label:'Voice cloning (needs Fish Audio key)' },
          { ok:false, label:'Wake word (desktop only)' },
          { ok:true,  label:'Browser voice input ready' },
        ].map((s,i)=>(
          <div key={i} style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
            {s.ok ? <FiCheckCircle size={13} style={{ color:'#00C48C', flexShrink:0 }}/>
                  : <FiAlertTriangle size={13} style={{ color:'#FF8C42', flexShrink:0 }}/>}
            <span style={{ fontSize:'12px', color: s.ok?'#0C0C0C':'#aaa' }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const BrainPanel = ({ layers }) => (
  <div style={{ flex:1, overflowY:'auto' }}>
    <SectionHdr title="12-Layer AI Pipeline"/>
    {(layers.length ? layers : Array.from({length:12},(_,i)=>({n:i+1,name:`Layer ${i+1}`,desc:''}))).map(l=>(
      <div key={l.n} style={{ padding:'8px 16px', borderBottom:`1px solid ${BORDER}`, display:'flex', gap:'10px', alignItems:'flex-start' }}>
        <div style={{ minWidth:'24px', height:'24px', borderRadius:'6px', background:'rgba(67,125,253,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', color:B, fontFamily:'monospace', fontWeight:'700', flexShrink:0, marginTop:'1px' }}>
          {String(l.n).padStart(2,'0')}
        </div>
        <div>
          <div style={{ fontSize:'12px', color:'#0C0C0C', fontWeight:'500' }}>{l.name}</div>
          <div style={{ fontSize:'11px', color:'#aaa', marginTop:'1px' }}>{l.desc}</div>
        </div>
      </div>
    ))}
    <div style={{ padding:'12px 16px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 12px', background:'rgba(0,196,140,0.06)', border:'1px solid rgba(0,196,140,0.2)', borderRadius:'8px' }}>
        <FiActivity size={13} style={{ color:'#00C48C' }}/>
        <span style={{ fontSize:'11px', color:'#00C48C', fontWeight:'500' }}>All layers active — Multi-Agent mode enabled</span>
      </div>
    </div>
  </div>
);

const Sidebar = ({ activePanel, isOpen, isMobile, onClose }) => {
  const [history,   setHistory]   = useState([]);
  const [reminders, setReminders] = useState([]);
  const [memStats,  setMemStats]  = useState({});
  const [caps,      setCaps]      = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [layers,    setLayers]    = useState([]);

  useEffect(() => {
    const load = async () => {
      try { const r = await api.getHistory();      setHistory(r.history||[]);      } catch {}
      try { const r = await api.getReminders();    setReminders(r.reminders||[]);  } catch {}
      try { const r = await api.getMemoryStats();  setMemStats(r.stats||{});       } catch {}
      try { const r = await api.getCapabilities(); setCaps(r.capabilities||[]);    } catch {}
      try { const r = await api.getAnalytics();    setAnalytics(r.analytics||{});  } catch {}
      try { const r = await api.getSystemLayers(); setLayers(r.layers||[]);        } catch {}
    };
    load();
  }, []);

  const refreshReminders = async () => {
    try { const r = await api.getReminders(); setReminders(r.reminders||[]); } catch {}
  };

  if (!isOpen) return null;

  const config    = TITLES[activePanel]||TITLES.chat;
  const TitleIcon = config.icon;

  const panelContent = (
    <>
      <div style={{ height:'52px', display:'flex', alignItems:'center', gap:'8px', padding:'0 16px', borderBottom:`1px solid ${BORDER}`, flexShrink:0, justifyContent:'space-between', background:'#fff' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <div style={{ width:'28px', height:'28px', borderRadius:'8px', background:'rgba(67,125,253,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <TitleIcon size={14} style={{ color:B }}/>
          </div>
          <span style={{ fontSize:'13px', fontWeight:'600', color:'#0C0C0C' }}>
            {config.label}
          </span>
        </div>
        {isMobile && (
          <button onClick={onClose} style={{ display:'flex', alignItems:'center', justifyContent:'center', width:'28px', height:'28px', borderRadius:'8px', background:'rgba(0,0,0,0.04)', border:`1px solid ${BORDER}`, color:'#aaa', cursor:'pointer' }}>
            <FiX size={14}/>
          </button>
        )}
      </div>
      {activePanel==='chat'      && <ChatPanel history={history}/>}
      {activePanel==='memory'    && <MemoryPanel stats={memStats}/>}
      {activePanel==='trading'   && <TradingPanel/>}
      {activePanel==='reminders' && <RemindersPanel reminders={reminders} onRefresh={refreshReminders}/>}
      {activePanel==='skills'    && <SkillsPanel caps={caps}/>}
      {activePanel==='analytics' && <AnalyticsPanel data={analytics}/>}
      {activePanel==='brain'     && <BrainPanel layers={layers}/>}
    </>
  );

  if (isMobile) {
    return (
      <>
        <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:40, backgroundColor:'rgba(0,0,0,0.25)', backdropFilter:'blur(4px)' }}/>
        <div style={{
          position:'fixed', top:0, left:0, bottom:0, zIndex:50,
          width:'min(85vw,300px)', background:'#F8F7F5',
          borderRight:`1px solid ${BORDER}`, display:'flex', flexDirection:'column',
          overflow:'hidden', animation:'slideInLeft 0.22s ease-out',
          boxShadow:'8px 0 32px rgba(0,0,0,0.1)',
        }}>
          {panelContent}
        </div>
      </>
    );
  }

  return (
    <div style={{ width:'240px', flexShrink:0, background:'#F8F7F5', borderRight:`1px solid ${BORDER}`, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {panelContent}
    </div>
  );
};

export default Sidebar;
