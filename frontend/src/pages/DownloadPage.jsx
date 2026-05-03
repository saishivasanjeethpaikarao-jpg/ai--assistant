import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

const S = {
  blue: '#437DFD',
  coral: '#FD5B5D',
  dark: '#0C0C0C',
  muted: '#777',
  bg: '#F5F4F2',
};

function useWindowSize() {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return w;
}

function PlatformCard({ icon, title, subtitle, badge, steps, cta, ctaAction, ctaSecondary, ctaSecondaryAction, accent, isMobile }) {
  return (
    <div style={{
      background: '#fff',
      border: `1.5px solid ${accent}22`,
      borderRadius: 20,
      padding: isMobile ? '28px 22px' : '36px 32px',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      boxShadow: `0 4px 40px ${accent}0d`,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: `radial-gradient(circle, ${accent}18 0%, transparent 70%)` }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>{icon}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <h3 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>{title}</h3>
          {badge && (
            <span style={{ fontSize: 11, fontWeight: 700, background: `${accent}18`, color: accent, border: `1px solid ${accent}33`, borderRadius: 100, padding: '2px 10px', letterSpacing: '0.04em' }}>{badge}</span>
          )}
        </div>
        <p style={{ fontSize: 14, color: S.muted, lineHeight: 1.6 }}>{subtitle}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', zIndex: 1 }}>
        {steps.map((step, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ width: 22, height: 22, borderRadius: 11, background: `${accent}18`, border: `1px solid ${accent}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: accent }}>{i + 1}</span>
            </div>
            <p style={{ fontSize: 13.5, color: '#444', lineHeight: 1.55, flex: 1 }}>{step}</p>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', position: 'relative', zIndex: 1, marginTop: 4 }}>
        <button
          onClick={ctaAction}
          style={{ fontSize: 14, fontWeight: 600, color: '#fff', background: accent, border: 'none', borderRadius: 100, padding: '10px 24px', cursor: 'pointer', flex: ctaSecondary ? 'unset' : 1 }}
        >
          {cta}
        </button>
        {ctaSecondary && (
          <button
            onClick={ctaSecondaryAction}
            style={{ fontSize: 14, fontWeight: 500, color: accent, background: `${accent}10`, border: `1px solid ${accent}22`, borderRadius: 100, padding: '10px 20px', cursor: 'pointer', flex: 1 }}
          >
            {ctaSecondary}
          </button>
        )}
      </div>
    </div>
  );
}

export default function DownloadPage() {
  const navigate = useNavigate();
  const w = useWindowSize();
  const isMobile = w < 640;
  const isTablet = w >= 640 && w < 1024;

  const cols = isMobile ? 1 : isTablet ? 1 : 3;

  return (
    <div style={{ minHeight: '100vh', background: S.bg, fontFamily: "'DM Sans', sans-serif", color: S.dark }}>
      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '16px 20px' : '20px 48px', borderBottom: '1px solid rgba(0,0,0,0.06)', background: 'rgba(245,244,242,0.9)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <img src="/airis-sphere.png" alt="Airis" style={{ width: 30, height: 30, objectFit: 'contain' }} />
          <span style={{ fontSize: 17, fontWeight: 700 }}>Airis</span>
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/login')} style={{ fontSize: 13, fontWeight: 500, color: '#444', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px 14px' }}>Sign in</button>
          <button onClick={() => navigate('/app')} style={{ fontSize: 13, fontWeight: 600, color: '#fff', background: S.dark, border: 'none', borderRadius: 100, padding: '8px 18px', cursor: 'pointer' }}>Open app</button>
        </div>
      </nav>

      <div style={{ maxWidth: 1140, margin: '0 auto', padding: isMobile ? '48px 20px 80px' : '72px 48px 100px' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 48 : 72 }}>
          <div style={{ display: 'inline-block', background: 'rgba(67,125,253,0.08)', border: '1px solid rgba(67,125,253,0.2)', borderRadius: 100, padding: '4px 14px', fontSize: 12, fontWeight: 600, color: S.blue, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 20 }}>
            Available everywhere
          </div>
          <h1 style={{ fontSize: 'clamp(32px,5vw,58px)', fontWeight: 300, letterSpacing: '-0.03em', margin: '0 0 16px', lineHeight: 1.1 }}>
            Airis on every<br /><span style={{ fontWeight: 700 }}>platform you use</span>
          </h1>
          <p style={{ fontSize: isMobile ? 15 : 17, color: S.muted, maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
            Use Airis in the browser, install it as a desktop app, or run it on your phone. One AI, everywhere.
          </p>
        </div>

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 24 }}>
          <PlatformCard
            icon="🌐"
            title="Web App"
            badge="Available now"
            subtitle="Use Airis instantly in your browser — no installation needed. Works on any device with a modern browser."
            accent={S.blue}
            isMobile={isMobile}
            steps={[
              'Open airis.app or click "Open app" above',
              'Sign up free — no credit card required',
              'Start chatting, trading, and building with Airis',
            ]}
            cta="Open web app →"
            ctaAction={() => navigate('/app')}
          />

          <PlatformCard
            icon="🖥️"
            title="Desktop App"
            badge="Windows · Mac · Linux"
            subtitle="Install Airis as a native desktop app powered by Tauri. Faster, offline-capable, and integrates with your OS."
            accent="#00C48C"
            isMobile={isMobile}
            steps={[
              'Clone the repo and run: cd frontend && npm run tauri:build',
              'Grab the installer from frontend/src-tauri/target/release/bundle/',
              'Launch Airis from your Applications or Start Menu',
            ]}
            cta="Build desktop app"
            ctaAction={() => window.open('https://tauri.app/v1/guides/getting-started/prerequisites', '_blank')}
            ctaSecondary="View source"
            ctaSecondaryAction={() => window.open('https://github.com', '_blank')}
          />

          <PlatformCard
            icon="📱"
            title="Mobile App"
            badge="iOS · Android"
            subtitle="Airis on the go. A native React Native app built with Expo — voice chat, AI answers, anywhere."
            accent={S.coral}
            isMobile={isMobile}
            steps={[
              'Install Expo: npm install -g expo-cli',
              'Run: cd mobile-app && npm install && npx expo start',
              'Scan the QR with Expo Go app on your phone',
              'For production: eas build --platform android (or ios)',
            ]}
            cta="Run with Expo Go"
            ctaAction={() => window.open('https://expo.dev/go', '_blank')}
            ctaSecondary="EAS build docs"
            ctaSecondaryAction={() => window.open('https://docs.expo.dev/build/introduction/', '_blank')}
          />
        </div>

        {/* Comparison table */}
        <div style={{ marginTop: isMobile ? 56 : 80 }}>
          <h2 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 600, letterSpacing: -0.5, textAlign: 'center', marginBottom: 32 }}>Feature comparison</h2>
          <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 20, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '2fr 1fr 1fr 1fr' : '2fr 1fr 1fr 1fr', borderBottom: '1px solid rgba(0,0,0,0.07)', padding: '14px 20px', background: 'rgba(0,0,0,0.02)' }}>
              {['Feature', '🌐 Web', '🖥️ Desktop', '📱 Mobile'].map(h => (
                <div key={h} style={{ fontSize: 12, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
              ))}
            </div>
            {[
              ['AI Chat',          '✓', '✓', '✓'],
              ['Voice Input',      '✓', '✓', '✓'],
              ['Trading Dashboard','✓', '✓', '—'],
              ['Vibe Coder',       '✓', '✓', '—'],
              ['Offline mode',     '—', '✓', 'Partial'],
              ['Push notifications','—', '✓', '✓'],
              ['System tray',      '—', '✓', '—'],
              ['No install needed','✓', '—', '—'],
            ].map(([feat, ...vals], i) => (
              <div key={feat} style={{ display: 'grid', gridTemplateColumns: isMobile ? '2fr 1fr 1fr 1fr' : '2fr 1fr 1fr 1fr', padding: '13px 20px', borderBottom: i < 7 ? '1px solid rgba(0,0,0,0.05)' : 'none', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)' }}>
                <div style={{ fontSize: 14, color: '#333' }}>{feat}</div>
                {vals.map((v, vi) => (
                  <div key={vi} style={{ fontSize: 14, color: v === '✓' ? '#00C48C' : v === '—' ? '#ccc' : S.blue, fontWeight: v === '✓' ? 600 : 400 }}>{v}</div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ marginTop: isMobile ? 56 : 80, textAlign: 'center', background: 'linear-gradient(135deg, #0C0C0C 0%, #0f0f23 100%)', borderRadius: 24, padding: isMobile ? '48px 24px' : '64px 56px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(67,125,253,0.28) 0%, transparent 70%)' }} />
          <img src="/airis-sphere.png" alt="Airis" style={{ width: 60, height: 60, objectFit: 'contain', marginBottom: 20, filter: 'drop-shadow(0 0 20px rgba(67,125,253,0.6))', position: 'relative', zIndex: 2 }} />
          <h2 style={{ fontSize: isMobile ? 26 : 38, fontWeight: 600, color: '#fff', margin: '0 0 12px', letterSpacing: -0.5, position: 'relative', zIndex: 2 }}>
            Start with the web app
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: 32, position: 'relative', zIndex: 2 }}>
            No downloads. Open it now and be up and running in seconds.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 2 }}>
            <button onClick={() => navigate('/login?signup=1')} style={{ fontSize: 15, fontWeight: 600, color: S.dark, background: '#fff', border: 'none', borderRadius: 100, padding: '13px 32px', cursor: 'pointer' }}>
              Get started free →
            </button>
            <button onClick={() => navigate('/')} style={{ fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.65)', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 100, padding: '13px 24px', cursor: 'pointer' }}>
              Back to home
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>
    </div>
  );
}
