import React from 'react';
import { FiCheck, FiClock, FiLoader, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';

const AgentTaskView = ({ tasks }) => {
  const [isExpanded, setIsExpanded] = React.useState(true);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FiClock size={14} style={{ color: '#6b6b6b' }} />;
      case 'running':
        return <FiLoader size={14} style={{ color: '#3b82f6', animation: 'spin 1s linear infinite' }} />;
      case 'done':
        return <FiCheck size={14} style={{ color: '#10b981' }} />;
      case 'failed':
        return <FiX size={14} style={{ color: '#ef4444' }} />;
      default:
        return null;
    }
  };

  if (tasks.length === 0) return null;

  return (
    <div style={{
      borderBottom: '1px solid #2a2a2a',
      backgroundColor: '#111111',
    }}>
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          cursor: 'pointer',
        }}
      >
        <span style={{
          fontSize: '12px',
          color: '#8b8b8b',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          Agent Execution
        </span>
        {isExpanded ? <FiChevronUp size={14} style={{ color: '#6b6b6b' }} /> : <FiChevronDown size={14} style={{ color: '#6b6b6b' }} />}
      </div>

      {isExpanded && (
        <div style={{ padding: '8px 16px 12px 16px' }}>
          {tasks.map((task, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                marginBottom: '4px',
                backgroundColor: '#181818',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            >
              {getStatusIcon(task.status)}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#e8e8e8', marginBottom: '2px' }}>{task.step}</div>
                {task.result && (
                  <div style={{ color: '#6b6b6b', fontSize: '11px' }}>{task.result}</div>
                )}
              </div>
              <span style={{ color: '#6b6b6b', fontSize: '11px', textTransform: 'capitalize' }}>
                {task.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentTaskView;
