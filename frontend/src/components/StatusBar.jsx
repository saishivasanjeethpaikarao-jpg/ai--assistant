import React from 'react';
import { FiMic, FiCpu, FiWifi } from 'react-icons/fi';

const StatusBar = ({ voiceState, aiStatus }) => {
  return (
    <div style={{
      height: '24px',
      backgroundColor: '#3b82f6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 12px',
      fontSize: '12px',
      color: '#ffffff',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FiMic size={12} />
          <span>{voiceState || 'Idle'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FiCpu size={12} />
          <span>{aiStatus || 'Ready'}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FiWifi size={12} />
          <span>Connected</span>
        </div>
        <span>Python Backend</span>
      </div>
    </div>
  );
};

export default StatusBar;
