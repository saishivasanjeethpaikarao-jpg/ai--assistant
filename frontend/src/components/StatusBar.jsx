import { FiMic, FiMicOff, FiCpu, FiGitBranch, FiCheckCircle, FiAlertCircle, FiAlertTriangle } from 'react-icons/fi';

const Item = ({ icon: Icon, label, onClick, color }) => (
  <button onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: '5px',
    padding: '0 8px', height: '100%',
    backgroundColor: 'transparent', border: 'none',
    color: color || 'rgba(255,255,255,0.75)', fontSize: '12px',
    fontFamily: "'Geist', sans-serif", cursor: onClick ? 'pointer' : 'default',
    transition: 'background 0.1s', whiteSpace: 'nowrap',
  }}
    onMouseEnter={e => { if (onClick) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
  >
    {Icon && <Icon size={12} />}
    <span>{label}</span>
  </button>
);

const Sep = () => <div style={{ width: '1px', height: '14px', backgroundColor: 'rgba(255,255,255,0.15)' }} />;

const StatusBar = ({ voiceState, aiStatus, hasProvider, isMobile }) => {
  const isProcessing = aiStatus === 'Processing';
  const isListening  = voiceState === 'listening';
  const isSpeaking   = voiceState === 'speaking';

  const providerColor = hasProvider === null ? 'rgba(255,255,255,0.5)'
    : hasProvider ? '#86efac' : '#fca5a5';
  const providerLabel = hasProvider === null ? 'Checking...'
    : hasProvider ? 'AI Ready' : '⚠ No API key';

  // Mobile: compact single-row
  if (isMobile) {
    return (
      <div style={{
        height: '22px', backgroundColor: '#1b6ac9',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0, userSelect: 'none', overflow: 'hidden',
        paddingLeft: '8px', paddingRight: '8px',
      }}>
        <Item
          icon={hasProvider ? FiCheckCircle : FiAlertTriangle}
          label={providerLabel}
          color={providerColor}
        />
        <div style={{ display: 'flex', alignItems: 'center', height: '100%', gap: '4px' }}>
          {isProcessing && <Item icon={FiAlertCircle} label="Processing" color="#fde68a" />}
          <Item
            icon={isListening ? FiMic : FiMicOff}
            label={isListening ? 'Listening' : 'Idle'}
            color={isListening ? '#86efac' : undefined}
          />
        </div>
      </div>
    );
  }

  // Desktop: full status bar
  return (
    <div style={{
      height: '24px', backgroundColor: '#1b6ac9',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexShrink: 0, userSelect: 'none', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        <Item icon={FiGitBranch} label="main" />
        <Sep />
        <Item
          icon={hasProvider ? FiCheckCircle : FiAlertTriangle}
          label={providerLabel}
          color={providerColor}
        />
        <Sep />
        <Item
          icon={isProcessing ? FiAlertCircle : FiCpu}
          label={isProcessing ? 'Processing...' : 'Ready'}
          color={isProcessing ? '#fde68a' : undefined}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        {isSpeaking && <><Item label="Speaking" color="#86efac" /><Sep /></>}
        <Item
          icon={isListening ? FiMic : FiMicOff}
          label={isListening ? 'Listening' : 'Idle'}
          color={isListening ? '#86efac' : undefined}
        />
        <Sep />
        <Item icon={FiCpu} label="Jarvis AI" />
        <Sep />
        <Item label="12-Layer Brain" />
      </div>
    </div>
  );
};

export default StatusBar;
