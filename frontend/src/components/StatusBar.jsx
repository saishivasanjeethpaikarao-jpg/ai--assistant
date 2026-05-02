import { FiMic, FiMicOff, FiCpu, FiGitBranch, FiCheckCircle, FiAlertCircle, FiAlertTriangle } from 'react-icons/fi';

const BORDER = 'rgba(0,0,0,0.07)';
const B = '#437DFD';

const Item = ({ icon: Icon, label, color, bg }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '5px',
    padding: '0 10px', height: '100%',
    color: color || '#aaa',
    fontSize: '11px', whiteSpace: 'nowrap', userSelect: 'none',
    background: bg || 'transparent',
  }}>
    {Icon && <Icon size={11} />}
    <span>{label}</span>
  </div>
);

const Sep = () => (
  <div style={{ width: '1px', height: '12px', backgroundColor: BORDER }} />
);

const StatusBar = ({ voiceState, aiStatus, hasProvider, isMobile }) => {
  const isProcessing = aiStatus === 'Processing';
  const isListening  = voiceState === 'listening';
  const isSpeaking   = voiceState === 'speaking';

  const providerColor = hasProvider === null ? '#bbb'
    : hasProvider ? '#00C48C' : '#FD5B5D';
  const providerLabel = hasProvider === null ? 'Checking...'
    : hasProvider ? 'AI Ready' : 'No API key';

  if (isMobile) {
    return (
      <div style={{
        height: '24px', background:'rgba(255,255,255,0.95)',
        borderTop: `1px solid ${BORDER}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0, overflow: 'hidden', padding: '0 8px',
      }}>
        <Item icon={hasProvider ? FiCheckCircle : FiAlertTriangle} label={providerLabel} color={providerColor} />
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          {isProcessing && <Item icon={FiAlertCircle} label="Processing" color="#FF8C42" />}
          <Item icon={isListening ? FiMic : FiMicOff} label={isListening ? 'Listening' : 'Idle'} color={isListening ? '#00C48C' : '#bbb'} />
        </div>
      </div>
    );
  }

  return (
    <div style={{
      height: '26px', background:'rgba(255,255,255,0.95)',
      borderTop: `1px solid ${BORDER}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexShrink: 0, overflow: 'hidden',
      backdropFilter: 'blur(20px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        <Item icon={FiGitBranch} label="main" color={B} />
        <Sep />
        <Item icon={hasProvider ? FiCheckCircle : FiAlertTriangle} label={providerLabel} color={providerColor} />
        <Sep />
        <Item icon={isProcessing ? FiAlertCircle : FiCpu} label={isProcessing ? 'Processing...' : 'Airis AI'} color={isProcessing ? '#FF8C42' : '#888'} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        {isSpeaking && <><Item label="Speaking" color={B} /><Sep /></>}
        <Item icon={isListening ? FiMic : FiMicOff} label={isListening ? 'Listening' : 'Idle'} color={isListening ? '#00C48C' : '#bbb'} />
        <Sep />
        <Item label="12-Layer Brain" color="rgba(67,125,253,0.6)" />
      </div>
    </div>
  );
};

export default StatusBar;
