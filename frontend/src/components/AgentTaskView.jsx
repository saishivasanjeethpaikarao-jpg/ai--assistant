import { useState } from 'react';
import {
  FiCheck, FiClock, FiLoader, FiX,
  FiChevronDown, FiChevronUp, FiZap
} from 'react-icons/fi';

const STATUS_CONFIG = {
  pending: { icon: FiClock, color: '#5a5a5a', label: 'Pending' },
  running: { icon: FiLoader, color: '#3b82f6', label: 'Running', spin: true },
  done: { icon: FiCheck, color: '#10b981', label: 'Done' },
  failed: { icon: FiX, color: '#ef4444', label: 'Failed' },
};

const TaskRow = ({ task, index }) => {
  const config = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
  const Icon = config.icon;
  const isRunning = task.status === 'running';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '4px 16px',
      height: '28px',
    }}>
      <div style={{ position: 'relative', width: '14px', height: '14px', flexShrink: 0 }}>
        <Icon
          size={14}
          style={{
            color: config.color,
            animation: isRunning ? 'spin 1s linear infinite' : 'none',
          }}
        />
      </div>
      <span style={{
        fontSize: '12px',
        color: task.status === 'done' ? '#5a5a5a' : '#c8c8c8',
        flex: 1,
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        textDecoration: task.status === 'done' ? 'none' : 'none',
      }}>
        {task.step}
      </span>
      <span style={{
        fontSize: '11px',
        color: config.color,
        fontFamily: 'Geist Mono, monospace',
        flexShrink: 0,
      }}>
        {config.label}
      </span>
    </div>
  );
};

const AgentTaskView = ({ tasks }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!tasks || tasks.length === 0) return null;

  const runningCount = tasks.filter(t => t.status === 'running').length;
  const doneCount = tasks.filter(t => t.status === 'done').length;

  return (
    <div style={{
      backgroundColor: '#0d0d0d',
      borderBottom: '1px solid #1e1e1e',
      flexShrink: 0,
    }}>
      <button
        onClick={() => setIsExpanded(e => !e)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '0 16px',
          height: '28px',
          cursor: 'pointer',
          backgroundColor: 'transparent',
          color: '#8b8b8b',
        }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1a1a1a'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <FiZap size={12} style={{ color: '#3b82f6' }} />
        <span style={{
          fontSize: '11px',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#6b6b6b',
          flex: 1,
          textAlign: 'left',
        }}>
          Agent Tasks
        </span>
        <span style={{
          fontSize: '11px',
          color: '#4a4a4a',
          fontFamily: 'Geist Mono, monospace',
        }}>
          {doneCount}/{tasks.length}
        </span>
        {isExpanded
          ? <FiChevronUp size={12} style={{ color: '#4a4a4a' }} />
          : <FiChevronDown size={12} style={{ color: '#4a4a4a' }} />
        }
      </button>

      {isExpanded && (
        <div style={{ paddingBottom: '4px' }}>
          {tasks.map((task, idx) => (
            <TaskRow key={idx} task={task} index={idx} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentTaskView;
