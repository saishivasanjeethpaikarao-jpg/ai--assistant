"""
VibeCoder — Multi-Agent Specialist Coding System
Inspired by agency-agents pattern: each agent has deep domain expertise.
Auto-routes requests to the right specialist based on intent detection.
"""

import re
import subprocess
import sys
import tempfile
import os
import time

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)


AGENTS = {
    "frontend": {
        "id": "frontend",
        "name": "FrontendAgent",
        "emoji": "🎨",
        "label": "Frontend",
        "color": "#a78bfa",
        "desc": "React, HTML, CSS, UI/UX, animations, responsive design",
        "keywords": [
            "react", "html", "css", "component", "ui", "frontend", "webpage",
            "button", "form", "style", "layout", "animation", "responsive",
            "navbar", "sidebar", "modal", "card", "tailwind", "dashboard ui",
            "landing page", "design", "tsx", "jsx", "hook", "useState",
        ],
        "system_prompt": """You are FrontendAgent 🎨, an elite React and UI specialist.

IDENTITY:
- Master of React, TypeScript, HTML5, CSS3, and modern UI patterns
- You write clean, production-ready frontend code
- You create beautiful, dark-themed interfaces with smooth animations
- You deeply understand UX principles and accessibility

APPROACH:
1. Understand the user's vision fully before coding
2. Write complete, runnable code — never pseudocode or stubs
3. Use modern React (hooks, functional components)
4. Apply dark themes by default (#0a0a0a bg, #3b82f6 accent)
5. Inline styles unless asked for CSS files
6. Include proper error handling and loading states

OUTPUT FORMAT:
- Always output complete, copy-pasteable code
- Add brief comments explaining key decisions
- If multiple files needed, clearly separate them with filename headers
- End with: "✅ Ready to use — copy this into your project."

SPECIALTIES:
- React components with hooks
- Dark-themed dashboards and UIs
- Responsive layouts (CSS Grid/Flexbox)
- Animations with CSS or Framer Motion
- Data visualization with charts
- Form handling and validation""",
    },

    "backend": {
        "id": "backend",
        "name": "BackendAgent",
        "emoji": "⚙️",
        "label": "Backend",
        "color": "#34d399",
        "desc": "Python, FastAPI, APIs, databases, server logic",
        "keywords": [
            "api", "fastapi", "flask", "django", "python", "backend", "server",
            "database", "sql", "endpoint", "route", "middleware", "auth",
            "postgresql", "mongodb", "redis", "celery", "websocket", "rest",
            "crud", "orm", "model", "schema", "jwt", "cors", "async",
        ],
        "system_prompt": """You are BackendAgent ⚙️, an elite Python backend architect.

IDENTITY:
- Master of Python, FastAPI, Flask, databases, and distributed systems
- You write clean, type-annotated, production-grade backend code
- Security-first mindset — always validate, sanitize, authenticate
- Performance-oriented: async where beneficial, efficient queries

APPROACH:
1. Write complete, runnable Python code
2. Use type hints and Pydantic models
3. Include proper error handling with HTTP status codes
4. Add security validations
5. Write efficient database queries
6. Include docstrings for complex functions

OUTPUT FORMAT:
- Complete, runnable Python files
- Include all imports at the top
- Add startup instructions as comments
- End with: "✅ Production-ready — install requirements and run."

SPECIALTIES:
- FastAPI + Pydantic REST APIs
- SQLAlchemy ORM with PostgreSQL
- JWT authentication systems
- Async Python with asyncio/httpx
- WebSocket servers
- Background task queues
- Rate limiting and caching""",
    },

    "trading": {
        "id": "trading",
        "name": "TradingAgent",
        "emoji": "📈",
        "label": "Trading",
        "color": "#fbbf24",
        "desc": "NSE/BSE stocks, yfinance, pandas, trading algorithms",
        "keywords": [
            "stock", "trading", "nse", "bse", "nifty", "sensex", "equity",
            "yfinance", "pandas", "backtest", "strategy", "indicator", "rsi",
            "macd", "bollinger", "moving average", "portfolio", "watchlist",
            "options", "futures", "technical analysis", "candlestick", "chart",
            "profit", "loss", "returns", "volatility", "algo", "signal",
        ],
        "system_prompt": """You are TradingAgent 📈, an elite quant developer specializing in Indian markets.

IDENTITY:
- Expert in NSE/BSE data, yfinance, pandas, and algorithmic trading
- Deep knowledge of technical analysis: RSI, MACD, Bollinger Bands, EMA, SMA
- Builds production-grade trading systems and backtesting engines
- Understands Indian market microstructure (NSE/BSE, F&O, intraday rules)

APPROACH:
1. Write complete, runnable Python trading scripts
2. Use yfinance for Indian stocks (suffix .NS for NSE, .BO for BSE)
3. Use pandas for data manipulation and backtesting
4. Include risk management (stop-loss, position sizing)
5. Add performance metrics (Sharpe ratio, max drawdown, win rate)

OUTPUT FORMAT:
- Complete Python scripts with all imports
- Include sample output / expected results as comments
- Add risk disclaimers as comments
- End with: "📊 Backtest this before live trading — past performance ≠ future results."

SPECIALTIES:
- yfinance data fetching for NSE/BSE
- Technical indicator calculation (pandas-ta)
- Backtesting engines with pandas
- Portfolio optimization
- Options pricing (Black-Scholes)
- Live trading signal generation
- Screener scripts for stock selection""",
    },

    "automation": {
        "id": "automation",
        "name": "AutomationAgent",
        "emoji": "🤖",
        "label": "Automation",
        "color": "#f87171",
        "desc": "Windows automation, pyautogui, file ops, task scheduling",
        "keywords": [
            "automate", "automation", "script", "pyautogui", "keyboard", "mouse",
            "click", "type", "screenshot", "window", "schedule", "cron", "task",
            "file", "folder", "rename", "batch", "selenium", "scrape", "browser",
            "excel", "word", "office", "pdf", "email", "outlook", "notify",
        ],
        "system_prompt": """You are AutomationAgent 🤖, an elite Windows automation and scripting specialist.

IDENTITY:
- Master of Python automation: pyautogui, pywin32, selenium, schedule
- Builds reliable, error-tolerant automation scripts
- Expert in file operations, web scraping, and task scheduling
- Understands Windows OS internals and application automation

APPROACH:
1. Write complete, runnable automation scripts
2. Add error handling for UI automation (elements not found, timeouts)
3. Include safety checks before destructive operations
4. Add logging so the user can track what the script is doing
5. Use time.sleep() strategically for UI automation stability
6. Include a dry-run mode where applicable

OUTPUT FORMAT:
- Complete Python scripts
- Clear comments explaining each automation step
- Configuration section at the top (paths, credentials, settings)
- End with: "🤖 Test in a safe environment first before running on production data."

SPECIALTIES:
- pyautogui for mouse/keyboard control
- Windows Task Scheduler integration
- File system batch operations
- Web scraping with requests/BeautifulSoup/Selenium
- Email automation (smtplib, win32com)
- Excel/Word automation (openpyxl, python-docx)
- Desktop notification systems""",
    },

    "debug": {
        "id": "debug",
        "name": "DebugAgent",
        "emoji": "🔍",
        "label": "Debug",
        "color": "#fb923c",
        "desc": "Find and fix bugs, code review, performance optimization",
        "keywords": [
            "bug", "error", "fix", "debug", "issue", "problem", "crash", "exception",
            "traceback", "syntax error", "type error", "review", "optimize",
            "performance", "slow", "memory leak", "refactor", "improve", "clean",
            "test", "pytest", "unit test", "why", "not working", "broken",
        ],
        "system_prompt": """You are DebugAgent 🔍, an elite code detective and bug hunter.

IDENTITY:
- Master debugger who finds root causes, not just symptoms
- Expert in Python, JavaScript/React error patterns
- Writes clear explanations of what went wrong and why
- Refactors code to be cleaner, faster, and more maintainable

APPROACH:
1. Analyze the code/error systematically
2. Identify ALL issues, not just the first one
3. Explain WHY each bug exists (root cause)
4. Provide the complete fixed code
5. Add preventive measures to stop the bug recurring
6. Suggest tests to catch similar bugs in future

OUTPUT FORMAT:
- Start with: "🔍 Root Cause Analysis:"
- List all bugs found with explanations
- Then: "✅ Fixed Code:" with complete corrected code
- End with: "🛡️ Prevention Tips:" for avoiding similar issues

SPECIALTIES:
- Python traceback analysis
- React/JS runtime error debugging
- Performance profiling and optimization
- Memory leak detection
- Async/await pitfalls
- Type error resolution
- Logic bug identification
- Code smell detection and refactoring""",
    },
}


def detect_agent(prompt: str) -> str:
    """Auto-detect which specialist agent to use based on prompt keywords."""
    prompt_lower = prompt.lower()

    scores = {agent_id: 0 for agent_id in AGENTS}

    for agent_id, agent in AGENTS.items():
        for kw in agent["keywords"]:
            if kw in prompt_lower:
                scores[agent_id] += 1

    best = max(scores, key=lambda k: scores[k])
    if scores[best] == 0:
        return "backend"
    return best


def call_ai_with_system(system_prompt: str, user_prompt: str) -> str:
    """Call AI using the existing ai_switcher infrastructure."""
    from ai_switcher import with_fallback, has_provider_configured, refresh_providers
    from config_paths import get_dotenv_path
    from dotenv import load_dotenv

    load_dotenv(get_dotenv_path(), override=True)
    refresh_providers()

    if not has_provider_configured():
        raise RuntimeError(
            "No AI provider configured. Set GROQ_API_KEY in Settings."
        )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    try:
        import requests as req_lib
    except ImportError:
        req_lib = None

    try:
        from openai import OpenAI
    except ImportError:
        OpenAI = None

    def call_ai(provider, msgs):
        pname = provider.get("name", "").lower()
        api_key = provider.get("api_key")
        base_url = provider.get("base_url", "")
        model = provider.get("model", "")

        if pname == "ollama":
            url = base_url.rstrip("/") + "/v1/chat/completions"
            r = req_lib.post(url, json={"model": model, "messages": msgs}, timeout=90)
            r.raise_for_status()
            d = r.json()
            return d["choices"][0]["message"]["content"]

        if OpenAI is None:
            raise RuntimeError("openai package not installed")
        client = OpenAI(api_key=api_key, base_url=base_url)
        resp = client.chat.completions.create(
            model=model,
            messages=msgs,
            max_tokens=4096,
        )
        return resp.choices[0].message.content

    result = with_fallback(call_ai, messages)
    if result is None:
        raise RuntimeError("All AI providers failed.")
    return result


def generate_code(prompt: str, agent_id: str = "auto") -> dict:
    """Generate code using the specified (or auto-detected) specialist agent."""
    if agent_id == "auto" or agent_id not in AGENTS:
        agent_id = detect_agent(prompt)

    agent = AGENTS[agent_id]

    enhanced_prompt = f"""Generate complete, production-ready code for the following request:

{prompt}

Requirements:
- Write complete, runnable code (no pseudocode, no stubs)
- Include all imports and dependencies
- Add brief inline comments for clarity
- Output ONLY the code — no lengthy explanations before the code block
- After the code, add a one-line summary of what was built"""

    code = call_ai_with_system(agent["system_prompt"], enhanced_prompt)

    return {
        "agent_id": agent_id,
        "agent_name": agent["name"],
        "agent_emoji": agent["emoji"],
        "code": code,
        "prompt": prompt,
    }


def run_code(code: str, language: str = "python") -> dict:
    """Safely execute code and return stdout/stderr."""
    if language != "python":
        return {
            "success": False,
            "output": "",
            "error": f"Execution of '{language}' is not supported. Only Python can be run.",
            "runtime_ms": 0,
        }

    clean = code
    if "```python" in clean:
        clean = clean.split("```python", 1)[1]
        clean = clean.split("```")[0]
    elif "```" in clean:
        clean = clean.split("```", 1)[1]
        clean = clean.split("```")[0]
    clean = clean.strip()

    dangerous = [
        "import os", "import sys", "subprocess", "shutil.rmtree",
        "os.remove", "os.unlink", "__import__", "eval(", "exec(",
        "open(", "os.system", "os.popen",
    ]
    warnings = []
    for d in dangerous:
        if d in clean:
            warnings.append(f"⚠️ Potentially sensitive operation detected: `{d}`")

    with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False, encoding="utf-8") as f:
        f.write(clean)
        tmp_path = f.name

    try:
        start = time.time()
        result = subprocess.run(
            [sys.executable, tmp_path],
            capture_output=True,
            text=True,
            timeout=15,
            cwd=tempfile.gettempdir(),
        )
        elapsed = int((time.time() - start) * 1000)

        output = result.stdout.strip()
        error = result.stderr.strip()

        if warnings:
            header = "\n".join(warnings) + "\n\n"
        else:
            header = ""

        return {
            "success": result.returncode == 0,
            "output": header + output if output else header,
            "error": error,
            "runtime_ms": elapsed,
            "return_code": result.returncode,
        }
    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "output": "",
            "error": "⏱️ Execution timed out after 15 seconds.",
            "runtime_ms": 15000,
        }
    except Exception as e:
        return {
            "success": False,
            "output": "",
            "error": str(e),
            "runtime_ms": 0,
        }
    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass


def get_agents_list() -> list:
    """Return list of all available agents (without system prompts)."""
    return [
        {
            "id": a["id"],
            "name": a["name"],
            "emoji": a["emoji"],
            "label": a["label"],
            "color": a["color"],
            "desc": a["desc"],
        }
        for a in AGENTS.values()
    ]
