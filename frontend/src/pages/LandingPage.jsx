import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';

const S = {
  grad: 'linear-gradient(135deg, #437DFD 0%, #2C76FF 50%, #FD5B5D 100%)',
  blue: '#437DFD',
  coral: '#FD5B5D',
  dark: '#0C0C0C',
  muted: '#777',
  card: { background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 16, backdropFilter: 'blur(12px)' },
};

function useWindowSize() {
  const [size, setSize] = useState({ w: typeof window !== 'undefined' ? window.innerWidth : 1200 });
  useEffect(() => {
    const h = () => setSize({ w: window.innerWidth });
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return size;
}

function Sect({ children, style = {}, pad }) {
  return (
    <section style={{ position: 'relative', zIndex: 1, maxWidth: 1140, margin: '0 auto', padding: `0 ${pad || 48}px`, ...style }}>
      {children}
    </section>
  );
}

function SectTitle({ pre, main, bold, sub, isMobile }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: isMobile ? 32 : 52 }}>
      {pre && <div style={{ display: 'inline-block', background: 'rgba(67,125,253,0.08)', border: '1px solid rgba(67,125,253,0.2)', borderRadius: 100, padding: '4px 14px', fontSize: 12, fontWeight: 600, color: S.blue, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 18 }}>{pre}</div>}
      <h2 style={{ fontSize: 'clamp(26px,4vw,46px)', fontWeight: 300, letterSpacing: '-0.03em', margin: '0 0 14px', lineHeight: 1.1 }}>
        {main}{bold && <><br /><span style={{ fontWeight: 600 }}>{bold}</span></>}
      </h2>
      {sub && <p style={{ fontSize: isMobile ? 14 : 16, color: S.muted, maxWidth: 460, margin: '0 auto', lineHeight: 1.6 }}>{sub}</p>}
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { w } = useWindowSize();
  const isMobile = w < 640;
  const isTablet = w >= 640 && w < 1024;
  const isDesktop = w >= 1024;
  const pad = isMobile ? 20 : isTablet ? 32 : 48;

  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { if (!isMobile) setMenuOpen(false); }, [isMobile]);

  const cols = (d, t, m) => `repeat(${isMobile ? m : isTablet ? t : d}, 1fr)`;

  const capabilities = [
    { icon: '💬', title: 'Smart Chat', desc: 'Context-aware conversations with memory across sessions. Understands nuance, tone, and follow-ups.' },
    { icon: '🎙️', title: 'Voice Cloning', desc: 'Clone any voice in 10 seconds. Custom TTS powered by Fish Audio with ultra-realistic output.' },
    { icon: '🌐', title: '120+ Languages', desc: 'Speak or type in any language. Full bilingual support including Telugu, Hindi, and more.' },
    { icon: '🧠', title: '12-Layer Brain', desc: 'Intent → Planning → Execution → Reflection → Learning. Deep reasoning architecture built-in.' },
    { icon: '🤖', title: 'Agentic Tasks', desc: 'Multi-step autonomous workflows. Airis plans, executes, and self-corrects without hand-holding.' },
    { icon: '📈', title: 'NIFTY 50 Trading', desc: 'Real-time Indian stock analysis. Technical indicators, NIFTY trend forecasting, portfolio tracking.' },
    { icon: '⏰', title: 'Smart Reminders', desc: 'Natural language reminders that understand context. "Remind me before my 3pm meeting tomorrow."' },
    { icon: '🗂️', title: 'Memory System', desc: 'Persistent memory across sessions. Airis learns your preferences, habits, and working style.' },
    { icon: '🔍', title: 'Web Research', desc: 'Search, summarize, and synthesize information from the web in real time.' },
    { icon: '💻', title: 'Vibe Coder', desc: 'Turn prompts into working code. Build components, scripts, and apps with conversational AI.' },
    { icon: '📊', title: 'Analytics Dashboard', desc: 'Track your AI usage, conversation stats, memory growth, and productivity insights.' },
    { icon: '🔒', title: 'Privacy First', desc: 'Your data stays yours. No training on your conversations. Local-first where possible.' },
  ];

  const brainLayers = [
    { n: '01', name: 'Intent Recognition', desc: 'Understands what you actually mean, not just what you said.' },
    { n: '02', name: 'Context Management', desc: 'Tracks conversation history and session state across interactions.' },
    { n: '03', name: 'Planning Engine', desc: 'Breaks complex goals into executable sub-tasks with dependencies.' },
    { n: '04', name: 'Tool Orchestration', desc: 'Selects and sequences the right tools for each step.' },
    { n: '05', name: 'Execution Layer', desc: 'Runs actions, calls APIs, writes code, and interacts with systems.' },
    { n: '06', name: 'Reflection Module', desc: 'Evaluates outputs and self-corrects before delivering results.' },
    { n: '07', name: 'Memory Consolidation', desc: 'Summarizes and stores important information for future recall.' },
    { n: '08', name: 'Learning Adapter', desc: 'Adapts tone, style, and approach based on your feedback over time.' },
    { n: '09', name: 'Multilingual Core', desc: 'Seamlessly switches between 120+ languages in mid-conversation.' },
    { n: '10', name: 'Voice Pipeline', desc: 'STT → NLU → LLM → TTS with under 200ms end-to-end latency.' },
    { n: '11', name: 'Trading Intelligence', desc: 'Market data ingestion, technical analysis, risk assessment.' },
    { n: '12', name: 'Autonomous Coordinator', desc: 'Orchestrates all 11 layers into coherent, goal-directed behavior.' },
  ];

  const aiModes = [
    { icon: '💬', label: 'Chat', color: '#437DFD', desc: 'Natural conversation with full context memory and follow-up awareness.' },
    { icon: '⚡', label: 'Command', color: '#2C76FF', desc: 'Direct task execution — open apps, run scripts, control your system.' },
    { icon: '🎯', label: 'Goal Planner', color: '#7B61FF', desc: 'Break big objectives into step-by-step plans and track progress.' },
    { icon: '📈', label: 'Trading', color: '#00C48C', desc: 'NIFTY 50 analysis, stock signals, portfolio intelligence.' },
    { icon: '📊', label: 'Analytics', color: '#FF8C42', desc: 'Usage trends, memory stats, conversation insights.' },
    { icon: '💻', label: 'Vibe Coder', color: '#FD5B5D', desc: 'Full-stack code generation from natural language prompts.' },
  ];

  const voiceFeatures = [
    { icon: '🎤', title: 'Real-Time STT', desc: 'Wake word activation ("Hey Airis"). Continuous voice listening with low-latency transcription.' },
    { icon: '🔊', title: 'Custom TTS', desc: 'Fish Audio integration with voice cloning. Choose from built-in voices or clone your own.' },
    { icon: '🌍', title: 'Bilingual Voice', desc: 'Speak in English, switch to Telugu mid-sentence. Airis follows without missing a beat.' },
    { icon: '🎵', title: 'Emotion Aware', desc: 'Adjusts speech pace, pitch, and tone based on context — calm for information, energetic for tasks.' },
  ];

  const pricing = [
    {
      plan: 'Free', price: '$0', period: '/month', cta: 'Get started',
      color: '#0C0C0C', features: ['50 AI messages/day', 'Basic voice assistant', '5 languages', 'Chat & reminders', '7-day memory', 'Community support'],
    },
    {
      plan: 'Pro', price: '$12', period: '/month', cta: 'Start free trial', badge: 'Most Popular',
      color: '#437DFD', features: ['Unlimited AI messages', 'Voice cloning (1 voice)', '120+ languages', 'All 6 AI modes', 'Unlimited memory', 'NIFTY trading module', 'Vibe Coder', 'Priority support'],
    },
    {
      plan: 'Enterprise', price: 'Custom', period: '', cta: 'Contact us',
      color: '#0C0C0C', features: ['Everything in Pro', 'Unlimited voice clones', 'Custom AI models', 'On-premise option', 'API access', 'SLA guarantee', 'Dedicated support', 'Team management'],
    },
  ];

  const faq = [
    { q: 'How does voice cloning work?', a: 'Upload a 10-second audio sample. Fish Audio processes it and Airis uses the cloned voice for all TTS responses. Takes under 30 seconds to set up.' },
    { q: 'Is my data private?', a: 'Yes. Conversations are processed in real-time and not used for training. Memory is stored locally. You own your data.' },
    { q: 'What AI models power Airis?', a: 'Groq (ultra-fast inference), Ollama (local models), with support for OpenAI, ElevenLabs, and Fish Audio for voice.' },
    { q: 'Can I use Airis offline?', a: 'Partially. With Ollama configured, the core AI runs locally. Voice and trading features require internet.' },
    { q: 'What is the 12-Layer Brain?', a: 'A proprietary architecture that chains intent recognition, planning, execution, reflection, and learning into one coherent system.' },
    { q: 'Does the NIFTY module give buy/sell signals?', a: 'Yes — technical analysis including RSI, MACD, support/resistance levels, and trend forecasting for NIFTY 50 stocks.' },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', -apple-system, sans-serif", background: '#F5F4F2', color: '#0C0C0C', overflowX: 'hidden' }}>

      {/* Ambient blobs */}
      <div style={{ position: 'fixed', top: -200, left: -150, width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(67,125,253,0.10) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: -100, right: -80, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(253,91,93,0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* ── NAV ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '12px 20px' : '16px 48px', background: 'rgba(245,244,242,0.88)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/airis-sphere.png" alt="Airis" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }} />
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>Airis</span>
        </div>

        {/* Desktop nav links */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 100, padding: '5px 6px' }}>
            {['Features', 'Brain', 'Voice', 'Trading', 'Pricing'].map(l => (
              <button key={l} style={{ fontSize: 13, fontWeight: 500, color: '#555', padding: '6px 15px', borderRadius: 100, border: 'none', background: 'transparent', cursor: 'pointer' }}>{l}</button>
            ))}
            <button onClick={() => navigate('/download')} style={{ fontSize: 13, fontWeight: 600, color: S.blue, padding: '6px 15px', borderRadius: 100, border: 'none', background: 'rgba(67,125,253,0.08)', cursor: 'pointer' }}>Download</button>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!isMobile && (
            <>
              <button onClick={() => navigate('/login')} style={{ fontSize: 13, fontWeight: 500, color: '#444', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px 14px' }}>Sign in</button>
              <button onClick={() => navigate('/login?signup=1')} style={{ fontSize: 13, fontWeight: 600, color: '#fff', background: S.blue, border: 'none', cursor: 'pointer', padding: '9px 22px', borderRadius: 100, boxShadow: '0 4px 14px rgba(67,125,253,0.35)' }}>Get started free</button>
            </>
          )}
          {isMobile && (
            <>
              <button onClick={() => navigate('/login?signup=1')} style={{ fontSize: 12, fontWeight: 600, color: '#fff', background: S.blue, border: 'none', cursor: 'pointer', padding: '8px 16px', borderRadius: 100 }}>Try free</button>
              <button onClick={() => setMenuOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 20, height: 1.5, background: '#333', borderRadius: 2, transition: 'all 0.2s', transform: menuOpen ? 'rotate(45deg) translate(2px, 4px)' : 'none' }} />
                <div style={{ width: 20, height: 1.5, background: '#333', borderRadius: 2, transition: 'all 0.2s', opacity: menuOpen ? 0 : 1 }} />
                <div style={{ width: 20, height: 1.5, background: '#333', borderRadius: 2, transition: 'all 0.2s', transform: menuOpen ? 'rotate(-45deg) translate(2px, -4px)' : 'none' }} />
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Mobile menu */}
      {isMobile && menuOpen && (
        <div style={{ position: 'fixed', top: 57, left: 0, right: 0, zIndex: 190, background: 'rgba(245,244,242,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.08)', padding: '12px 20px 20px' }}>
          {['Features', 'Brain', 'Voice', 'Trading', 'Pricing'].map(l => (
            <button key={l} onClick={() => setMenuOpen(false)} style={{ display: 'block', width: '100%', textAlign: 'left', fontSize: 15, fontWeight: 500, color: '#333', padding: '12px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', border: 'none', background: 'transparent', cursor: 'pointer' }}>{l}</button>
          ))}
          <button onClick={() => { setMenuOpen(false); navigate('/download'); }} style={{ display: 'block', width: '100%', textAlign: 'left', fontSize: 15, fontWeight: 600, color: S.blue, padding: '12px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', border: 'none', background: 'transparent', cursor: 'pointer' }}>📲 Download App</button>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button onClick={() => navigate('/login')} style={{ flex: 1, fontSize: 14, fontWeight: 500, color: '#444', background: 'rgba(0,0,0,0.05)', border: 'none', cursor: 'pointer', padding: '11px', borderRadius: 12 }}>Sign in</button>
            <button onClick={() => navigate('/login?signup=1')} style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#fff', background: S.blue, border: 'none', cursor: 'pointer', padding: '11px', borderRadius: 12 }}>Get started free</button>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <section style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: isMobile ? '60px 20px 0' : '90px 40px 0' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(67,125,253,0.28)', borderRadius: 100, padding: '5px 16px 5px 10px', fontSize: 12.5, fontWeight: 600, color: S.blue, marginBottom: 28 }}>
          <span style={{ width: 6, height: 6, background: S.blue, borderRadius: '50%', display: 'inline-block', animation: 'lpulse 2s infinite' }} />
          Now with real-time voice cloning · 12-Layer AI Brain
        </div>
        <h1 style={{ fontSize: 'clamp(38px, 8vw, 92px)', fontWeight: 300, letterSpacing: '-0.045em', lineHeight: 0.95, margin: '0 0 22px' }}>
          Meet{' '}
          <span style={{ background: S.grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontWeight: 600 }}>
            The Airis
          </span>
        </h1>
        <p style={{ fontSize: isMobile ? 16 : 19, fontWeight: 400, color: '#5a5a5a', lineHeight: 1.6, maxWidth: 540, margin: '0 auto 36px' }}>
          An Iron Man–style AI assistant with a 12-layer brain, voice cloning, stock trading intelligence, and autonomous task execution — all in one.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 50, flexWrap: 'wrap', padding: '0 16px' }}>
          <button onClick={() => navigate('/login?signup=1')} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: isMobile ? 14 : 15, fontWeight: 600, color: '#fff', background: S.dark, border: 'none', cursor: 'pointer', padding: isMobile ? '13px 26px' : '15px 34px', borderRadius: 100 }}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="6.5" fill="rgba(255,255,255,0.2)"/><path d="M6 4.5l4.5 3L6 10.5V4.5z" fill="white"/></svg>
            Try Airis free
          </button>
          <button style={{ fontSize: isMobile ? 14 : 15, fontWeight: 500, color: S.dark, background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(0,0,0,0.13)', cursor: 'pointer', padding: isMobile ? '13px 26px' : '15px 34px', borderRadius: 100 }}>
            Watch demo
          </button>
        </div>
        {/* Floating orb */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
          <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 360, height: 80, background: 'radial-gradient(ellipse, rgba(67,125,253,0.24) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(12px)' }} />
          <img src="/airis-sphere.png" alt="Airis" style={{ width: isMobile ? 160 : 220, height: isMobile ? 160 : 220, objectFit: 'contain', position: 'relative', zIndex: 2, filter: 'drop-shadow(0 24px 48px rgba(67,125,253,0.30))', animation: 'lfloat 4s ease-in-out infinite' }} />
        </div>
      </section>

      {/* ── STATS ── */}
      <div style={{ position: 'relative', zIndex: 1, margin: isMobile ? '32px 20px 0' : '48px 48px 0', borderRadius: 20, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(6, 1fr)' }}>
          {[['50k+','Active Users'],['120+','Languages'],['<200ms','Latency'],['99.9%','Uptime'],['29+','Capabilities'],['12','AI Layers']].map(([n, l], i, arr) => (
            <div key={l} style={{ textAlign: 'center', padding: isMobile ? '18px 10px' : '28px 20px', borderRight: (isMobile ? i % 3 !== 2 : i < 5) ? '1px solid rgba(0,0,0,0.07)' : 'none', borderBottom: isMobile && i < 3 ? '1px solid rgba(0,0,0,0.07)' : 'none' }}>
              <div style={{ fontSize: isMobile ? 20 : 26, fontWeight: 700, letterSpacing: '-0.03em', color: S.dark }}>{n}</div>
              <div style={{ fontSize: isMobile ? 10 : 12, color: '#aaa', marginTop: 3, fontWeight: 500 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CAPABILITIES GRID ── */}
      <div style={{ marginTop: isMobile ? 60 : 100 }}>
        <Sect pad={pad}>
          <SectTitle pre="Capabilities" main="Everything you need," bold="nothing you don't." sub="29+ built-in capabilities spanning voice, intelligence, trading, and automation." isMobile={isMobile} />
          <div style={{ display: 'grid', gridTemplateColumns: cols(3, 2, 1), gap: 12 }}>
            {capabilities.map(c => (
              <div key={c.title} style={{ ...S.card, padding: '22px 20px' }}>
                <div style={{ fontSize: 24, marginBottom: 10 }}>{c.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 6, color: S.dark }}>{c.title}</div>
                <div style={{ fontSize: 13, color: '#6a6a6a', lineHeight: 1.6 }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </Sect>
      </div>

      {/* ── AI MODES ── */}
      <div style={{ marginTop: isMobile ? 60 : 100 }}>
        <Sect pad={pad}>
          <SectTitle pre="AI Modes" main="Six modes," bold="one assistant." sub="Switch between modes seamlessly — Airis adapts its entire behavior to what you need right now." isMobile={isMobile} />
          <div style={{ display: 'grid', gridTemplateColumns: cols(3, 2, 1), gap: 12 }}>
            {aiModes.map(m => (
              <div key={m.label} style={{ ...S.card, padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{m.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: S.dark }}>{m.label}</div>
                <div style={{ fontSize: 13, color: '#6a6a6a', lineHeight: 1.6 }}>{m.desc}</div>
              </div>
            ))}
          </div>
        </Sect>
      </div>

      {/* ── 12-LAYER BRAIN ── */}
      <div style={{ marginTop: isMobile ? 60 : 100, background: 'linear-gradient(180deg, transparent 0%, rgba(67,125,253,0.04) 50%, transparent 100%)', padding: `${isMobile ? 48 : 80}px 0` }}>
        <Sect pad={pad}>
          <SectTitle pre="12-Layer Brain" main="Reasoning architecture" bold="built for depth." sub="Every response flows through 12 specialized layers — from raw intent to autonomous execution to self-improvement." isMobile={isMobile} />
          <div style={{ display: 'grid', gridTemplateColumns: cols(2, 2, 1), gap: 10 }}>
            {brainLayers.map(l => (
              <div key={l.n} style={{ ...S.card, padding: '18px 20px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: S.blue, fontFamily: 'monospace', letterSpacing: '0.05em', minWidth: 22, paddingTop: 2 }}>{l.n}</div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: S.dark, marginBottom: 4 }}>{l.name}</div>
                  <div style={{ fontSize: 12.5, color: '#6a6a6a', lineHeight: 1.55 }}>{l.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Sect>
      </div>

      {/* ── VOICE SECTION ── */}
      <div style={{ marginTop: isMobile ? 60 : 100 }}>
        <Sect pad={pad}>
          <div style={{ display: 'grid', gridTemplateColumns: cols(2, 2, 1), gap: isMobile ? 28 : 60, alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-block', background: 'rgba(67,125,253,0.08)', border: '1px solid rgba(67,125,253,0.2)', borderRadius: 100, padding: '4px 14px', fontSize: 12, fontWeight: 600, color: S.blue, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 20 }}>Voice & Speech</div>
              <h2 style={{ fontSize: 'clamp(26px,4vw,44px)', fontWeight: 300, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 16 }}>
                Your voice.<br /><span style={{ fontWeight: 600 }}>Your assistant.</span>
              </h2>
              <p style={{ fontSize: 15, color: '#5a5a5a', lineHeight: 1.7, marginBottom: 28 }}>
                Airis listens for your wake word, understands 120+ languages, and responds in a cloned voice that sounds exactly like you. Set up in under 60 seconds.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {voiceFeatures.map(v => (
                  <div key={v.title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(67,125,253,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{v.icon}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: S.dark, marginBottom: 3 }}>{v.title}</div>
                      <div style={{ fontSize: 13, color: '#6a6a6a', lineHeight: 1.55 }}>{v.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #0C0C0C 0%, #1a1a2e 100%)', borderRadius: 24, padding: isMobile ? 20 : 32, position: 'relative', overflow: 'hidden', minHeight: isMobile ? 260 : 340 }}>
              <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(67,125,253,0.3) 0%, transparent 70%)' }} />
              <div style={{ position: 'absolute', bottom: -30, left: -30, width: 150, height: 150, borderRadius: '50%', background: 'radial-gradient(circle, rgba(253,91,93,0.25) 0%, transparent 70%)' }} />
              <div style={{ position: 'relative', zIndex: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <img src="/airis-sphere.png" alt="Airis" style={{ width: 36, height: 36, objectFit: 'contain', filter: 'drop-shadow(0 0 12px rgba(67,125,253,0.5))' }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Airis Voice</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Listening…</div>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                    {[1,2,3,4,5].map(b => <div key={b} style={{ width: 3, borderRadius: 2, background: S.blue, height: `${[12,20,16,24,14][b-1]}px`, animation: `lbar${b} 0.8s ease-in-out infinite`, animationDelay: `${b*0.1}s` }} />)}
                  </div>
                </div>
                {[
                  { from: 'You', text: 'Hey Airis, what\'s the NIFTY trend today?', bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)' },
                  { from: 'Airis', text: 'NIFTY is up 0.8% at 22,410. RSI at 58 — momentum bullish. Key resistance at 22,500. Want me to pull sector breakdowns?', bg: S.blue, color: '#fff' },
                  { from: 'You', text: 'Yes, and set a price alert at 22,500.', bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)' },
                ].map((msg, i) => (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 4, fontWeight: 600, letterSpacing: '0.04em' }}>{msg.from.toUpperCase()}</div>
                    <div style={{ background: msg.bg, borderRadius: 12, padding: '10px 12px', fontSize: isMobile ? 12 : 13, color: msg.color, lineHeight: 1.5 }}>{msg.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Sect>
      </div>

      {/* ── TRADING ── */}
      <div style={{ marginTop: isMobile ? 60 : 100, background: 'linear-gradient(180deg, transparent 0%, rgba(0,196,140,0.04) 50%, transparent 100%)', padding: `${isMobile ? 48 : 80}px 0` }}>
        <Sect pad={pad}>
          <div style={{ display: 'grid', gridTemplateColumns: cols(2, 2, 1), gap: isMobile ? 28 : 60, alignItems: 'center' }}>
            {/* On mobile, show text first, then card */}
            {isMobile && (
              <div>
                <div style={{ display: 'inline-block', background: 'rgba(0,196,140,0.08)', border: '1px solid rgba(0,196,140,0.2)', borderRadius: 100, padding: '4px 14px', fontSize: 12, fontWeight: 600, color: '#00C48C', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 18 }}>Trading Intelligence</div>
                <h2 style={{ fontSize: 'clamp(26px,4vw,44px)', fontWeight: 300, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 14 }}>
                  NIFTY 50 analysis,<br /><span style={{ fontWeight: 600 }}>right in your assistant.</span>
                </h2>
                <p style={{ fontSize: 14, color: '#5a5a5a', lineHeight: 1.7, marginBottom: 20 }}>
                  Airis combines real-time market data with AI reasoning to deliver technical analysis, trend forecasts, and trade signals — all via natural language.
                </p>
              </div>
            )}
            <div style={{ background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 24, padding: isMobile ? 20 : 28, backdropFilter: 'blur(12px)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#00C48C', letterSpacing: '0.06em', marginBottom: 14 }}>NIFTY 50 · LIVE</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: isMobile ? 28 : 36, fontWeight: 700, letterSpacing: '-0.03em', color: S.dark }}>22,410</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#00C48C' }}>+0.82%</span>
              </div>
              <div style={{ fontSize: 13, color: '#aaa', marginBottom: 20 }}>Updated 2 seconds ago</div>
              {[['RSI (14)', '58.4', '#437DFD'],['MACD Signal', 'Bullish ↑', '#00C48C'],['Resistance', '22,500', '#FF8C42'],['Support', '22,200', '#7B61FF'],['Volume', '1.2B shares', '#aaa']].map(([k,v,c]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <span style={{ fontSize: 13, color: '#777' }}>{k}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: c || S.dark }}>{v}</span>
                </div>
              ))}
              <button onClick={() => navigate('/trading')} style={{ width: '100%', marginTop: 18, padding: '12px', fontSize: 13, fontWeight: 600, color: '#fff', background: '#00C48C', border: 'none', borderRadius: 12, cursor: 'pointer' }}>Open Trading Dashboard →</button>
            </div>
            {!isMobile && (
              <div>
                <div style={{ display: 'inline-block', background: 'rgba(0,196,140,0.08)', border: '1px solid rgba(0,196,140,0.2)', borderRadius: 100, padding: '4px 14px', fontSize: 12, fontWeight: 600, color: '#00C48C', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 22 }}>Trading Intelligence</div>
                <h2 style={{ fontSize: 'clamp(26px,4vw,44px)', fontWeight: 300, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 18 }}>
                  NIFTY 50 analysis,<br /><span style={{ fontWeight: 600 }}>right in your assistant.</span>
                </h2>
                <p style={{ fontSize: 15.5, color: '#5a5a5a', lineHeight: 1.7, marginBottom: 28 }}>
                  Airis combines real-time market data with AI reasoning to deliver technical analysis, trend forecasts, and trade signals — all via natural language.
                </p>
                {['Real-time NIFTY 50 & sector data', 'RSI, MACD, Bollinger Band signals', 'Portfolio tracking & P&L overview', 'Price alerts via voice or notification', 'Indian market calendar & events', 'Watchlist with smart notifications'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,196,140,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2.5 2.5L8 3" stroke="#00C48C" strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg>
                    </div>
                    <span style={{ fontSize: 13.5, color: '#444' }}>{f}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Sect>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div style={{ marginTop: isMobile ? 60 : 100 }}>
        <Sect pad={pad}>
          <SectTitle pre="How It Works" main="From first word" bold="to finished task." sub="Airis turns a single spoken or typed request into a fully executed outcome — in seconds." isMobile={isMobile} />
          <div style={{ display: 'grid', gridTemplateColumns: cols(4, 2, 2), gap: 12, position: 'relative' }}>
            {!isMobile && <div style={{ position: 'absolute', top: 30, left: '12%', right: '12%', height: 1, background: 'linear-gradient(90deg, rgba(67,125,253,0.3), rgba(253,91,93,0.3))', zIndex: 0 }} />}
            {[
              { n: '1', icon: '🎙️', step: 'Speak or Type', desc: 'Use your voice ("Hey Airis") or type. Any language. Any topic.' },
              { n: '2', icon: '🧠', step: 'Brain Processes', desc: '12 layers analyze intent, plan sub-tasks, and select the right tools.' },
              { n: '3', icon: '⚡', step: 'Execute & Act', desc: 'Airis runs tasks autonomously — searches, codes, trades, schedules.' },
              { n: '4', icon: '🔊', step: 'Respond & Learn', desc: 'Answers in your cloned voice, stores memory, improves over time.' },
            ].map(s => (
              <div key={s.n} style={{ ...S.card, padding: '24px 16px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #437DFD, #2C76FF)', color: '#fff', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>{s.n}</div>
                <div style={{ fontSize: 20, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: S.dark, marginBottom: 7 }}>{s.step}</div>
                <div style={{ fontSize: 12.5, color: '#777', lineHeight: 1.55 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </Sect>
      </div>

      {/* ── SIDEBAR PANELS ── */}
      <div style={{ marginTop: isMobile ? 60 : 100, background: 'linear-gradient(180deg, transparent 0%, rgba(67,125,253,0.04) 50%, transparent 100%)', padding: `${isMobile ? 48 : 80}px 0` }}>
        <Sect pad={pad}>
          <SectTitle pre="Dashboard" main="Seven powerful panels," bold="one clean interface." sub="Every panel gives you deep insight and control — accessible from a single sidebar click." isMobile={isMobile} />
          <div style={{ display: 'grid', gridTemplateColumns: cols(4, 2, 2), gap: 10 }}>
            {[
              { icon: '💬', name: 'Chat History', desc: 'Full searchable log of all conversations with AI, timestamped and filterable.' },
              { icon: '🧠', name: 'Memory', desc: 'Airis\'s long-term knowledge about you — editable, exportable, always private.' },
              { icon: '📈', name: 'Trading', desc: 'NIFTY 50 dashboard, watchlists, signals, portfolio, and market calendar.' },
              { icon: '⏰', name: 'Reminders', desc: 'Smart reminders set by voice or text, with context-aware follow-ups.' },
              { icon: '🔧', name: 'Skills', desc: '29+ built-in capabilities — toggle, configure, or add your own.' },
              { icon: '📊', name: 'Analytics', desc: 'Your usage trends, top topics, memory growth, and response quality.' },
              { icon: '🧬', name: '12-Layer Brain', desc: 'Live visualization of which AI layers are active for each request.' },
              { icon: '⚙️', name: 'Settings', desc: '9-tab settings: AI engine, voice, language, API keys, wake word, and more.' },
            ].map(p => (
              <div key={p.name} style={{ ...S.card, padding: '20px 16px' }}>
                <div style={{ fontSize: 22, marginBottom: 9 }}>{p.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: S.dark, marginBottom: 5 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: '#777', lineHeight: 1.55 }}>{p.desc}</div>
              </div>
            ))}
          </div>
        </Sect>
      </div>

      {/* ── PRICING ── */}
      <div style={{ marginTop: isMobile ? 60 : 100 }}>
        <Sect pad={pad}>
          <SectTitle pre="Pricing" main="Simple, transparent" bold="pricing." sub="Start free. Upgrade when you're ready. Cancel anytime." isMobile={isMobile} />
          <div style={{ display: 'grid', gridTemplateColumns: cols(3, 1, 1), gap: 14, alignItems: 'start' }}>
            {pricing.map((p, i) => (
              <div key={p.plan} style={{ ...S.card, padding: '28px 24px', position: 'relative', ...(i === 1 ? { border: `2px solid ${S.blue}`, boxShadow: '0 8px 40px rgba(67,125,253,0.16)' } : {}) }}>
                {p.badge && <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: S.blue, color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 100, whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>{p.badge}</div>}
                <div style={{ fontSize: 13, fontWeight: 700, color: '#aaa', letterSpacing: '0.06em', marginBottom: 12, textTransform: 'uppercase' }}>{p.plan}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                  <span style={{ fontSize: 38, fontWeight: 700, letterSpacing: '-0.04em', color: S.dark }}>{p.price}</span>
                  <span style={{ fontSize: 14, color: '#aaa' }}>{p.period}</span>
                </div>
                <button onClick={() => navigate('/login?signup=1')} style={{ width: '100%', margin: '16px 0 20px', padding: '12px', fontSize: 14, fontWeight: 600, color: i === 1 ? '#fff' : S.dark, background: i === 1 ? S.blue : 'rgba(0,0,0,0.06)', border: 'none', borderRadius: 12, cursor: 'pointer' }}>{p.cta}</button>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {p.features.map(f => (
                    <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="8" fill={i === 1 ? 'rgba(67,125,253,0.12)' : 'rgba(0,0,0,0.05)'}/><path d="M5 8l2 2 4-4" stroke={i === 1 ? S.blue : '#666'} strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg>
                      <span style={{ fontSize: 13, color: '#555' }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Sect>
      </div>

      {/* ── FAQ ── */}
      <div style={{ marginTop: isMobile ? 60 : 100 }}>
        <Sect pad={pad}>
          <SectTitle pre="FAQ" main="Common questions," bold="clear answers." isMobile={isMobile} />
          <div style={{ display: 'grid', gridTemplateColumns: cols(2, 2, 1), gap: 12 }}>
            {faq.map(f => (
              <div key={f.q} style={{ ...S.card, padding: '22px 20px' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: S.dark, marginBottom: 8 }}>{f.q}</div>
                <div style={{ fontSize: 13, color: '#666', lineHeight: 1.65 }}>{f.a}</div>
              </div>
            ))}
          </div>
        </Sect>
      </div>

      {/* ── CTA ── */}
      <div style={{ marginTop: isMobile ? 60 : 100 }}>
        <Sect pad={pad} style={{ marginBottom: isMobile ? 60 : 100 }}>
          <div style={{ background: 'linear-gradient(135deg, #0C0C0C 0%, #0f0f23 100%)', borderRadius: 24, padding: isMobile ? '48px 24px' : '72px 56px', textAlign: 'center', overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(67,125,253,0.28) 0%, transparent 70%)' }} />
            <div style={{ position: 'absolute', bottom: -60, left: -60, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(253,91,93,0.22) 0%, transparent 70%)' }} />
            <img src="/airis-sphere.png" alt="Airis" style={{ width: isMobile ? 70 : 90, height: isMobile ? 70 : 90, objectFit: 'contain', marginBottom: 24, filter: 'drop-shadow(0 0 24px rgba(67,125,253,0.6))', position: 'relative', zIndex: 2, animation: 'lfloat 4s ease-in-out infinite' }} />
            <h2 style={{ fontSize: 'clamp(28px,5vw,54px)', fontWeight: 300, letterSpacing: '-0.03em', color: '#fff', margin: '0 0 16px', position: 'relative', zIndex: 2, lineHeight: 1.1 }}>
              Ready to meet<br /><span style={{ fontWeight: 600 }}>your Airis?</span>
            </h2>
            <p style={{ fontSize: isMobile ? 14 : 16, color: 'rgba(255,255,255,0.55)', marginBottom: 36, maxWidth: 440, margin: '0 auto 36px', position: 'relative', zIndex: 2, lineHeight: 1.6 }}>
              Join 50,000+ users already working with the most capable personal AI assistant ever built.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', position: 'relative', zIndex: 2, flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/login?signup=1')} style={{ fontSize: isMobile ? 14 : 15, fontWeight: 600, color: S.dark, background: '#fff', border: 'none', cursor: 'pointer', padding: isMobile ? '13px 28px' : '15px 38px', borderRadius: 100 }}>Start for free →</button>
              <button onClick={() => navigate('/login')} style={{ fontSize: isMobile ? 14 : 15, fontWeight: 500, color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', padding: isMobile ? '13px 22px' : '15px 28px', borderRadius: 100 }}>Sign in</button>
            </div>
          </div>
        </Sect>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(0,0,0,0.07)', padding: isMobile ? '36px 20px' : '40px 48px' }}>
        <div style={{ display: isMobile ? 'block' : 'flex', justifyContent: 'space-between', alignItems: 'flex-start', maxWidth: 1140, margin: '0 auto', gap: 40 }}>
          <div style={{ marginBottom: isMobile ? 28 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <img src="/airis-sphere.png" alt="Airis" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
              <span style={{ fontSize: 15, fontWeight: 700 }}>Airis</span>
            </div>
            <p style={{ fontSize: 13, color: '#aaa', maxWidth: 220, lineHeight: 1.6 }}>The most capable personal AI assistant. Built for humans who think big.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, auto)', gap: isMobile ? '24px 20px' : '0 40px' }}>
            {[
              { head: 'Product', links: ['Features', 'Pricing', 'Download', 'Roadmap'] },
              { head: 'Capabilities', links: ['Voice Cloning', 'NIFTY Trading', '12-Layer Brain', 'Vibe Coder'] },
              { head: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
              { head: 'Legal', links: ['Privacy', 'Terms', 'Security', 'Cookies'] },
            ].map(col => (
              <div key={col.head}>
                <div style={{ fontSize: 12, fontWeight: 700, color: S.dark, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>{col.head}</div>
                {col.links.map(l => <div key={l} style={{ fontSize: 13, color: '#888', marginBottom: 8, cursor: 'pointer' }}>{l}</div>)}
              </div>
            ))}
          </div>
        </div>
        <div style={{ maxWidth: 1140, margin: '28px auto 0', paddingTop: 20, borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: isMobile ? 'center' : 'space-between', alignItems: 'center', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 8 : 0 }}>
          <span style={{ fontSize: 12, color: '#bbb' }}>© 2026 Airis AI. All rights reserved.</span>
          <span style={{ fontSize: 12, color: '#bbb' }}>Built with ❤️ for the future of work</span>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        @keyframes lfloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @keyframes lpulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.75)} }
        @keyframes lbar1 { 0%,100%{height:8px} 50%{height:18px} }
        @keyframes lbar2 { 0%,100%{height:14px} 50%{height:24px} }
        @keyframes lbar3 { 0%,100%{height:10px} 50%{height:20px} }
        @keyframes lbar4 { 0%,100%{height:18px} 50%{height:28px} }
        @keyframes lbar5 { 0%,100%{height:12px} 50%{height:16px} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>
    </div>
  );
}
