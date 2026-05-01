import React, { useState, useEffect, useRef } from 'react';
import { FiSearch } from 'react-icons/fi';

const CommandPalette = ({ isOpen, onClose, onCommand }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const commands = [
    { id: 'open-chrome', label: 'Open Chrome', shortcut: 'Ctrl+Shift+C' },
    { id: 'open-vscode', label: 'Open VS Code', shortcut: 'Ctrl+Shift+V' },
    { id: 'search-nifty', label: 'Search NIFTY trend', shortcut: 'Ctrl+Shift+N' },
    { id: 'check-emails', label: 'Check emails', shortcut: 'Ctrl+Shift+E' },
    { id: 'analyze-trading', label: 'Analyze trading setup', shortcut: 'Ctrl+Shift+T' },
    { id: 'system-status', label: 'System status', shortcut: 'Ctrl+Shift+S' },
  ];

  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredCommands.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        onCommand(filteredCommands[selectedIndex].id);
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
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '15vh',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '600px',
          maxHeight: '400px',
          backgroundColor: '#111111',
          border: '1px solid #2a2a2a',
          borderRadius: '6px',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '1px solid #2a2a2a',
            backgroundColor: '#0a0a0a',
          }}
        >
          <FiSearch size={16} style={{ color: '#6b6b6b', marginRight: '12px' }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search commands..."
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#e8e8e8',
              fontSize: '13px',
              fontFamily: 'Geist, sans-serif',
            }}
          />
        </div>

        <div style={{ overflowY: 'auto', maxHeight: '340px' }}>
          {filteredCommands.length === 0 ? (
            <div
              style={{
                padding: '24px',
                textAlign: 'center',
                color: '#6b6b6b',
                fontSize: '13px',
              }}
            >
              No commands found
            </div>
          ) : (
            filteredCommands.map((cmd, index) => (
              <div
                key={cmd.id}
                onClick={() => {
                  onCommand(cmd.id);
                  onClose();
                }}
                style={{
                  padding: '12px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: index === selectedIndex ? '#181818' : 'transparent',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: '#e8e8e8',
                }}
              >
                <span>{cmd.label}</span>
                <span style={{ color: '#6b6b6b', fontSize: '11px' }}>{cmd.shortcut}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
