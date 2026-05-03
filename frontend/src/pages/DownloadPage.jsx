import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

const REPO = 'saishivasanjeethpaikarao-jpg/ai--assistant';
const RELEASES = `https://github.com/${REPO}/releases/latest/download`;

const DOWNLOADS = {
  windows: `${RELEASES}/Airis_2.0.0_x64_en-US.msi`,
  linux:   `${RELEASES}/airis_2.0.0_amd64.deb`,
  apk:     `${RELEASES}/airis-android.apk`,
};

const S = {
  blue:  '#437DFD',
  coral: '#FD5B5D',
  green: '#00C48C',
  dark:  '#0C0C0C',
  muted: '#777',
  bg:    '#F5F4F2',
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

function DownloadButton({ label, href, accent, icon }) {
  return (
    <a
      href={href}
      download
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        fontSize: 13.5,
        fontWeight: 600,
        color: '#fff',
        background: accent,
        border: 'none',
        borderRadius: 100,
        padding: '10px 22px',
        cursor: 'pointer',
        textDecoration: 'none',
        flex: 1,
        minWidth: 0,
      }}
    >
      <span style={{ fontSize: 15 }}>{icon}</span>
      {label}
    </a>
  );
}

function PlatformCard({ icon, title, subtitle, badge, steps, accent, isMobile, children }) {
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
        {children}
      </div>
    </div>
  );
}

export default function DownloadPage() {
  const navigate = useNavigate();
  const w = useWindowSize();
  const isMobile = w < 640;
  const cols = isMobile ? 1 : 2;

  return (
    <div style={{ minHeight: '100vh', background: S.bg, fontFamily: "'DM Sans', sans-serif", color: S.dark }}>
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

      <div style={{ maxWidth: 960, margin: '0 auto', padding: isMobile ? '48px 20px 80px' : '72px 48px 100px' }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 48 : 72 }}>
          <div style={{ display: 'inline-block', background: 'rgba(67,125,253,0.08)', border: '1px solid rgba(67,125,253,0.2)', borderRadius: 100, padding: '4px 14px', fontSize: 12, fontWeight: 600, color: S.blue, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 20 }}>
            Direct Downloads
          </div>
          <h1 style={{ fontSize: 'clamp(32px,5vw,56px)', fontWeight: 300, letterSpacing: '-0.03em', margin: '0 0 16px', lineHeight: 1.1 }}>
            Download Airis
          </h1>
          <p style={{ fontSize: isMobile ? 15 : 17, color: S.muted, maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
            Install the native app on your device. One click — real file download.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 24 }}>
          <PlatformCard
            icon="🖥️"
            title="Desktop App"
            badge="Native"
            subtitle="Windows installer and Linux package. Runs natively on your computer."
            accent={S.green}
            isMobile={isMobile}
            steps={[
              'Click a download button below for your OS',
              'Run the installer (Windows: .msi, Linux: .deb)',
              'Open Airis from your desktop or app menu',
            ]}
          >
            <DownloadButton label="Windows .msi" href={DOWNLOADS.windows} accent={S.green} icon="🪟" />
            <DownloadButton label="Linux .deb"   href={DOWNLOADS.linux}   accent="#555"   icon="🐧" />
          </PlatformCard>

          <PlatformCard
            icon="📱"
            title="Android App"
            badge="APK"
            subtitle="Direct APK for Android phones and tablets. No Play Store needed."
            accent={S.coral}
            isMobile={isMobile}
            steps={[
              'Download the APK file to your phone',
              'Open it — tap "Install anyway" if prompted',
              'Open Airis and start chatting',
            ]}
          >
            <DownloadButton label="Download APK" href={DOWNLOADS.apk} accent={S.coral} icon="📲" />
          </PlatformCard>
        </div>

        <div style={{ marginTop: 40, padding: '20px 28px', background: 'rgba(67,125,253,0.06)', border: '1px solid rgba(67,125,253,0.15)', borderRadius: 16, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>💡</span>
          <div>
            <p style={{ fontSize: 13.5, fontWeight: 600, color: S.dark, marginBottom: 4 }}>Prefer the browser?</p>
            <p style={{ fontSize: 13, color: S.muted, lineHeight: 1.6 }}>
              You can also use Airis directly in your browser —{' '}
              <button onClick={() => navigate('/app')} style={{ color: S.blue, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0, fontSize: 13 }}>
                open the web app →
              </button>
            </p>
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
