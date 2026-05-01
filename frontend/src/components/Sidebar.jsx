import React from 'react';
import { FiDatabase, FiClock, FiTrendingUp, FiMessageSquare } from 'react-icons/fi';

const Sidebar = ({ activePanel }) => {
  const panels = {
    memory: {
      items: [
        { text: 'User prefers dark mode', time: '2 hours ago' },
        { text: 'User is a developer', time: 'Yesterday' },
        { text: 'Working on AI assistant', time: '2 days ago' },
      ],
      icon: FiDatabase,
      title: 'Memory',
    },
    reminders: {
      items: [
        { text: 'Team meeting at 3 PM', time: 'Today' },
        { text: 'Review pull requests', time: 'Tomorrow' },
        { text: 'Deploy to production', time: 'Friday' },
      ],
      icon: FiClock,
      title: 'Reminders',
    },
    trading: {
      items: [
        { text: 'RELIANCE.NS', time: 'Watchlist' },
        { text: 'TCS.NS', time: 'Watchlist' },
        { text: 'HDFCBANK.NS', time: 'Watchlist' },
      ],
      icon: FiTrendingUp,
      title: 'Trading',
    },
    chat: {
      items: [
        { text: 'Analyze NIFTY trend', time: 'Today' },
        { text: 'Check emails', time: 'Yesterday' },
        { text: 'Open VS Code', time: '2 days ago' },
      ],
      icon: FiMessageSquare,
      title: 'Chat History',
    },
  };

  const currentPanel = panels[activePanel] || panels.chat;

  return (
    <div style={{
      width: '240px',
      backgroundColor: '#111111',
      borderRight: '1px solid #2a2a2a',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #2a2a2a',
        fontSize: '11px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        color: '#8b8b8b',
        fontWeight: '500',
      }}>
        {currentPanel.title}
      </div>
      
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px',
      }}>
        {currentPanel.items.map((item, index) => (
          <div
            key={index}
            style={{
              padding: '8px 12px',
              marginBottom: '4px',
              backgroundColor: '#181818',
              borderRadius: '4px',
              fontSize: '13px',
              color: '#e8e8e8',
              cursor: 'pointer',
            }}
          >
            <div style={{ marginBottom: '2px' }}>{item.text}</div>
            <div style={{ fontSize: '11px', color: '#6b6b6b' }}>{item.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
