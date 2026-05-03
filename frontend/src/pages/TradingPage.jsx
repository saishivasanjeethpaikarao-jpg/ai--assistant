import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
const MiniChart = ({ data, color, compact }) => {
  const max = Math.max(1, ...data.map(d => d.value || 0));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: compact ? 120 : 160, padding: '8px 2px 0' }}>
      {data.map((d) => (
        <div key={d.label} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ width: '100%', height: Math.max(10, Math.round(((d.value || 0) / max) * (compact ? 88 : 120))), background: color, borderRadius: 8, opacity: 0.92 }} />
          <div style={{ width: '100%', fontSize: 10, color: '#888', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
};

// ── Design Tokens ──────────────────────────────────────────────────────────────
const BL     = '#437DFD';
const GR     = '#00C48C';
const RD     = '#FD5B5D';
const OR     = '#FF8C42';
const DK     = '#0C0C0C';
const BG     = '#F5F4F2';
const BORDER = 'rgba(0,0,0,0.08)';
const FONT   = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif";

const uid      = () => Math.random().toString(36).slice(2, 10);
const fmt      = (n) => n == null ? '—' : Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pctColor = (v) => v > 0 ? GR : v < 0 ? RD : '#888';
const pctSign  = (v) => v > 0 ? '+' : '';
const normSym  = (s) => (s || '').replace('.NS','').replace('.BO','').trim().toUpperCase();

const LS_PORTFOLIO = 'airis_tp_portfolio';
const LS_WATCHLIST = 'airis_tp_watchlist';
const LS_CHAT      = 'airis_tp_chat';
const LS_ALERTS    = 'airis_tp_alerts';

const loadLS = (key, def) => { try { return JSON.parse(localStorage.getItem(key)) ?? def; } catch { return def; } };
const saveLS = (key, v)   => { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} };

// Known NSE tickers for highlighting in AI responses
const NSE_TICKERS = new Set([
  'RELIANCE','TCS','HDFCBANK','INFY','ICICIBANK','HINDUNILVR','KOTAKBANK',
  'BHARTIARTL','LT','AXISBANK','WIPRO','MARUTI','ASIANPAINT','BAJFINANCE',
  'TITAN','ULTRACEMCO','SBIN','ADANIENT','ADANIPORTS','DRREDDY','SUNPHARMA',
  'POWERGRID','NTPC','ONGC','COALINDIA','BAJAJFINSV','GRASIM','HEROMOTOCO',
  'ITC','CIPLA','DIVISLAB','TECHM','TATAMOTORS','TATASTEEL','HCLTECH',
  'INDUSINDBK','JSWSTEEL','EICHERMOT','BPCL','TATACONSUM','APOLLOHOSP',
  'BRITANNIA','PIDILITIND','SBILIFE','HDFCLIFE','ZOMATO','PAYTM','NYKAA',
  'TRENT','DMART','NESTLEIND','GODREJCP','HAVELLS','DABUR','MARICO','COLPAL',
  'BIOCON','LUPIN','AUROPHARMA','HINDALCO','LTIM','PERSISTENT','COFORGE',
  'MPHASIS','IRCTC','PFC','RECLTD','HAL','BHEL','BEL','TATAPOWER',
  'ADANIGREEN','ADANIPOWER','SUZLON','RVNL','IRFC','INDIGO','IGL','GAIL',
  'DLF','GODREJPROP','OBEROIRLTY','MRF','APOLLOTYRE','POLYCAB','KEI',
  'ABB','SIEMENS','CUMMINSIND','CANBK','BANKBARODA','PNB','YESBANK',
  'BANDHANBNK','IDFCFIRSTB','RBLBANK','FEDERALBNK','CHOLAFIN','MOTHERSON',
  'BAJAJ-AUTO','TVSMOTOR','ASHOKLEY','EXIDEIND','PIDILITIND','KPITTECH',
  'DEEPAKNTR','UPL','PIIND','TORNTPHARM','CIPLA','IPCALAB','ALKEM',
  'LAURUS','NATCOPHARM','ZYDUSLIFE','MFSL','ABSLAMC','ICICIGI','STARHEALTH',
  'NAUKRI','INDIAMART','ROUTE','DELHIVERY','MAPMYINDIA','TANLA','HAL',
  'SHREECEM','ACC','AMBUJACEM','PRESTIGE','BRIGADE','SOBHA','TTKPRESTIG',
]);

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

// ── Command Parser ─────────────────────────────────────────────────────────────
function parseCommand(raw) {
  const msg  = raw.trim();
  const low  = msg.toLowerCase();
  const STOCK_RE = '([A-Z][A-Z0-9&-]{1,14})';

  // Add to watchlist
  const wlPatterns = [
    new RegExp(`^(?:add|watch|track|monitor|follow|star)\\s+${STOCK_RE}(?:\\s+(?:to|in)\\s+(?:my\\s+)?watchlist)?`, 'i'),
    new RegExp(`^(?:add|put)\\s+${STOCK_RE}\\s+(?:to|in|on)\\s+(?:my\\s+)?(?:watchlist|watch)`, 'i'),
  ];
  for (const re of wlPatterns) {
    const m = msg.match(re);
    if (m) {
      const sym = m[1].toUpperCase();
      if (sym.length >= 2) return { type: 'add_watchlist', symbol: sym };
    }
  }

  // Add to portfolio: "add 100 RELIANCE at 1500" / "bought 50 TCS at 3400"
  const pfPatterns2 = [
    /^(?:add|buy|bought|purchased|i\s+bought)\s+(\d+)\s+([A-Z][A-Z0-9&-]{1,14})\s+(?:at|@|for)\s+(?:₹?)([\d.]+)/i,
    /^(?:add|buy|bought|purchased|i\s+bought)\s+([A-Z][A-Z0-9&-]{1,14})\s+(\d+)\s+(?:shares?\s+)?(?:at|@|for)\s+(?:₹?)([\d.]+)/i,
  ];
  {
    const m = msg.match(pfPatterns2[0]);
    if (m) {
      const qty = parseInt(m[1]), sym = m[2].toUpperCase(), price = parseFloat(m[3]);
      if (qty > 0 && price > 0) return { type: 'add_portfolio', symbol: sym, qty, price };
    }
    const m2 = msg.match(pfPatterns2[1]);
    if (m2) {
      const sym = m2[1].toUpperCase(), qty = parseInt(m2[2]), price = parseFloat(m2[3]);
      if (qty > 0 && price > 0) return { type: 'add_portfolio', symbol: sym, qty, price };
    }
  }

  // Remove from watchlist
  const rmMatch = msg.match(new RegExp(`^(?:remove|delete|drop|unwatch)\\s+${STOCK_RE}(?:\\s+(?:from|off)\\s+(?:my\\s+)?watchlist)?`, 'i'));
  if (rmMatch) return { type: 'remove_watchlist', symbol: rmMatch[1].toUpperCase() };

  // Navigate
  if (/^(?:show|open|go\s+to|view|switch\s+to)\s+(?:my\s+)?watchlist/i.test(low)) return { type: 'nav', tab: 'watchlist' };
  if (/^(?:show|open|go\s+to|view|switch\s+to)\s+(?:my\s+)?portfolio/i.test(low))  return { type: 'nav', tab: 'portfolio' };
  if (/^(?:show|open|go\s+to|view|switch\s+to)\s+(?:the\s+)?markets?/i.test(low))  return { type: 'nav', tab: 'market' };
  if (/^(?:show|open|go\s+to|view|switch\s+to)\s+(?:my\s+)?alerts?/i.test(low))    return { type: 'nav', tab: 'alerts' };

  return null;
}

// ── Spinner ────────────────────────────────────────────────────────────────────
const Spinner = ({ size = 16, color = BL }) => (
  <span style={{ display: 'inline-block', width: size, height: size, border: `2px solid ${color}22`, borderTopColor: color, borderRadius: '50%', animation: 'tpSpin 0.7s linear infinite', flexShrink: 0 }} />
);

// ── Tag (Chip) ─────────────────────────────────────────────────────────────────
const Tag = ({ children, color = BL, onClick }) => (
  <span onClick={onClick} style={{ display: 'inline-block', fontSize: 10.5, fontWeight: 700, color, background: color + '14', border: `1px solid ${color}30`, borderRadius: 6, padding: '2px 7px', cursor: onClick ? 'pointer' : 'default', userSelect: 'none' }}>{children}</span>
);

// ── Alert Toast Overlay ─────────────────────────────────────────────────────────
const AlertToastOverlay = ({ toasts, onDismiss }) => {
  if (!toasts.length) return null;
  return (
    <div style={{ position: 'fixed', top: 66, right: 14, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none' }}>
      {toasts.map(t => (
        <div key={t.id} style={{ background: '#fff', border: `1.5px solid ${GR}55`, borderRadius: 14, padding: '12px 14px 12px 16px', boxShadow: '0 6px 28px rgba(0,0,0,0.14)', pointerEvents: 'all', minWidth: 260, maxWidth: 320, animation: 'tpSlideIn 0.3s cubic-bezier(0.16,1,0.3,1)', fontFamily: FONT }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: 22, lineHeight: 1.1, flexShrink: 0 }}>🎯</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: DK }}>{t.symbol} Alert Triggered!</div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 3 }}>
                {t.dir === 'above' ? 'Rose above' : 'Fell below'} ₹{fmt(t.target)}
                <span style={{ color: GR, fontWeight: 600 }}> · Now ₹{fmt(t.current)}</span>
              </div>
            </div>
            <button onClick={() => onDismiss(t.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: 17, padding: '0 2px', lineHeight: 1, flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.color = '#999'}
              onMouseLeave={e => e.currentTarget.style.color = '#ccc'}>×</button>
          </div>
        </div>
      ))}
    </div>
  );
};

// ── IndexChip ──────────────────────────────────────────────────────────────────
const IndexChip = ({ idx }) => {
  if (!idx) return <div style={{ background: 'rgba(0,0,0,0.04)', borderRadius: 8, padding: '6px 8px', minHeight: 52, animation: 'tpPulse 1.5s infinite' }} />;
  const up = idx.change_pct >= 0;
  return (
    <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '7px 9px' }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#bbb', letterSpacing: '0.04em', marginBottom: 2 }}>{idx.name}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: DK }}>{fmt(idx.price)}</div>
      <div style={{ fontSize: 10, fontWeight: 600, color: up ? GR : RD }}>{pctSign(idx.change_pct)}{idx.change_pct?.toFixed(2)}%</div>
    </div>
  );
};

// ── Mover Row ──────────────────────────────────────────────────────────────────
const MoverRow = ({ m, onQuote }) => {
  const up = m.change_pct >= 0;
  return (
    <div onClick={() => onQuote(m.symbol || m.yf_symbol || m.display_symbol)}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 12px', cursor: 'pointer', borderRadius: 8, transition: 'background 0.12s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.03)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: DK, whiteSpace: 'nowrap' }}>{normSym(m.symbol || m.display_symbol)}</div>
        <div style={{ fontSize: 10, color: '#bbb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 90 }}>{m.name || ''}</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 6 }}>
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
      <div style={{ padding: '12px 14px 8px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#aaa', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Live Markets</span>
        {isMobile && <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 22, padding: '0 2px', lineHeight: 1 }}>×</button>}
      </div>

      <div style={{ padding: '10px 10px 6px', flexShrink: 0 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: '#ccc', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Indices</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
          {[{sym:'^NSEI',name:'NIFTY 50'},{sym:'^BSESN',name:'SENSEX'},{sym:'^NSEBANK',name:'BANK NIFTY'},{sym:'^CNXIT',name:'NIFTY IT'}].map(({sym, name}) => (
            <IndexChip key={sym} idx={indices.find(x => x.symbol === sym) || null} />
          ))}
        </div>
      </div>

      <div style={{ padding: '8px 4px 0', flexShrink: 0 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: GR, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0 10px', marginBottom: 2 }}>▲ Top Gainers</div>
        {gainers.length === 0
          ? <div style={{ fontSize: 11, color: '#ccc', padding: '8px 14px' }}>Loading…</div>
          : gainers.map(m => <MoverRow key={m.symbol} m={m} onQuote={onQuote} />)}
      </div>

      <div style={{ padding: '8px 4px 16px' }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: RD, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0 10px', marginBottom: 2 }}>▼ Top Losers</div>
        {losers.length === 0
          ? <div style={{ fontSize: 11, color: '#ccc', padding: '8px 14px' }}>Loading…</div>
          : losers.map(m => <MoverRow key={m.symbol} m={m} onQuote={onQuote} />)}
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
    <div style={{ width: 218, flexShrink: 0, background: '#fff', borderRight: `1px solid ${BORDER}`, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {content}
    </div>
  );
};

// ── Quote Modal ────────────────────────────────────────────────────────────────
const QuoteModal = ({ quote, loading, onClose, onAddWatchlist, onAddPortfolio }) => {
  const w     = useWindowWidth();
  const isMob = w < 640;
  if (!loading && !quote) return null;
  const sym = normSym(quote?.symbol || '');
  const up  = (quote?.change_pct || 0) >= 0;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 400, display: 'flex', alignItems: isMob ? 'flex-end' : 'center', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ position: 'relative', background: '#fff', borderRadius: isMob ? '20px 20px 0 0' : 22, padding: isMob ? '20px 18px 28px' : '26px 26px 22px', width: isMob ? '100%' : 380, maxWidth: '96vw', boxShadow: '0 24px 80px rgba(0,0,0,0.18)', fontFamily: FONT }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '28px 0' }}>
            <Spinner size={22} /> <span style={{ fontSize: 14, color: '#888' }}>Fetching quote…</span>
          </div>
        ) : (
          <>
            {isMob && <div style={{ width: 40, height: 4, background: 'rgba(0,0,0,0.1)', borderRadius: 2, margin: '0 auto 16px' }} />}
            <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 22, lineHeight: 1, padding: '2px 6px' }}>×</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: up ? `${GR}15` : `${RD}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: up ? GR : RD }}>{sym?.[0]}</div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: DK }}>{sym}</div>
                <div style={{ fontSize: 12, color: '#999' }}>{quote.name || 'NSE Listed'}</div>
              </div>
            </div>
            <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.03em', color: DK, marginBottom: 2 }}>₹{fmt(quote.price)}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: up ? GR : RD, marginBottom: 14 }}>{pctSign(quote.change_pct)}{quote.change_pct?.toFixed(2)}% ({pctSign(quote.change)}{fmt(quote.change)} today)</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', marginBottom: 18, borderTop: `1px solid ${BORDER}`, paddingTop: 14 }}>
              {[['Open',fmt(quote.open)],['Prev Close',fmt(quote.prev_close)],['High',fmt(quote.high)],['Low',fmt(quote.low)],['52W High',fmt(quote.year_high)],['52W Low',fmt(quote.year_low)],['Volume',quote.volume?(quote.volume/1e6).toFixed(2)+'M':'—'],['Mkt Cap',quote.market_cap?'₹'+(quote.market_cap/1e7).toFixed(0)+'Cr':'—']].map(([k,v]) => (
                <div key={k}>
                  <div style={{ fontSize: 10, color: '#bbb', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: DK }}>{v}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => onAddWatchlist(quote)} style={{ flex: 1, padding: '11px', fontSize: 13, fontWeight: 600, color: BL, background: `${BL}10`, border: `1px solid ${BL}30`, borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit' }}>⭐ Watchlist</button>
              <button onClick={() => onAddPortfolio(quote)} style={{ flex: 1, padding: '11px', fontSize: 13, fontWeight: 600, color: '#fff', background: GR, border: 'none', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit' }}>💼 Portfolio</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ── Markdown renderer with stock ticker highlighting ──────────────────────────
const renderMarkdown = (text, onTickerAction) => {
  return text.split('\n').map((line, i) => {
    const segments = [];
    let remaining = line.replace(/\*\*(.*?)\*\*/g, '\x01$1\x02').replace(/\*(.*?)\*/g, '\x03$1\x04');
    let key = 0;

    const parts = remaining.split(/(\b[A-Z][A-Z0-9&-]{1,14}\b)/g);
    parts.forEach(part => {
      if (NSE_TICKERS.has(part)) {
        segments.push(
          <span key={key++} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <span style={{ fontWeight: 700, color: BL, background: `${BL}10`, borderRadius: 4, padding: '0 4px', fontSize: 'inherit' }}>{part}</span>
            {onTickerAction && (
              <span onClick={() => onTickerAction(part, 'watchlist')} title={`Add ${part} to watchlist`}
                style={{ fontSize: 9, background: GR, color: '#fff', borderRadius: 4, padding: '1px 5px', cursor: 'pointer', fontWeight: 700, lineHeight: 1.6, userSelect: 'none' }}>+WL</span>
            )}
          </span>
        );
      } else {
        const fmt2 = part.replace(/\x01(.*?)\x02/g, '<strong>$1</strong>').replace(/\x03(.*?)\x04/g, '<em>$1</em>');
        segments.push(<span key={key++} dangerouslySetInnerHTML={{ __html: fmt2 }} />);
      }
    });

    return (
      <div key={i} style={{ lineHeight: 1.75, marginBottom: line === '' ? 4 : 0 }}>
        {segments}
      </div>
    );
  });
};

// ── Quick Prompts ──────────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  { label: '📈 Top picks today',   text: 'What are the best stocks to buy today? Give me 3 specific picks with entry price, target, and stop-loss for each.' },
  { label: '🔢 NIFTY analysis',    text: 'Give me a detailed NIFTY 50 technical analysis — RSI, MACD, support/resistance, and near-term outlook.' },
  { label: '🌍 Market sentiment',  text: 'What is the overall market sentiment today? Any major FII/DII flows, global cues, or news affecting Indian markets?' },
  { label: '💻 IT sector',         text: 'Analyze the IT sector right now — which IT stocks look strong and why? Key levels and strategy.' },
  { label: '🏦 Banking stocks',    text: 'Which banking and financial stocks should I watch this week? Give me key support/resistance levels.' },
  { label: '⚖️ Risk management',   text: 'Explain proper position sizing and risk management for Indian stock trading with examples.' },
  { label: '💊 Pharma picks',      text: 'What are the best pharma stocks for the next 3–6 months? Both technical and fundamental view.' },
  { label: '🔥 IPO analysis',      text: 'Any upcoming IPOs worth applying to? What should I look for before subscribing to an IPO?' },
  { label: '📊 F&O strategy',      text: 'Suggest the best options strategy for the current market. Which strikes and expiry?' },
  { label: '🌿 Green energy',      text: 'Which renewable energy / green stocks look promising? Long-term multibagger potential?' },
];

// ── AI Assistant Tab ───────────────────────────────────────────────────────────
const AIAssistant = ({ portfolio, watchlist, indices, movers, isMobile, onAddToWatchlist, onAddToPortfolio, onSwitchTab, onRemoveFromWatchlist }) => {
  const [messages, setMessages] = useState(() => loadLS(LS_CHAT, [{
    role: 'assistant', id: uid(),
    text: "Hello! I'm your **AI Trading Expert** — specialized in Indian markets (NSE/BSE).\n\nI analyze stocks using **RSI, MACD, Bollinger Bands**, fundamentals (P/E, ROE, EPS), sector trends, FII/DII flows, and market news to give you **actionable trading insights**.\n\n**You can also give me commands:**\n- *Add RELIANCE to watchlist*\n- *Bought 50 TCS at 3400*\n- *Remove INFY from watchlist*\n- *Show my portfolio*\n\nOr just ask me for stock picks, portfolio review, or trading strategies!",
  }]));
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
      try { const r = await api.searchStocks(search.trim()); setSearchRes(r.results?.slice(0,6)||[]); }
      catch { setSearchRes([]); }
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
    const g = movers.filter(m=>m.change_pct>0).slice(0,4).map(m=>`${normSym(m.symbol)} ${pctSign(m.change_pct)}${m.change_pct?.toFixed(2)}%`).join(', ');
    const l = movers.filter(m=>m.change_pct<0).slice(0,4).map(m=>`${normSym(m.symbol)} ${m.change_pct?.toFixed(2)}%`).join(', ');
    if (g) parts.push(`Top gainers: ${g}`);
    if (l) parts.push(`Top losers: ${l}`);
    if (watchlist.length) parts.push(`User watchlist: ${watchlist.map(w=>normSym(w.symbol)).join(', ')}`);
    if (portfolio.length) parts.push(`User portfolio: ${portfolio.map(p=>`${normSym(p.symbol)} (${p.qty} shares @ ₹${p.buyPrice})`).join(', ')}`);
    return parts.join('. ');
  };

  const addMsg = (m) => setMessages(p => [...p, m]);

  const handleTickerAction = (sym, action) => {
    if (action === 'watchlist') {
      onAddToWatchlist(sym, '');
      addMsg({ role: 'assistant', id: uid(), text: `✅ **${sym}** has been added to your watchlist!`, isAction: true });
    }
  };

  const sendMsg = async (text) => {
    const msg = (text || input).trim();
    if (!msg || busy) return;
    setInput(''); setSearch(''); setSearchRes([]);

    const userMsg = { role: 'user', text: msg, id: uid() };
    addMsg(userMsg);

    // Parse local commands first
    const cmd = parseCommand(msg);
    if (cmd) {
      let reply = '';
      if (cmd.type === 'add_watchlist') {
        onAddToWatchlist(cmd.symbol, '');
        reply = `✅ Added **${cmd.symbol}** to your watchlist! You can view it in the ⭐ Watchlist tab.`;
      } else if (cmd.type === 'add_portfolio') {
        onAddToPortfolio(cmd.symbol, cmd.qty, cmd.price);
        reply = `✅ Added **${cmd.qty} shares of ${cmd.symbol} @ ₹${fmt(cmd.price)}** to your portfolio!\n\nTotal invested: ₹${fmt(cmd.qty * cmd.price)}`;
      } else if (cmd.type === 'remove_watchlist') {
        onRemoveFromWatchlist(cmd.symbol);
        reply = `✅ Removed **${cmd.symbol}** from your watchlist.`;
      } else if (cmd.type === 'nav') {
        const labels = { watchlist: '⭐ Watchlist', portfolio: '💼 Portfolio', market: '📊 Markets', alerts: '🔔 Alerts' };
        onSwitchTab(cmd.tab);
        reply = `Switched to the **${labels[cmd.tab] || cmd.tab}** tab!`;
      }
      addMsg({ role: 'assistant', id: uid(), text: reply, isAction: true });
      return;
    }

    // Send to AI
    setBusy(true);
    try {
      const ctx = buildContext();
      const r = await api.tradingChat(msg, ctx);
      addMsg({ role: 'assistant', id: uid(), text: r.reply || r.message || 'No response.' });
    } catch {
      addMsg({ role: 'error', id: uid(), text: '⚠️ Could not reach the AI. Go to the main app → ⚙️ Settings → AI Engine and add your Groq API key (free at console.groq.com).' });
    }
    setBusy(false);
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  const selectStock = (sym) => {
    setSearch(''); setSearchRes([]);
    setInput(prev => (prev.trim() ? prev + ' ' : '') + normSym(sym));
    inputRef.current?.focus();
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fff' }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '14px 14px' : '18px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map(m => (
          <div key={m.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, background: m.role === 'user' ? `${BL}18` : m.role === 'error' ? `${RD}12` : m.isAction ? `${GR}15` : `${BL}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>
              {m.role === 'user' ? '👤' : m.role === 'error' ? '⚠️' : m.isAction ? '⚡' : '🤖'}
            </div>
            <div style={{ maxWidth: isMobile ? '88%' : '80%', background: m.role === 'user' ? `${BL}0D` : m.isAction ? `${GR}08` : '#fff', border: `1px solid ${m.role === 'user' ? `${BL}20` : m.isAction ? `${GR}25` : BORDER}`, borderRadius: m.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px', padding: '10px 14px', fontSize: 13.5, color: m.role === 'error' ? RD : DK, lineHeight: 1.65, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', wordBreak: 'break-word' }}>
              {renderMarkdown(m.text, m.role === 'assistant' && !m.isAction ? handleTickerAction : null)}
            </div>
          </div>
        ))}
        {busy && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: `${BL}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>🤖</div>
            <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '4px 16px 16px 16px', padding: '12px 16px', display: 'flex', gap: 5, alignItems: 'center' }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: BL, animation: `tpDot 1s ${i*0.2}s ease-in-out infinite` }} />)}
            </div>
          </div>
        )}
        <div ref={msgsEnd} />
      </div>

      {/* Quick prompts */}
      <div style={{ padding: isMobile ? '7px 10px 4px' : '8px 22px 4px', borderTop: `1px solid ${BORDER}`, display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0, background: '#fafafa' }}>
        {QUICK_PROMPTS.map(q => (
          <button key={q.label} onClick={() => sendMsg(q.text)} disabled={busy}
            style={{ fontSize: 11, padding: '5px 11px', borderRadius: 20, border: `1px solid rgba(0,0,0,0.09)`, background: '#fff', color: '#555', cursor: busy ? 'not-allowed' : 'pointer', fontFamily: FONT, whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.12s', opacity: busy ? 0.6 : 1 }}
            onMouseEnter={e => { if(!busy){ e.currentTarget.style.borderColor = BL; e.currentTarget.style.color = BL; }}}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.09)'; e.currentTarget.style.color = '#555'; }}>
            {q.label}
          </button>
        ))}
      </div>

      {/* Command hint */}
      <div style={{ padding: '4px 22px 0', fontSize: 10.5, color: '#ccc', flexShrink: 0, background: '#fafafa', lineHeight: 1.4 }}>
        Try: <em>"Add RELIANCE to watchlist"</em> · <em>"Bought 50 TCS at 3400"</em> · <em>"Show portfolio"</em>
      </div>

      {/* Input */}
      <div style={{ padding: isMobile ? '8px 10px 12px' : '10px 22px 14px', position: 'relative', flexShrink: 0, background: '#fafafa' }}>
        {searchRes.length > 0 && (
          <div style={{ position: 'absolute', bottom: '100%', left: isMobile ? 10 : 22, right: isMobile ? 10 : 22, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 14, boxShadow: '0 8px 28px rgba(0,0,0,0.10)', zIndex: 100, overflow: 'hidden', marginBottom: 4 }}>
            {searchRes.map(r => (
              <div key={r.symbol} onClick={() => selectStock(r.symbol)}
                style={{ padding: '9px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid rgba(0,0,0,0.04)`, transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = `${BL}08`}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <span style={{ fontSize: 13, fontWeight: 700, color: DK }}>{normSym(r.symbol)}</span>
                <span style={{ fontSize: 11, color: '#bbb', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', background: '#fff', border: `1.5px solid rgba(0,0,0,0.1)`, borderRadius: 16, padding: '10px 12px 10px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'border-color 0.2s' }}
          onFocusCapture={e => e.currentTarget.style.borderColor = BL + '60'}
          onBlurCapture={e  => e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'}>
          <textarea ref={inputRef} value={input}
            onChange={e => {
              setInput(e.target.value);
              const word = e.target.value.split(/\s/).pop();
              if (word.length >= 2) setSearch(word); else setSearchRes([]);
            }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }}}
            placeholder="Ask anything, or: 'Add RELIANCE to watchlist' · 'Bought 100 INFY at 1400'"
            rows={1} disabled={busy}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: DK, fontSize: 13.5, resize: 'none', fontFamily: FONT, lineHeight: 1.55, maxHeight: 100, minHeight: 22 }}
          />
          <button onClick={() => sendMsg()} disabled={!input.trim() || busy}
            style={{ width: 36, height: 36, borderRadius: 10, border: 'none', cursor: input.trim() && !busy ? 'pointer' : 'not-allowed', background: input.trim() && !busy ? `linear-gradient(135deg,${BL},#2C76FF)` : 'rgba(0,0,0,0.06)', color: input.trim() && !busy ? '#fff' : '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s', boxShadow: input.trim() && !busy ? '0 4px 12px rgba(67,125,253,0.3)' : 'none' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/><path d="M22 2L15 22L11 13L2 9L22 2z" stroke="currentColor" strokeWidth="2.2" fill="currentColor" fillOpacity="0.2"/></svg>
          </button>
        </div>
        <div style={{ fontSize: 10, color: '#ccc', textAlign: 'center', marginTop: 4 }}>Enter to send · Groq-powered · Click <strong style={{color:'#aaa'}}>+WL</strong> on any stock to add to watchlist</div>
      </div>
    </div>
  );
};

// ── Portfolio Chart ────────────────────────────────────────────────────────────
const CHART_COLORS = ['#437DFD','#00C48C','#FF8C42','#7B61FF','#FD5B5D','#00B8D9','#F7C948','#E040FB'];

const PortfolioChart = ({ portfolio, prices, isMobile }) => {
  const [period,      setPeriod]      = useState('30d');
  const [histData,    setHistData]    = useState({});
  const [loading,     setLoading]     = useState(false);
  const [showStacked, setShowStacked] = useState(false);
  const fetchRef = useRef(0);

  const symbols = useMemo(() => portfolio.map(p => normSym(p.symbol)), [portfolio]);

  useEffect(() => {
    if (!portfolio.length) return;
    const token = ++fetchRef.current;
    setLoading(true);
    Promise.allSettled(
      portfolio.map(p =>
        api.getStockHistory(normSym(p.symbol), period)
          .then(r => ({ symbol: normSym(p.symbol), data: r.data || [] }))
          .catch(() => ({ symbol: normSym(p.symbol), data: [] }))
      )
    ).then(results => {
      if (token !== fetchRef.current) return;
      const map = {};
      results.forEach(r => { if (r.status === 'fulfilled') map[r.value.symbol] = r.value.data; });
      setHistData(map);
      setLoading(false);
    });
  }, [portfolio, period]);

  const chartData = useMemo(() => {
    if (!portfolio.length) return [];
    const dateSet = new Set();
    Object.values(histData).forEach(arr => arr.forEach(d => dateSet.add(d.date)));
    if (!dateSet.size) return [];
    const indexed = {};
    portfolio.forEach(p => {
      const sym = normSym(p.symbol);
      indexed[sym] = {};
      (histData[sym] || []).forEach(d => { indexed[sym][d.date] = d.price; });
    });
    const dates = [...dateSet].sort();
    return dates.map(date => {
      const row = { date: date.slice(5) };
      let total = 0;
      portfolio.forEach(p => {
        const sym = normSym(p.symbol);
        const px = indexed[sym][date] ?? (prices[sym]?.price ?? p.buyPrice);
        const addedDate = p.addedAt ? p.addedAt.slice(0, 10) : '2000-01-01';
        const val = date >= addedDate ? p.qty * px : 0;
        row[sym] = parseFloat(val.toFixed(2));
        total += val;
      });
      row.total = parseFloat(total.toFixed(2));
      return row;
    });
  }, [histData, portfolio, prices]);

  const totalInvested = useMemo(
    () => portfolio.reduce((s, p) => s + p.qty * p.buyPrice, 0),
    [portfolio]
  );

  if (!portfolio.length) return null;

  const firstVal  = chartData[0]?.total ?? totalInvested;
  const lastVal   = chartData[chartData.length - 1]?.total ?? totalInvested;
  const gain      = lastVal - firstVal;
  const gainPct   = firstVal > 0 ? (gain / firstVal) * 100 : 0;
  const isUp      = gain >= 0;
  const lineColor = isUp ? GR : RD;

  const fmtY = (v) => {
    if (v >= 1e7) return `₹${(v/1e7).toFixed(1)}Cr`;
    if (v >= 1e5) return `₹${(v/1e5).toFixed(1)}L`;
    if (v >= 1e3) return `₹${(v/1e3).toFixed(0)}K`;
    return `₹${v}`;
  };

  return (
    <div style={{ padding: isMobile ? '14px 14px 4px' : '16px 22px 4px', flexShrink: 0, background: BG }}>
      <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16, padding: isMobile ? '14px 12px' : '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Portfolio Performance</div>
            {chartData.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: DK, letterSpacing: '-0.02em' }}>{fmtY(lastVal)}</span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: isUp ? GR : RD }}>
                  {pctSign(gain)}₹{fmt(Math.abs(gain))} ({pctSign(gainPct)}{gainPct.toFixed(2)}%)
                </span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Period toggle */}
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.04)', borderRadius: 9, padding: 2, gap: 2 }}>
              {['7d','30d','90d'].map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  style={{ padding: '5px 10px', fontSize: 11.5, fontWeight: 600, borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s',
                    background: period === p ? '#fff' : 'transparent',
                    color: period === p ? BL : '#888',
                    boxShadow: period === p ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
                  }}>
                  {p}
                </button>
              ))}
            </div>
            {/* Stacked toggle */}
            {portfolio.length > 1 && (
              <button onClick={() => setShowStacked(s => !s)}
                style={{ padding: '5px 10px', fontSize: 11, fontWeight: 600, borderRadius: 8, border: `1px solid ${showStacked ? BL : BORDER}`, cursor: 'pointer', fontFamily: FONT,
                  background: showStacked ? `${BL}10` : '#fff', color: showStacked ? BL : '#888', transition: 'all 0.15s' }}>
                ⬛ Breakdown
              </button>
            )}
          </div>
        </div>

        {/* Chart */}
        {loading ? (
          <div style={{ height: isMobile ? 140 : 180, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <Spinner size={18} /> <span style={{ fontSize: 13, color: '#bbb' }}>Loading chart…</span>
          </div>
        ) : chartData.length < 2 ? (
          <div style={{ height: isMobile ? 100 : 130, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 13, color: '#ccc' }}>Not enough data for this period</span>
          </div>
        ) : (
          <MiniChart
            compact={isMobile}
            color={showStacked && portfolio.length > 1 ? CHART_COLORS[0] : lineColor}
            data={(showStacked && portfolio.length > 1
              ? chartData.map(d => ({ label: d.date, value: d.total }))
              : chartData.map(d => ({ label: d.date, value: d.total })
              )).slice(-Math.min(chartData.length, isMobile ? 6 : 10))}
          />
        )}
      </div>
    </div>
  );
};

// ── Portfolio Tab ──────────────────────────────────────────────────────────────
const PortfolioTab = ({ portfolio, setPortfolio, onQuote, isMobile, prefill, clearPrefill }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [sym,     setSym]     = useState('');
  const [qty,     setQty]     = useState('');
  const [buyPx,   setBuyPx]   = useState('');
  const [prices,  setPrices]  = useState({});
  const [loading, setLoading] = useState(false);
  const [symSug,  setSymSug]  = useState([]);
  const debRef                = useRef(null);

  // Auto-open form and pre-fill when coming from quote modal
  useEffect(() => {
    if (prefill) {
      setSym(normSym(prefill.symbol));
      setBuyPx(prefill.price ? String(prefill.price) : '');
      setShowAdd(true);
      clearPrefill();
    }
  }, [prefill]);

  // Refresh prices whenever portfolio changes (covers initial load AND new adds)
  useEffect(() => {
    saveLS(LS_PORTFOLIO, portfolio);
    if (portfolio.length > 0) refreshPrices();
  }, [portfolio]);

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
    const full = s.endsWith('.NS') || s.endsWith('.BO') ? s : s;
    const idx = portfolio.findIndex(p => normSym(p.symbol) === s);
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
  const totalCurrent  = portfolio.reduce((s,p) => { const cp = prices[p.symbol]?.price ?? p.buyPrice; return s+p.qty*cp; }, 0);
  const totalPnl      = totalCurrent - totalInvested;
  const totalPct      = totalInvested > 0 ? (totalPnl/totalInvested*100) : 0;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: BG }}>
      {/* Summary bar */}
      <div style={{ padding: isMobile ? '10px 14px' : '12px 22px', borderBottom: `1px solid ${BORDER}`, display: 'flex', gap: isMobile ? 12 : 22, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0, background: '#fff' }}>
        {[['Invested', `₹${fmt(totalInvested)}`, DK], ['Current', `₹${fmt(totalCurrent)}`, DK], ['P&L', `${pctSign(totalPnl)}₹${fmt(Math.abs(totalPnl))} (${pctSign(totalPct)}${totalPct.toFixed(2)}%)`, pctColor(totalPnl)]].map(([lbl, val, clr]) => (
          <div key={lbl}>
            <div style={{ fontSize: 9.5, color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{lbl}</div>
            <div style={{ fontSize: isMobile ? 14 : 16, fontWeight: 700, color: clr }}>{val}</div>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexShrink: 0 }}>
          <button onClick={refreshPrices} disabled={loading}
            style={{ fontSize: 12, padding: '7px 13px', borderRadius: 10, border: `1px solid ${BORDER}`, background: '#fff', cursor: 'pointer', color: '#555', fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 5 }}>
            {loading ? <Spinner size={11}/> : '↻'} Refresh
          </button>
          <button onClick={() => setShowAdd(s => !s)}
            style={{ fontSize: 12, fontWeight: 600, padding: '7px 16px', borderRadius: 10, border: 'none', background: GR, color: '#fff', cursor: 'pointer', fontFamily: FONT }}>
            + Add Stock
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div style={{ padding: isMobile ? '12px 14px' : '14px 22px', borderBottom: `1px solid ${BORDER}`, background: `${GR}06`, flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: DK, marginBottom: 10 }}>Add position to portfolio</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 130px' }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 5 }}>Stock Symbol</label>
              <input value={sym} onChange={e => setSym(e.target.value.toUpperCase())} placeholder="e.g. RELIANCE"
                style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: `1.5px solid ${BORDER}`, borderRadius: 10, fontFamily: FONT, outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                onFocus={e => e.currentTarget.style.borderColor = BL+'60'}
                onBlur={e  => e.currentTarget.style.borderColor = BORDER} />
              {symSug.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 10, zIndex: 100, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', marginTop: 2, overflow: 'hidden' }}>
                  {symSug.map(r => (
                    <div key={r.symbol} onClick={() => { setSym(normSym(r.symbol)); setSymSug([]); }}
                      style={{ padding: '9px 12px', cursor: 'pointer', fontSize: 12, display: 'flex', justifyContent: 'space-between', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background=`${BL}08`}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <strong>{normSym(r.symbol)}</strong>
                      <span style={{ color:'#bbb', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ flex: '1 1 80px' }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 5 }}>Qty (shares)</label>
              <input type="number" value={qty} onChange={e => setQty(e.target.value)} placeholder="100" min="1"
                style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: `1.5px solid ${BORDER}`, borderRadius: 10, fontFamily: FONT, outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                onFocus={e => e.currentTarget.style.borderColor = BL+'60'}
                onBlur={e  => e.currentTarget.style.borderColor = BORDER} />
            </div>
            <div style={{ flex: '1 1 100px' }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 5 }}>Buy Price (₹)</label>
              <input type="number" value={buyPx} onChange={e => setBuyPx(e.target.value)} placeholder="1500.00" step="0.01"
                style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: `1.5px solid ${BORDER}`, borderRadius: 10, fontFamily: FONT, outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                onFocus={e => e.currentTarget.style.borderColor = BL+'60'}
                onBlur={e  => e.currentTarget.style.borderColor = BORDER} />
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button onClick={addPosition} style={{ padding: '9px 20px', fontSize: 13, fontWeight: 600, background: GR, color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: FONT }}>Add</button>
              <button onClick={() => { setShowAdd(false); setSym(''); setQty(''); setBuyPx(''); setSymSug([]); }}
                style={{ padding: '9px 14px', fontSize: 13, background: 'transparent', color: '#888', border: `1px solid ${BORDER}`, borderRadius: 10, cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Performance Chart */}
      {portfolio.length > 0 && (
        <PortfolioChart portfolio={portfolio} prices={prices} isMobile={isMobile} />
      )}

      {/* Holdings */}
      <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '12px 14px 24px' : '16px 22px 28px' }}>
        {portfolio.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '72px 24px', color: '#ccc' }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>💼</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#bbb', marginBottom: 8 }}>No positions yet</div>
            <div style={{ fontSize: 13, marginBottom: 20 }}>Click "+ Add Stock" to start tracking your holdings</div>
            <button onClick={() => setShowAdd(true)} style={{ padding: '10px 24px', fontSize: 13, fontWeight: 600, background: GR, color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontFamily: FONT }}>+ Add your first stock</button>
          </div>
        ) : isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {portfolio.map(p => {
              const q     = prices[p.symbol];
              const cp    = q?.price ?? null;
              const pnl   = cp != null ? (cp - p.buyPrice) * p.qty : null;
              const pnlPct = cp != null && p.buyPrice > 0 ? ((cp - p.buyPrice)/p.buyPrice*100) : null;
              const s     = normSym(p.symbol);
              return (
                <div key={p.id} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 14, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div onClick={() => onQuote(p.symbol)} style={{ cursor: 'pointer' }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: DK }}>{s}</div>
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
                        {pnlPct != null && <span style={{ fontSize: 11, marginLeft: 6 }}>({pctSign(pnlPct)}{pnlPct.toFixed(2)}%)</span>}
                      </div>
                    </div>
                    <button onClick={() => setPortfolio(p2 => p2.filter(x => x.id !== p.id))} style={{ background: `${RD}10`, border: 'none', cursor: 'pointer', color: RD, fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 8, fontFamily: FONT }}>Remove</button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${BORDER}`, background: '#fafafa' }}>
                  {['Stock','Qty','Buy Price','Curr Price','Day Chg','P&L','P&L %',''].map(h => (
                    <th key={h} style={{ fontSize: 10, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '13px 12px', textAlign: h==='Stock'?'left':h===''?'center':'right', fontFamily: FONT }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {portfolio.map(p => {
                  const q      = prices[p.symbol];
                  const cp     = q?.price ?? null;
                  const pnl    = cp != null ? (cp - p.buyPrice)*p.qty : null;
                  const pnlPct = cp != null && p.buyPrice>0 ? ((cp-p.buyPrice)/p.buyPrice*100) : null;
                  const s      = normSym(p.symbol);
                  return (
                    <tr key={p.id} style={{ borderBottom: `1px solid rgba(0,0,0,0.04)` }}
                      onMouseEnter={e => e.currentTarget.style.background='rgba(0,0,0,0.015)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <td style={{ padding: '12px' }}>
                        <div onClick={() => onQuote(p.symbol)} style={{ cursor: 'pointer' }}>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: DK }}>{s}</div>
                          <div style={{ fontSize: 10, color: '#ccc' }}>NSE</div>
                        </div>
                      </td>
                      <td style={{ padding: '12px', textAlign:'right', fontSize:13, fontWeight:600, color:DK }}>{p.qty}</td>
                      <td style={{ padding: '12px', textAlign:'right', fontSize:13, color:'#666' }}>₹{fmt(p.buyPrice)}</td>
                      <td style={{ padding: '12px', textAlign:'right', fontSize:13, fontWeight:600, color:DK }}>{cp!=null?`₹${fmt(cp)}`:<Spinner size={12}/>}</td>
                      <td style={{ padding: '12px', textAlign:'right', fontSize:12.5, fontWeight:600, color:q?pctColor(q.change_pct):'#ccc' }}>{q?`${pctSign(q.change_pct)}${q.change_pct?.toFixed(2)}%`:'—'}</td>
                      <td style={{ padding: '12px', textAlign:'right', fontSize:13, fontWeight:700, color:pnl!=null?pctColor(pnl):'#ccc' }}>{pnl!=null?`${pctSign(pnl)}₹${fmt(Math.abs(pnl))}`:'—'}</td>
                      <td style={{ padding: '12px', textAlign:'right', fontSize:12.5, fontWeight:600, color:pnlPct!=null?pctColor(pnlPct):'#ccc' }}>{pnlPct!=null?`${pctSign(pnlPct)}${pnlPct.toFixed(2)}%`:'—'}</td>
                      <td style={{ padding: '12px', textAlign:'center' }}>
                        <button onClick={() => setPortfolio(p2 => p2.filter(x => x.id !== p.id))}
                          style={{ background:'none', border:'none', cursor:'pointer', color:'#ddd', fontSize:18, transition:'color 0.15s', padding:'2px 6px' }}
                          onMouseEnter={e => e.currentTarget.style.color=RD}
                          onMouseLeave={e => e.currentTarget.style.color='#ddd'}>×</button>
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

  // Refresh prices when watchlist changes (covers initial load + new adds)
  useEffect(() => {
    saveLS(LS_WATCHLIST, watchlist);
    if (watchlist.length > 0) refreshPrices();
  }, [watchlist]);

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
    const sym = normSym(stock.symbol);
    if (watchlist.find(w => normSym(w.symbol) === sym)) return;
    setWatchlist(p => [...p, { id: uid(), symbol: sym, name: stock.name || sym, addedAt: new Date().toISOString() }]);
    setSearch(''); setResults([]);
  };

  const remove = (id) => {
    const w = watchlist.find(x => x.id === id);
    if (w) setPrices(p => { const n={...p}; delete n[w.symbol]; return n; });
    setWatchlist(p => p.filter(x => x.id !== id));
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: BG }}>
      {/* Search bar */}
      <div style={{ padding: isMobile ? '12px 14px' : '14px 22px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0, background: '#fff' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Search stocks to add to watchlist…"
              style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: `1.5px solid rgba(0,0,0,0.1)`, borderRadius: 12, fontFamily: FONT, outline: 'none', background: '#fff', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
              onFocus={e => e.currentTarget.style.borderColor = BL+'60'}
              onBlur={e  => e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'} />
            {results.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, zIndex: 100, boxShadow: '0 8px 28px rgba(0,0,0,0.10)', marginTop: 4, overflow: 'hidden' }}>
                {results.map(r => {
                  const sym = normSym(r.symbol);
                  const already = !!watchlist.find(w => normSym(w.symbol) === sym);
                  return (
                    <div key={r.symbol} onClick={() => !already && addToWatch(r)}
                      style={{ padding: '10px 14px', cursor: already?'default':'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', background: already?'rgba(0,0,0,0.02)':'transparent', transition:'background 0.1s', borderBottom:`1px solid rgba(0,0,0,0.04)` }}
                      onMouseEnter={e => { if(!already) e.currentTarget.style.background=`${BL}08`; }}
                      onMouseLeave={e => e.currentTarget.style.background=already?'rgba(0,0,0,0.02)':'transparent'}>
                      <div>
                        <span style={{ fontSize:13, fontWeight:700, color:DK }}>{sym}</span>
                        <span style={{ fontSize:11, color:'#bbb', marginLeft:8 }}>{r.name}</span>
                      </div>
                      <span style={{ fontSize:11, fontWeight:700, color:already?GR:BL, flexShrink:0 }}>{already?'✓ Added':'+ Add'}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <button onClick={refreshPrices} disabled={loading || !watchlist.length}
            style={{ padding:'10px 14px', fontSize:12, fontWeight:600, border:`1px solid ${BORDER}`, borderRadius:12, background:'#fff', cursor:'pointer', color:'#555', fontFamily:FONT, display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
            {loading ? <Spinner size={12}/> : '↻'} Refresh
          </button>
        </div>
        <div style={{ fontSize: 11, color: '#bbb', marginTop: 6 }}>
          Tip: In the AI tab, say <em>"Add RELIANCE to watchlist"</em> to add any stock instantly
        </div>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '12px 14px 24px' : '18px 22px 28px' }}>
        {watchlist.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '72px 24px', color: '#ccc' }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>⭐</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#bbb', marginBottom: 8 }}>Watchlist is empty</div>
            <div style={{ fontSize: 13, marginBottom: 16 }}>Search for stocks above, or say <em>"Add RELIANCE to watchlist"</em> in the AI tab</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(188px, 1fr))', gap: isMobile ? 8 : 10 }}>
            {watchlist.map(w => {
              const q   = prices[w.symbol] || prices[w.symbol?.replace('.NS','')] || prices[w.symbol + '.NS'];
              const sym = normSym(w.symbol);
              const up  = (q?.change_pct || 0) >= 0;
              return (
                <div key={w.id} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 14, padding: isMobile ? '12px 12px 10px' : '14px 14px 12px', position: 'relative', cursor: 'pointer', transition: 'box-shadow 0.15s, transform 0.15s', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                  onClick={() => onQuote(w.symbol)}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow='0 6px 20px rgba(0,0,0,0.09)'; e.currentTarget.style.transform='translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.04)'; e.currentTarget.style.transform='none'; }}>
                  <button onClick={e => { e.stopPropagation(); remove(w.id); }}
                    style={{ position:'absolute', top:8, right:8, background:'none', border:'none', cursor:'pointer', color:'#ddd', fontSize:16, padding:'2px 4px', transition:'color 0.15s', lineHeight:1 }}
                    onMouseEnter={e => e.currentTarget.style.color=RD}
                    onMouseLeave={e => e.currentTarget.style.color='#ddd'}>×</button>
                  <div style={{ fontSize: isMobile?13:14, fontWeight:700, color:DK, marginBottom:2, paddingRight:20, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{sym}</div>
                  <div style={{ fontSize:10, color:'#bbb', marginBottom: isMobile?8:10, paddingRight:20, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{w.name || q?.name || 'NSE'}</div>
                  {q ? (
                    <>
                      <div style={{ fontSize: isMobile?16:18, fontWeight:700, color:DK }}>₹{fmt(q.price)}</div>
                      <div style={{ fontSize:11, fontWeight:600, color:up?GR:RD, marginTop:1 }}>{pctSign(q.change_pct)}{q.change_pct?.toFixed(2)}%</div>
                    </>
                  ) : (
                    <div style={{ paddingTop:6 }}><Spinner size={14}/></div>
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
    <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '14px 14px 32px' : '22px 22px 36px', background: BG }}>
      {/* All Indices */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#bbb', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>All Indices</div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(auto-fill,minmax(160px,1fr))', gap: 8 }}>
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
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#bbb', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Sector Performance</div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3,1fr)' : 'repeat(auto-fill,minmax(140px,1fr))', gap: 8 }}>
          {sectors.map(s => {
            const idx  = indices.find(x => x.symbol === s.idx);
            const pct  = idx?.change_pct ?? 0;
            const up   = pct >= 0;
            const alpha = Math.min(Math.abs(pct)/3, 1);
            return (
              <div key={s.name} style={{ background: up ? `rgba(0,196,140,${0.06+alpha*0.18})` : `rgba(253,91,93,${0.06+alpha*0.18})`, border: `1px solid ${up ? `${GR}30` : `${RD}30`}`, borderRadius: 12, padding: isMobile ? '10px 8px' : '12px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: isMobile ? 10 : 12, fontWeight: 700, color: DK, marginBottom: 4 }}>{s.name}</div>
                <div style={{ fontSize: isMobile ? 14 : 17, fontWeight: 800, color: up ? GR : RD }}>{pctSign(pct)}{pct.toFixed(2)}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gainers & Losers */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
        {[{ label:'▲ Top Gainers', list: gainers, clr: GR, bg: `${GR}07` }, { label:'▼ Top Losers', list: losers, clr: RD, bg: `${RD}07` }].map(({label,list,clr,bg}) => (
          <div key={label} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', borderBottom: `1px solid ${BORDER}`, background: bg }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: clr }}>{label}</span>
            </div>
            {list.length === 0
              ? <div style={{ padding: '20px 14px', fontSize: 12, color: '#ccc', textAlign: 'center' }}>Loading data…</div>
              : list.slice(0, 12).map(m => <MoverRow key={m.symbol} m={m} onQuote={onQuote} />)
            }
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Alerts Tab ─────────────────────────────────────────────────────────────────
const AlertsTab = ({ isMobile, onQuote, alerts, setAlerts, alertPrices, alertLoading, notifGranted, requestNotifPermission, resetAlert }) => {
  const [sym,    setSym]    = useState('');
  const [price,  setPrice]  = useState('');
  const [dir,    setDir]    = useState('above');
  const [symSug, setSymSug] = useState([]);
  const debRef              = useRef(null);

  useEffect(() => {
    clearTimeout(debRef.current);
    if (sym.trim().length < 2) { setSymSug([]); return; }
    debRef.current = setTimeout(async () => {
      try { const r = await api.searchStocks(sym.trim()); setSymSug(r.results?.slice(0,5)||[]); }
      catch { setSymSug([]); }
    }, 280);
  }, [sym]);

  const addAlert = () => {
    const s = normSym(sym.trim());
    const p = parseFloat(price);
    if (!s || !p || p <= 0) return;
    setAlerts(prev => [...prev, { id: uid(), symbol: s, price: p, dir, triggered: false, triggeredAt: null, createdAt: new Date().toISOString() }]);
    setSym(''); setPrice(''); setDir('above'); setSymSug([]);
  };

  const liveTriggered = (a) => {
    if (a.triggered) return true;
    const q = alertPrices[a.symbol];
    if (!q) return false;
    return a.dir === 'above' ? q.price >= a.price : q.price <= a.price;
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: BG }}>
      {/* Notification permission banner */}
      {!notifGranted && (
        <div style={{ padding: '10px 22px', background: `${OR}12`, borderBottom: `1px solid ${OR}30`, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 16 }}>🔔</span>
          <span style={{ fontSize: 12, color: '#7a4a00', flex: 1 }}>Enable browser notifications to get alerts even when this tab isn't active.</span>
          <button onClick={requestNotifPermission}
            style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, background: OR, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: FONT, flexShrink: 0 }}>
            Enable
          </button>
        </div>
      )}

      {/* Add alert form */}
      <div style={{ padding: isMobile ? '14px 14px' : '16px 22px', borderBottom: `1px solid ${BORDER}`, background: '#fff', flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: DK, marginBottom: 10 }}>Set Price Alert</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ position: 'relative', flex: '1 1 120px' }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 5 }}>Stock Symbol</label>
            <input value={sym} onChange={e => setSym(e.target.value.toUpperCase())} placeholder="RELIANCE"
              style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: `1.5px solid ${BORDER}`, borderRadius: 10, fontFamily: FONT, outline: 'none', background: '#fff', boxSizing: 'border-box' }}
              onFocus={e => e.currentTarget.style.borderColor = BL+'60'}
              onBlur={e  => e.currentTarget.style.borderColor = BORDER} />
            {symSug.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 10, zIndex: 100, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', marginTop: 2, overflow: 'hidden' }}>
                {symSug.map(r => (
                  <div key={r.symbol} onClick={() => { setSym(normSym(r.symbol)); setSymSug([]); }}
                    style={{ padding: '9px 12px', cursor: 'pointer', fontSize: 12, display: 'flex', justifyContent: 'space-between', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background=`${BL}08`}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <strong>{normSym(r.symbol)}</strong>
                    <span style={{ color: '#bbb' }}>{r.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ flex: '0 0 110px' }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 5 }}>Condition</label>
            <select value={dir} onChange={e => setDir(e.target.value)}
              style={{ width: '100%', padding: '9px 10px', fontSize: 13, border: `1.5px solid ${BORDER}`, borderRadius: 10, fontFamily: FONT, outline: 'none', background: '#fff', cursor: 'pointer' }}>
              <option value="above">Above ↑</option>
              <option value="below">Below ↓</option>
            </select>
          </div>
          <div style={{ flex: '1 1 100px' }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 5 }}>Target Price (₹)</label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="1500" step="0.01"
              style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: `1.5px solid ${BORDER}`, borderRadius: 10, fontFamily: FONT, outline: 'none', background: '#fff', boxSizing: 'border-box' }}
              onFocus={e => e.currentTarget.style.borderColor = BL+'60'}
              onBlur={e  => e.currentTarget.style.borderColor = BORDER} />
          </div>
          <button onClick={addAlert} style={{ padding: '9px 20px', fontSize: 13, fontWeight: 600, background: OR, color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: FONT, flexShrink: 0 }}>
            🔔 Set Alert
          </button>
        </div>
      </div>

      {/* Alerts list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '14px 14px 24px' : '18px 22px 28px' }}>
        {alerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '72px 24px', color: '#ccc' }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>🔔</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#bbb', marginBottom: 8 }}>No alerts set</div>
            <div style={{ fontSize: 13 }}>Set a price alert above to get notified when a stock hits your target</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {alerts.map(a => {
              const q   = alertPrices[a.symbol];
              const hit = liveTriggered(a);
              return (
                <div key={a.id} style={{ background: '#fff', border: `1px solid ${hit ? `${GR}40` : BORDER}`, borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: hit ? `0 0 0 2px ${GR}20` : 'none', transition: 'all 0.3s' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: hit ? `${GR}15` : `${OR}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                    {hit ? '✅' : '🔔'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                      <span onClick={() => onQuote(a.symbol)} style={{ fontSize: 14, fontWeight: 700, color: DK, cursor: 'pointer' }}>{a.symbol}</span>
                      <Tag color={a.dir === 'above' ? GR : RD}>{a.dir === 'above' ? '↑ Above' : '↓ Below'} ₹{fmt(a.price)}</Tag>
                      {hit && <Tag color={GR}>🎯 TRIGGERED</Tag>}
                    </div>
                    <div style={{ fontSize: 12, color: '#888' }}>
                      Current: {q ? <strong style={{ color: hit ? GR : DK }}>₹{fmt(q.price)}</strong> : alertLoading ? <Spinner size={10}/> : '—'}
                      {q && <span style={{ color: pctColor(q.change_pct), marginLeft: 6 }}>{pctSign(q.change_pct)}{q.change_pct?.toFixed(2)}%</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {hit && (
                      <button onClick={() => resetAlert(a.id)}
                        title="Re-set alert (watch for next trigger)"
                        style={{ padding: '5px 10px', fontSize: 11, fontWeight: 600, background: `${BL}12`, color: BL, border: `1px solid ${BL}30`, borderRadius: 8, cursor: 'pointer', fontFamily: FONT }}>
                        Re-set
                      </button>
                    )}
                    <button onClick={() => setAlerts(p => p.filter(x => x.id !== a.id))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ddd', fontSize: 18, padding: '2px 6px', transition: 'color 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.color = RD}
                      onMouseLeave={e => e.currentTarget.style.color = '#ddd'}>×</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Tab Config ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'ai',        emoji: '🤖', label: 'AI Expert'  },
  { id: 'portfolio', emoji: '💼', label: 'Portfolio'  },
  { id: 'watchlist', emoji: '⭐', label: 'Watchlist'  },
  { id: 'market',    emoji: '📊', label: 'Markets'    },
  { id: 'alerts',    emoji: '🔔', label: 'Alerts'     },
];

// ── Main TradingPage ───────────────────────────────────────────────────────────
export default function TradingPage() {
  const navigate = useNavigate();
  const w        = useWindowWidth();
  const isMobile = w < 768;

  const [activeTab,     setActiveTab]     = useState('ai');
  const [indices,       setIndices]       = useState([]);
  const [movers,        setMovers]        = useState([]);
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [quote,         setQuote]         = useState(null);
  const [quoteLoad,     setQuoteLoad]     = useState(false);
  const [portfolio,     setPortfolio]     = useState(() => loadLS(LS_PORTFOLIO, []));
  const [watchlist,     setWatchlist]     = useState(() => loadLS(LS_WATCHLIST, []));

  // ── Alert state (lifted here so polling persists across tab switches) ──────
  const [alerts,        setAlerts]        = useState(() => loadLS(LS_ALERTS, []));
  const [alertPrices,   setAlertPrices]   = useState({});
  const [alertLoading,  setAlertLoading]  = useState(false);
  const [toasts,        setToasts]        = useState([]);
  const [notifGranted,  setNotifGranted]  = useState(() => typeof Notification !== 'undefined' && Notification.permission === 'granted');
  const alertsRef   = useRef(alerts);
  const notifiedIds = useRef(new Set(alerts.filter(a => a.triggered).map(a => a.id)));
  const toastTimers = useRef([]);

  // Single persistence path — no duplicate saveLS inside updaters
  useEffect(() => { saveLS(LS_ALERTS, alerts); }, [alerts]);
  // Keep ref in sync for use inside async polling callbacks
  useEffect(() => { alertsRef.current = alerts; }, [alerts]);
  // Prune notifiedIds when alerts are removed
  useEffect(() => {
    const live = new Set(alerts.map(a => a.id));
    notifiedIds.current.forEach(id => { if (!live.has(id)) notifiedIds.current.delete(id); });
  }, [alerts]);
  // Clean up toast timers on unmount
  useEffect(() => () => { toastTimers.current.forEach(clearTimeout); }, []);

  const requestNotifPermission = async () => {
    if (typeof Notification === 'undefined') return;
    const perm = await Notification.requestPermission();
    setNotifGranted(perm === 'granted');
  };

  const resetAlert = (id) => {
    notifiedIds.current.delete(id);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, triggered: false, triggeredAt: null } : a));
  };

  const dismissToast = (id) => setToasts(t => t.filter(x => x.id !== id));

  const addToast = (payload) => {
    const toastId = uid();
    setToasts(t => [...t, { id: toastId, ...payload }]);
    const timer = setTimeout(() => setToasts(t => t.filter(x => x.id !== toastId)), 7000);
    toastTimers.current.push(timer);
  };

  // Background polling — runs regardless of which tab is active
  const symbolsKey = alerts.map(a => a.id).join(',');
  useEffect(() => {
    if (!alerts.length) return;
    const poll = async () => {
      const current = alertsRef.current;
      if (!current.length) return;
      setAlertLoading(true);
      const res = {};
      await Promise.allSettled(
        [...new Set(current.map(a => a.symbol))].map(async sym => {
          try { const r = await api.getMarketQuote(sym); if (r.success) res[sym] = r.quote; } catch {}
        })
      );
      setAlertPrices(res);
      setAlertLoading(false);

      const newlyTriggered = [];
      current.forEach(a => {
        if (notifiedIds.current.has(a.id) || a.triggered) return;
        const q = res[a.symbol];
        if (!q) return;
        const hit = a.dir === 'above' ? q.price >= a.price : q.price <= a.price;
        if (hit) newlyTriggered.push({ ...a, q });
      });

      if (newlyTriggered.length) {
        newlyTriggered.forEach(item => {
          notifiedIds.current.add(item.id);
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            try {
              new Notification(`🎯 ${item.symbol} Alert Triggered`, {
                body: `${item.symbol} ${item.dir === 'above' ? 'rose above' : 'fell below'} ₹${fmt(item.price)}. Now: ₹${fmt(item.q.price)}`,
                tag: item.id,
              });
            } catch {}
          }
          addToast({ symbol: item.symbol, dir: item.dir, target: item.price, current: item.q.price });
        });
        setAlerts(prev => {
          const ids = new Set(newlyTriggered.map(x => x.id));
          return prev.map(a => ids.has(a.id) ? { ...a, triggered: true, triggeredAt: new Date().toISOString() } : a);
        });
      }
    };
    poll();
    const t = setInterval(poll, 60000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolsKey]);
  const [pfPrefill,     setPfPrefill]     = useState(null);   // pre-fill portfolio from quote

  // Listen for cross-component events
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

  const handleAddToWatchlist = (symbol, name) => {
    const sym = normSym(symbol);
    if (!watchlist.find(w2 => normSym(w2.symbol) === sym)) {
      setWatchlist(p => [...p, { id: uid(), symbol: sym, name: name || sym, addedAt: new Date().toISOString() }]);
    }
  };

  const handleAddToPortfolio = (symbol, qty, price) => {
    const sym = normSym(symbol);
    const idx = portfolio.findIndex(p => normSym(p.symbol) === sym);
    if (idx >= 0) {
      const updated = [...portfolio];
      const old = updated[idx];
      const tot = old.qty + qty;
      updated[idx] = { ...old, qty: tot, buyPrice: Math.round((old.qty*old.buyPrice + qty*price)/tot*100)/100 };
      setPortfolio(updated);
    } else {
      setPortfolio(p => [...p, { id: uid(), symbol: sym, qty, buyPrice: price, addedAt: new Date().toISOString() }]);
    }
  };

  const handleRemoveFromWatchlist = (symbol) => {
    const sym = normSym(symbol);
    setWatchlist(p => p.filter(w2 => normSym(w2.symbol) !== sym));
  };

  const handleSwitchTab = (tab) => setActiveTab(tab);

  const addToWatchlistFromQuote = (q) => {
    handleAddToWatchlist(q.symbol, q.name);
    setQuote(null); setActiveTab('watchlist');
  };

  const addToPortfolioFromQuote = (q) => {
    setPfPrefill({ symbol: q.symbol, price: q.price });
    setQuote(null); setActiveTab('portfolio');
  };

  const nifty   = indices.find(x => x.symbol === '^NSEI');
  const niftyUp = (nifty?.change_pct || 0) >= 0;

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: BG, fontFamily: FONT, overflow: 'hidden' }}>

      {/* ── Header ── */}
      <header style={{ height: 54, flexShrink: 0, background: '#fff', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', padding: '0 14px', gap: 10, zIndex: 10 }}>
        <button onClick={() => navigate('/app')}
          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: '#666', background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: 10, padding: '6px 12px', cursor: 'pointer', fontFamily: FONT, flexShrink: 0, fontWeight: 500 }}>
          ← Back
        </button>

        {isMobile && (
          <button onClick={() => setSidebarOpen(true)}
            style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '5px 10px', cursor: 'pointer', fontSize: 13, color: '#666', fontFamily: FONT, flexShrink: 0 }}>
            📊
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <div style={{ width: 30, height: 30, borderRadius: 10, background: `${GR}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>📈</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: isMobile ? 13.5 : 15, fontWeight: 700, color: DK, lineHeight: 1.2 }}>Trading Intelligence</div>
            {!isMobile && <div style={{ fontSize: 10.5, color: '#aaa' }}>AI-powered NSE/BSE analysis · Live data</div>}
          </div>
        </div>

        {nifty && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: niftyUp ? `${GR}10` : `${RD}10`, border: `1px solid ${niftyUp ? GR : RD}28`, borderRadius: 100, padding: isMobile ? '4px 8px' : '4px 12px', flexShrink: 0 }}>
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

        {/* Market sidebar — desktop */}
        {!isMobile && (
          <MarketSidebar indices={indices} movers={movers} onQuote={openQuote} isMobile={false} sidebarOpen={false} onClose={() => {}} />
        )}

        {/* Market sidebar — mobile drawer */}
        {isMobile && (
          <MarketSidebar indices={indices} movers={movers} onQuote={openQuote} isMobile sidebarOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}

        {/* Main content area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {/* Tab bar */}
          <div style={{ height: 46, flexShrink: 0, background: '#fff', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'stretch', padding: '0 4px', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: isMobile ? '0 12px' : '0 18px', fontSize: isMobile ? 11.5 : 13, fontWeight: activeTab === t.id ? 700 : 500, color: activeTab === t.id ? BL : '#888', background: 'transparent', border: 'none', cursor: 'pointer', borderBottom: `2.5px solid ${activeTab === t.id ? BL : 'transparent'}`, transition: 'all 0.15s', whiteSpace: 'nowrap', fontFamily: FONT, flexShrink: 0 }}>
                <span>{t.emoji}</span>
                {(!isMobile || w >= 380) && <span>{t.label}</span>}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {activeTab === 'ai' && (
              <AIAssistant
                portfolio={portfolio} watchlist={watchlist} indices={indices} movers={movers} isMobile={isMobile}
                onAddToWatchlist={handleAddToWatchlist}
                onAddToPortfolio={handleAddToPortfolio}
                onRemoveFromWatchlist={handleRemoveFromWatchlist}
                onSwitchTab={handleSwitchTab}
              />
            )}
            {activeTab === 'portfolio' && (
              <PortfolioTab
                portfolio={portfolio} setPortfolio={setPortfolio} onQuote={openQuote} isMobile={isMobile}
                prefill={pfPrefill} clearPrefill={() => setPfPrefill(null)}
              />
            )}
            {activeTab === 'watchlist' && (
              <WatchlistTab
                watchlist={watchlist} setWatchlist={setWatchlist} onQuote={openQuote} isMobile={isMobile}
              />
            )}
            {activeTab === 'market' && (
              <MarketTab indices={indices} movers={movers} onQuote={openQuote} isMobile={isMobile} />
            )}
            {activeTab === 'alerts' && (
              <AlertsTab
                isMobile={isMobile} onQuote={openQuote}
                alerts={alerts} setAlerts={setAlerts}
                alertPrices={alertPrices} alertLoading={alertLoading}
                notifGranted={notifGranted} requestNotifPermission={requestNotifPermission}
                resetAlert={resetAlert}
              />
            )}
          </div>
        </div>
      </div>

      {/* Quote Modal */}
      <QuoteModal
        quote={quote} loading={quoteLoad}
        onClose={() => { setQuote(null); setQuoteLoad(false); }}
        onAddWatchlist={addToWatchlistFromQuote}
        onAddPortfolio={addToPortfolioFromQuote}
      />

      <AlertToastOverlay toasts={toasts} onDismiss={dismissToast} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 2px; }
        @keyframes tpSpin    { to { transform: rotate(360deg); } }
        @keyframes tpPulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes tpDot     { 0%,100%{transform:scale(0.65);opacity:0.4} 50%{transform:scale(1.2);opacity:1} }
        @keyframes tpSlideIn { from { opacity:0; transform:translateX(24px); } to { opacity:1; transform:translateX(0); } }
      `}</style>
    </div>
  );
}
