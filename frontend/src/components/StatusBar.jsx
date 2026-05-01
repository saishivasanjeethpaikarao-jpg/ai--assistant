import { FiMic, FiMicOff, FiCpu, FiGitBranch, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

const StatusItem = ({ icon: Icon, label, onClick, highlight }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      padding: '0 8px',
      height: '100%',
      backgroundColor: 'transparent',
      color: highlight ? '#ffffff' : 'rgba(255,255,255,0.75)',
      fontSize: '12px',
      fontFamily: "'Geist', sans-serif",
      cursor: onClick ? 'pointer' : 'default',
      transition: 'background 0.1s',
      whiteSpace: 'nowrap',
    }}
    onMouseEnter={e => { if (onClick) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
  >
    {Icon && <Icon size={12} />}
    <span>{label}</span>
  </button>
);

const Divider = () => (
  <div style={{ width: '1px', height: '14px', backgroundColor: 'rgba(255,255,255,0.15)' }} />
);

const StatusBar = ({ voiceState, aiStatus }) => {
  const isProcessing = aiStatus === 'Processing';
  const isListening = voiceState === 'listening';

  return (
    <div style={{
      height: '24px',
      backgroundColor: '#1b6ac9',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
      userSelect: 'none',
      overflow: 'hidden',
    }}>
      {/* Left side */}
      <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        <StatusItem
          icon={FiGitBranch}
          label="main"
        />
        <Divider />
        <StatusItem
          icon={isProcessing ? FiAlertCircle : FiCheckCircle}
          label={isProcessing ? 'Processing...' : 'Ready'}
          highlight={isProcessing}
        />
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        <StatusItem
          icon={isListening ? FiMic : FiMicOff}
          label={isListening ? 'Listening' : 'Idle'}
          highlight={isListening}
        />
        <Divider />
        <StatusItem
          icon={FiCpu}
          label="Jarvis AI"
        />
        <Divider />
        <StatusItem label="Python Backend" />
      </div>
    </div>
  );
};

export default StatusBar;
