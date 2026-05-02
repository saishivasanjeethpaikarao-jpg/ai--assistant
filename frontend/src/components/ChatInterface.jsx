import { useState, useRef, useEffect, useCallback } from 'react';
import { FiSend, FiVolume2, FiVolumeX } from 'react-icons/fi';
import AIVoiceOrb from './AIVoiceOrb';
import { api } from '../services/api';

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

let _currentAudio = null;

function stopAllSpeech() {
  window.speechSynthesis?.cancel();
  if (_currentAudio) {
    _currentAudio.pause();
    _currentAudio.src = '';
    _currentAudio = null;
  }
}

async function speakWithFishAudio(text, ttsConfig, onEnd) {
  try {
    const arrayBuffer = await api.tts(text, ttsConfig.reference_id, ttsConfig.model);
    const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
    const url  = URL.createObjectURL(blob);
    const audio = new Audio(url);
    _currentAudio = audio;
    audio.onended  = () => { URL.revokeObjectURL(url); _currentAudio = null; onEnd(); };
    audio.onerror  = () => { URL.revokeObjectURL(url); _currentAudio = null; onEnd(); };
    await audio.play();
  } catch (err) {
    console.warn('[Airis TTS] Fish Audio failed, falling back to browser TTS:', err);
    speakBrowser(text, onEnd);
  }
}

function speakBrowser(text, onEnd) {
  if (!window.speechSynthesis) { onEnd?.(); return; }
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate=1.05; utt.pitch=0.95; utt.volume=1;
  const v = window.speechSynthesis.getVoices();
  const pref = v.find(x=>x.name.includes('Google')||x.name.includes('Premium'))||v.find(x=>x.lang==='en-US')||v[0];
  if (pref) utt.voice=pref;
  utt.onend=onEnd; utt.onerror=onEnd;
  window.speechSynthesis.speak(utt);
}

// ── Creative custom SVG icons ───────────────────────────────────────────────

const IconChat = ({ size=22, color='#fff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M4 4h16v12H7.5L4 19.5V4z" fill={color} opacity="0.15"/>
    <path d="M4 4h16v12H7.5L4 19.5V4z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill="none"/>
    <circle cx="8.5" cy="10" r="1.2" fill={color}/>
    <circle cx="12" cy="10" r="1.2" fill={color}/>
    <circle cx="15.5" cy="10" r="1.2" fill={color}/>
  </svg>
);

const IconVoice = ({ size=22, color='#fff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {[2,4.5,7,9.5,12,14.5,17,19.5,22].map((x,i) => {
      const heights = [4,7,12,9,18,10,13,7,4];
      const h = heights[i];
      return <rect key={x} x={x-0.8} y={(24-h)/2} width="1.6" height={h} rx="0.8" fill={color} opacity={i===4?1:0.7}/>;
    })}
  </svg>
);

const IconCode = ({ size=22, color='#fff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <polyline points="8,7 3,12 8,17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="16,7 21,12 16,17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="14" y1="4" x2="10" y2="20" stroke={color} strokeWidth="1.6" strokeLinecap="round" opacity="0.8"/>
  </svg>
);

const IconMarket = ({ size=22, color='#fff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Candlestick chart */}
    <rect x="4" y="10" width="3" height="7" rx="0.8" fill={color} opacity="0.5"/>
    <line x1="5.5" y1="8" x2="5.5" y2="10" stroke={color} strokeWidth="1.5"/>
    <line x1="5.5" y1="17" x2="5.5" y2="19" stroke={color} strokeWidth="1.5"/>
    <rect x="10.5" y="6" width="3" height="9" rx="0.8" fill={color} opacity="0.9"/>
    <line x1="12" y1="4" x2="12" y2="6" stroke={color} strokeWidth="1.5"/>
    <line x1="12" y1="15" x2="12" y2="17" stroke={color} strokeWidth="1.5"/>
    <rect x="17" y="9" width="3" height="6" rx="0.8" fill={color} opacity="0.7"/>
    <line x1="18.5" y1="7" x2="18.5" y2="9" stroke={color} strokeWidth="1.5"/>
    <line x1="18.5" y1="15" x2="18.5" y2="17.5" stroke={color} strokeWidth="1.5"/>
    {/* Trend arrow */}
    <polyline points="4,18 9,13 14,15 21,8" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" fill="none"/>
  </svg>
);

const IconBrain = ({ size=22, color='#fff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Hexagon outline */}
    <polygon points="12,3 20.5,7.5 20.5,16.5 12,21 3.5,16.5 3.5,7.5"
      stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.1" strokeLinejoin="round"/>
    {/* Neural nodes */}
    <circle cx="12" cy="12" r="1.8" fill={color}/>
    <circle cx="8" cy="9.5" r="1.2" fill={color} opacity="0.8"/>
    <circle cx="16" cy="9.5" r="1.2" fill={color} opacity="0.8"/>
    <circle cx="8" cy="14.5" r="1.2" fill={color} opacity="0.8"/>
    <circle cx="16" cy="14.5" r="1.2" fill={color} opacity="0.8"/>
    {/* Connections */}
    <line x1="12" y1="12" x2="8" y2="9.5"  stroke={color} strokeWidth="0.9" opacity="0.6"/>
    <line x1="12" y1="12" x2="16" y2="9.5"  stroke={color} strokeWidth="0.9" opacity="0.6"/>
    <line x1="12" y1="12" x2="8" y2="14.5"  stroke={color} strokeWidth="0.9" opacity="0.6"/>
    <line x1="12" y1="12" x2="16" y2="14.5"  stroke={color} strokeWidth="0.9" opacity="0.6"/>
  </svg>
);

const IconZap = ({ size=22, color='#fff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Circuit background */}
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.2" opacity="0.25" fill="none"/>
    <circle cx="12" cy="12" r="6" stroke={color} strokeWidth="0.8" opacity="0.15" fill="none"/>
    {/* Lightning bolt */}
    <path d="M13 3L6 13.5h6.5L11 21l8-11h-6.5L13 3z"
      fill={color} stroke={color} strokeWidth="0.5" strokeLinejoin="round"/>
    {/* Spark dots */}
    <circle cx="5" cy="5" r="1" fill={color} opacity="0.5"/>
    <circle cx="19" cy="5" r="1" fill={color} opacity="0.5"/>
    <circle cx="5" cy="19" r="1" fill={color} opacity="0.5"/>
    <circle cx="19" cy="19" r="1" fill={color} opacity="0.5"/>
  </svg>
);

// ── Feature cards ────────────────────────────────────────────────────────────

const FEATURES = [
  { IconComp: IconChat,   label:'Smart Chat',      sub:'Natural conversation',  g1:'#7c3aed', g2:'#a855f7', glow:'rgba(124,58,237,0.4)' },
  { IconComp: IconVoice,  label:'Voice Assistant', sub:'Speak to Airis',        g1:'#2563eb', g2:'#0ea5e9', glow:'rgba(37,99,235,0.4)' },
  { IconComp: IconCode,   label:'Code Generator',  sub:'6 specialist agents',   g1:'#059669', g2:'#10b981', glow:'rgba(5,150,105,0.4)' },
  { IconComp: IconMarket, label:'Market Analysis', sub:'NSE/BSE intelligence',  g1:'#d97706', g2:'#f59e0b', glow:'rgba(217,119,6,0.4)' },
  { IconComp: IconBrain,  label:'AI Brain',        sub:'12-layer pipeline',     g1:'#be185d', g2:'#ec4899', glow:'rgba(190,24,93,0.4)' },
  { IconComp: IconZap,    label:'Task Automation', sub:'Automate anything',     g1:'#0891b2', g2:'#06b6d4', glow:'rgba(8,145,178,0.4)' },
];

const FeatureCard = ({ feature, onClick }) => {
  const [hov, setHov] = useState(false);
  const { IconComp, label, sub, g1, g2, glow } = feature;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:'flex', flexDirection:'column', alignItems:'flex-start', gap:'10px',
        padding:'16px 14px', borderRadius:'16px', cursor:'pointer', textAlign:'left',
        background: hov ? `linear-gradient(135deg,${g1}12,${g2}20)` : '#ffffff',
        border:`1px solid ${hov ? g1+'44' : '#ede9fe'}`,
        transition:'all 0.22s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: hov ? `0 10px 30px ${glow}, 0 2px 8px rgba(0,0,0,0.04)` : '0 1px 4px rgba(0,0,0,0.04)',
        transform: hov ? 'translateY(-4px) scale(1.01)' : 'none',
      }}
    >
      <div style={{
        width:'42px', height:'42px', borderRadius:'13px', flexShrink:0,
        background:`linear-gradient(135deg,${g1},${g2})`,
        display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow: hov ? `0 6px 20px ${glow}` : `0 3px 10px ${glow}80`,
        transition:'box-shadow 0.22s, transform 0.22s',
        transform: hov ? 'scale(1.1)' : 'scale(1)',
      }}>
        <IconComp size={20} color="#fff"/>
      </div>
      <div>
        <div style={{ fontSize:'12px', fontWeight:'700', color: hov ? g1 : '#1a1733', letterSpacing:'-0.01em', marginBottom:'2px' }}>
          {label}
        </div>
        <div style={{ fontSize:'11px', color:'#9ca3af', lineHeight:'1.4' }}>{sub}</div>
      </div>
    </button>
  );
};

// ── Mic button SVG ───────────────────────────────────────────────────────────

const MicIcon = ({ active, size=18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="8" y="2" width="8" height="13" rx="4"
      fill={active ? '#059669' : 'none'}
      stroke={active ? '#059669' : 'currentColor'} strokeWidth="1.8"/>
    <path d="M5 11a7 7 0 0014 0" stroke={active ? '#059669' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    <line x1="12" y1="18" x2="12" y2="22" stroke={active ? '#059669' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round"/>
    <line x1="9" y1="22" x2="15" y2="22" stroke={active ? '#059669' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round"/>
    {active && <circle cx="12" cy="8.5" r="2.5" fill="#fff" opacity="0.3"/>}
  </svg>
);

const MicOffIcon = ({ size=18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M14.5 14.5A4 4 0 019.5 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    <path d="M8 8V7a4 4 0 018 0v5a4 4 0 01-.14 1.06" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    <path d="M5 11a7 7 0 0012.86 2.92" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <line x1="9" y1="22" x2="15" y2="22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

// ── Send button icon ─────────────────────────────────────────────────────────

const SendIcon = ({ size=15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 2L15 22L11 13L2 9L22 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.15"/>
  </svg>
);

// ── Empty State ──────────────────────────────────────────────────────────────

const EmptyState = ({ onMicClick, micSupported, onFeatureClick, isMobile, voiceState }) => (
  <div style={{
    flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
    padding: isMobile ? '20px 16px' : '28px 48px',
    gap: 0,
  }}>
    {/* 3D AI Voice Orb — centrepiece */}
    <div style={{ marginBottom: isMobile ? '20px' : '28px', animation:'ciFloat 5s ease-in-out infinite' }}>
      <AIVoiceOrb size={isMobile ? 130 : 160} state={voiceState || 'idle'}/>
    </div>

    {/* Gradient heading */}
    <h2 style={{
      fontSize: isMobile ? '21px' : '26px',
      fontWeight:'800', letterSpacing:'-0.03em',
      textAlign:'center', marginBottom:'10px', lineHeight:'1.2',
      background:'linear-gradient(135deg,#1a1733 0%,#4c1d95 45%,#7c3aed 100%)',
      WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
    }}>
      Airis AI: Your Digital Co-Pilot
    </h2>

    <p style={{
      fontSize:'14px', color:'#9ca3af', textAlign:'center',
      maxWidth:'380px', lineHeight:'1.75', marginBottom:'28px',
    }}>
      Intelligence, voice, code, and automation — unified in one assistant.
    </p>

    {/* Feature grid */}
    <div style={{
      display:'grid',
      gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(3,1fr)',
      gap:'10px', width:'100%', maxWidth: isMobile ? '320px' : '480px',
      marginBottom:'28px',
    }}>
      {FEATURES.map((f,i) => (
        <FeatureCard key={i} feature={f} onClick={() => onFeatureClick?.(f.label)}/>
      ))}
    </div>

    {/* Hint pill */}
    <div style={{
      display:'flex', alignItems:'center', gap:'8px',
      padding:'9px 18px', borderRadius:'99px',
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
      <span>or click a card</span>
    </div>
  </div>
);

// ── Avatars ──────────────────────────────────────────────────────────────────

const AirisAvatar = () => (
  <div style={{
    width:'34px', height:'34px', borderRadius:'11px', flexShrink:0, marginTop:'1px',
    background:'linear-gradient(135deg,#1e0a4a,#5b21b6)',
    display:'flex', alignItems:'center', justifyContent:'center',
    boxShadow:'0 4px 14px rgba(124,58,237,0.45), inset 0 1px 0 rgba(255,255,255,0.1)',
    border:'1px solid rgba(167,139,250,0.3)',
  }}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      {/* Stylised A — like the logo */}
      <path d="M12 4L4 20h4l1.5-4h5l1.5 4h4L12 4z" stroke="#c4b5fd" strokeWidth="1.8"
        strokeLinejoin="round" fill="rgba(196,181,253,0.1)"/>
      <line x1="7.5" y1="14" x2="16.5" y2="14" stroke="#c4b5fd" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  </div>
);

const UserAvatar = () => (
  <div style={{
    width:'34px', height:'34px', borderRadius:'11px', flexShrink:0, marginTop:'1px',
    background:'linear-gradient(135deg,#f3f0ff,#ede9fe)',
    display:'flex', alignItems:'center', justifyContent:'center',
    boxShadow:'0 2px 8px rgba(124,58,237,0.12)',
    border:'1px solid rgba(167,139,250,0.2)',
  }}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="#7c3aed" strokeWidth="1.8" fill="rgba(124,58,237,0.1)"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    </svg>
  </div>
);

// ── Message bubbles ──────────────────────────────────────────────────────────

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
      {isUser ? <UserAvatar/> : <AirisAvatar/>}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:'11px', fontWeight:'700', marginBottom:'5px', letterSpacing:'0.06em', textTransform:'uppercase', color: isUser ? '#a78bfa' : '#7c3aed' }}>
          {isUser ? 'You' : 'Airis'}
        </div>
        <div style={{ fontSize: isMobile ? '14px' : '13px', color:'#374151', lineHeight:'1.8', whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
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
  <div style={{ display:'flex', gap:'12px', padding: isMobile?'12px 16px':'14px 24px', alignItems:'center', background:'rgba(124,58,237,0.025)', borderBottom:'1px solid rgba(124,58,237,0.05)' }}>
    <AirisAvatar/>
    <div style={{ display:'flex', gap:'5px', alignItems:'center' }}>
      <Dot delay={0}/><Dot delay={0.15}/><Dot delay={0.3}/>
    </div>
  </div>
);

const Bar = ({ h, delay, color }) => (
  <div style={{ width:'3px', borderRadius:'2px', backgroundColor:color, height:`${h*14}px`, animation:`ciPulse 0.8s ease-in-out ${delay}s infinite`, opacity:0.85 }}/>
);

const ListeningIndicator = ({ isMobile }) => (
  <div style={{ display:'flex', gap:'12px', padding: isMobile?'12px 16px':'14px 24px', alignItems:'center', background:'rgba(5,150,105,0.04)', borderBottom:'1px solid rgba(5,150,105,0.08)' }}>
    <div style={{ width:'34px', height:'34px', borderRadius:'11px', background:'rgba(5,150,105,0.1)', border:'1px solid rgba(5,150,105,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      <MicIcon active size={16}/>
    </div>
    <div>
      <div style={{ fontSize:'11px', color:'#059669', fontWeight:'700', marginBottom:'5px', letterSpacing:'0.06em', textTransform:'uppercase' }}>Listening</div>
      <div style={{ display:'flex', gap:'3px', alignItems:'flex-end', height:'16px' }}>
        {[1,.6,1,.4,.9,.5,1,.7].map((h,i) => <Bar key={i} h={h} delay={i*0.1} color="#34d399"/>)}
      </div>
    </div>
  </div>
);

const SpeakingIndicator = ({ isMobile }) => (
  <div style={{ display:'flex', gap:'12px', padding: isMobile?'12px 16px':'14px 24px', alignItems:'center', background:'rgba(124,58,237,0.04)', borderBottom:'1px solid rgba(124,58,237,0.08)' }}>
    <AirisAvatar/>
    <div>
      <div style={{ fontSize:'11px', color:'#7c3aed', fontWeight:'700', marginBottom:'5px', letterSpacing:'0.06em', textTransform:'uppercase' }}>Speaking</div>
      <div style={{ display:'flex', gap:'3px', alignItems:'flex-end', height:'16px' }}>
        {[.5,1,.7,1,.4,.9,.6,1].map((h,i) => <Bar key={i} h={h} delay={i*0.12} color="#a78bfa"/>)}
      </div>
    </div>
  </div>
);

// ── Main ─────────────────────────────────────────────────────────────────────

const ChatInterface = ({ messages, onSendMessage, isTyping, voiceState, onVoiceStateChange, isMobile }) => {
  const [input,      setInput]      = useState('');
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [speaking,   setSpeaking]   = useState(false);
  const [ttsConfig,  setTtsConfig]  = useState(null);
  const textareaRef    = useRef(null);
  const messagesEndRef = useRef(null);

  const { listening, start: startListening, stop: stopListening, supported: micSupported } =
    useSpeechToText({
      onResult:      useCallback((t) => { if (t) onSendMessage(t); }, [onSendMessage]),
      onStateChange: useCallback((s) => { onVoiceStateChange?.(s); }, [onVoiceStateChange]),
    });

  useEffect(() => {
    api.ttsConfig().then(cfg => { if (cfg?.fish_available) setTtsConfig(cfg); }).catch(() => {});
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages, isTyping, listening, speaking]);

  useEffect(() => {
    if (!ttsEnabled) return;
    const last = messages[messages.length - 1];
    if (last?.role === 'assistant') {
      const raw = typeof last.content === 'string' ? last.content : '';
      const text = raw.replace(/[#*`_~>]/g, '').trim();
      if (!text) return;
      setSpeaking(true); onVoiceStateChange?.('speaking');
      const onDone = () => { setSpeaking(false); onVoiceStateChange?.('idle'); };
      if (ttsConfig?.fish_available) {
        speakWithFishAudio(text, ttsConfig, onDone);
      } else {
        speakBrowser(text, onDone);
      }
    }
  }, [messages]);

  const autoResize = () => {
    const el = textareaRef.current; if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, isMobile ? 120 : 180) + 'px';
  };

  const handleSend = () => {
    const text = input.trim(); if (!text) return;
    onSendMessage(text); setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const toggleMic = () => {
    if (listening) stopListening();
    else { if (speaking) { stopAllSpeech(); setSpeaking(false); } startListening(); }
  };
  const toggleTts = () => {
    if (speaking) { stopAllSpeech(); setSpeaking(false); }
    setTtsEnabled(v => !v);
  };

  const handleFeatureClick = (label) => {
    const prompts = {
      'Smart Chat':'Hello! What can you help me with today?',
      'Voice Assistant':'How do I use voice commands with Airis?',
      'Code Generator':'Build me a simple React button component',
      'Market Analysis':'Analyze the NIFTY 50 trend for today',
      'AI Brain':'Tell me about your 12-layer AI architecture',
      'Task Automation':'What tasks can you automate for me?',
    };
    setInput(prompts[label] || `Tell me about ${label}`);
    textareaRef.current?.focus();
  };

  const btnSize = isMobile ? 44 : 38;
  const hasContent = input.trim() && !listening;
  const currentVoiceState = listening ? 'listening' : speaking ? 'speaking' : 'idle';

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0, background:'#ffffff' }}>

      {/* Tab bar */}
      <div style={{
        height: isMobile ? '48px' : '44px', background:'#fff',
        borderBottom:'1px solid #ede9fe',
        display:'flex', alignItems:'stretch', justifyContent:'space-between', flexShrink:0,
        boxShadow:'0 1px 0 rgba(124,58,237,0.06)',
      }}>
        <div style={{
          display:'flex', alignItems:'center', padding:'0 20px',
          borderBottom:'2px solid #7c3aed',
          gap:'8px', fontSize:'13px', fontWeight:'700', color:'#7c3aed', letterSpacing:'-0.01em',
        }}>
          <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#a855f7)', boxShadow:'0 0 6px rgba(124,58,237,0.7)' }}/>
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
            {ttsEnabled
              ? <FiVolume2 size={13}/>
              : <FiVolumeX size={13}/>
            }
            {!isMobile && <span>Voice reply</span>}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', background:'#fff' }}>
        {messages.length===0 && !isTyping && !listening
          ? <EmptyState
              onMicClick={toggleMic}
              micSupported={micSupported}
              onFeatureClick={handleFeatureClick}
              isMobile={isMobile}
              voiceState={currentVoiceState}
            />
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
      <div style={{ background:'#fff', borderTop:'1px solid #ede9fe', padding: isMobile?'12px 14px 14px':'14px 20px 16px', flexShrink:0 }}>
        <div
          style={{
            display:'flex', gap:'8px', alignItems:'flex-end',
            background:'#f9f7ff', border:'1.5px solid #ddd6fe',
            borderRadius:'16px', padding: isMobile?'10px 10px 10px 16px':'12px 10px 12px 20px',
            transition:'border-color 0.2s, box-shadow 0.2s',
            boxShadow:'0 2px 8px rgba(124,58,237,0.06)',
          }}
          onFocusCapture={e => { e.currentTarget.style.borderColor='#7c3aed'; e.currentTarget.style.boxShadow='0 0 0 3px rgba(124,58,237,0.1), 0 2px 8px rgba(124,58,237,0.1)'; }}
          onBlurCapture={e  => { e.currentTarget.style.borderColor='#ddd6fe'; e.currentTarget.style.boxShadow='0 2px 8px rgba(124,58,237,0.06)'; }}>
          <textarea ref={textareaRef} value={input}
            onChange={e => { setInput(e.target.value); autoResize(); }}
            onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey&&!isMobile){ e.preventDefault(); handleSend(); } }}
            placeholder={listening ? 'Listening...' : 'Ask me anything...'}
            rows={1} disabled={listening}
            style={{
              flex:1, minHeight:'22px', maxHeight: isMobile?'120px':'180px',
              background:'transparent', border:'none', outline:'none',
              color: listening ? '#c4b5fd' : '#1a1733',
              fontSize: isMobile?'15px':'14px', lineHeight:'1.65',
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
                  border:`1.5px solid ${listening ? 'rgba(5,150,105,0.4)' : 'rgba(167,139,250,0.25)'}`,
                  color: listening ? '#059669' : '#c4b5fd',
                  cursor:'pointer', transition:'all 0.15s', flexShrink:0,
                  animation: listening ? 'ciPulse 1.5s ease-in-out infinite' : 'none',
                }}>
                {listening ? <MicIcon active size={17}/> : <MicOffIcon size={17}/>}
              </button>
            )}
            <button onClick={handleSend} disabled={!hasContent}
              style={{
                width:`${btnSize}px`, height:`${btnSize}px`,
                display:'flex', alignItems:'center', justifyContent:'center',
                borderRadius:'11px',
                background: hasContent ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : 'rgba(124,58,237,0.06)',
                color: hasContent ? '#fff' : '#c4b5fd',
                cursor: hasContent ? 'pointer' : 'not-allowed',
                border:'none', transition:'all 0.18s', flexShrink:0,
                boxShadow: hasContent ? '0 4px 14px rgba(124,58,237,0.45)' : 'none',
                transform: hasContent ? 'scale(1)' : 'scale(0.95)',
              }}
              onMouseEnter={e => { if(hasContent){ e.currentTarget.style.transform='scale(1.08)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(124,58,237,0.58)'; } }}
              onMouseLeave={e => { e.currentTarget.style.transform=hasContent?'scale(1)':'scale(0.95)'; e.currentTarget.style.boxShadow=hasContent?'0 4px 14px rgba(124,58,237,0.45)':'none'; }}>
              <SendIcon size={15}/>
            </button>
          </div>
        </div>
        {!isMobile && (
          <div style={{ marginTop:'8px', fontSize:'11px', color:'#c4b5fd', textAlign:'center', letterSpacing:'0.01em' }}>
            Airis can make mistakes. Verify important information.
          </div>
        )}
      </div>

      <style>{`
        @keyframes ciPulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
        @keyframes ciFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes ciFadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
};

export default ChatInterface;
