import { useState, useEffect } from 'react';
import {
  FiMessageSquare, FiDatabase, FiTrendingUp, FiBell,
  FiZap, FiBarChart2, FiCpu, FiPlus, FiRefreshCw,
  FiCheckCircle, FiAlertTriangle, FiActivity, FiX,
} from 'react-icons/fi';
import { api } from '../services/api';

const TITLES = {
  chat:       { label: 'Chat History',          icon: FiMessageSquare },
  memory:     { label: 'Memory',                 icon: FiDatabase },
  trading:    { label: 'Trading',                icon: FiTrendingUp },
  reminders:  { label: 'Reminders',              icon: FiBell },
  skills:     { label: 'Capabilities',           icon: FiZap },
  analytics:  { label: 'Analytics',              icon: FiBarChart2 },
  brain:      { label: 'AI Brain',               icon: FiCpu },
};

// ── Shared helpers ─────────────────────────────────────────────────────────

const SectionHdr = ({ title, onAdd, onRefresh }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '4px 12px 4px 14px', height: '28px', flexShrink: 0,
  }}>
    <span style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#5a5a5a' }}>
      {title}
    </span>
    <div style={{ display: 'flex', gap: '2px' }}>
      {onRefresh && (
        <button onClick={onRefresh} title="Refresh"
          style={{ display:'flex', alignItems:'center', justifyContent:'center', width:'18px', height:'18px', backgroundColor:'transparent', border:'none', color:'#4a4a4a', cursor:'pointer', borderRadius:'3px' }}
          onMouseEnter={e => e.currentTarget.style.color='#e8e8e8'}
          onMouseLeave={e => e.currentTarget.style.color='#4a4a4a'}>
          <FiRefreshCw size={11} />
        </button>
      )}
      {onAdd && (
        <button onClick={onAdd} title="Add"
          style={{ display:'flex', alignItems:'center', justifyContent:'center', width:'18px', height:'18px', backgroundColor:'transparent', border:'none', color:'#4a4a4a', cursor:'pointer', borderRadius:'3px' }}
          onMouseEnter={e => e.currentTarget.style.color='#e8e8e8'}
          onMouseLeave={e => e.currentTarget.style.color='#4a4a4a'}>
          <FiPlus size={11} />
        </button>
      )}
    </div>
  </div>
);

const Row = ({ primary, secondary, active, dot, dotColor }) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '7px 14px', cursor: 'pointer',
        backgroundColor: active ? '#1e2a3a' : hov ? '#161616' : 'transparent',
        borderLeft: `2px solid ${active ? '#3b82f6' : 'transparent'}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {dot && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: dotColor || '#3b82f6', flexShrink: 0 }} />}
        <div style={{ fontSize: '13px', color: active ? '#e8e8e8' : '#b0b0b0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
          {primary}
        </div>
      </div>
      {secondary && <div style={{ fontSize: '11px', color: '#4a4a4a', marginTop: '1px', paddingLeft: dot ? '12px' : '0' }}>{secondary}</div>}
    </div>
  );
};

// ── Panel components ───────────────────────────────────────────────────────

const ChatPanel = ({ history }) => {
  const items = history.length > 0 ? history.slice(-8).reverse() : [
    { input: 'Analyze NIFTY trend', timestamp: '' },
    { input: 'Open VS Code',        timestamp: '' },
    { input: 'Check emails',        timestamp: '' },
  ];
  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <SectionHdr title={`Recent (${items.length})`} />
      {items.map((item, i) => (
        <Row key={i} primary={item.input}
          secondary={item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : ''}
          active={i === 0} />
      ))}
    </div>
  );
};

const MemoryPanel = ({ stats }) => {
  const items = [
    { label: 'Strategies learned',  value: stats?.total_strategies ?? '—' },
    { label: 'User preferences',    value: stats?.total_preferences ?? '—' },
    { label: 'Patterns detected',   value: stats?.total_patterns    ?? '—' },
    { label: 'Failures analysed',   value: stats?.total_failures    ?? '—' },
  ];
  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <SectionHdr title="Adaptive Memory" />
      <div style={{ padding: '8px 14px 4px' }}>
        {items.map(it => (
          <div key={it.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid #111' }}>
            <span style={{ fontSize: '12px', color: '#8b8b8b' }}>{it.label}</span>
            <span style={{ fontSize: '12px', color: '#3b82f6', fontFamily: 'Geist Mono, monospace' }}>{it.value}</span>
          </div>
        ))}
      </div>
      <SectionHdr title="Learning" />
      <div style={{ padding: '0 14px 8px' }}>
        <p style={{ fontSize: '12px', color: '#4a4a4a', lineHeight: '1.6' }}>
          Jarvis learns from every interaction — strategies, preferences and patterns are stored automatically.
        </p>
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
    try { await api.addReminder(text.trim(), when); setText(''); onRefresh?.(); }
    catch (e) { console.error(e); }
    setAdding(false);
  };
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <SectionHdr title={`Upcoming (${reminders.length})`} onRefresh={onRefresh} />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {reminders.length === 0
          ? <p style={{ padding: '12px 14px', fontSize: '12px', color: '#4a4a4a' }}>No reminders yet</p>
          : reminders.map((r, i) => (
            <Row key={i} primary={r.text || r.title || JSON.stringify(r)}
              secondary={r.when || r.time || ''} dot dotColor={r.completed ? '#10b981' : '#3b82f6'} />
          ))
        }
      </div>
      <div style={{ borderTop: '1px solid #1a1a1a', padding: '8px 10px', flexShrink: 0 }}>
        <input value={text} onChange={e => setText(e.target.value)}
          placeholder="New reminder..." onKeyDown={e => e.key === 'Enter' && add()}
          style={{ width: '100%', marginBottom: '4px', padding: '7px 8px', backgroundColor: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '3px', color: '#e8e8e8', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
        <div style={{ display: 'flex', gap: '4px' }}>
          <input value={when} onChange={e => setWhen(e.target.value)}
            placeholder="when (e.g. tomorrow 9am)"
            style={{ flex: 1, padding: '7px 8px', backgroundColor: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '3px', color: '#e8e8e8', fontSize: '12px', outline: 'none' }} />
          <button onClick={add} disabled={adding || !text.trim()}
            style={{ padding: '7px 12px', backgroundColor: '#3b82f6', border: 'none', borderRadius: '3px', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

const WATCHLIST = [
  { symbol: 'RELIANCE.NS', price: '2,847', change: '+1.2%', up: true },
  { symbol: 'TCS.NS',      price: '3,712', change: '-0.4%', up: false },
  { symbol: 'HDFCBANK.NS', price: '1,654', change: '+0.8%', up: true },
  { symbol: 'INFY.NS',     price: '1,890', change: '+2.1%', up: true },
  { symbol: 'WIPRO.NS',    price: '542',   change: '-1.1%', up: false },
  { symbol: 'NIFTY50',     price: '24,310',change: '+0.6%', up: true },
];
const TradingPanel = () => (
  <div style={{ flex: 1, overflowY: 'auto' }}>
    <SectionHdr title="Watchlist" onRefresh={() => {}} />
    {WATCHLIST.map(s => (
      <div key={s.symbol}
        style={{ padding: '7px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#161616'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
        <div>
          <div style={{ fontSize: '12px', color: '#c8c8c8', fontFamily: 'Geist Mono, monospace' }}>{s.symbol}</div>
          <div style={{ fontSize: '11px', color: '#4a4a4a', fontFamily: 'Geist Mono, monospace' }}>₹{s.price}</div>
        </div>
        <span style={{ fontSize: '12px', color: s.up ? '#10b981' : '#ef4444', fontFamily: 'Geist Mono, monospace' }}>{s.change}</span>
      </div>
    ))}
    <SectionHdr title="Quick Commands" />
    {['Get NIFTY trend', 'Show portfolio', 'Top gainers today', 'Options analysis'].map(cmd => (
      <Row key={cmd} primary={cmd} />
    ))}
  </div>
);

const SkillsPanel = ({ caps }) => {
  const categories = [...new Set(caps.map(c => c.category))];
  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {categories.map(cat => (
        <div key={cat}>
          <SectionHdr title={cat} />
          {caps.filter(c => c.category === cat).map(c => (
            <div key={c.id} style={{ padding: '7px 14px', borderBottom: '1px solid #0d0d0d' }}>
              <div style={{ fontSize: '13px', color: '#c8c8c8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{c.icon}</span><span>{c.name}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#4a4a4a', marginTop: '2px' }}>{c.desc}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const AnalyticsPanel = ({ data }) => {
  const metrics = [
    { label: 'Total interactions',  value: data?.interactions      ?? 0 },
    { label: 'Commands run',        value: data?.total_executions  ?? 0 },
    { label: 'Success rate',        value: data?.success_rate      ?? '—' },
    { label: 'Strategies learned',  value: data?.strategies_learned ?? 0 },
    { label: 'Patterns detected',   value: data?.patterns_detected ?? 0 },
    { label: 'Session messages',    value: data?.history_count     ?? 0 },
  ];
  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <SectionHdr title="This Session" onRefresh={() => {}} />
      <div style={{ padding: '8px 14px 4px' }}>
        {metrics.map(m => (
          <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #111' }}>
            <span style={{ fontSize: '12px', color: '#6a6a6a' }}>{m.label}</span>
            <span style={{ fontSize: '12px', color: '#3b82f6', fontFamily: 'Geist Mono, monospace' }}>{m.value}</span>
          </div>
        ))}
      </div>
      <SectionHdr title="Status" />
      <div style={{ padding: '8px 14px' }}>
        {[
          { ok: true,  label: '12-Layer AI Brain active' },
          { ok: true,  label: 'Adaptive memory running' },
          { ok: false, label: 'Voice cloning (needs Fish Audio key)' },
          { ok: false, label: 'Wake word (desktop only)' },
          { ok: true,  label: 'Browser voice input ready' },
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            {s.ok
              ? <FiCheckCircle size={12} style={{ color: '#10b981', flexShrink: 0 }} />
              : <FiAlertTriangle size={12} style={{ color: '#f59e0b', flexShrink: 0 }} />}
            <span style={{ fontSize: '12px', color: s.ok ? '#8b8b8b' : '#5a5a5a' }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const BrainPanel = ({ layers }) => (
  <div style={{ flex: 1, overflowY: 'auto' }}>
    <SectionHdr title="12-Layer AI Pipeline" />
    {(layers.length ? layers : Array.from({ length: 12 }, (_, i) => ({ n: i + 1, name: `Layer ${i + 1}`, desc: '' }))).map(l => (
      <div key={l.n} style={{ padding: '6px 14px', borderBottom: '1px solid #0d0d0d', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
        <div style={{ minWidth: '20px', height: '20px', borderRadius: '4px', backgroundColor: '#1a2a3a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#3b82f6', fontFamily: 'Geist Mono, monospace', flexShrink: 0, marginTop: '1px' }}>
          {String(l.n).padStart(2, '0')}
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#c8c8c8', fontWeight: '500' }}>{l.name}</div>
          <div style={{ fontSize: '11px', color: '#4a4a4a', marginTop: '1px' }}>{l.desc}</div>
        </div>
      </div>
    ))}
    <div style={{ padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px', backgroundColor: '#0d1a0d', border: '1px solid #10b98122', borderRadius: '4px' }}>
        <FiActivity size={12} style={{ color: '#10b981' }} />
        <span style={{ fontSize: '11px', color: '#10b981' }}>All layers active — Multi-Agent mode enabled</span>
      </div>
    </div>
  </div>
);

// ── Main Sidebar ───────────────────────────────────────────────────────────

const Sidebar = ({ activePanel, isOpen, isMobile, onClose }) => {
  const [history,    setHistory]    = useState([]);
  const [reminders,  setReminders]  = useState([]);
  const [memStats,   setMemStats]   = useState({});
  const [caps,       setCaps]       = useState([]);
  const [analytics,  setAnalytics]  = useState({});
  const [layers,     setLayers]     = useState([]);

  useEffect(() => {
    const load = async () => {
      try { const r = await api.getHistory();      setHistory(r.history || []);      } catch {}
      try { const r = await api.getReminders();    setReminders(r.reminders || []);  } catch {}
      try { const r = await api.getMemoryStats();  setMemStats(r.stats || {});       } catch {}
      try { const r = await api.getCapabilities(); setCaps(r.capabilities || []);    } catch {}
      try { const r = await api.getAnalytics();    setAnalytics(r.analytics || {});  } catch {}
      try { const r = await api.getSystemLayers(); setLayers(r.layers || []);        } catch {}
    };
    load();
  }, []);

  const refreshReminders = async () => {
    try { const r = await api.getReminders(); setReminders(r.reminders || []); } catch {}
  };

  if (!isOpen) return null;

  const config    = TITLES[activePanel] || TITLES.chat;
  const TitleIcon = config.icon;

  const panelContent = (
    <>
      {/* Header */}
      <div style={{
        height: '48px', display: 'flex', alignItems: 'center', gap: '8px',
        padding: '0 14px', borderBottom: '1px solid #1e1e1e', flexShrink: 0,
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <TitleIcon size={13} style={{ color: '#4a4a4a' }} />
          <span style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6a6a6a' }}>
            {config.label}
          </span>
        </div>
        {isMobile && (
          <button onClick={onClose} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '32px', height: '32px', borderRadius: '6px',
            backgroundColor: 'transparent', border: 'none',
            color: '#5a5a5a', cursor: 'pointer',
          }}
            onMouseEnter={e => e.currentTarget.style.color = '#e8e8e8'}
            onMouseLeave={e => e.currentTarget.style.color = '#5a5a5a'}>
            <FiX size={16} />
          </button>
        )}
      </div>

      {/* Panel body */}
      {activePanel === 'chat'      && <ChatPanel history={history} />}
      {activePanel === 'memory'    && <MemoryPanel stats={memStats} />}
      {activePanel === 'trading'   && <TradingPanel />}
      {activePanel === 'reminders' && <RemindersPanel reminders={reminders} onRefresh={refreshReminders} />}
      {activePanel === 'skills'    && <SkillsPanel caps={caps} />}
      {activePanel === 'analytics' && <AnalyticsPanel data={analytics} />}
      {activePanel === 'brain'     && <BrainPanel layers={layers} />}
    </>
  );

  // ── Mobile: full-screen overlay drawer ────────────────────────────────
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div onClick={onClose} style={{
          position: 'fixed', inset: 0, zIndex: 40,
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(2px)',
        }} />
        {/* Drawer */}
        <div style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
          width: 'min(85vw, 320px)',
          backgroundColor: '#111111',
          borderRight: '1px solid #1e1e1e',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          animation: 'slideInLeft 0.2s ease-out',
        }}>
          {panelContent}
        </div>
        <style>{`@keyframes slideInLeft { from { transform: translateX(-100%) } to { transform: translateX(0) } }`}</style>
      </>
    );
  }

  // ── Desktop: static inline panel ──────────────────────────────────────
  return (
    <div style={{
      width: '240px', flexShrink: 0,
      backgroundColor: '#111111', borderRight: '1px solid #1e1e1e',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {panelContent}
    </div>
  );
};

export default Sidebar;
