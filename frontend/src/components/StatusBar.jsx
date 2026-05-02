import { FiMic, FiMicOff, FiCpu, FiGitBranch, FiCheckCircle, FiAlertCircle, FiAlertTriangle } from 'react-icons/fi';

const GLASS = {
  background: 'rgba(15,6,35,0.82)',
  backdropFilter: 'blur(20px) saturate(160%)',
  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
};

const Item = ({ icon: Icon, label, color }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '5px',
    padding: '0 9px', height: '100%',
    color: color || 'rgba(200,185,240,0.75)',
    fontSize: '11px', whiteSpace: 'nowrap', userSelect: 'none',
  }}>
    {Icon && <Icon size={11} />}
    <span>{label}</span>
  </div>
);

const Sep = () => (
  <div style={{ width: '1px', height: '12px', backgroundColor: 'rgba(138,92,246,0.2)' }} />
);

const StatusBar = ({ voiceState, aiStatus, hasProvider, isMobile }) => {
  const isProcessing = aiStatus === 'Processing';
  const isListening  = voiceState === 'listening';
  const isSpeaking   = voiceState === 'speaking';

  const providerColor = hasProvider === null ? 'rgba(200,185,240,0.5)'
    : hasProvider ? '#86efac' : '#fca5a5';
  const providerLabel = hasProvider === null ? 'Checking...'
    : hasProvider ? 'AI Ready' : '⚠ No API key';

  if (isMobile) {
    return (
      <div style={{
        height: '22px', ...GLASS,
        borderTop: '1px solid rgba(138,92,246,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0, overflow: 'hidden', padding: '0 8px',
      }}>
        <Item icon={hasProvider ? FiCheckCircle : FiAlertTriangle} label={providerLabel} color={providerColor} />
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          {isProcessing && <Item icon={FiAlertCircle} label="Processing" color="#fde68a" />}
          <Item icon={isListening ? FiMic : FiMicOff} label={isListening ? 'Listening' : 'Idle'} color={isListening ? '#86efac' : undefined} />
        </div>
      </div>
    );
  }

  return (
    <div style={{
      height: '24px', ...GLASS,
      borderTop: '1px solid rgba(138,92,246,0.12)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexShrink: 0, overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        <Item icon={FiGitBranch} label="main" color="rgba(196,181,253,0.7)" />
        <Sep /><Item icon={hasProvider ? FiCheckCircle : FiAlertTriangle} label={providerLabel} color={providerColor} />
        <Sep /><Item icon={isProcessing ? FiAlertCircle : FiCpu} label={isProcessing ? 'Processing...' : 'Jarvis AI'} color={isProcessing ? '#fde68a' : 'rgba(196,181,253,0.7)'} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        {isSpeaking && <><Item label="Speaking" color="#86efac" /><Sep /></>}
        <Item icon={isListening ? FiMic : FiMicOff} label={isListening ? 'Listening' : 'Idle'} color={isListening ? '#86efac' : undefined} />
        <Sep /><Item label="12-Layer Brain" color="rgba(196,181,253,0.5)" />
      </div>
    </div>
  );
};

export default StatusBar;
