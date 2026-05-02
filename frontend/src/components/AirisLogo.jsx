const JarvisLogo = ({ size = 72, animate = true }) => (
  <svg width={size} height={size} viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="jlBg" x1="0" y1="0" x2="72" y2="72" gradientUnits="userSpaceOnUse">
        <stop offset="0%"   stopColor="#1e0a4a"/>
        <stop offset="50%"  stopColor="#3b1a8a"/>
        <stop offset="100%" stopColor="#5b21b6"/>
      </linearGradient>
      <linearGradient id="jlShine" x1="0" y1="0" x2="72" y2="72" gradientUnits="userSpaceOnUse">
        <stop offset="0%"   stopColor="rgba(255,255,255,0.18)"/>
        <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
      </linearGradient>
      <linearGradient id="jlJ" x1="28" y1="20" x2="44" y2="54" gradientUnits="userSpaceOnUse">
        <stop offset="0%"   stopColor="#e0d4ff"/>
        <stop offset="100%" stopColor="#a78bfa"/>
      </linearGradient>
      <linearGradient id="jlRing" x1="0" y1="0" x2="72" y2="72" gradientUnits="userSpaceOnUse">
        <stop offset="0%"   stopColor="#a78bfa" stopOpacity="0.6"/>
        <stop offset="50%"  stopColor="#7c3aed" stopOpacity="0.2"/>
        <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.6"/>
      </linearGradient>
      <filter id="jlGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2.5" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <filter id="jlShadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#7c3aed" floodOpacity="0.4"/>
      </filter>
    </defs>

    {/* Outer pulse ring — animated */}
    {animate && (
      <circle cx="36" cy="36" r="34" stroke="url(#jlRing)" strokeWidth="1" fill="none" opacity="0.5">
        <animate attributeName="opacity" values="0.5;0.15;0.5" dur="3s" repeatCount="indefinite"/>
        <animate attributeName="r" values="34;36;34" dur="3s" repeatCount="indefinite"/>
      </circle>
    )}

    {/* Background shape */}
    <rect x="5" y="5" width="62" height="62" rx="18" fill="url(#jlBg)" filter="url(#jlShadow)"/>

    {/* Shine overlay */}
    <rect x="5" y="5" width="62" height="30" rx="18" fill="url(#jlShine)" opacity="0.6"/>
    <rect x="5" y="5" width="62" height="62" rx="18" stroke="rgba(167,139,250,0.25)" strokeWidth="1" fill="none"/>

    {/* Neural grid dots */}
    <circle cx="17" cy="17" r="1.8" fill="rgba(167,139,250,0.35)"/>
    <circle cx="36" cy="14" r="1.5" fill="rgba(167,139,250,0.25)"/>
    <circle cx="55" cy="17" r="1.8" fill="rgba(167,139,250,0.35)"/>
    <circle cx="14" cy="36" r="1.5" fill="rgba(167,139,250,0.25)"/>
    <circle cx="58" cy="36" r="1.5" fill="rgba(167,139,250,0.25)"/>
    <circle cx="17" cy="55" r="1.8" fill="rgba(167,139,250,0.35)"/>
    <circle cx="55" cy="55" r="1.8" fill="rgba(167,139,250,0.35)"/>

    {/* Neural connector lines */}
    <line x1="17" y1="17" x2="36" y2="36" stroke="rgba(167,139,250,0.12)" strokeWidth="1"/>
    <line x1="55" y1="17" x2="36" y2="36" stroke="rgba(167,139,250,0.12)" strokeWidth="1"/>
    <line x1="17" y1="55" x2="36" y2="36" stroke="rgba(167,139,250,0.12)" strokeWidth="1"/>
    <line x1="55" y1="55" x2="36" y2="36" stroke="rgba(167,139,250,0.12)" strokeWidth="1"/>
    <line x1="14" y1="36" x2="36" y2="36" stroke="rgba(167,139,250,0.08)" strokeWidth="1"/>
    <line x1="58" y1="36" x2="36" y2="36" stroke="rgba(167,139,250,0.08)" strokeWidth="1"/>

    {/* Central glow node */}
    <circle cx="36" cy="36" r="5" fill="rgba(167,139,250,0.15)"/>
    <circle cx="36" cy="36" r="2.5" fill="rgba(167,139,250,0.3)"/>

    {/* J letterform — clean geometric */}
    <path
      d="M30 20 L43 20 M43 20 L43 44 C43 49.5 39.5 53 35 53 C30.5 53 27 49.5 27 44"
      stroke="url(#jlJ)"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      filter="url(#jlGlow)"
    />

    {/* Top cap accent */}
    <line x1="30" y1="20" x2="43" y2="20" stroke="url(#jlJ)" strokeWidth="4" strokeLinecap="round"/>
  </svg>
);

export default JarvisLogo;
