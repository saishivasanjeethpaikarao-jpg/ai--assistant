import { useState, useRef, useEffect, useCallback } from 'react';
import {
  FiCode, FiPlay, FiMic, FiMicOff, FiZap, FiTerminal,
  FiCopy, FiCheck, FiChevronDown, FiLoader, FiAlertCircle,
} from 'react-icons/fi';

const SpeechRecognitionAPI =
  typeof window !== 'undefined' &&
  (window.SpeechRecognition || window.webkitSpeechRecognition);

const AGENT_COLORS = {
  frontend:   '#a78bfa',
  backend:    '#34d399',
  trading:    '#fbbf24',
  automation: '#f87171',
  debug:      '#fb923c',
};

// ── Syntax highlighter (no deps) ───────────────────────────────────────────

function highlightCode(code) {
  if (!code) return '';
  const escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return escaped
    // Triple-quoted strings
    .replace(/("""[\s\S]*?"""|'''[\s\S]*?''')/g, '<span style="color:#98c379">$1</span>')
    // Single/double quoted strings
    .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, '<span style="color:#98c379">$1</span>')
    // Comments
    .replace(/(#[^\n]*)/g, '<span style="color:#5c6370;font-style:italic">$1</span>')
    // JS/CSS comments
    .replace(/(\/\/[^\n]*)/g, '<span style="color:#5c6370;font-style:italic">$1</span>')
    // Numbers
    .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#d19a66">$1</span>')
    // Python keywords
    .replace(/\b(import|from|def|class|return|if|elif|else|for|while|in|not|and|or|True|False|None|try|except|finally|with|as|pass|break|continue|raise|yield|async|await|lambda|global|nonlocal|del|assert|is)\b/g,
      '<span style="color:#c678dd">$1</span>')
    // JS/React keywords
    .replace(/\b(const|let|var|function|export|default|import|from|return|if|else|for|while|in|of|new|this|typeof|instanceof|async|await|try|catch|finally|throw|class|extends|super|static|get|set)\b/g,
      '<span style="color:#c678dd">$1</span>')
    // Decorators
    .replace(/(@\w+)/g, '<span style="color:#e06c75">$1</span>')
    // Built-ins / types
    .replace(/\b(print|len|range|str|int|float|list|dict|set|tuple|bool|type|input|open|enumerate|zip|map|filter|sorted|sum|min|max|abs|round|isinstance|hasattr|getattr|setattr)\b/g,
      '<span style="color:#56b6c2">$1</span>')
    // JSX tags
    .replace(/(&lt;\/?[A-Z][a-zA-Z]*)/g, '<span style="color:#e06c75">$1</span>')
    // Function calls
    .replace(/\b([a-zA-Z_]\w*)\s*(?=\()/g, '<span style="color:#61afef">$1</span>');
}

// ── Agent pill ──────────────────────────────────────────────────────────────

const AgentPill = ({ agent, active, onClick }) => {
  const [hov, setHov] = useState(false);
  const color = AGENT_COLORS[agent.id] || '#3b82f6';
  return (
    <button
      onClick={() => onClick(agent.id)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={agent.desc}
      style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '5px 12px', borderRadius: '20px',
        backgroundColor: active ? color + '22' : hov ? '#1a1a1a' : 'transparent',
        border: `1px solid ${active ? color : hov ? '#2a2a2a' : '#1e1e1e'}`,
        color: active ? color : hov ? '#aaaaaa' : '#606060',
        fontSize: '12px', fontWeight: active ? '600' : '400',
        cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      <span>{agent.emoji}</span>
      <span>{agent.label}</span>
    </button>
  );
};

// ── Copy button ─────────────────────────────────────────────────────────────

const CopyBtn = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      onClick={copy}
      title="Copy code"
      style={{
        display: 'flex', alignItems: 'center', gap: '4px',
        padding: '3px 8px', borderRadius: '4px',
        backgroundColor: copied ? '#0a2a1a' : 'transparent',
        border: `1px solid ${copied ? '#10b98166' : '#2a2a2a'}`,
        color: copied ? '#10b981' : '#5a5a5a',
        fontSize: '11px', cursor: 'pointer', transition: 'all 0.15s',
      }}
    >
      {copied ? <FiCheck size={11} /> : <FiCopy size={11} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
};

// ── Main component ──────────────────────────────────────────────────────────

const VibeCoder = ({ initialPrompt = '' }) => {
  const [agents, setAgents] = useState([
    { id: 'frontend',   name: 'FrontendAgent',   emoji: '🎨', label: 'Frontend',   color: '#a78bfa', desc: 'React, HTML, CSS, UI/UX' },
    { id: 'backend',    name: 'BackendAgent',     emoji: '⚙️', label: 'Backend',    color: '#34d399', desc: 'Python, APIs, databases' },
    { id: 'trading',    name: 'TradingAgent',     emoji: '📈', label: 'Trading',    color: '#fbbf24', desc: 'NSE/BSE, yfinance, pandas' },
    { id: 'automation', name: 'AutomationAgent',  emoji: '🤖', label: 'Automation', color: '#f87171', desc: 'Windows automation, scripts' },
    { id: 'debug',      name: 'DebugAgent',       emoji: '🔍', label: 'Debug',      color: '#fb923c', desc: 'Find and fix bugs' },
  ]);
  const [selectedAgent, setSelectedAgent] = useState('auto');
  const [prompt, setPrompt] = useState(initialPrompt);
  const [isBuilding, setIsBuilding] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [terminalOutput, setTerminalOutput] = useState(null);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef(null);
  const codeRef = useRef(null);
  const recRef = useRef(null);

  useEffect(() => {
    fetch('/api/vibe/agents')
      .then(r => r.json())
      .then(d => { if (d.agents) setAgents(d.agents); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  };

  const handleBuild = async () => {
    if (!prompt.trim() || isBuilding) return;
    setIsBuilding(true);
    setError('');
    setResult(null);
    setTerminalOutput(null);
    try {
      const r = await fetch('/api/vibe/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), agent_id: selectedAgent }),
      });
      const d = await r.json();
      if (!r.ok || d.error) throw new Error(d.error || 'Backend error');
      setResult(d);
    } catch (e) {
      setError(e.message || 'Failed to generate code');
    } finally {
      setIsBuilding(false);
    }
  };

  const handleRun = async () => {
    if (!result?.code || isRunning) return;
    setIsRunning(true);
    setTerminalOutput(null);
    try {
      const r = await fetch('/api/vibe/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: result.code, language: 'python' }),
      });
      const d = await r.json();
      setTerminalOutput(d);
    } catch (e) {
      setTerminalOutput({ success: false, error: e.message, output: '' });
    } finally {
      setIsRunning(false);
    }
  };

  const startListening = useCallback(() => {
    if (!SpeechRecognitionAPI) {
      alert('Speech recognition not supported. Use Chrome or Edge.');
      return;
    }
    if (recRef.current) recRef.current.stop();
    const rec = new SpeechRecognitionAPI();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.continuous = false;
    rec.onstart = () => setListening(true);
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setPrompt(p => p ? p + ' ' + text : text);
      setTimeout(autoResize, 10);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    rec.start();
  }, []);

  const stopListening = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  const activeAgent = agents.find(a => a.id === selectedAgent);
  const activeColor = activeAgent ? (AGENT_COLORS[activeAgent.id] || '#3b82f6') : '#3b82f6';

  const extractCode = (raw) => {
    if (!raw) return '';
    const m = raw.match(/```(?:python|javascript|jsx|tsx|js|html|css|bash|sh|sql)?\n?([\s\S]*?)```/);
    return m ? m[1].trim() : raw;
  };

  const rawCode = result ? extractCode(result.code) : '';
  const agentInfo = result
    ? agents.find(a => a.id === result.agent_id) || { emoji: '⚙️', name: result.agent_id }
    : null;

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      backgroundColor: '#0a0a0a', overflow: 'hidden', minWidth: 0,
    }}>
      {/* Tab bar */}
      <div style={{
        height: '36px', backgroundColor: '#111111',
        borderBottom: '1px solid #1e1e1e',
        display: 'flex', alignItems: 'stretch', flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', padding: '0 16px',
          borderRight: '1px solid #1e1e1e', borderBottom: '1px solid #a78bfa',
          backgroundColor: '#0a0a0a', fontSize: '13px', color: '#e8e8e8', gap: '6px',
        }}>
          <FiCode size={13} style={{ color: '#a78bfa' }} />
          <span>vibe-coder</span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', padding: '0 16px',
          fontSize: '11px', color: '#3a3a3a', gap: '6px',
        }}>
          <FiZap size={11} style={{ color: '#a78bfa' }} />
          <span>Specialist agents · Auto-routes to the right expert</span>
        </div>
      </div>

      {/* Main split layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left pane: Input */}
        <div style={{
          width: '380px', flexShrink: 0, display: 'flex', flexDirection: 'column',
          borderRight: '1px solid #1e1e1e', backgroundColor: '#0d0d0d',
        }}>
          {/* Agent selector */}
          <div style={{
            padding: '12px 14px 10px', borderBottom: '1px solid #1a1a1a',
            display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0,
          }}>
            <div style={{ fontSize: '10px', color: '#3a3a3a', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Specialist Agent
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <button
                onClick={() => setSelectedAgent('auto')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '5px 10px', borderRadius: '20px',
                  backgroundColor: selectedAgent === 'auto' ? '#3b82f622' : 'transparent',
                  border: `1px solid ${selectedAgent === 'auto' ? '#3b82f6' : '#1e1e1e'}`,
                  color: selectedAgent === 'auto' ? '#3b82f6' : '#606060',
                  fontSize: '12px', cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <FiZap size={11} />
                <span>Auto</span>
              </button>
              {agents.map(agent => (
                <AgentPill
                  key={agent.id}
                  agent={agent}
                  active={selectedAgent === agent.id}
                  onClick={setSelectedAgent}
                />
              ))}
            </div>
            {selectedAgent !== 'auto' && activeAgent && (
              <div style={{ fontSize: '11px', color: '#4a4a4a', lineHeight: '1.5' }}>
                {activeAgent.emoji} {activeAgent.desc}
              </div>
            )}
          </div>

          {/* Prompt area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 14px', gap: '10px' }}>
            <div style={{ fontSize: '10px', color: '#3a3a3a', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Describe what to build
            </div>
            <div style={{
              flex: 1, position: 'relative',
              backgroundColor: '#111111', border: '1px solid #2a2a2a',
              borderRadius: '6px', display: 'flex', flexDirection: 'column',
              transition: 'border-color 0.15s',
            }}
              onFocusCapture={e => e.currentTarget.style.borderColor = '#a78bfa55'}
              onBlurCapture={e => e.currentTarget.style.borderColor = '#2a2a2a'}
            >
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={e => { setPrompt(e.target.value); autoResize(); }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleBuild();
                }}
                placeholder={`Describe what to build...\n\nExamples:\n• "Build a React dashboard with live charts"\n• "Create a FastAPI CRUD API for users"\n• "Write a NIFTY 50 RSI screener"\n• "Automate Chrome opening and googling"\n• "Debug this Python code: ..."\n\nCtrl+Enter to build`}
                style={{
                  flex: 1, minHeight: '160px',
                  backgroundColor: 'transparent', border: 'none', outline: 'none',
                  color: '#e8e8e8', fontSize: '13px', lineHeight: '1.7',
                  resize: 'none', fontFamily: "'Geist', sans-serif",
                  padding: '12px',
                }}
              />
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {SpeechRecognitionAPI && (
                <button
                  onClick={listening ? stopListening : startListening}
                  title={listening ? 'Stop voice input' : 'Voice input'}
                  style={{
                    width: '38px', height: '38px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '6px', flexShrink: 0,
                    backgroundColor: listening ? '#0a2a1a' : '#111111',
                    border: `1px solid ${listening ? '#10b98166' : '#2a2a2a'}`,
                    color: listening ? '#10b981' : '#5a5a5a',
                    cursor: 'pointer', transition: 'all 0.15s',
                    animation: listening ? 'pulse 1.5s ease-in-out infinite' : 'none',
                  }}
                >
                  {listening ? <FiMic size={15} /> : <FiMicOff size={15} />}
                </button>
              )}
              <button
                onClick={handleBuild}
                disabled={!prompt.trim() || isBuilding}
                style={{
                  flex: 1, height: '38px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  borderRadius: '6px', border: 'none',
                  backgroundColor: (prompt.trim() && !isBuilding) ? '#a78bfa' : '#1a1a1a',
                  color: (prompt.trim() && !isBuilding) ? '#ffffff' : '#3a3a3a',
                  fontSize: '13px', fontWeight: '600',
                  cursor: (prompt.trim() && !isBuilding) ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s',
                }}
              >
                {isBuilding ? (
                  <>
                    <FiLoader size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Building...</span>
                  </>
                ) : (
                  <>
                    <FiZap size={14} />
                    <span>Build  (Ctrl+↵)</span>
                  </>
                )}
              </button>
            </div>

            {error && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '8px',
                padding: '10px 12px', borderRadius: '6px',
                backgroundColor: '#1a0a0a', border: '1px solid #4a1a1a',
                color: '#f87171', fontSize: '12px', lineHeight: '1.5',
              }}>
                <FiAlertCircle size={13} style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>{error}</span>
              </div>
            )}

            {/* Tips */}
            {!result && !isBuilding && (
              <div style={{
                padding: '10px 12px', borderRadius: '6px',
                backgroundColor: '#111111', border: '1px solid #1a1a1a',
              }}>
                <div style={{ fontSize: '10px', color: '#3a3a3a', letterSpacing: '0.06em', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Quick ideas
                </div>
                {[
                  '🎨 React dark dashboard with charts',
                  '⚙️ FastAPI user auth with JWT',
                  '📈 NIFTY RSI momentum screener',
                  '🤖 Auto-rename files in a folder',
                  '🔍 Debug and fix my Python error',
                ].map((tip, i) => (
                  <button
                    key={i}
                    onClick={() => { setPrompt(tip.slice(3)); setTimeout(autoResize, 10); }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '5px 0', backgroundColor: 'transparent', border: 'none',
                      color: '#4a4a4a', fontSize: '12px', cursor: 'pointer',
                      transition: 'color 0.1s', lineHeight: '1.5',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#8b8b8b'}
                    onMouseLeave={e => e.currentTarget.style.color = '#4a4a4a'}
                  >
                    {tip}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right pane: Code output + Terminal */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {isBuilding ? (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '16px',
            }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                backgroundColor: '#111111', border: '1px solid #a78bfa33',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FiZap size={22} style={{ color: '#a78bfa', animation: 'pulse 1s ease-in-out infinite' }} />
              </div>
              <div style={{ fontSize: '14px', color: '#6a6a6a' }}>
                {selectedAgent === 'auto' ? 'Routing to specialist agent...' : `${activeAgent?.emoji} ${activeAgent?.name} is coding...`}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[0, 0.2, 0.4].map((d, i) => (
                  <div key={i} style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    backgroundColor: '#a78bfa',
                    animation: `pulse 1.2s ease-in-out ${d}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          ) : result ? (
            <>
              {/* Code panel */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
                {/* Code header */}
                <div style={{
                  height: '36px', backgroundColor: '#111111',
                  borderBottom: '1px solid #1e1e1e',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0 14px', flexShrink: 0,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px' }}>{agentInfo?.emoji}</span>
                    <span style={{ fontSize: '12px', color: AGENT_COLORS[result.agent_id] || '#a78bfa', fontWeight: '500' }}>
                      {agentInfo?.name}
                    </span>
                    <span style={{ fontSize: '11px', color: '#3a3a3a' }}>· generated code</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CopyBtn text={rawCode} />
                    <button
                      onClick={handleRun}
                      disabled={isRunning}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        padding: '3px 10px', borderRadius: '4px',
                        backgroundColor: isRunning ? '#0a1a0a' : '#0a2a1a',
                        border: `1px solid ${isRunning ? '#1a3a1a' : '#10b98166'}`,
                        color: isRunning ? '#3a8a5a' : '#10b981',
                        fontSize: '11px', cursor: isRunning ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {isRunning
                        ? <FiLoader size={11} style={{ animation: 'spin 1s linear infinite' }} />
                        : <FiPlay size={11} />
                      }
                      <span>{isRunning ? 'Running...' : 'Run Python'}</span>
                    </button>
                  </div>
                </div>

                {/* Code area */}
                <div
                  ref={codeRef}
                  style={{
                    flex: 1, overflowY: 'auto', overflowX: 'auto',
                    padding: '16px 20px',
                    fontFamily: "'Geist Mono', 'Fira Code', 'Cascadia Code', monospace",
                    fontSize: '13px', lineHeight: '1.7',
                    backgroundColor: '#0d0d0d',
                  }}
                >
                  <pre style={{ margin: 0, whiteSpace: 'pre', color: '#abb2bf' }}>
                    <code dangerouslySetInnerHTML={{ __html: highlightCode(rawCode || result.code) }} />
                  </pre>
                </div>
              </div>

              {/* Terminal panel */}
              {terminalOutput && (
                <div style={{
                  height: '200px', flexShrink: 0, display: 'flex', flexDirection: 'column',
                  borderTop: '1px solid #1e1e1e', backgroundColor: '#080808',
                }}>
                  <div style={{
                    height: '30px', backgroundColor: '#0f0f0f',
                    borderBottom: '1px solid #1a1a1a',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 14px', flexShrink: 0,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FiTerminal size={12} style={{ color: '#4a4a4a' }} />
                      <span style={{ fontSize: '11px', color: '#4a4a4a' }}>Terminal Output</span>
                      <span style={{
                        fontSize: '10px', padding: '1px 6px', borderRadius: '10px',
                        backgroundColor: terminalOutput.success ? '#0a2a1a' : '#2a0a0a',
                        color: terminalOutput.success ? '#10b981' : '#f87171',
                        border: `1px solid ${terminalOutput.success ? '#10b98133' : '#f8717133'}`,
                      }}>
                        {terminalOutput.success ? '✓ Success' : '✗ Error'}
                      </span>
                      {terminalOutput.runtime_ms > 0 && (
                        <span style={{ fontSize: '10px', color: '#3a3a3a' }}>
                          {terminalOutput.runtime_ms}ms
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setTerminalOutput(null)}
                      style={{
                        background: 'none', border: 'none', color: '#3a3a3a',
                        cursor: 'pointer', fontSize: '16px', lineHeight: 1, padding: '0 4px',
                      }}
                    >×</button>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>
                    {terminalOutput.output && (
                      <pre style={{
                        margin: 0, fontFamily: "'Geist Mono', monospace",
                        fontSize: '12px', color: '#a8cc8c', lineHeight: '1.6',
                        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                      }}>
                        {terminalOutput.output}
                      </pre>
                    )}
                    {terminalOutput.error && (
                      <pre style={{
                        margin: terminalOutput.output ? '8px 0 0' : 0,
                        fontFamily: "'Geist Mono', monospace",
                        fontSize: '12px', color: '#f87171', lineHeight: '1.6',
                        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                      }}>
                        {terminalOutput.error}
                      </pre>
                    )}
                    {!terminalOutput.output && !terminalOutput.error && (
                      <span style={{ color: '#3a3a3a', fontSize: '12px' }}>
                        (no output)
                      </span>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Empty state */
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '12px',
              padding: '40px',
            }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '16px',
                backgroundColor: '#111111', border: '1px solid #1e1e1e',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FiCode size={28} style={{ color: '#2a2a2a' }} />
              </div>
              <div style={{ fontSize: '15px', color: '#4a4a4a', fontWeight: '500' }}>
                Describe what you want to build
              </div>
              <div style={{
                fontSize: '12px', color: '#3a3a3a', textAlign: 'center',
                maxWidth: '340px', lineHeight: '1.7',
              }}>
                The right specialist agent is auto-selected, or pick one manually.
                Generated code appears here with syntax highlighting.
                Python code can be run instantly.
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {agents.map(a => (
                  <span key={a.id} style={{
                    fontSize: '11px', padding: '3px 10px', borderRadius: '20px',
                    backgroundColor: '#111111', border: '1px solid #1e1e1e',
                    color: AGENT_COLORS[a.id] || '#5a5a5a',
                  }}>
                    {a.emoji} {a.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
};

export default VibeCoder;
