import { useState, useRef, useEffect, useCallback } from 'react';
import { FiSend, FiVolume2, FiVolumeX, FiPaperclip, FiX, FiImage, FiFileText } from 'react-icons/fi';
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

// ── Icons ────────────────────────────────────────────────────────────────────

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
    <rect x="4" y="10" width="3" height="7" rx="0.8" fill={color} opacity="0.5"/>
    <line x1="5.5" y1="8" x2="5.5" y2="10" stroke={color} strokeWidth="1.5"/>
    <line x1="5.5" y1="17" x2="5.5" y2="19" stroke={color} strokeWidth="1.5"/>
    <rect x="10.5" y="6" width="3" height="9" rx="0.8" fill={color} opacity="0.9"/>
    <line x1="12" y1="4" x2="12" y2="6" stroke={color} strokeWidth="1.5"/>
    <line x1="12" y1="15" x2="12" y2="17" stroke={color} strokeWidth="1.5"/>
    <rect x="17" y="9" width="3" height="6" rx="0.8" fill={color} opacity="0.7"/>
    <line x1="18.5" y1="7" x2="18.5" y2="9" stroke={color} strokeWidth="1.5"/>
    <line x1="18.5" y1="15" x2="18.5" y2="17.5" stroke={color} strokeWidth="1.5"/>
    <polyline points="4,18 9,13 14,15 21,8" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" fill="none"/>
  </svg>
);

const IconBrain = ({ size=22, color='#fff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <polygon points="12,3 20.5,7.5 20.5,16.5 12,21 3.5,16.5 3.5,7.5"
      stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.1" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="1.8" fill={color}/>
    <circle cx="8" cy="9.5" r="1.2" fill={color} opacity="0.8"/>
    <circle cx="16" cy="9.5" r="1.2" fill={color} opacity="0.8"/>
    <circle cx="8" cy="14.5" r="1.2" fill={color} opacity="0.8"/>
    <circle cx="16" cy="14.5" r="1.2" fill={color} opacity="0.8"/>
    <line x1="12" y1="12" x2="8" y2="9.5"  stroke={color} strokeWidth="0.9" opacity="0.6"/>
    <line x1="12" y1="12" x2="16" y2="9.5"  stroke={color} strokeWidth="0.9" opacity="0.6"/>
    <line x1="12" y1="12" x2="8" y2="14.5"  stroke={color} strokeWidth="0.9" opacity="0.6"/>
    <line x1="12" y1="12" x2="16" y2="14.5"  stroke={color} strokeWidth="0.9" opacity="0.6"/>
  </svg>
);

const IconZap = ({ size=22, color='#fff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.2" opacity="0.25" fill="none"/>
    <circle cx="12" cy="12" r="6" stroke={color} strokeWidth="0.8" opacity="0.15" fill="none"/>
    <path d="M13 3L6 13.5h6.5L11 21l8-11h-6.5L13 3z"
      fill={color} stroke={color} strokeWidth="0.5" strokeLinejoin="round"/>
    <circle cx="5" cy="5" r="1" fill={color} opacity="0.5"/>
    <circle cx="19" cy="5" r="1" fill={color} opacity="0.5"/>
    <circle cx="5" cy="19" r="1" fill={color} opacity="0.5"/>
    <circle cx="19" cy="19" r="1" fill={color} opacity="0.5"/>
  </svg>
);

const FEATURES = [
  { IconComp: IconChat,   label:'Smart Chat',      sub:'Natural conversation',  g1:'#437DFD', g2:'#2C76FF', glow:'rgba(67,125,253,0.4)' },
  { IconComp: IconVoice,  label:'Voice Assistant', sub:'Speak to Airis',        g1:'#7B61FF', g2:'#6D52F6', glow:'rgba(123,97,255,0.4)' },
  { IconComp: IconCode,   label:'Code Generator',  sub:'6 specialist agents',   g1:'#00C48C', g2:'#00A876', glow:'rgba(0,196,140,0.4)' },
  { IconComp: IconMarket, label:'Market Analysis', sub:'NSE/BSE intelligence',  g1:'#FF8C42', g2:'#F07020', glow:'rgba(255,140,66,0.4)' },
  { IconComp: IconBrain,  label:'AI Brain',        sub:'12-layer pipeline',     g1:'#FD5B5D', g2:'#E04040', glow:'rgba(253,91,93,0.4)' },
  { IconComp: IconZap,    label:'Task Automation', sub:'Automate anything',     g1:'#2C76FF', g2:'#1A60E8', glow:'rgba(44,118,255,0.4)' },
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
        background: hov ? `linear-gradient(135deg,${g1}10,${g2}18)` : 'rgba(255,255,255,0.9)',
        border:`1px solid ${hov ? g1+'40' : 'rgba(0,0,0,0.08)'}`,
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
        <div style={{ fontSize:'12px', fontWeight:'700', color: hov ? g1 : '#0C0C0C', letterSpacing:'-0.01em', marginBottom:'2px' }}>
          {label}
        </div>
        <div style={{ fontSize:'11px', color:'#aaa', lineHeight:'1.4' }}>{sub}</div>
      </div>
    </button>
  );
};

const MicIcon = ({ active, size=18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="8" y="2" width="8" height="13" rx="4"
      fill={active ? '#00C48C' : 'none'}
      stroke={active ? '#00C48C' : 'currentColor'} strokeWidth="1.8"/>
    <path d="M5 11a7 7 0 0014 0" stroke={active ? '#00C48C' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    <line x1="12" y1="18" x2="12" y2="22" stroke={active ? '#00C48C' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round"/>
    <line x1="9" y1="22" x2="15" y2="22" stroke={active ? '#00C48C' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round"/>
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

const SendIcon = ({ size=15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 2L15 22L11 13L2 9L22 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.15"/>
  </svg>
);

// ── Empty State ───────────────────────────────────────────────────────────────

const EmptyState = ({ onMicClick, micSupported, onFeatureClick, isMobile, voiceState }) => (
  <div style={{
    flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
    padding: isMobile ? '20px 16px' : '28px 48px',
    gap: 0,
  }}>
    <div style={{ marginBottom: isMobile ? '20px' : '28px', animation:'ciFloat 5s ease-in-out infinite' }}>
      <AIVoiceOrb size={isMobile ? 130 : 160} state={voiceState || 'idle'}/>
    </div>

    <h2 style={{
      fontSize: isMobile ? '21px' : '26px',
      fontWeight:'700', letterSpacing:'-0.03em',
      textAlign:'center', marginBottom:'10px', lineHeight:'1.2',
      background:'linear-gradient(135deg, #437DFD 0%, #2C76FF 50%, #FD5B5D 100%)',
      WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
    }}>
      Airis AI: Your Digital Co-Pilot
    </h2>

    <p style={{
      fontSize:'14px', color:'#888', textAlign:'center',
      maxWidth:'380px', lineHeight:'1.75', marginBottom:'28px',
    }}>
      Intelligence, voice, code, and automation — unified in one assistant.
    </p>

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

    <div style={{
      display:'flex', alignItems:'center', gap:'8px',
      padding:'9px 18px', borderRadius:'99px',
      background:'rgba(67,125,253,0.05)', border:'1px solid rgba(67,125,253,0.12)',
      fontSize:'13px', color:'#aaa',
    }}>
      <span>Type below</span>
      <span style={{ color:'rgba(67,125,253,0.4)' }}>·</span>
      {micSupported
        ? <button onClick={onMicClick} style={{ color:'#437DFD', background:'none', border:'none', cursor:'pointer', fontSize:'13px', fontFamily:'inherit', fontWeight:'700', padding:0 }}>
            tap the mic
          </button>
        : <span>use voice</span>
      }
      <span style={{ color:'rgba(67,125,253,0.4)' }}>·</span>
      <span>or click a card</span>
    </div>
  </div>
);

// ── Avatars ───────────────────────────────────────────────────────────────────

const AirisAvatar = () => (
  <div style={{
    width:'34px', height:'34px', borderRadius:'11px', flexShrink:0, marginTop:'1px',
    background:'linear-gradient(135deg,#0C2A6E,#437DFD)',
    display:'flex', alignItems:'center', justifyContent:'center',
    boxShadow:'0 4px 14px rgba(67,125,253,0.35), inset 0 1px 0 rgba(255,255,255,0.1)',
    border:'1px solid rgba(67,125,253,0.3)',
  }}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 4L4 20h4l1.5-4h5l1.5 4h4L12 4z" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8"
        strokeLinejoin="round" fill="rgba(255,255,255,0.1)"/>
      <line x1="7.5" y1="14" x2="16.5" y2="14" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  </div>
);

const UserAvatar = () => (
  <div style={{
    width:'34px', height:'34px', borderRadius:'11px', flexShrink:0, marginTop:'1px',
    background:'rgba(67,125,253,0.08)',
    display:'flex', alignItems:'center', justifyContent:'center',
    boxShadow:'0 2px 8px rgba(67,125,253,0.1)',
    border:'1px solid rgba(67,125,253,0.15)',
  }}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="#437DFD" strokeWidth="1.8" fill="rgba(67,125,253,0.1)"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#437DFD" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    </svg>
  </div>
);

// ── Message bubbles ───────────────────────────────────────────────────────────

const MessageBubble = ({ msg, isMobile }) => {
  const isUser  = msg.role === 'user';
  const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
  return (
    <div style={{
      display:'flex', gap:'12px', padding: isMobile ? '12px 16px' : '14px 24px',
      alignItems:'flex-start',
      borderBottom:'1px solid rgba(67,125,253,0.05)',
      background: isUser ? 'transparent' : 'rgba(67,125,253,0.025)',
      animation:'ciFadeIn 0.25s ease-out',
    }}>
      {isUser ? <UserAvatar/> : <AirisAvatar/>}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:'11px', fontWeight:'700', marginBottom:'5px', letterSpacing:'0.06em', textTransform:'uppercase', color: isUser ? 'rgba(67,125,253,0.7)' : '#437DFD' }}>
          {isUser ? 'You' : 'Airis'}
        </div>
        <div style={{ fontSize: isMobile ? '14px' : '13px', color:'#333', lineHeight:'1.8', whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
          {content}
        </div>
      </div>
    </div>
  );
};

const Dot = ({ delay }) => (
  <div style={{ width:'7px', height:'7px', borderRadius:'50%', backgroundColor:'rgba(67,125,253,0.5)', animation:`ciPulse 1.2s ease-in-out ${delay}s infinite` }}/>
);
const TypingIndicator = ({ isMobile }) => (
  <div style={{ display:'flex', gap:'12px', padding: isMobile?'12px 16px':'14px 24px', alignItems:'center', background:'rgba(67,125,253,0.025)', borderBottom:'1px solid rgba(67,125,253,0.05)' }}>
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
  <div style={{ display:'flex', gap:'12px', padding: isMobile?'12px 16px':'14px 24px', alignItems:'center', background:'rgba(0,196,140,0.04)', borderBottom:'1px solid rgba(0,196,140,0.08)' }}>
    <div style={{ width:'34px', height:'34px', borderRadius:'11px', background:'rgba(0,196,140,0.1)', border:'1px solid rgba(0,196,140,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      <MicIcon active size={16}/>
    </div>
    <div>
      <div style={{ fontSize:'11px', color:'#00C48C', fontWeight:'700', marginBottom:'5px', letterSpacing:'0.06em', textTransform:'uppercase' }}>Listening</div>
      <div style={{ display:'flex', gap:'3px', alignItems:'flex-end', height:'16px' }}>
        {[1,.6,1,.4,.9,.5,1,.7].map((h,i) => <Bar key={i} h={h} delay={i*0.1} color="#00C48C"/>)}
      </div>
    </div>
  </div>
);

const SpeakingIndicator = ({ isMobile }) => (
  <div style={{ display:'flex', gap:'12px', padding: isMobile?'12px 16px':'14px 24px', alignItems:'center', background:'rgba(67,125,253,0.04)', borderBottom:'1px solid rgba(67,125,253,0.08)' }}>
    <AirisAvatar/>
    <div>
      <div style={{ fontSize:'11px', color:'#437DFD', fontWeight:'700', marginBottom:'5px', letterSpacing:'0.06em', textTransform:'uppercase' }}>Speaking</div>
      <div style={{ display:'flex', gap:'3px', alignItems:'flex-end', height:'16px' }}>
        {[.5,1,.7,1,.4,.9,.6,1].map((h,i) => <Bar key={i} h={h} delay={i*0.12} color="rgba(67,125,253,0.6)"/>)}
      </div>
    </div>
  </div>
);

// ── Main ──────────────────────────────────────────────────────────────────────

const ChatInterface = ({ messages, onSendMessage, isTyping, voiceState, onVoiceStateChange, isMobile }) => {
  const [input,          setInput]          = useState('');
  const [ttsEnabled,     setTtsEnabled]     = useState(true);
  const [speaking,       setSpeaking]       = useState(false);
  const [ttsConfig,      setTtsConfig]      = useState(null);
  const [attachedFiles,  setAttachedFiles]  = useState([]);
  const textareaRef    = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef   = useRef(null);

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

  const handleFileAttach = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const isImage = file.type.startsWith('image/');
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAttachedFiles(prev => [...prev, {
          id: Math.random().toString(36).slice(2),
          name: file.name,
          type: isImage ? 'image' : 'document',
          mime: file.type,
          content: isImage ? ev.target.result : ev.target.result,
          size: file.size,
        }]);
      };
      if (isImage) reader.readAsDataURL(file);
      else reader.readAsText(file);
    });
    e.target.value = '';
  };

  const removeAttachment = (id) => setAttachedFiles(prev => prev.filter(f => f.id !== id));

  const handleSend = () => {
    const text = input.trim();
    if (!text && attachedFiles.length === 0) return;
    let message = text;
    if (attachedFiles.length > 0) {
      const ctx = attachedFiles.map(f => {
        if (f.type === 'image') return `[Image attached: ${f.name}]`;
        const preview = typeof f.content === 'string' && f.content.length < 8000
          ? `\n\`\`\`\n${f.content.slice(0, 4000)}${f.content.length > 4000 ? '\n... (truncated)' : ''}\n\`\`\``
          : '';
        return `[File attached: ${f.name}]${preview}`;
      }).join('\n\n');
      message = text ? `${text}\n\n${ctx}` : ctx;
    }
    onSendMessage(message);
    setInput('');
    setAttachedFiles([]);
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
  const hasContent = (input.trim() || attachedFiles.length > 0) && !listening;
  const currentVoiceState = listening ? 'listening' : speaking ? 'speaking' : 'idle';

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0, background:'#fff' }}>

      {/* Tab bar */}
      <div style={{
        height: isMobile ? '48px' : '44px', background:'#fff',
        borderBottom:'1px solid rgba(0,0,0,0.08)',
        display:'flex', alignItems:'stretch', justifyContent:'space-between', flexShrink:0,
        boxShadow:'0 1px 0 rgba(67,125,253,0.05)',
      }}>
        <div style={{
          display:'flex', alignItems:'center', padding:'0 20px',
          borderBottom:'2px solid #437DFD',
          gap:'8px', fontSize:'13px', fontWeight:'700', color:'#437DFD', letterSpacing:'-0.01em',
        }}>
          <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'linear-gradient(135deg,#437DFD,#FD5B5D)', boxShadow:'0 0 6px rgba(67,125,253,0.6)' }}/>
          <span>chat</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', paddingRight:'16px', gap:'8px' }}>
          <button onClick={toggleTts}
            style={{
              display:'flex', alignItems:'center', gap:'6px',
              padding: isMobile ? '6px 10px' : '6px 14px', borderRadius:'99px',
              background: ttsEnabled ? 'rgba(67,125,253,0.08)' : 'transparent',
              border:`1px solid ${ttsEnabled ? 'rgba(67,125,253,0.2)' : 'rgba(0,0,0,0.08)'}`,
              color: ttsEnabled ? '#437DFD' : '#bbb',
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
      <div style={{ background:'#fff', borderTop:'1px solid rgba(0,0,0,0.08)', padding: isMobile?'10px 12px 12px':'12px 18px 14px', flexShrink:0 }}>

        {/* Attached file chips */}
        {attachedFiles.length > 0 && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginBottom:'8px' }}>
            {attachedFiles.map(f => (
              <div key={f.id} style={{
                display:'inline-flex', alignItems:'center', gap:'5px',
                padding:'4px 10px 4px 8px', borderRadius:'99px',
                background:'rgba(67,125,253,0.07)', border:'1px solid rgba(67,125,253,0.2)',
                fontSize:'11px', color:'#437DFD', fontWeight:'600',
                maxWidth:'180px',
              }}>
                {f.type === 'image' ? <FiImage size={11}/> : <FiFileText size={11}/>}
                <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.name}</span>
                <button onClick={() => removeAttachment(f.id)}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'#437DFD', padding:'0', lineHeight:0, opacity:0.6, flexShrink:0 }}>
                  <FiX size={11}/>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.txt,.md,.js,.jsx,.ts,.tsx,.py,.json,.csv,.html,.css,.pdf,.doc,.docx"
          multiple
          onChange={handleFileAttach}
          style={{ display:'none' }}
        />

        <div
          style={{
            display:'flex', gap:'8px', alignItems:'flex-end',
            background:'#F5F4F2', border:'1.5px solid rgba(67,125,253,0.2)',
            borderRadius:'16px', padding: isMobile?'10px 10px 10px 16px':'12px 10px 12px 16px',
            transition:'border-color 0.2s, box-shadow 0.2s',
            boxShadow:'0 2px 8px rgba(67,125,253,0.06)',
          }}
          onFocusCapture={e => { e.currentTarget.style.borderColor='#437DFD'; e.currentTarget.style.boxShadow='0 0 0 3px rgba(67,125,253,0.1), 0 2px 8px rgba(67,125,253,0.1)'; }}
          onBlurCapture={e  => { e.currentTarget.style.borderColor='rgba(67,125,253,0.2)'; e.currentTarget.style.boxShadow='0 2px 8px rgba(67,125,253,0.06)'; }}>
          <textarea ref={textareaRef} value={input}
            onChange={e => { setInput(e.target.value); autoResize(); }}
            onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey&&!isMobile){ e.preventDefault(); handleSend(); } }}
            placeholder={listening ? 'Listening...' : 'Ask me anything...'}
            rows={1} disabled={listening}
            style={{
              flex:1, minHeight:'22px', maxHeight: isMobile?'120px':'180px',
              background:'transparent', border:'none', outline:'none',
              color: listening ? 'rgba(67,125,253,0.7)' : '#0C0C0C',
              fontSize: isMobile?'15px':'14px', lineHeight:'1.65',
              resize:'none', fontFamily:'inherit',
            }}
          />
          <div style={{ display:'flex', gap:'5px', alignItems:'flex-end', paddingBottom:'1px' }}>
            {/* Paperclip */}
            <button onClick={() => fileInputRef.current?.click()}
              title="Attach file or image"
              style={{
                width:`${btnSize}px`, height:`${btnSize}px`,
                display:'flex', alignItems:'center', justifyContent:'center',
                borderRadius:'11px',
                background: attachedFiles.length ? 'rgba(67,125,253,0.1)' : 'transparent',
                border:`1.5px solid ${attachedFiles.length ? 'rgba(67,125,253,0.3)' : 'rgba(67,125,253,0.15)'}`,
                color: attachedFiles.length ? '#437DFD' : 'rgba(67,125,253,0.4)',
                cursor:'pointer', transition:'all 0.15s', flexShrink:0,
              }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(67,125,253,0.08)'; e.currentTarget.style.color='#437DFD'; }}
              onMouseLeave={e => { if(!attachedFiles.length){ e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(67,125,253,0.4)'; } }}>
              <FiPaperclip size={15}/>
            </button>
            {micSupported && (
              <button onClick={toggleMic}
                style={{
                  width:`${btnSize}px`, height:`${btnSize}px`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  borderRadius:'11px',
                  background: listening ? 'rgba(0,196,140,0.1)' : 'transparent',
                  border:`1.5px solid ${listening ? 'rgba(0,196,140,0.4)' : 'rgba(67,125,253,0.15)'}`,
                  color: listening ? '#00C48C' : 'rgba(67,125,253,0.4)',
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
                background: hasContent ? 'linear-gradient(135deg,#437DFD,#2C76FF)' : 'rgba(67,125,253,0.06)',
                color: hasContent ? '#fff' : 'rgba(67,125,253,0.3)',
                cursor: hasContent ? 'pointer' : 'not-allowed',
                border:'none', transition:'all 0.18s', flexShrink:0,
                boxShadow: hasContent ? '0 4px 14px rgba(67,125,253,0.4)' : 'none',
                transform: hasContent ? 'scale(1)' : 'scale(0.95)',
              }}
              onMouseEnter={e => { if(hasContent){ e.currentTarget.style.transform='scale(1.08)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(67,125,253,0.5)'; } }}
              onMouseLeave={e => { e.currentTarget.style.transform=hasContent?'scale(1)':'scale(0.95)'; e.currentTarget.style.boxShadow=hasContent?'0 4px 14px rgba(67,125,253,0.4)':'none'; }}>
              <SendIcon size={15}/>
            </button>
          </div>
        </div>
        {!isMobile && (
          <div style={{ marginTop:'8px', fontSize:'11px', color:'#ccc', textAlign:'center', letterSpacing:'0.01em' }}>
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
