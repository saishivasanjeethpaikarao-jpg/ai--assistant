from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from datetime import datetime
import json, os, sqlite3, base64, httpx, logging
from core.event_bus import EventBus

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()
bus = EventBus()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://airis-9ox.pages.dev",
        "https://ai-assistant-8r3x.onrender.com",
        "http://localhost:5173",
        "http://localhost:5000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.environ.get('RENDER_DATA_DIR', '/opt/render/project/data') + '/settings.db'

def get_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)")
    conn.execute("CREATE TABLE IF NOT EXISTS chat_history (id INTEGER PRIMARY KEY AUTOINCREMENT, role TEXT, content TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)")
    conn.commit()
    return conn

def load():
    try:
        conn = get_db()
        rows = conn.execute("SELECT key, value FROM settings").fetchall()
        data = {}
        for key, value in rows:
            data[key] = json.loads(value)
        conn.close()

        # Merge with environment variables for secrets if not set
        settings = data.get("settings", {})
        env_mapping = {
            "anthropic_api_key": "ANTHROPIC_API_KEY",
            "openai_api_key": "OPENAI_API_KEY",
            "gemini_api_key": "GEMINI_API_KEY",
            "groq_api_key": "GROQ_API_KEY",
            "fish_audio_api_key": "FISH_AUDIO_API_KEY",
            "elevenlabs_api_key": "ELEVENLABS_API_KEY",
            "nvidia_nim_api_key": "NVIDIA_NIM_API_KEY",
            "mistral_api_key": "MISTRAL_API_KEY",
            "together_api_key": "TOGETHER_API_KEY",
        }
        for s_key, e_key in env_mapping.items():
            if not settings.get(s_key):
                env_val = os.environ.get(e_key)
                if env_val:
                    settings[s_key] = env_val

        data["settings"] = settings
        return data
    except Exception as e:
        logger.error(f"Failed to load settings: {e}")
        return {"settings": {}, "preferences": {}}

def save(data):
    try:
        conn = get_db()
        for key, value in data.items():
            conn.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
                         (key, json.dumps(value)))
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"Failed to save settings: {e}")

@app.get("/api/settings")
def get_settings():
    data = load()
    s = data.get("settings", {})
    
    # Hide real keys from frontend status
    s_status = {k: bool(s.get(k)) for k in [
        "groq_api_key", "claude_api_key", "anthropic_api_key", "openai_api_key",
        "gemini_api_key", "fish_audio_api_key", "elevenlabs_api_key",
        "nvidia_nim_api_key", "mistral_api_key", "together_api_key", "firebase_api_key"
    ]}
    for k, v in s_status.items():
        s[f"{k}_set"] = v

    providers = []
    # Build providers dynamically
    provider_configs = [
        ("Claude", "anthropic_api_key", "claude-sonnet-4-20250514", "https://api.anthropic.com/v1"),
        ("OpenAI", "openai_api_key", "gpt-4o", "https://api.openai.com/v1"),
        ("Gemini", "gemini_api_key", "gemini-2.0-flash", "https://generativelanguage.googleapis.com/v1beta"),
        ("Groq", "groq_api_key", "llama-3.3-70b-versatile", "https://api.groq.com/openai/v1"),
        ("NVIDIA", "nvidia_nim_api_key", "nvidia/llama-3.1-nemotron-70b", "https://integrate.api.nvidia.com/v1"),
        ("Mistral", "mistral_api_key", "mistral-large-latest", "https://api.mistral.ai/v1"),
        ("Together", "together_api_key", "meta-llama/Llama-3-70b", "https://api.together.xyz/v1"),
    ]

    for name, key_name, default_model, base_url in provider_configs:
        if s.get(key_name) or s.get(key_name.replace('anthropic', 'claude')):
            providers.append({
                "name": name,
                "model": s.get(f"{name.lower()}_model", default_model),
                "enabled": True,
                "base_url": base_url
            })

    if s.get("ollama_enabled"):
        providers.append({
            "name": "Ollama",
            "model": s.get("ollama_model", "llama3.2"),
            "enabled": True,
            "base_url": s.get("ollama_url", "http://localhost:11434")
        })
    
    return {"success": True, "settings": s, "preferences": data.get("preferences", {}), "providers": providers}

class SaveRequest(BaseModel):
    settings: dict = {}
    preferences: dict = {}

@app.post("/api/settings")
async def save_settings(req: SaveRequest):
    save({"settings": req.settings, "preferences": req.preferences})
    await bus.publish("settings_updated", {"settings": req.settings, "preferences": req.preferences})
    return {"success": True}

# ── System Prompt ──────────────────────────────────────────────────────────

def get_default_system_prompt():
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    return f"""You are Airis, an advanced Iron Man JARVIS-style AI assistant created by Sai Shiva Sanjeeth, a student developer from India.

PERSONALITY:
- Intelligent, witty, concise. Like JARVIS from Iron Man.
- Never verbose unless asked. 1-3 sentences for simple answers.
- Understand Indian context: Telugu cinema, Bollywood, cricket, NSE/BSE stocks, Indian culture, Telugu and Hindi languages.
- Reply in same language as user (English/Telugu/Hindi).
- Never say "Namaste" unless user greets in Hindi/Telugu first.
- Only introduce yourself when specifically asked.
- Creator is Sai Shiva Sanjeeth (only mention if asked).
- Never make up fake data or statistics.
- Current date: {now}

CAPABILITIES:
- AI conversation with memory of last 10 messages
- Stock market analysis (NSE, BSE, global)
- Voice responses (TTS)
- Reminders and tasks
- File management (desktop only)
- App launching (desktop only)
- Web search (desktop only)"""

class PromptRequest(BaseModel):
    prompt: str

@app.get("/api/system/prompt")
def get_system_prompt():
    default_prompt = get_default_system_prompt()
    try:
        conn = get_db()
        row = conn.execute("SELECT value FROM settings WHERE key = 'system_prompt'").fetchone()
        conn.close()
        prompt = json.loads(row[0]) if row else default_prompt
        return {"success": True, "prompt": prompt, "enabled": True, "mode": "agent"}
    except Exception as e:
        logger.warning(f"Failed to load system prompt: {e}")
        return {"success": True, "prompt": default_prompt, "enabled": True, "mode": "agent"}

@app.post("/api/system/prompt")
async def save_system_prompt(req: PromptRequest):
    try:
        conn = get_db()
        conn.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
                     ("system_prompt", json.dumps(req.prompt)))
        conn.commit()
        conn.close()
        await bus.publish("system_prompt_updated", {"prompt": req.prompt})
        return {"success": True, "message": "System prompt saved"}
    except Exception as e:
        return {"success": False, "error": str(e)}

# ── Voice Clone ────────────────────────────────────────────────────────────

@app.post("/api/voice/clone")
async def clone_voice(request: Request):
    data = await request.json()
    name = data.get("name")
    audio_b64 = data.get("audio_b64")
    content_type = data.get("content_type", "audio/mpeg")

    settings = load().get("settings", {})
    fish_key = settings.get("fish_audio_api_key")

    if not fish_key:
        raise HTTPException(status_code=400, detail="Fish Audio API key not configured. Go to Settings > Voice & Speech.")

    audio_bytes = base64.b64decode(audio_b64)

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.fish.audio/v1/model",
            headers={"Authorization": f"Bearer {fish_key}"},
            files={"voices": (f"voice.{content_type.split('/')[-1]}", audio_bytes, content_type)},
            data={"title": name, "train_mode": "fast"}
        )

    if response.status_code != 200:
        raise HTTPException(status_code=400, detail=f"Fish Audio error: {response.text}")

    result = response.json()
    return {"success": True, "model_id": result.get("_id")}

# ── TTS Proxy ──────────────────────────────────────────────────────────────

@app.post("/api/tts")
async def text_to_speech(request: Request):
    data = await request.json()
    text = data.get("text", "")
    reference_id = data.get("reference_id")
    model = data.get("model", "s2-pro")

    settings = load().get("settings", {})
    fish_key = settings.get("fish_audio_api_key")

    if not fish_key:
        raise HTTPException(status_code=400, detail="Fish Audio API key not configured")

    payload = {"text": text, "model": model, "format": "mp3"}
    if reference_id:
        payload["reference_id"] = reference_id

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            "https://api.fish.audio/v1/tts",
            headers={
                "Authorization": f"Bearer {fish_key}",
                "Content-Type": "application/json"
            },
            json=payload
        )

    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="TTS failed")

    return Response(content=response.content, media_type="audio/mpeg")

# ── TTS Config ─────────────────────────────────────────────────────────────

@app.get("/api/tts/config")
def tts_config():
    settings = load().get("settings", {})
    fish_key = settings.get("fish_audio_api_key")
    ref_id = settings.get("fish_audio_reference_id")
    return {
        "fish_available": bool(fish_key and ref_id),
        "reference_id": ref_id,
        "model": settings.get("fish_audio_model", "s2-pro")
    }

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.get("/api/history")
def get_history():
    try:
        conn = get_db()
        rows = conn.execute("SELECT role, content, timestamp FROM chat_history ORDER BY timestamp DESC LIMIT 50").fetchall()
        conn.close()
        messages = [{"role": r, "content": c, "timestamp": t} for r, c, t in reversed(rows)]
        return {"success": True, "messages": messages}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/history")
async def add_history(req: dict):
    try:
        conn = get_db()
        conn.execute("INSERT INTO chat_history (role, content) VALUES (?, ?)", (req["role"], req["content"]))
        conn.commit()
        conn.close()
        await bus.publish("chat_received", {"role": req["role"], "content": req["content"]})
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/history/clear")
def clear_history():
    try:
        conn = get_db()
        conn.execute("DELETE FROM chat_history")
        conn.commit()
        conn.close()
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/api/platform")
def get_platform():
    import platform
    return {"platform": platform.system()}

@app.get("/api/market/indices")
def get_market_indices():
    import yfinance as yf
    indices = ["^NSEI", "^BSESN", "^NSEBANK", "^CNXIT", "^CNXFMCG", "^CNXAUTO", "^CNXPHARMA", "^NSEMDCP50"]
    try:
        data = yf.download(indices, period="1d")["Close"].iloc[-1]
        prev_data = yf.download(indices, period="5d")["Close"].iloc[-2]
        result = []
        for sym in indices:
            price = float(data[sym])
            prev_price = float(prev_data[sym])
            change_pct = ((price - prev_price) / prev_price) * 100
            result.append({"symbol": sym, "name": sym.replace("^", ""), "price": price, "change_pct": change_pct})
        return {"success": True, "indices": result}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/api/market/quote")
def get_market_quote(symbol: str):
    import yfinance as yf
    try:
        ticker_sym = symbol if "." in symbol or "^" in symbol else f"{symbol}.NS"
        t = yf.Ticker(ticker_sym)
        info = t.info
        return {
            "success": True,
            "quote": {
                "symbol": symbol,
                "name": info.get("longName", symbol),
                "price": info.get("currentPrice") or info.get("regularMarketPrice"),
                "change": info.get("regularMarketChange"),
                "change_pct": info.get("regularMarketChangePercent"),
                "open": info.get("regularMarketOpen"),
                "high": info.get("regularMarketDayHigh"),
                "low": info.get("regularMarketDayLow"),
                "prev_close": info.get("regularMarketPreviousClose"),
                "year_high": info.get("fiftyTwoWeekHigh"),
                "year_low": info.get("fiftyTwoWeekLow"),
                "market_cap": info.get("marketCap"),
                "volume": info.get("regularMarketVolume")
            }
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
