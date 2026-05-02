import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

// ── Palette ───────────────────────────────────────────────────────────────────
const BL = '#437DFD';
const GR = '#00C48C';
const RD = '#FD5B5D';
const OR = '#FF8C42';
const DK = '#0C0C0C';
const BG = '#F5F4F2';
const BORDER = 'rgba(0,0,0,0.08)';
const CARD = { background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16 };

const uid = () => Math.random().toString(36).slice(2, 10);
const fmt = (n) => n == null ? '—' : Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pctColor = (v) => v > 0 ? GR : v < 0 ? RD : '#888';
const pctSign  = (v) => v > 0 ? '+' : '';

const LS_PORTFOLIO = 'airis_tp_portfolio';
const LS_WATCHLIST = 'airis_tp_watchlist';
const LS_CHAT      = 'airis_tp_chat';

const loadLS = (key, def) => { try { return JSON.parse(localStorage.getItem(key)) ?? def; } catch { return def; } };
const saveLS = (key, v)   => { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} };

// ── Hooks ──────────────────────────────────────────────────────────────────────
function useWindowWidth() {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return w;
}

// ── Spinner ────────────────────────────────────────────────────────────────────
const Spinner = ({ size = 16, color = BL }) => (
  <span style={{ display: 'inline-block', width: size, height: size, border: `2px solid ${color}22`, borderTopColor: color, borderRadius: '50%', animation: 'tpSpin 0.7s linear infinite' }} />
);

// ── Index Chip ─────────────────────────────────────────────────────────────────
const IndexChip = ({ idx, compact }) => {
  if (!idx) return (
    <div style={{ background: 'rgba(0,0,0,0.04)', borderRadius: compact ? 8 : 12, padding: compact ? '6px 8px' : '10px 12px', animation: 'tpPulse 1.5s infinite', minHeight: compact ? 48 : 62 }} />
  );
  const up = idx.change_pct >= 0;
  return (
    <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: compact ? 8 : 12, padding: compact ? '6px 8px' : '10px 12px' }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#bbb', letterSpacing: '0.04em', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{idx.name}</div>
      <div style={{ fontSize: compact ? 12 : 14, fontWeight: 700, color: DK }}>{fmt(idx.price)}</div>
      <div style={{ fontSize: 9.5, fontWeight: 600, color: up ? GR : RD }}>{pctSign(idx.change_pct)}{idx.change_pct?.toFixed(2)}%</div>
    </div>
  );
};

// ── Mover Row ─────────────────────────────────────────────────────────────────
const MoverRow = ({ m, onQuote }) => {
  const up = m.change_pct >= 0;
  return (
    <div onClick={() => onQuote(m.symbol)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 12px', cursor: 'pointer', borderRadius: 8, transition: 'background 0.12s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.03)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: DK, whiteSpace: 'nowrap' }}>{m.symbol?.replace('.NS','')}</div>
        <div style={{ fontSize: 10, color: '#bbb', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name || ''}</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: DK }}>₹{fmt(m.price)}</div>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: up ? GR : RD }}>{pctSign(m.change_pct)}{m.change_pct?.toFixed(2)}%</div>
      </div>
    </div>
  );
};

// ── Market Sidebar ─────────────────────────────────────────────────────────────
const MarketSidebar = ({ indices, movers, onQuote, isMobile, sidebarOpen, onClose }) => {
  const gainers = movers.filter(m => m.change_pct > 0).slice(0, 5);
  const losers  = movers.filter(m => m.change_pct < 0).slice(0, 5);

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <div style={{ padding: '14px 14px 10px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#aaa', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Live Markets</span>
          {isMobile && <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 22, padding: '0 2px', lineHeight: 1 }}>×</button>}
        </div>
      </div>

      <div style={{ padding: '10px 10px 6px', flexShrink: 0 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: '#ccc', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 7 }}>Indices</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
          {[
            { sym: '^NSEI',    name: 'NIFTY 50'   },
            { sym: '^BSESN',   name: 'SENSEX'     },
            { sym: '^NSEBANK', name: 'BANK NIFTY' },
            { sym: '^CNXIT',   name: 'NIFTY IT'   },
          ].map(({ sym, name }) => (
            <IndexChip key={sym} idx={indices.find(x => x.symbol === sym) || (indices.find(x=>x.symbol===sym) ? null : { symbol: sym, name, price: 0, change_pct: 0 })} compact />
          ))}
        </div>
      </div>

      <div style={{ padding: '8px 4px 0', flexShrink: 0 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: GR, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0 10px', marginBottom: 2 }}>▲ Top Gainers</div>
        {gainers.length === 0
          ? <div style={{ fontSize: 11, color: '#ccc', padding: '8px 14px' }}>Loading…</div>
          : gainers.map(m => <MoverRow key={m.symbol} m={m} onQuote={onQuote} />)
        }
      </div>

      <div style={{ padding: '8px 4px 16px' }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: RD, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0 10px', marginBottom: 2 }}>▼ Top Losers</div>
        {losers.length === 0
          ? <div style={{ fontSize: 11, color: '#ccc', padding: '8px 14px' }}>Loading…</div>
          : losers.map(m => <MoverRow key={m.symbol} m={m} onQuote={onQuote} />)
        }
      </div>
    </div>
  );

  if (isMobile) {
    if (!sidebarOpen) return null;
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 300 }}>
        <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 270, background: '#fff', boxShadow: '4px 0 32px rgba(0,0,0,0.18)', overflowY: 'auto', borderRadius: '0 20px 20px 0' }}>
          {content}
        </div>
      </div>
    );
  }
  return (
    <div style={{ width: 222, flexShrink: 0, background: '#fff', borderRight: `1px solid ${BORDER}`, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {content}
    </div>
  );
};

// ── Quote Modal ────────────────────────────────────────────────────────────────
const QuoteModal = ({ quote, loading, onClose, onAddWatchlist, onAddPortfolio }) => {
  const w = useWindowWidth();
  const isMob = w < 640;
  if (!loading && !quote) return null;

  const sym = quote?.symbol?.replace('.NS','') || quote?.symbol;
  const up  = quote?.change_pct >= 0;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 400, display: 'flex', alignItems: isMob ? 'flex-end' : 'center', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: isMob ? '20px 20px 0 0' : 22, padding: isMob ? '20px 18px 28px' : '26px 26px 22px', width: isMob ? '100%' : 380, maxWidth: '96vw', boxShadow: '0 24px 80px rgba(0,0,0,0.18)', fontFamily: "'DM Sans', sans-serif" }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '24px 0' }}>
            <Spinner size={22} /> <span style={{ fontSize: 14, color: '#888' }}>Fetching quote…</span>
          </div>
        ) : (
          <>
            {isMob && <div style={{ width: 40, height: 4, background: 'rgba(0,0,0,0.1)', borderRadius: 2, margin: '0 auto 16px' }} />}
            <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 22, lineHeight: 1, padding: '2px 6px' }}>×</button>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: up ? `${GR}15` : `${RD}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: up ? GR : RD }}>{sym?.[0]}</div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: DK }}>{sym}</div>
                  <div style={{ fontSize: 12, color: '#999' }}>{quote.name || 'NSE Listed'}</div>
                </div>
              </div>
              <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.03em', color: DK }}>₹{fmt(quote.price)}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: up ? GR : RD }}>{pctSign(quote.change_pct)}{quote.change_pct?.toFixed(2)}% ({pctSign(quote.change)}{fmt(quote.change)} today)</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', marginBottom: 18, borderTop: `1px solid ${BORDER}`, paddingTop: 14 }}>
              {[
                ['Open',     fmt(quote.open)],
                ['Prev Close', fmt(quote.prev_close)],
                ['High',     fmt(quote.high)],
                ['Low',      fmt(quote.low)],
                ['52W High', fmt(quote.year_high ?? quote['52w_high'])],
                ['52W Low',  fmt(quote.year_low  ?? quote['52w_low'])],
                ['Volume',   quote.volume ? (quote.volume/1e6).toFixed(2)+'M' : '—'],
                ['Mkt Cap',  quote.market_cap ? '₹'+(quote.market_cap/1e7).toFixed(0)+'Cr' : '—'],
              ].map(([k,v]) => (
                <div key={k}>
                  <div style={{ fontSize: 10, color: '#bbb', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: DK }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => onAddWatchlist(quote)} style={{ flex: 1, padding: '11px', fontSize: 13, fontWeight: 600, color: BL, background: `${BL}10`, border: `1px solid ${BL}30`, borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit' }}>★ Watchlist</button>
              <button onClick={() => onAddPortfolio(quote)} style={{ flex: 1, padding: '11px', fontSize: 13, fontWeight: 600, color: '#fff', background: GR, border: 'none', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit' }}>+ Portfolio</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ── AI Assistant Tab ───────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  { label: 'Top picks today',   text: 'What are the best stocks to buy today? Give specific picks with entry price, target, and stop-loss.' },
  { label: 'NIFTY analysis',    text: 'Give me a detailed NIFTY 50 technical analysis — RSI, MACD, support/resistance, and near-term outlook.' },
  { label: 'Market sentiment',  text: 'What is the overall market sentiment today? Any major news or FII/DII flows affecting Indian markets?' },
  { label: 'IT sector outlook', text: 'Analyze the IT sector — which IT stocks look strong right now and why?' },
  { label: 'Banking stocks',    text: 'Which banking and financial stocks should I watch this week? Key levels to watch.' },
  { label: 'Risk management',   text: 'Explain proper position sizing and risk management for Indian stock trading.' },
  { label: 'Pharma picks',      text: 'What are the best pharma stocks for the next 6 months? Fundamentals + technicals.' },
  { label: 'IPO analysis',      text: 'Any upcoming IPOs worth applying to? What should I look for in an IPO?' },
];

const renderMarkdown = (text) => {
  return text.split('\n').map((line, i) => {
    const html = line
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
    return (
      <div key={i} style={{ lineHeight: 1.7, marginBottom: line === '' ? 4 : 0 }}
        dangerouslySetInnerHTML={{ __html: html || '&nbsp;' }} />
    );
  });
};

const AIAssistant = ({ portfolio, watchlist, indices, movers, isMobile }) => {
  const [messages, setMessages] = useState(() => loadLS(LS_CHAT, [
    {
      role: 'assistant', id: uid(),
      text: "Hello! I'm your **AI Trading Expert** — specialized in Indian markets (NSE/BSE).\n\nI analyze stocks using technical indicators (RSI, MACD, Bollinger Bands), fundamentals (P/E, ROE, earnings), sector trends, FII/DII flows, and market news to give you **actionable trading insights**.\n\nAsk me for stock picks, portfolio review, market analysis, or trading strategies!",
    }
  ]));
  const [input,     setInput]     = useState('');
  const [busy,      setBusy]      = useState(false);
  const [search,    setSearch]    = useState('');
  const [searchRes, setSearchRes] = useState([]);
  const msgsEnd  = useRef(null);
  const inputRef = useRef(null);
  const debRef   = useRef(null);

  useEffect(() => { saveLS(LS_CHAT, messages.slice(-80)); }, [messages]);
  useEffect(() => { msgsEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, busy]);

  useEffect(() => {
    clearTimeout(debRef.current);
    if (search.trim().length < 2) { setSearchRes([]); return; }
    debRef.current = setTimeout(async () => {
      try {
        const r = await api.searchStocks(search.trim());
        setSearchRes(r.results?.slice(0, 6) || []);
      } catch { setSearchRes([]); }
    }, 280);
  }, [search]);

  const buildContext = () => {
    const parts = [];
    const ni = indices.find(x => x.symbol === '^NSEI');
    const sx = indices.find(x => x.symbol === '^BSESN');
    const bn = indices.find(x => x.symbol === '^NSEBANK');
    if (ni) parts.push(`NIFTY 50: ${ni.price} (${pctSign(ni.change_pct)}${ni.change_pct?.toFixed(2)}%)`);
    if (sx) parts.push(`SENSEX: ${sx.price} (${pctSign(sx.change_pct)}${sx.change_pct?.toFixed(2)}%)`);
    if (bn) parts.push(`BANK NIFTY: ${bn.price} (${pctSign(bn.change_pct)}${bn.change_pct?.toFixed(2)}%)`);
    const g3 = movers.filter(m=>m.change_pct>0).slice(0,4).map(m=>`${m.symbol?.replace('.NS','')} ${pctSign(m.change_pct)}${m.change_pct?.toFixed(2)}%`).join(', ');
    const l3 = movers.filter(m=>m.change_pct<0).slice(0,4).map(m=>`${m.symbol?.replace('.NS','')} ${m.change_pct?.toFixed(2)}%`).join(', ');
    if (g3) parts.push(`Top gainers: ${g3}`);
    if (l3) parts.push(`Top losers: ${l3}`);
    if (watchlist.length) parts.push(`User watchlist: ${watchlist.map(w=>w.symbol?.replace('.NS','')).join(', ')}`);
    if (portfolio.length) parts.push(`User portfolio: ${portfolio.map(p=>`${p.symbol?.replace('.NS','')} (${p.qty}@₹${p.buyPrice})`).join(', ')}`);
    return parts.join('. ');
  };

  const sendMsg = async (text) => {
    const msg = (text || input).trim();
    if (!msg || busy) return;
    setInput(''); setSearch(''); setSearchRes([]);
    const userMsg = { role: 'user', text: msg, id: uid() };
    setMessages(p => [...p, userMsg]);
    setBusy(true);
    try {
      const ctx = buildContext();
      const r = await api.tradingChat(msg, ctx);
      setMessages(p => [...p, { role: 'assistant', text: r.reply || r.message || 'No response.', id: uid() }]);
    } catch {
      setMessages(p => [...p, { role: 'error', text: '⚠️ Could not reach AI. Go to Settings → AI Engine and add your Groq API key (free at console.groq.com).', id: uid() }]);
    }
    setBusy(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const selectStock = (sym) => {
    setSearch(''); setSearchRes([]);
    setInput(prev => (prev.trim() ? prev + ' ' : '') + sym.replace('.NS',''));
    inputRef.current?.focus();
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '12px 14px' : '16px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map(m => (
          <div key={m.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, background: m.role === 'user' ? `${BL}18` : m.role === 'error' ? `${RD}12` : `${GR}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>
              {m.role === 'user' ? '👤' : m.role === 'error' ? '⚠️' : '🤖'}
            </div>
            <div style={{ maxWidth: isMobile ? '88%' : '78%', background: m.role === 'user' ? `${BL}0E` : '#fff', border: `1px solid ${m.role === 'user' ? `${BL}22` : BORDER}`, borderRadius: m.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px', padding: '10px 14px', fontSize: isMobile ? 13 : 13.5, color: m.role === 'error' ? RD : DK, lineHeight: 1.65, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', wordBreak: 'break-word' }}>
              {renderMarkdown(m.text)}
            </div>
          </div>
        ))}
        {busy && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: `${GR}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>🤖</div>
            <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '4px 16px 16px 16px', padding: '12px 16px', display: 'flex', gap: 5, alignItems: 'center' }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: GR, animation: `tpDot 1s ${i*0.2}s ease-in-out infinite` }} />)}
            </div>
          </div>
        )}
        <div ref={msgsEnd} />
      </div>

      {/* Quick prompts */}
      <div style={{ padding: isMobile ? '8px 10px 4px' : '8px 22px 4px', borderTop: `1px solid ${BORDER}`, display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0 }}>
        {QUICK_PROMPTS.map(q => (
          <button key={q.label} onClick={() => sendMsg(q.text)} disabled={busy}
            style={{ fontSize: 11.5, padding: '5px 12px', borderRadius: 20, border: `1px solid rgba(0,0,0,0.1)`, background: 'rgba(255,255,255,0.9)', color: '#555', cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.15s' }}
            onMouseEnter={e => { if(!busy) { e.currentTarget.style.borderColor = BL; e.currentTarget.style.color = BL; }}}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'; e.currentTarget.style.color = '#555'; }}>
            {q.label}
          </button>
        ))}
      </div>

      {/* Input box */}
      <div style={{ padding: isMobile ? '8px 10px 12px' : '10px 22px 16px', position: 'relative', flexShrink: 0 }}>
        {searchRes.length > 0 && (
          <div style={{ position: 'absolute', bottom: '100%', left: isMobile ? 10 : 22, right: isMobile ? 10 : 22, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 14, boxShadow: '0 8px 28px rgba(0,0,0,0.10)', zIndex: 100, overflow: 'hidden', marginBottom: 4 }}>
            {searchRes.map(r => (
              <div key={r.symbol} onClick={() => selectStock(r.symbol)}
                style={{ padding: '9px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid rgba(0,0,0,0.04)`, transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = `${BL}08`}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <span style={{ fontSize: 13, fontWeight: 700, color: DK }}>{r.symbol?.replace('.NS','')}</span>
                <span style={{ fontSize: 11, color: '#bbb', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', background: '#fff', border: `1.5px solid rgba(0,0,0,0.1)`, borderRadius: 16, padding: '10px 12px 10px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'border-color 0.2s' }}
          onFocusCapture={e => e.currentTarget.style.borderColor = BL + '60'}
          onBlurCapture={e  => e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => {
              setInput(e.target.value);
              const word = e.target.value.split(/\s/).pop();
              if (word.length >= 2) setSearch(word); else setSearchRes([]);
            }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
            placeholder="Ask your trading expert… (type a stock name to search)"
            rows={1}
            disabled={busy}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: DK, fontSize: 13.5, resize: 'none', fontFamily: 'inherit', lineHeight: 1.55, maxHeight: 100, minHeight: 22 }}
          />
          <button onClick={() => sendMsg()} disabled={!input.trim() || busy}
            style={{ width: 36, height: 36, borderRadius: 10, border: 'none', cursor: input.trim() && !busy ? 'pointer' : 'not-allowed', background: input.trim() && !busy ? `linear-gradient(135deg,${BL},#2C76FF)` : 'rgba(0,0,0,0.06)', color: input.trim() && !busy ? '#fff' : '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s', boxShadow: input.trim() && !busy ? '0 4px 12px rgba(67,125,253,0.35)' : 'none' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M22 2L15 22L11 13L2 9L22 2z" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.2"/></svg>
          </button>
        </div>
        <div style={{ fontSize: 10.5, color: '#ccc', textAlign: 'center', marginTop: 5 }}>Enter to send · Groq-powered trading intelligence</div>
      </div>
    </div>
  );
};

// ── Portfolio Tab ──────────────────────────────────────────────────────────────
const PortfolioTab = ({ portfolio, setPortfolio, onQuote, isMobile }) => {
  const [showAdd, setShowAdd]   = useState(false);
  const [sym,     setSym]       = useState('');
  const [qty,     setQty]       = useState('');
  const [buyPx,   setBuyPx]     = useState('');
  const [prices,  setPrices]    = useState({});
  const [loading, setLoading]   = useState(false);
  const [symSug,  setSymSug]    = useState([]);
  const debRef                  = useRef(null);

  useEffect(() => { saveLS(LS_PORTFOLIO, portfolio); }, [portfolio]);
  useEffect(() => { if (portfolio.length) refreshPrices(); }, []);

  useEffect(() => {
    clearTimeout(debRef.current);
    if (sym.trim().length < 2) { setSymSug([]); return; }
    debRef.current = setTimeout(async () => {
      try { const r = await api.searchStocks(sym.trim()); setSymSug(r.results?.slice(0,5)||[]); }
      catch { setSymSug([]); }
    }, 280);
  }, [sym]);

  const refreshPrices = async () => {
    if (!portfolio.length) return;
    setLoading(true);
    const res = {};
    await Promise.allSettled(portfolio.map(async p => {
      try { const r = await api.getMarketQuote(p.symbol); if (r.success) res[p.symbol] = r.quote; } catch {}
    }));
    setPrices(res); setLoading(false);
  };

  const addPosition = () => {
    const s = sym.trim().toUpperCase();
    const q = parseFloat(qty);
    const b = parseFloat(buyPx);
    if (!s || !q || !b || q <= 0 || b <= 0) return;
    const full = s.endsWith('.NS') ? s : s + '.NS';
    const idx  = portfolio.findIndex(p => p.symbol === full);
    if (idx >= 0) {
      const updated = [...portfolio];
      const old = updated[idx];
      const tot = old.qty + q;
      updated[idx] = { ...old, qty: tot, buyPrice: Math.round((old.qty*old.buyPrice + q*b)/tot*100)/100 };
      setPortfolio(updated);
    } else {
      setPortfolio(p => [...p, { id: uid(), symbol: full, qty: q, buyPrice: b, addedAt: new Date().toISOString() }]);
    }
    setSym(''); setQty(''); setBuyPx(''); setShowAdd(false); setSymSug([]);
  };

  const totalInvested = portfolio.reduce((s,p) => s + p.qty*p.buyPrice, 0);
  const totalCurrent  = portfolio.reduce((s,p) => { const cp = prices[p.symbol]?.price||p.buyPrice; return s+p.qty*cp; }, 0);
  const totalPnl      = totalCurrent - totalInvested;
  const totalPct      = totalInvested > 0 ? (totalPnl/totalInvested*100) : 0;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Summary */}
      <div style={{ padding: isMobile ? '10px 14px' : '12px 22px', borderBottom: `1px solid ${BORDER}`, display: 'flex', gap: isMobile ? 14 : 24, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0, background: '#fff' }}>
        {[
          ['Invested',  `₹${fmt(totalInvested)}`,          DK],
          ['Current',   `₹${fmt(totalCurrent)}`,           DK],
          ['P&L',       `${pctSign(totalPnl)}₹${fmt(Math.abs(totalPnl))} (${pctSign(totalPct)}${totalPct.toFixed(2)}%)`, pctColor(totalPnl)],
        ].map(([lbl, val, clr]) => (
          <div key={lbl}>
            <div style={{ fontSize: 9.5, color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{lbl}</div>
            <div style={{ fontSize: isMobile ? 14 : 16, fontWeight: 700, color: clr }}>{val}</div>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexShrink: 0 }}>
          <button onClick={refreshPrices} disabled={loading}
            style={{ fontSize: 12, padding: '7px 13px', borderRadius: 10, border: `1px solid ${BORDER}`, background: '#fff', cursor: 'pointer', color: '#555', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}>
            {loading ? <Spinner size={11} /> : '↻'} Refresh
          </button>
          <button onClick={() => setShowAdd(s => !s)}
            style={{ fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 10, border: 'none', background: GR, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
            + Add
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div style={{ padding: isMobile ? '12px 14px' : '14px 22px', borderBottom: `1px solid ${BORDER}`, background: `${GR}05`, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 130px' }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 5 }}>Stock Symbol</label>
              <input value={sym} onChange={e => setSym(e.target.value.toUpperCase())} placeholder="RELIANCE"
                style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: `1.5px solid ${BORDER}`, borderRadius: 10, fontFamily: 'inherit', outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                onFocus={e => e.currentTarget.style.borderColor = BL+'60'}
                onBlur={e  => e.currentTarget.style.borderColor = BORDER}
              />
              {symSug.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 10, zIndex: 100, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', marginTop: 2, overflow: 'hidden' }}>
                  {symSug.map(r => (
                    <div key={r.symbol} onClick={() => { setSym(r.symbol.replace('.NS','')); setSymSug([]); }}
                      style={{ padding: '9px 12px', cursor: 'pointer', fontSize: 12, display: 'flex', justifyContent: 'space-between', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background=`${BL}08`}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <strong>{r.symbol.replace('.NS','')}</strong>
                      <span style={{ color:'#bbb', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ flex: '1 1 80px' }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 5 }}>Qty</label>
              <input type="number" value={qty} onChange={e => setQty(e.target.value)} placeholder="100" min="1"
                style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: `1.5px solid ${BORDER}`, borderRadius: 10, fontFamily: 'inherit', outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                onFocus={e => e.currentTarget.style.borderColor = BL+'60'}
                onBlur={e  => e.currentTarget.style.borderColor = BORDER}
              />
            </div>
            <div style={{ flex: '1 1 100px' }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 5 }}>Buy Price (₹)</label>
              <input type="number" value={buyPx} onChange={e => setBuyPx(e.target.value)} placeholder="1500" step="0.01"
                style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: `1.5px solid ${BORDER}`, borderRadius: 10, fontFamily: 'inherit', outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                onFocus={e => e.currentTarget.style.borderColor = BL+'60'}
                onBlur={e  => e.currentTarget.style.borderColor = BORDER}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button onClick={addPosition} style={{ padding: '9px 18px', fontSize: 13, fontWeight: 600, background: GR, color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit' }}>Add</button>
              <button onClick={() => { setShowAdd(false); setSym(''); setQty(''); setBuyPx(''); setSymSug([]); }}
                style={{ padding: '9px 14px', fontSize: 13, background: 'transparent', color: '#888', border: `1px solid ${BORDER}`, borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio list / table */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {portfolio.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px', color: '#ccc' }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>💼</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#bbb', marginBottom: 8 }}>No positions yet</div>
            <div style={{ fontSize: 13 }}>Tap "Add" to start tracking your holdings</div>
          </div>
        ) : isMobile ? (
          /* Mobile card view */
          <div style={{ padding: '12px 14px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {portfolio.map(p => {
              const q     = prices[p.symbol];
              const cp    = q?.price ?? null;
              const pnl   = cp != null ? (cp - p.buyPrice) * p.qty : null;
              const pnlPct = cp != null && p.buyPrice > 0 ? ((cp - p.buyPrice)/p.buyPrice*100) : null;
              const sym   = p.symbol.replace('.NS','');
              return (
                <div key={p.id} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 14, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div onClick={() => onQuote(p.symbol)} style={{ cursor: 'pointer' }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: DK }}>{sym}</div>
                      <div style={{ fontSize: 11, color: '#bbb' }}>{p.qty} shares @ ₹{fmt(p.buyPrice)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: DK }}>{cp != null ? `₹${fmt(cp)}` : <Spinner size={14}/>}</div>
                      {q && <div style={{ fontSize: 11.5, color: pctColor(q.change_pct), fontWeight: 600 }}>{pctSign(q.change_pct)}{q.change_pct?.toFixed(2)}% today</div>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${BORDER}`, paddingTop: 10 }}>
                    <div>
                      <div style={{ fontSize: 10, color: '#aaa', fontWeight: 600, textTransform: 'uppercase' }}>P&L</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: pnl != null ? pctColor(pnl) : '#bbb' }}>
                        {pnl != null ? `${pctSign(pnl)}₹${fmt(Math.abs(pnl))}` : '—'}
                        {pnlPct != null && <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 5 }}>({pctSign(pnlPct)}{pnlPct.toFixed(2)}%)</span>}
                      </div>
                    </div>
                    <button onClick={() => setPortfolio(p2 => p2.filter(x => x.id !== p.id))} style={{ background: `${RD}10`, border: 'none', cursor: 'pointer', color: RD, fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 8, fontFamily: 'inherit' }}>Remove</button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Desktop table view */
          <div style={{ padding: '0 22px 24px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${BORDER}` }}>
                  {['Stock','Qty','Buy Price','Curr Price','Day Chg','P&L','P&L%',''].map(h => (
                    <th key={h} style={{ fontSize: 10, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '12px 8px', textAlign: h === 'Stock' ? 'left' : h === '' ? 'center' : 'right' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {portfolio.map(p => {
                  const q      = prices[p.symbol];
                  const cp     = q?.price ?? null;
                  const pnl    = cp != null ? (cp - p.buyPrice)*p.qty : null;
                  const pnlPct = cp != null && p.buyPrice > 0 ? ((cp-p.buyPrice)/p.buyPrice*100) : null;
                  const sym    = p.symbol.replace('.NS','');
                  return (
                    <tr key={p.id} style={{ borderBottom: `1px solid rgba(0,0,0,0.04)`, transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background='rgba(0,0,0,0.015)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <td style={{ padding: '11px 8px' }}>
                        <div onClick={() => onQuote(p.symbol)} style={{ cursor: 'pointer' }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: DK }}>{sym}</div>
                          <div style={{ fontSize: 10, color: '#ccc' }}>NSE</div>
                        </div>
                      </td>
                      <td style={{ padding: '11px 8px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: DK }}>{p.qty}</td>
                      <td style={{ padding: '11px 8px', textAlign: 'right', fontSize: 13, color: '#666' }}>₹{fmt(p.buyPrice)}</td>
                      <td style={{ padding: '11px 8px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: DK }}>{cp != null ? `₹${fmt(cp)}` : <Spinner size={12}/>}</td>
                      <td style={{ padding: '11px 8px', textAlign: 'right', fontSize: 12.5, fontWeight: 600, color: q ? pctColor(q.change_pct) : '#ccc' }}>{q ? `${pctSign(q.change_pct)}${q.change_pct?.toFixed(2)}%` : '—'}</td>
                      <td style={{ padding: '11px 8px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: pnl!=null ? pctColor(pnl) : '#ccc' }}>{pnl!=null ? `${pctSign(pnl)}₹${fmt(Math.abs(pnl))}` : '—'}</td>
                      <td style={{ padding: '11px 8px', textAlign: 'right', fontSize: 12.5, fontWeight: 600, color: pnlPct!=null ? pctColor(pnlPct) : '#ccc' }}>{pnlPct!=null ? `${pctSign(pnlPct)}${pnlPct.toFixed(2)}%` : '—'}</td>
                      <td style={{ padding: '11px 8px', textAlign: 'center' }}>
                        <button onClick={() => setPortfolio(p2 => p2.filter(x => x.id !== p.id))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ddd', fontSize: 17, transition: 'color 0.15s', padding: '2px 6px' }}
                          onMouseEnter={e => e.currentTarget.style.color = RD}
                          onMouseLeave={e => e.currentTarget.style.color = '#ddd'}>×</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Watchlist Tab ──────────────────────────────────────────────────────────────
const WatchlistTab = ({ watchlist, setWatchlist, onQuote, isMobile }) => {
  const [search,  setSearch]  = useState('');
  const [results, setResults] = useState([]);
  const [prices,  setPrices]  = useState({});
  const [loading, setLoading] = useState(false);
  const debRef                = useRef(null);

  useEffect(() => { saveLS(LS_WATCHLIST, watchlist); }, [watchlist]);
  useEffect(() => { if (watchlist.length) refreshPrices(); }, []);

  useEffect(() => {
    clearTimeout(debRef.current);
    if (search.trim().length < 2) { setResults([]); return; }
    debRef.current = setTimeout(async () => {
      try { const r = await api.searchStocks(search.trim()); setResults(r.results?.slice(0,8)||[]); }
      catch { setResults([]); }
    }, 280);
  }, [search]);

  const refreshPrices = async () => {
    if (!watchlist.length) return;
    setLoading(true);
    const res = {};
    await Promise.allSettled(watchlist.map(async w => {
      try { const r = await api.getMarketQuote(w.symbol); if (r.success) res[w.symbol] = r.quote; } catch {}
    }));
    setPrices(res); setLoading(false);
  };

  const addToWatch = (stock) => {
    if (watchlist.find(w => w.symbol === stock.symbol)) return;
    setWatchlist(p => [...p, { id: uid(), symbol: stock.symbol, name: stock.name, addedAt: new Date().toISOString() }]);
    setSearch(''); setResults([]);
  };

  const remove = (id) => {
    const w = watchlist.find(x => x.id === id);
    if (w) setPrices(p => { const n={...p}; delete n[w.symbol]; return n; });
    setWatchlist(p => p.filter(x => x.id !== id));
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Search */}
      <div style={{ padding: isMobile ? '12px 14px' : '14px 22px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0, background: '#fff' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search stocks to add…"
              style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: `1.5px solid rgba(0,0,0,0.1)`, borderRadius: 12, fontFamily: 'inherit', outline: 'none', background: '#fff', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
              onFocus={e => e.currentTarget.style.borderColor = BL+'60'}
              onBlur={e  => e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'}
            />
            {results.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, zIndex: 100, boxShadow: '0 8px 28px rgba(0,0,0,0.10)', marginTop: 4, overflow: 'hidden' }}>
                {results.map(r => {
                  const already = !!watchlist.find(w => w.symbol === r.symbol);
                  return (
                    <div key={r.symbol} onClick={() => !already && addToWatch(r)}
                      style={{ padding: '10px 14px', cursor: already ? 'default' : 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: already ? 'rgba(0,0,0,0.02)' : 'transparent', transition: 'background 0.1s', borderBottom: `1px solid rgba(0,0,0,0.04)` }}
                      onMouseEnter={e => { if (!already) e.currentTarget.style.background = `${BL}08`; }}
                      onMouseLeave={e => e.currentTarget.style.background = already ? 'rgba(0,0,0,0.02)' : 'transparent'}>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: DK }}>{r.symbol?.replace('.NS','')}</span>
                        <span style={{ fontSize: 11, color: '#bbb', marginLeft: 8 }}>{r.name}</span>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: already ? GR : BL, flexShrink: 0 }}>{already ? '✓ Added' : '+ Add'}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <button onClick={refreshPrices} disabled={loading || !watchlist.length}
            style={{ padding: '10px 16px', fontSize: 12, fontWeight: 600, border: `1px solid ${BORDER}`, borderRadius: 12, background: '#fff', cursor: 'pointer', color: '#555', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            {loading ? <Spinner size={12}/> : '↻'} Refresh
          </button>
        </div>
      </div>

      {/* Watchlist grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '12px 14px 20px' : '16px 22px 24px' }}>
        {watchlist.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px', color: '#ccc' }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>⭐</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#bbb', marginBottom: 8 }}>Watchlist is empty</div>
            <div style={{ fontSize: 13 }}>Search for stocks above to add them</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(200px, 1fr))', gap: isMobile ? 8 : 10 }}>
            {watchlist.map(w => {
              const q   = prices[w.symbol];
              const sym = w.symbol?.replace('.NS','');
              const up  = q?.change_pct >= 0;
              return (
                <div key={w.id} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 14, padding: isMobile ? '12px 12px 10px' : '14px 14px 12px', position: 'relative', cursor: 'pointer', transition: 'box-shadow 0.15s, transform 0.15s', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                  onClick={() => onQuote(w.symbol)}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.10)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'none'; }}>
                  <button onClick={e => { e.stopPropagation(); remove(w.id); }}
                    style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#ddd', fontSize: 16, padding: '2px 4px', transition: 'color 0.15s', lineHeight: 1 }}
                    onMouseEnter={e => e.currentTarget.style.color = RD}
                    onMouseLeave={e => e.currentTarget.style.color = '#ddd'}>×</button>
                  <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 700, color: DK, marginBottom: 2, paddingRight: 18, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sym}</div>
                  <div style={{ fontSize: 10, color: '#bbb', marginBottom: isMobile ? 8 : 10, paddingRight: 20, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.name || q?.name || 'NSE'}</div>
                  {q ? (
                    <>
                      <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: DK }}>₹{fmt(q.price)}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: up ? GR : RD, marginTop: 1 }}>{pctSign(q.change_pct)}{q.change_pct?.toFixed(2)}%</div>
                    </>
                  ) : (
                    <div style={{ paddingTop: 4 }}><Spinner size={14}/></div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Market Tab ─────────────────────────────────────────────────────────────────
const MarketTab = ({ indices, movers, onQuote, isMobile }) => {
  const gainers = movers.filter(m => m.change_pct > 0).sort((a,b) => b.change_pct - a.change_pct);
  const losers  = movers.filter(m => m.change_pct < 0).sort((a,b) => a.change_pct - b.change_pct);

  const sectors = [
    { name: 'Banking',    idx: '^NSEBANK',   color: BL },
    { name: 'IT',         idx: '^CNXIT',     color: '#7B61FF' },
    { name: 'FMCG',       idx: '^CNXFMCG',  color: GR },
    { name: 'Auto',       idx: '^CNXAUTO',  color: OR },
    { name: 'Pharma',     idx: '^CNXPHARMA', color: RD },
    { name: 'Midcap 50',  idx: '^NSEMDCP50', color: '#2C76FF' },
  ];

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '14px 14px 28px' : '22px 22px 32px' }}>
      {/* All Indices */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#bbb', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>All Indices</div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
          {indices.map(idx => {
            const up = idx.change_pct >= 0;
            return (
              <div key={idx.symbol} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#bbb', letterSpacing: '0.04em', marginBottom: 5 }}>{idx.name || idx.symbol}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: DK }}>{fmt(idx.price)}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: up ? GR : RD, marginTop: 2 }}>{pctSign(idx.change_pct)}{idx.change_pct?.toFixed(2)}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sector Heatmap */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#bbb', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Sector Performance</div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
          {sectors.map(s => {
            const idx = indices.find(x => x.symbol === s.idx);
            const pct = idx?.change_pct ?? 0;
            const up  = pct >= 0;
            const alpha = Math.min(Math.abs(pct)/3, 1);
            const bg  = up ? `rgba(0,196,140,${0.06+alpha*0.20})` : `rgba(253,91,93,${0.06+alpha*0.20})`;
            return (
              <div key={s.name} style={{ background: bg, border: `1px solid ${up ? `${GR}30` : `${RD}30`}`, borderRadius: 12, padding: isMobile ? '10px 8px' : '12px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: isMobile ? 10 : 12, fontWeight: 700, color: DK, marginBottom: 4 }}>{s.name}</div>
                <div style={{ fontSize: isMobile ? 14 : 17, fontWeight: 800, color: up ? GR : RD }}>{pctSign(pct)}{pct.toFixed(2)}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gainers & Losers */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
        {[
          { label: '▲ Top Gainers', list: gainers, clr: GR, bg: `${GR}07` },
          { label: '▼ Top Losers',  list: losers,  clr: RD, bg: `${RD}07` },
        ].map(({ label, list, clr, bg }) => (
          <div key={label} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', borderBottom: `1px solid ${BORDER}`, background: bg }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: clr }}>{label}</span>
            </div>
            {list.length === 0
              ? <div style={{ padding: '20px 14px', fontSize: 12, color: '#ccc', textAlign: 'center' }}>Loading data…</div>
              : list.map(m => <MoverRow key={m.symbol} m={m} onQuote={onQuote} />)
            }
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Main TradingPage ───────────────────────────────────────────────────────────
const TABS = [
  { id: 'ai',        label: '🤖', full: 'AI Expert'  },
  { id: 'portfolio', label: '💼', full: 'Portfolio'   },
  { id: 'watchlist', label: '⭐', full: 'Watchlist'   },
  { id: 'market',    label: '📊', full: 'Markets'     },
];

export default function TradingPage() {
  const navigate   = useNavigate();
  const w          = useWindowWidth();
  const isMobile   = w < 768;
  const isTablet   = w >= 768 && w < 1100;

  const [activeTab,   setActiveTab]   = useState('ai');
  const [indices,     setIndices]     = useState([]);
  const [movers,      setMovers]      = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quote,       setQuote]       = useState(null);
  const [quoteLoad,   setQuoteLoad]   = useState(false);
  const [portfolio,   setPortfolio]   = useState(() => loadLS(LS_PORTFOLIO, []));
  const [watchlist,   setWatchlist]   = useState(() => loadLS(LS_WATCHLIST, []));

  useEffect(() => {
    const onWL = (e) => setWatchlist(e.detail.watchlist || []);
    const onPF = (e) => setPortfolio(e.detail.portfolio || []);
    window.addEventListener('airis_watchlist_updated', onWL);
    window.addEventListener('airis_portfolio_updated', onPF);
    return () => { window.removeEventListener('airis_watchlist_updated', onWL); window.removeEventListener('airis_portfolio_updated', onPF); };
  }, []);

  const fetchIndices = useCallback(async () => {
    try { const r = await api.getMarketIndices(); if (r.success) setIndices(r.indices || []); } catch {}
  }, []);

  const fetchMovers = useCallback(async () => {
    try { const r = await api.getMarketMovers(); if (r.success) setMovers([...(r.gainers||[]), ...(r.losers||[])]); } catch {}
  }, []);

  useEffect(() => {
    fetchIndices(); fetchMovers();
    const t = setInterval(() => { fetchIndices(); fetchMovers(); }, 60000);
    return () => clearInterval(t);
  }, []);

  const openQuote = async (sym) => {
    setQuote(null); setQuoteLoad(true);
    try { const r = await api.getMarketQuote(sym); if (r.success) setQuote(r.quote); }
    catch {} finally { setQuoteLoad(false); }
  };

  const addToWatchlistFromQuote = (q) => {
    if (!watchlist.find(w2 => w2.symbol === q.symbol)) {
      setWatchlist(p => [...p, { id: uid(), symbol: q.symbol, name: q.name, addedAt: new Date().toISOString() }]);
    }
    setQuote(null); setActiveTab('watchlist');
  };

  const addToPortfolioFromQuote = (q) => {
    setQuote(null); setActiveTab('portfolio');
  };

  const nifty  = indices.find(x => x.symbol === '^NSEI');
  const niftyUp = nifty?.change_pct >= 0;

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: BG, fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", overflow: 'hidden' }}>

      {/* ── Header ── */}
      <header style={{ height: 54, flexShrink: 0, background: '#fff', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', padding: '0 14px', gap: 10, zIndex: 10 }}>
        <button onClick={() => navigate('/app')}
          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: '#666', background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: 10, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, fontWeight: 500 }}>
          ← Back
        </button>

        {isMobile && (
          <button onClick={() => setSidebarOpen(true)}
            style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '5px 10px', cursor: 'pointer', fontSize: 12, color: '#666', fontFamily: 'inherit', flexShrink: 0 }}>
            📊
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <div style={{ width: 30, height: 30, borderRadius: 10, background: `${GR}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>📈</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: isMobile ? 13.5 : 15, fontWeight: 700, color: DK, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Trading Intelligence</div>
            {!isMobile && <div style={{ fontSize: 10.5, color: '#aaa' }}>AI-powered NSE/BSE analysis · Live data</div>}
          </div>
        </div>

        {nifty && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: niftyUp ? `${GR}10` : `${RD}10`, border: `1px solid ${niftyUp ? GR : RD}30`, borderRadius: 100, padding: isMobile ? '4px 8px' : '4px 12px', flexShrink: 0 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: niftyUp ? GR : RD, animation: 'tpPulse 2s infinite' }} />
            <span style={{ fontSize: isMobile ? 11 : 12, fontWeight: 700, color: niftyUp ? GR : RD }}>
              {isMobile ? '' : 'NIFTY '}{fmt(nifty.price)}
            </span>
            <span style={{ fontSize: 10.5, fontWeight: 600, color: niftyUp ? GR : RD }}>{pctSign(nifty.change_pct)}{nifty.change_pct?.toFixed(2)}%</span>
          </div>
        )}
      </header>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* Left sidebar (desktop/tablet) */}
        {!isMobile && (
          <MarketSidebar indices={indices} movers={movers} onQuote={openQuote} isMobile={false} sidebarOpen={false} onClose={() => {}} />
        )}

        {/* Mobile sidebar */}
        {isMobile && (
          <MarketSidebar indices={indices} movers={movers} onQuote={openQuote} isMobile sidebarOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {/* Tab bar */}
          <div style={{ height: 46, flexShrink: 0, background: '#fff', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'stretch', padding: '0 4px', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: isMobile ? '0 14px' : '0 18px', fontSize: isMobile ? 12 : 13, fontWeight: activeTab === t.id ? 700 : 500, color: activeTab === t.id ? BL : '#888', background: 'transparent', border: 'none', cursor: 'pointer', borderBottom: `2.5px solid ${activeTab === t.id ? BL : 'transparent'}`, transition: 'all 0.15s', whiteSpace: 'nowrap', fontFamily: 'inherit', flexShrink: 0 }}>
                <span>{t.label}</span>
                {(!isMobile || w >= 400) && <span>{t.full}</span>}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: isMobile ? BG : '#F7F8FA' }}>
            {activeTab === 'ai'        && <AIAssistant portfolio={portfolio} watchlist={watchlist} indices={indices} movers={movers} isMobile={isMobile} />}
            {activeTab === 'portfolio' && <PortfolioTab portfolio={portfolio} setPortfolio={setPortfolio} onQuote={openQuote} isMobile={isMobile} />}
            {activeTab === 'watchlist' && <WatchlistTab watchlist={watchlist} setWatchlist={setWatchlist} onQuote={openQuote} isMobile={isMobile} />}
            {activeTab === 'market'    && <MarketTab indices={indices} movers={movers} onQuote={openQuote} isMobile={isMobile} />}
          </div>
        </div>
      </div>

      {/* Quote modal */}
      <QuoteModal
        quote={quote}
        loading={quoteLoad}
        onClose={() => { setQuote(null); setQuoteLoad(false); }}
        onAddWatchlist={addToWatchlistFromQuote}
        onAddPortfolio={addToPortfolioFromQuote}
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 2px; }
        @keyframes tpSpin   { to { transform: rotate(360deg); } }
        @keyframes tpPulse  { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes tpDot    { 0%,100%{transform:scale(0.65);opacity:0.4} 50%{transform:scale(1.2);opacity:1} }
      `}</style>
    </div>
  );
}
