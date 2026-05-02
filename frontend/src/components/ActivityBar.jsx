import { useState } from 'react';
import {
  FiMessageSquare, FiDatabase, FiTrendingUp, FiBell,
  FiCommand, FiSettings, FiZap, FiBarChart2, FiCpu, FiCode,
} from 'react-icons/fi';

const ITEMS = {
  chat:      { icon: FiMessageSquare, label: 'Chat',      grad: 'linear-gradient(135deg,#7c3aed,#a855f7)' },
  memory:    { icon: FiDatabase,      label: 'Memory',    grad: 'linear-gradient(135deg,#2563eb,#38bdf8)' },
  trading:   { icon: FiTrendingUp,    label: 'Trading',   grad: 'linear-gradient(135deg,#059669,#34d399)' },
  reminders: { icon: FiBell,          label: 'Reminders', grad: 'linear-gradient(135deg,#d97706,#fbbf24)' },
  skills:    { icon: FiZap,           label: 'Skills',    grad: 'linear-gradient(135deg,#dc2626,#f87171)' },
  analytics: { icon: FiBarChart2,     label: 'Analytics', grad: 'linear-gradient(135deg,#0891b2,#22d3ee)' },
  brain:     { icon: FiCpu,           label: 'Brain',     grad: 'linear-gradient(135deg,#be185d,#f472b6)' },
  vibe:      { icon: FiCode,          label: 'Code',      grad: 'linear-gradient(135deg,#7c3aed,#6d28d9)' },
  command:   { icon: FiCommand,       label: 'Command',   grad: 'linear-gradient(135deg,#4b5563,#9ca3af)' },
  settings:  { icon: FiSettings,      label: 'Settings',  grad: 'linear-gradient(135deg,#4b5563,#9ca3af)' },
};

const TOP    = ['chat', 'memory', 'trading', 'reminders', 'skills', 'analytics', 'brain', 'vibe'];
const BOTTOM = ['command', 'settings'];
const MOBILE_NAV = ['chat', 'trading', 'vibe', 'brain', 'settings'];

const Tooltip = ({ label, visible }) =>
  visible ? (
    <div style={{
      position: 'absolute', left: '60px', top: '50%', transform: 'translateY(-50%)',
      backgroundColor: '#1a1733', color: '#f0eeff',
      fontSize: '12px', fontWeight: '500',
      padding: '5px 10px', borderRadius: '8px', whiteSpace: 'nowrap',
      pointerEvents: 'none', zIndex: 200,
      boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
    }}>
      {label}
      <div style={{ position:'absolute', left:'-4px', top:'50%', transform:'translateY(-50%) rotate(45deg)', width:'7px', height:'7px', backgroundColor:'#1a1733' }} />
    </div>
  ) : null;

const IconBtn = ({ id, active, onClick }) => {
  const [hov, setHov] = useState(false);
  const { icon: Icon, label, grad } = ITEMS[id];
  return (
    <button
      onClick={() => onClick(id)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={label}
      style={{
        position: 'relative',
        width: '52px', height: '52px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'transparent',
        border: 'none', cursor: 'pointer',
        transition: 'all 0.15s', flexShrink: 0,
        borderRadius: '0',
      }}
    >
      <div style={{
        width: '36px', height: '36px', borderRadius: '10px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? grad : hov ? 'rgba(255,255,255,0.1)' : 'transparent',
        transition: 'all 0.18s',
        boxShadow: active ? '0 4px 12px rgba(0,0,0,0.3)' : 'none',
      }}>
        <Icon
          size={18}
          strokeWidth={active ? 2.2 : 1.8}
          style={{ color: active ? '#ffffff' : hov ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.38)' }}
        />
      </div>
      <Tooltip label={label} visible={hov && !active} />
    </button>
  );
};

const MobileTabBtn = ({ id, active, onClick }) => {
  const { icon: Icon, label, grad } = ITEMS[id];
  return (
    <button onClick={() => onClick(id)} style={{
      flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '3px',
      padding: '6px 4px 4px',
      backgroundColor: 'transparent', border: 'none',
      cursor: 'pointer', transition: 'color 0.15s', position: 'relative',
    }}>
      {active && (
        <div style={{
          position: 'absolute', top: 0, left: '20%', right: '20%', height: '2px',
          background: grad, borderRadius: '0 0 3px 3px',
        }} />
      )}
      <Icon size={20} strokeWidth={active ? 2.2 : 1.6}
        style={{ color: active ? '#7c3aed' : 'rgba(255,255,255,0.45)' }} />
      <span style={{ fontSize: '10px', fontWeight: active ? '600' : '400',
        color: active ? '#a78bfa' : 'rgba(255,255,255,0.38)' }}>{label}</span>
    </button>
  );
};

const ActivityBar = ({ activePanel, onPanelChange, onCommandOpen, isMobile }) => {
  const handleClick = (id) => {
    if (id === 'command') onCommandOpen?.();
    else onPanelChange(id);
  };

  if (isMobile) {
    return (
      <div style={{
        height: '58px', flexShrink: 0,
        background: '#1a1733',
        borderTop: '1px solid rgba(255,255,255,0.08)',
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
      width: '52px', flexShrink: 0,
      background: '#1a1733',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'space-between',
      userSelect: 'none', overflow: 'visible',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          width: '52px', height: '52px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          marginBottom: '4px',
        }}>
          <div style={{
            width: '30px', height: '30px', borderRadius: '8px',
            background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(124,58,237,0.5)',
          }}>
            <FiCpu size={15} style={{ color: '#fff' }} strokeWidth={2.2} />
          </div>
        </div>
        {TOP.map(id => (
          <IconBtn key={id} id={id} active={activePanel === id} onClick={handleClick} />
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '8px' }}>
        {BOTTOM.map(id => (
          <IconBtn key={id} id={id} active={activePanel === id} onClick={handleClick} />
        ))}
        {/* User avatar */}
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%', margin: '8px auto 0',
          background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', fontWeight: '700', color: '#fff',
          cursor: 'pointer', border: '2px solid rgba(255,255,255,0.15)',
          boxShadow: '0 0 0 2px rgba(124,58,237,0.4)',
        }}>
          J
        </div>
      </div>
    </div>
  );
};

export default ActivityBar;
