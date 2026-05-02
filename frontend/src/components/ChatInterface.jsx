import { useState, useRef, useEffect, useCallback } from 'react';
import { FiSend, FiMic, FiMicOff, FiUser, FiCpu, FiVolume2, FiVolumeX } from 'react-icons/fi';

const GLASS_PANEL = {
  background: 'rgba(8,4,20,0.70)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
};

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

// ── Message bubble ─────────────────────────────────────────────────────────

const MessageBubble = ({ msg, isMobile }) => {
  const isUser  = msg.role === 'user';
  const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
  return (
    <div style={{
      display:'flex', gap:isMobile?'10px':'12px',
      padding: isMobile?'10px 14px':'12px 20px',
      alignItems:'flex-start',
      borderBottom: '1px solid rgba(138,92,246,0.07)',
      background: isUser ? 'transparent' : 'rgba(139,92,246,0.05)',
    }}>
      <div style={{
        width:'30px', height:'30px', borderRadius:'8px', flexShrink:0, marginTop:'1px',
        background: isUser ? 'rgba(255,255,255,0.05)' : 'rgba(139,92,246,0.18)',
        border: `1px solid ${isUser ? 'rgba(255,255,255,0.08)' : 'rgba(139,92,246,0.35)'}`,
        display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow: isUser ? 'none' : '0 0 12px rgba(139,92,246,0.25)',
      }}>
        {isUser
          ? <FiUser size={13} style={{ color:'rgba(196,181,253,0.6)' }}/>
          : <FiCpu  size={13} style={{ color:'#a78bfa' }}/>
        }
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:'11px', fontWeight:'600', marginBottom:'5px', letterSpacing:'0.04em', color: isUser?'rgba(196,181,253,0.5)':'#a78bfa' }}>
          {isUser ? 'You' : 'Jarvis'}
        </div>
        <div style={{ fontSize: isMobile?'14px':'13px', color:'rgba(240,234,255,0.9)', lineHeight:'1.7', whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
          {content}
        </div>
      </div>
    </div>
  );
};

const Dot = ({ delay, color }) => (
  <div style={{ width:'7px', height:'7px', borderRadius:'50%', backgroundColor:color||'#8b5cf6', animation:`pulse 1.2s ease-in-out ${delay}s infinite` }}/>
);

const TypingIndicator = ({ isMobile }) => (
  <div style={{ display:'flex', gap:isMobile?'10px':'12px', padding: isMobile?'10px 14px':'12px 20px', alignItems:'center', background:'rgba(139,92,246,0.05)', borderBottom:'1px solid rgba(138,92,246,0.07)' }}>
    <div style={{ width:'30px', height:'30px', borderRadius:'8px', background:'rgba(139,92,246,0.18)', border:'1px solid rgba(139,92,246,0.35)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 0 12px rgba(139,92,246,0.25)' }}>
      <FiCpu size={13} style={{ color:'#a78bfa' }}/>
    </div>
    <div style={{ display:'flex', gap:'5px', alignItems:'center' }}>
      <Dot delay={0}/><Dot delay={0.15}/><Dot delay={0.3}/>
    </div>
  </div>
);

const ListeningIndicator = ({ isMobile }) => (
  <div style={{ display:'flex', gap:'12px', padding:isMobile?'10px 14px':'12px 20px', alignItems:'center', background:'rgba(16,185,129,0.06)', borderBottom:'1px solid rgba(16,185,129,0.1)' }}>
    <div style={{ width:'30px', height:'30px', borderRadius:'8px', background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.3)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      <FiMic size={13} style={{ color:'#34d399' }}/>
    </div>
    <div>
      <div style={{ fontSize:'12px', color:'#34d399', fontWeight:'600', marginBottom:'4px' }}>Listening...</div>
      <div style={{ display:'flex', gap:'3px', alignItems:'flex-end', height:'16px' }}>
        {[1,.6,1,.4,.8,.5,1,.7].map((h,i)=>(
          <div key={i} style={{ width:'3px', borderRadius:'2px', backgroundColor:'#34d399', height:`${h*12}px`, animation:`pulse 0.8s ease-in-out ${i*0.1}s infinite`, opacity:0.8 }}/>
        ))}
      </div>
    </div>
  </div>
);

const SpeakingIndicator = ({ isMobile }) => (
  <div style={{ display:'flex', gap:'12px', padding:isMobile?'10px 14px':'12px 20px', alignItems:'center', background:'rgba(139,92,246,0.06)', borderBottom:'1px solid rgba(139,92,246,0.1)' }}>
    <div style={{ width:'30px', height:'30px', borderRadius:'8px', background:'rgba(139,92,246,0.15)', border:'1px solid rgba(139,92,246,0.3)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 0 16px rgba(139,92,246,0.3)' }}>
      <FiVolume2 size={13} style={{ color:'#a78bfa' }}/>
    </div>
    <div>
      <div style={{ fontSize:'12px', color:'#a78bfa', fontWeight:'600', marginBottom:'4px' }}>Jarvis is speaking...</div>
      <div style={{ display:'flex', gap:'3px', alignItems:'flex-end', height:'16px' }}>
        {[.5,1,.7,1,.4,.9,.6,1].map((h,i)=>(
          <div key={i} style={{ width:'3px', borderRadius:'2px', backgroundColor:'#8b5cf6', height:`${h*12}px`, animation:`pulse 1s ease-in-out ${i*0.12}s infinite`, opacity:0.8 }}/>
        ))}
      </div>
    </div>
  </div>
);

const EmptyState = ({ onMicClick, micSupported, isMobile }) => (
  <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'10px', padding: isMobile?'24px 20px':'40px' }}>
    {/* Glowing orb */}
    <div style={{
      width:'72px', height:'72px', borderRadius:'50%', marginBottom:'8px',
      background:'radial-gradient(circle, rgba(139,92,246,0.35) 0%, rgba(99,32,196,0.12) 60%, transparent 100%)',
      border:'1px solid rgba(138,92,246,0.35)',
      display:'flex', alignItems:'center', justifyContent:'center',
      boxShadow:'0 0 32px rgba(139,92,246,0.2), inset 0 0 20px rgba(139,92,246,0.1)',
      animation:'glowPulse 3s ease-in-out infinite',
    }}>
      <FiCpu size={28} style={{ color:'#a78bfa' }}/>
    </div>
    <div style={{ fontSize:isMobile?'18px':'17px', color:'rgba(240,234,255,0.9)', fontWeight:'600', letterSpacing:'0.01em' }}>How can I help you?</div>
    <div style={{ fontSize:'13px', color:'rgba(196,181,253,0.5)', textAlign:'center', maxWidth:'280px', lineHeight:'1.7' }}>
      Type a message, or{' '}
      {micSupported
        ? <button onClick={onMicClick} style={{ color:'#34d399', background:'none', border:'none', cursor:'pointer', fontSize:'13px', fontFamily:'inherit', textDecoration:'underline' }}>tap the mic</button>
        : 'use the mic button'
      }{' '}
      to talk to Jarvis.
    </div>
    <style>{`@keyframes glowPulse{0%,100%{box-shadow:0 0 32px rgba(139,92,246,0.2)}50%{box-shadow:0 0 48px rgba(139,92,246,0.4)}}`}</style>
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

  const btnSize = isMobile ? 40 : 34;

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

      {/* Tab bar */}
      <div style={{ height:isMobile?'44px':'38px', ...GLASS_PANEL, borderBottom:'1px solid rgba(138,92,246,0.12)', display:'flex', alignItems:'stretch', justifyContent:'space-between', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', padding:'0 16px', borderRight:'1px solid rgba(138,92,246,0.1)', borderBottom:'2px solid #8b5cf6', background:'rgba(139,92,246,0.08)', fontSize:'13px', color:'rgba(240,234,255,0.9)', gap:'7px' }}>
          <FiCpu size={13} style={{ color:'#a78bfa' }}/><span>chat</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', paddingRight:'12px', gap:'6px' }}>
          <button onClick={toggleTts}
            style={{ display:'flex', alignItems:'center', gap:'5px', padding:isMobile?'6px 10px':'4px 10px', borderRadius:'6px', background: ttsEnabled?'rgba(139,92,246,0.15)':'transparent', border:`1px solid ${ttsEnabled?'rgba(139,92,246,0.35)':'transparent'}`, color: ttsEnabled?'#a78bfa':'rgba(196,181,253,0.35)', fontSize:'12px', cursor:'pointer', transition:'all 0.15s' }}>
            {ttsEnabled ? <FiVolume2 size={13}/> : <FiVolumeX size={13}/>}
            {!isMobile && <span>Voice reply</span>}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>
        {messages.length===0 && !isTyping && !listening
          ? <EmptyState onMicClick={toggleMic} micSupported={micSupported} isMobile={isMobile}/>
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
      <div style={{ ...GLASS_PANEL, borderTop:'1px solid rgba(138,92,246,0.12)', padding: isMobile?'10px 12px':'12px 16px', flexShrink:0 }}>
        <div style={{ display:'flex', gap:'8px', alignItems:'flex-end', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(138,92,246,0.18)', borderRadius:'12px', padding: isMobile?'10px 10px 10px 14px':'9px 9px 9px 14px', transition:'border-color 0.2s, box-shadow 0.2s' }}
          onFocusCapture={e => { e.currentTarget.style.borderColor='#8b5cf6'; e.currentTarget.style.boxShadow='0 0 0 3px rgba(139,92,246,0.12)'; }}
          onBlurCapture={e  => { e.currentTarget.style.borderColor='rgba(138,92,246,0.18)'; e.currentTarget.style.boxShadow='none'; }}>
          <textarea ref={textareaRef} value={input}
            onChange={e => { setInput(e.target.value); autoResize(); }}
            onKeyDown={e => { if(e.key==='Enter' && !e.shiftKey && !isMobile){ e.preventDefault(); handleSend(); } }}
            placeholder={listening ? 'Listening for voice...' : isMobile ? 'Message Jarvis...' : 'Message Jarvis… (Enter to send)'}
            rows={1} disabled={listening}
            style={{ flex:1, minHeight:'22px', maxHeight:isMobile?'120px':'180px', background:'transparent', border:'none', outline:'none', color: listening?'rgba(196,181,253,0.4)':'rgba(240,234,255,0.92)', fontSize:isMobile?'15px':'13px', lineHeight:'1.65', resize:'none', fontFamily:'inherit' }}
          />
          <div style={{ display:'flex', gap:'6px', alignItems:'flex-end', paddingBottom:'1px' }}>
            {micSupported && (
              <button onClick={toggleMic}
                style={{ width:`${btnSize}px`, height:`${btnSize}px`, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'8px', background: listening?'rgba(52,211,153,0.15)':'rgba(255,255,255,0.04)', border:`1px solid ${listening?'rgba(52,211,153,0.4)':'rgba(255,255,255,0.06)'}`, color: listening?'#34d399':'rgba(196,181,253,0.5)', cursor:'pointer', transition:'all 0.15s', animation: listening?'pulse 1.5s ease-in-out infinite':'none', flexShrink:0 }}>
                {listening ? <FiMic size={16}/> : <FiMicOff size={16}/>}
              </button>
            )}
            <button onClick={handleSend} disabled={!input.trim()||listening}
              style={{ width:`${btnSize}px`, height:`${btnSize}px`, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'8px', background: (input.trim()&&!listening)?'linear-gradient(135deg,#8b5cf6,#6d28d9)':'rgba(255,255,255,0.04)', color: (input.trim()&&!listening)?'#fff':'rgba(196,181,253,0.25)', cursor:(input.trim()&&!listening)?'pointer':'not-allowed', border:'none', transition:'all 0.15s', flexShrink:0, boxShadow:(input.trim()&&!listening)?'0 0 16px rgba(139,92,246,0.4)':'none' }}>
              <FiSend size={14}/>
            </button>
          </div>
        </div>
        {!isMobile && (
          <div style={{ marginTop:'6px', fontSize:'11px', color:'rgba(138,92,246,0.3)', textAlign:'center' }}>
            Jarvis can make mistakes. Verify important information.
          </div>
        )}
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );
};

export default ChatInterface;
