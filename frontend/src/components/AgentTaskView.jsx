import { useState } from 'react';
import {
  FiCheck, FiClock, FiLoader, FiX, FiChevronDown, FiChevronUp,
  FiZap, FiAlertCircle, FiInfo,
} from 'react-icons/fi';

const B = '#437DFD';

const STATUS = {
  pending: { icon: FiClock,   color: '#aaa',    bg: 'rgba(0,0,0,0.04)',          label: 'Pending',  dot: '#d1d5db' },
  running: { icon: FiLoader,  color: B,          bg: `rgba(67,125,253,0.06)`,     label: 'Running',  dot: B, spin: true },
  done:    { icon: FiCheck,   color: '#00C48C',  bg: 'rgba(0,196,140,0.06)',      label: 'Done',     dot: '#00C48C' },
  failed:  { icon: FiX,       color: '#FD5B5D',  bg: 'rgba(253,91,93,0.06)',      label: 'Failed',   dot: '#FD5B5D' },
};

const TaskRow = ({ task, idx }) => {
  const [open, setOpen] = useState(false);
  const cfg = STATUS[task.status] || STATUS.pending;
  const Icon = cfg.icon;

  return (
    <div style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
      <div
        onClick={() => task.details ? setOpen(o => !o) : null}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '7px 16px', cursor: task.details ? 'pointer' : 'default',
          transition: 'background 0.1s',
          background: 'transparent',
        }}
        onMouseEnter={e => { if (task.details) e.currentTarget.style.background = 'rgba(67,125,253,0.03)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
      >
        {/* Step number */}
        <div style={{
          width: '18px', height: '18px', borderRadius: '50%',
          background: cfg.bg, border: `1.5px solid ${cfg.dot}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon
            size={10}
            style={{
              color: cfg.color,
              animation: cfg.spin ? 'atSpin 1s linear infinite' : 'none',
            }}
          />
        </div>

        {/* Step text */}
        <span style={{
          fontSize: '12px', flex: 1, minWidth: 0,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          color: task.status === 'done' ? '#aaa' : '#374151',
          textDecoration: task.status === 'done' ? 'line-through' : 'none',
        }}>
          {idx + 1}. {task.step}
        </span>

        {/* Status badge */}
        <span style={{
          fontSize: '10px', fontWeight: '700', padding: '2px 7px',
          borderRadius: '20px', flexShrink: 0,
          background: cfg.bg, color: cfg.color,
          border: `1px solid ${cfg.dot}33`,
          letterSpacing: '0.04em',
        }}>
          {cfg.label}
        </span>

        {task.details && (
          <span style={{ color: '#ddd', flexShrink: 0, fontSize: 11 }}>
            {open ? <FiChevronUp size={11}/> : <FiChevronDown size={11}/>}
          </span>
        )}
      </div>

      {/* Expandable detail */}
      {open && task.details && (
        <div style={{
          margin: '0 16px 8px 44px',
          padding: '8px 12px',
          background: 'rgba(67,125,253,0.03)',
          border: '1px solid rgba(67,125,253,0.1)',
          borderRadius: '8px',
          fontSize: '11px', color: '#666', lineHeight: '1.7',
        }}>
          <FiInfo size={10} style={{ color: B, marginRight: 5 }}/>
          {task.details}
          {task.duration && (
            <span style={{ marginLeft: 8, color: '#bbb', fontFamily: 'monospace' }}>
              {task.duration}ms
            </span>
          )}
        </div>
      )}
    </div>
  );
};

const AgentTaskView = ({ tasks }) => {
  const [expanded, setExpanded] = useState(true);
  if (!tasks || tasks.length === 0) return null;

  const doneCount    = tasks.filter(t => t.status === 'done').length;
  const failedCount  = tasks.filter(t => t.status === 'failed').length;
  const runningCount = tasks.filter(t => t.status === 'running').length;
  const progress     = Math.round((doneCount / tasks.length) * 100);
  const allDone      = doneCount === tasks.length;
  const hasFailed    = failedCount > 0;

  return (
    <div style={{
      background: '#fff', borderBottom: '1px solid rgba(67,125,253,0.1)',
      flexShrink: 0, overflow: 'hidden',
    }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
          padding: '0 16px', height: '36px',
          cursor: 'pointer', background: 'transparent', border: 'none',
          borderBottom: expanded ? '1px solid rgba(0,0,0,0.05)' : 'none',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(67,125,253,0.03)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        {/* Icon */}
        <div style={{
          width: '20px', height: '20px', borderRadius: '6px',
          background: hasFailed
            ? 'rgba(253,91,93,0.1)'
            : allDone ? 'rgba(0,196,140,0.1)' : `rgba(67,125,253,0.1)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {hasFailed
            ? <FiAlertCircle size={11} style={{ color: '#FD5B5D' }}/>
            : allDone
              ? <FiCheck size={11} style={{ color: '#00C48C' }}/>
              : <FiZap size={11} style={{ color: B, animation: runningCount ? 'atPulse 1s ease-in-out infinite' : 'none' }}/>
          }
        </div>

        {/* Title */}
        <span style={{
          fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: hasFailed ? '#FD5B5D' : allDone ? '#00C48C' : '#6b7280',
          flex: 1, textAlign: 'left',
        }}>
          {allDone ? 'Tasks Complete' : hasFailed ? 'Task Failed' : runningCount ? 'Working…' : 'Agent Tasks'}
        </span>

        {/* Progress bar mini */}
        {!allDone && !hasFailed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '48px', height: '4px', borderRadius: '2px', background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg,${B},#2C76FF)`, borderRadius: '2px', transition: 'width 0.3s ease' }}/>
            </div>
            <span style={{ fontSize: '10px', color: '#aaa', fontFamily: 'monospace', minWidth: '28px' }}>
              {doneCount}/{tasks.length}
            </span>
          </div>
        )}

        {allDone && (
          <span style={{ fontSize: '10px', color: '#00C48C', fontFamily: 'monospace', fontWeight: '700' }}>
            {tasks.length}/{tasks.length} ✓
          </span>
        )}

        {expanded ? <FiChevronUp size={11} style={{ color: '#ccc', flexShrink: 0 }}/> : <FiChevronDown size={11} style={{ color: '#ccc', flexShrink: 0 }}/>}
      </button>

      {/* Full progress bar */}
      {!allDone && !hasFailed && expanded && (
        <div style={{ height: '2px', background: 'rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg,${B},#2C76FF)`, transition: 'width 0.4s ease' }}/>
        </div>
      )}

      {/* Task rows */}
      {expanded && (
        <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
          {tasks.map((task, i) => <TaskRow key={i} task={task} idx={i}/>)}
        </div>
      )}

      <style>{`
        @keyframes atSpin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes atPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
};

export default AgentTaskView;
