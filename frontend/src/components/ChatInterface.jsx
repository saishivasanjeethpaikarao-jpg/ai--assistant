import { useState, useRef, useEffect, useCallback } from 'react';
import { FiSend, FiMic, FiMicOff, FiUser, FiCpu, FiVolume2, FiVolumeX } from 'react-icons/fi';

const SpeechRecognitionAPI =
  typeof window !== 'undefined' &&
  (window.SpeechRecognition || window.webkitSpeechRecognition);

function useSpeechToText({ onResult, onStateChange }) {
  const recRef = useRef(null);
  const [listening, setListening] = useState(false);
  const start = useCallback(() => {
    if (!SpeechRecognitionAPI) { alert('Use Chrome or Edge for voice input.'); return; }
    if (recRef.current) recRef.current.stop();
    const rec = new SpeechRecognitionAPI();
    rec.lang = 'en-US'; rec.interimResults = false; rec.continuous = false;
    rec.onstart  = () => { setListening(true);  onStateChange?.('listening'); };
    rec.onresult = (e)  => { onResult?.(e.results[0][0].transcript); };
    rec.onerror  = ()   => { setListening(false); onStateChange?.('idle'); };
    rec.onend    = ()   => { setListening(false); onStateChange?.('idle'); };
    recRef.current = rec; rec.start();
  }, [onResult, onStateChange]);
  const stop = useCallback(() => { recRef.current?.stop(); setListening(false); onStateChange?.('idle'); }, [onStateChange]);
  return { listening, start, stop, supported: !!SpeechRecognitionAPI };
}

function speakText(text, onStart, onEnd) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate=1.05; utt.pitch=0.95; utt.volume=1;
  const v = window.speechSynthesis.getVoices();
  const pref = v.find(x=>x.name.includes('Google')||x.name.includes('Premium'))||v.find(x=>x.lang==='en-US')||v[0];
  if (pref) utt.voice=pref;
  utt.onstart=onStart; utt.onend=onEnd; utt.onerror=onEnd;
  window.speechSynthesis.speak(utt);
}

// ── Feature grid for empty state ────────────────────────────────────────────

const FEATURES = [
  { emoji:'💬', label:'Smart Chat',      color:'#7c3aed', bg:'rgba(124,58,237,0.08)',  border:'rgba(124,58,237,0.15)' },
  { emoji:'🎤', label:'Voice Assistant', color:'#2563eb', bg:'rgba(37,99,235,0.08)',   border:'rgba(37,99,235,0.15)' },
  { emoji:'💻', label:'Code Generator',  color:'#059669', bg:'rgba(5,150,105,0.08)',   border:'rgba(5,150,105,0.15)' },
  { emoji:'📊', label:'Market Analysis', color:'#d97706', bg:'rgba(217,119,6,0.08)',   border:'rgba(217,119,6,0.15)' },
  { emoji:'🧠', label:'AI Brain',        color:'#be185d', bg:'rgba(190,24,93,0.08)',   border:'rgba(190,24,93,0.15)' },
  { emoji:'⚡', label:'Task Automation', color:'#0891b2', bg:'rgba(8,145,178,0.08)',   border:'rgba(8,145,178,0.15)' },
];

const FeatureCard = ({ feature, onClick }) => {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:'flex', flexDirection:'column', alignItems:'center', gap:'8px',
        padding:'16px 10px', borderRadius:'14px', cursor:'pointer',
        background: hov ? feature.bg : '#f9f7ff',
        border: `1px solid ${hov ? feature.border : '#ede9fe'}`,
        transition:'all 0.18s', boxShadow: hov ? '0 4px 16px rgba(0,0,0,0.06)' : 'none',
        transform: hov ? 'translateY(-2px)' : 'none',
      }}
    >
      <div style={{
        width:'44px', height:'44px', borderRadius:'12px',
        background: feature.bg, border: `1px solid ${feature.border}`,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:'22px', transition:'transform 0.18s',
        transform: hov ? 'scale(1.1)' : 'scale(1)',
      }}>
        {feature.emoji}
      </div>
      <span style={{ fontSize:'12px', fontWeight:'500', color: hov ? feature.color : '#6b7280', textAlign:'center' }}>
        {feature.label}
      </span>
    </button>
  );
};

const EmptyState = ({ onMicClick, micSupported, onFeatureClick, isMobile }) => (
  <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'0', padding: isMobile?'24px 20px':'40px 48px', animation:'fadeIn 0.4s ease-out' }}>
    {/* Logo orb */}
    <div style={{
      width:'80px', height:'80px', borderRadius:'24px', marginBottom:'20px',
      background:'linear-gradient(135deg,#7c3aed,#a855f7)',
      display:'flex', alignItems:'center', justifyContent:'center',
      boxShadow:'0 8px 32px rgba(124,58,237,0.35), 0 0 0 8px rgba(124,58,237,0.08)',
      animation:'float 3s ease-in-out infinite',
    }}>
      <FiCpu size={36} style={{ color:'#fff' }} strokeWidth={1.8}/>
    </div>

    <h2 style={{ fontSize: isMobile?'20px':'22px', fontWeight:'700', color:'#1a1733', marginBottom:'8px', textAlign:'center', letterSpacing:'-0.02em' }}>
      Jarvis AI: Your Digital Co-Pilot
    </h2>
    <p style={{ fontSize:'14px', color:'#9ca3af', textAlign:'center', maxWidth:'360px', lineHeight:'1.7', marginBottom:'32px' }}>
      Unlock the potential of AI. Seamlessly integrate intelligence, natural language understanding, and automation into your workflows.
    </p>

    {/* Feature grid */}
    <div style={{
      display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(3,1fr)',
      gap:'10px', width:'100%', maxWidth: isMobile?'300px':'440px', marginBottom:'32px',
    }}>
      {FEATURES.map((f,i) => (
        <FeatureCard
          key={i}
          feature={f}
          onClick={() => onFeatureClick?.(f.label)}
        />
      ))}
    </div>

    <div style={{ fontSize:'13px', color:'#c4b5fd', textAlign:'center' }}>
      Type a message below, or{' '}
      {micSupported
        ? <button onClick={onMicClick} style={{ color:'#7c3aed', background:'none', border:'none', cursor:'pointer', fontSize:'13px', fontFamily:'inherit', fontWeight:'600', textDecoration:'underline', textDecorationColor:'rgba(124,58,237,0.4)' }}>
            tap the mic
          </button>
        : 'use the mic button'
      }
      {' '}to talk to Jarvis.
    </div>
  </div>
);

// ── Message bubbles ─────────────────────────────────────────────────────────

const MessageBubble = ({ msg, isMobile }) => {
  const isUser  = msg.role === 'user';
  const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
  return (
    <div style={{
      display:'flex', gap:'12px', padding: isMobile?'12px 16px':'14px 24px',
      alignItems:'flex-start',
      borderBottom: '1px solid rgba(124,58,237,0.05)',
      background: isUser ? 'transparent' : 'rgba(124,58,237,0.03)',
      animation:'fadeIn 0.25s ease-out',
    }}>
      <div style={{
        width:'32px', height:'32px', borderRadius:'10px', flexShrink:0, marginTop:'1px',
        background: isUser
          ? 'linear-gradient(135deg,#ede9fe,#ddd6fe)'
          : 'linear-gradient(135deg,#7c3aed,#a855f7)',
        display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow: isUser ? 'none' : '0 4px 12px rgba(124,58,237,0.35)',
      }}>
        {isUser
          ? <FiUser size={14} style={{ color:'#7c3aed' }}/>
          : <FiCpu  size={14} style={{ color:'#fff' }}/>
        }
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:'11px', fontWeight:'700', marginBottom:'5px', letterSpacing:'0.04em', color: isUser?'#a78bfa':'#7c3aed', textTransform:'uppercase' }}>
          {isUser ? 'You' : 'Jarvis'}
        </div>
        <div style={{ fontSize: isMobile?'14px':'13px', color:'#374151', lineHeight:'1.75', whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
          {content}
        </div>
      </div>
    </div>
  );
};

const Dot = ({ delay }) => (
  <div style={{ width:'7px', height:'7px', borderRadius:'50%', backgroundColor:'#a78bfa', animation:`pulse 1.2s ease-in-out ${delay}s infinite` }}/>
);

const TypingIndicator = ({ isMobile }) => (
  <div style={{ display:'flex', gap:'12px', padding: isMobile?'12px 16px':'14px 24px', alignItems:'center', background:'rgba(124,58,237,0.03)', borderBottom:'1px solid rgba(124,58,237,0.05)' }}>
    <div style={{ width:'32px', height:'32px', borderRadius:'10px', background:'linear-gradient(135deg,#7c3aed,#a855f7)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 4px 12px rgba(124,58,237,0.35)' }}>
      <FiCpu size={14} style={{ color:'#fff' }}/>
    </div>
    <div style={{ display:'flex', gap:'5px', alignItems:'center' }}>
      <Dot delay={0}/><Dot delay={0.15}/><Dot delay={0.3}/>
    </div>
  </div>
);

const ListeningIndicator = ({ isMobile }) => (
  <div style={{ display:'flex', gap:'12px', padding:isMobile?'12px 16px':'14px 24px', alignItems:'center', background:'rgba(5,150,105,0.04)', borderBottom:'1px solid rgba(5,150,105,0.08)' }}>
    <div style={{ width:'32px', height:'32px', borderRadius:'10px', background:'rgba(5,150,105,0.12)', border:'1px solid rgba(5,150,105,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      <FiMic size={14} style={{ color:'#059669' }}/>
    </div>
    <div>
      <div style={{ fontSize:'12px', color:'#059669', fontWeight:'600', marginBottom:'4px' }}>Listening...</div>
      <div style={{ display:'flex', gap:'3px', alignItems:'flex-end', height:'16px' }}>
        {[1,.6,1,.4,.8,.5,1,.7].map((h,i)=>(
          <div key={i} style={{ width:'3px', borderRadius:'2px', backgroundColor:'#34d399', height:`${h*12}px`, animation:`pulse 0.8s ease-in-out ${i*0.1}s infinite`, opacity:0.8 }}/>
        ))}
      </div>
    </div>
  </div>
);

const SpeakingIndicator = ({ isMobile }) => (
  <div style={{ display:'flex', gap:'12px', padding:isMobile?'12px 16px':'14px 24px', alignItems:'center', background:'rgba(124,58,237,0.04)', borderBottom:'1px solid rgba(124,58,237,0.08)' }}>
    <div style={{ width:'32px', height:'32px', borderRadius:'10px', background:'linear-gradient(135deg,#7c3aed,#a855f7)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 4px 12px rgba(124,58,237,0.35)' }}>
      <FiVolume2 size={14} style={{ color:'#fff' }}/>
    </div>
    <div>
      <div style={{ fontSize:'12px', color:'#7c3aed', fontWeight:'600', marginBottom:'4px' }}>Jarvis is speaking...</div>
      <div style={{ display:'flex', gap:'3px', alignItems:'flex-end', height:'16px' }}>
        {[.5,1,.7,1,.4,.9,.6,1].map((h,i)=>(
          <div key={i} style={{ width:'3px', borderRadius:'2px', backgroundColor:'#a78bfa', height:`${h*12}px`, animation:`pulse 1s ease-in-out ${i*0.12}s infinite`, opacity:0.8 }}/>
        ))}
      </div>
    </div>
  </div>
);

// ── Main ───────────────────────────────────────────────────────────────────

const ChatInterface = ({ messages, onSendMessage, isTyping, voiceState, onVoiceStateChange, isMobile }) => {
  const [input,      setInput]      = useState('');
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [speaking,   setSpeaking]   = useState(false);
  const textareaRef    = useRef(null);
  const messagesEndRef = useRef(null);

  const { listening, start: startListening, stop: stopListening, supported: micSupported } =
    useSpeechToText({
      onResult:      useCallback((t) => { if (t) onSendMessage(t); }, [onSendMessage]),
      onStateChange: useCallback((s) => { onVoiceStateChange?.(s); }, [onVoiceStateChange]),
    });

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages, isTyping, listening, speaking]);

  useEffect(() => {
    if (!ttsEnabled) return;
    const last = messages[messages.length - 1];
    if (last?.role === 'assistant') {
      const text = typeof last.content === 'string' ? last.content : '';
      if (text) {
        setSpeaking(true); onVoiceStateChange?.('speaking');
        speakText(text, ()=>{}, ()=>{ setSpeaking(false); onVoiceStateChange?.('idle'); });
      }
    }
  }, [messages]);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, isMobile?120:180) + 'px';
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    onSendMessage(text);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const toggleMic = () => {
    if (listening) { stopListening(); }
    else { if (speaking){ window.speechSynthesis?.cancel(); setSpeaking(false); } startListening(); }
  };
  const toggleTts = () => {
    if (speaking){ window.speechSynthesis?.cancel(); setSpeaking(false); }
    setTtsEnabled(v => !v);
  };

  const handleFeatureClick = (label) => {
    const prompts = {
      'Smart Chat':      'Hello! What can you help me with today?',
      'Voice Assistant': 'How do I use voice commands with Jarvis?',
      'Code Generator':  'Build me a simple React button component',
      'Market Analysis': 'Analyze the NIFTY 50 trend for today',
      'AI Brain':        'Tell me about your 12-layer AI architecture',
      'Task Automation': 'What tasks can you automate for me?',
    };
    const prompt = prompts[label] || `Tell me about ${label}`;
    setInput(prompt);
    textareaRef.current?.focus();
  };

  const btnSize = isMobile ? 42 : 36;
  const hasContent = input.trim() && !listening;

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0, background:'#ffffff' }}>

      {/* Tab bar */}
      <div style={{
        height: isMobile?'46px':'42px',
        background:'#fff', borderBottom:'1px solid #ede9fe',
        display:'flex', alignItems:'stretch', justifyContent:'space-between', flexShrink:0,
      }}>
        <div style={{ display:'flex', alignItems:'center', padding:'0 20px', borderBottom:'2px solid #7c3aed', gap:'8px', fontSize:'13px', fontWeight:'600', color:'#7c3aed' }}>
          <FiCpu size={14} style={{ color:'#7c3aed' }}/>
          <span>chat</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', paddingRight:'14px', gap:'6px' }}>
          <button onClick={toggleTts}
            style={{
              display:'flex', alignItems:'center', gap:'5px',
              padding: isMobile?'6px 10px':'5px 12px', borderRadius:'20px',
              background: ttsEnabled ? 'rgba(124,58,237,0.08)' : 'transparent',
              border: `1px solid ${ttsEnabled ? 'rgba(124,58,237,0.2)' : '#ede9fe'}`,
              color: ttsEnabled ? '#7c3aed' : '#9ca3af',
              fontSize:'12px', fontWeight:'500', cursor:'pointer', transition:'all 0.15s',
            }}>
            {ttsEnabled ? <FiVolume2 size={13}/> : <FiVolumeX size={13}/>}
            {!isMobile && <span>Voice reply</span>}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', background:'#fff' }}>
        {messages.length===0 && !isTyping && !listening
          ? <EmptyState onMicClick={toggleMic} micSupported={micSupported} onFeatureClick={handleFeatureClick} isMobile={isMobile}/>
          : (
            <div>
              {messages.map((msg,idx) => <MessageBubble key={idx} msg={msg} isMobile={isMobile}/>)}
              {isTyping  && <TypingIndicator isMobile={isMobile}/>}
              {listening && <ListeningIndicator isMobile={isMobile}/>}
              {speaking && !isTyping && <SpeakingIndicator isMobile={isMobile}/>}
              <div ref={messagesEndRef}/>
            </div>
          )
        }
      </div>

      {/* Input */}
      <div style={{ background:'#fff', borderTop:'1px solid #ede9fe', padding: isMobile?'12px 14px':'14px 20px', flexShrink:0 }}>
        <div
          style={{
            display:'flex', gap:'8px', alignItems:'flex-end',
            background:'#f9f7ff', border:'1px solid #ddd6fe',
            borderRadius:'14px', padding: isMobile?'10px 10px 10px 16px':'10px 10px 10px 18px',
            transition:'border-color 0.2s, box-shadow 0.2s',
          }}
          onFocusCapture={e => { e.currentTarget.style.borderColor='#7c3aed'; e.currentTarget.style.boxShadow='0 0 0 3px rgba(124,58,237,0.1)'; }}
          onBlurCapture={e  => { e.currentTarget.style.borderColor='#ddd6fe'; e.currentTarget.style.boxShadow='none'; }}>
          <textarea ref={textareaRef} value={input}
            onChange={e => { setInput(e.target.value); autoResize(); }}
            onKeyDown={e => { if(e.key==='Enter' && !e.shiftKey && !isMobile){ e.preventDefault(); handleSend(); } }}
            placeholder={listening ? 'Listening for voice...' : 'Ask me anything...'}
            rows={1} disabled={listening}
            style={{
              flex:1, minHeight:'22px', maxHeight:isMobile?'120px':'180px',
              background:'transparent', border:'none', outline:'none',
              color: listening ? '#c4b5fd' : '#1a1733',
              fontSize: isMobile?'15px':'14px', lineHeight:'1.6',
              resize:'none', fontFamily:'inherit',
            }}
          />
          <div style={{ display:'flex', gap:'6px', alignItems:'flex-end', paddingBottom:'1px' }}>
            {micSupported && (
              <button onClick={toggleMic}
                style={{
                  width:`${btnSize}px`, height:`${btnSize}px`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  borderRadius:'10px',
                  background: listening ? 'rgba(5,150,105,0.12)' : 'transparent',
                  border: `1px solid ${listening ? 'rgba(5,150,105,0.35)' : '#ede9fe'}`,
                  color: listening ? '#059669' : '#9ca3af',
                  cursor:'pointer', transition:'all 0.15s',
                  animation: listening ? 'pulse 1.5s ease-in-out infinite' : 'none',
                  flexShrink:0,
                }}>
                {listening ? <FiMic size={16}/> : <FiMicOff size={16}/>}
              </button>
            )}
            <button onClick={handleSend} disabled={!hasContent}
              style={{
                width:`${btnSize}px`, height:`${btnSize}px`,
                display:'flex', alignItems:'center', justifyContent:'center',
                borderRadius:'10px',
                background: hasContent ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : '#f3f0ff',
                color: hasContent ? '#fff' : '#c4b5fd',
                cursor: hasContent ? 'pointer' : 'not-allowed',
                border:'none', transition:'all 0.15s', flexShrink:0,
                boxShadow: hasContent ? '0 4px 12px rgba(124,58,237,0.4)' : 'none',
                transform: hasContent ? 'scale(1)' : 'scale(0.95)',
              }}
              onMouseEnter={e => { if(hasContent) e.currentTarget.style.transform='scale(1.05)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform=hasContent?'scale(1)':'scale(0.95)'; }}>
              <FiSend size={15}/>
            </button>
          </div>
        </div>
        {!isMobile && (
          <div style={{ marginTop:'8px', fontSize:'11px', color:'#c4b5fd', textAlign:'center' }}>
            Jarvis can make mistakes. Verify important information.
          </div>
        )}
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:0.4}50%{opacity:1}}`}</style>
    </div>
  );
};

export default ChatInterface;
