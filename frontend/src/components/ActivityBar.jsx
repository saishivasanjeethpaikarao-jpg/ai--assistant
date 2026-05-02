import { useState } from 'react';
import {
  FiMessageSquare, FiDatabase, FiTrendingUp, FiBell,
  FiCommand, FiSettings, FiZap, FiBarChart2, FiCpu, FiCode,
} from 'react-icons/fi';
import AirisLogo from './AirisLogo';

const ITEMS = {
  chat:      { icon: FiMessageSquare, label:'Chat',      g1:'#7c3aed', g2:'#a855f7' },
  memory:    { icon: FiDatabase,      label:'Memory',    g1:'#2563eb', g2:'#38bdf8' },
  trading:   { icon: FiTrendingUp,    label:'Trading',   g1:'#059669', g2:'#34d399' },
  reminders: { icon: FiBell,          label:'Reminders', g1:'#d97706', g2:'#fbbf24' },
  skills:    { icon: FiZap,           label:'Skills',    g1:'#dc2626', g2:'#f87171' },
  analytics: { icon: FiBarChart2,     label:'Analytics', g1:'#0891b2', g2:'#22d3ee' },
  brain:     { icon: FiCpu,           label:'Brain',     g1:'#be185d', g2:'#f472b6' },
  vibe:      { icon: FiCode,          label:'Code',      g1:'#7c3aed', g2:'#6d28d9' },
  command:   { icon: FiCommand,       label:'Command',   g1:'#4b5563', g2:'#9ca3af' },
  settings:  { icon: FiSettings,      label:'Settings',  g1:'#4b5563', g2:'#9ca3af' },
};

const TOP    = ['chat','memory','trading','reminders','skills','analytics','brain','vibe'];
const BOTTOM = ['command','settings'];
const MOBILE_NAV = ['chat','trading','vibe','brain','settings'];

const Tooltip = ({ label, visible }) =>
  visible ? (
    <div style={{
      position:'absolute', left:'62px', top:'50%', transform:'translateY(-50%)',
      background:'#1a1733', color:'#f0eeff',
      fontSize:'12px', fontWeight:'600',
      padding:'5px 11px', borderRadius:'9px', whiteSpace:'nowrap',
      pointerEvents:'none', zIndex:200,
      boxShadow:'0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(167,139,250,0.15)',
      letterSpacing:'-0.01em',
    }}>
      {label}
      <div style={{ position:'absolute', left:'-4px', top:'50%', transform:'translateY(-50%) rotate(45deg)', width:'7px', height:'7px', background:'#1a1733' }}/>
    </div>
  ) : null;

const IconBtn = ({ id, active, onClick }) => {
  const [hov, setHov] = useState(false);
  const { icon: Icon, label, g1, g2 } = ITEMS[id];
  return (
    <button
      onClick={() => onClick(id)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={label}
      style={{
        position:'relative',
        width:'52px', height:'48px',
        display:'flex', alignItems:'center', justifyContent:'center',
        background:'transparent', border:'none', cursor:'pointer',
        transition:'all 0.15s', flexShrink:0,
      }}
    >
      {/* Active left indicator */}
      {active && (
        <div style={{
          position:'absolute', left:0, top:'50%', transform:'translateY(-50%)',
          width:'3px', height:'22px', borderRadius:'0 3px 3px 0',
          background:`linear-gradient(180deg,${g1},${g2})`,
          boxShadow:`2px 0 8px ${g1}80`,
        }}/>
      )}
      <div style={{
        width:'36px', height:'36px', borderRadius:'11px',
        display:'flex', alignItems:'center', justifyContent:'center',
        background: active
          ? `linear-gradient(135deg,${g1},${g2})`
          : hov ? 'rgba(255,255,255,0.09)' : 'transparent',
        transition:'all 0.18s',
        boxShadow: active ? `0 4px 14px ${g1}55` : 'none',
      }}>
        <Icon
          size={18}
          strokeWidth={active ? 2.2 : 1.7}
          style={{ color: active ? '#fff' : hov ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.32)' }}
        />
      </div>
      <Tooltip label={label} visible={hov && !active}/>
    </button>
  );
};

const MobileTabBtn = ({ id, active, onClick }) => {
  const { icon: Icon, label, g1, g2 } = ITEMS[id];
  return (
    <button onClick={() => onClick(id)} style={{
      flex:1, minWidth:0, display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', gap:'3px',
      padding:'6px 4px 4px',
      background:'transparent', border:'none',
      cursor:'pointer', transition:'all 0.15s', position:'relative',
    }}>
      {active && (
        <div style={{
          position:'absolute', top:0, left:'25%', right:'25%', height:'2.5px',
          background:`linear-gradient(90deg,${g1},${g2})`,
          borderRadius:'0 0 4px 4px',
          boxShadow:`0 2px 8px ${g1}60`,
        }}/>
      )}
      <Icon
        size={20}
        strokeWidth={active ? 2.2 : 1.6}
        style={{ color: active ? '#a78bfa' : 'rgba(255,255,255,0.38)' }}
      />
      <span style={{
        fontSize:'10px', fontWeight: active ? '700' : '400',
        color: active ? '#c4b5fd' : 'rgba(255,255,255,0.32)',
        letterSpacing:'0.01em',
      }}>{label}</span>
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
        height:'58px', flexShrink:0,
        background:'#1a1733',
        borderTop:'1px solid rgba(255,255,255,0.07)',
        display:'flex', alignItems:'stretch',
        userSelect:'none',
        paddingBottom:'env(safe-area-inset-bottom)',
      }}>
        {MOBILE_NAV.map(id => (
          <MobileTabBtn key={id} id={id} active={activePanel===id} onClick={handleClick}/>
        ))}
      </div>
    );
  }

  return (
    <div style={{
      width:'52px', flexShrink:0,
      background:'linear-gradient(180deg,#1c0d40 0%,#1a1733 40%,#160f2e 100%)',
      borderRight:'1px solid rgba(167,139,250,0.08)',
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'space-between',
      userSelect:'none', overflow:'visible',
    }}>
      {/* Top: logo + nav */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
        {/* Premium logo */}
        <div style={{
          width:'52px', height:'56px',
          display:'flex', alignItems:'center', justifyContent:'center',
          borderBottom:'1px solid rgba(167,139,250,0.08)',
          marginBottom:'4px',
          background:'linear-gradient(180deg,rgba(124,58,237,0.08),transparent)',
        }}>
          <AirisLogo size={34} animate={false}/>
        </div>
        {TOP.map(id => <IconBtn key={id} id={id} active={activePanel===id} onClick={handleClick}/>)}
      </div>

      {/* Bottom: settings + user */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', paddingBottom:'10px' }}>
        {BOTTOM.map(id => <IconBtn key={id} id={id} active={activePanel===id} onClick={handleClick}/>)}
        {/* Premium user avatar */}
        <div style={{
          width:'32px', height:'32px', borderRadius:'50%', marginTop:'8px',
          background:'linear-gradient(135deg,#4c1d95,#7c3aed)',
          display:'flex', alignItems:'center', justifyContent:'center',
          cursor:'pointer',
          border:'1.5px solid rgba(167,139,250,0.35)',
          boxShadow:'0 0 0 3px rgba(124,58,237,0.2), 0 4px 12px rgba(0,0,0,0.4)',
          fontSize:'12px', fontWeight:'800', color:'#e9d5ff',
          letterSpacing:'-0.01em',
        }}>
          J
        </div>
      </div>
    </div>
  );
};

export default ActivityBar;
