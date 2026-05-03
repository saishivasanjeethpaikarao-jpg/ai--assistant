import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const navigate             = useNavigate();
  const [params]             = useSearchParams();
  const isSignup             = params.get('signup') === '1';

  const { user, loading: authLoading, error, clearError, signInGoogle, signInGithub, signInEmail, signUpEmail, resetPassword, signInGuest } = useAuth();

  const [mode, setMode]           = useState(isSignup ? 'signup' : 'signin');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [busy, setBusy]           = useState('');
  const [success, setSuccess]     = useState('');
  const [showPass, setShowPass]   = useState(false);

  useEffect(() => { if (user) navigate('/app'); }, [user]);
  useEffect(() => { clearError(); setSuccess(''); }, [mode]);

  const handle = (fn, label) => async () => {
    setBusy(label); clearError(); setSuccess('');
    try { await fn(); }
    catch { /* error shown via context */ }
    finally { setBusy(''); }
  };

  const handleEmail = async (e) => {
    e.preventDefault();
    if (mode === 'signup' && password !== confirm) return;
    setBusy('email'); clearError(); setSuccess('');
    try {
      if (mode === 'signup') await signUpEmail(email, password);
      else await signInEmail(email, password);
    } catch { /* handled */ }
    finally { setBusy(''); }
  };

  const handleReset = async () => {
    if (!email) return;
    setBusy('reset'); clearError();
    try {
      await resetPassword(email);
      setSuccess('Password reset email sent. Check your inbox.');
    } catch { /* handled */ }
    finally { setBusy(''); }
  };

  if (authLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F4F2', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <img src="/airis-sphere.png" alt="Airis" style={{ width: 56, height: 56, objectFit: 'contain', animation: 'float 3s ease-in-out infinite' }} />
        <span style={{ color: '#aaa', fontSize: 14 }}>Loading…</span>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'DM Sans', -apple-system, sans-serif", background: '#F5F4F2', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative' }}>

      {/* Blobs */}
      <div style={{ position: 'fixed', top: -200, left: -150, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(67,125,253,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: -100, right: -80, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(253,91,93,0.09) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Back link */}
      <button onClick={() => navigate('/')} style={{ position: 'fixed', top: 24, left: 24, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#777', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 100, padding: '7px 16px', cursor: 'pointer', fontFamily: 'inherit', backdropFilter: 'blur(8px)', zIndex: 10 }}>
        ← Back
      </button>
      <button onClick={() => navigate('/app')} style={{ position: 'fixed', top: 24, right: 24, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#fff', background: '#0C0C0C', border: 'none', borderRadius: 100, padding: '7px 16px', cursor: 'pointer', fontFamily: 'inherit', backdropFilter: 'blur(8px)', zIndex: 10 }}>
        Open app
      </button>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: 420, background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 24, padding: '40px 36px', backdropFilter: 'blur(20px)', boxShadow: '0 8px 40px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.9) inset' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src="/airis-sphere.png" alt="Airis" style={{ width: 60, height: 60, objectFit: 'contain', filter: 'drop-shadow(0 8px 20px rgba(67,125,253,0.3))', animation: 'float 4s ease-in-out infinite', marginBottom: 14 }} />
          <h1 style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.03em', color: '#0C0C0C', margin: '0 0 6px' }}>
            {mode === 'reset' ? 'Reset password' : mode === 'signup' ? 'Create your account' : 'Welcome back'}
          </h1>
          <p style={{ fontSize: 13.5, color: '#888' }}>
            {mode === 'reset' ? "Enter your email and we'll send a link." : mode === 'signup' ? 'Join thousands using Airis.' : 'Sign in to continue to Airis.'}
          </p>
        </div>

        {/* Error / Success banners */}
        {error && (
          <div style={{ background: 'rgba(253,91,93,0.08)', border: '1px solid rgba(253,91,93,0.25)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#c0392b', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span>⚠️</span> {error}
          </div>
        )}
        {success && (
          <div style={{ background: 'rgba(67,125,253,0.08)', border: '1px solid rgba(67,125,253,0.25)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#437DFD', marginBottom: 16 }}>
            ✓ {success}
          </div>
        )}

        {/* Social sign-in (not on reset screen) */}
        {mode !== 'reset' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              <SocialBtn
                onClick={handle(signInGoogle, 'google')}
                loading={busy === 'google'}
                icon={<GoogleIcon />}
                label="Continue with Google"
              />
              <SocialBtn
                onClick={handle(signInGithub, 'github')}
                loading={busy === 'github'}
                icon={<GitHubIcon />}
                label="Continue with GitHub"
              />
            </div>

            <Divider />
          </>
        )}

        {/* Email form */}
        <form onSubmit={mode === 'reset' ? (e) => { e.preventDefault(); handleReset(); } : handleEmail} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>Email</label>
            <input
              type="email" required autoComplete="email"
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{ width: '100%', padding: '11px 14px', fontSize: 14, fontFamily: 'inherit', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 12, background: 'rgba(255,255,255,0.8)', color: '#0C0C0C', outline: 'none', transition: 'border-color 0.15s' }}
            />
          </div>

          {mode !== 'reset' && (
            <div>
              <label style={{ fontSize: 12.5, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'} required
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ width: '100%', padding: '11px 42px 11px 14px', fontSize: 14, fontFamily: 'inherit', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 12, background: 'rgba(255,255,255,0.8)', color: '#0C0C0C', outline: 'none' }}
                />
                <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 13 }}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label style={{ fontSize: 12.5, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>Confirm Password</label>
              <input
                type="password" required
                value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', padding: '11px 14px', fontSize: 14, fontFamily: 'inherit', border: `1px solid ${confirm && confirm !== password ? 'rgba(253,91,93,0.5)' : 'rgba(0,0,0,0.12)'}`, borderRadius: 12, background: 'rgba(255,255,255,0.8)', color: '#0C0C0C', outline: 'none' }}
              />
              {confirm && confirm !== password && <p style={{ fontSize: 11.5, color: '#FD5B5D', marginTop: 4 }}>Passwords don't match</p>}
            </div>
          )}

          <button
            type="submit"
            disabled={!!busy || (mode === 'signup' && password !== confirm)}
            style={{ width: '100%', padding: '12px', fontSize: 14, fontWeight: 600, color: '#fff', background: busy === 'email' ? '#6b9dfd' : '#0C0C0C', border: 'none', borderRadius: 12, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginTop: 4, transition: 'background 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {busy === 'email' || busy === 'reset' ? <Spinner /> : null}
            {mode === 'reset' ? 'Send reset link' : mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        </form>

        {/* Footer links */}
        <div style={{ marginTop: 20, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {mode === 'signin' && (
            <button onClick={() => setMode('reset')} style={{ fontSize: 12.5, color: '#437DFD', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              Forgot your password?
            </button>
          )}
          {mode !== 'reset' ? (
            <p style={{ fontSize: 13, color: '#888' }}>
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')} style={{ color: '#437DFD', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontFamily: 'inherit', fontSize: 13 }}>
                {mode === 'signin' ? 'Sign up free' : 'Sign in'}
              </button>
            </p>
          ) : (
            <button onClick={() => setMode('signin')} style={{ fontSize: 13, color: '#437DFD', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              ← Back to sign in
            </button>
          )}

          {/* Guest mode */}
          {mode !== 'reset' && (
            <div style={{ marginTop: 4 }}>
              <div style={{ height: 1, background: 'rgba(0,0,0,0.07)', margin: '2px 0 12px' }} />
              <button
                onClick={handle(signInGuest, 'guest')}
                disabled={!!busy}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, width: '100%', padding: '10px 16px', fontSize: 13.5, fontWeight: 500, color: '#555', background: 'transparent', border: '1px dashed rgba(0,0,0,0.15)', borderRadius: 12, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'background 0.15s, border-color 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.25)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)'; }}
              >
                {busy === 'guest' ? <Spinner dark /> : <GuestIcon />}
                Continue as Guest
              </button>
              <p style={{ fontSize: 11.5, color: '#bbb', marginTop: 8 }}>No account needed · Limited features</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input:focus { border-color: rgba(67,125,253,0.5) !important; box-shadow: 0 0 0 3px rgba(67,125,253,0.1) !important; }
      `}</style>
    </div>
  );
}

function SocialBtn({ onClick, loading, icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', padding: '11px 16px', fontSize: 14, fontWeight: 500, color: '#0C0C0C', background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'background 0.15s, box-shadow 0.15s' }}
    >
      {loading ? <Spinner /> : icon}
      {label}
    </button>
  );
}

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0 16px' }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.08)' }} />
      <span style={{ fontSize: 12, color: '#bbb', fontFamily: "'DM Sans', sans-serif" }}>or continue with email</span>
      <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.08)' }} />
    </div>
  );
}

function Spinner({ dark }) {
  return <span style={{ width: 14, height: 14, border: `2px solid ${dark ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.3)'}`, borderTopColor: dark ? '#555' : '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />;
}

function GuestIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#0C0C0C">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}
