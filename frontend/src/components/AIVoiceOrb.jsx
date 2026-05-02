import { useEffect, useRef } from 'react';

const AIVoiceOrb = ({ size = 160, state = 'idle' }) => {
  const c = size / 2;
  const sr = size * 0.34;
  const isActive = state === 'listening' || state === 'speaking';
  const isListening = state === 'listening';
  const isSpeaking = state === 'speaking';

  const o1rx = sr * 0.96, o1ry = sr * 0.21;
  const o2rx = sr * 0.86, o2ry = sr * 0.33;
  const o3rx = sr * 0.78, o3ry = sr * 0.26;

  // Particle positions on ellipse: parameterize by angle t
  const ep = (rx, ry, cx, cy, t) => ({
    x: cx + rx * Math.cos(t),
    y: cy + ry * Math.sin(t),
  });

  return (
    <div style={{
      position: 'relative',
      width: size, height: size,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>

      {/* Ambient background glow */}
      <div style={{
        position: 'absolute',
        width: size * 1.8, height: size * 1.8,
        top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        borderRadius: '50%',
        background: `radial-gradient(circle, rgba(124,58,237,${isActive ? 0.28 : 0.14}) 0%, rgba(91,33,182,${isActive ? 0.12 : 0.06}) 45%, transparent 70%)`,
        animation: 'orbAmbient 3s ease-in-out infinite',
        transition: 'opacity 0.6s',
      }}/>

      {/* Wave pulse rings — always slow, faster when active */}
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          position: 'absolute',
          width: sr * 2 + i * sr * 0.55,
          height: sr * 2 + i * sr * 0.55,
          borderRadius: '50%',
          border: `${1 - i * 0.2}px solid rgba(124,58,237,${isActive ? 0.45 - i * 0.12 : 0.12 - i * 0.03})`,
          animation: `orbWave ${isActive ? 1.6 : 2.8}s ease-out ${i * (isActive ? 0.35 : 0.55)}s infinite`,
          transition: 'border-color 0.5s, animation-duration 0.5s',
        }}/>
      ))}

      {/* SVG layer — orbital rings + glow particles */}
      <svg
        width={size} height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <defs>
          <filter id="orbParticle" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2.5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="orbRimGlow" x="-5%" y="-5%" width="110%" height="110%">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <radialGradient id="orbSpecular" cx="35%" cy="30%" r="55%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.95)"/>
            <stop offset="10%" stopColor="rgba(230,215,255,0.7)"/>
            <stop offset="25%" stopColor="rgba(196,181,253,0.4)"/>
            <stop offset="60%" stopColor="rgba(124,58,237,0.1)"/>
            <stop offset="100%" stopColor="transparent"/>
          </radialGradient>
          <radialGradient id="orbRim" cx="65%" cy="72%" r="45%">
            <stop offset="0%" stopColor="rgba(139,92,246,0.5)"/>
            <stop offset="100%" stopColor="transparent"/>
          </radialGradient>

          {/* Ellipse paths for animateMotion */}
          <path id="opath1" d={`
            M ${c + o1rx} ${c}
            a ${o1rx} ${o1ry} 0 1 0 -0.001 0
          `} fill="none"/>
          <path id="opath2" d={`
            M ${c + o2rx * Math.cos(Math.PI * 0.25)} ${c + o2ry * Math.sin(Math.PI * 0.25)}
            a ${o2rx} ${o2ry} 0 1 0 -0.001 0
          `} fill="none"/>
          <path id="opath3" d={`
            M ${c + o3rx * Math.cos(-Math.PI * 0.35)} ${c + o3ry * Math.sin(-Math.PI * 0.35)}
            a ${o3rx} ${o3ry} 0 1 0 -0.001 0
          `} fill="none"/>
        </defs>

        {/* Orbit ring 1 — near-equatorial */}
        <ellipse cx={c} cy={c} rx={o1rx} ry={o1ry}
          fill="none"
          stroke={`rgba(167,139,250,${isActive ? 0.6 : 0.4})`}
          strokeWidth="1.5"
          style={{ transition: 'stroke 0.5s' }}>
          <animateTransform attributeName="transform" type="rotate"
            from={`0 ${c} ${c}`} to={`360 ${c} ${c}`} dur="8s" repeatCount="indefinite"/>
        </ellipse>

        {/* Orbit ring 2 — diagonal */}
        <ellipse cx={c} cy={c} rx={o2rx} ry={o2ry}
          fill="none"
          stroke={`rgba(167,139,250,${isActive ? 0.4 : 0.25})`}
          strokeWidth="1"
          transform={`rotate(42, ${c}, ${c})`}
          style={{ transition: 'stroke 0.5s' }}>
          <animateTransform attributeName="transform" type="rotate"
            from={`42 ${c} ${c}`} to={`-318 ${c} ${c}`} dur="12s" repeatCount="indefinite"/>
        </ellipse>

        {/* Orbit ring 3 — other tilt */}
        <ellipse cx={c} cy={c} rx={o3rx} ry={o3ry}
          fill="none"
          stroke={`rgba(196,181,253,${isActive ? 0.3 : 0.15})`}
          strokeWidth="0.8"
          transform={`rotate(-38, ${c}, ${c})`}>
          <animateTransform attributeName="transform" type="rotate"
            from={`-38 ${c} ${c}`} to={`322 ${c} ${c}`} dur="10s" repeatCount="indefinite"/>
        </ellipse>

        {/* Orbiting particles */}
        <circle r="5.5" fill="#e0d4ff" filter="url(#orbParticle)">
          <animateMotion dur="8s" repeatCount="indefinite" rotate="auto">
            <mpath href="#opath1"/>
          </animateMotion>
        </circle>
        <circle r="3.5" fill="#c4b5fd" filter="url(#orbParticle)">
          <animateMotion dur="8s" begin="-4s" repeatCount="indefinite" rotate="auto">
            <mpath href="#opath1"/>
          </animateMotion>
        </circle>
        <circle r="4.5" fill="#a78bfa" filter="url(#orbParticle)">
          <animateMotion dur="12s" repeatCount="indefinite" rotate="auto">
            <mpath href="#opath2"/>
          </animateMotion>
        </circle>
        <circle r="3" fill="#ddd6fe" filter="url(#orbParticle)">
          <animateMotion dur="10s" repeatCount="indefinite" rotate="auto">
            <mpath href="#opath3"/>
          </animateMotion>
        </circle>

        {/* 3D Sphere — built with multiple layered circles */}
        {/* Base dark sphere */}
        <circle cx={c} cy={c} r={sr}
          fill="#0d0618"
          style={{ filter: 'drop-shadow(0px 14px 28px rgba(0,0,0,0.7))' }}
        />
        {/* Mid-tone fill */}
        <circle cx={c} cy={c} r={sr}
          fill="url(#orbMidGrad)"
        />
        {/* Rim glow */}
        <circle cx={c} cy={c} r={sr}
          fill="url(#orbRim)"
          opacity="0.8"
          filter="url(#orbRimGlow)"
        />
        {/* Specular highlight */}
        <circle cx={c} cy={c} r={sr}
          fill="url(#orbSpecular)"
        />

        {/* Secondary specular hotspot */}
        <ellipse
          cx={c - sr * 0.3}
          cy={c - sr * 0.32}
          rx={sr * 0.18}
          ry={sr * 0.11}
          fill="rgba(255,255,255,0.28)"
          transform={`rotate(-25, ${c - sr * 0.3}, ${c - sr * 0.32})`}
        />

        {/* Neural node dots on sphere surface */}
        {[
          [c + sr*0.32, c - sr*0.4],
          [c - sr*0.45, c + sr*0.2],
          [c + sr*0.15, c + sr*0.45],
          [c - sr*0.2, c - sr*0.3],
          [c + sr*0.4, c + sr*0.2],
        ].map(([nx, ny], i) => (
          <circle key={i} cx={nx} cy={ny} r="2.5"
            fill={`rgba(196,181,253,${0.4 + i * 0.08})`}
            opacity={0.7}>
            <animate attributeName="opacity" values={`0.5;1;0.5`}
              dur={`${1.5 + i * 0.4}s`} begin={`${i * 0.3}s`} repeatCount="indefinite"/>
          </circle>
        ))}

        {/* Connector lines between nodes */}
        <line x1={c + sr*0.32} y1={c - sr*0.4} x2={c - sr*0.2} y2={c - sr*0.3}
          stroke="rgba(167,139,250,0.25)" strokeWidth="0.8"/>
        <line x1={c - sr*0.45} y1={c + sr*0.2} x2={c + sr*0.15} y2={c + sr*0.45}
          stroke="rgba(167,139,250,0.2)" strokeWidth="0.8"/>
        <line x1={c + sr*0.4} y1={c + sr*0.2} x2={c + sr*0.15} y2={c + sr*0.45}
          stroke="rgba(167,139,250,0.18)" strokeWidth="0.8"/>

        {/* Pulsing core dot */}
        <circle cx={c} cy={c} r={sr * 0.12} fill="rgba(196,181,253,0.35)">
          <animate attributeName="r" values={`${sr*0.1};${sr*0.18};${sr*0.1}`}
            dur="2.5s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.3;0.7;0.3"
            dur="2.5s" repeatCount="indefinite"/>
        </circle>

        {/* Additional gradient definitions (must be in defs) */}
        <defs>
          <radialGradient id="orbMidGrad" cx="38%" cy="32%" r="70%" gradientUnits="objectBoundingBox">
            <stop offset="0%"  stopColor="rgba(220,200,255,0)" />
            <stop offset="20%" stopColor="rgba(167,139,250,0.5)"/>
            <stop offset="55%" stopColor="rgba(124,58,237,0.85)"/>
            <stop offset="80%" stopColor="rgba(76,29,149,0.95)"/>
            <stop offset="100%" stopColor="rgba(30,10,74,1)"/>
          </radialGradient>
        </defs>
      </svg>

      {/* Voice wave bars below orb when speaking */}
      {isSpeaking && (
        <div style={{
          position: 'absolute',
          bottom: -28, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: '3px', alignItems: 'flex-end',
        }}>
          {[0.5,0.8,1,0.65,1,0.7,0.5,0.9,0.6,1,0.8,0.5].map((h, i) => (
            <div key={i} style={{
              width: '3px', borderRadius: '2px',
              background: 'linear-gradient(180deg,#e0d4ff,#7c3aed)',
              height: `${h * 18}px`,
              animation: `orbBarAnim 0.7s ease-in-out ${i * 0.07}s infinite alternate`,
            }}/>
          ))}
        </div>
      )}

      {/* Listening pulse ring */}
      {isListening && (
        <div style={{
          position: 'absolute', inset: '-12px',
          borderRadius: '50%',
          border: '2px solid rgba(5,150,105,0.6)',
          animation: 'orbListenPulse 1.2s ease-in-out infinite',
        }}/>
      )}

      <style>{`
        @keyframes orbAmbient {
          0%,100% { opacity:0.8; transform:translate(-50%,-50%) scale(1); }
          50%      { opacity:1;   transform:translate(-50%,-50%) scale(1.08); }
        }
        @keyframes orbWave {
          0%   { transform:scale(0.85); opacity:0.9; }
          100% { transform:scale(1.35); opacity:0; }
        }
        @keyframes orbBarAnim {
          from { transform:scaleY(0.4); }
          to   { transform:scaleY(1); }
        }
        @keyframes orbListenPulse {
          0%,100% { transform:scale(1);    opacity:0.8; }
          50%     { transform:scale(1.07); opacity:0.4; }
        }
      `}</style>
    </div>
  );
};

export default AIVoiceOrb;
