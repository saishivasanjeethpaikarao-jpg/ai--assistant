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
  skills:     { icon: FiZap,           label: 'Skills & Capabilities' },
  analytics:  { icon: FiBarChart2,     label: 'Analytics' },
  brain:      { icon: FiCpu,           label: '12-Layer AI Brain' },
  vibe:       { icon: FiCode,          label: 'Vibe Coder — Build with AI agents' },
  command:    { icon: FiCommand,       label: 'Command Palette (Ctrl+K)' },
  settings:   { icon: FiSettings,      label: 'Settings' },
};

const TOP = ['chat', 'memory', 'trading', 'reminders', 'skills', 'analytics', 'brain', 'vibe'];
const BOTTOM = ['command', 'settings'];

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
        backgroundColor: 'transparent', border: 'none',
        color: active ? '#e8e8e8' : hov ? '#cccccc' : '#606060',
        cursor: 'pointer', transition: 'color 0.1s', flexShrink: 0,
      }}
    >
      {active && (
        <div style={{
          position: 'absolute', left: 0, top: '10px', bottom: '10px',
          width: '2px', backgroundColor: '#3b82f6',
        }} />
      )}
      <Icon size={20} strokeWidth={active ? 2 : 1.5} />
    </button>
  );
};

const ActivityBar = ({ activePanel, onPanelChange, onCommandOpen }) => {
  const handleClick = (id) => {
    if (id === 'command') onCommandOpen?.();
    else onPanelChange(id);
  };

  return (
    <div style={{
      width: '48px', flexShrink: 0,
      backgroundColor: '#111111', borderRight: '1px solid #1e1e1e',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'space-between',
      userSelect: 'none', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {TOP.map(id => (
          <IconBtn key={id} id={id} active={activePanel === id} onClick={handleClick} />
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '4px' }}>
        {BOTTOM.map(id => (
          <IconBtn key={id} id={id} active={activePanel === id} onClick={handleClick} />
        ))}
      </div>
    </div>
  );
};

export default ActivityBar;
