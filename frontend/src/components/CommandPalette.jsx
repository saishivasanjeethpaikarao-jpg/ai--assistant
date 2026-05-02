import { useState, useEffect, useRef } from 'react';
import { FiSearch, FiCommand, FiTrendingUp, FiCpu, FiMail, FiCode, FiActivity, FiZap } from 'react-icons/fi';

const ALL_COMMANDS = [
  { id: 'open-chrome',      label: 'Open Chrome',           category: 'App',          icon: FiZap,        shortcut: '⌘⇧C' },
  { id: 'open-vscode',      label: 'Open VS Code',          category: 'App',          icon: FiCode,       shortcut: '⌘⇧V' },
  { id: 'search-nifty',     label: 'Search NIFTY trend',    category: 'Trading',      icon: FiTrendingUp, shortcut: '⌘⇧N' },
  { id: 'check-emails',     label: 'Check emails',          category: 'Productivity', icon: FiMail,       shortcut: '⌘⇧E' },
  { id: 'analyze-trading',  label: 'Analyze trading setup', category: 'Trading',      icon: FiActivity,   shortcut: '⌘⇧T' },
  { id: 'system-status',    label: 'System status',         category: 'System',       icon: FiCpu,        shortcut: '⌘⇧S' },
];

const B = '#437DFD';

const fuzzyMatch = (str, query) => {
  if (!query) return true;
  const s = str.toLowerCase(), q = query.toLowerCase();
  let si = 0, qi = 0;
  while (si < s.length && qi < q.length) { if (s[si] === q[qi]) qi++; si++; }
  return qi === q.length;
};

const highlightMatch = (text, query) => {
  if (!query) return text;
  const result = [];
  let ti = 0, qi = 0;
  const lower = text.toLowerCase(), lq = query.toLowerCase();
  while (ti < text.length) {
    if (qi < lq.length && lower[ti] === lq[qi]) {
      result.push(<mark key={ti} style={{ background:'transparent', color:B, fontWeight:'700' }}>{text[ti]}</mark>);
      qi++;
    } else { result.push(text[ti]); }
    ti++;
  }
  return result;
};

const CommandPalette = ({ isOpen, onClose, onCommand }) => {
  const [query,         setQuery]         = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef  = useRef(null);

  const filtered = ALL_COMMANDS.filter(cmd => fuzzyMatch(cmd.label, query) || fuzzyMatch(cmd.category, query));

  useEffect(() => {
    if (isOpen) { setQuery(''); setSelectedIndex(0); setTimeout(() => inputRef.current?.focus(), 10); }
  }, [isOpen]);

  useEffect(() => { setSelectedIndex(0); }, [query]);

  useEffect(() => {
    const el = listRef.current?.children[selectedIndex];
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const handleKeyDown = (e) => {
    if      (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i+1, filtered.length-1)); }
    else if (e.key === 'ArrowUp')   { e.preventDefault(); setSelectedIndex(i => Math.max(i-1, 0)); }
    else if (e.key === 'Enter')     { e.preventDefault(); if (filtered[selectedIndex]) { onCommand(filtered[selectedIndex].id); onClose(); } }
    else if (e.key === 'Escape')    { onClose(); }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.35)', backdropFilter:'blur(8px)', display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop:'12vh', zIndex:9999, animation:'fadeIn 0.12s ease' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width:'560px', maxWidth:'calc(100vw - 40px)',
          background:'#fff', borderRadius:'16px', overflow:'hidden',
          boxShadow:'0 32px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(67,125,253,0.12)',
          border:'1px solid rgba(0,0,0,0.08)',
        }}
      >
        {/* Search input */}
        <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'14px 18px', borderBottom:'1px solid rgba(0,0,0,0.07)' }}>
          <FiSearch size={17} style={{ color:'rgba(67,125,253,0.5)', flexShrink:0 }}/>
          <input
            ref={inputRef} type="text" value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search commands..."
            style={{ flex:1, backgroundColor:'transparent', border:'none', outline:'none', color:'#0C0C0C', fontSize:'15px', fontFamily:'inherit' }}
          />
          <kbd style={{ padding:'3px 8px', background:'rgba(0,0,0,0.05)', border:'1px solid rgba(0,0,0,0.1)', borderRadius:'6px', fontSize:'11px', color:'#888', fontFamily:'monospace' }}>
            esc
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} style={{ maxHeight:'340px', overflowY:'auto', padding:'6px' }}>
          {filtered.length === 0 ? (
            <div style={{ padding:'32px', textAlign:'center', color:'#bbb', fontSize:'13px' }}>
              No commands match "{query}"
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSel = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => { onCommand(cmd.id); onClose(); }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    padding:'9px 12px', display:'flex', alignItems:'center', gap:'12px', cursor:'pointer', borderRadius:'10px',
                    backgroundColor: isSel ? 'rgba(67,125,253,0.06)' : 'transparent',
                    border: isSel ? '1px solid rgba(67,125,253,0.15)' : '1px solid transparent',
                    transition:'all 0.08s',
                  }}
                >
                  <div style={{
                    width:'32px', height:'32px', display:'flex', alignItems:'center', justifyContent:'center',
                    background: isSel ? `linear-gradient(135deg,${B},#2C76FF)` : 'rgba(67,125,253,0.08)',
                    borderRadius:'8px', flexShrink:0,
                    boxShadow: isSel ? '0 4px 12px rgba(67,125,253,0.3)' : 'none',
                  }}>
                    <Icon size={14} style={{ color: isSel ? '#fff' : B }}/>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'13px', color: isSel ? '#0C0C0C' : '#555', fontWeight: isSel ? '600' : '400' }}>
                      {highlightMatch(cmd.label, query)}
                    </div>
                    <div style={{ fontSize:'11px', color:'#bbb', marginTop:'1px' }}>{cmd.category}</div>
                  </div>
                  <kbd style={{ padding:'3px 7px', background:'rgba(0,0,0,0.04)', border:'1px solid rgba(0,0,0,0.08)', borderRadius:'5px', fontSize:'11px', color:'#aaa', fontFamily:'monospace', flexShrink:0 }}>
                    {cmd.shortcut}
                  </kbd>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'8px 18px', borderTop:'1px solid rgba(0,0,0,0.07)', display:'flex', gap:'16px', fontSize:'11px', color:'#ccc' }}>
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
