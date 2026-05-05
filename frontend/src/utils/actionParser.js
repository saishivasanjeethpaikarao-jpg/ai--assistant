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

        case 'browse':
        case 'search': {
          const q = (param || '').trim();
          if (q) window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, '_blank', 'noopener,noreferrer');
          break;
        }

        case 'open_url': {
          const url = (param || '').trim();
          if (url) window.open(url.startsWith('http') ? url : `https://${url}`, '_blank', 'noopener,noreferrer');
          break;
        }

        case 'open_app': {
          const app = (param || '').trim().toLowerCase();
          if (!app) break;

          // Try Tauri shell first (desktop)
          if (typeof window !== 'undefined' && window.__TAURI__) {
            try {
              const { Command } = window.__TAURI__.shell;
              const map = {
                chrome:       ['cmd', ['/c', 'start', 'chrome']],
                'google chrome': ['cmd', ['/c', 'start', 'chrome']],
                vscode:       ['cmd', ['/c', 'start', 'code']],
                'vs code':    ['cmd', ['/c', 'start', 'code']],
                'visual studio code': ['cmd', ['/c', 'start', 'code']],
                notepad:      ['cmd', ['/c', 'start', 'notepad']],
                explorer:     ['cmd', ['/c', 'start', 'explorer']],
                terminal:     ['cmd', ['/c', 'start', 'cmd']],
                powershell:   ['cmd', ['/c', 'start', 'powershell']],
                calculator:   ['cmd', ['/c', 'start', 'calc']],
                calc:         ['cmd', ['/c', 'start', 'calc']],
                edge:         ['cmd', ['/c', 'start', 'msedge']],
                firefox:      ['cmd', ['/c', 'start', 'firefox']],
              };
              const target = map[app];
              if (target) {
                new Command(target[0], target[1]).execute();
              }
              break;
            } catch (e) {
              console.warn('Tauri shell open_app failed:', e);
            }
          }

          // Fallback: open URLs in browser
          const urlMap = {
            chrome: 'https://www.google.com/chrome/',
            'google chrome': 'https://www.google.com/chrome/',
            vscode: 'https://code.visualstudio.com/',
            'vs code': 'https://code.visualstudio.com/',
            'visual studio code': 'https://code.visualstudio.com/',
            explorer: 'file:///',
          };
          const target = urlMap[app];
          if (target) window.open(target.startsWith('file') ? target : `https://${target.replace(/^https?:\/\//, '')}`, '_blank', 'noopener,noreferrer');
          break;
        }

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
