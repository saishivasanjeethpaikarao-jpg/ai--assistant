import { useState } from 'react';
import {
  FiMessageSquare, FiDatabase, FiTrendingUp, FiBell,
  FiCommand, FiSettings, FiZap, FiBarChart2, FiCpu, FiCode,
} from 'react-icons/fi';

const ITEMS = {
  chat:       { icon: FiMessageSquare, label: 'Chat' },
  memory:     { icon: FiDatabase,      label: 'Memory' },
  trading:    { icon: FiTrendingUp,    label: 'Trading' },
  reminders:  { icon: FiBell,          label: 'Reminders' },
  skills:     { icon: FiZap,           label: 'Skills' },
  analytics:  { icon: FiBarChart2,     label: 'Analytics' },
  brain:      { icon: FiCpu,           label: 'Brain' },
  vibe:       { icon: FiCode,          label: 'Vibe' },
  command:    { icon: FiCommand,       label: 'Command' },
  settings:   { icon: FiSettings,      label: 'Settings' },
};

const TOP    = ['chat', 'memory', 'trading', 'reminders', 'skills', 'analytics', 'brain', 'vibe'];
const BOTTOM = ['command', 'settings'];
const MOBILE_NAV = ['chat', 'trading', 'vibe', 'brain', 'settings'];

// ── Tooltip ────────────────────────────────────────────────────────────────
const Tooltip = ({ label, visible }) => (
  visible ? (
    <div style={{
      position: 'absolute', left: '54px', top: '50%', transform: 'translateY(-50%)',
      backgroundColor: 'rgba(15, 8, 35, 0.95)',
      border: '1px solid rgba(138,92,246,0.3)',
      color: '#e8e0ff', fontSize: '12px', fontWeight: '500',
      padding: '5px 10px', borderRadius: '6px', whiteSpace: 'nowrap',
      pointerEvents: 'none', zIndex: 100,
      boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
    }}>
      {label}
      <div style={{ position:'absolute', left:'-4px', top:'50%', transform:'translateY(-50%) rotate(45deg)', width:'7px', height:'7px', backgroundColor:'rgba(15,8,35,0.95)', border:'1px solid rgba(138,92,246,0.3)', borderRight:'none', borderTop:'none' }} />
    </div>
  ) : null
);

// ── Desktop icon button ────────────────────────────────────────────────────
const IconBtn = ({ id, active, onClick }) => {
  const [hov, setHov] = useState(false);
  const { icon: Icon, label } = ITEMS[id];
  return (
    <button
      onClick={() => onClick(id)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={label}
      style={{
        position: 'relative',
        width: '48px', height: '48px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: active ? 'rgba(138,92,246,0.18)' : hov ? 'rgba(255,255,255,0.06)' : 'transparent',
        border: 'none',
        color: active ? '#c4b5fd' : hov ? '#d8d0f0' : 'rgba(180,160,220,0.55)',
        cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
        borderRadius: '0',
      }}
    >
      {active && (
        <div style={{
          position: 'absolute', left: 0, top: '10px', bottom: '10px',
          width: '2px',
          background: 'linear-gradient(to bottom, #8b5cf6, #c084fc)',
          borderRadius: '0 2px 2px 0',
        }} />
      )}
      <Icon size={19} strokeWidth={active ? 2 : 1.5} />
      <Tooltip label={label} visible={hov} />
    </button>
  );
};

// ── Mobile bottom tab ──────────────────────────────────────────────────────
const MobileTabBtn = ({ id, active, onClick }) => {
  const { icon: Icon, label } = ITEMS[id];
  return (
    <button onClick={() => onClick(id)} style={{
      flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '3px',
      padding: '6px 4px 4px',
      backgroundColor: 'transparent', border: 'none',
      color: active ? '#c4b5fd' : 'rgba(180,160,220,0.5)',
      cursor: 'pointer', transition: 'color 0.15s', position: 'relative',
    }}>
      {active && (
        <div style={{
          position: 'absolute', top: 0, left: '20%', right: '20%', height: '2px',
          background: 'linear-gradient(to right, #8b5cf6, #c084fc)',
          borderRadius: '0 0 2px 2px',
        }} />
      )}
      <Icon size={20} strokeWidth={active ? 2 : 1.5} />
      <span style={{ fontSize: '10px', fontWeight: active ? '600' : '400' }}>{label}</span>
    </button>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────
const ActivityBar = ({ activePanel, onPanelChange, onCommandOpen, isMobile }) => {
  const handleClick = (id) => {
    if (id === 'command') onCommandOpen?.();
    else onPanelChange(id);
  };

  if (isMobile) {
    return (
      <div style={{
        height: '56px', flexShrink: 0,
        background: 'rgba(8,4,20,0.88)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderTop: '1px solid rgba(138,92,246,0.18)',
        display: 'flex', alignItems: 'stretch',
        userSelect: 'none',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {MOBILE_NAV.map(id => (
          <MobileTabBtn key={id} id={id} active={activePanel === id} onClick={handleClick} />
        ))}
      </div>
    );
  }

  return (
    <div style={{
      width: '48px', flexShrink: 0,
      background: 'rgba(6,3,16,0.82)',
      backdropFilter: 'blur(24px) saturate(180%)',
      WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      borderRight: '1px solid rgba(138,92,246,0.12)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'space-between',
      userSelect: 'none', overflow: 'visible',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {TOP.map(id => (
          <IconBtn key={id} id={id} active={activePanel === id} onClick={handleClick} />
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '6px' }}>
        {BOTTOM.map(id => (
          <IconBtn key={id} id={id} active={activePanel === id} onClick={handleClick} />
        ))}
      </div>
    </div>
  );
};

export default ActivityBar;
