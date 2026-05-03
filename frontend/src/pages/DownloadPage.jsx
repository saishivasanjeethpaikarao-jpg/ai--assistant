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

function PlatformCard({ icon, title, subtitle, badge, steps, cta, ctaAction, accent, isMobile }) {
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
          style={{ fontSize: 14, fontWeight: 600, color: '#fff', background: accent, border: 'none', borderRadius: 100, padding: '10px 24px', cursor: 'pointer', flex: 1 }}
        >
          {cta}
        </button>
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
            Pick your Airis app
          </h1>
          <p style={{ fontSize: isMobile ? 15 : 17, color: S.muted, maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
            Choose the desktop installer or the mobile app file. Nothing else.
          </p>
        </div>

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 24 }}>
          <PlatformCard
            icon="🖥️"
            title="Desktop App"
            badge="Installer"
            subtitle="Install Airis on Windows, Mac, or Linux."
            accent="#00C48C"
            isMobile={isMobile}
            steps={[
              'Download the desktop installer file',
              'Run it on your computer',
              'Open Airis from your desktop or Start Menu',
            ]}
            cta="Get desktop file"
            ctaAction={() => navigate('/app')}
          />

          <PlatformCard
            icon="📱"
            title="Mobile App"
            badge="APK"
            subtitle="Install Airis on your phone."
            accent={S.coral}
            isMobile={isMobile}
            steps={[
              'Download the mobile app file',
              'Install it on your phone',
              'Open Airis and start chatting',
            ]}
            cta="Get APK file"
            ctaAction={() => navigate('/app')}
          />
        </div>

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>
    </div>
  );
}
