import { useState } from 'react';
import { FiCheck, FiClock, FiLoader, FiX, FiChevronDown, FiChevronUp, FiZap } from 'react-icons/fi';

const STATUS_CONFIG = {
  pending: { icon: FiClock,  color: '#9ca3af', bg:'#f9fafb',            label: 'Pending' },
  running: { icon: FiLoader, color: '#2563eb', bg:'rgba(37,99,235,0.08)', label: 'Running', spin: true },
  done:    { icon: FiCheck,  color: '#059669', bg:'rgba(5,150,105,0.08)', label: 'Done' },
  failed:  { icon: FiX,      color: '#dc2626', bg:'rgba(220,38,38,0.08)', label: 'Failed' },
};

const TaskRow = ({ task }) => {
  const config = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
  const Icon = config.icon;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'5px 16px', height:'30px' }}>
      <div style={{ width:'20px', height:'20px', borderRadius:'6px', background:config.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Icon size={12} style={{ color:config.color, animation: task.status==='running' ? 'spin 1s linear infinite' : 'none' }}/>
      </div>
      <span style={{ fontSize:'12px', color: task.status==='done' ? '#9ca3af' : '#374151', flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
        {task.step}
      </span>
      <span style={{ fontSize:'11px', color:config.color, fontFamily:'monospace', fontWeight:'600', flexShrink:0 }}>
        {config.label}
      </span>
    </div>
  );
};

const AgentTaskView = ({ tasks }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  if (!tasks || tasks.length === 0) return null;

  const doneCount = tasks.filter(t => t.status === 'done').length;

  return (
    <div style={{ background:'#fff', borderBottom:'1px solid #f3f0ff', flexShrink:0 }}>
      <button onClick={() => setIsExpanded(e => !e)} style={{
        width:'100%', display:'flex', alignItems:'center', gap:'8px',
        padding:'0 16px', height:'32px', cursor:'pointer', backgroundColor:'transparent',
        borderRadius:0, border:'none',
      }}
        onMouseEnter={e=>e.currentTarget.style.backgroundColor='#f9f7ff'}
        onMouseLeave={e=>e.currentTarget.style.backgroundColor='transparent'}>
        <div style={{ width:'18px', height:'18px', borderRadius:'6px', background:'linear-gradient(135deg,#ede9fe,#ddd6fe)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <FiZap size={10} style={{ color:'#7c3aed' }}/>
        </div>
        <span style={{ fontSize:'11px', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.08em', color:'#6b7280', flex:1, textAlign:'left' }}>
          Agent Tasks
        </span>
        <span style={{ fontSize:'11px', color:'#9ca3af', fontFamily:'monospace' }}>
          {doneCount}/{tasks.length}
        </span>
        {isExpanded ? <FiChevronUp size={12} style={{ color:'#9ca3af' }}/> : <FiChevronDown size={12} style={{ color:'#9ca3af' }}/>}
      </button>
      {isExpanded && (
        <div style={{ paddingBottom:'4px' }}>
          {tasks.map((task, idx) => <TaskRow key={idx} task={task}/>)}
        </div>
      )}
    </div>
  );
};

export default AgentTaskView;
