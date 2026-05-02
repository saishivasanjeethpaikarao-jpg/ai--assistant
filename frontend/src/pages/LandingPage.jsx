import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const navigate     = useNavigate();
  const { user }     = useAuth();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (user) navigate('/app');
  }, [user]);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 3000);
    return () => clearInterval(id);
  }, []);

  const features = [
    { icon: '🎙️', title: 'Voice Cloning',   desc: 'Clone any voice with a 10-second sample.' },
    { icon: '🌐', title: '120+ Languages',   desc: 'Speak naturally in any language.' },
    { icon: '⚡', title: '<200ms Response',  desc: 'Real-time AI with near-zero latency.' },
    { icon: '🔒', title: 'Private by Design', desc: 'Your conversations stay yours.' },
    { icon: '🧠', title: 'Memory',           desc: 'Airis remembers your preferences.' },
    { icon: '🤖', title: 'Agentic Tasks',    desc: 'Let Airis handle complex workflows.' },
  ];

  const testimonials = [
    { name: 'Sarah K.',  role: 'Product Designer', text: "It's like having a genius assistant on call 24/7." },
    { name: 'Marcus T.', role: 'Software Engineer', text: 'The voice cloning is uncanny. Absolutely wild tech.' },
    { name: 'Priya M.',  role: 'Startup Founder',  text: 'Airis handles my emails, meetings, and research daily.' },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', -apple-system, sans-serif", background: '#F5F4F2', minHeight: '100vh', color: '#0C0C0C' }}>

      {/* Ambient blobs */}
      <div style={{ position: 'fixed', top: -200, left: -150, width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(67,125,253,0.10) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: -100, right: -80, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(253,91,93,0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 48px', background: 'rgba(245,244,242,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/airis-sphere.png" alt="Airis" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }} />
          <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.02em' }}>Airis</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 100, padding: '6px 8px', backdropFilter: 'blur(12px)' }}>
          {['Features', 'Voices', 'Pricing', 'Docs'].map(l => (
            <button key={l} style={{ fontSize: 13, fontWeight: 500, color: '#555', padding: '6px 16px', borderRadius: 100, border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}>{l}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('/login')} style={{ fontSize: 13, fontWeight: 500, color: '#444', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px 14px', fontFamily: 'inherit' }}>Sign in</button>
          <button onClick={() => navigate('/login?signup=1')} style={{ fontSize: 13, fontWeight: 500, color: '#fff', background: '#437DFD', border: 'none', cursor: 'pointer', padding: '9px 22px', borderRadius: 100, fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(67,125,253,0.35)', transition: 'opacity 0.15s' }}>Get started free</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '80px 40px 0' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(67,125,253,0.25)', borderRadius: 100, padding: '5px 16px 5px 10px', fontSize: 12.5, fontWeight: 500, color: '#437DFD', marginBottom: 32, backdropFilter: 'blur(8px)' }}>
          <span style={{ width: 6, height: 6, background: '#437DFD', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          Now with real-time voice cloning
        </div>

        <h1 style={{ fontSize: 'clamp(52px, 8vw, 88px)', fontWeight: 300, letterSpacing: '-0.04em', lineHeight: 1.0, margin: '0 0 20px', color: '#0C0C0C' }}>
          Meet{' '}
          <span style={{ background: 'linear-gradient(135deg, #437DFD 0%, #2C76FF 50%, #FD5B5D 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontWeight: 500 }}>
            The Airis
          </span>
        </h1>
        <p style={{ fontSize: 18, fontWeight: 400, color: '#666', letterSpacing: '-0.01em', lineHeight: 1.6, maxWidth: 480, margin: '0 auto 40px' }}>
          An AI assistant that hears you, understands you, and responds in a voice that feels like yours.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 64 }}>
          <button onClick={() => navigate('/login?signup=1')} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 500, color: '#fff', background: '#0C0C0C', border: 'none', cursor: 'pointer', padding: '14px 32px', borderRadius: 100, fontFamily: 'inherit', transition: 'opacity 0.15s' }}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="6.5" fill="rgba(255,255,255,0.2)"/><path d="M6 4.5l4.5 3L6 10.5V4.5z" fill="white"/></svg>
            Try Airis now
          </button>
          <button style={{ fontSize: 15, fontWeight: 500, color: '#0C0C0C', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.12)', cursor: 'pointer', padding: '14px 32px', borderRadius: 100, fontFamily: 'inherit', backdropFilter: 'blur(8px)' }}>
            Watch demo
          </button>
        </div>

        {/* Orb */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div style={{ position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)', width: 320, height: 70, background: 'radial-gradient(ellipse, rgba(67,125,253,0.22) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(10px)' }} />
          <img
            src="/airis-sphere.png"
            alt="Airis"
            style={{
              width: 200, height: 200,
              objectFit: 'contain',
              position: 'relative', zIndex: 2,
              filter: 'drop-shadow(0 20px 40px rgba(67,125,253,0.28)) drop-shadow(0 0 60px rgba(44,118,255,0.15))',
              animation: 'float 4s ease-in-out infinite',
            }}
          />
        </div>
      </section>

      {/* Stats */}
      <section style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center', gap: 60, padding: '48px 40px', borderTop: '1px solid rgba(0,0,0,0.06)', borderBottom: '1px solid rgba(0,0,0,0.06)', margin: '0 48px' }}>
        {[['50k+', 'Active users'], ['120+', 'Languages'], ['<200ms', 'Response time'], ['99.9%', 'Uptime']].map(([n, l]) => (
          <div key={l} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.03em', color: '#0C0C0C' }}>{n}</div>
            <div style={{ fontSize: 12.5, color: '#999', marginTop: 3 }}>{l}</div>
          </div>
        ))}
      </section>

      {/* Features */}
      <section style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '80px auto', padding: '0 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <h2 style={{ fontSize: 42, fontWeight: 300, letterSpacing: '-0.03em', margin: '0 0 14px' }}>Everything you need,<br /><span style={{ fontWeight: 500 }}>nothing you don't.</span></h2>
          <p style={{ fontSize: 16, color: '#777', maxWidth: 420, margin: '0 auto' }}>Airis is designed to disappear into your workflow — fast, quiet, capable.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {features.map(f => (
            <div key={f.title} style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 16, padding: '28px 24px', backdropFilter: 'blur(12px)', transition: 'box-shadow 0.2s' }}>
              <div style={{ fontSize: 28, marginBottom: 14 }}>{f.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 6, color: '#0C0C0C' }}>{f.title}</div>
              <div style={{ fontSize: 13.5, color: '#777', lineHeight: 1.55 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto 80px', padding: '0 48px' }}>
        <h2 style={{ fontSize: 42, fontWeight: 300, letterSpacing: '-0.03em', textAlign: 'center', marginBottom: 44 }}>Loved by <span style={{ fontWeight: 500 }}>early adopters</span></h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {testimonials.map(t => (
            <div key={t.name} style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 16, padding: '28px 24px', backdropFilter: 'blur(12px)' }}>
              <p style={{ fontSize: 14.5, color: '#333', lineHeight: 1.6, marginBottom: 20, fontStyle: 'italic' }}>"{t.text}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #437DFD, #2C76FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 600 }}>{t.name[0]}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0C0C0C' }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: '#999' }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto 100px', padding: '0 48px' }}>
        <div style={{ background: 'linear-gradient(135deg, #0C0C0C 0%, #1a1a2e 100%)', borderRadius: 24, padding: '64px 48px', textAlign: 'center', overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(67,125,253,0.25) 0%, transparent 70%)' }} />
          <div style={{ position: 'absolute', bottom: -40, left: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(253,91,93,0.2) 0%, transparent 70%)' }} />
          <img src="/airis-sphere.png" alt="Airis" style={{ width: 80, height: 80, objectFit: 'contain', marginBottom: 24, filter: 'drop-shadow(0 0 20px rgba(67,125,253,0.5))' }} />
          <h2 style={{ fontSize: 44, fontWeight: 300, letterSpacing: '-0.03em', color: '#fff', margin: '0 0 14px' }}>Ready to meet<br /><span style={{ fontWeight: 500 }}>your Airis?</span></h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', marginBottom: 36 }}>Join thousands already using the future of AI assistance.</p>
          <button onClick={() => navigate('/login?signup=1')} style={{ fontSize: 15, fontWeight: 500, color: '#0C0C0C', background: '#fff', border: 'none', cursor: 'pointer', padding: '14px 36px', borderRadius: 100, fontFamily: 'inherit', transition: 'opacity 0.15s' }}>
            Start for free →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(0,0,0,0.07)', padding: '32px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/airis-sphere.png" alt="Airis" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} />
          <span style={{ fontSize: 13.5, fontWeight: 600, color: '#0C0C0C' }}>Airis</span>
        </div>
        <span style={{ fontSize: 12.5, color: '#aaa' }}>© 2026 Airis AI. All rights reserved.</span>
        <div style={{ display: 'flex', gap: 20 }}>
          {['Privacy', 'Terms', 'Contact'].map(l => (
            <span key={l} style={{ fontSize: 12.5, color: '#999', cursor: 'pointer' }}>{l}</span>
          ))}
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        button:hover { opacity: 0.88 !important; }
      `}</style>
    </div>
  );
}
