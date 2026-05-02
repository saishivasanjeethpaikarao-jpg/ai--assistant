import { useState, useEffect, useRef } from 'react';
import { FiSearch, FiCommand, FiTrendingUp, FiCpu, FiMail, FiCode, FiActivity, FiZap } from 'react-icons/fi';

const ALL_COMMANDS = [
  { id: 'open-chrome', label: 'Open Chrome', category: 'App', icon: FiZap, shortcut: '⌘⇧C' },
  { id: 'open-vscode', label: 'Open VS Code', category: 'App', icon: FiCode, shortcut: '⌘⇧V' },
  { id: 'search-nifty', label: 'Search NIFTY trend', category: 'Trading', icon: FiTrendingUp, shortcut: '⌘⇧N' },
  { id: 'check-emails', label: 'Check emails', category: 'Productivity', icon: FiMail, shortcut: '⌘⇧E' },
  { id: 'analyze-trading', label: 'Analyze trading setup', category: 'Trading', icon: FiActivity, shortcut: '⌘⇧T' },
  { id: 'system-status', label: 'System status', category: 'System', icon: FiCpu, shortcut: '⌘⇧S' },
];

const fuzzyMatch = (str, query) => {
  if (!query) return true;
  const s = str.toLowerCase();
  const q = query.toLowerCase();
  let si = 0, qi = 0;
  while (si < s.length && qi < q.length) {
    if (s[si] === q[qi]) qi++;
    si++;
  }
  return qi === q.length;
};

const highlightMatch = (text, query) => {
  if (!query) return text;
  const result = [];
  let ti = 0, qi = 0;
  const lower = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  while (ti < text.length) {
    if (qi < lowerQuery.length && lower[ti] === lowerQuery[qi]) {
      result.push(<mark key={ti} style={{ background: 'transparent', color: '#3b82f6', fontWeight: '600' }}>{text[ti]}</mark>);
      qi++;
    } else {
      result.push(text[ti]);
    }
    ti++;
  }
  return result;
};

const CommandPalette = ({ isOpen, onClose, onCommand }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const filtered = ALL_COMMANDS.filter(cmd => fuzzyMatch(cmd.label, query) || fuzzyMatch(cmd.category, query));

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const el = listRef.current?.children[selectedIndex];
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        onCommand(filtered[selectedIndex].id);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
        zIndex: 9999,
        animation: 'fadeIn 0.1s ease',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '560px',
          maxWidth: 'calc(100vw - 40px)',
          background: 'rgba(8,4,22,0.88)',
          backdropFilter: 'blur(32px) saturate(200%)',
          WebkitBackdropFilter: 'blur(32px) saturate(200%)',
          border: '1px solid rgba(138,92,246,0.25)',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(138,92,246,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* Search input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '14px 16px',
          borderBottom: '1px solid rgba(138,92,246,0.12)',
        }}>
          <FiSearch size={16} style={{ color: 'rgba(138,92,246,0.6)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search commands..."
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'rgba(240,234,255,0.95)',
              fontSize: '14px',
              fontFamily: "'Geist', sans-serif",
            }}
          />
          <kbd style={{
            padding: '2px 8px',
            background: 'rgba(138,92,246,0.1)',
            border: '1px solid rgba(138,92,246,0.2)',
            borderRadius: '5px',
            fontSize: '11px',
            color: 'rgba(196,181,253,0.5)',
            fontFamily: 'Geist Mono, monospace',
          }}>
            esc
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} style={{ maxHeight: '340px', overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{
              padding: '32px',
              textAlign: 'center',
              color: '#4a4a4a',
              fontSize: '13px',
            }}>
              No commands match "{query}"
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => { onCommand(cmd.id); onClose(); }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#1e2a3a' : 'transparent',
                    borderLeft: isSelected ? '2px solid #3b82f6' : '2px solid transparent',
                    transition: 'background 0.08s',
                  }}
                >
                  <div style={{
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isSelected ? '#1a3a5a' : '#1a1a1a',
                    borderRadius: '4px',
                    border: '1px solid #2a2a2a',
                    flexShrink: 0,
                  }}>
                    <Icon size={13} style={{ color: isSelected ? '#3b82f6' : '#6b6b6b' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', color: '#e8e8e8' }}>
                      {highlightMatch(cmd.label, query)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#4a4a4a', marginTop: '1px' }}>
                      {cmd.category}
                    </div>
                  </div>
                  <kbd style={{
                    padding: '2px 6px',
                    backgroundColor: '#1e1e1e',
                    border: '1px solid #2a2a2a',
                    borderRadius: '3px',
                    fontSize: '11px',
                    color: '#5a5a5a',
                    fontFamily: 'Geist Mono, monospace',
                    flexShrink: 0,
                  }}>
                    {cmd.shortcut}
                  </kbd>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '8px 16px',
          borderTop: '1px solid #1e1e1e',
          display: 'flex',
          gap: '16px',
          fontSize: '11px',
          color: '#3a3a3a',
        }}>
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
