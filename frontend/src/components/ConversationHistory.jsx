import { useState } from 'react';
import { FiPlus, FiEdit2, FiClock, FiMessageSquare } from 'react-icons/fi';

const SAMPLE_CONVOS = [
  { id:1, title:'Shadow mask overflow pixel',        preview:'Fixed subtitle css overflow bug in production...',      time:'Just Now',  hasImage:true,  color:'linear-gradient(135deg,#437DFD,#2C76FF)' },
  { id:2, title:'Horizontal frame Figma component',  preview:'Frame comment scrolling overflow css...',               time:'Just Now',  hasImage:true,  color:'linear-gradient(135deg,#FD5B5D,#E04040)' },
  { id:3, title:'Arrow list undo inspect',           preview:'Arrange text union boolean subtract...',                time:'Just Now',  hasImage:false, color:'linear-gradient(135deg,#4facfe,#00f2fe)' },
  { id:4, title:'Duplicate subtract inspect',        preview:'Editor project frame subtract undo bullet...',          time:'Just Now',  hasImage:true,  color:'linear-gradient(135deg,#00C48C,#00A876)' },
  { id:5, title:'Analyze NIFTY trend',               preview:'Show me the NIFTY 50 trend analysis for today...',     time:'2 hrs ago', hasImage:false, color:'linear-gradient(135deg,#FF8C42,#F07020)' },
  { id:6, title:'Voice Tools integration',           preview:'How do I set up the voice recognition feature...',     time:'Yesterday', hasImage:false, color:'linear-gradient(135deg,#7B61FF,#6D52F6)' },
];

const B = '#437DFD';
const BORDER = 'rgba(0,0,0,0.07)';

const ConversationCard = ({ convo, active, onClick }) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={() => onClick(convo)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding:'12px', margin:'4px 8px', borderRadius:'12px', cursor:'pointer',
        background: (active || hov) ? '#fff' : 'transparent',
        boxShadow: (active || hov) ? '0 2px 12px rgba(67,125,253,0.08)' : 'none',
        border: active ? `1px solid rgba(67,125,253,0.15)` : '1px solid transparent',
        transition:'all 0.15s',
      }}
    >
      <div style={{ display:'flex', alignItems:'flex-start', gap:'10px' }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:'13px', fontWeight:'600', color:'#0C0C0C', marginBottom:'3px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {convo.title}
          </div>
          <div style={{ fontSize:'11px', color:'#aaa', lineHeight:'1.5', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
            {convo.preview}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'4px', marginTop:'6px' }}>
            <FiClock size={10} style={{ color:'rgba(67,125,253,0.4)' }}/>
            <span style={{ fontSize:'10px', color:'rgba(67,125,253,0.4)', fontWeight:'500' }}>{convo.time}</span>
          </div>
        </div>
        {convo.hasImage && (
          <div style={{
            width:'48px', height:'40px', borderRadius:'8px', flexShrink:0,
            background: convo.color, overflow:'hidden',
            boxShadow:'0 2px 8px rgba(0,0,0,0.1)',
          }}/>
        )}
      </div>
    </div>
  );
};

const ConversationHistory = ({ messages, isMobile, onNewChat, onOpenConversation }) => {
  const [activeId, setActiveId] = useState(1);

  if (isMobile) return null;

  const convos = messages.length > 0
    ? [
        { id:0, title:'Current session', preview: messages[0]?.content?.slice(0,60)||'…', time:'Now', hasImage:false, color:`linear-gradient(135deg,${B},#2C76FF)` },
        ...SAMPLE_CONVOS.slice(0, 5),
      ]
    : SAMPLE_CONVOS;

  return (
    <div style={{
      width:'272px', flexShrink:0,
      background:'#F8F7F5',
      borderLeft:`1px solid ${BORDER}`,
      display:'flex', flexDirection:'column', overflow:'hidden',
    }}>
      {/* Header */}
      <div style={{ height:'52px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 14px', borderBottom:`1px solid ${BORDER}`, flexShrink:0, background:'#fff' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <div style={{ width:'28px', height:'28px', borderRadius:'8px', background:'rgba(67,125,253,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <FiMessageSquare size={13} style={{ color:B }}/>
          </div>
          <span style={{ fontSize:'13px', fontWeight:'600', color:'#0C0C0C' }}>History</span>
        </div>
        <button
          onClick={() => onNewChat?.()}
          style={{
          display:'flex', alignItems:'center', gap:'4px',
          padding:'5px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'600', cursor:'pointer',
          background:`linear-gradient(135deg,${B},#2C76FF)`, color:'#fff', border:'none',
          boxShadow:'0 2px 8px rgba(67,125,253,0.3)',
          transition:'all 0.15s',
        }}
          onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 16px rgba(67,125,253,0.45)'}
          onMouseLeave={e=>e.currentTarget.style.boxShadow='0 2px 8px rgba(67,125,253,0.3)'}>
          <FiPlus size={11}/>
          New Chat
        </button>
      </div>

      {/* List */}
      <div style={{ flex:1, overflowY:'auto', paddingTop:'4px', paddingBottom:'8px' }}>
        <div style={{ padding:'4px 16px 8px', fontSize:'10px', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.08em', color:'#bbb' }}>
          Recent
        </div>
        {convos.map(convo => (
          <ConversationCard
            key={convo.id}
            convo={convo}
            active={activeId === convo.id}
            onClick={(item) => {
              setActiveId(item.id);
              onOpenConversation?.(item);
            }}
          />
        ))}
      </div>

      {/* Footer hint */}
      <div style={{ padding:'10px 14px', borderTop:`1px solid ${BORDER}`, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 10px', background:'rgba(67,125,253,0.05)', borderRadius:'8px', border:'1px solid rgba(67,125,253,0.1)' }}>
          <FiEdit2 size={11} style={{ color:'rgba(67,125,253,0.5)', flexShrink:0 }}/>
          <span style={{ fontSize:'11px', color:'rgba(67,125,253,0.5)' }}>Click any conversation to continue</span>
        </div>
      </div>
    </div>
  );
};

export default ConversationHistory;
