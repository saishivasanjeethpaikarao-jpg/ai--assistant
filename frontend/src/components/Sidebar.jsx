import { useState, useEffect, useRef, useCallback } from 'react';
import {
  FiMessageSquare, FiDatabase, FiTrendingUp, FiBell,
  FiZap, FiBarChart2, FiCpu, FiPlus, FiRefreshCw,
  FiCheckCircle, FiAlertTriangle, FiActivity, FiX, FiSearch,
  FiArrowUpRight, FiArrowDownRight, FiMinus, FiStar, FiChevronDown,
  FiChevronUp,
} from 'react-icons/fi';
import { api } from '../services/api';

const B = '#437DFD';
const BORDER = 'rgba(0,0,0,0.07)';

const TITLES = {
  chat:      { label: 'Chats',        icon: FiMessageSquare },
  memory:    { label: 'Memory',       icon: FiDatabase },
  trading:   { label: 'Trading',      icon: FiTrendingUp },
  reminders: { label: 'Reminders',    icon: FiBell },
  skills:    { label: 'Capabilities', icon: FiZap },
  analytics: { label: 'Analytics',    icon: FiBarChart2 },
  brain:     { label: 'AI Brain',     icon: FiCpu },
};

const SectionHdr = ({ title, onAdd, onRefresh }) => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'4px 16px 4px 16px', height:'30px', flexShrink:0 }}>
    <span style={{ fontSize:'10px', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.10em', color:'#aaa' }}>{title}</span>
    <div style={{ display:'flex', gap:'2px' }}>
      {onRefresh && (
        <button onClick={onRefresh} style={{ display:'flex', alignItems:'center', justifyContent:'center', width:'20px', height:'20px', background:'none', border:'none', color:'#bbb', cursor:'pointer', borderRadius:'4px' }}
          onMouseEnter={e=>e.currentTarget.style.color=B} onMouseLeave={e=>e.currentTarget.style.color='#bbb'}>
          <FiRefreshCw size={11}/>
        </button>
      )}
      {onAdd && (
        <button onClick={onAdd} style={{ display:'flex', alignItems:'center', justifyContent:'center', width:'20px', height:'20px', background:'none', border:'none', color:'#bbb', cursor:'pointer', borderRadius:'4px' }}
          onMouseEnter={e=>e.currentTarget.style.color=B} onMouseLeave={e=>e.currentTarget.style.color='#bbb'}>
          <FiPlus size={11}/>
        </button>
      )}
    </div>
  </div>
);

const Row = ({ primary, secondary, active, dot, dotColor, avatar }) => {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        padding:'9px 16px', cursor:'pointer', transition:'background 0.12s',
        backgroundColor: active ? `rgba(67,125,253,0.08)` : hov ? 'rgba(67,125,253,0.04)' : 'transparent',
        borderRadius:'8px', margin:'1px 8px',
        display:'flex', alignItems:'center', gap:'10px',
      }}>
      {avatar && (
        <div style={{
          width:'32px', height:'32px', borderRadius:'10px', flexShrink:0,
          background: active ? `linear-gradient(135deg,${B},#2C76FF)` : 'rgba(67,125,253,0.1)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:'12px', fontWeight:'700',
          color: active ? '#fff' : B,
          boxShadow: active ? '0 2px 8px rgba(67,125,253,0.25)' : 'none',
        }}>
          {typeof avatar === 'string' ? avatar : '💬'}
        </div>
      )}
      <div style={{ flex:1, minWidth:0 }}>
        {dot && <div style={{ width:'6px', height:'6px', borderRadius:'50%', backgroundColor:dotColor||B, flexShrink:0, display:'inline-block', marginRight:'6px' }}/>}
        <div style={{ fontSize:'13px', color: active ? B : '#0C0C0C', fontWeight: active ? '600' : '400', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{primary}</div>
        {secondary && <div style={{ fontSize:'11px', color:'#aaa', marginTop:'1px' }}>{secondary}</div>}
      </div>
    </div>
  );
};

const ChatPanel = ({ history }) => {
  const [filter, setFilter] = useState('today');
  const [search, setSearch] = useState('');
  const items = history.length > 0 ? history.slice(-8).reverse() : [];
  const filtered = items.filter(i => !search || i.input?.toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minHeight:0 }}>
      <div style={{ padding:'10px 12px 6px', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'#fff', border:`1px solid ${BORDER}`, borderRadius:'10px', padding:'8px 12px' }}>
          <FiSearch size={13} style={{ color:'#bbb', flexShrink:0 }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search chats..."
            style={{ flex:1, border:'none', outline:'none', background:'transparent', fontSize:'13px', color:'#0C0C0C' }}/>
        </div>
      </div>
      <div style={{ display:'flex', gap:'4px', padding:'0 12px 8px', flexShrink:0 }}>
        {['today','yesterday','all'].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{
            padding:'4px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'500', cursor:'pointer', border:'none',
            background: filter===f ? B : 'transparent',
            color: filter===f ? '#fff' : '#888',
            transition:'all 0.15s',
          }}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>
        ))}
      </div>
      <div style={{ flex:1, overflowY:'auto', minHeight:0 }}>
        <SectionHdr title={`Recent (${filtered.length})`} />
        {filtered.length === 0
          ? <p style={{ padding:'16px', fontSize:'12px', color:'#bbb', textAlign:'center' }}>Start chatting to see history here</p>
          : filtered.map((item,i) => (
            <Row key={i} primary={item.input}
              secondary={item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : 'Just now'}
              active={i===0}
              avatar={(item.input?.[0] || 'C').toUpperCase()}
            />
          ))
        }
      </div>
    </div>
  );
};

const MemoryPanel = ({ stats }) => {
  const items = [
    { label:'Strategies learned', value: stats?.total_strategies??'—' },
    { label:'User preferences',   value: stats?.total_preferences??'—' },
    { label:'Patterns detected',  value: stats?.total_patterns??'—' },
    { label:'Failures analysed',  value: stats?.total_failures??'—' },
  ];
  return (
    <div style={{ flex:1, overflowY:'auto', minHeight:0 }}>
      <SectionHdr title="Adaptive Memory" />
      <div style={{ padding:'8px 16px 4px' }}>
        {items.map(it=>(
          <div key={it.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:`1px solid ${BORDER}` }}>
            <span style={{ fontSize:'12px', color:'#777' }}>{it.label}</span>
            <span style={{ fontSize:'12px', color:B, fontFamily:'monospace', fontWeight:'600' }}>{it.value}</span>
          </div>
        ))}
      </div>
      <SectionHdr title="Learning" />
      <div style={{ padding:'0 16px 8px' }}>
        <p style={{ fontSize:'12px', color:'#aaa', lineHeight:'1.7' }}>Airis learns from every interaction — strategies, preferences and patterns stored automatically.</p>
      </div>
    </div>
  );
};

const RemindersPanel = ({ reminders, onRefresh }) => {
  const [text, setText] = useState('');
  const [when, setWhen] = useState('tomorrow');
  const [adding, setAdding] = useState(false);
  const add = async () => {
    if (!text.trim()) return;
    setAdding(true);
    try { await api.addReminder(text.trim(), when); setText(''); onRefresh?.(); } catch {}
    setAdding(false);
  };
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minHeight:0 }}>
      <SectionHdr title={`Upcoming (${reminders.length})`} onRefresh={onRefresh} />
      <div style={{ flex:1, overflowY:'auto', minHeight:0 }}>
        {reminders.length===0
          ? <p style={{ padding:'16px', fontSize:'12px', color:'#bbb', textAlign:'center' }}>No reminders yet</p>
          : reminders.map((r,i)=><Row key={i} primary={r.text||r.title||JSON.stringify(r)} secondary={r.when||r.time||''} dot dotColor={r.completed?'#00C48C':B} avatar="⏰"/>)
        }
      </div>
      <div style={{ borderTop:`1px solid ${BORDER}`, padding:'10px 12px', flexShrink:0 }}>
        <input value={text} onChange={e=>setText(e.target.value)} placeholder="New reminder..."
          onKeyDown={e=>e.key==='Enter'&&add()}
          style={{ width:'100%', marginBottom:'6px', padding:'8px 12px', background:'#fff', border:`1px solid ${BORDER}`, borderRadius:'8px', color:'#0C0C0C', fontSize:'13px', outline:'none', boxSizing:'border-box' }}
          onFocus={e=>e.target.style.borderColor=B} onBlur={e=>e.target.style.borderColor=BORDER}/>
        <div style={{ display:'flex', gap:'6px' }}>
          <input value={when} onChange={e=>setWhen(e.target.value)} placeholder="when (e.g. tomorrow 9am)"
            style={{ flex:1, padding:'8px 10px', background:'#fff', border:`1px solid ${BORDER}`, borderRadius:'8px', color:'#0C0C0C', fontSize:'12px', outline:'none' }}/>
          <button onClick={add} disabled={adding||!text.trim()}
            style={{ padding:'8px 14px', background:`linear-gradient(135deg,${B},#2C76FF)`, border:'none', borderRadius:'8px', color:'#fff', fontSize:'12px', cursor:'pointer', fontWeight:'500' }}>
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

const DEFAULT_WATCHLIST = ['RELIANCE','TCS','HDFCBANK','INFY','ICICIBANK','SBIN','WIPRO','ITC'];

const fmt = (n) => {
  if (!n && n !== 0) return '—';
  if (n >= 1e12) return '₹' + (n/1e12).toFixed(2) + 'T';
  if (n >= 1e9)  return '₹' + (n/1e9).toFixed(2) + 'B';
  if (n >= 1e7)  return '₹' + (n/1e7).toFixed(2) + 'Cr';
  if (n >= 1e5)  return '₹' + (n/1e5).toFixed(2) + 'L';
  return '₹' + n.toLocaleString('en-IN', {maximumFractionDigits:2});
};
const fmtP = (n) => {
  if (n === undefined || n === null) return '—';
  const s = Math.abs(n).toFixed(2) + '%';
  return (n >= 0 ? '+' : '-') + s;
};
const clr = (n) => n > 0 ? '#00C48C' : n < 0 ? '#FD5B5D' : '#888';

const IndexChip = ({ idx }) => {
  if (!idx) return null;
  const up = idx.change_pct >= 0;
  return (
    <div style={{
      flex:1, minWidth:0, padding:'7px 8px', borderRadius:'8px',
      background: up ? 'rgba(0,196,140,0.06)' : 'rgba(253,91,93,0.06)',
      border: `1px solid ${up ? 'rgba(0,196,140,0.18)' : 'rgba(253,91,93,0.18)'}`,
    }}>
      <div style={{ fontSize:'9px', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.06em', color:'#888', marginBottom:'2px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
        {idx.name}
      </div>
      <div style={{ fontSize:'12px', fontWeight:'700', color:'#0C0C0C', fontFamily:'monospace', whiteSpace:'nowrap' }}>
        {idx.price ? idx.price.toLocaleString('en-IN', {maximumFractionDigits:0}) : '—'}
      </div>
      <div style={{ fontSize:'10px', color: clr(idx.change_pct), fontWeight:'600', display:'flex', alignItems:'center', gap:'2px' }}>
        {up ? <FiArrowUpRight size={9}/> : <FiArrowDownRight size={9}/>}
        {fmtP(idx.change_pct)}
      </div>
    </div>
  );
};

const QuoteCard = ({ quote, onClose }) => {
  if (!quote) return null;
  const up = quote.change >= 0;
  return (
    <div style={{ margin:'8px', padding:'10px 12px', background:'#fff', border:`1px solid ${BORDER}`, borderRadius:'10px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'6px' }}>
        <div>
          <div style={{ fontSize:'13px', fontWeight:'700', color:'#0C0C0C', fontFamily:'monospace' }}>
            {quote.display_symbol || quote.symbol?.replace('.NS','').replace('.BO','')}
          </div>
          <div style={{ fontSize:'10px', color:'#888', marginTop:'1px', maxWidth:'140px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {quote.name}
          </div>
        </div>
        <button onClick={onClose} style={{ background:'none', border:'none', color:'#bbb', cursor:'pointer', padding:'2px' }}>
          <FiX size={13}/>
        </button>
      </div>
      <div style={{ display:'flex', alignItems:'baseline', gap:'8px', marginBottom:'8px' }}>
        <span style={{ fontSize:'20px', fontWeight:'800', color:'#0C0C0C', fontFamily:'monospace' }}>
          {quote.price ? '₹' + quote.price.toLocaleString('en-IN', {maximumFractionDigits:2}) : '—'}
        </span>
        <span style={{ fontSize:'12px', fontWeight:'600', color: clr(quote.change) }}>
          {quote.change >= 0 ? '+' : ''}{quote.change?.toFixed(2)} ({fmtP(quote.change_pct)})
        </span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 8px' }}>
        {[
          ['Open',    quote.open   ? '₹' + quote.open?.toLocaleString('en-IN')   : '—'],
          ['High',    quote.high   ? '₹' + quote.high?.toLocaleString('en-IN')   : '—'],
          ['Low',     quote.low    ? '₹' + quote.low?.toLocaleString('en-IN')    : '—'],
          ['Prev',    quote.prev_close ? '₹' + quote.prev_close?.toLocaleString('en-IN') : '—'],
          ['52W H',   quote.year_high ? '₹' + quote.year_high?.toLocaleString('en-IN') : '—'],
          ['52W L',   quote.year_low  ? '₹' + quote.year_low?.toLocaleString('en-IN')  : '—'],
          ['Mkt Cap', fmt(quote.market_cap)],
        ].map(([label, val]) => (
          <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:'10px', color:'#aaa' }}>{label}</span>
            <span style={{ fontSize:'10px', fontWeight:'600', color:'#444', fontFamily:'monospace' }}>{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const StockRow = ({ sym, price, change, change_pct, name, onAdd, onRemove, inWatchlist, onClick }) => {
  const [hov, setHov] = useState(false);
  const up = change_pct >= 0;
  return (
    <div
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      onClick={onClick}
      style={{
        padding:'8px 12px', display:'flex', alignItems:'center', justifyContent:'space-between',
        cursor:'pointer', borderRadius:'8px', margin:'1px 8px', transition:'background 0.1s',
        background: hov ? 'rgba(67,125,253,0.04)' : 'transparent',
      }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:'12px', fontWeight:'700', color:'#0C0C0C', fontFamily:'monospace' }}>{sym}</div>
        {name && <div style={{ fontSize:'10px', color:'#bbb', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'120px' }}>{name}</div>}
      </div>
      <div style={{ textAlign:'right', display:'flex', alignItems:'center', gap:'6px' }}>
        <div>
          <div style={{ fontSize:'12px', fontWeight:'700', color:'#0C0C0C', fontFamily:'monospace' }}>
            {price ? '₹' + price.toLocaleString('en-IN', {maximumFractionDigits:2}) : '—'}
          </div>
          <div style={{ fontSize:'10px', color: clr(change_pct), fontWeight:'600', display:'flex', alignItems:'center', justifyContent:'flex-end', gap:'2px' }}>
            {change_pct !== undefined && change_pct !== null
              ? <>{up ? <FiArrowUpRight size={9}/> : <FiArrowDownRight size={9}/>}{fmtP(change_pct)}</>
              : '—'}
          </div>
        </div>
        {hov && (
          <button
            onClick={e=>{ e.stopPropagation(); inWatchlist ? onRemove?.(sym) : onAdd?.(sym); }}
            style={{ background:'none', border:'none', color: inWatchlist ? B : '#ccc', cursor:'pointer', padding:'2px', display:'flex', alignItems:'center' }}>
            <FiStar size={11} fill={inWatchlist ? B : 'none'}/>
          </button>
        )}
      </div>
    </div>
  );
};

const NSE_POPULAR = [
  { symbol:'RELIANCE', name:'Reliance Industries' },
  { symbol:'TCS', name:'Tata Consultancy Services' },
  { symbol:'HDFCBANK', name:'HDFC Bank' },
  { symbol:'INFY', name:'Infosys' },
  { symbol:'ICICIBANK', name:'ICICI Bank' },
  { symbol:'KOTAKBANK', name:'Kotak Mahindra Bank' },
  { symbol:'SBIN', name:'State Bank of India' },
  { symbol:'AXISBANK', name:'Axis Bank' },
  { symbol:'WIPRO', name:'Wipro' },
  { symbol:'ITC', name:'ITC Limited' },
  { symbol:'BHARTIARTL', name:'Bharti Airtel' },
  { symbol:'LT', name:'Larsen & Toubro' },
  { symbol:'TATAMOTORS', name:'Tata Motors' },
  { symbol:'TATASTEEL', name:'Tata Steel' },
  { symbol:'SUNPHARMA', name:'Sun Pharmaceutical' },
  { symbol:'BAJFINANCE', name:'Bajaj Finance' },
  { symbol:'HCLTECH', name:'HCL Technologies' },
  { symbol:'TITAN', name:'Titan Company' },
  { symbol:'ADANIENT', name:'Adani Enterprises' },
  { symbol:'NTPC', name:'NTPC Limited' },
  { symbol:'ONGC', name:'Oil & Natural Gas Corp' },
  { symbol:'MARUTI', name:'Maruti Suzuki' },
  { symbol:'NESTLEIND', name:'Nestle India' },
  { symbol:'DRREDDY', name:"Dr. Reddy's Laboratories" },
  { symbol:'ZOMATO', name:'Zomato' },
  { symbol:'IRCTC', name:'IRCTC' },
  { symbol:'HAL', name:'HAL' },
  { symbol:'BEL', name:'Bharat Electronics' },
  { symbol:'TATAPOWER', name:'Tata Power' },
  { symbol:'DMART', name:'Avenue Supermarts (DMart)' },
];

const TradingPanel = () => {
  const [indices,    setIndices]    = useState([]);
  const [tab,        setTab]        = useState('watchlist');
  const [watchlist,  setWatchlist]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('airis_watchlist') || 'null') || DEFAULT_WATCHLIST; } catch { return DEFAULT_WATCHLIST; }
  });
  const [wlPrices,   setWlPrices]   = useState({});
  const [movers,     setMovers]     = useState({ gainers:[], losers:[] });
  const [loadIdx,    setLoadIdx]    = useState(false);
  const [loadWl,     setLoadWl]     = useState(false);
  const [loadMov,    setLoadMov]    = useState(false);
  const [search,     setSearch]     = useState('');
  const [searchRes,  setSearchRes]  = useState([]);
  const [quote,      setQuote]      = useState(null);
  const [quoteLoad,  setQuoteLoad]  = useState(false);
  const [lastUpd,    setLastUpd]    = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const timerRef = useRef(null);

  const saveWatchlist = (list) => {
    setWatchlist(list);
    try { localStorage.setItem('airis_watchlist', JSON.stringify(list)); } catch {}
  };

  const addToWatchlist = (sym) => {
    if (!watchlist.includes(sym)) saveWatchlist([...watchlist, sym]);
  };
  const removeFromWatchlist = (sym) => saveWatchlist(watchlist.filter(s => s !== sym));

  const fetchIndices = async () => {
    setLoadIdx(true);
    try {
      const r = await api.getMarketIndices();
      if (r.success) { setIndices(r.indices || []); setLastUpd(new Date()); }
    } catch {}
    setLoadIdx(false);
  };

  const fetchWatchlistPrices = async (syms) => {
    if (!syms?.length) return;
    setLoadWl(true);
    try {
      const prices = {};
      await Promise.all(syms.map(async sym => {
        try {
          const r = await api.getMarketQuote(sym);
          if (r.success && r.quote) prices[sym] = r.quote;
        } catch {}
      }));
      setWlPrices(prev => ({ ...prev, ...prices }));
    } catch {}
    setLoadWl(false);
  };

  const fetchMovers = async () => {
    setLoadMov(true);
    try {
      const r = await api.getMarketMovers();
      if (r.success) setMovers({ gainers: r.gainers || [], losers: r.losers || [] });
    } catch {}
    setLoadMov(false);
  };

  const refreshAll = useCallback(async () => {
    await fetchIndices();
    await fetchWatchlistPrices(watchlist);
    if (tab === 'movers') fetchMovers();
  }, [watchlist, tab]);

  useEffect(() => {
    fetchIndices();
    fetchWatchlistPrices(watchlist);
    timerRef.current = setInterval(() => {
      fetchIndices();
      fetchWatchlistPrices(watchlist);
    }, 60000);
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (tab === 'movers' && movers.gainers.length === 0) fetchMovers();
    if (tab === 'watchlist') fetchWatchlistPrices(watchlist);
  }, [tab]);

  useEffect(() => {
    if (!search.trim()) { setSearchRes([]); return; }
    const timer = setTimeout(async () => {
      try {
        const r = await api.searchStocks(search.trim());
        if (r.success && r.results?.length > 0) {
          setSearchRes(r.results);
        } else {
          const q = search.toUpperCase();
          setSearchRes(NSE_POPULAR.filter(s =>
            s.symbol.includes(q) || s.name.toUpperCase().includes(q)
          ).slice(0, 8));
        }
      } catch {
        const q = search.toUpperCase();
        setSearchRes(NSE_POPULAR.filter(s =>
          s.symbol.includes(q) || s.name.toUpperCase().includes(q)
        ).slice(0, 8));
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [search]);

  const openQuote = async (sym) => {
    setQuote(null);
    setQuoteLoad(true);
    setShowSearch(false);
    setSearch('');
    try {
      const r = await api.getMarketQuote(sym);
      if (r.success) setQuote(r.quote);
    } catch {}
    setQuoteLoad(false);
  };

  const mainIdx = indices.find(i => i.symbol === '^NSEI');
  const sensex  = indices.find(i => i.symbol === '^BSESN');
  const bankNf  = indices.find(i => i.symbol === '^NSEBANK');
  const nfIT    = indices.find(i => i.symbol === '^CNXIT');
  const mid50   = indices.find(i => i.symbol === '^NSEMDCP50');

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

      {/* Header */}
      <div style={{ padding:'8px 12px 6px', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'6px' }}>
          <span style={{ fontSize:'10px', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.10em', color:'#aaa' }}>
            Live Markets
          </span>
          <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
            {lastUpd && (
              <span style={{ fontSize:'9px', color:'#ccc' }}>
                {lastUpd.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
              </span>
            )}
            <button onClick={refreshAll} disabled={loadIdx}
              style={{ background:'none', border:'none', color: loadIdx ? '#ccc' : '#bbb', cursor:'pointer', padding:'2px', display:'flex', alignItems:'center',
                transition:'transform 0.3s', transform: loadIdx ? 'rotate(360deg)' : 'none' }}>
              <FiRefreshCw size={11}/>
            </button>
          </div>
        </div>

        {/* Index grid — NIFTY + SENSEX */}
        <div style={{ display:'flex', gap:'5px', marginBottom:'4px' }}>
          <IndexChip idx={mainIdx} />
          <IndexChip idx={sensex} />
        </div>
        <div style={{ display:'flex', gap:'5px', marginBottom:'6px' }}>
          <IndexChip idx={bankNf} />
          <IndexChip idx={nfIT} />
        </div>
        {loadIdx && !indices.length && (
          <div style={{ fontSize:'10px', color:'#bbb', textAlign:'center', padding:'4px 0' }}>Fetching live data…</div>
        )}

        {/* Search */}
        <div style={{ position:'relative' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'#fff', border:`1px solid ${BORDER}`, borderRadius:'10px', padding:'7px 10px' }}>
            <FiSearch size={12} style={{ color:'#bbb', flexShrink:0 }}/>
            <input
              value={search}
              onChange={e=>{ setSearch(e.target.value); setShowSearch(true); }}
              onFocus={()=>setShowSearch(true)}
              placeholder="Search stocks, indices…"
              style={{ flex:1, border:'none', outline:'none', background:'transparent', fontSize:'12px', color:'#0C0C0C' }}
            />
            {search && (
              <button onClick={()=>{ setSearch(''); setSearchRes([]); setShowSearch(false); }}
                style={{ background:'none', border:'none', color:'#bbb', cursor:'pointer', padding:'0', display:'flex', alignItems:'center' }}>
                <FiX size={11}/>
              </button>
            )}
          </div>
          {/* Search dropdown */}
          {showSearch && searchRes.length > 0 && (
            <div style={{
              position:'absolute', top:'calc(100% + 4px)', left:0, right:0, zIndex:100,
              background:'#fff', border:`1px solid ${BORDER}`, borderRadius:'10px',
              boxShadow:'0 8px 24px rgba(0,0,0,0.1)', overflow:'hidden',
            }}>
              {searchRes.map(s => (
                <div key={s.symbol}
                  onClick={() => openQuote(s.symbol)}
                  style={{ padding:'8px 12px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between',
                    borderBottom:`1px solid ${BORDER}` }}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(67,125,253,0.04)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <div>
                    <div style={{ fontSize:'12px', fontWeight:'700', color:'#0C0C0C', fontFamily:'monospace' }}>{s.symbol}</div>
                    <div style={{ fontSize:'10px', color:'#999' }}>{s.name}</div>
                  </div>
                  <span style={{ fontSize:'9px', color:'#aaa', background:'rgba(67,125,253,0.08)', padding:'2px 6px', borderRadius:'4px', fontWeight:'600' }}>NSE</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quote Card */}
      {quoteLoad && (
        <div style={{ padding:'12px 16px', textAlign:'center', fontSize:'12px', color:'#bbb' }}>Fetching quote…</div>
      )}
      {quote && !quoteLoad && (
        <QuoteCard quote={quote} onClose={()=>setQuote(null)} />
      )}

      {/* Tab bar */}
      <div style={{ display:'flex', gap:'4px', padding:'4px 12px 6px', flexShrink:0 }}>
        {[['watchlist','Watchlist'],['gainers','Gainers'],['losers','Losers'],['indices','All Indices']].map(([k,label])=>(
          <button key={k} onClick={()=>setTab(k)} style={{
            flex:1, padding:'4px 2px', borderRadius:'20px', fontSize:'10px', fontWeight:'600', cursor:'pointer', border:'none',
            background: tab===k ? B : 'transparent',
            color: tab===k ? '#fff' : '#888',
            transition:'all 0.15s', whiteSpace:'nowrap',
          }}>{label}</button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex:1, overflowY:'auto' }}
        onClick={()=>{ if(showSearch && !search) setShowSearch(false); }}>

        {/* ─── Watchlist ─── */}
        {tab === 'watchlist' && (
          <>
            {loadWl && watchlist.length === 0
              ? <div style={{ padding:'16px', textAlign:'center', fontSize:'12px', color:'#bbb' }}>Loading watchlist…</div>
              : watchlist.length === 0
                ? <div style={{ padding:'16px', textAlign:'center', fontSize:'12px', color:'#bbb' }}>
                    Add stocks with the ★ button
                  </div>
                : watchlist.map(sym => {
                    const q = wlPrices[sym];
                    return (
                      <StockRow key={sym}
                        sym={sym}
                        name={q?.name}
                        price={q?.price}
                        change={q?.change}
                        change_pct={q?.change_pct}
                        inWatchlist={true}
                        onRemove={removeFromWatchlist}
                        onClick={()=>openQuote(sym)}
                      />
                    );
                  })
            }
            {loadWl && watchlist.length > 0 && (
              <div style={{ padding:'4px 16px', fontSize:'10px', color:'#ccc', textAlign:'center' }}>Updating prices…</div>
            )}
          </>
        )}

        {/* ─── Gainers ─── */}
        {tab === 'gainers' && (
          <>
            {loadMov && movers.gainers.length === 0
              ? <div style={{ padding:'16px', textAlign:'center', fontSize:'12px', color:'#bbb' }}>Fetching top gainers…</div>
              : movers.gainers.map(s => (
                  <StockRow key={s.symbol}
                    sym={s.symbol} price={s.price} change={s.change} change_pct={s.change_pct}
                    inWatchlist={watchlist.includes(s.symbol)}
                    onAdd={addToWatchlist} onRemove={removeFromWatchlist}
                    onClick={()=>openQuote(s.symbol)}
                  />
                ))
            }
          </>
        )}

        {/* ─── Losers ─── */}
        {tab === 'losers' && (
          <>
            {loadMov && movers.losers.length === 0
              ? <div style={{ padding:'16px', textAlign:'center', fontSize:'12px', color:'#bbb' }}>Fetching top losers…</div>
              : movers.losers.map(s => (
                  <StockRow key={s.symbol}
                    sym={s.symbol} price={s.price} change={s.change} change_pct={s.change_pct}
                    inWatchlist={watchlist.includes(s.symbol)}
                    onAdd={addToWatchlist} onRemove={removeFromWatchlist}
                    onClick={()=>openQuote(s.symbol)}
                  />
                ))
            }
          </>
        )}

        {/* ─── All Indices ─── */}
        {tab === 'indices' && (
          <>
            {loadIdx && indices.length === 0
              ? <div style={{ padding:'16px', textAlign:'center', fontSize:'12px', color:'#bbb' }}>Fetching indices…</div>
              : indices.map(idx => {
                  const up = idx.change_pct >= 0;
                  return (
                    <div key={idx.symbol} style={{
                      padding:'9px 14px', display:'flex', alignItems:'center', justifyContent:'space-between',
                      borderBottom:`1px solid ${BORDER}`,
                    }}>
                      <div>
                        <div style={{ fontSize:'11px', fontWeight:'700', color:'#0C0C0C' }}>{idx.name}</div>
                        <div style={{ fontSize:'9px', color:'#bbb', fontFamily:'monospace' }}>{idx.symbol}</div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontSize:'12px', fontWeight:'700', fontFamily:'monospace', color:'#0C0C0C' }}>
                          {idx.price ? idx.price.toLocaleString('en-IN', {maximumFractionDigits:0}) : '—'}
                        </div>
                        <div style={{ fontSize:'10px', color: clr(idx.change_pct), fontWeight:'600', display:'flex', alignItems:'center', justifyContent:'flex-end', gap:'2px' }}>
                          {up ? <FiArrowUpRight size={9}/> : <FiArrowDownRight size={9}/>}
                          {fmtP(idx.change_pct)}
                        </div>
                      </div>
                    </div>
                  );
                })
            }
          </>
        )}

        {/* Popular suggestions for empty watchlist */}
        {tab === 'watchlist' && watchlist.length < 5 && (
          <div style={{ padding:'8px 12px 4px' }}>
            <div style={{ fontSize:'9px', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.1em', color:'#ccc', marginBottom:'6px' }}>
              Popular Stocks
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
              {NSE_POPULAR.filter(s => !watchlist.includes(s.symbol)).slice(0, 10).map(s => (
                <button key={s.symbol}
                  onClick={() => { addToWatchlist(s.symbol); fetchWatchlistPrices([s.symbol]); }}
                  style={{
                    padding:'3px 8px', borderRadius:'20px', fontSize:'10px', fontWeight:'600',
                    background:'rgba(67,125,253,0.07)', border:'1px solid rgba(67,125,253,0.15)',
                    color: B, cursor:'pointer',
                  }}>
                  + {s.symbol}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SkillsPanel = ({ caps }) => {
  const categories = [...new Set(caps.map(c=>c.category))];
  return (
    <div style={{ flex:1, overflowY:'auto', minHeight:0 }}>
      {categories.map(cat=>(
        <div key={cat}>
          <SectionHdr title={cat}/>
          {caps.filter(c=>c.category===cat).map(c=>(
            <div key={c.id} style={{ padding:'8px 16px', borderBottom:`1px solid ${BORDER}` }}>
              <div style={{ fontSize:'13px', color:'#0C0C0C', display:'flex', alignItems:'center', gap:'8px' }}>
                <span style={{ fontSize:'16px' }}>{c.icon}</span><span style={{ fontWeight:'500' }}>{c.name}</span>
              </div>
              <div style={{ fontSize:'11px', color:'#aaa', marginTop:'2px' }}>{c.desc}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const AnalyticsPanel = ({ data }) => {
  const metrics = [
    { label:'Total interactions',  value: data?.interactions??0 },
    { label:'Commands run',        value: data?.total_executions??0 },
    { label:'Success rate',        value: data?.success_rate??'—' },
    { label:'Strategies learned',  value: data?.strategies_learned??0 },
    { label:'Patterns detected',   value: data?.patterns_detected??0 },
    { label:'Session messages',    value: data?.history_count??0 },
  ];
  return (
    <div style={{ flex:1, overflowY:'auto', minHeight:0 }}>
      <SectionHdr title="This Session" onRefresh={()=>{}}/>
      <div style={{ padding:'8px 16px 4px' }}>
        {metrics.map(m=>(
          <div key={m.label} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:`1px solid ${BORDER}` }}>
            <span style={{ fontSize:'12px', color:'#777' }}>{m.label}</span>
            <span style={{ fontSize:'12px', color:B, fontFamily:'monospace', fontWeight:'600' }}>{m.value}</span>
          </div>
        ))}
      </div>
      <SectionHdr title="Status"/>
      <div style={{ padding:'8px 16px' }}>
        {[
          { ok:true,  label:'12-Layer AI Brain active' },
          { ok:true,  label:'Adaptive memory running' },
          { ok:false, label:'Voice cloning (needs Fish Audio key)' },
          { ok:false, label:'Wake word (desktop only)' },
          { ok:true,  label:'Browser voice input ready' },
        ].map((s,i)=>(
          <div key={i} style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
            {s.ok ? <FiCheckCircle size={13} style={{ color:'#00C48C', flexShrink:0 }}/>
                  : <FiAlertTriangle size={13} style={{ color:'#FF8C42', flexShrink:0 }}/>}
            <span style={{ fontSize:'12px', color: s.ok?'#0C0C0C':'#aaa' }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const BrainPanel = ({ layers }) => (
  <div style={{ flex:1, overflowY:'auto', minHeight:0 }}>
    <SectionHdr title="12-Layer AI Pipeline"/>
    {(layers.length ? layers : Array.from({length:12},(_,i)=>({n:i+1,name:`Layer ${i+1}`,desc:''}))).map(l=>(
      <div key={l.n} style={{ padding:'8px 16px', borderBottom:`1px solid ${BORDER}`, display:'flex', gap:'10px', alignItems:'flex-start' }}>
        <div style={{ minWidth:'24px', height:'24px', borderRadius:'6px', background:'rgba(67,125,253,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', color:B, fontFamily:'monospace', fontWeight:'700', flexShrink:0, marginTop:'1px' }}>
          {String(l.n).padStart(2,'0')}
        </div>
        <div>
          <div style={{ fontSize:'12px', color:'#0C0C0C', fontWeight:'500' }}>{l.name}</div>
          <div style={{ fontSize:'11px', color:'#aaa', marginTop:'1px' }}>{l.desc}</div>
        </div>
      </div>
    ))}
    <div style={{ padding:'12px 16px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 12px', background:'rgba(0,196,140,0.06)', border:'1px solid rgba(0,196,140,0.2)', borderRadius:'8px' }}>
        <FiActivity size={13} style={{ color:'#00C48C' }}/>
        <span style={{ fontSize:'11px', color:'#00C48C', fontWeight:'500' }}>All layers active — Multi-Agent mode enabled</span>
      </div>
    </div>
  </div>
);

const Sidebar = ({ activePanel, isOpen, isMobile, onClose }) => {
  const [history,   setHistory]   = useState([]);
  const [reminders, setReminders] = useState([]);
  const [memStats,  setMemStats]  = useState({});
  const [caps,      setCaps]      = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [layers,    setLayers]    = useState([]);

  useEffect(() => {
    const load = async () => {
      try { const r = await api.getHistory();      setHistory(r.history||[]);      } catch {}
      try { const r = await api.getReminders();    setReminders(r.reminders||[]);  } catch {}
      try { const r = await api.getMemoryStats();  setMemStats(r.stats||{});       } catch {}
      try { const r = await api.getCapabilities(); setCaps(r.capabilities||[]);    } catch {}
      try { const r = await api.getAnalytics();    setAnalytics(r.analytics||{});  } catch {}
      try { const r = await api.getSystemLayers(); setLayers(r.layers||[]);        } catch {}
    };
    load();
  }, []);

  const refreshReminders = async () => {
    try { const r = await api.getReminders(); setReminders(r.reminders||[]); } catch {}
  };

  if (!isOpen) return null;

  const config    = TITLES[activePanel]||TITLES.chat;
  const TitleIcon = config.icon;

  const panelContent = (
    <>
      <div style={{ height:'52px', display:'flex', alignItems:'center', gap:'8px', padding:'0 16px', borderBottom:`1px solid ${BORDER}`, flexShrink:0, justifyContent:'space-between', background:'#fff' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <div style={{ width:'28px', height:'28px', borderRadius:'8px', background:'rgba(67,125,253,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <TitleIcon size={14} style={{ color:B }}/>
          </div>
          <span style={{ fontSize:'13px', fontWeight:'600', color:'#0C0C0C' }}>
            {config.label}
          </span>
        </div>
        {isMobile && (
          <button onClick={onClose} style={{ display:'flex', alignItems:'center', justifyContent:'center', width:'28px', height:'28px', borderRadius:'8px', background:'rgba(0,0,0,0.04)', border:`1px solid ${BORDER}`, color:'#aaa', cursor:'pointer' }}>
            <FiX size={14}/>
          </button>
        )}
      </div>
      {activePanel==='chat'      && <ChatPanel history={history}/>}
      {activePanel==='memory'    && <MemoryPanel stats={memStats}/>}
      {activePanel==='trading'   && <TradingPanel/>}
      {activePanel==='reminders' && <RemindersPanel reminders={reminders} onRefresh={refreshReminders}/>}
      {activePanel==='skills'    && <SkillsPanel caps={caps}/>}
      {activePanel==='analytics' && <AnalyticsPanel data={analytics}/>}
      {activePanel==='brain'     && <BrainPanel layers={layers}/>}
    </>
  );

  if (isMobile) {
    return (
      <>
        <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:40, backgroundColor:'rgba(0,0,0,0.25)', backdropFilter:'blur(4px)' }}/>
        <div style={{
          position:'fixed', top:0, left:0, bottom:0, zIndex:50,
          width:'min(85vw,300px)', background:'#F8F7F5',
          borderRight:`1px solid ${BORDER}`, display:'flex', flexDirection:'column',
          overflow:'hidden', animation:'slideInLeft 0.22s ease-out',
          boxShadow:'8px 0 32px rgba(0,0,0,0.1)',
        }}>
          {panelContent}
        </div>
      </>
    );
  }

  return (
    <div style={{ width:'240px', flexShrink:0, background:'#F8F7F5', borderRight:`1px solid ${BORDER}`, display:'flex', flexDirection:'column', overflow:'hidden', minHeight:0 }}>
      {panelContent}
    </div>
  );
};

export default Sidebar;
