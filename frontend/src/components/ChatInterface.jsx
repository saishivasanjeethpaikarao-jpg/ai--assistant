import { useState, useRef, useEffect, useCallback } from 'react';
import {
  FiSend, FiMic, FiMicOff, FiVolume2, FiVolumeX,
  FiMessageSquare, FiCode, FiTrendingUp, FiCpu, FiZap,
} from 'react-icons/fi';
import JarvisLogo from './JarvisLogo';

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
  const stop = useCallback(() => {
    recRef.current?.stop(); setListening(false); onStateChange?.('idle');
  }, [onStateChange]);
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

// ── Premium Feature Cards ────────────────────────────────────────────────────

const FEATURES = [
  { Icon: FiMessageSquare, label:'Smart Chat',      sub:'Natural conversation',  color:'#7c3aed', g1:'#7c3aed', g2:'#a855f7' },
  { Icon: FiMic,           label:'Voice Assistant', sub:'Speak to Jarvis',       color:'#2563eb', g1:'#2563eb', g2:'#38bdf8' },
  { Icon: FiCode,          label:'Code Generator',  sub:'6 specialist agents',   color:'#059669', g1:'#059669', g2:'#34d399' },
  { Icon: FiTrendingUp,    label:'Market Analysis', sub:'NSE/BSE intelligence',  color:'#d97706', g1:'#d97706', g2:'#fbbf24' },
  { Icon: FiCpu,           label:'AI Brain',        sub:'12-layer pipeline',     color:'#be185d', g1:'#be185d', g2:'#f472b6' },
  { Icon: FiZap,           label:'Task Automation', sub:'Automate anything',     color:'#0891b2', g1:'#0891b2', g2:'#22d3ee' },
];

const FeatureCard = ({ feature, onClick }) => {
  const [hov, setHov] = useState(false);
  const { Icon, label, sub, color, g1, g2 } = feature;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:'flex', flexDirection:'column', alignItems:'flex-start', gap:'10px',
        padding:'16px 14px', borderRadius:'16px', cursor:'pointer', textAlign:'left',
        background: hov
          ? `linear-gradient(135deg,${g1}0d,${g2}18)`
          : '#ffffff',
        border: `1px solid ${hov ? color+'33' : '#ede9fe'}`,
        transition:'all 0.2s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: hov
          ? `0 8px 28px ${color}20, 0 2px 8px rgba(0,0,0,0.04)`
          : '0 1px 4px rgba(0,0,0,0.04)',
        transform: hov ? 'translateY(-3px)' : 'none',
      }}
    >
      <div style={{
        width:'40px', height:'40px', borderRadius:'12px',
        background: `linear-gradient(135deg,${g1},${g2})`,
        display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow: hov ? `0 6px 18px ${color}50` : `0 3px 10px ${color}30`,
        transition:'box-shadow 0.2s',
      }}>
        <Icon size={18} style={{ color:'#fff' }} strokeWidth={2.2}/>
      </div>
      <div>
        <div style={{ fontSize:'12px', fontWeight:'700', color: hov ? color : '#1a1733', letterSpacing:'-0.01em', marginBottom:'2px' }}>
          {label}
        </div>
        <div style={{ fontSize:'11px', color:'#9ca3af', lineHeight:'1.4' }}>{sub}</div>
      </div>
    </button>
  );
};

// ── Premium Empty State ──────────────────────────────────────────────────────

const EmptyState = ({ onMicClick, micSupported, onFeatureClick, isMobile }) => (
  <div style={{
    flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
    gap:'0', padding: isMobile ? '24px 20px' : '32px 48px',
    animation:'ciFloat 0s ease-out',
  }}>

    {/* Premium logo with glow rings */}
    <div style={{ position:'relative', marginBottom:'28px', display:'flex', alignItems:'center', justifyContent:'center' }}>
      {/* Outer glow ring */}
      <div style={{
        position:'absolute', inset:'-20px',
        borderRadius:'50%',
        background:'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
        animation:'ciPulse 3s ease-in-out infinite',
      }}/>
      {/* Mid ring */}
      <div style={{
        position:'absolute', inset:'-8px',
        border:'1px solid rgba(124,58,237,0.15)',
        borderRadius:'28px',
        animation:'ciPulse 3s ease-in-out infinite 0.5s',
      }}/>
      <div style={{ animation:'ciFloat 4s ease-in-out infinite', position:'relative' }}>
        <JarvisLogo size={88} animate={false}/>
      </div>
    </div>

    {/* Heading with gradient text */}
    <h2 style={{
      fontSize: isMobile ? '21px' : '25px',
      fontWeight:'800',
      letterSpacing:'-0.03em',
      textAlign:'center',
      marginBottom:'10px',
      lineHeight:'1.2',
      background:'linear-gradient(135deg,#1a1733 0%,#4c1d95 50%,#7c3aed 100%)',
      WebkitBackgroundClip:'text',
      WebkitTextFillColor:'transparent',
      backgroundClip:'text',
    }}>
      Jarvis AI: Your Digital Co-Pilot
    </h2>

    <p style={{
      fontSize:'14px', color:'#9ca3af', textAlign:'center',
      maxWidth:'380px', lineHeight:'1.75', marginBottom:'32px',
    }}>
      Intelligence, voice, code, and automation — unified in one assistant.
    </p>

    {/* Premium feature grid */}
    <div style={{
      display:'grid',
      gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(3,1fr)',
      gap:'10px', width:'100%', maxWidth: isMobile ? '320px' : '480px',
      marginBottom:'32px',
    }}>
      {FEATURES.map((f,i) => (
        <FeatureCard
          key={i}
          feature={f}
          onClick={() => onFeatureClick?.(f.label)}
        />
      ))}
    </div>

    <div style={{
      display:'flex', alignItems:'center', gap:'8px',
      padding:'10px 18px', borderRadius:'99px',
      background:'rgba(124,58,237,0.05)', border:'1px solid rgba(124,58,237,0.12)',
      fontSize:'13px', color:'#9ca3af',
    }}>
      <span>Type below</span>
      <span style={{ color:'#ede9fe' }}>·</span>
      {micSupported
        ? <button onClick={onMicClick} style={{ color:'#7c3aed', background:'none', border:'none', cursor:'pointer', fontSize:'13px', fontFamily:'inherit', fontWeight:'700', padding:0 }}>
            tap the mic
          </button>
        : <span>use voice</span>
      }
      <span style={{ color:'#ede9fe' }}>·</span>
      <span>or click a card above</span>
    </div>
  </div>
);

// ── Message bubbles ──────────────────────────────────────────────────────────

const JAvatar = () => (
  <div style={{
    width:'34px', height:'34px', borderRadius:'11px', flexShrink:0, marginTop:'1px',
    background:'linear-gradient(135deg,#1e0a4a,#5b21b6)',
    display:'flex', alignItems:'center', justifyContent:'center',
    boxShadow:'0 4px 14px rgba(124,58,237,0.45), inset 0 1px 0 rgba(255,255,255,0.1)',
    border:'1px solid rgba(167,139,250,0.3)',
  }}>
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M5 4 L10 4 L10 11 C10 12.8 8.7 14 7 14 C5.3 14 4 12.8 4 11"
        stroke="#c4b5fd" strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
  </div>
);

const UAvatar = () => (
  <div style={{
    width:'34px', height:'34px', borderRadius:'11px', flexShrink:0, marginTop:'1px',
    background:'linear-gradient(135deg,#f3f0ff,#ede9fe)',
    display:'flex', alignItems:'center', justifyContent:'center',
    boxShadow:'0 2px 8px rgba(124,58,237,0.12)',
    border:'1px solid rgba(167,139,250,0.2)',
  }}>
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle cx="7.5" cy="5" r="2.8" stroke="#7c3aed" strokeWidth="1.6" fill="none"/>
      <path d="M2 13 C2 10.2 4.5 8 7.5 8 C10.5 8 13 10.2 13 13" stroke="#7c3aed" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
    </svg>
  </div>
);

const MessageBubble = ({ msg, isMobile }) => {
  const isUser  = msg.role === 'user';
  const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
  return (
    <div style={{
      display:'flex', gap:'12px', padding: isMobile ? '12px 16px' : '14px 24px',
      alignItems:'flex-start',
      borderBottom:'1px solid rgba(124,58,237,0.05)',
      background: isUser ? 'transparent' : 'rgba(124,58,237,0.025)',
      animation:'ciFadeIn 0.25s ease-out',
    }}>
      {isUser ? <UAvatar/> : <JAvatar/>}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{
          fontSize:'11px', fontWeight:'700', marginBottom:'5px',
          letterSpacing:'0.06em', textTransform:'uppercase',
          color: isUser ? '#a78bfa' : '#7c3aed',
        }}>
          {isUser ? 'You' : 'Jarvis'}
        </div>
        <div style={{
          fontSize: isMobile ? '14px' : '13px', color:'#374151',
          lineHeight:'1.8', whiteSpace:'pre-wrap', wordBreak:'break-word',
        }}>
          {content}
        </div>
      </div>
    </div>
  );
};

const Dot = ({ delay }) => (
  <div style={{ width:'7px', height:'7px', borderRadius:'50%', backgroundColor:'#a78bfa', animation:`ciPulse 1.2s ease-in-out ${delay}s infinite` }}/>
);

const TypingIndicator = ({ isMobile }) => (
  <div style={{ display:'flex', gap:'12px', padding: isMobile ? '12px 16px' : '14px 24px', alignItems:'center', background:'rgba(124,58,237,0.025)', borderBottom:'1px solid rgba(124,58,237,0.05)' }}>
    <JAvatar/>
    <div style={{ display:'flex', gap:'5px', alignItems:'center' }}>
      <Dot delay={0}/><Dot delay={0.15}/><Dot delay={0.3}/>
    </div>
  </div>
);

const BarWave = ({ h, delay, color }) => (
  <div style={{ width:'3px', borderRadius:'2px', backgroundColor:color, height:`${h*13}px`, animation:`ciPulse 0.8s ease-in-out ${delay}s infinite`, opacity:0.85 }}/>
);

const ListeningIndicator = ({ isMobile }) => (
  <div style={{ display:'flex', gap:'12px', padding: isMobile ? '12px 16px' : '14px 24px', alignItems:'center', background:'rgba(5,150,105,0.04)', borderBottom:'1px solid rgba(5,150,105,0.08)' }}>
    <div style={{ width:'34px', height:'34px', borderRadius:'11px', background:'rgba(5,150,105,0.1)', border:'1px solid rgba(5,150,105,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      <FiMic size={15} style={{ color:'#059669' }}/>
    </div>
    <div>
      <div style={{ fontSize:'12px', color:'#059669', fontWeight:'700', marginBottom:'5px', letterSpacing:'0.06em', textTransform:'uppercase' }}>Listening</div>
      <div style={{ display:'flex', gap:'3px', alignItems:'flex-end', height:'16px' }}>
        {[1,.6,1,.4,.8,.5,1,.7].map((h,i) => <BarWave key={i} h={h} delay={i*0.1} color="#34d399"/>)}
      </div>
    </div>
  </div>
);

const SpeakingIndicator = ({ isMobile }) => (
  <div style={{ display:'flex', gap:'12px', padding: isMobile ? '12px 16px' : '14px 24px', alignItems:'center', background:'rgba(124,58,237,0.04)', borderBottom:'1px solid rgba(124,58,237,0.08)' }}>
    <JAvatar/>
    <div>
      <div style={{ fontSize:'12px', color:'#7c3aed', fontWeight:'700', marginBottom:'5px', letterSpacing:'0.06em', textTransform:'uppercase' }}>Speaking</div>
      <div style={{ display:'flex', gap:'3px', alignItems:'flex-end', height:'16px' }}>
        {[.5,1,.7,1,.4,.9,.6,1].map((h,i) => <BarWave key={i} h={h} delay={i*0.12} color="#a78bfa"/>)}
      </div>
    </div>
  </div>
);

// ── Main ─────────────────────────────────────────────────────────────────────

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
    el.style.height = Math.min(el.scrollHeight, isMobile ? 120 : 180) + 'px';
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    onSendMessage(text);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const toggleMic = () => {
    if (listening) stopListening();
    else { if (speaking) { window.speechSynthesis?.cancel(); setSpeaking(false); } startListening(); }
  };
  const toggleTts = () => {
    if (speaking) { window.speechSynthesis?.cancel(); setSpeaking(false); }
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
    setInput(prompts[label] || `Tell me about ${label}`);
    textareaRef.current?.focus();
  };

  const btnSize = isMobile ? 44 : 38;
  const hasContent = input.trim() && !listening;

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0, background:'#ffffff' }}>

      {/* Premium tab bar */}
      <div style={{
        height: isMobile ? '48px' : '44px',
        background:'#fff',
        borderBottom:'1px solid #ede9fe',
        display:'flex', alignItems:'stretch', justifyContent:'space-between', flexShrink:0,
        boxShadow:'0 1px 0 rgba(124,58,237,0.06)',
      }}>
        <div style={{
          display:'flex', alignItems:'center', padding:'0 20px',
          borderBottom:'2px solid #7c3aed',
          gap:'8px', fontSize:'13px', fontWeight:'700', color:'#7c3aed',
          letterSpacing:'-0.01em',
        }}>
          <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#a855f7)', boxShadow:'0 0 6px rgba(124,58,237,0.6)' }}/>
          <span>chat</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', paddingRight:'16px', gap:'8px' }}>
          <button onClick={toggleTts}
            style={{
              display:'flex', alignItems:'center', gap:'6px',
              padding: isMobile ? '6px 10px' : '6px 14px', borderRadius:'99px',
              background: ttsEnabled ? 'rgba(124,58,237,0.08)' : 'transparent',
              border:`1px solid ${ttsEnabled ? 'rgba(124,58,237,0.2)' : '#ede9fe'}`,
              color: ttsEnabled ? '#7c3aed' : '#9ca3af',
              fontSize:'12px', fontWeight:'600', cursor:'pointer', transition:'all 0.15s',
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

      {/* Premium input */}
      <div style={{ background:'#fff', borderTop:'1px solid #ede9fe', padding: isMobile ? '12px 14px 14px' : '14px 20px 16px', flexShrink:0 }}>
        <div
          style={{
            display:'flex', gap:'8px', alignItems:'flex-end',
            background:'#f9f7ff', border:'1.5px solid #ddd6fe',
            borderRadius:'16px', padding: isMobile ? '10px 10px 10px 16px' : '12px 10px 12px 20px',
            transition:'border-color 0.2s, box-shadow 0.2s',
            boxShadow:'0 2px 8px rgba(124,58,237,0.06)',
          }}
          onFocusCapture={e => { e.currentTarget.style.borderColor='#7c3aed'; e.currentTarget.style.boxShadow='0 0 0 3px rgba(124,58,237,0.1), 0 2px 8px rgba(124,58,237,0.1)'; }}
          onBlurCapture={e  => { e.currentTarget.style.borderColor='#ddd6fe'; e.currentTarget.style.boxShadow='0 2px 8px rgba(124,58,237,0.06)'; }}>
          <textarea ref={textareaRef} value={input}
            onChange={e => { setInput(e.target.value); autoResize(); }}
            onKeyDown={e => { if(e.key==='Enter' && !e.shiftKey && !isMobile){ e.preventDefault(); handleSend(); } }}
            placeholder={listening ? 'Listening for voice...' : 'Ask me anything...'}
            rows={1} disabled={listening}
            style={{
              flex:1, minHeight:'22px', maxHeight: isMobile ? '120px' : '180px',
              background:'transparent', border:'none', outline:'none',
              color: listening ? '#c4b5fd' : '#1a1733',
              fontSize: isMobile ? '15px' : '14px', lineHeight:'1.65',
              resize:'none', fontFamily:'inherit',
            }}
          />
          <div style={{ display:'flex', gap:'6px', alignItems:'flex-end', paddingBottom:'1px' }}>
            {micSupported && (
              <button onClick={toggleMic}
                style={{
                  width:`${btnSize}px`, height:`${btnSize}px`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  borderRadius:'11px',
                  background: listening ? 'rgba(5,150,105,0.1)' : 'transparent',
                  border:`1.5px solid ${listening ? 'rgba(5,150,105,0.35)' : 'rgba(167,139,250,0.2)'}`,
                  color: listening ? '#059669' : '#c4b5fd',
                  cursor:'pointer', transition:'all 0.15s',
                  animation: listening ? 'ciPulse 1.5s ease-in-out infinite' : 'none',
                  flexShrink:0,
                }}>
                {listening ? <FiMic size={16}/> : <FiMicOff size={16}/>}
              </button>
            )}
            <button onClick={handleSend} disabled={!hasContent}
              style={{
                width:`${btnSize}px`, height:`${btnSize}px`,
                display:'flex', alignItems:'center', justifyContent:'center',
                borderRadius:'11px',
                background: hasContent
                  ? 'linear-gradient(135deg,#7c3aed,#6d28d9)'
                  : 'rgba(124,58,237,0.06)',
                color: hasContent ? '#fff' : '#c4b5fd',
                cursor: hasContent ? 'pointer' : 'not-allowed',
                border:'none', transition:'all 0.18s', flexShrink:0,
                boxShadow: hasContent ? '0 4px 14px rgba(124,58,237,0.45)' : 'none',
                transform: hasContent ? 'scale(1)' : 'scale(0.95)',
              }}
              onMouseEnter={e => { if(hasContent){ e.currentTarget.style.transform='scale(1.06)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(124,58,237,0.55)'; } }}
              onMouseLeave={e => { e.currentTarget.style.transform=hasContent?'scale(1)':'scale(0.95)'; e.currentTarget.style.boxShadow=hasContent?'0 4px 14px rgba(124,58,237,0.45)':'none'; }}>
              <FiSend size={15}/>
            </button>
          </div>
        </div>
        {!isMobile && (
          <div style={{ marginTop:'8px', fontSize:'11px', color:'#c4b5fd', textAlign:'center', letterSpacing:'0.01em' }}>
            Jarvis can make mistakes. Verify important information.
          </div>
        )}
      </div>

      <style>{`
        @keyframes ciPulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
        @keyframes ciFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes ciFadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
};

export default ChatInterface;
