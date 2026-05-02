const LS_WATCHLIST = 'airis_tp_watchlist';
const LS_PORTFOLIO = 'airis_tp_portfolio';
const uid = () => Math.random().toString(36).slice(2, 10);

export function parseActions(text) {
  const actions = [];
  const cleanText = text
    .replace(/\[ACTION:([^\]]+)\]/g, (_, raw) => {
      const firstColon = raw.indexOf(':');
      const type  = firstColon >= 0 ? raw.slice(0, firstColon).trim() : raw.trim();
      const param = firstColon >= 0 ? raw.slice(firstColon + 1).trim() : '';
      if (type) actions.push({ type, param });
      return '';
    })
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return { cleanText, actions };
}

export function executeActions(actions, ctx) {
  const { navigate, setActivePanel, setSidebarOpen, setVibeInitialPrompt } = ctx;
  for (const { type, param } of actions) {
    try {
      switch (type) {

        case 'navigate':
          if (param) navigate(param);
          break;

        case 'open_panel': {
          const FULL_PANELS = ['settings', 'vibe', 'canvas'];
          setActivePanel(param);
          setSidebarOpen(!FULL_PANELS.includes(param));
          break;
        }

        case 'vibe_prompt':
          if (setVibeInitialPrompt) {
            setVibeInitialPrompt(param);
            setActivePanel('vibe');
            setSidebarOpen(false);
          }
          break;

        case 'add_watchlist': {
          const sym = param.toUpperCase().includes('.') ? param.toUpperCase() : param.toUpperCase() + '.NS';
          const list = JSON.parse(localStorage.getItem(LS_WATCHLIST) || '[]');
          if (!list.find(w => w.symbol === sym)) {
            list.push({ id: uid(), symbol: sym, name: sym.replace('.NS', ''), addedAt: new Date().toISOString() });
            localStorage.setItem(LS_WATCHLIST, JSON.stringify(list));
            window.dispatchEvent(new CustomEvent('airis_watchlist_updated', { detail: { watchlist: list } }));
          }
          break;
        }

        case 'remove_watchlist': {
          const sym = param.toUpperCase().includes('.') ? param.toUpperCase() : param.toUpperCase() + '.NS';
          const list = JSON.parse(localStorage.getItem(LS_WATCHLIST) || '[]').filter(w => w.symbol !== sym);
          localStorage.setItem(LS_WATCHLIST, JSON.stringify(list));
          window.dispatchEvent(new CustomEvent('airis_watchlist_updated', { detail: { watchlist: list } }));
          break;
        }

        case 'add_portfolio': {
          const parts = param.split(':');
          const symRaw = (parts[0] || '').toUpperCase();
          const sym    = symRaw.includes('.') ? symRaw : symRaw + '.NS';
          const qty    = parseFloat(parts[1]) || 1;
          const price  = parseFloat(parts[2]) || 0;
          const list   = JSON.parse(localStorage.getItem(LS_PORTFOLIO) || '[]');
          const idx    = list.findIndex(p => p.symbol === sym);
          if (idx >= 0 && price > 0) {
            const o = list[idx];
            const tQty = o.qty + qty;
            list[idx] = { ...o, qty: tQty, buyPrice: Math.round(((o.qty * o.buyPrice + qty * price) / tQty) * 100) / 100 };
          } else {
            list.push({ id: uid(), symbol: sym, qty, buyPrice: price, addedAt: new Date().toISOString() });
          }
          localStorage.setItem(LS_PORTFOLIO, JSON.stringify(list));
          window.dispatchEvent(new CustomEvent('airis_portfolio_updated', { detail: { portfolio: list } }));
          break;
        }

        default:
          break;
      }
    } catch (e) {
      console.warn('[Airis Action]', type, param, e);
    }
  }
}

export function getAppState(activePanel, route) {
  try {
    const watchlist = JSON.parse(localStorage.getItem(LS_WATCHLIST) || '[]')
      .map(w => w.symbol?.replace('.NS', '')).join(', ') || 'empty';
    const portfolio = JSON.parse(localStorage.getItem(LS_PORTFOLIO) || '[]')
      .map(p => `${p.symbol?.replace('.NS', '')}(${p.qty}@₹${p.buyPrice})`).join(', ') || 'empty';
    const path = route || window.location.pathname;
    return `[App Context] Page: ${path} | Panel: ${activePanel} | Watchlist: ${watchlist} | Portfolio: ${portfolio}`;
  } catch { return ''; }
}
