# Airis AI Assistant — Repository Audit & Phased Roadmap

> Status: **Roadmap approved; no code changes made yet.** Each phase requires explicit approval before execution.
> Source: 4 parallel deep audits (structure, backend, frontend, git/CI). 334 tracked files, 159 commits, 8 git authors.

---

## Locked-in decisions

| Decision | Choice |
|---|---|
| Backend stack | **Migrate to FastAPI** (promote `api_server_minimal.py` as the canonical server) |
| Desktop | **Tauri 2** (delete `frontend/src-tauri/`, fix `src-tauri/`) |
| Old JARVIS / KivyMD | **Keep as `legacy/`** for incremental porting; not in builds |
| Self-improve | **Opt-in experimental** (force `SELF_IMPROVE_AUTO_APPLY=False`, gate behind flag) |
| Plan granularity | **Detailed task list per phase** (this document is the phase summary; detailed task lists live in PR descriptions and inline in chat) |
| Roadmap storage | This file: `ROADMAP.md` |

---

## Cross-cutting snapshot

`ai--assistant` is a 159-commit, 12-layer AI personal assistant. It is **functional in dev** and **not production-grade**.

**Strengths:** solid orchestrator design, real voice stack (STT/TTS with Fish Audio + ElevenLabs + Web Speech fallback), multi-provider LLM router (Groq/OpenAI/Anthropic/Ollama), adaptive memory, polished React UI (dark theme, glass-morphism, VS Code-style 3-pane shell, command palette, mobile responsive), Firebase auth + guest mode, real Indian-market trading features (NSE/BSE symbols, options strategies, watchlist, alerts), 159 commits of consistent iteration.

**Weaknesses:** 4 overlapping HTTP servers, 2 conflicting Tauri setups, broken deploy configs (Dockerfile, Render, Netlify), fake-green CI (`test-quality.yml` runs a non-existent path with `continue-on-error: true`), leaked Firebase key, XSS-grade sandbox escape in VibeCoder iframe, command injection in PowerShell path, and a Frankensteined README that documents two different apps.

---

# Phase 1 — Security

**Status: APPROVED — pending detailed task approval.**

## Goals
Eliminate the 11 critical exposures. No feature work; only defense.

## Findings (execution order)

1. **VibeCoder iframe sandbox escape** — `frontend/src/components/VibeCoder.jsx:849-852`
2. **VibeCoder LLM-code sandbox** — `backend/vibe_coder.py:506-555`
3. **PowerShell command injection — `tools/verifier.py:14-15`**
4. **PowerShell blocklist bypass — `tools/powershell.py:13-23`**
5. **Unauthenticated shutdown — `tools/system_control.py:20,26,41,47`** + `orchestrator_v2.py:354-358`
6. **`PENDING_CONFIRMATION` no TTL — `assistant_core.py:1101-1118, 1565-1576`**
7. **Hardcoded Firebase Web API key — `frontend/src/firebase.js:5-10`**
8. **Dashboard auth downgrade — `backend/dashboard_api.py:992-1017`**
9. **WebSocket server has no auth — `backend/ws_server.py:32-95`**
10. **CORS in 3 places with 3 different policies** (`main.py:10-13`, `api_server_minimal.py:21`, `app_enhanced.py:25`, `dashboard_api.py:380-403`)
11. **Hardcoded cleartext-HTTP trading backend — `backend/trading/indian_stock_api.py:16`**
12. **`taskkill` wildcard — `backend/tools/app_launcher.py:101`**
13. **`audioop` removed in Python 3.13 — `backend/assistant_core.py:7-10, 1023`**
14. **`SELF_IMPROVE_AUTO_APPLY` default — `backend/assistant_core.py:169`** (forced to `False`; opt-in)

## Risks
- Removing `allow-same-origin` from the VibeCoder iframe may break legitimate code that needs to read its own origin. Mitigation: provide a `airisVibe.projectStorage` API injected by the parent.
- Tightening the PowerShell allowlist will break "creative" shell commands. Mitigation: keep a `system.run_powershell(..., allow_extended=True)` escape hatch gated by `confirm=True`.
- Rotating the Firebase key requires a coordinated deploy.

## Benefits
All 11 critical items closed; no API key, shell, or PENDING_CONFIRMATION exposure path left. Wake-word works on Python 3.13. Sandbox escape closed; no API key exfil from the iframe.

## Effort
≈ 1–2 days, mostly local changes. Can be one PR.

## Verification
- Hostile-input test suite (10 PowerShell injection vectors, 5 VibeCoder iframe attacks, 4 taskkill patterns).
- `curl -H 'Authorization: Bearer invalid' …` returns 401.
- `python -c "import os; os.system('echo $GROQ_API_KEY')"` from inside the VibeCoder sandbox returns empty.
- `python -c "from backend import audioop_compat"` works on 3.13.

---

# Phase 2 — Architecture cleanup

**Status: detailed plan pending.**

## Goals
One canonical HTTP server. One canonical orchestrator. One canonical Tauri config. Identify and quarantine dead code. Move legacy JARVIS/KivyMD into `legacy/`.

## Findings

### 2.1 Four parallel HTTP servers
| File | Stack | Port | Real? |
|---|---|---|---|
| `backend/dashboard_api.py` (1586 lines, stdlib `http.server`) | stdlib | 8000 (hardcoded line 1582) | **Wired to Procfile / render.yaml** |
| `backend/api_server.py` (FastAPI) | FastAPI | uvicorn | Dead |
| `backend/api_server_minimal.py` (FastAPI, narrow CORS, sqlite settings) | FastAPI | uvicorn | **Canonical candidate** |
| `backend/main.py` (FastAPI, 48 lines, settings-only) | FastAPI | uvicorn | Dead |
| `backend/main_legacy.py` (CLI REPL) | stdlib | n/a | Dead |
| `backend/app.py` (KivyMD stub) | KivyMD | n/a | Dead (KivyMD not in requirements.txt) |
| `backend/app_enhanced.py` (Flask, trading) | Flask | 5000 | **Broken** (imports non-existent `src.enhanced_stock_api`) |
| `backend/assistant.py` (CLI/tkinter) | stdlib | n/a | Dead |
| `backend/setup.py` (different project `trading-system` v1.0.0) | setuptools | n/a | Dead |

### 2.2 Two parallel orchestrators
- `backend/system_coordinator.py` (currently imported by `dashboard_api.py`)
- `backend/orchestrator_v2.py` (`SmartOrchestrator`)
- `backend/core/orchestrator.py` (`AirisOrchestrator`) — **target**
- `backend/brain/brain.py` (placeholder `learn_text: pass` at line 97-98; not referenced by active server)

### 2.3 Two Tauri setups
- `src-tauri/` (Tauri 2) — used by `build-and-release.yml` — **keep**
- `frontend/src-tauri/` (Tauri 1.5) — used by `build-desktop.yml` — **delete**

### 2.4 Dead code inventory

| Path | Status | Action |
|---|---|---|
| `artifacts/mockup-sandbox/` (73 Replit files) | Tracked, ~12 MB | Delete (move to `legacy/_replit_sandbox/` if needed) |
| `attached_assets/` (12 Replit screenshots) | Tracked, ~3 MB | Delete |
| `installer/` (10 files, Wix/ISS) | Unused | Move to `legacy/installer/` |
| `web-deploy/` (6 files + 2 logs) | Old PWA | Move to `legacy/web-pwa-v1/` |
| `netlify/functions/chat.js` | Old Netlify function | Delete |
| `trading/` at root (4 files) | Parallel to `backend/trading/` | Delete root copy |
| `backend/setup.py` | Different project | Delete |
| `backend/api_server.py`, `api_server_minimal.py`, `main.py`, `main_legacy.py`, `app.py`, `app_enhanced.py`, `assistant.py`, `assistant_core.py` | Old JARVIS / parallel impls | Move to `legacy/backend_v1/` |
| `mobile-app/` (10 files, no `App.js`) | Half-wired Expo stub | Move to `legacy/mobile-app-expo-stub/` |
| `backend/brain/brain.py` | Unreferenced | Delete after porting any unique facts |
| `frontend/src/components/AirisLogo.jsx` | Byte-identical to `JarvisLogo.jsx` | Delete |
| `frontend/manifest.json` (root), `frontend/sw.js`, `frontend/script.js`, `frontend/style.css`, `frontend/jarvis-ui.js`, `frontend/api-client.js` | Orphans from CRA era | Delete |
| `frontend/Dockerfile` (root) | Wrong env var, Node 18 EOL | Delete (handled in Phase 5) |
| `frontend/netlify.toml` (root) | Misconfigured (CRA command) | Replace (Phase 5) |
| `.github_workflows_tests.yml` (root) | Not a real workflow | Delete |
| `web-deploy/netlify.toml` (old PWA config) | Conflicts with root one | Delete with `web-deploy/` |
| `frontend/src/pages/Watchlist.jsx`, `StockDetail.jsx`, `Alerts.jsx`, `Trading.jsx` | "Coming soon" stubs | Delete or implement (Phase 4) |
| Duplicate `api_vibe_code` route | `dashboard_api.py:827,845` | De-dupe |
| Duplicate `refresh_providers` | `ai_switcher.py:151,160` | De-dupe |
| Unused `BLOCKED` constant | `system_prompt_config.py:138` | Delete |
| Hardcoded absolute Windows paths | `backend/tools/app_launcher.py:23-24` | Replace with `pathlib.Path.home()` joins |

### 2.5 `legacy/` layout

```
legacy/
  backend_v1/                 # assistant.py, assistant_core.py, main_legacy.py, app.py, app_enhanced.py, main.py, api_server.py, api_server_minimal.py, setup.py
  web-pwa-v1/                 # web-deploy/
  installer/                  # installer/
  mobile-app-expo-stub/       # mobile-app/
  replit_sandbox/             # artifacts/mockup-sandbox/ (optional)
  README.md                   # explain what each folder is, and the "do not import" rule
```

Add `legacy/**` exclusions to Vite, Tailwind, ESLint, Docker, Netlify, and GitHub Actions so it's never built but is still findable in git history.

## Risks
- Migrating `dashboard_api.py` to FastAPI breaks every importer. Mitigation: route-by-route with a `legacy_compat=False` toggle; run both in parallel for one release.
- Removing `frontend/src-tauri/` breaks `frontend/.github/workflows/build-desktop.yml`. Mitigation: delete the workflow in the same PR.
- `legacy/` may bloat IDE search. Mitigation: add path-excludes to language servers and CI.

## Benefits
- One backend to maintain. ~3,000 lines of stdlib `http.server` → ~1,200 lines of FastAPI routers.
- One orchestrator. ~1,500 lines of overlapping code deleted.
- One Tauri. One README. One startup story.
- `legacy/` is the source of truth for "what we used to do" without polluting the build.

## Effort
≈ 2–3 days, careful. One large PR or three small ones (legacy-move, FastAPI-migration, de-duplication).

## Verification
- `git grep -nE "from backend\.(assistant|app_enhanced|main_legacy|main|api_server)" backend frontend tests` returns empty.
- `git grep -nE "src-tauri" .` shows only `src-tauri/` (not `frontend/src-tauri/`).
- `git ls-files | grep -E "^legacy/" | wc -l` equals the count of files moved.
- `npm run build` and `cargo tauri build` both succeed with `legacy/` present.
- `pytest tests/ -q` is green.

---

# Phase 3 — Runtime, context, intent, tool verification, reliability

**Status: detailed plan pending.**

## Goals
Stable memory, correct conversation context, sensible intent routing, verified tool execution, predictable behavior under failure.

## Findings

### 3.1 Memory & state
- `request_history` is a module-level list shared by all clients (`backend/dashboard_api.py:18-19, 436-443`). No per-user partition, no persistence, no lock, lost on restart.
- `_market_cache` is unbounded; OOM surface if a route keys on user input (`backend/dashboard_api.py:22-33`).
- `brain/brain.py:13-22` opens a fresh `sqlite3.connect` per call, no WAL, no `check_same_thread=False`.
- `memory/store.py`, `memory/reminders.py`, `memory/adaptive_memory.py` are JSON files; no atomic rename; corruption on power loss is plausible.
- `SELF_IMPROVE_AUTO_APPLY` defaults `True` (`assistant_core.py:169`). Per decision, force `False`; add `SELF_IMPROVE_ALLOW=1` env gate.

### 3.2 Conversation context
- `frontend/src/App.jsx:172-186` — chat restore is broken (empty `forEach` body). Refresh wipes history.
- `frontend/src/services/api.js:200,221` — `/history` POSTed twice per turn.
- `backend/api_server_minimal.py:141,177` — `messages: list = []` Pydantic model accepts any shape; no role/length validation.
- Assistant mode `CHAT` returns a freeform string; if the LLM emits a `[ACTION:...]` token, the parser runs but the response history doesn't capture that the action was taken.

### 3.3 Intent routing
- `backend/mode_router.py` does keyword/heuristic classification.
- `backend/orchestrator_v2.py` and `backend/system_coordinator.py` both have `intent_detector` layers.
- No telemetry on which intents the user actually sends.

### 3.4 Tool execution verification
- `tools/verifier.py:36-51` — `verify_url_opened` always returns `True`. `verify_command_success` checks `tool_result.success` but not the underlying system state.
- `core/executor.py:50-53` — `subprocess.run(...)` captures unbounded output.
- `tools/powershell.py` blocklist is bypassable.
- `vibe_coder.py` runs untrusted code with full env.

### 3.5 Assistant reliability
- ~600 bare `except:` clauses swallow errors silently.
- 130+ `print()`s instead of `logging`.
- `audioop` silently returns 0 on 3.13.
- `PENDING_CONFIRMATION` has no TTL.
- `assistant_core.py:1135-1155` has 70+ `elif` branches with subtle precedence issues.
- `firebase_admin` is referenced in a comment and a PyInstaller hidden-import but never actually imported.
- 90+ naive `datetime.now()` calls.
- 5 overlapping HTTP servers.
- `_extract_user_id` silently downgrades invalid tokens to "guest".

## Risks
- Migrating to SQLite + per-user tables is a data-model change. Mitigation: dual-write during the transition, read-prefer-old.
- Logging migration will surface bugs that have been hidden for months. Mitigation: ship a `LOG_LEVEL=DEBUG` toggle, not all at once.
- Replacing 70 elif branches with a table changes ordering semantics. Mitigation: keep the precedence order explicit in the table, add tests for each.

## Benefits
- Stable, queryable memory.
- Conversation context survives refresh and is typed.
- Intent routing is observable and tunable.
- Every tool call has a verifier chain; the user can trust "Done."
- Timezone-correct across the codebase.
- Logging is structured, not print-soup.

## Effort
≈ 3–4 days.

## Verification
- `pytest tests/test_memory.py` — 100 concurrent `remember_fact` calls, no race.
- `pytest tests/test_conversation.py` — refresh round-trips messages.
- `pytest tests/test_intent.py` — 50 hand-labeled inputs classify correctly.
- `pytest tests/test_tools.py` — every tool returns `verifier_state='verified'` on success, `'failed'` on `Stop-Computer`, `'unverifiable'` on PowerShell with no `-ErrorAction`.
- `python -c "import logging; logging.basicConfig(level='INFO'); from backend import assistant_core"` shows structured logs, not print-soup.

---

# Phase 4 — UI/UX redesign & Tauri migration assessment

**Status: detailed plan pending.**

## Goals
A consistent, accessible, cross-platform UI. Tauri 2 as the primary desktop shell. Voice interaction that feels natural.

## Findings (frontend UX)

| # | Where | Issue | Priority |
|---|---|---|---|
| 1 | `frontend/src/App.jsx:172-186` | Chat history restore is broken (empty `forEach`) | P1 |
| 2 | `frontend/src/components/VibeCoder.jsx:849-852` | iframe sandbox escape | P0 (Phase 1) |
| 3 | `frontend/src/App.jsx:191` | "New Chat" does `window.location.reload()` | P2 |
| 4 | `frontend/src/components/ChatInterface.jsx:14` | `alert()` for unsupported voice | P2 |
| 5 | `frontend/src/utils/actionParser.js:73` | Tauri `openApp` errors only `console.warn` | P2 |
| 6 | `frontend/src/utils/actionParser.js:107,118,128` | AI watchlist/portfolio actions hardcode `.NS` suffix | P1 |
| 7 | `frontend/src/services/api.js:128,131,144,151,453,610,624,633,642,651,660` | Empty `catch {}` blocks | P2 |
| 8 | `frontend/src/store/useStore.js` | Toast IDs use `Date.now()` → collisions | P3 |
| 9 | `frontend/src/pages/TradingPage.jsx:1534,1559` | Polling continues when tab is hidden | P2 |
| 10 | `frontend/src/App.jsx:149-151` | Re-fetches provider status on every message | P3 |
| 11 | `frontend/src/services/api.js:200,221` | `/history` POSTed twice per turn | P2 |
| 12 | `frontend/src/pages/LandingPage.jsx:528-537` | Footer links all dead | P3 |
| 13 | `frontend/src/pages/Settings.jsx:796` | `LanguageTab` references languages with no i18n | P3 |
| 14 | `frontend/src/contexts/AuthContext.jsx:153` | Stale "Replit GOOGLE_API_KEY" error | P2 |
| 15 | `frontend/src/components/Settings.jsx` | No "Security" subsection explaining localStorage API key storage | P2 |
| 16 | `index.html:7,8,10,11` | Duplicate `<meta name="theme-color">` and `<link rel="manifest">` | P3 |
| 17 | `index.html` | No `<noscript>` fallback, no `og:*`/`twitter:*` meta | P3 |
| 18 | `frontend/public/manifest.json:11-17` | PWA icons missing; existing icon is a decorative orb | P2 |
| 19 | `index.html` | No `favicon.ico`, no `apple-touch-icon.png` | P3 |
| 20 | All `*.jsx` | Heavy `onMouseEnter`/`onMouseLeave` inline styles, no `:focus-visible` | P2 |
| 21 | All `*.jsx` | No `aria-label` on icon-only buttons | P2 |
| 22 | All `*.jsx` | No skip-to-content link, no focus trap in modals | P2 |
| 23 | `frontend/vite.config.js:14-16` | Dev server binds 0.0.0.0 with `allowedHosts: true` | P1 |
| 24 | `frontend/netlify.toml:8` + `Dockerfile:21` | `REACT_APP_API_URL` (CRA) used; Vite reads `VITE_API_URL` | P0 (Phase 5) |
| 25 | `frontend/components/*` | `AirisLogo.jsx` is byte-identical to `JarvisLogo.jsx` | P3 |
| 26 | `frontend/pages/Watchlist.jsx`, `StockDetail.jsx`, `Alerts.jsx`, `Trading.jsx` | "Coming soon" stubs | P3 |

### Voice interaction UX
- Wake-word: web Speech API only on Chrome/Edge. No fallback for Firefox/Safari. Add a settings toggle for "Push to talk (spacebar)."
- Mic permission denial path uses `alert()`.
- No partial transcript display.
- `CloudBackground` WebGL shader may degrade mobile battery; add a `prefers-reduced-motion` + low-power query.

### Design system
- 4 themes (`default`, `light`, `darker`, `jarvis`) — no theme picker in the UI.
- Typography: Inter only; no serif fallback for long-form content.
- 9 hand-rolled SVG icons in `ChatInterface.jsx`; the rest uses `react-icons/fi`. Consolidate.
- Glass-morphism can stutter on low-end Android. Provide a `prefers-reduced-transparency` fallback.

## Risks
- Tauri 2 migration is non-trivial. Mitigation: `t2` branch, keep `main` building with Tauri 1.5 until green.
- Touching the chat history bug also touches Phase 3 memory; do Phase 3 first.
- Accessibility retrofits are wide-touch; budget extra time for keyboard nav testing.

## Benefits
- Cross-platform desktop (Windows/macOS/Linux) via Tauri 2.
- Chat works across refresh; voice errors are toasts, not alerts.
- Accessible (keyboard, screen reader, reduced motion).
- Watchlist/portfolio work for US stocks too.
- Tauri errors are visible, not silent.
- Performance: tab-hidden polling stops; toast IDs don't collide.

## Effort
≈ 3–4 days (P1+P2) plus 2 days (P3) = 5–6 days.

## Verification
- Lighthouse a11y score ≥ 95 on the dashboard.
- `npm run build` succeeds; `cargo tauri build` produces a working `.msi`/`.dmg`/`.AppImage`.
- Manual: refresh after a chat → messages persist. Add `AAPL` (not `.NS`) to watchlist → ticker resolves.
- macOS launch: voice input toggle appears.
- Battery test: open dashboard, hide tab, idle 10 min → CPU near 0.

---

# Phase 5 — Deployment, packaging, release pipeline

**Status: detailed plan pending.**

## Goals
One command builds everything. CI is real. Windows installer. Release pipeline. No more `continue-on-error: true`.

## Findings

### 5.1 GitHub Actions (all 5 workflows have issues)

| Workflow | Critical bugs |
|---|---|
| `test-quality.yml` | Runs `pytest backend/tests` (path doesn't exist) but `continue-on-error: true` — fake green. `bandit` results dropped. `safety` output to stdout. `lint` runs `2>/dev/null \|\| echo "No lint script"`. Python 3.9 in matrix (EOL). `develop` branch trigger dead. |
| `build-and-release.yml` | `tauri-apps/tauri-action@v0` is Tauri 1 line, paired with Tauri 2. `actions-rs/toolchain@v1` archived. `actions/checkout@v3`, `setup-node@v3`, `upload-artifact@v3` deprecated. `build-docker` builds broken Dockerfile. |
| `deploy.yml` | `VITE_API_URL: http://localhost:8000` — prod SPA points at localhost. `VITE_FIREBASE_API_KEY: demo-key` will fail auth. |
| `build-mobile.yml` | `mobile-app/` has no `App.js`, no `app.json`, no `eas.json` `preview` profile. Build structurally impossible. |
| `build-desktop.yml` | `projectPath: frontend` targets the Tauri 1.5 setup; conflicts with `build-and-release.yml`. ImageMagick install on Windows relies on Choco (not preinstalled). |

Plus `.github_workflows_tests.yml` at the root — **not a real workflow** (GH only reads `.github/workflows/`). References `requirements-prod.txt` (doesn't exist).

### 5.2 Deployment configs

| File | Bug |
|---|---|
| `backend/Dockerfile` | `COPY src/ src/` — no such dir. `gunicorn app:app` — no Flask app. `EXPOSE 5000` but Render expects 10000. No `.dockerignore`. No `USER` (runs as root). |
| `backend/railway.toml` | Inherits Dockerfile bugs. `FLASK_ENV`, `FLASK_DEBUG` irrelevant. |
| `render.yaml` | `dashboard_api.py` hardcodes port 8000; ignores `PORT`. Render health check on 10000 will fail. `startCommand: python3 dashboard_api.py` — `python3` may not exist. |
| `netlify.toml` (root) | `REACT_APP_API_URL` (CRA), but Vite reads `VITE_API_URL`. No SPA env propagation. |
| `netlify.toml` (in `web-deploy/`) | Old PWA config; conflicts. |
| `Procfile` | `cd backend && python dashboard_api.py` — the only config that actually starts the real backend. |
| `setup.iss` (Inno Setup) | References `assets/app.ico` (correct). |
| `src-tauri/tauri.conf.json` | Mis-placed `allowlist: { all: true }` block. Updater `endpoints: ["https://releases.example.com/..."]` placeholder. Needs real icons. |

### 5.3 Release pipeline
- 24 tags: 16 `v1.0.x`, 4 `v3.0.0`, 1 stray `main` tag.
- No `CHANGELOG.md` at the root.
- `softprops/action-gh-release@v1` is used in the mobile workflow but not the desktop one.
- No signed releases.

### 5.4 Windows installer path
- `setup.iss` is the Inno Setup script. Currently untracked in builds.
- `scripts/package_windows.bat` calls `pyinstaller --noconfirm --clean app.spec` — `app.spec` is missing.
- `scripts/INSTALL.bat` references `assets\icon.ico` (wrong name) — actual file is `assets/app.ico`.
- `scripts/package_windows_store.ps1` requires `AppxManifest.xml` (missing).

### 5.5 `.env.template` mismatch
- Documents `ELEVENLABS_VOICE_ID`; code reads `ELEVENLABS_VOICE` (no `_ID`).
- Documents `GROQ_MODEL`; backend doesn't read it as an env var.
- Missing: `OPENAI_API_KEY`, `CLAUDE_API_KEY`, `ANTHROPIC_API_KEY`, `ELEVENLABS_VOICE`, `PORT`, `FIREBASE_PROJECT_ID`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID`.

### 5.6 Git hygiene
- 8 author identities (Replit bot, placeholders, real name).
- Stale remote branch `v3.0.0-transformation-…` (0 unique commits).
- `.gitignore` missing: `artifacts/`, `attached_assets/`, `*.msi`, `*.dmg`, `*.deb`, `*.AppImage`, `*.apk`, `*.app/`, `*.pkg`, `*.iso`, `*.wasm`, `*.map`, `*.tsbuildinfo`, `.codex-run-logs/`, `.venv/`, `*.egg-info/`, `*.sqlite`, `*.db`, `*.local`.

## Risks
- Breaking the Windows installer path during Tauri migration. Mitigation: keep Tauri 1.5 path green on `t1-legacy` branch until Tauri 2 path is verified.
- Render deploys have a public URL; if health check fails, public URL 502s. Mitigation: deploy to a preview slot first; switch primary only after 1 hour of green.
- The Windows installer signing step is non-trivial. Mitigation: ship unsigned builds for internal testing; add code-signing in a follow-up.

## Benefits
- One command from `git tag` to working artifacts on Windows/macOS/Linux/Web.
- Real CI: every PR runs backend tests, frontend build, security scan, and one Tauri build. No `continue-on-error` lies.
- Production deploys are reproducible from a clean clone.
- Releases are signed (later phase) and have a real `CHANGELOG.md`.

## Effort
≈ 2–3 days (CI + Dockerfile + Render + Netlify + Tauri config), plus 1 day for Windows installer, plus 1 day for release automation = **4–5 days**.

## Verification
- `git tag v3.1.0-rc1 && git push origin v3.1.0-rc1` triggers all 4 matrix builds; all green; artifacts uploaded; release page populated.
- `netlify deploy --prod` succeeds; `https://<site>.netlify.app/` loads with a real API URL.
- `render deploy` succeeds; `/api/health` returns 200 from the public URL.
- On a fresh Windows VM, download the `.msi`, install, launch — chat works.
- On a fresh macOS VM, download the `.dmg`, drag to Applications, launch — chat works.
- `git tag | sort -u | wc -l` ≤ 8.

---

# Approval gates

Each phase requires explicit approval. Detailed task lists are produced per phase once that phase is approved.

- [x] **Phase 1 — Security** approved (pending detailed task approval)
- [ ] Phase 2 — Architecture cleanup
- [ ] Phase 3 — Runtime, context, intent, tool verification, reliability
- [ ] Phase 4 — UI/UX redesign & Tauri migration assessment
- [ ] Phase 5 — Deployment, packaging, release pipeline
