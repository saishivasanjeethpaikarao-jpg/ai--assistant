import { useState } from 'react';
import {
  FiMessageSquare, FiDatabase, FiTrendingUp, FiBell,
  FiCommand, FiSettings
} from 'react-icons/fi';

const TOOLTIPS = {
  chat: 'Chat',
  memory: 'Memory',
  trading: 'Trading',
  reminders: 'Reminders',
  command: 'Command Palette (Ctrl+K)',
  settings: 'Settings',
};

const IconButton = ({ id, icon: Icon, active, onClick, bottom }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={() => onClick(id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={TOOLTIPS[id]}
      style={{
        position: 'relative',
        width: '48px',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        color: active ? '#e8e8e8' : hovered ? '#cccccc' : '#8b8b8b',
        transition: 'color 0.1s',
        flexShrink: 0,
      }}
    >
      {active && (
        <div style={{
          position: 'absolute',
          left: 0,
          top: '10px',
          bottom: '10px',
          width: '2px',
          backgroundColor: '#3b82f6',
        }} />
      )}
      <Icon size={22} strokeWidth={active ? 2 : 1.5} />
    </button>
  );
};

const ActivityBar = ({ activePanel, onPanelChange, onCommandOpen }) => {
  const topItems = [
    { id: 'chat', icon: FiMessageSquare },
    { id: 'memory', icon: FiDatabase },
    { id: 'trading', icon: FiTrendingUp },
    { id: 'reminders', icon: FiBell },
  ];

  const bottomItems = [
    { id: 'command', icon: FiCommand },
    { id: 'settings', icon: FiSettings },
  ];

  const handleClick = (id) => {
    if (id === 'command') {
      onCommandOpen?.();
    } else {
      onPanelChange(id);
    }
  };

  return (
    <div style={{
      width: '48px',
      flexShrink: 0,
      backgroundColor: '#111111',
      borderRight: '1px solid #1e1e1e',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      userSelect: 'none',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {topItems.map((item) => (
          <IconButton
            key={item.id}
            id={item.id}
            icon={item.icon}
            active={activePanel === item.id}
            onClick={handleClick}
          />
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '4px' }}>
        {bottomItems.map((item) => (
          <IconButton
            key={item.id}
            id={item.id}
            icon={item.icon}
            active={activePanel === item.id}
            onClick={handleClick}
          />
        ))}
      </div>
    </div>
  );
};

export default ActivityBar;
