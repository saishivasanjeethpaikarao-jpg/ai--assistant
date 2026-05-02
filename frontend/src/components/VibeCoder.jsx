import { useState, useRef, useEffect, useCallback } from 'react';
import {
  FiCode, FiPlay, FiZap, FiTerminal, FiCopy, FiCheck, FiLoader,
  FiEye, FiRefreshCw, FiMonitor, FiSend, FiPlus, FiColumns,
  FiSmartphone, FiTablet, FiFolder, FiFile, FiTrash2, FiDownload,
  FiUpload, FiEdit3, FiChevronRight, FiChevronDown, FiX,
  FiArrowLeft, FiImage, FiGlobe, FiBox, FiBarChart2, FiUser,
  FiGrid, FiStar, FiMic, FiMicOff,
} from 'react-icons/fi';

// ── Storage ─────────────────────────────────────────────────────────────────
const PK = 'airis_vp';
const FK = id => `airis_vf_${id}`;
const LP = () => { try { return JSON.parse(localStorage.getItem(PK) || '[]'); } catch { return []; } };
const SP = p  => localStorage.setItem(PK, JSON.stringify(p));
const LF = id => { try { return JSON.parse(localStorage.getItem(FK(id)) || '[]'); } catch { return []; } };
const SF = (id, f) => localStorage.setItem(FK(id), JSON.stringify(f));

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const ts  = () => Date.now();

function getFileType(name) {
  const ext = (name.split('.').pop() || '').toLowerCase();
  const map = { html:'html', htm:'html', css:'css', js:'javascript', jsx:'react',
    ts:'typescript', tsx:'react', py:'python', json:'json', md:'markdown',
    txt:'text', png:'image', jpg:'image', jpeg:'image', gif:'image', svg:'image' };
  return map[ext] || 'text';
}

function getFileIcon(name) {
  const t = getFileType(name);
  const map = { html:'🌐', css:'🎨', javascript:'⚡', react:'⚛️', typescript:'💎',
    python:'🐍', json:'{}', markdown:'📝', image:'🖼️', text:'📄' };
  return map[t] || '📄';
}

// ── Preview builder (CDN links are kept as-is — critical fix) ───────────────
function buildPreview(files) {
  if (!files.length) return null;
  const htmlFile = files.find(f => f.name === 'index.html')
    || files.find(f => f.name.endsWith('.html'));
  if (!htmlFile) return null;

  let html = htmlFile.content;

  // Inline local CSS (keep external/CDN links unchanged)
  html = html.replace(/<link([^>]*)href=["']([^"']+)["']([^>]*)>/gi, (match, pre, href, post) => {
    if (href.startsWith('http') || href.startsWith('//') || href.startsWith('data:')) return match;
    const name = href.replace(/^\.\//, '');
    const f = files.find(f => f.name === name || f.name === href);
    return f ? `<style>${f.content}</style>` : match;
  });

  // Inline local JS (keep CDN scripts unchanged)
  html = html.replace(/<script([^>]*)src=["']([^"']+)["']([^>]*)><\/script>/gi, (match, pre, src, post) => {
    if (src.startsWith('http') || src.startsWith('//') || src.startsWith('data:')) return match;
    const name = src.replace(/^\.\//, '');
    const f = files.find(f => f.name === name || f.name === src);
    return f ? `<script${pre}>${f.content}</script>` : match;
  });

  return html;
}

// ── AI multi-file response parser ────────────────────────────────────────────
function parseFileBlocks(text) {
  const blocks = [];
  const re = /\[FILE:([\w.\-/ ]+)\]\n?([\s\S]*?)\n?\[\/FILE\]/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    blocks.push({ name: m[1].trim(), content: m[2] || '' });
  }
  // Fallback: if no blocks found, look for markdown code fences with filenames
  if (!blocks.length) {
    const fenceRe = /(?:^|\n)(?:\/\/\s*|##\s*)?(?:file|FILE):\s*([\w.\-/]+)\s*\n```(?:\w+)?\n([\s\S]*?)```/g;
    while ((m = fenceRe.exec(text)) !== null) {
      blocks.push({ name: m[1].trim(), content: m[2].trim() });
    }
  }
  return blocks;
}

// ── Templates ────────────────────────────────────────────────────────────────
const TEMPLATES = [
  {
    id: 'blank', name: 'Blank', icon: FiFile, color: '#888',
    desc: 'Start from scratch with HTML, CSS & JS',
    files: [
      { name: 'index.html', content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Project</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Hello World</h1>
  <p>Edit this file or ask the AI to build something!</p>
  <button id="btn">Click me</button>
  <script src="app.js"></script>
</body>
</html>` },
      { name: 'style.css', content: `* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, sans-serif; background: #f8f9fa; color: #212529; padding: 40px; }
h1 { font-size: 2rem; margin-bottom: 12px; color: #437DFD; }
p  { font-size: 1rem; color: #666; line-height: 1.6; margin-bottom: 20px; }
button { padding: 10px 22px; background: #437DFD; color: #fff; border: none; border-radius: 8px; font-size: 15px; cursor: pointer; }
button:hover { background: #2C76FF; }` },
      { name: 'app.js', content: `document.getElementById('btn').addEventListener('click', () => {
  alert('Hello from JavaScript!');
});` },
    ],
  },
  {
    id: 'landing', name: 'Landing Page', icon: FiGlobe, color: '#437DFD',
    desc: 'Modern glassmorphism landing with animations',
    files: [
      { name: 'index.html', content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Launch — The Future Platform</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="bg-gradient"></div>
  <nav>
    <div class="logo"><span class="logo-dot"></span>Launch</div>
    <div class="nav-links">
      <a href="#features">Features</a>
      <a href="#pricing">Pricing</a>
      <a class="nav-cta" href="#start">Get Started</a>
    </div>
  </nav>
  <section class="hero">
    <div class="hero-badge">✨ Introducing v2.0 — Now with AI</div>
    <h1>Build <span class="grad">beautiful apps</span><br>in minutes</h1>
    <p>The modern platform trusted by 50,000+ developers worldwide. Ship faster, scale effortlessly.</p>
    <div class="hero-btns">
      <a href="#start" class="btn-primary">Start for free →</a>
      <a href="#demo" class="btn-ghost">Watch demo ▶</a>
    </div>
    <div class="hero-stats">
      <div class="stat"><strong>50K+</strong><span>Users</span></div>
      <div class="stat-divider"></div>
      <div class="stat"><strong>99.9%</strong><span>Uptime</span></div>
      <div class="stat-divider"></div>
      <div class="stat"><strong>4.9★</strong><span>Rating</span></div>
    </div>
  </section>
  <section id="features" class="features">
    <div class="section-label">Features</div>
    <h2>Everything you need to ship</h2>
    <div class="features-grid">
      <div class="feature-card">
        <div class="feat-icon">⚡</div>
        <h3>Lightning Fast</h3>
        <p>Global CDN ensures <100ms load times for users anywhere in the world.</p>
      </div>
      <div class="feature-card">
        <div class="feat-icon">🔒</div>
        <h3>Enterprise Security</h3>
        <p>SOC 2 certified with end-to-end encryption and zero-trust architecture.</p>
      </div>
      <div class="feature-card">
        <div class="feat-icon">📊</div>
        <h3>Deep Analytics</h3>
        <p>Real-time insights into user behavior, performance, and conversion.</p>
      </div>
      <div class="feature-card">
        <div class="feat-icon">🤖</div>
        <h3>AI-Powered</h3>
        <p>Built-in AI tools that automate workflows and supercharge productivity.</p>
      </div>
      <div class="feature-card">
        <div class="feat-icon">🌍</div>
        <h3>Global Scale</h3>
        <p>Auto-scales to handle millions of requests with zero configuration.</p>
      </div>
      <div class="feature-card">
        <div class="feat-icon">🎨</div>
        <h3>Beautiful UI</h3>
        <p>Designer-crafted components that make your product look incredible.</p>
      </div>
    </div>
  </section>
  <section class="cta-section" id="start">
    <h2>Ready to launch?</h2>
    <p>Join 50,000+ teams building the future.</p>
    <a href="#" class="btn-primary">Get started free</a>
  </section>
  <footer>
    <div class="logo"><span class="logo-dot"></span>Launch</div>
    <p>© 2025 Launch Inc. All rights reserved.</p>
  </footer>
  <script src="app.js"></script>
</body>
</html>` },
      { name: 'style.css', content: `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { font-family: -apple-system, 'Inter', sans-serif; background: #050811; color: #e8eaf0; min-height: 100vh; overflow-x: hidden; }

.bg-gradient { position: fixed; inset: 0; background: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(67,125,253,0.15), transparent), radial-gradient(ellipse 60% 40% at 80% 60%, rgba(123,97,255,0.08), transparent); pointer-events: none; z-index: 0; }

nav { position: fixed; top: 0; left: 0; right: 0; height: 64px; display: flex; align-items: center; justify-content: space-between; padding: 0 6%; background: rgba(5,8,17,0.8); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.06); z-index: 100; }
.logo { display: flex; align-items: center; gap: 8px; font-size: 18px; font-weight: 800; letter-spacing: -0.03em; color: #fff; }
.logo-dot { width: 10px; height: 10px; border-radius: 50%; background: linear-gradient(135deg, #437DFD, #7B61FF); box-shadow: 0 0 12px rgba(67,125,253,0.6); }
.nav-links { display: flex; align-items: center; gap: 32px; }
.nav-links a { color: rgba(255,255,255,0.6); text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.2s; }
.nav-links a:hover { color: #fff; }
.nav-cta { background: rgba(67,125,253,0.15) !important; color: #437DFD !important; padding: 8px 18px; border-radius: 8px; border: 1px solid rgba(67,125,253,0.3) !important; transition: all 0.2s !important; }
.nav-cta:hover { background: rgba(67,125,253,0.25) !important; color: #7badfd !important; }

.hero { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 160px 6% 100px; }
.hero-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 16px; background: rgba(67,125,253,0.1); border: 1px solid rgba(67,125,253,0.25); border-radius: 99px; font-size: 13px; color: rgba(255,255,255,0.7); margin-bottom: 28px; }
h1 { font-size: clamp(36px, 6vw, 72px); font-weight: 900; letter-spacing: -0.04em; line-height: 1.1; margin-bottom: 20px; color: #fff; }
.grad { background: linear-gradient(135deg, #437DFD 0%, #7B61FF 50%, #FD5B5D 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.hero p { font-size: 18px; color: rgba(255,255,255,0.5); max-width: 520px; line-height: 1.7; margin-bottom: 36px; }
.hero-btns { display: flex; gap: 12px; justify-content: center; margin-bottom: 60px; }
.btn-primary { display: inline-flex; align-items: center; gap: 6px; padding: 14px 28px; background: linear-gradient(135deg, #437DFD, #2C76FF); color: #fff; text-decoration: none; border-radius: 10px; font-size: 15px; font-weight: 700; box-shadow: 0 8px 32px rgba(67,125,253,0.35); transition: all 0.2s; border: none; cursor: pointer; }
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(67,125,253,0.5); }
.btn-ghost { display: inline-flex; align-items: center; gap: 6px; padding: 14px 28px; background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.7); text-decoration: none; border-radius: 10px; font-size: 15px; font-weight: 600; border: 1px solid rgba(255,255,255,0.1); transition: all 0.2s; }
.btn-ghost:hover { background: rgba(255,255,255,0.08); color: #fff; }
.hero-stats { display: flex; align-items: center; gap: 24px; opacity: 0.7; }
.stat { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.stat strong { font-size: 20px; font-weight: 800; color: #fff; }
.stat span { font-size: 12px; color: rgba(255,255,255,0.5); }
.stat-divider { width: 1px; height: 32px; background: rgba(255,255,255,0.15); }

.features { position: relative; z-index: 1; padding: 80px 6%; }
.section-label { font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #437DFD; margin-bottom: 12px; text-align: center; }
.features h2 { font-size: clamp(28px, 4vw, 44px); font-weight: 800; letter-spacing: -0.03em; text-align: center; margin-bottom: 48px; color: #fff; }
.features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; max-width: 1100px; margin: 0 auto; }
.feature-card { padding: 28px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; transition: all 0.25s; cursor: default; }
.feature-card:hover { background: rgba(255,255,255,0.06); border-color: rgba(67,125,253,0.25); transform: translateY(-4px); }
.feat-icon { font-size: 28px; margin-bottom: 16px; }
.feature-card h3 { font-size: 17px; font-weight: 700; color: #fff; margin-bottom: 8px; }
.feature-card p { font-size: 14px; color: rgba(255,255,255,0.45); line-height: 1.7; }

.cta-section { position: relative; z-index: 1; text-align: center; padding: 100px 6%; }
.cta-section h2 { font-size: clamp(28px, 4vw, 48px); font-weight: 800; letter-spacing: -0.03em; color: #fff; margin-bottom: 12px; }
.cta-section p { font-size: 18px; color: rgba(255,255,255,0.5); margin-bottom: 36px; }

footer { position: relative; z-index: 1; border-top: 1px solid rgba(255,255,255,0.06); padding: 32px 6%; display: flex; align-items: center; justify-content: space-between; }
footer p { font-size: 13px; color: rgba(255,255,255,0.3); }

.fade-up { opacity: 0; transform: translateY(24px); transition: all 0.6s ease; }
.fade-up.visible { opacity: 1; transform: translateY(0); }` },
      { name: 'app.js', content: `// Scroll animations
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });

document.querySelectorAll('.feature-card, .hero-badge, .cta-section h2').forEach(el => {
  el.classList.add('fade-up');
  observer.observe(el);
});

// Stagger feature cards
document.querySelectorAll('.feature-card').forEach((card, i) => {
  card.style.transitionDelay = \`\${i * 0.08}s\`;
});` },
    ],
  },
  {
    id: '3d', name: '3D Landing', icon: FiBox, color: '#7B61FF',
    desc: 'Interactive Three.js 3D scene with particles',
    files: [
      { name: 'index.html', content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nexus — 3D Experience</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <canvas id="bg"></canvas>
  <div class="ui">
    <nav>
      <div class="brand">◈ NEXUS</div>
      <div class="nav-right">
        <a href="#">About</a>
        <a href="#" class="btn-outline">Launch App</a>
      </div>
    </nav>
    <section class="hero">
      <div class="eyebrow">Next-generation platform</div>
      <h1>Explore the<br><span>Digital Frontier</span></h1>
      <p>An immersive 3D experience built for the future web. Infinite possibilities, zero limits.</p>
      <div class="hero-actions">
        <button class="btn-cta" id="enterBtn">Enter Experience →</button>
      </div>
    </section>
    <div class="scroll-hint">scroll to explore ↓</div>
  </div>
  <script src="app.js"></script>
</body>
</html>` },
      { name: 'style.css', content: `* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 100%; height: 100%; overflow: hidden; }
body { font-family: -apple-system, 'SF Pro Display', sans-serif; background: #000; color: #fff; }
#bg { position: fixed; inset: 0; z-index: 0; }
.ui { position: relative; z-index: 10; height: 100vh; display: flex; flex-direction: column; pointer-events: none; }
nav { display: flex; align-items: center; justify-content: space-between; padding: 24px 48px; pointer-events: all; }
.brand { font-size: 20px; font-weight: 900; letter-spacing: 0.1em; color: #fff; }
.nav-right { display: flex; align-items: center; gap: 32px; }
.nav-right a { color: rgba(255,255,255,0.6); text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.2s; }
.nav-right a:hover { color: #fff; }
.btn-outline { padding: 8px 20px; border: 1px solid rgba(255,255,255,0.25) !important; border-radius: 8px !important; backdrop-filter: blur(10px); background: rgba(255,255,255,0.05) !important; transition: all 0.2s !important; color: rgba(255,255,255,0.8) !important; }
.btn-outline:hover { border-color: rgba(255,255,255,0.6) !important; background: rgba(255,255,255,0.1) !important; color: #fff !important; }
.hero { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 0 24px; pointer-events: all; }
.eyebrow { font-size: 12px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(150,120,255,0.8); margin-bottom: 20px; }
h1 { font-size: clamp(42px, 7vw, 88px); font-weight: 900; letter-spacing: -0.04em; line-height: 1.05; margin-bottom: 20px; }
h1 span { background: linear-gradient(135deg, #a78bfa, #60a5fa, #f472b6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
p { font-size: 18px; color: rgba(255,255,255,0.5); max-width: 480px; line-height: 1.7; margin-bottom: 40px; }
.hero-actions { pointer-events: all; }
.btn-cta { padding: 16px 36px; background: linear-gradient(135deg, #7B61FF, #437DFD); color: #fff; border: none; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; box-shadow: 0 8px 32px rgba(123,97,255,0.4); transition: all 0.2s; }
.btn-cta:hover { transform: translateY(-3px); box-shadow: 0 16px 48px rgba(123,97,255,0.5); }
.scroll-hint { text-align: center; padding-bottom: 32px; font-size: 12px; color: rgba(255,255,255,0.25); letter-spacing: 0.1em; pointer-events: none; animation: fadeInOut 3s ease-in-out infinite; }
@keyframes fadeInOut { 0%,100%{opacity:0.3} 50%{opacity:0.7} }` },
      { name: 'app.js', content: `const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('bg'), antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.z = 5;

// Particle galaxy
const particleCount = 3000;
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
const colors = new Float32Array(particleCount * 3);
const colorPalette = [
  new THREE.Color('#7B61FF'), new THREE.Color('#437DFD'),
  new THREE.Color('#60a5fa'), new THREE.Color('#f472b6'),
];
for (let i = 0; i < particleCount; i++) {
  const r = Math.random() * 8 + 1;
  const theta = Math.random() * Math.PI * 2;
  const phi   = Math.random() * Math.PI;
  positions[i*3]   = r * Math.sin(phi) * Math.cos(theta);
  positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta) * 0.4;
  positions[i*3+2] = r * Math.cos(phi);
  const c = colorPalette[Math.floor(Math.random() * colorPalette.length)];
  colors[i*3] = c.r; colors[i*3+1] = c.g; colors[i*3+2] = c.b;
}
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
const material = new THREE.PointsMaterial({ size: 0.028, vertexColors: true, transparent: true, opacity: 0.85 });
const particles = new THREE.Points(geometry, material);
scene.add(particles);

// Floating torus knot
const torusGeo = new THREE.TorusKnotGeometry(1.1, 0.32, 120, 16);
const torusMat = new THREE.MeshStandardMaterial({ color: '#7B61FF', wireframe: true, opacity: 0.18, transparent: true });
const torus = new THREE.Mesh(torusGeo, torusMat);
scene.add(torus);

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0x7B61FF, 2, 20);
pointLight.position.set(2, 3, 2);
scene.add(pointLight);
const pointLight2 = new THREE.PointLight(0x437DFD, 1.5, 20);
pointLight2.position.set(-3, -2, 1);
scene.add(pointLight2);

let mouseX = 0, mouseY = 0;
document.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
  mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

document.getElementById('enterBtn')?.addEventListener('click', () => {
  document.querySelector('.hero').style.opacity = '0';
  document.querySelector('.hero').style.transition = 'opacity 1s';
  setTimeout(() => {
    torus.material.opacity = 0.6;
    particles.material.size = 0.045;
  }, 800);
});

let t = 0;
function animate() {
  requestAnimationFrame(animate);
  t += 0.004;
  particles.rotation.y = t * 0.12;
  particles.rotation.x = t * 0.04;
  torus.rotation.x = t * 0.3;
  torus.rotation.y = t * 0.5;
  camera.position.x += (mouseX * 1.2 - camera.position.x) * 0.04;
  camera.position.y += (-mouseY * 0.8 - camera.position.y) * 0.04;
  camera.lookAt(scene.position);
  renderer.render(scene, camera);
}
animate();` },
    ],
  },
  {
    id: 'dashboard', name: 'Dashboard App', icon: FiBarChart2, color: '#00C48C',
    desc: 'Analytics dashboard with charts and stats',
    files: [
      { name: 'index.html', content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pulse — Analytics Dashboard</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="app">
    <aside class="sidebar">
      <div class="sidebar-logo">◈ Pulse</div>
      <nav class="sidebar-nav">
        <a href="#" class="nav-item active"><span>📊</span> Dashboard</a>
        <a href="#" class="nav-item"><span>📈</span> Analytics</a>
        <a href="#" class="nav-item"><span>👥</span> Users</a>
        <a href="#" class="nav-item"><span>🛒</span> Sales</a>
        <a href="#" class="nav-item"><span>⚙️</span> Settings</a>
      </nav>
    </aside>
    <main class="main">
      <header class="top-bar">
        <div>
          <h1>Dashboard</h1>
          <p class="subtitle">Welcome back, Alex</p>
        </div>
        <div class="top-actions">
          <button class="btn-outline">Export</button>
          <button class="btn-primary">+ New Report</button>
        </div>
      </header>
      <div class="stats-row">
        <div class="stat-card"><div class="stat-label">Total Revenue</div><div class="stat-value">$48,295</div><div class="stat-change positive">↑ 12.5%</div></div>
        <div class="stat-card"><div class="stat-label">Active Users</div><div class="stat-value">8,412</div><div class="stat-change positive">↑ 8.1%</div></div>
        <div class="stat-card"><div class="stat-label">Conversion</div><div class="stat-value">3.24%</div><div class="stat-change negative">↓ 0.4%</div></div>
        <div class="stat-card"><div class="stat-label">Avg. Session</div><div class="stat-value">4m 32s</div><div class="stat-change positive">↑ 1.2%</div></div>
      </div>
      <div class="charts-row">
        <div class="chart-card wide">
          <div class="card-header"><h3>Revenue Overview</h3><select><option>Last 7 days</option><option>30 days</option><option>3 months</option></select></div>
          <canvas id="revenueChart" height="180"></canvas>
        </div>
        <div class="chart-card">
          <div class="card-header"><h3>Traffic Sources</h3></div>
          <div id="donut"></div>
          <div class="donut-legend" id="donutLegend"></div>
        </div>
      </div>
      <div class="table-card">
        <div class="card-header"><h3>Recent Orders</h3><a href="#">View all →</a></div>
        <table>
          <thead><tr><th>Order</th><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
          <tbody id="ordersTable"></tbody>
        </table>
      </div>
    </main>
  </div>
  <script src="app.js"></script>
</body>
</html>` },
      { name: 'style.css', content: `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, 'Inter', sans-serif; background: #F0F2F5; color: #1a1a2e; }
.app { display: flex; height: 100vh; overflow: hidden; }
.sidebar { width: 220px; background: #0f0f1a; display: flex; flex-direction: column; padding: 24px 0; flex-shrink: 0; }
.sidebar-logo { font-size: 18px; font-weight: 800; color: #fff; padding: 0 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.07); margin-bottom: 12px; letter-spacing: -0.02em; }
.sidebar-nav { display: flex; flex-direction: column; gap: 2px; padding: 0 12px; }
.nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.45); text-decoration: none; transition: all 0.15s; }
.nav-item:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.8); }
.nav-item.active { background: rgba(0,196,140,0.15); color: #00C48C; }
.main { flex: 1; overflow-y: auto; }
.top-bar { display: flex; align-items: center; justify-content: space-between; padding: 28px 28px 0; }
.top-bar h1 { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
.subtitle { font-size: 13px; color: #888; margin-top: 2px; }
.top-actions { display: flex; gap: 10px; }
.btn-primary { padding: 9px 18px; background: #437DFD; color: #fff; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-outline { padding: 9px 18px; background: #fff; color: #444; border: 1px solid rgba(0,0,0,0.12); border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; padding: 20px 28px 0; }
.stat-card { background: #fff; border-radius: 14px; padding: 18px 20px; border: 1px solid rgba(0,0,0,0.06); }
.stat-label { font-size: 12px; color: #888; font-weight: 500; margin-bottom: 8px; }
.stat-value { font-size: 24px; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 4px; }
.stat-change { font-size: 12px; font-weight: 600; }
.stat-change.positive { color: #00C48C; }
.stat-change.negative { color: #FD5B5D; }
.charts-row { display: grid; grid-template-columns: 1fr 320px; gap: 16px; padding: 16px 28px 0; }
.chart-card { background: #fff; border-radius: 14px; padding: 20px; border: 1px solid rgba(0,0,0,0.06); }
.chart-card.wide {}
.card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.card-header h3 { font-size: 14px; font-weight: 700; }
.card-header select, .card-header a { font-size: 12px; color: #437DFD; border: 1px solid rgba(67,125,253,0.2); border-radius: 6px; padding: 4px 8px; outline: none; text-decoration: none; font-weight: 600; }
#donut { display: flex; justify-content: center; margin: 8px 0; }
.donut-legend { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
.legend-item { display: flex; align-items: center; gap: 8px; font-size: 12px; }
.legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.legend-val { margin-left: auto; font-weight: 700; font-size: 13px; }
.table-card { background: #fff; border-radius: 14px; margin: 16px 28px 28px; padding: 20px; border: 1px solid rgba(0,0,0,0.06); }
table { width: 100%; border-collapse: collapse; }
thead th { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #aaa; padding: 8px 12px; text-align: left; border-bottom: 1px solid rgba(0,0,0,0.07); }
tbody td { padding: 12px 12px; font-size: 13px; border-bottom: 1px solid rgba(0,0,0,0.04); }
tbody tr:last-child td { border-bottom: none; }
.status-badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 700; }
.status-badge.paid { background: rgba(0,196,140,0.1); color: #00C48C; }
.status-badge.pending { background: rgba(255,140,66,0.1); color: #FF8C42; }
.status-badge.failed { background: rgba(253,91,93,0.1); color: #FD5B5D; }` },
      { name: 'app.js', content: `// Revenue bar chart
const canvas = document.getElementById('revenueChart');
const ctx = canvas.getContext('2d');
canvas.width = canvas.parentElement.offsetWidth - 40;
const data = [4200, 5800, 4900, 7200, 6100, 8400, 7900];
const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const max = Math.max(...data) * 1.2;
const barW = (canvas.width - 60) / data.length - 10;
const h = 180;

data.forEach((v, i) => {
  const x = 30 + i * ((canvas.width - 60) / data.length);
  const barH = (v / max) * (h - 40);
  const grad = ctx.createLinearGradient(0, h - 20 - barH, 0, h - 20);
  grad.addColorStop(0, '#437DFD');
  grad.addColorStop(1, 'rgba(67,125,253,0.2)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(x, h - 20 - barH, barW, barH, [4, 4, 0, 0]);
  ctx.fill();
  ctx.fillStyle = '#aaa';
  ctx.font = '11px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(labels[i], x + barW / 2, h - 4);
  ctx.fillStyle = '#555';
  ctx.font = '10px system-ui';
  ctx.fillText('$' + (v/1000).toFixed(1) + 'k', x + barW / 2, h - 20 - barH - 5);
});

// Donut chart
const donutData = [{ label: 'Organic', value: 42, color: '#437DFD' }, { label: 'Social', value: 28, color: '#7B61FF' }, { label: 'Paid', value: 18, color: '#00C48C' }, { label: 'Direct', value: 12, color: '#FF8C42' }];
const dc = document.createElement('canvas'); dc.width = 120; dc.height = 120;
const dx = dc.getContext('2d');
let angle = -Math.PI / 2, total = donutData.reduce((s, d) => s + d.value, 0);
donutData.forEach(d => {
  const slice = (d.value / total) * Math.PI * 2;
  dx.beginPath(); dx.moveTo(60, 60);
  dx.arc(60, 60, 50, angle, angle + slice);
  dx.closePath(); dx.fillStyle = d.color; dx.fill();
  angle += slice;
});
dx.beginPath(); dx.arc(60, 60, 30, 0, Math.PI * 2); dx.fillStyle = '#fff'; dx.fill();
document.getElementById('donut').appendChild(dc);
const leg = document.getElementById('donutLegend');
donutData.forEach(d => { leg.innerHTML += \`<div class="legend-item"><div class="legend-dot" style="background:\${d.color}"></div><span>\${d.label}</span><span class="legend-val">\${d.value}%</span></div>\`; });

// Orders table
const orders = [
  { id: '#ORD-1042', customer: 'Sarah Chen', amount: '$234.00', status: 'paid', date: 'Jan 12' },
  { id: '#ORD-1041', customer: 'Mike Johnson', amount: '$89.50', status: 'pending', date: 'Jan 12' },
  { id: '#ORD-1040', customer: 'Priya Sharma', amount: '$412.00', status: 'paid', date: 'Jan 11' },
  { id: '#ORD-1039', customer: 'James Wilson', amount: '$156.75', status: 'failed', date: 'Jan 11' },
  { id: '#ORD-1038', customer: 'Emma Davis', amount: '$298.00', status: 'paid', date: 'Jan 10' },
];
const tbody = document.getElementById('ordersTable');
orders.forEach(o => {
  tbody.innerHTML += \`<tr><td><strong>\${o.id}</strong></td><td>\${o.customer}</td><td>\${o.amount}</td><td><span class="status-badge \${o.status}">\${o.status}</span></td><td>\${o.date}</td></tr>\`;
});` },
    ],
  },
  {
    id: 'portfolio', name: 'Portfolio', icon: FiUser, color: '#FF8C42',
    desc: 'Creative portfolio with grid & animations',
    files: [
      { name: 'index.html', content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alex Morgan — Designer & Developer</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <nav><div class="brand">AM.</div><div class="nav-right"><a href="#work">Work</a><a href="#about">About</a><a href="#contact" class="hire-btn">Hire me</a></div></nav>
  <section class="hero">
    <div class="hero-tag">Available for freelance</div>
    <h1>I design & build<br><span>digital products</span><br>people love.</h1>
    <p>Senior product designer & frontend developer with 5+ years crafting beautiful, functional experiences.</p>
    <div class="hero-cta"><a href="#work" class="btn-primary">View my work ↓</a></div>
    <div class="hero-logos"><span>Worked with</span><strong>Airbnb</strong><strong>Stripe</strong><strong>Figma</strong><strong>Notion</strong></div>
  </section>
  <section id="work" class="work">
    <h2>Selected Work</h2>
    <div class="work-grid" id="workGrid"></div>
  </section>
  <section id="about" class="about">
    <div class="about-text">
      <h2>About me</h2>
      <p>I'm Alex, a product designer and developer based in San Francisco. I specialize in creating user-centered digital experiences that balance beauty with functionality.</p>
      <p>When I'm not designing, you'll find me hiking, reading about cognitive psychology, or experimenting with generative art.</p>
      <div class="skills">
        <span class="skill">Figma</span><span class="skill">React</span><span class="skill">CSS</span><span class="skill">Motion</span><span class="skill">TypeScript</span><span class="skill">Design Systems</span>
      </div>
    </div>
    <div class="about-img"><div class="img-placeholder">AM</div></div>
  </section>
  <footer id="contact">
    <h2>Let's work together</h2>
    <a href="mailto:alex@design.co" class="email-link">alex@design.co →</a>
    <div class="socials"><a href="#">Twitter</a><a href="#">LinkedIn</a><a href="#">Dribbble</a></div>
    <p class="copyright">© 2025 Alex Morgan</p>
  </footer>
  <script src="app.js"></script>
</body>
</html>` },
      { name: 'style.css', content: `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, 'Helvetica Neue', sans-serif; background: #fff; color: #111; }
nav { display: flex; align-items: center; justify-content: space-between; padding: 24px 6%; position: sticky; top: 0; background: rgba(255,255,255,0.9); backdrop-filter: blur(20px); z-index: 100; border-bottom: 1px solid rgba(0,0,0,0.06); }
.brand { font-size: 22px; font-weight: 900; letter-spacing: -0.05em; }
.nav-right { display: flex; align-items: center; gap: 28px; }
.nav-right a { color: #555; text-decoration: none; font-size: 14px; font-weight: 500; }
.hire-btn { background: #111 !important; color: #fff !important; padding: 8px 18px; border-radius: 99px; }
.hero { padding: 80px 6% 100px; max-width: 900px; }
.hero-tag { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 99px; background: rgba(0,196,140,0.1); color: #00A876; font-size: 13px; font-weight: 600; margin-bottom: 28px; border: 1px solid rgba(0,196,140,0.2); }
.hero-tag::before { content: '●'; font-size: 8px; animation: pulse 2s ease-in-out infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
h1 { font-size: clamp(40px, 6vw, 78px); font-weight: 900; letter-spacing: -0.05em; line-height: 1.05; margin-bottom: 24px; }
h1 span { color: #437DFD; }
.hero p { font-size: 18px; color: #666; max-width: 500px; line-height: 1.7; margin-bottom: 36px; }
.hero-cta { margin-bottom: 48px; }
.btn-primary { display: inline-flex; align-items: center; gap: 8px; padding: 14px 28px; background: #111; color: #fff; text-decoration: none; border-radius: 10px; font-size: 15px; font-weight: 700; transition: all 0.2s; }
.btn-primary:hover { background: #333; transform: translateY(-2px); }
.hero-logos { display: flex; align-items: center; gap: 20px; font-size: 14px; color: #aaa; }
.hero-logos strong { color: #555; font-weight: 600; }
.work { padding: 60px 6%; }
.work h2 { font-size: clamp(24px, 3vw, 36px); font-weight: 800; letter-spacing: -0.03em; margin-bottom: 36px; }
.work-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
.work-item { border-radius: 16px; overflow: hidden; cursor: pointer; transition: transform 0.3s; }
.work-item:hover { transform: translateY(-6px); }
.work-thumb { height: 220px; display: flex; align-items: center; justify-content: center; font-size: 48px; }
.work-info { padding: 16px; background: #f8f9fa; }
.work-info h3 { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
.work-info p { font-size: 12px; color: #888; }
.about { display: flex; align-items: center; gap: 80px; padding: 80px 6%; background: #f8f9fa; }
.about-text { flex: 1; }
.about h2 { font-size: 32px; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 20px; }
.about p { font-size: 16px; color: #555; line-height: 1.8; margin-bottom: 16px; }
.skills { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 24px; }
.skill { padding: 6px 14px; background: #fff; border: 1px solid rgba(0,0,0,0.1); border-radius: 99px; font-size: 13px; font-weight: 600; color: #444; }
.about-img { flex-shrink: 0; }
.img-placeholder { width: 240px; height: 300px; background: linear-gradient(135deg, #437DFD, #7B61FF); border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 64px; font-weight: 900; color: #fff; letter-spacing: -0.05em; }
footer { padding: 80px 6%; text-align: center; }
footer h2 { font-size: 40px; font-weight: 900; letter-spacing: -0.04em; margin-bottom: 16px; }
.email-link { display: inline-block; font-size: 22px; font-weight: 700; color: #437DFD; text-decoration: none; margin-bottom: 32px; }
.socials { display: flex; gap: 20px; justify-content: center; margin-bottom: 48px; }
.socials a { color: #888; text-decoration: none; font-size: 14px; font-weight: 500; }
.copyright { font-size: 13px; color: #ccc; }` },
      { name: 'app.js', content: `const projects = [
  { title: 'Pulse Analytics', desc: 'Dashboard & data viz', emoji: '📊', bg: 'linear-gradient(135deg,#437DFD22,#7B61FF22)', tags: 'Web App' },
  { title: 'Bloom — Plant App', desc: 'iOS & Android', emoji: '🌿', bg: 'linear-gradient(135deg,#00C48C22,#00A87622)', tags: 'Mobile' },
  { title: 'Frame Design System', desc: '80+ components', emoji: '⚡', bg: 'linear-gradient(135deg,#FF8C4222,#FD5B5D22)', tags: 'Design System' },
  { title: 'Orbit SaaS Platform', desc: 'B2B productivity tool', emoji: '🚀', bg: 'linear-gradient(135deg,#7B61FF22,#437DFD22)', tags: 'SaaS' },
  { title: 'Koto — Finance App', desc: 'Personal budgeting', emoji: '💰', bg: 'linear-gradient(135deg,#00C48C22,#437DFD22)', tags: 'Fintech' },
  { title: 'Waves Music Player', desc: 'Generative cover art', emoji: '🎵', bg: 'linear-gradient(135deg,#FD5B5D22,#FF8C4222)', tags: 'Creative' },
];
const grid = document.getElementById('workGrid');
projects.forEach(p => {
  grid.innerHTML += \`
    <div class="work-item">
      <div class="work-thumb" style="background:\${p.bg}">\${p.emoji}</div>
      <div class="work-info"><h3>\${p.title}</h3><p>\${p.desc} · \${p.tags}</p></div>
    </div>
  \`;
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.style.opacity = '1'; e.target.style.transform = 'translateY(0)'; } });
}, { threshold: 0.1 });
document.querySelectorAll('.work-item').forEach((el, i) => {
  el.style.cssText = 'opacity:0;transform:translateY(30px);transition:all 0.5s ease ' + (i * 0.08) + 's';
  observer.observe(el);
});` },
    ],
  },
  {
    id: 'game', name: 'Canvas Game', icon: FiGrid, color: '#FD5B5D',
    desc: 'Playable Breakout-style canvas game',
    files: [
      { name: 'index.html', content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Neon Breaker</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="wrapper">
    <div class="hud"><span id="scoreDisplay">SCORE: 0</span><span id="livesDisplay">LIVES: ♥♥♥</span></div>
    <canvas id="game"></canvas>
    <div class="hint">← → Arrow Keys  ·  Space to Start</div>
  </div>
  <script src="app.js"></script>
</body>
</html>` },
      { name: 'style.css', content: `* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #050811; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: 'Courier New', monospace; overflow: hidden; }
.wrapper { display: flex; flex-direction: column; align-items: center; gap: 12px; }
.hud { display: flex; justify-content: space-between; width: 480px; font-size: 13px; font-weight: 700; letter-spacing: 0.08em; color: rgba(255,255,255,0.5); }
#game { border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); }
.hint { font-size: 11px; color: rgba(255,255,255,0.2); letter-spacing: 0.1em; }` },
      { name: 'app.js', content: `const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = 480; canvas.height = 360;

let score = 0, lives = 3, state = 'start';
const COLORS = ['#437DFD','#7B61FF','#00C48C','#FF8C42','#FD5B5D'];

const ball = { x:240, y:320, vx:3, vy:-4, r:7 };
const pad  = { x:190, y:340, w:100, h:12, speed:6 };
const keys = {};

const COLS = 8, ROWS = 5, BW = 52, BH = 18, GAP = 4;
const offX = (480 - COLS*(BW+GAP)) / 2;
let bricks = [];
function initBricks() {
  bricks = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      bricks.push({ x: offX + c*(BW+GAP), y: 40 + r*(BH+GAP), w:BW, h:BH, color:COLORS[r%COLORS.length], alive:true });
}
initBricks();

document.addEventListener('keydown', e => { keys[e.key] = true; if (e.key === ' ') { if (state === 'start' || state === 'dead') start(); } });
document.addEventListener('keyup', e => { keys[e.key] = false; });

function start() { state = 'play'; ball.x=pad.x+pad.w/2; ball.y=335; ball.vx=3.5*(Math.random()>.5?1:-1); ball.vy=-4.5; }

function update() {
  if (state !== 'play') return;
  if (keys['ArrowLeft']) pad.x = Math.max(0, pad.x - pad.speed);
  if (keys['ArrowRight']) pad.x = Math.min(480 - pad.w, pad.x + pad.speed);

  ball.x += ball.vx; ball.y += ball.vy;
  if (ball.x < ball.r || ball.x > 480-ball.r) ball.vx *= -1;
  if (ball.y < ball.r) ball.vy *= -1;
  if (ball.y > 370) { lives--; document.getElementById('livesDisplay').textContent = 'LIVES: ' + '♥'.repeat(Math.max(0,lives)) + '♡'.repeat(Math.max(0,3-lives)); if (lives <= 0) { state = 'over'; } else { state = 'dead'; ball.x=pad.x+pad.w/2; ball.y=335; } }
  if (ball.y+ball.r > pad.y && ball.x > pad.x && ball.x < pad.x+pad.w && ball.vy > 0) {
    ball.vy *= -1; ball.vx += (ball.x-(pad.x+pad.w/2))*0.08;
  }
  bricks.forEach(b => {
    if (!b.alive) return;
    if (ball.x>b.x && ball.x<b.x+b.w && ball.y>b.y && ball.y<b.y+b.h) {
      b.alive=false; ball.vy*=-1; score+=10;
      document.getElementById('scoreDisplay').textContent='SCORE: '+score;
    }
  });
  if (bricks.every(b=>!b.alive)) { initBricks(); ball.vy = Math.min(ball.vy-0.5, -3); }
}

function draw() {
  ctx.fillStyle='#050811'; ctx.fillRect(0,0,480,360);
  ctx.strokeStyle='rgba(255,255,255,0.03)';
  for(let i=0;i<480;i+=20){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,360);ctx.stroke();}
  for(let i=0;i<360;i+=20){ctx.beginPath();ctx.moveTo(0,i);ctx.lineTo(480,i);ctx.stroke();}

  bricks.forEach(b => {
    if (!b.alive) return;
    ctx.fillStyle = b.color + '33';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = b.color;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(b.x+0.5, b.y+0.5, b.w-1, b.h-1);
    ctx.lineWidth = 1;
  });

  const pg = ctx.createLinearGradient(pad.x, pad.y, pad.x+pad.w, pad.y+pad.h);
  pg.addColorStop(0,'#437DFD'); pg.addColorStop(1,'#7B61FF');
  ctx.fillStyle=pg; ctx.beginPath(); ctx.roundRect(pad.x, pad.y, pad.w, pad.h, 6); ctx.fill();
  ctx.shadowBlur=12; ctx.shadowColor='#437DFD';

  const bg = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, ball.r);
  bg.addColorStop(0,'#fff'); bg.addColorStop(1,'#437DFD');
  ctx.fillStyle=bg; ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur=20; ctx.shadowColor='#437DFD80';
  ctx.shadowBlur=0;

  if (state==='start'||state==='dead') {
    ctx.fillStyle='rgba(255,255,255,0.6)'; ctx.font='bold 16px Courier New'; ctx.textAlign='center';
    ctx.fillText(state==='start'?'PRESS SPACE TO START':'PRESS SPACE TO CONTINUE', 240, 200);
  }
  if (state==='over') {
    ctx.fillStyle='rgba(0,0,0,0.7)'; ctx.fillRect(0,0,480,360);
    ctx.fillStyle='#FD5B5D'; ctx.font='bold 28px Courier New'; ctx.textAlign='center'; ctx.fillText('GAME OVER', 240, 170);
    ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.font='14px Courier New'; ctx.fillText('SCORE: '+score, 240, 200);
    ctx.fillText('PRESS SPACE TO RESTART', 240, 230);
    document.addEventListener('keydown', e => { if(e.key===' '&&state==='over'){score=0;lives=3;initBricks();document.getElementById('scoreDisplay').textContent='SCORE: 0';document.getElementById('livesDisplay').textContent='LIVES: ♥♥♥';state='start';} }, {once:true});
  }
}

function loop() { update(); draw(); requestAnimationFrame(loop); }
loop();` },
    ],
  },
];

// ── LivePreview component ─────────────────────────────────────────────────────
const VIEWPORTS = {
  desktop: { width: '100%',  label: 'Desktop', icon: FiMonitor },
  tablet:  { width: '768px', label: 'Tablet',  icon: FiTablet },
  mobile:  { width: '375px', label: 'Mobile',  icon: FiSmartphone },
};

const LivePreview = ({ html, viewport, onRefresh }) => {
  const [key, setKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const w = VIEWPORTS[viewport]?.width || '100%';
  const isConstrained = w !== '100%';

  useEffect(() => { setLoading(true); setKey(k => k + 1); }, [html]);

  if (!html) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: '#F5F4F2' }}>
      <FiMonitor size={40} style={{ color: '#ddd' }}/>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#bbb', marginBottom: 6 }}>No HTML file found</div>
        <div style={{ fontSize: 12, color: '#ccc' }}>Create an index.html or ask AI to build something</div>
      </div>
    </div>
  );

  return (
    <div style={{ flex: 1, position: 'relative', background: '#e8e8e8', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: isConstrained ? 'auto' : 'hidden', padding: isConstrained ? '20px 0' : 0 }}>
      {loading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(245,244,242,0.95)', zIndex: 10, pointerEvents: 'none' }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {[0, 0.15, 0.3].map((d, i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#437DFD', animation: `vcDot 1s ease-in-out ${d}s infinite` }}/>
            ))}
          </div>
        </div>
      )}
      <iframe
        key={key}
        srcDoc={html}
        sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
        title="Live Preview"
        onLoad={() => setLoading(false)}
        style={{
          width: w,
          flex: isConstrained ? 'none' : 1,
          height: isConstrained ? '600px' : '100%',
          minHeight: isConstrained ? '600px' : undefined,
          border: 'none',
          background: '#fff',
          boxShadow: isConstrained ? '0 8px 40px rgba(0,0,0,0.25)' : 'none',
          borderRadius: isConstrained ? 10 : 0,
        }}
      />
    </div>
  );
};

// ── Template Picker Modal ─────────────────────────────────────────────────────
const TemplatePicker = ({ onSelect, onClose }) => {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState('landing');

  const tpl = TEMPLATES.find(t => t.id === selected);
  const handleCreate = () => {
    if (!name.trim()) return;
    onSelect(name.trim(), selected);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#fff', borderRadius: 20, width: 620, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.3)', padding: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', color: '#0C0C0C' }}>New Project</h2>
            <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Choose a template to get started</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#555' }}><FiX size={15}/></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
          {TEMPLATES.map(t => {
            const Icon = t.icon;
            const isActive = selected === t.id;
            return (
              <button key={t.id} onClick={() => setSelected(t.id)} style={{
                padding: '14px 12px', borderRadius: 12, cursor: 'pointer', textAlign: 'left', border: 'none',
                background: isActive ? `${t.color}10` : 'rgba(0,0,0,0.03)',
                outline: isActive ? `2px solid ${t.color}` : '2px solid transparent',
                transition: 'all 0.15s',
              }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${t.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <Icon size={16} style={{ color: t.color }}/>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0C0C0C', marginBottom: 3 }}>{t.name}</div>
                <div style={{ fontSize: 11, color: '#aaa', lineHeight: 1.4 }}>{t.desc}</div>
              </button>
            );
          })}
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 8 }}>PROJECT NAME</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder={`My ${tpl?.name || 'Project'}`}
            autoFocus
            style={{ width: '100%', padding: '10px 14px', border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit', color: '#0C0C0C', transition: 'border-color 0.15s' }}
            onFocus={e => e.target.style.borderColor = '#437DFD'}
            onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.12)'}
          />
        </div>

        <button onClick={handleCreate} disabled={!name.trim()} style={{
          width: '100%', padding: '12px', background: name.trim() ? 'linear-gradient(135deg,#437DFD,#2C76FF)' : 'rgba(0,0,0,0.06)',
          border: 'none', borderRadius: 10, color: name.trim() ? '#fff' : '#bbb',
          fontSize: 14, fontWeight: 700, cursor: name.trim() ? 'pointer' : 'not-allowed',
          boxShadow: name.trim() ? '0 4px 16px rgba(67,125,253,0.35)' : 'none',
          transition: 'all 0.15s',
        }}>
          Create Project →
        </button>
      </div>
    </div>
  );
};

// ── File tree ─────────────────────────────────────────────────────────────────
const FileItem = ({ file, active, renaming, renameVal, onOpen, onRename, onRenameSubmit, onDelete, onSetRenaming, onSetRenameVal }) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 6, height: 28, paddingLeft: 12, paddingRight: 6, cursor: 'pointer', background: active ? 'rgba(67,125,253,0.1)' : hov ? 'rgba(0,0,0,0.04)' : 'transparent', borderRadius: 6, marginBottom: 1 }}
    >
      <span style={{ fontSize: 12, flexShrink: 0 }}>{getFileIcon(file.name)}</span>
      {renaming ? (
        <input
          value={renameVal}
          onChange={e => onSetRenameVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onRenameSubmit(); if (e.key === 'Escape') onSetRenaming(null); }}
          onBlur={onRenameSubmit}
          autoFocus
          style={{ flex: 1, fontSize: 12, border: '1px solid #437DFD', borderRadius: 4, padding: '1px 6px', outline: 'none', background: '#fff', color: '#0C0C0C' }}
        />
      ) : (
        <span onClick={onOpen} style={{ flex: 1, fontSize: 12, color: active ? '#437DFD' : '#444', fontWeight: active ? 700 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
      )}
      {hov && !renaming && (
        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          <button onClick={() => { onSetRenaming(file.id); onSetRenameVal(file.name); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: '2px', display: 'flex', alignItems: 'center' }}><FiEdit3 size={11}/></button>
          <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: '2px', display: 'flex', alignItems: 'center' }}><FiTrash2 size={11}/></button>
        </div>
      )}
    </div>
  );
};

// ── Main VibeCoder ────────────────────────────────────────────────────────────
const VibeCoder = ({ isMobile = false }) => {
  const [projects,     setProjects]     = useState(LP);
  const [activeProj,   setActiveProj]   = useState(null);
  const [files,        setFiles]        = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);
  const [openTabs,     setOpenTabs]     = useState([]);
  const [messages,     setMessages]     = useState([]);
  const [input,        setInput]        = useState('');
  const [isWorking,    setIsWorking]    = useState(false);
  const [viewMode,     setViewMode]     = useState('chatpreview');
  const [viewport,     setViewport]     = useState('desktop');
  const [newFileName,  setNewFileName]  = useState('');
  const [showNewFile,  setShowNewFile]  = useState(false);
  const [showNewProj,  setShowNewProj]  = useState(false);
  const [renamingId,   setRenamingId]   = useState(null);
  const [renameVal,    setRenameVal]    = useState('');
  const [listening,    setListening]    = useState(false);
  const [copied,       setCopied]       = useState(false);
  const [chatOpen,     setChatOpen]     = useState(true);
  const [buildInput,   setBuildInput]   = useState('');

  const inputRef      = useRef(null);
  const msgsEndRef    = useRef(null);
  const fileInputRef  = useRef(null);
  const recRef        = useRef(null);
  const prevHtmlRef   = useRef(null);
  const pendingMsgRef = useRef(null);

  useEffect(() => { if (activeProj) SF(activeProj.id, files); }, [files, activeProj]);
  useEffect(() => { msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isWorking]);
  useEffect(() => {
    if (activeProj?.id && pendingMsgRef.current) {
      const msg = pendingMsgRef.current;
      pendingMsgRef.current = null;
      setTimeout(() => handleSend(msg), 350);
    }
  }, [activeProj?.id]);

  const activeFile  = files.find(f => f.id === activeFileId) || null;
  const previewHtml = activeProj ? buildPreview(files) : null;
  // Only update preview ref when HTML actually changes (prevents flicker on typing in non-HTML files)
  if (previewHtml !== null) prevHtmlRef.current = previewHtml;
  const displayHtml = previewHtml ?? prevHtmlRef.current;

  // ── Project actions ─────────────────────────────────────────────────────────
  const createProject = (name, templateId = 'blank') => {
    const tpl = TEMPLATES.find(t => t.id === templateId) || TEMPLATES[0];
    const id = uid();
    const projFiles = tpl.files.map(f => ({ id: uid(), projectId: id, name: f.name, content: f.content, type: getFileType(f.name), createdAt: ts() }));
    const proj = { id, name, createdAt: ts(), updatedAt: ts(), template: templateId, fileCount: projFiles.length };
    SF(id, projFiles);
    const updated = [proj, ...projects];
    SP(updated); setProjects(updated);
    setActiveProj(proj); setFiles(projFiles);
    setActiveFileId(projFiles[0]?.id || null);
    setOpenTabs(projFiles.map(f => f.id));
    setMessages([{ role: 'assistant', text: `✅ Created **${name}** with the ${tpl.name} template.\n\nThe preview is live on the right. Describe what you want to change or build!`, id: uid() }]);
    setShowNewProj(false);
    setViewMode('chatpreview');
  };

  const openProject = (proj) => {
    const projFiles = LF(proj.id);
    setActiveProj(proj); setFiles(projFiles);
    setActiveFileId(projFiles[0]?.id || null);
    setOpenTabs(projFiles.map(f => f.id).slice(0, 5));
    setMessages([]); setInput(''); prevHtmlRef.current = null;
  };

  const closeProject = () => {
    setActiveProj(null); setFiles([]); setActiveFileId(null);
    setOpenTabs([]); setMessages([]); prevHtmlRef.current = null;
  };

  const deleteProject = (id) => {
    localStorage.removeItem(FK(id));
    const updated = projects.filter(p => p.id !== id);
    SP(updated); setProjects(updated);
    if (activeProj?.id === id) closeProject();
  };

  // ── File actions ────────────────────────────────────────────────────────────
  const createFile = (name) => {
    if (!activeProj || !name.trim()) return;
    const f = { id: uid(), projectId: activeProj.id, name: name.trim(), content: '', type: getFileType(name.trim()), createdAt: ts() };
    setFiles(prev => [...prev, f]);
    setOpenTabs(t => [...t, f.id]);
    setActiveFileId(f.id);
    setShowNewFile(false); setNewFileName('');
  };

  const deleteFile = (id) => {
    setFiles(f => f.filter(x => x.id !== id));
    setOpenTabs(t => t.filter(x => x !== id));
    if (activeFileId === id) setActiveFileId(files.find(x => x.id !== id)?.id || null);
  };

  const renameFile = (id, name) => {
    if (!name.trim()) return;
    setFiles(f => f.map(x => x.id === id ? { ...x, name: name.trim(), type: getFileType(name.trim()) } : x));
    setRenamingId(null); setRenameVal('');
  };

  const updateContent = (id, content) => setFiles(f => f.map(x => x.id === id ? { ...x, content } : x));

  const openTab = (id) => {
    if (!openTabs.includes(id)) setOpenTabs(t => [...t, id]);
    setActiveFileId(id);
  };

  const closeTab = (id, e) => {
    e.stopPropagation();
    const next = openTabs.find(x => x !== id);
    setOpenTabs(t => t.filter(x => x !== id));
    if (activeFileId === id) setActiveFileId(next || null);
  };

  const uploadFile = (e) => {
    const f = e.target.files[0]; if (!f || !activeProj) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const file = { id: uid(), projectId: activeProj.id, name: f.name, content: ev.target.result || '', type: getFileType(f.name), createdAt: ts() };
      setFiles(prev => [...prev, file]);
      setOpenTabs(t => [...t, file.id]);
      setActiveFileId(file.id);
    };
    f.type.startsWith('image/') ? reader.readAsDataURL(f) : reader.readAsText(f);
    e.target.value = '';
  };

  const downloadAll = () => files.forEach((f, i) => {
    setTimeout(() => {
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([f.content])); a.download = f.name; a.click();
    }, i * 80);
  });

  // ── AI Chat ─────────────────────────────────────────────────────────────────
  const addMsg = (role, text) => setMessages(prev => [...prev, { role, text, id: uid() }]);

  const handleSend = async (overrideMsg) => {
    const msg = (overrideMsg !== undefined ? overrideMsg : input).trim();
    if (!msg || isWorking) return;
    if (overrideMsg === undefined) {
      setInput('');
      if (inputRef.current) inputRef.current.style.height = 'auto';
    }
    addMsg('user', msg);
    setIsWorking(true);

    try {
      const filesContext = files.map(f => `[FILE:${f.name}]\n${f.content}\n[/FILE]`).join('\n\n');
      const systemInstr = `You are VibeCoder, an elite AI full-stack web developer and designer inside Airis IDE. You build complete, stunning, production-quality websites and web apps.

CAPABILITIES:
- Modern websites: landing pages, portfolios, restaurants, e-commerce, blogs, SaaS, news, agencies
- Web apps: dashboards, todo apps, calculators, games, music players, booking forms, tools
- Libraries via CDN: Three.js, Chart.js, D3.js, GSAP, Anime.js, Particles.js, Swiper.js, AOS.js

STRICT RULES:
1. Output EVERY file using EXACT format: [FILE:filename.ext]\\ncontent\\n[/FILE]
2. Return COMPLETE, WORKING file contents — NEVER truncate, NEVER use "...", NEVER skip code
3. Use CDN links for libraries — no npm, no build tools needed
4. Write beautiful, pixel-perfect code with modern CSS (variables, flex, grid, smooth transitions)
5. ALL layouts MUST be mobile-responsive with proper viewport meta tag
6. When building new — always generate index.html + style.css + app.js at minimum
7. When updating — return ONLY changed files (include their COMPLETE content)
8. Make ALL interactive elements fully functional (buttons work, forms submit, navigation works)
9. Use modern design: gradients, shadows, rounded corners, hover effects, micro-animations
10. Add a brief 1-2 sentence summary AFTER all file blocks

Current project: ${activeProj?.name || 'New Project'}
Current files:
${filesContext || '(no files yet — build from scratch)'}

User request: ${msg}`;

      const res = await fetch('/api/vibe/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: systemInstr, code_context: '' }),
      });
      const data = await res.json();
      const reply = data.reply || data.response || '';

      const fileBlocks = parseFileBlocks(reply);

      if (fileBlocks.length > 0) {
        // Apply all file changes
        setFiles(prev => {
          let updated = [...prev];
          const newFiles = [];
          fileBlocks.forEach(fb => {
            const existing = updated.find(f => f.name === fb.name);
            if (existing) {
              updated = updated.map(f => f.name === fb.name ? { ...f, content: fb.content } : f);
            } else {
              newFiles.push({ id: uid(), projectId: activeProj?.id || uid(), name: fb.name, content: fb.content, type: getFileType(fb.name), createdAt: ts() });
            }
          });
          return [...updated, ...newFiles];
        });

        // Open new/updated tabs
        setOpenTabs(prev => {
          const current = [...prev];
          fileBlocks.forEach(fb => {
            // find the id later after setFiles settles
          });
          return current;
        });

        const desc = reply.replace(/\[FILE:[^\]]+\][\s\S]*?\[\/FILE\]/g, '').trim();
        const fileList = fileBlocks.map(f => `\`${f.name}\``).join(', ');
        addMsg('assistant', `✅ Updated ${fileList}${desc ? `\n\n${desc}` : ''}`);

        // Switch to preview
        setViewMode('split');
      } else {
        // Fallback: just a chat reply with no file blocks
        addMsg('assistant', reply || 'I couldn\'t generate files for that request. Try being more specific!');
      }
    } catch (e) {
      addMsg('error', `Error: ${e.message}`);
    } finally {
      setIsWorking(false);
    }
  };

  const startListening = useCallback(() => {
    const SRA = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SRA) return;
    const rec = new SRA(); rec.lang = 'en-US'; rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onresult = e => setInput(p => p ? p + ' ' + e.results[0][0].transcript : e.results[0][0].transcript);
    rec.onerror = rec.onend = () => setListening(false);
    recRef.current = rec; rec.start();
  }, []);
  const stopListening = useCallback(() => { recRef.current?.stop(); setListening(false); }, []);

  const copyCode = () => {
    if (!activeFile) return;
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const autoResize = () => {
    const el = inputRef.current; if (!el) return;
    el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  };

  const B = '#437DFD';
  const SIDEBAR_W = 185;

  // ── Project list ────────────────────────────────────────────────────────────
  if (!activeProj) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#F5F4F2', overflow: 'hidden' }}>
        {showNewProj && <TemplatePicker onSelect={createProject} onClose={() => setShowNewProj(false)}/>}

        {/* Header */}
        <div style={{ height: 44, background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiCode size={15} style={{ color: B }}/>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0C0C0C', letterSpacing: '-0.02em' }}>Vibe Coder</span>
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: `${B}12`, color: B, border: `1px solid ${B}22`, fontWeight: 700 }}>IDE</span>
          </div>
          <button onClick={() => setShowNewProj(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${B},#2C76FF)`, color: '#fff', fontSize: 12, fontWeight: 700, boxShadow: '0 3px 12px rgba(67,125,253,0.3)' }}>
            <FiPlus size={13}/> New Project
          </button>
        </div>

        {/* Quick start */}
        {projects.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: `${B}12`, border: `1px solid ${B}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <FiCode size={24} style={{ color: B }}/>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0C0C0C', letterSpacing: '-0.03em', marginBottom: 10 }}>Build your first app</h2>
            <p style={{ fontSize: 14, color: '#888', textAlign: 'center', maxWidth: 360, lineHeight: 1.7, marginBottom: 28 }}>
              Create web apps, 3D landing pages, dashboards, portfolios and more with AI. Pick a template and describe what you want.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, width: '100%', maxWidth: 480, marginBottom: 24 }}>
              {TEMPLATES.slice(0, 6).map(t => {
                const Icon = t.icon;
                return (
                  <button key={t.id} onClick={() => setShowNewProj(true)} style={{ padding: '14px 10px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)', background: '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${t.color}08`; e.currentTarget.style.borderColor = `${t.color}40`; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'; }}>
                    <Icon size={18} style={{ color: t.color, marginBottom: 8, display: 'block' }}/>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0C0C0C' }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{t.desc}</div>
                  </button>
                );
              })}
            </div>
            {/* Chat to create */}
            <div style={{ width: '100%', maxWidth: 500, marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.07)' }}/>
                <span style={{ fontSize: 11, color: '#bbb', fontWeight: 500 }}>or describe what you want to build</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.07)' }}/>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={buildInput} onChange={e => setBuildInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && buildInput.trim()) { pendingMsgRef.current = buildInput.trim(); createProject(buildInput.trim().slice(0,50) || 'My App', 'blank'); setBuildInput(''); }}}
                  placeholder='e.g. "Build a restaurant website with menu and booking form"'
                  style={{ flex: 1, padding: '11px 14px', borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.12)', fontSize: 13, outline: 'none', fontFamily: 'inherit', color: '#0C0C0C', background: '#fff', transition: 'border-color 0.15s' }}
                  onFocus={e => e.target.style.borderColor = '#437DFD'}
                  onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.12)'}
                />
                <button onClick={() => { if (!buildInput.trim()) return; pendingMsgRef.current = buildInput.trim(); createProject(buildInput.trim().slice(0,50) || 'My App', 'blank'); setBuildInput(''); }}
                  disabled={!buildInput.trim()}
                  style={{ padding: '11px 18px', borderRadius: 10, border: 'none', background: buildInput.trim() ? 'linear-gradient(135deg,#437DFD,#2C76FF)' : 'rgba(0,0,0,0.06)', color: buildInput.trim() ? '#fff' : '#bbb', fontSize: 13, fontWeight: 700, cursor: buildInput.trim() ? 'pointer' : 'not-allowed', flexShrink: 0, transition: 'all 0.15s', boxShadow: buildInput.trim() ? '0 4px 14px rgba(67,125,253,0.3)' : 'none' }}>
                  Build →
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                {['Restaurant website','E-commerce store','Personal portfolio','SaaS landing page','Music player','Todo app'].map(ex => (
                  <button key={ex} onClick={() => { pendingMsgRef.current = `Build a ${ex.toLowerCase()}`; createProject(ex, 'blank'); }}
                    style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(0,0,0,0.1)', background: '#fff', fontSize: 11, fontWeight: 600, color: '#666', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(67,125,253,0.07)'; e.currentTarget.style.borderColor = 'rgba(67,125,253,0.3)'; e.currentTarget.style.color = '#437DFD'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'; e.currentTarget.style.color = '#666'; }}>
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Project grid */}
        {projects.length > 0 && (
          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {projects.map(proj => {
                const tpl = TEMPLATES.find(t => t.id === proj.template) || TEMPLATES[0];
                const Icon = tpl.icon;
                return (
                  <div key={proj.id} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                    onClick={() => openProject(proj)}>
                    <div style={{ height: 90, background: `${tpl.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: `1px solid ${tpl.color}18` }}>
                      <Icon size={32} style={{ color: tpl.color }}/>
                    </div>
                    <div style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0C0C0C', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{proj.name}</div>
                      <div style={{ fontSize: 11, color: '#aaa', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>{tpl.name}</span>
                        <button onClick={e => { e.stopPropagation(); deleteProject(proj.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ddd', padding: 2, display: 'flex', alignItems: 'center' }}>
                          <FiTrash2 size={11}/>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <style>{`@keyframes vcDot{0%,100%{transform:scale(0.5);opacity:0.3}50%{transform:scale(1);opacity:1}}`}</style>
      </div>
    );
  }

  // ── IDE View ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#1e1e2e', overflow: 'hidden', minWidth: 0 }}>
      {showNewProj && <TemplatePicker onSelect={createProject} onClose={() => setShowNewProj(false)}/>}
      <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={uploadFile}/>

      {/* Top bar */}
      <div style={{ height: 44, background: '#16161e', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px 0 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
          <button onClick={closeProject} style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#555', flexShrink: 0, transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#888'}
            onMouseLeave={e => e.currentTarget.style.color = '#555'}>
            <FiArrowLeft size={16}/>
          </button>
          <div style={{ height: 44, borderLeft: '1px solid rgba(255,255,255,0.06)', marginRight: 12 }}/>
          <FiCode size={13} style={{ color: B, flexShrink: 0, marginRight: 6 }}/>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#e0e0f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>{activeProj.name}</span>
        </div>

        {/* View controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 3, marginRight: 10 }}>
          {[
            { id: 'chatpreview', label: 'Chat',    icon: FiZap },
            { id: 'editor',      label: 'Code',    icon: FiCode },
            { id: 'split',       label: 'Split',   icon: FiColumns },
            { id: 'preview',     label: 'Preview', icon: FiEye },
          ].map(v => {
            const Icon = v.icon;
            const active = viewMode === v.id;
            return (
              <button key={v.id} onClick={() => setViewMode(v.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', background: active ? 'rgba(255,255,255,0.1)' : 'transparent', color: active ? '#e0e0f0' : '#555', fontSize: 11, fontWeight: active ? 700 : 500, transition: 'all 0.15s' }}>
                <Icon size={12}/>{!isMobile && v.label}
              </button>
            );
          })}
        </div>

        {/* Viewport */}
        {(viewMode === 'split' || viewMode === 'preview') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginRight: 10 }}>
            {Object.entries(VIEWPORTS).map(([k, v]) => {
              const Icon = v.icon;
              return (
                <button key={k} onClick={() => setViewport(k)} title={v.label} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: 'none', cursor: 'pointer', background: viewport === k ? 'rgba(255,255,255,0.1)' : 'transparent', color: viewport === k ? B : '#555', transition: 'all 0.15s' }}>
                  <Icon size={13}/>
                </button>
              );
            })}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={() => setShowNewProj(true)} title="New Project" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', background: 'transparent', color: '#555', fontSize: 11, transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#888'}
            onMouseLeave={e => e.currentTarget.style.color = '#555'}>
            <FiPlus size={13}/>{!isMobile && 'New'}
          </button>
          <button onClick={downloadAll} title="Download all files" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', background: 'transparent', color: '#555', fontSize: 11, transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#888'}
            onMouseLeave={e => e.currentTarget.style.color = '#555'}>
            <FiDownload size={13}/>{!isMobile && 'Export'}
          </button>
        </div>
      </div>

      {/* ── Chat + Preview mode ───────────────────────────────────────────── */}
      {viewMode === 'chatpreview' && (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

          {/* AI Chat Side Panel */}
          <div style={{ width: 340, flexShrink: 0, background: '#0f0f17', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Panel header */}
            <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                <div style={{ width: 22, height: 22, borderRadius: 7, background: `${B}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FiZap size={12} style={{ color: B }}/>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#888', letterSpacing: '0.04em', textTransform: 'uppercase' }}>AI Assistant</span>
                {isWorking && <span style={{ fontSize: 10, color: B, animation: 'atPulse 1s infinite', marginLeft: 4 }}>building…</span>}
              </div>
              <p style={{ fontSize: 11, color: '#3a3a52', lineHeight: 1.55, margin: 0 }}>Describe what you want to build or change — I'll write the code and update the preview instantly.</p>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.05) transparent' }}>
              {messages.length === 0 && !isWorking && (
                <div style={{ paddingTop: 4 }}>
                  <div style={{ fontSize: 10, color: '#333', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Try these examples</div>
                  {[
                    'Build a modern restaurant website with menu and reservation form',
                    'Create a personal portfolio with projects grid and contact section',
                    'Build an e-commerce product page with cart and reviews',
                    'Create a SaaS landing page with pricing table and hero',
                    'Make an interactive todo app with drag-and-drop',
                    'Build a music player with playlist and progress bar',
                  ].map(ex => (
                    <button key={ex} onClick={() => handleSend(ex)} disabled={isWorking}
                      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 11px', marginBottom: 5, borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', color: '#444', fontSize: 11, cursor: 'pointer', lineHeight: 1.45, transition: 'all 0.15s', fontFamily: 'inherit' }}
                      onMouseEnter={e => { e.currentTarget.style.background = `${B}12`; e.currentTarget.style.borderColor = `${B}30`; e.currentTarget.style.color = '#aaa'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#444'; }}>
                      "{ex}"
                    </button>
                  ))}
                </div>
              )}

              {messages.map(m => (
                <div key={m.id} style={{ marginBottom: 14, display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: m.role === 'user' ? 'rgba(255,255,255,0.07)' : m.role === 'error' ? 'rgba(253,91,93,0.15)' : `${B}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    {m.role === 'user' ? <FiUser size={10} style={{ color: '#666' }}/> : m.role === 'error' ? <span style={{ fontSize: 10 }}>⚠</span> : <FiZap size={10} style={{ color: B }}/>}
                  </div>
                  <div style={{ fontSize: 12, color: m.role === 'user' ? '#999' : m.role === 'error' ? '#FD5B5D' : '#c8c8e0', lineHeight: 1.68, flex: 1, wordBreak: 'break-word' }}>
                    {m.text}
                  </div>
                </div>
              ))}

              {isWorking && (
                <div style={{ display: 'flex', gap: 9, alignItems: 'center', paddingBottom: 6 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: `${B}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FiLoader size={10} style={{ color: B, animation: 'atSpin 1s linear infinite' }}/>
                  </div>
                  <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                    {[0, 0.18, 0.36].map((d, i) => <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: B, animation: `vcDot 1s ${d}s ease-in-out infinite` }}/>)}
                  </div>
                </div>
              )}
              <div ref={msgsEndRef}/>
            </div>

            {/* Quick action chips */}
            {messages.length > 0 && (
              <div style={{ padding: '8px 12px 6px', display: 'flex', flexWrap: 'wrap', gap: 5, borderTop: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
                {['Make it responsive','Add dark mode','Add animations','Improve design','Add contact form','Make more modern','Add navigation','Fix any bugs'].map(q => (
                  <button key={q} onClick={() => handleSend(q)} disabled={isWorking}
                    style={{ padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#444', cursor: isWorking ? 'not-allowed' : 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}
                    onMouseEnter={e => { if (!isWorking) { e.currentTarget.style.background = `${B}18`; e.currentTarget.style.borderColor = `${B}40`; e.currentTarget.style.color = B; }}}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#444'; }}>
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input area */}
            <div style={{ padding: '8px 12px 14px', borderTop: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: 11, padding: '10px 10px 10px 14px', transition: 'border-color 0.2s' }}
                  onFocusCapture={e => e.currentTarget.style.borderColor = `${B}60`}
                  onBlurCapture={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => { setInput(e.target.value); autoResize(); }}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="Describe what you want to build or change…"
                    rows={2}
                    disabled={isWorking}
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#c8c8e0', fontSize: 13, resize: 'none', fontFamily: 'inherit', lineHeight: 1.55, maxHeight: 160, minHeight: 38 }}
                  />
                  <button onClick={listening ? stopListening : startListening} style={{ background: 'none', border: 'none', cursor: 'pointer', color: listening ? '#00C48C' : '#3a3a52', flexShrink: 0, display: 'flex', alignItems: 'center', padding: '2px 4px', transition: 'color 0.15s', marginLeft: 4 }}>
                    {listening ? <FiMic size={13}/> : <FiMicOff size={13}/>}
                  </button>
                </div>
                <button onClick={() => handleSend()} disabled={!input.trim() || isWorking}
                  style={{ width: 40, height: 40, borderRadius: 10, border: 'none', cursor: input.trim() && !isWorking ? 'pointer' : 'not-allowed', background: input.trim() && !isWorking ? `linear-gradient(135deg,${B},#2C76FF)` : 'rgba(255,255,255,0.05)', color: input.trim() && !isWorking ? '#fff' : '#2a2a3a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s', boxShadow: input.trim() && !isWorking ? '0 4px 16px rgba(67,125,253,0.4)' : 'none' }}>
                  <FiSend size={14}/>
                </button>
              </div>
              <div style={{ fontSize: 10, color: '#2a2a3a', marginTop: 6, textAlign: 'center' }}>Enter to send · Shift+Enter for new line</div>
            </div>
          </div>

          {/* Live Preview Panel */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, background: '#1a1a2e' }}>
            <div style={{ height: 36, background: '#16161e', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: displayHtml ? '#00C48C' : '#333', boxShadow: displayHtml ? '0 0 6px #00C48C80' : 'none', transition: 'all 0.3s' }}/>
                <span style={{ fontSize: 11, color: '#555', fontWeight: 600 }}>Live Preview</span>
                {isWorking && <span style={{ fontSize: 10, color: '#437DFD55', animation: 'atPulse 1s infinite' }}>updating…</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                {Object.entries(VIEWPORTS).map(([k, v]) => {
                  const Icon = v.icon;
                  return (
                    <button key={k} onClick={() => setViewport(k)} title={v.label} style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 5, border: 'none', cursor: 'pointer', background: viewport === k ? 'rgba(255,255,255,0.1)' : 'transparent', color: viewport === k ? B : '#444', transition: 'all 0.15s' }}>
                      <Icon size={12}/>
                    </button>
                  );
                })}
                <button onClick={() => setFiles(f => [...f])} title="Refresh preview" style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 5, border: 'none', cursor: 'pointer', background: 'transparent', color: '#444', marginLeft: 4, transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#888'}
                  onMouseLeave={e => e.currentTarget.style.color = '#444'}>
                  <FiRefreshCw size={12}/>
                </button>
              </div>
            </div>
            <LivePreview html={displayHtml} viewport={viewport}/>
          </div>
        </div>
      )}

      {/* ── Editor / Split / Preview modes ───────────────────────────────────── */}
      {viewMode !== 'chatpreview' && (
        <>
      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* File sidebar */}
        {viewMode !== 'preview' && (
          <div style={{ width: SIDEBAR_W, flexShrink: 0, background: '#12121a', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ height: 36, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px', borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Files</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => fileInputRef.current?.click()} title="Upload file" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444', display: 'flex', alignItems: 'center', padding: 3, borderRadius: 4, transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#777'}
                  onMouseLeave={e => e.currentTarget.style.color = '#444'}>
                  <FiUpload size={12}/>
                </button>
                <button onClick={() => setShowNewFile(true)} title="New file" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444', display: 'flex', alignItems: 'center', padding: 3, borderRadius: 4, transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#777'}
                  onMouseLeave={e => e.currentTarget.style.color = '#444'}>
                  <FiPlus size={13}/>
                </button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '6px 6px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.06) transparent' }}>
              {showNewFile && (
                <div style={{ marginBottom: 4 }}>
                  <input value={newFileName} onChange={e => setNewFileName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') createFile(newFileName); if (e.key === 'Escape') { setShowNewFile(false); setNewFileName(''); } }}
                    onBlur={() => { if (newFileName.trim()) createFile(newFileName); else { setShowNewFile(false); setNewFileName(''); } }}
                    placeholder="filename.html"
                    autoFocus
                    style={{ width: '100%', padding: '4px 8px', fontSize: 12, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(67,125,253,0.5)', borderRadius: 6, color: '#e0e0f0', outline: 'none', fontFamily: 'monospace' }}
                  />
                </div>
              )}
              {files.map(f => (
                <FileItem
                  key={f.id}
                  file={f}
                  active={activeFileId === f.id}
                  renaming={renamingId === f.id}
                  renameVal={renameVal}
                  onOpen={() => openTab(f.id)}
                  onRename={() => renameFile(f.id, renameVal)}
                  onRenameSubmit={() => renameFile(f.id, renameVal)}
                  onDelete={() => deleteFile(f.id)}
                  onSetRenaming={setRenamingId}
                  onSetRenameVal={setRenameVal}
                />
              ))}
            </div>
          </div>
        )}

        {/* Editor */}
        {viewMode !== 'preview' && (
          <div style={{ flex: viewMode === 'split' ? '0 0 45%' : 1, display: 'flex', flexDirection: 'column', background: '#1e1e2e', overflow: 'hidden', minWidth: 0, borderRight: viewMode === 'split' ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
            {/* Tabs */}
            <div style={{ height: 36, display: 'flex', alignItems: 'stretch', background: '#16161e', borderBottom: '1px solid rgba(255,255,255,0.05)', overflowX: 'auto', flexShrink: 0, scrollbarWidth: 'none' }}>
              {openTabs.map(tid => {
                const f = files.find(x => x.id === tid); if (!f) return null;
                const isActive = activeFileId === tid;
                return (
                  <div key={tid} onClick={() => setActiveFileId(tid)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 12px', cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap', background: isActive ? '#1e1e2e' : 'transparent', color: isActive ? '#e0e0f0' : '#555', borderBottom: isActive ? `2px solid ${B}` : '2px solid transparent', borderRight: '1px solid rgba(255,255,255,0.04)', transition: 'all 0.12s', flexShrink: 0 }}>
                    <span style={{ fontSize: 11 }}>{getFileIcon(f.name)}</span>
                    <span style={{ fontWeight: isActive ? 700 : 400 }}>{f.name}</span>
                    <span onClick={e => closeTab(tid, e)} style={{ color: isActive ? '#555' : 'transparent', fontSize: 10, marginLeft: 2, display: 'flex', alignItems: 'center', transition: 'color 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#888'}
                      onMouseLeave={e => e.currentTarget.style.color = isActive ? '#555' : 'transparent'}>
                      <FiX size={11}/>
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Code editor */}
            {activeFile ? (
              <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 8, right: 10, zIndex: 5 }}>
                  <button onClick={copyCode} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 5, fontSize: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#777', cursor: 'pointer', transition: 'all 0.15s' }}>
                    {copied ? <FiCheck size={11}/> : <FiCopy size={11}/>}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <textarea
                  value={activeFile.content}
                  onChange={e => updateContent(activeFile.id, e.target.value)}
                  spellCheck={false}
                  style={{
                    position: 'absolute', inset: 0,
                    background: 'transparent', border: 'none', outline: 'none',
                    color: '#abb2bf', fontSize: 13, lineHeight: 1.7,
                    fontFamily: "'Fira Code','Cascadia Code','Consolas',monospace",
                    resize: 'none', padding: '14px 16px',
                    width: '100%', height: '100%',
                    tabSize: 2,
                  }}
                />
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333' }}>
                <div style={{ textAlign: 'center' }}>
                  <FiFile size={28} style={{ marginBottom: 12, opacity: 0.4 }}/>
                  <div style={{ fontSize: 13, opacity: 0.5 }}>Select a file to edit</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Preview */}
        {(viewMode === 'split' || viewMode === 'preview') && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
            <div style={{ height: 36, background: '#16161e', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: displayHtml ? '#00C48C' : '#555', boxShadow: displayHtml ? '0 0 6px #00C48C80' : 'none' }}/>
                <span style={{ fontSize: 11, color: '#555', fontWeight: 600 }}>Live Preview</span>
              </div>
              <button onClick={() => setFiles(f => [...f])} title="Refresh preview" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444', display: 'flex', alignItems: 'center', padding: '4px 8px', borderRadius: 5, transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#888'}
                onMouseLeave={e => e.currentTarget.style.color = '#444'}>
                <FiRefreshCw size={12}/>
              </button>
            </div>
            <LivePreview html={displayHtml} viewport={viewport}/>
          </div>
        )}
      </div>

      {/* AI Chat */}
      <div style={{ background: '#16161e', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        {/* Chat toggle header */}
        <button onClick={() => setChatOpen(o => !o)} style={{ width: '100%', height: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: chatOpen ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <FiZap size={12} style={{ color: B }}/>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#555', letterSpacing: '0.06em', textTransform: 'uppercase' }}>AI Assistant</span>
            {isWorking && <span style={{ fontSize: 10, color: B, animation: 'atPulse 1s infinite' }}>thinking…</span>}
          </div>
          <FiChevronDown size={12} style={{ color: '#444', transform: chatOpen ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}/>
        </button>

        {chatOpen && (
          <>
            {/* Messages */}
            <div style={{ maxHeight: 140, overflowY: 'auto', padding: '8px 14px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.06) transparent' }}>
              {messages.length === 0 && !isWorking && (
                <div style={{ fontSize: 12, color: '#444', textAlign: 'center', paddingTop: 8 }}>
                  Describe what you want to build or change
                </div>
              )}
              {messages.map(m => (
                <div key={m.id} style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ width: 18, height: 18, borderRadius: 5, background: m.role === 'user' ? 'rgba(255,255,255,0.07)' : m.role === 'error' ? 'rgba(253,91,93,0.15)' : `${B}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    {m.role === 'user' ? <FiUser size={9} style={{ color: '#777' }}/> : m.role === 'error' ? '⚠' : <FiZap size={9} style={{ color: B }}/>}
                  </div>
                  <div style={{ fontSize: 12, color: m.role === 'user' ? '#888' : m.role === 'error' ? '#FD5B5D' : '#c8c8e0', lineHeight: 1.6, flex: 1, wordBreak: 'break-word' }}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isWorking && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingBottom: 4 }}>
                  <div style={{ width: 18, height: 18, borderRadius: 5, background: `${B}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FiLoader size={9} style={{ color: B, animation: 'atSpin 1s linear infinite' }}/>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[0, 0.2, 0.4].map((d, i) => <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: B, animation: `vcDot 1s ${d}s ease-in-out infinite` }}/>)}
                  </div>
                </div>
              )}
              <div ref={msgsEndRef}/>
            </div>

            {/* Input */}
            <div style={{ padding: '8px 12px 10px', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 10px 8px 12px', transition: 'border-color 0.2s' }}
                onFocusCapture={e => e.currentTarget.style.borderColor = `${B}60`}
                onBlurCapture={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => { setInput(e.target.value); autoResize(); }}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Describe changes or ask AI to build something..."
                  rows={1}
                  disabled={isWorking}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#c8c8e0', fontSize: 13, resize: 'none', fontFamily: 'inherit', lineHeight: 1.5, maxHeight: 100, minHeight: 20 }}
                />
                <button onClick={listening ? stopListening : startListening} style={{ background: 'none', border: 'none', cursor: 'pointer', color: listening ? '#00C48C' : '#444', flexShrink: 0, display: 'flex', alignItems: 'center', padding: '2px 4px', transition: 'color 0.15s', marginLeft: 4 }}>
                  {listening ? <FiMic size={14}/> : <FiMicOff size={14}/>}
                </button>
              </div>
              <button onClick={handleSend} disabled={!input.trim() || isWorking} style={{ width: 36, height: 36, borderRadius: 9, border: 'none', cursor: input.trim() && !isWorking ? 'pointer' : 'not-allowed', background: input.trim() && !isWorking ? `linear-gradient(135deg,${B},#2C76FF)` : 'rgba(255,255,255,0.05)', color: input.trim() && !isWorking ? '#fff' : '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s', boxShadow: input.trim() && !isWorking ? '0 4px 14px rgba(67,125,253,0.4)' : 'none' }}>
                <FiSend size={14}/>
              </button>
            </div>
          </>
        )}
      </div>
        </>
      )}

      <style>{`
        @keyframes vcDot { 0%,100%{transform:scale(0.5);opacity:0.3} 50%{transform:scale(1.1);opacity:1} }
        @keyframes atSpin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes atPulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
      `}</style>
    </div>
  );
};

export default VibeCoder;
