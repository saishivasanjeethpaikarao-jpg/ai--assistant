import { FiMic, FiMicOff, FiCpu, FiGitBranch, FiCheckCircle, FiAlertCircle, FiAlertTriangle } from 'react-icons/fi';

const Item = ({ icon: Icon, label, color, bg }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '5px',
    padding: '0 10px', height: '100%',
    color: color || '#9ca3af',
    fontSize: '11px', whiteSpace: 'nowrap', userSelect: 'none',
    background: bg || 'transparent',
  }}>
    {Icon && <Icon size={11} />}
    <span>{label}</span>
  </div>
);

const Sep = () => (
  <div style={{ width: '1px', height: '12px', backgroundColor: '#ede9fe' }} />
);

const StatusBar = ({ voiceState, aiStatus, hasProvider, isMobile }) => {
  const isProcessing = aiStatus === 'Processing';
  const isListening  = voiceState === 'listening';
  const isSpeaking   = voiceState === 'speaking';

  const providerColor = hasProvider === null ? '#9ca3af'
    : hasProvider ? '#059669' : '#dc2626';
  const providerLabel = hasProvider === null ? 'Checking...'
    : hasProvider ? 'AI Ready' : 'No API key';

  if (isMobile) {
    return (
      <div style={{
        height: '24px', background:'#fff',
        borderTop: '1px solid #ede9fe',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0, overflow: 'hidden', padding: '0 8px',
      }}>
        <Item icon={hasProvider ? FiCheckCircle : FiAlertTriangle} label={providerLabel} color={providerColor} />
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          {isProcessing && <Item icon={FiAlertCircle} label="Processing" color="#d97706" />}
          <Item icon={isListening ? FiMic : FiMicOff} label={isListening ? 'Listening' : 'Idle'} color={isListening ? '#059669' : '#9ca3af'} />
        </div>
      </div>
    );
  }

  return (
    <div style={{
      height: '26px', background:'#fff',
      borderTop: '1px solid #ede9fe',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexShrink: 0, overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        <Item icon={FiGitBranch} label="main" color="#7c3aed" />
        <Sep />
        <Item icon={hasProvider ? FiCheckCircle : FiAlertTriangle} label={providerLabel} color={providerColor} />
        <Sep />
        <Item icon={isProcessing ? FiAlertCircle : FiCpu} label={isProcessing ? 'Processing...' : 'Jarvis AI'} color={isProcessing ? '#d97706' : '#6b7280'} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        {isSpeaking && <><Item label="Speaking" color="#7c3aed" /><Sep /></>}
        <Item icon={isListening ? FiMic : FiMicOff} label={isListening ? 'Listening' : 'Idle'} color={isListening ? '#059669' : '#9ca3af'} />
        <Sep />
        <Item label="12-Layer Brain" color="#a78bfa" />
      </div>
    </div>
  );
};

export default StatusBar;
