import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  FiMessageSquare, FiDatabase, FiTrendingUp, FiBell,
  FiCommand, FiSettings, FiZap, FiBarChart2, FiCpu, FiCode, FiEdit3,
} from 'react-icons/fi';

const ITEMS = {
  chat:      { icon: FiMessageSquare, label: 'Chat',      color: '#437DFD' },
  memory:    { icon: FiDatabase,      label: 'Memory',    color: '#7B61FF' },
  trading:   { icon: FiTrendingUp,    label: 'Trading',   color: '#00C48C' },
  reminders: { icon: FiBell,          label: 'Reminders', color: '#FF8C42' },
  skills:    { icon: FiZap,           label: 'Skills',    color: '#FD5B5D' },
  analytics: { icon: FiBarChart2,     label: 'Analytics', color: '#2C76FF' },
  brain:     { icon: FiCpu,           label: 'Brain',     color: '#BE185D' },
  vibe:      { icon: FiCode,          label: 'Code',      color: '#437DFD' },
  canvas:    { icon: FiEdit3,         label: 'Canvas',    color: '#FF8C42' },
  command:   { icon: FiCommand,       label: 'Command',   color: '#888' },
  settings:  { icon: FiSettings,      label: 'Settings',  color: '#888' },
};

const TOP    = ['chat','memory','trading','reminders','skills','analytics','brain','vibe','canvas'];
const BOTTOM = ['command','settings'];
const MOBILE_NAV = ['chat','trading','vibe','canvas','settings'];

function getInitials(user) {
  if (!user) return '?';
  if (user.isAnonymous) return 'G';
  if (user.displayName) return user.displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  if (user.email) return user.email[0].toUpperCase();
  return '?';
}

const Tooltip = ({ label, visible }) =>
  visible ? (
    <div style={{
      position: 'absolute', left: '62px', top: '50%', transform: 'translateY(-50%)',
      background: '#0C0C0C', color: '#fff',
      fontSize: '12px', fontWeight: '600',
      padding: '5px 11px', borderRadius: '9px', whiteSpace: 'nowrap',
      pointerEvents: 'none', zIndex: 200,
      boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
      letterSpacing: '-0.01em',
    }}>
      {label}
      <div style={{ position: 'absolute', left: '-4px', top: '50%', transform: 'translateY(-50%) rotate(45deg)', width: '7px', height: '7px', background: '#0C0C0C' }}/>
    </div>
  ) : null;

const IconBtn = ({ id, active, onClick }) => {
  const [hov, setHov] = useState(false);
  const { icon: Icon, label, color } = ITEMS[id];
  return (
    <button
      onClick={() => onClick(id)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={label}
      style={{
        position: 'relative',
        width: '52px', height: '46px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', border: 'none', cursor: 'pointer',
        transition: 'all 0.15s', flexShrink: 0,
      }}
    >
      {active && (
        <div style={{
          position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
          width: '3px', height: '20px', borderRadius: '0 3px 3px 0',
          background: color,
        }}/>
      )}
      <div style={{
        width: '34px', height: '34px', borderRadius: '10px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? `${color}18` : hov ? 'rgba(0,0,0,0.05)' : 'transparent',
        transition: 'all 0.15s',
        border: active ? `1px solid ${color}30` : '1px solid transparent',
      }}>
        <Icon
          size={17}
          strokeWidth={active ? 2.2 : 1.7}
          style={{ color: active ? color : hov ? '#555' : '#aaa' }}
        />
      </div>
      <Tooltip label={label} visible={hov && !active}/>
    </button>
  );
};

const MobileTabBtn = ({ id, active, onClick }) => {
  const { icon: Icon, label, color } = ITEMS[id];
  return (
    <button onClick={() => onClick(id)} style={{
      flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '3px',
      padding: '6px 4px 4px',
      background: 'transparent', border: 'none',
      cursor: 'pointer', transition: 'all 0.15s', position: 'relative',
    }}>
      {active && (
        <div style={{
          position: 'absolute', top: 0, left: '25%', right: '25%', height: '2.5px',
          background: color, borderRadius: '0 0 4px 4px',
        }}/>
      )}
      <Icon
        size={19}
        strokeWidth={active ? 2.2 : 1.6}
        style={{ color: active ? color : '#bbb' }}
      />
      <span style={{
        fontSize: '10px', fontWeight: active ? '700' : '400',
        color: active ? color : '#bbb',
        letterSpacing: '0.01em',
      }}>{label}</span>
    </button>
  );
};

const ActivityBar = ({ activePanel, onPanelChange, onCommandOpen, isMobile }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleClick = (id) => {
    if (id === 'command') onCommandOpen?.();
    else onPanelChange(id);
  };

  const handleAvatarClick = async () => {
    if (user?.isAnonymous) {
      navigate('/login');
    } else {
      await logout();
      navigate('/');
    }
  };

  const initials = getInitials(user);
  const avatarTitle = user?.isAnonymous
    ? 'Guest — click to sign in'
    : `${user?.displayName || user?.email || ''} — click to sign out`;

  if (isMobile) {
    return (
      <div style={{
        height: '58px', flexShrink: 0,
        background: 'rgba(255,255,255,0.97)',
        borderTop: '1px solid rgba(0,0,0,0.08)',
        display: 'flex', alignItems: 'stretch',
        userSelect: 'none',
        paddingBottom: 'env(safe-area-inset-bottom)',
        backdropFilter: 'blur(20px)',
      }}>
        {MOBILE_NAV.map(id => (
          <MobileTabBtn key={id} id={id} active={activePanel === id} onClick={handleClick}/>
        ))}
      </div>
    );
  }

  return (
    <div style={{
      width: '52px', flexShrink: 0,
      background: 'rgba(255,255,255,0.95)',
      borderRight: '1px solid rgba(0,0,0,0.08)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'space-between',
      userSelect: 'none', overflow: 'visible',
      backdropFilter: 'blur(20px)',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          width: '52px', height: '54px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderBottom: '1px solid rgba(0,0,0,0.07)',
          marginBottom: '4px',
        }}>
          <img src="/airis-sphere.png" alt="Airis" style={{ width: 28, height: 28, objectFit: 'contain', filter: 'drop-shadow(0 4px 8px rgba(67,125,253,0.3))' }}/>
        </div>
        {TOP.map(id => <IconBtn key={id} id={id} active={activePanel === id} onClick={handleClick}/>)}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: '10px' }}>
        {BOTTOM.map(id => <IconBtn key={id} id={id} active={activePanel === id} onClick={handleClick}/>)}
        <div
          onClick={handleAvatarClick}
          title={avatarTitle}
          style={{
            width: '30px', height: '30px', borderRadius: '50%', marginTop: '8px',
            background: user?.isAnonymous
              ? 'rgba(0,0,0,0.07)'
              : 'linear-gradient(135deg,#437DFD,#2C76FF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            border: '1.5px solid rgba(0,0,0,0.1)',
            fontSize: '11px', fontWeight: '700',
            color: user?.isAnonymous ? '#888' : '#fff',
            letterSpacing: '-0.01em', overflow: 'hidden',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          {user?.photoURL
            ? <img src={user.photoURL} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
            : initials
          }
        </div>
      </div>
    </div>
  );
};

export default ActivityBar;
