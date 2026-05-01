import React from 'react';
import { FiMessageSquare, FiDatabase, FiTrendingUp, FiClock, FiCommand, FiSettings } from 'react-icons/fi';

const ActivityBar = ({ activePanel, onPanelChange }) => {
  const topIcons = [
    { id: 'chat', icon: FiMessageSquare },
    { id: 'memory', icon: FiDatabase },
    { id: 'trading', icon: FiTrendingUp },
    { id: 'reminders', icon: FiClock },
  ];

  const bottomIcons = [
    { id: 'command', icon: FiCommand },
    { id: 'settings', icon: FiSettings },
  ];

  return (
    <div style={{
      width: '48px',
      backgroundColor: '#111111',
      borderRight: '1px solid #2a2a2a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '8px 0',
    }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        {topIcons.map((item) => (
          <button
            key={item.id}
            onClick={() => onPanelChange(item.id)}
            style={{
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              border: 'none',
              color: activePanel === item.id ? '#3b82f6' : '#8b8b8b',
              cursor: 'pointer',
              position: 'relative',
              padding: 0,
            }}
          >
            {activePanel === item.id && (
              <div style={{
                position: 'absolute',
                left: 0,
                top: '8px',
                bottom: '8px',
                width: '2px',
                backgroundColor: '#3b82f6',
              }} />
            )}
            <item.icon size={20} />
          </button>
        ))}
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        {bottomIcons.map((item) => (
          <button
            key={item.id}
            onClick={() => onPanelChange(item.id)}
            style={{
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#8b8b8b',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <item.icon size={18} />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ActivityBar;
