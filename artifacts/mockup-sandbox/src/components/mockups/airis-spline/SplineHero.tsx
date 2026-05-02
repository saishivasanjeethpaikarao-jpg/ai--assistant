import { useState, useEffect } from "react";

const style = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

  .airis-root * { box-sizing: border-box; }

  .airis-root {
    font-family: 'DM Sans', -apple-system, sans-serif;
    background: #F5F4F2;
    min-height: 100vh;
    overflow: hidden;
    position: relative;
  }

  /* Ambient background blobs */
  .blob-1 {
    position: absolute;
    width: 700px; height: 700px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(67,125,253,0.10) 0%, transparent 70%);
    top: -180px; left: -120px;
    pointer-events: none;
  }
  .blob-2 {
    position: absolute;
    width: 500px; height: 500px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(253,91,93,0.08) 0%, transparent 70%);
    bottom: 60px; right: -80px;
    pointer-events: none;
  }

  /* Nav */
  .airis-nav {
    position: relative;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 22px 40px;
  }
  .nav-logo {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .nav-logo-img {
    width: 32px; height: 32px;
    border-radius: 50%;
    object-fit: cover;
  }
  .nav-logo-name {
    font-size: 16px;
    font-weight: 600;
    color: #0C0C0C;
    letter-spacing: -0.02em;
  }
  .nav-links {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(255,255,255,0.7);
    border: 1px solid rgba(0,0,0,0.07);
    border-radius: 100px;
    padding: 6px 8px;
    backdrop-filter: blur(12px);
  }
  .nav-link {
    font-size: 13.5px;
    font-weight: 500;
    color: #555;
    padding: 6px 16px;
    border-radius: 100px;
    cursor: pointer;
    transition: all 0.15s;
    border: none;
    background: transparent;
  }
  .nav-link:hover { color: #0C0C0C; background: rgba(0,0,0,0.05); }
  .nav-link.active { color: #fff; background: #0C0C0C; }
  .nav-cta {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .btn-ghost {
    font-family: inherit;
    font-size: 13.5px;
    font-weight: 500;
    color: #444;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 8px 14px;
    border-radius: 8px;
    transition: background 0.15s;
  }
  .btn-ghost:hover { background: rgba(0,0,0,0.05); }
  .btn-primary {
    font-family: inherit;
    font-size: 13.5px;
    font-weight: 500;
    color: #fff;
    background: #437DFD;
    border: none;
    cursor: pointer;
    padding: 8px 20px;
    border-radius: 100px;
    transition: opacity 0.15s, transform 0.1s;
  }
  .btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }

  /* Hero */
  .hero {
    position: relative;
    z-index: 5;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px 40px 0;
    text-align: center;
  }
  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(255,255,255,0.8);
    border: 1px solid rgba(67,125,253,0.25);
    border-radius: 100px;
    padding: 5px 14px 5px 8px;
    font-size: 12.5px;
    font-weight: 500;
    color: #437DFD;
    margin-bottom: 28px;
    backdrop-filter: blur(8px);
  }
  .badge-dot {
    width: 6px; height: 6px;
    background: #437DFD;
    border-radius: 50%;
    animation: pulse-dot 2s infinite;
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }
  .hero-title {
    font-size: 72px;
    font-weight: 300;
    letter-spacing: -0.04em;
    line-height: 1.0;
    color: #0C0C0C;
    margin: 0 0 16px;
  }
  .hero-title span.gradient {
    background: linear-gradient(135deg, #437DFD 0%, #2C76FF 50%, #FD5B5D 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-weight: 500;
  }
  .hero-sub {
    font-size: 18px;
    font-weight: 400;
    color: #666;
    letter-spacing: -0.01em;
    line-height: 1.55;
    max-width: 460px;
    margin: 0 0 32px;
  }
  .hero-actions {
    display: flex;
    gap: 10px;
    margin-bottom: 52px;
  }
  .btn-large {
    font-family: inherit;
    font-size: 15px;
    font-weight: 500;
    color: #fff;
    background: #0C0C0C;
    border: none;
    cursor: pointer;
    padding: 12px 28px;
    border-radius: 100px;
    transition: opacity 0.15s, transform 0.1s;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .btn-large:hover { opacity: 0.85; transform: translateY(-1px); }
  .btn-large-outline {
    font-family: inherit;
    font-size: 15px;
    font-weight: 500;
    color: #0C0C0C;
    background: rgba(255,255,255,0.7);
    border: 1px solid rgba(0,0,0,0.12);
    cursor: pointer;
    padding: 12px 28px;
    border-radius: 100px;
    transition: all 0.15s;
    backdrop-filter: blur(8px);
  }
  .btn-large-outline:hover { background: rgba(255,255,255,0.95); }

  /* Orb container */
  .orb-section {
    position: relative;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: flex-end;
  }
  .orb-glow {
    position: absolute;
    bottom: -20px;
    left: 50%;
    transform: translateX(-50%);
    width: 340px;
    height: 80px;
    background: radial-gradient(ellipse, rgba(67,125,253,0.22) 0%, transparent 70%);
    border-radius: 50%;
    filter: blur(10px);
    z-index: 0;
  }
  .orb-img-wrap {
    position: relative;
    z-index: 2;
    width: 220px;
    height: 220px;
    animation: orb-float 4s ease-in-out infinite;
  }
  @keyframes orb-float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-12px); }
  }
  .orb-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: drop-shadow(0 20px 40px rgba(67,125,253,0.28)) drop-shadow(0 0 60px rgba(44,118,255,0.15));
  }

  /* Chat area */
  .chat-area {
    position: relative;
    z-index: 5;
    max-width: 720px;
    margin: 40px auto 0;
    padding: 0 40px;
  }
  .chat-bubbles {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 16px;
  }
  .bubble {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    animation: fade-up 0.4s ease both;
  }
  @keyframes fade-up {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .bubble.user { flex-direction: row-reverse; }
  .bubble-avatar {
    width: 28px; height: 28px;
    border-radius: 50%;
    background: linear-gradient(135deg, #437DFD, #2C76FF);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    color: #fff;
    font-weight: 600;
  }
  .bubble-avatar.user-av {
    background: #0C0C0C;
  }
  .bubble-text {
    background: rgba(255,255,255,0.85);
    border: 1px solid rgba(0,0,0,0.07);
    border-radius: 14px;
    border-bottom-left-radius: 4px;
    padding: 10px 14px;
    font-size: 14px;
    color: #1a1a1a;
    line-height: 1.5;
    max-width: 480px;
    backdrop-filter: blur(8px);
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  }
  .bubble.user .bubble-text {
    background: #437DFD;
    border-color: transparent;
    color: #fff;
    border-radius: 14px;
    border-bottom-right-radius: 4px;
    box-shadow: 0 2px 12px rgba(67,125,253,0.3);
  }
  .typing-dots {
    display: flex;
    gap: 4px;
    padding: 4px 2px;
  }
  .typing-dots span {
    width: 6px; height: 6px;
    background: #437DFD;
    border-radius: 50%;
    animation: typing 1.2s infinite;
  }
  .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
  .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes typing {
    0%, 100% { transform: translateY(0); opacity: 0.4; }
    50% { transform: translateY(-4px); opacity: 1; }
  }

  /* Input */
  .chat-input-wrap {
    background: rgba(255,255,255,0.82);
    border: 1px solid rgba(0,0,0,0.09);
    border-radius: 18px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 10px 10px 18px;
    backdrop-filter: blur(16px);
    box-shadow: 0 4px 20px rgba(0,0,0,0.07), 0 1px 0 rgba(255,255,255,0.8) inset;
  }
  .chat-input {
    flex: 1;
    border: none;
    background: transparent;
    font-family: inherit;
    font-size: 14.5px;
    color: #0C0C0C;
    outline: none;
  }
  .chat-input::placeholder { color: #aaa; }
  .input-actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .icon-btn {
    width: 34px; height: 34px;
    border-radius: 10px;
    background: transparent;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #888;
    font-size: 15px;
    transition: all 0.15s;
  }
  .icon-btn:hover { background: rgba(0,0,0,0.06); color: #333; }
  .send-btn {
    width: 36px; height: 36px;
    border-radius: 12px;
    background: #0C0C0C;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    transition: opacity 0.15s, transform 0.1s;
  }
  .send-btn:hover { opacity: 0.8; transform: scale(0.96); }
  .mic-btn {
    width: 36px; height: 36px;
    border-radius: 12px;
    background: linear-gradient(135deg, #437DFD, #2C76FF);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    box-shadow: 0 4px 12px rgba(67,125,253,0.35);
    transition: all 0.15s;
  }
  .mic-btn:hover { transform: scale(1.06); box-shadow: 0 6px 16px rgba(67,125,253,0.45); }
  .mic-btn.listening {
    animation: mic-pulse 1.5s ease-in-out infinite;
    background: linear-gradient(135deg, #FD5B5D, #ff6b6b);
    box-shadow: 0 4px 12px rgba(253,91,93,0.4);
  }
  @keyframes mic-pulse {
    0%, 100% { transform: scale(1); box-shadow: 0 4px 12px rgba(253,91,93,0.4); }
    50% { transform: scale(1.08); box-shadow: 0 6px 20px rgba(253,91,93,0.6); }
  }

  /* Capability chips */
  .chips-row {
    display: flex;
    gap: 8px;
    margin-top: 14px;
    flex-wrap: wrap;
    justify-content: center;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(255,255,255,0.7);
    border: 1px solid rgba(0,0,0,0.08);
    border-radius: 100px;
    padding: 6px 13px;
    font-size: 12.5px;
    font-weight: 500;
    color: #444;
    cursor: pointer;
    transition: all 0.15s;
    backdrop-filter: blur(8px);
  }
  .chip:hover {
    background: rgba(255,255,255,0.95);
    color: #0C0C0C;
    border-color: rgba(67,125,253,0.3);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.07);
  }
  .chip-icon { font-size: 13px; }

  /* Stats row */
  .stats-row {
    display: flex;
    justify-content: center;
    gap: 40px;
    margin-top: 44px;
    padding-top: 24px;
    border-top: 1px solid rgba(0,0,0,0.06);
  }
  .stat {
    text-align: center;
  }
  .stat-num {
    font-size: 22px;
    font-weight: 600;
    color: #0C0C0C;
    letter-spacing: -0.03em;
  }
  .stat-label {
    font-size: 12px;
    color: #999;
    margin-top: 2px;
    font-weight: 400;
  }
`;

export function SplineHero() {
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState("");
  const [showTyping, setShowTyping] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowTyping(false), 3200);
    return () => clearTimeout(t);
  }, []);

  const chips = [
    { icon: "✦", label: "Summarize" },
    { icon: "💬", label: "Chat" },
    { icon: "🎙️", label: "Voice Mode" },
    { icon: "📂", label: "Analyze Files" },
    { icon: "🌐", label: "Browse Web" },
    { icon: "⚡", label: "Automate" },
  ];

  return (
    <div className="airis-root">
      <style>{style}</style>
      <div className="blob-1" />
      <div className="blob-2" />

      {/* Navigation */}
      <nav className="airis-nav">
        <div className="nav-logo">
          <img src="/__mockup/images/airis-sphere.png" className="nav-logo-img" alt="Airis" />
          <span className="nav-logo-name">Airis</span>
        </div>
        <div className="nav-links">
          <button className="nav-link active">Home</button>
          <button className="nav-link">Discover</button>
          <button className="nav-link">Voices</button>
          <button className="nav-link">Pricing</button>
        </div>
        <div className="nav-cta">
          <button className="btn-ghost">Sign in</button>
          <button className="btn-primary">Get started free</button>
        </div>
      </nav>

      {/* Hero */}
      <div className="hero">
        <div className="hero-badge">
          <span className="badge-dot" />
          Now with real-time voice cloning
        </div>
        <h1 className="hero-title">
          Meet&nbsp;<span className="gradient">The Airis</span>
        </h1>
        <p className="hero-sub">
          An AI assistant that hears you, understands you, and responds in a voice that feels like yours.
        </p>
        <div className="hero-actions">
          <button className="btn-large">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" fill="rgba(255,255,255,0.25)" />
              <path d="M6.5 5.5l4 2.5-4 2.5V5.5z" fill="white"/>
            </svg>
            Try Airis now
          </button>
          <button className="btn-large-outline">Watch demo</button>
        </div>

        {/* Orb */}
        <div className="orb-section">
          <div className="orb-glow" />
          <div className="orb-img-wrap">
            <img src="/__mockup/images/airis-sphere.png" className="orb-img" alt="Airis orb" />
          </div>
        </div>
      </div>

      {/* Chat */}
      <div className="chat-area">
        <div className="chat-bubbles">
          <div className="bubble" style={{ animationDelay: "0s" }}>
            <div className="bubble-avatar">A</div>
            <div className="bubble-text">
              Hi! I'm Airis — your intelligent voice assistant. What can I help you with today?
            </div>
          </div>
          <div className="bubble user" style={{ animationDelay: "0.15s" }}>
            <div className="bubble-avatar user-av">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="4" r="2.5" fill="white"/>
                <path d="M1 11c0-2.761 2.239-5 5-5s5 2.239 5 5" stroke="white" strokeWidth="1.2"/>
              </svg>
            </div>
            <div className="bubble-text">
              Summarize my emails and set up a meeting for Thursday.
            </div>
          </div>
          {showTyping ? (
            <div className="bubble" style={{ animationDelay: "0.3s" }}>
              <div className="bubble-avatar">A</div>
              <div className="bubble-text">
                <div className="typing-dots">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          ) : (
            <div className="bubble" style={{ animationDelay: "0s" }}>
              <div className="bubble-avatar">A</div>
              <div className="bubble-text">
                You have <strong>3 unread emails</strong> — 2 from your team about the Q2 report, and 1 meeting invite. I've blocked Thursday 2–3 PM for you. Want me to send the calendar invite?
              </div>
            </div>
          )}
        </div>

        <div className="chat-input-wrap">
          <input
            className="chat-input"
            placeholder="Ask Airis anything…"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
          />
          <div className="input-actions">
            <button className="icon-btn" title="Attach">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M13.5 7.5L7.5 13.5C6.1 14.9 3.9 14.9 2.5 13.5C1.1 12.1 1.1 9.9 2.5 8.5L9 2C9.9 1.1 11.4 1.1 12.3 2C13.2 2.9 13.2 4.4 12.3 5.3L6 11.6C5.5 12.1 4.8 12.1 4.3 11.6C3.8 11.1 3.8 10.4 4.3 9.9L10 4.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </button>
            <button
              className={`mic-btn${isListening ? " listening" : ""}`}
              onClick={() => setIsListening(!isListening)}
              title={isListening ? "Stop" : "Voice input"}
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <rect x="5" y="1" width="5" height="8" rx="2.5" fill="white"/>
                <path d="M2.5 7.5C2.5 10.261 4.739 12.5 7.5 12.5C10.261 12.5 12.5 10.261 12.5 7.5" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
                <line x1="7.5" y1="12.5" x2="7.5" y2="14.5" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </button>
            <button className="send-btn" title="Send">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M13 7L1 7M13 7L8 2M13 7L8 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="chips-row">
          {chips.map(c => (
            <button key={c.label} className="chip">
              <span className="chip-icon">{c.icon}</span>
              {c.label}
            </button>
          ))}
        </div>

        <div className="stats-row">
          <div className="stat">
            <div className="stat-num">120+</div>
            <div className="stat-label">Languages</div>
          </div>
          <div className="stat">
            <div className="stat-num">&lt;200ms</div>
            <div className="stat-label">Response time</div>
          </div>
          <div className="stat">
            <div className="stat-num">50k+</div>
            <div className="stat-label">Active users</div>
          </div>
          <div className="stat">
            <div className="stat-num">99.9%</div>
            <div className="stat-label">Uptime</div>
          </div>
        </div>
      </div>
    </div>
  );
}
