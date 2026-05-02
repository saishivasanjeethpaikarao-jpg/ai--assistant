import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

// ── Palette ───────────────────────────────────────────────────────────────────
const BL = '#437DFD';
const GR = '#00C48C';
const RD = '#FD5B5D';
const OR = '#FF8C42';
const DK = '#0C0C0C';
const BORDER = 'rgba(0,0,0,0.08)';

const uid = () => Math.random().toString(36).slice(2, 10);
const fmt = (n) => n == null ? '—' : Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pctColor = (v) => v > 0 ? GR : v < 0 ? RD : '#888';
const pctSign  = (v) => v > 0 ? '+' : '';

const LS_PORTFOLIO  = 'airis_tp_portfolio';
const LS_WATCHLIST  = 'airis_tp_watchlist';
const LS_CHAT       = 'airis_tp_chat';

const loadLS = (key, def) => { try { return JSON.parse(localStorage.getItem(key)) ?? def; } catch { return def; } };
const saveLS = (key, v)   => { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} };

// ── Small components ──────────────────────────────────────────────────────────

const Spinner = ({ size = 16, color = BL }) => (
  <span style={{ display: 'inline-block', width: size, height: size, border: `2px solid ${color}22`, borderTopColor: color, borderRadius: '50%', animation: 'tpSpin 0.7s linear infinite' }} />
);

const Tag = ({ label, color = BL }) => (
  <span style={{ fontSize: 10, fontWeight: 700, background: `${color}18`, color, padding: '2px 7px', borderRadius: 20, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</span>
);

const Chip = ({ label, onClick, active }) => (
  <button onClick={onClick} style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20, border: `1px solid ${active ? BL : 'rgba(0,0,0,0.1)'}`, background: active ? `${BL}12` : 'rgba(255,255,255,0.8)', color: active ? BL : '#666', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}>
    {label}
  </button>
);

// ── Index Chip ────────────────────────────────────────────────────────────────
const IndexChip = ({ idx }) => {
  if (!idx) return <div style={{ flex: 1, height: 52, background: 'rgba(0,0,0,0.04)', borderRadius: 10, animation: 'tpPulse 1.5s infinite' }} />;
  const up = idx.change_pct >= 0;
  return (
    <div style={{ flex: 1, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '8px 10px' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', letterSpacing: '0.04em', marginBottom: 3 }}>{idx.name}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: DK, letterSpacing: '-0.02em' }}>{fmt(idx.price)}</div>
      <div style={{ fontSize: 10.5, fontWeight: 600, color: up ? GR : RD }}>{pctSign(idx.change_pct)}{idx.change_pct?.toFixed(2)}%</div>
    </div>
  );
};

// ── Mover Row ────────────────────────────────────────────────────────────────
const MoverRow = ({ m, onQuote }) => {
  const up = m.change_pct >= 0;
  return (
    <div onClick={() => onQuote(m.symbol)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', cursor: 'pointer', borderRadius: 8, transition: 'background 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.03)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: DK }}>{m.symbol?.replace('.NS','')}</div>
        <div style={{ fontSize: 10, color: '#aaa', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name || ''}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: DK }}>₹{fmt(m.price)}</div>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: up ? GR : RD }}>{pctSign(m.change_pct)}{m.change_pct?.toFixed(2)}%</div>
      </div>
    </div>
  );
};

// ── Market Sidebar ────────────────────────────────────────────────────────────
const MarketSidebar = ({ indices, movers, onQuote, isMobile, sidebarOpen, onClose }) => {
  const gainers = movers.filter(m => m.change_pct > 0).slice(0, 5);
  const losers  = movers.filter(m => m.change_pct < 0).slice(0, 5);

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ padding: '14px 14px 10px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#aaa', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Live Markets</span>
          {isMobile && <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 18, padding: '0 4px', lineHeight: 1 }}>×</button>}
        </div>
      </div>
      {/* Indices */}
      <div style={{ padding: '10px 10px 6px' }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: '#bbb', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Indices</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
          {['NIFTY 50','^NSEI','SENSEX','^BSESN','BANK NIFTY','^NSEBANK','NIFTY IT','^CNXIT'].reduce((acc,v,i,arr) => {
            if (i % 2 === 0) acc.push([arr[i], arr[i+1]]);
            return acc;
          }, []).map(([name, sym]) => (
            <IndexChip key={sym} idx={indices.find(x => x.symbol === sym)} />
          ))}
        </div>
      </div>
      {/* Top Gainers */}
      <div style={{ padding: '8px 4px 0' }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: GR, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0 10px', marginBottom: 2 }}>▲ Top Gainers</div>
        {gainers.length === 0
          ? <div style={{ fontSize: 11, color: '#bbb', padding: '8px 14px' }}>Loading…</div>
          : gainers.map(m => <MoverRow key={m.symbol} m={m} onQuote={onQuote} />)
        }
      </div>
      {/* Top Losers */}
      <div style={{ padding: '8px 4px 12px' }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: RD, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0 10px', marginBottom: 2 }}>▼ Top Losers</div>
        {losers.length === 0
          ? <div style={{ fontSize: 11, color: '#bbb', padding: '8px 14px' }}>Loading…</div>
          : losers.map(m => <MoverRow key={m.symbol} m={m} onQuote={onQuote} />)
        }
      </div>
    </div>
  );

  if (isMobile) {
    if (!sidebarOpen) return null;
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 300 }}>
        <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} />
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 260, background: '#fff', boxShadow: '4px 0 24px rgba(0,0,0,0.15)', overflowY: 'auto' }}>
          {content}
        </div>
      </div>
    );
  }
  return (
    <div style={{ width: 230, flexShrink: 0, background: '#fff', borderRight: `1px solid ${BORDER}`, overflowY: 'auto', overflowX: 'hidden' }}>
      {content}
    </div>
  );
};

// ── Quote Card ────────────────────────────────────────────────────────────────
const QuoteCard = ({ quote, onClose, onAddWatchlist, onAddPortfolio }) => {
  if (!quote) return null;
  const sym = quote.symbol?.replace('.NS','') || quote.symbol;
  const up = quote.change_pct >= 0;
  return (
    <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 400, width: 360, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', padding: '24px 24px 20px', fontFamily: "'DM Sans', sans-serif" }}>
      <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 20, lineHeight: 1 }}>×</button>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: up ? `${GR}18` : `${RD}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: up ? GR : RD }}>{sym[0]}</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: DK }}>{sym}</div>
            <div style={{ fontSize: 12, color: '#888' }}>{quote.name || 'NSE Listed'}</div>
          </div>
        </div>
        <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em', color: DK }}>₹{fmt(quote.price)}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: up ? GR : RD }}>{pctSign(quote.change_pct)}{quote.change_pct?.toFixed(2)}% ({pctSign(quote.change)}{fmt(quote.change)} today)</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', marginBottom: 18, borderTop: `1px solid ${BORDER}`, paddingTop: 14 }}>
        {[['Open', fmt(quote.open)],['Prev Close', fmt(quote.prev_close)],['High', fmt(quote.high)],['Low', fmt(quote.low)],['52W High', fmt(quote['52w_high'])],['52W Low', fmt(quote['52w_low'])],['Volume', quote.volume ? (quote.volume/1e6).toFixed(2)+'M' : '—'],['Mkt Cap', quote.market_cap ? '₹'+(quote.market_cap/1e7).toFixed(0)+'Cr' : '—']].map(([k,v]) => (
          <div key={k}>
            <div style={{ fontSize: 10, color: '#bbb', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: DK }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => onAddWatchlist(quote)} style={{ flex: 1, padding: '9px', fontSize: 12.5, fontWeight: 600, color: BL, background: `${BL}10`, border: `1px solid ${BL}30`, borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit' }}>★ Add to Watchlist</button>
        <button onClick={() => onAddPortfolio(quote)} style={{ flex: 1, padding: '9px', fontSize: 12.5, fontWeight: 600, color: '#fff', background: GR, border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit' }}>+ Add to Portfolio</button>
      </div>
    </div>
  );
};

// ── AI Assistant Tab ──────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  'What are the top stocks to buy today?',
  'Analyze NIFTY 50 technical setup',
  'Best IT sector stocks to invest now',
  'What is the market sentiment today?',
  'Which banking stocks look good?',
  'Explain RSI and how to use it',
  'Best pharma stocks for long term',
  'How to manage risk in trading?',
];

const AIAssistant = ({ portfolio, watchlist, indices, movers }) => {
  const [messages, setMessages] = useState(() => loadLS(LS_CHAT, [
    { role: 'assistant', text: "👋 Hi! I'm your AI Trading Expert. I analyze Indian markets, NSE/BSE stocks, technical indicators, and news to give you actionable insights.\n\nAsk me anything — stock picks, market analysis, portfolio advice, or trading strategies!", id: uid() }
  ]));
  const [input, setInput]     = useState('');
  const [busy, setBusy]       = useState(false);
  const [search, setSearch]   = useState('');
  const [searchRes, setSearchRes] = useState([]);
  const msgsEndRef  = useRef(null);
  const inputRef    = useRef(null);
  const debRef      = useRef(null);

  useEffect(() => { saveLS(LS_CHAT, messages.slice(-60)); }, [messages]);
  useEffect(() => { msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, busy]);

  useEffect(() => {
    clearTimeout(debRef.current);
    if (search.trim().length < 2) { setSearchRes([]); return; }
    debRef.current = setTimeout(async () => {
      try {
        const r = await api.searchStocks(search.trim());
        setSearchRes(r.results?.slice(0, 5) || []);
      } catch { setSearchRes([]); }
    }, 250);
  }, [search]);

  const buildContext = () => {
    let ctx = '';
    if (indices?.length) {
      const ni = indices.find(x => x.symbol === '^NSEI');
      const sx = indices.find(x => x.symbol === '^BSESN');
      if (ni) ctx += `NIFTY 50: ${ni.price} (${pctSign(ni.change_pct)}${ni.change_pct?.toFixed(2)}%). `;
      if (sx) ctx += `SENSEX: ${sx.price} (${pctSign(sx.change_pct)}${sx.change_pct?.toFixed(2)}%). `;
    }
    if (movers?.length) {
      const top3g = movers.filter(m=>m.change_pct>0).slice(0,3).map(m=>`${m.symbol?.replace('.NS','')} +${m.change_pct?.toFixed(2)}%`).join(', ');
      const top3l = movers.filter(m=>m.change_pct<0).slice(0,3).map(m=>`${m.symbol?.replace('.NS','')} ${m.change_pct?.toFixed(2)}%`).join(', ');
      if (top3g) ctx += `Top gainers: ${top3g}. `;
      if (top3l) ctx += `Top losers: ${top3l}. `;
    }
    if (watchlist?.length) ctx += `User watchlist: ${watchlist.map(w=>w.symbol?.replace('.NS','')).join(', ')}. `;
    if (portfolio?.length) ctx += `User portfolio: ${portfolio.map(p=>`${p.symbol?.replace('.NS','')} (${p.qty} shares @ ₹${p.buyPrice})`).join(', ')}. `;
    return ctx;
  };

  const sendMsg = async (text) => {
    const msg = (text || input).trim();
    if (!msg || busy) return;
    setInput(''); setSearch(''); setSearchRes([]);
    setMessages(p => [...p, { role: 'user', text: msg, id: uid() }]);
    setBusy(true);
    try {
      const ctx = buildContext();
      const r = await api.tradingChat(msg, ctx);
      setMessages(p => [...p, { role: 'assistant', text: r.reply || r.message || 'No response.', id: uid() }]);
    } catch (e) {
      setMessages(p => [...p, { role: 'error', text: '⚠️ Could not reach AI. Check your Groq API key in Settings.', id: uid() }]);
    }
    setBusy(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const selectStock = (sym) => {
    setSearch(''); setSearchRes([]);
    setInput(prev => prev + (prev.trim() ? ' ' : '') + sym.replace('.NS', ''));
    inputRef.current?.focus();
  };

  const renderText = (text) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      const bold = line.replace(/\*\*(.*?)\*\*/g, (_, m) => `<strong>${m}</strong>`);
      return <div key={i} style={{ lineHeight: 1.65, marginBottom: line === '' ? 6 : 0 }} dangerouslySetInnerHTML={{ __html: bold || '&nbsp;' }} />;
    });
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {messages.map(m => (
          <div key={m.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
            <div style={{ width: 30, height: 30, borderRadius: 10, background: m.role === 'user' ? `${BL}18` : m.role === 'error' ? `${RD}15` : `${GR}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}>
              {m.role === 'user' ? '👤' : m.role === 'error' ? '⚠️' : '🤖'}
            </div>
            <div style={{ maxWidth: '80%', background: m.role === 'user' ? `${BL}10` : '#fff', border: `1px solid ${m.role === 'user' ? `${BL}20` : BORDER}`, borderRadius: m.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px', padding: '10px 14px', fontSize: 13, color: m.role === 'error' ? RD : DK, lineHeight: 1.6, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              {renderText(m.text)}
            </div>
          </div>
        ))}
        {busy && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ width: 30, height: 30, borderRadius: 10, background: `${GR}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🤖</div>
            <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '4px 16px 16px 16px', padding: '10px 16px', display: 'flex', gap: 5, alignItems: 'center' }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: GR, animation: `tpDot 1s ${i*0.2}s ease-in-out infinite` }} />)}
            </div>
          </div>
        )}
        <div ref={msgsEndRef} />
      </div>

      {/* Quick prompts */}
      <div style={{ padding: '8px 20px 4px', display: 'flex', gap: 6, flexWrap: 'wrap', borderTop: `1px solid ${BORDER}` }}>
        {QUICK_PROMPTS.slice(0, 4).map(q => (
          <button key={q} onClick={() => sendMsg(q)} disabled={busy} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, border: `1px solid rgba(0,0,0,0.1)`, background: 'rgba(255,255,255,0.8)', color: '#666', cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
            onMouseEnter={e => { if(!busy) { e.currentTarget.style.borderColor = BL; e.currentTarget.style.color = BL; }}}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'; e.currentTarget.style.color = '#666'; }}>
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: '10px 20px 16px', position: 'relative' }}>
        {searchRes.length > 0 && (
          <div style={{ position: 'absolute', bottom: '100%', left: 20, right: 20, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 100, overflow: 'hidden', marginBottom: 4 }}>
            {searchRes.map(r => (
              <div key={r.symbol} onClick={() => selectStock(r.symbol)} style={{ padding: '9px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid rgba(0,0,0,0.04)`, transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = `${BL}08`}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <span style={{ fontSize: 13, fontWeight: 600, color: DK }}>{r.symbol?.replace('.NS','')}</span>
                <span style={{ fontSize: 11, color: '#aaa' }}>{r.name}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', background: '#fff', border: `1.5px solid rgba(0,0,0,0.1)`, borderRadius: 14, padding: '10px 12px 10px 16px', transition: 'border-color 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          onFocusCapture={e => e.currentTarget.style.borderColor = BL+'60'}
          onBlurCapture={e => e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => {
              setInput(e.target.value);
              const last = e.target.value.split(' ').pop();
              if (last.length >= 2) setSearch(last);
              else setSearchRes([]);
            }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
            placeholder="Ask your trading expert… (type a stock symbol to search)"
            rows={1}
            disabled={busy}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: DK, fontSize: 13.5, resize: 'none', fontFamily: 'inherit', lineHeight: 1.55, maxHeight: 100, minHeight: 22 }}
          />
          <button onClick={() => sendMsg()} disabled={!input.trim() || busy}
            style={{ width: 36, height: 36, borderRadius: 10, border: 'none', cursor: input.trim() && !busy ? 'pointer' : 'not-allowed', background: input.trim() && !busy ? `linear-gradient(135deg,${BL},#2C76FF)` : 'rgba(0,0,0,0.06)', color: input.trim() && !busy ? '#fff' : '#bbb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s', boxShadow: input.trim() && !busy ? '0 4px 12px rgba(67,125,253,0.35)' : 'none' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M22 2L15 22L11 13L2 9L22 2z" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.15"/></svg>
          </button>
        </div>
        <div style={{ fontSize: 10.5, color: '#bbb', textAlign: 'center', marginTop: 5 }}>Enter to send · Powered by Groq AI</div>
      </div>
    </div>
  );
};

// ── Portfolio Tab ─────────────────────────────────────────────────────────────
const PortfolioTab = ({ portfolio, setPortfolio, onQuote }) => {
  const [showAdd, setShowAdd]   = useState(false);
  const [sym, setSym]           = useState('');
  const [qty, setQty]           = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [prices, setPrices]     = useState({});
  const [loading, setLoading]   = useState(false);
  const [symSug, setSymSug]     = useState([]);
  const debRef                  = useRef(null);

  useEffect(() => { saveLS(LS_PORTFOLIO, portfolio); }, [portfolio]);
  useEffect(() => { if (portfolio.length) refreshPrices(); }, []);

  useEffect(() => {
    clearTimeout(debRef.current);
    if (sym.trim().length < 2) { setSymSug([]); return; }
    debRef.current = setTimeout(async () => {
      try {
        const r = await api.searchStocks(sym.trim());
        setSymSug(r.results?.slice(0, 5) || []);
      } catch { setSymSug([]); }
    }, 250);
  }, [sym]);

  const refreshPrices = async () => {
    if (!portfolio.length) return;
    setLoading(true);
    const res = {};
    await Promise.allSettled(portfolio.map(async p => {
      try {
        const r = await api.getMarketQuote(p.symbol);
        if (r.success) res[p.symbol] = r.quote;
      } catch {}
    }));
    setPrices(res);
    setLoading(false);
  };

  const addPosition = () => {
    const s = sym.trim().toUpperCase();
    const q = parseFloat(qty);
    const b = parseFloat(buyPrice);
    if (!s || !q || !b || q <= 0 || b <= 0) return;
    const fullSym = s.endsWith('.NS') ? s : s + '.NS';
    const existing = portfolio.findIndex(p => p.symbol === fullSym);
    if (existing >= 0) {
      const updated = [...portfolio];
      const old = updated[existing];
      const totalQty = old.qty + q;
      const avgPrice = (old.qty * old.buyPrice + q * b) / totalQty;
      updated[existing] = { ...old, qty: totalQty, buyPrice: Math.round(avgPrice * 100) / 100 };
      setPortfolio(updated);
    } else {
      setPortfolio(p => [...p, { id: uid(), symbol: fullSym, qty: q, buyPrice: b, addedAt: new Date().toISOString() }]);
    }
    setSym(''); setQty(''); setBuyPrice(''); setShowAdd(false); setSymSug([]);
  };

  const removePosition = (id) => setPortfolio(p => p.filter(x => x.id !== id));

  const totalInvested = portfolio.reduce((s, p) => s + p.qty * p.buyPrice, 0);
  const totalCurrent  = portfolio.reduce((s, p) => {
    const cp = prices[p.symbol]?.price || p.buyPrice;
    return s + p.qty * cp;
  }, 0);
  const totalPnl    = totalCurrent - totalInvested;
  const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested * 100) : 0;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Summary bar */}
      <div style={{ padding: '12px 20px', borderBottom: `1px solid ${BORDER}`, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 10, color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Invested</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: DK }}>₹{fmt(totalInvested)}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Current</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: DK }}>₹{fmt(totalCurrent)}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>P&L</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: pctColor(totalPnl) }}>
            {pctSign(totalPnl)}₹{fmt(Math.abs(totalPnl))} ({pctSign(totalPnlPct)}{totalPnlPct.toFixed(2)}%)
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button onClick={refreshPrices} disabled={loading} style={{ fontSize: 12, padding: '7px 14px', borderRadius: 10, border: `1px solid ${BORDER}`, background: '#fff', cursor: 'pointer', color: '#555', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}>
            {loading ? <Spinner size={12} /> : '↻'} Refresh
          </button>
          <button onClick={() => setShowAdd(s => !s)} style={{ fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 10, border: 'none', background: GR, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
            + Add Position
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${BORDER}`, background: `${GR}06`, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 120px' }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 5 }}>Stock Symbol</label>
              <input value={sym} onChange={e => setSym(e.target.value.toUpperCase())} placeholder="RELIANCE"
                style={{ width: '100%', padding: '8px 12px', fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 10, fontFamily: 'inherit', outline: 'none', background: '#fff' }}
              />
              {symSug.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 10, zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', marginTop: 2 }}>
                  {symSug.map(r => <div key={r.symbol} onClick={() => { setSym(r.symbol.replace('.NS','')); setSymSug([]); }} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 12, display: 'flex', justifyContent: 'space-between' }} onMouseEnter={e => e.currentTarget.style.background=`${BL}08`} onMouseLeave={e => e.currentTarget.style.background='transparent'}><b>{r.symbol.replace('.NS','')}</b><span style={{color:'#aaa'}}>{r.name}</span></div>)}
                </div>
              )}
            </div>
            <div style={{ flex: '1 1 80px' }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 5 }}>Quantity</label>
              <input type="number" value={qty} onChange={e => setQty(e.target.value)} placeholder="100" min="1"
                style={{ width: '100%', padding: '8px 12px', fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 10, fontFamily: 'inherit', outline: 'none', background: '#fff' }}
              />
            </div>
            <div style={{ flex: '1 1 100px' }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 5 }}>Buy Price (₹)</label>
              <input type="number" value={buyPrice} onChange={e => setBuyPrice(e.target.value)} placeholder="1500.00" step="0.01"
                style={{ width: '100%', padding: '8px 12px', fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 10, fontFamily: 'inherit', outline: 'none', background: '#fff' }}
              />
            </div>
            <button onClick={addPosition} style={{ padding: '9px 18px', fontSize: 13, fontWeight: 600, background: GR, color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit' }}>Add</button>
            <button onClick={() => { setShowAdd(false); setSym(''); setQty(''); setBuyPrice(''); setSymSug([]); }} style={{ padding: '9px 14px', fontSize: 13, background: 'transparent', color: '#888', border: `1px solid ${BORDER}`, borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
        {portfolio.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#bbb' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💼</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#ccc', marginBottom: 8 }}>No positions yet</div>
            <div style={{ fontSize: 13 }}>Click "Add Position" to track your holdings</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${BORDER}` }}>
                  {['Symbol','Qty','Buy Price','Curr Price','Change','P&L','P&L%',''].map(h => (
                    <th key={h} style={{ fontSize: 10.5, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '10px 8px', textAlign: 'right', ...(h === 'Symbol' || h === '' ? { textAlign: h === '' ? 'center' : 'left' } : {}) }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {portfolio.map(p => {
                  const q  = prices[p.symbol];
                  const cp = q?.price ?? null;
                  const pnl    = cp != null ? (cp - p.buyPrice) * p.qty : null;
                  const pnlPct = cp != null && p.buyPrice > 0 ? ((cp - p.buyPrice) / p.buyPrice * 100) : null;
                  const sym    = p.symbol.replace('.NS','');
                  return (
                    <tr key={p.id} style={{ borderBottom: `1px solid rgba(0,0,0,0.04)`, transition: 'background 0.12s' }}
                      onMouseEnter={e => e.currentTarget.style.background='rgba(0,0,0,0.015)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <td style={{ padding: '10px 8px' }}>
                        <div onClick={() => onQuote(p.symbol)} style={{ cursor: 'pointer' }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: DK }}>{sym}</div>
                          <div style={{ fontSize: 10, color: '#bbb' }}>{q?.name || 'NSE'}</div>
                        </div>
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: DK }}>{p.qty}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontSize: 13, color: '#555' }}>₹{fmt(p.buyPrice)}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: DK }}>{cp != null ? `₹${fmt(cp)}` : <Spinner size={12}/>}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontSize: 12.5, fontWeight: 600, color: q ? pctColor(q.change_pct) : '#bbb' }}>{q ? `${pctSign(q.change_pct)}${q.change_pct?.toFixed(2)}%` : '—'}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: pnl != null ? pctColor(pnl) : '#bbb' }}>{pnl != null ? `${pctSign(pnl)}₹${fmt(Math.abs(pnl))}` : '—'}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontSize: 12.5, fontWeight: 600, color: pnlPct != null ? pctColor(pnlPct) : '#bbb' }}>{pnlPct != null ? `${pctSign(pnlPct)}${pnlPct.toFixed(2)}%` : '—'}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        <button onClick={() => removePosition(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ddd', fontSize: 16, transition: 'color 0.15s', padding: '2px 4px' }}
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

// ── Watchlist Tab ─────────────────────────────────────────────────────────────
const WatchlistTab = ({ watchlist, setWatchlist, onQuote }) => {
  const [search, setSearch]   = useState('');
  const [results, setResults] = useState([]);
  const [prices, setPrices]   = useState({});
  const [loading, setLoading] = useState(false);
  const debRef                = useRef(null);

  useEffect(() => { saveLS(LS_WATCHLIST, watchlist); }, [watchlist]);
  useEffect(() => { if (watchlist.length) refreshPrices(); }, []);

  useEffect(() => {
    clearTimeout(debRef.current);
    if (search.trim().length < 2) { setResults([]); return; }
    debRef.current = setTimeout(async () => {
      try {
        const r = await api.searchStocks(search.trim());
        setResults(r.results?.slice(0, 8) || []);
      } catch { setResults([]); }
    }, 250);
  }, [search]);

  const refreshPrices = async () => {
    if (!watchlist.length) return;
    setLoading(true);
    const res = {};
    await Promise.allSettled(watchlist.map(async w => {
      try {
        const r = await api.getMarketQuote(w.symbol);
        if (r.success) res[w.symbol] = r.quote;
      } catch {}
    }));
    setPrices(res);
    setLoading(false);
  };

  const addToWatch = (stock) => {
    const sym = stock.symbol;
    if (watchlist.find(w => w.symbol === sym)) return;
    setWatchlist(p => [...p, { id: uid(), symbol: sym, name: stock.name, addedAt: new Date().toISOString() }]);
    setSearch(''); setResults([]);
  };

  const remove = (id) => {
    const w = watchlist.find(x => x.id === id);
    if (w) setPrices(p => { const n={...p}; delete n[w.symbol]; return n; });
    setWatchlist(p => p.filter(x => x.id !== id));
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Search + controls */}
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search stocks to add to watchlist…"
              style={{ width: '100%', padding: '9px 14px', fontSize: 13, border: `1.5px solid rgba(0,0,0,0.1)`, borderRadius: 12, fontFamily: 'inherit', outline: 'none', background: '#fff', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
              onFocus={e => e.currentTarget.style.borderColor = BL + '60'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'}
            />
            {results.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', marginTop: 4, overflow: 'hidden' }}>
                {results.map(r => {
                  const already = watchlist.find(w => w.symbol === r.symbol);
                  return (
                    <div key={r.symbol} onClick={() => !already && addToWatch(r)} style={{ padding: '10px 14px', cursor: already ? 'default' : 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: already ? 'rgba(0,0,0,0.02)' : 'transparent', transition: 'background 0.1s' }}
                      onMouseEnter={e => { if (!already) e.currentTarget.style.background = `${BL}08`; }}
                      onMouseLeave={e => e.currentTarget.style.background = already ? 'rgba(0,0,0,0.02)' : 'transparent'}>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: DK }}>{r.symbol?.replace('.NS','')}</span>
                        <span style={{ fontSize: 11, color: '#aaa', marginLeft: 8 }}>{r.name}</span>
                      </div>
                      {already ? <span style={{ fontSize: 11, color: GR, fontWeight: 600 }}>✓ Added</span> : <span style={{ fontSize: 11, color: BL, fontWeight: 600 }}>+ Add</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <button onClick={refreshPrices} disabled={loading || !watchlist.length}
            style={{ padding: '9px 16px', fontSize: 12, fontWeight: 600, border: `1px solid ${BORDER}`, borderRadius: 12, background: '#fff', cursor: 'pointer', color: '#555', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            {loading ? <Spinner size={12} /> : '↻'} Refresh
          </button>
        </div>
      </div>

      {/* Watchlist */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {watchlist.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#bbb' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#ccc', marginBottom: 8 }}>Watchlist is empty</div>
            <div style={{ fontSize: 13 }}>Search for stocks above to add them here</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {watchlist.map(w => {
              const q = prices[w.symbol];
              const sym = w.symbol?.replace('.NS','');
              const up = q?.change_pct >= 0;
              return (
                <div key={w.id} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 14, padding: '14px 14px 12px', position: 'relative', transition: 'box-shadow 0.15s', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                  onClick={() => onQuote(w.symbol)}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.09)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'}>
                  <button onClick={e => { e.stopPropagation(); remove(w.id); }} style={{ position: 'absolute', top: 8, right: 10, background: 'none', border: 'none', cursor: 'pointer', color: '#ddd', fontSize: 16, padding: 2, transition: 'color 0.15s', lineHeight: 1 }}
                    onMouseEnter={e => e.currentTarget.style.color = RD}
                    onMouseLeave={e => e.currentTarget.style.color = '#ddd'}>×</button>
                  <div style={{ fontSize: 14, fontWeight: 700, color: DK, marginBottom: 2 }}>{sym}</div>
                  <div style={{ fontSize: 10.5, color: '#bbb', marginBottom: 10, paddingRight: 20, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.name || q?.name || 'NSE Listed'}</div>
                  {q ? (
                    <>
                      <div style={{ fontSize: 18, fontWeight: 700, color: DK, letterSpacing: '-0.02em' }}>₹{fmt(q.price)}</div>
                      <div style={{ fontSize: 11.5, fontWeight: 600, color: up ? GR : RD, marginTop: 2 }}>{pctSign(q.change_pct)}{q.change_pct?.toFixed(2)}% ({pctSign(q.change)}{fmt(Math.abs(q.change))})</div>
                    </>
                  ) : (
                    <div style={{ paddingTop: 4 }}><Spinner size={14} /></div>
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

// ── Market Analysis Tab ───────────────────────────────────────────────────────
const MarketTab = ({ indices, movers, onQuote }) => {
  const gainers = movers.filter(m => m.change_pct > 0).sort((a,b) => b.change_pct - a.change_pct);
  const losers  = movers.filter(m => m.change_pct < 0).sort((a,b) => a.change_pct - b.change_pct);
  const sectors = [
    { name: 'Banking',   idx: '^NSEBANK', color: BL },
    { name: 'IT',        idx: '^CNXIT',   color: '#7B61FF' },
    { name: 'FMCG',      idx: '^CNXFMCG', color: GR },
    { name: 'Auto',      idx: '^CNXAUTO', color: OR },
    { name: 'Pharma',    idx: '^CNXPHARMA', color: '#FD5B5D' },
    { name: 'Midcap 50', idx: '^NSEMDCP50', color: '#2C76FF' },
  ];
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 32px' }}>
      {/* Indices overview */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#aaa', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>All Indices</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
          {indices.map(idx => {
            const up = idx.change_pct >= 0;
            return (
              <div key={idx.symbol} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: '#aaa', letterSpacing: '0.04em', marginBottom: 6 }}>{idx.name || idx.symbol}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: DK, letterSpacing: '-0.02em' }}>{fmt(idx.price)}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: up ? GR : RD, marginTop: 2 }}>{pctSign(idx.change_pct)}{idx.change_pct?.toFixed(2)}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sector Heatmap */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#aaa', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Sector Performance</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
          {sectors.map(s => {
            const idx = indices.find(x => x.symbol === s.idx);
            const pct = idx?.change_pct ?? 0;
            const up = pct >= 0;
            const intensity = Math.min(Math.abs(pct) / 3, 1);
            const bg = up ? `rgba(0,196,140,${0.06 + intensity * 0.18})` : `rgba(253,91,93,${0.06 + intensity * 0.18})`;
            return (
              <div key={s.name} style={{ background: bg, border: `1px solid ${up ? `${GR}30` : `${RD}30`}`, borderRadius: 12, padding: '12px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: DK, marginBottom: 4 }}>{s.name}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: up ? GR : RD }}>{pctSign(pct)}{pct.toFixed(2)}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gainers & Losers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${BORDER}`, background: `${GR}08` }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: GR }}>▲ Top Gainers</span>
          </div>
          {gainers.map(m => <MoverRow key={m.symbol} m={m} onQuote={onQuote} />)}
        </div>
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${BORDER}`, background: `${RD}08` }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: RD }}>▼ Top Losers</span>
          </div>
          {losers.map(m => <MoverRow key={m.symbol} m={m} onQuote={onQuote} />)}
        </div>
      </div>
    </div>
  );
};

// ── Main TradingPage ──────────────────────────────────────────────────────────
const TABS = [
  { id: 'ai',        label: '🤖 AI Assistant' },
  { id: 'portfolio', label: '💼 Portfolio'     },
  { id: 'watchlist', label: '⭐ Watchlist'      },
  { id: 'market',    label: '📊 Market'         },
];

export default function TradingPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ai');
  const [indices,   setIndices]   = useState([]);
  const [movers,    setMovers]    = useState([]);
  const [loadIdx,   setLoadIdx]   = useState(true);
  const [loadMov,   setLoadMov]   = useState(true);
  const [quote,     setQuote]     = useState(null);
  const [quoteLoad, setQuoteLoad] = useState(false);
  const [portfolio, setPortfolio] = useState(() => loadLS(LS_PORTFOLIO, []));
  const [watchlist, setWatchlist] = useState(() => loadLS(LS_WATCHLIST, []));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [w, setW] = useState(window.innerWidth);

  const isMobile = w < 768;
  const isTablet = w >= 768 && w < 1100;

  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const fetchIndices = useCallback(async () => {
    try {
      const r = await api.getMarketIndices();
      if (r.success) setIndices(r.indices || []);
    } catch {} finally { setLoadIdx(false); }
  }, []);

  const fetchMovers = useCallback(async () => {
    try {
      const r = await api.getMarketMovers();
      if (r.success) setMovers([...(r.gainers || []), ...(r.losers || [])]);
    } catch {} finally { setLoadMov(false); }
  }, []);

  useEffect(() => {
    fetchIndices(); fetchMovers();
    const t = setInterval(() => { fetchIndices(); fetchMovers(); }, 60000);
    return () => clearInterval(t);
  }, []);

  const openQuote = async (sym) => {
    setQuote(null); setQuoteLoad(true);
    try {
      const r = await api.getMarketQuote(sym);
      if (r.success) setQuote(r.quote);
    } catch {} finally { setQuoteLoad(false); }
  };

  const addToWatchlistFromQuote = (q) => {
    const sym = q.symbol;
    if (!watchlist.find(w => w.symbol === sym)) {
      setWatchlist(p => [...p, { id: uid(), symbol: sym, name: q.name, addedAt: new Date().toISOString() }]);
    }
    setQuote(null); setActiveTab('watchlist');
  };

  const addToPortfolioFromQuote = (q) => {
    setQuote(null); setActiveTab('portfolio');
  };

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#F5F4F2', fontFamily: "'DM Sans', -apple-system, sans-serif", overflow: 'hidden' }}>

      {/* ── Header ── */}
      <div style={{ height: 52, flexShrink: 0, background: '#fff', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 14, backdropFilter: 'blur(20px)' }}>
        <button onClick={() => navigate('/app')} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#666', background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: 10, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
          ← Back
        </button>
        {isMobile && (
          <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '5px 10px', cursor: 'pointer', fontSize: 12, color: '#666', fontFamily: 'inherit', flexShrink: 0 }}>
            📊 Markets
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: 9, background: `${GR}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>📈</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: DK, lineHeight: 1.2 }}>Trading Intelligence</div>
            <div style={{ fontSize: 10.5, color: '#aaa' }}>AI-powered NSE/BSE analysis</div>
          </div>
        </div>
        {/* Live NIFTY pill */}
        {(() => {
          const ni = indices.find(x => x.symbol === '^NSEI');
          if (!ni) return null;
          const up = ni.change_pct >= 0;
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: up ? `${GR}10` : `${RD}10`, border: `1px solid ${up ? GR : RD}30`, borderRadius: 100, padding: '4px 12px', flexShrink: 0 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: up ? GR : RD, animation: 'tpPulse 2s infinite' }} />
              <span style={{ fontSize: 11.5, fontWeight: 700, color: up ? GR : RD }}>NIFTY {fmt(ni.price)}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: up ? GR : RD }}>{pctSign(ni.change_pct)}{ni.change_pct?.toFixed(2)}%</span>
            </div>
          );
        })()}
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* Left sidebar */}
        <MarketSidebar
          indices={indices}
          movers={movers}
          onQuote={openQuote}
          isMobile={isMobile}
          sidebarOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {/* Tab bar */}
          <div style={{ height: 44, flexShrink: 0, background: '#fff', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'stretch', padding: '0 8px', gap: 0, overflowX: 'auto' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px', fontSize: isMobile ? 11.5 : 13, fontWeight: activeTab === t.id ? 700 : 500, color: activeTab === t.id ? BL : '#777', background: 'transparent', border: 'none', cursor: 'pointer', borderBottom: `2.5px solid ${activeTab === t.id ? BL : 'transparent'}`, transition: 'all 0.15s', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#F7F8FA' }}>
            {activeTab === 'ai'        && <AIAssistant portfolio={portfolio} watchlist={watchlist} indices={indices} movers={movers} />}
            {activeTab === 'portfolio' && <PortfolioTab portfolio={portfolio} setPortfolio={setPortfolio} onQuote={openQuote} />}
            {activeTab === 'watchlist' && <WatchlistTab watchlist={watchlist} setWatchlist={setWatchlist} onQuote={openQuote} />}
            {activeTab === 'market'    && <MarketTab indices={indices} movers={movers} onQuote={openQuote} />}
          </div>
        </div>
      </div>

      {/* Quote modal overlay */}
      {(quoteLoad || quote) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 399, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => { setQuote(null); setQuoteLoad(false); }}>
          <div onClick={e => e.stopPropagation()}>
            {quoteLoad
              ? <div style={{ background: '#fff', borderRadius: 20, padding: 40, display: 'flex', alignItems: 'center', gap: 12 }}><Spinner size={20} /> <span style={{ fontSize: 14, color: '#888' }}>Fetching quote…</span></div>
              : <QuoteCard quote={quote} onClose={() => setQuote(null)} onAddWatchlist={addToWatchlistFromQuote} onAddPortfolio={addToPortfolioFromQuote} />
            }
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        @keyframes tpSpin { to { transform: rotate(360deg); } }
        @keyframes tpPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes tpDot { 0%,100%{transform:scale(0.7);opacity:0.5} 50%{transform:scale(1.2);opacity:1} }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}
