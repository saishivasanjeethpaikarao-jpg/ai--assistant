import { useState } from 'react';
import {
  FiMessageSquare, FiDatabase, FiTrendingUp, FiBell,
  FiChevronDown, FiChevronRight, FiPlus, FiSearch,
  FiTrash2, FiRefreshCw
} from 'react-icons/fi';

const SectionHeader = ({ label, count, action }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '4px 12px 4px 16px',
    height: '28px',
  }}>
    <span style={{
      fontSize: '11px',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color: '#8b8b8b',
    }}>
      {label}{count !== undefined ? ` (${count})` : ''}
    </span>
    {action && (
      <button
        onClick={action.onClick}
        title={action.label}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '20px',
          height: '20px',
          color: '#6b6b6b',
          borderRadius: '3px',
          transition: 'color 0.1s, background 0.1s',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#e8e8e8'; e.currentTarget.style.background = '#2a2a2a'; }}
        onMouseLeave={e => { e.currentTarget.style.color = '#6b6b6b'; e.currentTarget.style.background = 'transparent'; }}
      >
        {action.icon}
      </button>
    )}
  </div>
);

const ListItem = ({ primary, secondary, active, onClick }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '6px 16px',
        cursor: 'pointer',
        backgroundColor: active ? '#1e2a3a' : hovered ? '#1a1a1a' : 'transparent',
        borderLeft: active ? '2px solid #3b82f6' : '2px solid transparent',
        transition: 'background 0.1s',
      }}
    >
      <div style={{
        fontSize: '13px',
        color: active ? '#e8e8e8' : '#c8c8c8',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {primary}
      </div>
      {secondary && (
        <div style={{
          fontSize: '11px',
          color: '#5a5a5a',
          marginTop: '1px',
        }}>
          {secondary}
        </div>
      )}
    </div>
  );
};

const MEMORY_ITEMS = [
  { id: 1, text: 'User prefers dark mode UI', time: '2h ago' },
  { id: 2, text: 'User is a developer', time: 'Yesterday' },
  { id: 3, text: 'Working on AI assistant project', time: '2d ago' },
  { id: 4, text: 'Interested in trading automation', time: '3d ago' },
];

const REMINDER_ITEMS = [
  { id: 1, text: 'Team meeting at 3 PM', time: 'Today', urgent: true },
  { id: 2, text: 'Review pull requests', time: 'Tomorrow', urgent: false },
  { id: 3, text: 'Deploy to production', time: 'Friday', urgent: false },
  { id: 4, text: 'Update documentation', time: 'Next week', urgent: false },
];

const WATCHLIST = [
  { symbol: 'RELIANCE.NS', change: '+1.2%', positive: true },
  { symbol: 'TCS.NS', change: '-0.4%', positive: false },
  { symbol: 'HDFCBANK.NS', change: '+0.8%', positive: true },
  { symbol: 'INFY.NS', change: '+2.1%', positive: true },
  { symbol: 'WIPRO.NS', change: '-1.1%', positive: false },
];

const CHAT_HISTORY = [
  { id: 1, text: 'Analyze NIFTY trend', time: 'Today' },
  { id: 2, text: 'Check emails', time: 'Yesterday' },
  { id: 3, text: 'Open VS Code', time: '2 days ago' },
  { id: 4, text: 'System status report', time: '3 days ago' },
];

const MemoryPanel = () => (
  <div style={{ flex: 1, overflowY: 'auto' }}>
    <SectionHeader label="Learned" count={MEMORY_ITEMS.length} action={{ label: 'Clear', icon: <FiTrash2 size={12} />, onClick: () => {} }} />
    {MEMORY_ITEMS.map(item => (
      <ListItem key={item.id} primary={item.text} secondary={item.time} />
    ))}
  </div>
);

const RemindersPanel = () => (
  <div style={{ flex: 1, overflowY: 'auto' }}>
    <SectionHeader label="Upcoming" count={REMINDER_ITEMS.length} action={{ label: 'Add', icon: <FiPlus size={12} />, onClick: () => {} }} />
    {REMINDER_ITEMS.map(item => (
      <div
        key={item.id}
        style={{
          padding: '6px 16px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
        }}
      >
        <div style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: item.urgent ? '#ef4444' : '#3b82f6',
          marginTop: '5px',
          flexShrink: 0,
        }} />
        <div>
          <div style={{ fontSize: '13px', color: '#c8c8c8' }}>{item.text}</div>
          <div style={{ fontSize: '11px', color: '#5a5a5a', marginTop: '1px' }}>{item.time}</div>
        </div>
      </div>
    ))}
  </div>
);

const TradingPanel = () => (
  <div style={{ flex: 1, overflowY: 'auto' }}>
    <SectionHeader label="Watchlist" count={WATCHLIST.length} action={{ label: 'Refresh', icon: <FiRefreshCw size={12} />, onClick: () => {} }} />
    {WATCHLIST.map(item => (
      <div
        key={item.symbol}
        style={{
          padding: '6px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
        }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1a1a1a'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <span style={{ fontSize: '13px', color: '#c8c8c8', fontFamily: 'Geist Mono, monospace' }}>{item.symbol}</span>
        <span style={{
          fontSize: '12px',
          color: item.positive ? '#10b981' : '#ef4444',
          fontFamily: 'Geist Mono, monospace',
        }}>
          {item.change}
        </span>
      </div>
    ))}
  </div>
);

const ChatHistoryPanel = ({ onSelectChat }) => (
  <div style={{ flex: 1, overflowY: 'auto' }}>
    <SectionHeader label="Recent" count={CHAT_HISTORY.length} action={{ label: 'New Chat', icon: <FiPlus size={12} />, onClick: () => {} }} />
    {CHAT_HISTORY.map((item, idx) => (
      <ListItem
        key={item.id}
        primary={item.text}
        secondary={item.time}
        active={idx === 0}
        onClick={() => onSelectChat?.(item)}
      />
    ))}
  </div>
);

const Sidebar = ({ activePanel, isOpen, onSelectChat }) => {
  const titles = {
    chat: 'Chat History',
    memory: 'Memory',
    trading: 'Trading',
    reminders: 'Reminders',
  };

  const icons = {
    chat: FiMessageSquare,
    memory: FiDatabase,
    trading: FiTrendingUp,
    reminders: FiBell,
  };

  const TitleIcon = icons[activePanel] || FiMessageSquare;

  if (!isOpen) return null;

  return (
    <div style={{
      width: '240px',
      flexShrink: 0,
      backgroundColor: '#111111',
      borderRight: '1px solid #1e1e1e',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '0 16px',
        borderBottom: '1px solid #1e1e1e',
        flexShrink: 0,
      }}>
        <TitleIcon size={13} style={{ color: '#5a5a5a' }} />
        <span style={{
          fontSize: '11px',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#8b8b8b',
        }}>
          {titles[activePanel] || 'Explorer'}
        </span>
      </div>

      {activePanel === 'chat' && <ChatHistoryPanel onSelectChat={onSelectChat} />}
      {activePanel === 'memory' && <MemoryPanel />}
      {activePanel === 'trading' && <TradingPanel />}
      {activePanel === 'reminders' && <RemindersPanel />}
    </div>
  );
};

export default Sidebar;
