"""
VibeCoder — Multi-Agent Specialist Coding System
6 specialist agents, auto-routing, code execution, fix, and chat.
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
        "example": "A responsive navbar with logo and mobile hamburger menu",
        "keywords": [
            "react", "html", "css", "component", "ui", "frontend", "webpage",
            "button", "form", "style", "layout", "animation", "responsive",
            "navbar", "sidebar", "modal", "card", "tailwind", "dashboard ui",
            "landing page", "design", "tsx", "jsx", "hook", "usestate",
        ],
        "system_prompt": """You are FrontendAgent 🎨, an elite React and UI specialist.

IDENTITY:
- Master of React, TypeScript, HTML5, CSS3, and modern UI patterns
- You write clean, production-ready frontend code
- You create beautiful, dark-themed interfaces with smooth animations
- You deeply understand UX principles and accessibility

APPROACH:
1. Write complete, runnable code — never pseudocode or stubs
2. Use modern React (hooks, functional components)
3. Apply dark themes by default (#0a0a0a bg, #3b82f6 accent)
4. Inline styles unless asked for CSS files
5. Include proper error handling and loading states

OUTPUT FORMAT:
- Always output complete, copy-pasteable code
- Brief comments explaining key decisions
- End with: "✅ Ready to use — copy this into your project."

SPECIALTIES:
- React components with hooks
- Dark-themed dashboards and UIs
- Responsive layouts (CSS Grid/Flexbox)
- Animations with CSS or Framer Motion
- Form handling and validation""",
    },

    "backend": {
        "id": "backend",
        "name": "BackendAgent",
        "emoji": "⚙️",
        "label": "Backend",
        "color": "#34d399",
        "desc": "Python, FastAPI, APIs, databases, server logic",
        "example": "A Python function to send emails with attachments",
        "keywords": [
            "api", "fastapi", "flask", "django", "python", "backend", "server",
            "database", "sql", "endpoint", "route", "middleware", "auth",
            "postgresql", "mongodb", "redis", "celery", "websocket", "rest",
            "crud", "orm", "model", "schema", "jwt", "cors", "async",
            "function", "class", "script", "scrape", "fetch", "parse",
            "file", "csv", "json", "requests",
        ],
        "system_prompt": """You are BackendAgent ⚙️, an elite Python backend architect.

IDENTITY:
- Master of Python, FastAPI, Flask, databases, and distributed systems
- You write clean, type-annotated, production-grade backend code
- Security-first mindset — always validate, sanitize, authenticate
- Performance-oriented: async where beneficial, efficient queries

APPROACH:
1. Write complete, runnable Python code
2. Use type hints and proper error handling
3. Add security validations
4. Include docstrings for complex functions

OUTPUT FORMAT:
- Complete, runnable Python files with all imports
- Add startup instructions as comments
- End with: "✅ Production-ready — install requirements and run."

SPECIALTIES:
- FastAPI + Pydantic REST APIs
- SQLAlchemy ORM with PostgreSQL
- JWT authentication systems
- Async Python with asyncio/httpx
- Web scraping with requests/BeautifulSoup
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
        "example": "NIFTY 50 RSI indicator and buy/sell signals",
        "keywords": [
            "stock", "trading", "nse", "bse", "nifty", "sensex", "equity",
            "yfinance", "backtest", "strategy", "indicator", "rsi",
            "macd", "bollinger", "moving average", "portfolio", "watchlist",
            "options", "futures", "technical analysis", "candlestick",
            "profit", "loss", "returns", "volatility", "algo", "signal",
            "banknifty", "intraday", "swing", "reliance", "tcs", "infosys",
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
- Technical indicator calculation
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
        "example": "Auto-rename all files in a folder by date",
        "keywords": [
            "automate", "automation", "pyautogui", "keyboard", "mouse",
            "click", "type", "screenshot", "window", "schedule", "cron", "task",
            "folder", "rename", "batch", "selenium", "browser",
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
- Email automation (smtplib)
- Excel/Word automation (openpyxl, python-docx)
- Desktop notification systems""",
    },

    "data": {
        "id": "data",
        "name": "DataAgent",
        "emoji": "📊",
        "label": "Data",
        "color": "#38bdf8",
        "desc": "Data analysis, pandas, matplotlib, plotly, CSV processing",
        "example": "Plot sales data from a CSV with bar and line charts",
        "keywords": [
            "data", "analysis", "pandas", "csv", "excel", "chart", "graph",
            "plot", "visualize", "visualization", "statistics", "correlation",
            "average", "mean", "median", "numpy", "dataset", "dataframe",
            "clean", "process", "matplotlib", "plotly", "seaborn", "histogram",
            "scatter", "bar chart", "line chart", "heatmap", "regression",
            "prediction", "machine learning", "sklearn", "feature",
        ],
        "system_prompt": """You are DataAgent 📊, an elite data scientist and visualization expert.

IDENTITY:
- Master of Python data analysis: pandas, numpy, matplotlib, plotly, seaborn
- Creates beautiful, insightful visualizations from raw data
- Expert in data cleaning, transformation, and statistical analysis
- Builds end-to-end data pipelines and analysis notebooks

APPROACH:
1. Write complete, runnable Python data analysis scripts
2. Always include data cleaning and validation steps
3. Create clear, labeled visualizations with proper titles/axes
4. Add markdown-style comments explaining the analysis logic
5. Include statistical summaries and key insights

OUTPUT FORMAT:
- Complete Python scripts with all imports
- Section comments explaining each analysis step
- Use plotly for interactive charts by default (matplotlib as fallback)
- End with: "📊 Run this script to generate your analysis and charts."

SPECIALTIES:
- Pandas DataFrames: cleaning, merging, groupby, pivot tables
- Statistical analysis: correlation, regression, hypothesis testing
- Interactive charts with Plotly Express
- Beautiful static charts with matplotlib/seaborn
- CSV/Excel ingestion and export
- Feature engineering for ML
- Time-series analysis and forecasting
- Descriptive and inferential statistics""",
    },

    "debug": {
        "id": "debug",
        "name": "DebugAgent",
        "emoji": "🔍",
        "label": "Debug",
        "color": "#fb923c",
        "desc": "Find and fix bugs, code review, performance optimization",
        "example": "Review this code and fix all the bugs: [paste code]",
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


def detect_agent_with_confidence(prompt: str) -> dict:
    """Detect agent and return confidence score (0-100)."""
    prompt_lower = prompt.lower()
    scores = {agent_id: 0 for agent_id in AGENTS}
    for agent_id, agent in AGENTS.items():
        for kw in agent["keywords"]:
            if kw in prompt_lower:
                scores[agent_id] += 1
    best = max(scores, key=lambda k: scores[k])
    total_kw = len(AGENTS[best]["keywords"])
    confidence = min(100, int((scores[best] / max(1, total_kw)) * 100 * 5))
    if scores[best] == 0:
        return {"agent_id": "backend", "confidence": 40}
    return {"agent_id": best, "confidence": max(55, confidence)}


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


def get_dependencies(code: str) -> list:
    """Parse import statements and return list of pip packages."""
    STDLIB = {
        "os", "sys", "re", "json", "time", "math", "random", "string", "io",
        "pathlib", "datetime", "collections", "functools", "itertools", "typing",
        "abc", "copy", "hashlib", "logging", "threading", "subprocess", "tempfile",
        "urllib", "http", "email", "html", "xml", "csv", "struct", "base64",
        "socket", "ssl", "uuid", "enum", "dataclasses", "contextlib", "operator",
    }
    PKG_MAP = {
        "cv2": "opencv-python",
        "PIL": "Pillow",
        "sklearn": "scikit-learn",
        "bs4": "beautifulsoup4",
        "dotenv": "python-dotenv",
        "yaml": "pyyaml",
        "serial": "pyserial",
        "wx": "wxPython",
        "gi": "PyGObject",
        "tk": "tk",
        "tkinter": "tk",
    }
    deps = []
    seen = set()
    import_pattern = re.compile(r"^(?:import|from)\s+([\w.]+)", re.MULTILINE)
    for match in import_pattern.finditer(code):
        pkg = match.group(1).split(".")[0]
        if pkg in STDLIB or pkg in seen:
            continue
        seen.add(pkg)
        mapped = PKG_MAP.get(pkg, pkg)
        deps.append(mapped)
    return deps


def generate_code(prompt: str, agent_id: str = "auto") -> dict:
    """Generate code using the specified (or auto-detected) specialist agent."""
    detection = detect_agent_with_confidence(prompt)
    if agent_id == "auto" or agent_id not in AGENTS:
        agent_id = detection["agent_id"]
        confidence = detection["confidence"]
    else:
        confidence = 90

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
    deps = get_dependencies(code)

    return {
        "agent_id": agent_id,
        "agent_name": agent["name"],
        "agent_emoji": agent["emoji"],
        "code": code,
        "prompt": prompt,
        "confidence": confidence,
        "dependencies": deps,
        "can_run": agent_id in ("backend", "trading", "automation", "data", "debug"),
    }


def fix_code(code: str, error: str) -> dict:
    """Use DebugAgent to automatically fix broken code."""
    agent = AGENTS["debug"]
    fix_prompt = f"""Fix the following code that has an error.

ERROR:
{error}

BROKEN CODE:
{code}

Provide the complete fixed code with the bug corrected. Explain briefly what was wrong."""

    result = call_ai_with_system(agent["system_prompt"], fix_prompt)
    return {
        "fixed_code": result,
        "agent_name": agent["name"],
        "agent_emoji": agent["emoji"],
    }


def chat_about_code(message: str, code_context: str) -> dict:
    """Answer questions about generated code using the appropriate agent."""
    chat_prompt = f"""The user has this code and wants to ask a question about it.

CODE CONTEXT:
{code_context}

USER QUESTION:
{message}

Answer clearly and helpfully. If suggesting code changes, show the complete updated code."""

    system = """You are an expert code assistant. When asked about code:
- Give clear, direct answers
- If code changes are needed, show the complete updated version
- Be concise but thorough
- Use technical precision"""

    result = call_ai_with_system(system, chat_prompt)
    return {"reply": result}


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
        clean = clean.split("```python", 1)[1].split("```")[0]
    elif "```" in clean:
        clean = clean.split("```", 1)[1].split("```")[0]
    clean = clean.strip()

    dangerous = [
        "import os", "import sys", "subprocess", "shutil.rmtree",
        "os.remove", "os.unlink", "__import__", "eval(", "exec(",
        "open(", "os.system", "os.popen",
    ]
    warnings = []
    for d in dangerous:
        if d in clean:
            warnings.append(f"⚠️ Sensitive operation: `{d}`")

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
        header = ("\n".join(warnings) + "\n\n") if warnings else ""
        return {
            "success": result.returncode == 0,
            "output": header + output if output else header,
            "error": error,
            "runtime_ms": elapsed,
            "return_code": result.returncode,
        }
    except subprocess.TimeoutExpired:
        return {"success": False, "output": "", "error": "⏱️ Execution timed out after 15 seconds.", "runtime_ms": 15000}
    except Exception as e:
        return {"success": False, "output": "", "error": str(e), "runtime_ms": 0}
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
            "example": a.get("example", ""),
        }
        for a in AGENTS.values()
    ]
