from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
import json, os, sqlite3, base64, httpx, logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "",
        "https://airis-9ox.pages.dev",
        "https://ai-assistant-8r3x.onrender.com",
        "http://localhost:5173",
        "http://localhost:5000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "/opt/render/project/data/settings.db"

def get_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)")
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
    s["groq_api_key_set"] = bool(s.get("groq_api_key"))
    s["fish_audio_api_key_set"] = bool(s.get("fish_audio_api_key"))
    s["elevenlabs_api_key_set"] = bool(s.get("elevenlabs_api_key"))
    s["firebase_api_key_set"] = bool(s.get("firebase_api_key"))
    
    providers = []
    if s.get("groq_api_key"):
        providers.append({
            "name": "Groq",
            "model": s.get("groq_model", "llama-3.3-70b-versatile"),
            "enabled": True,
            "base_url": "https://api.groq.com/openai/v1"
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
def save_settings(req: SaveRequest):
    save({"settings": req.settings, "preferences": req.preferences})
    return {"success": True}

# ── System Prompt ──────────────────────────────────────────────────────────

DEFAULT_SYSTEM_PROMPT = """You are Airis, an Iron Man-style AI assistant created by Sai Shiva Sanjeeth.

RULES:
- Your creator is Sai Shiva Sanjeeth. Never claim a different creator.
- Never make up fake data like fake account balances, fake stock positions, or fake portfolio values. Only show real data from the trading API.
- For "open [app]" commands: if running in browser, say "App launching only works on the Airis desktop app. Download it from airis-9ox.pages.dev." If running in the desktop app, use the shell API to open the app.
- For voice switching: tell the user to go to Settings > Voice & Speech to change the voice.
- You are an Indian AI assistant. Understand Telugu and Indian context (actors, movies, stocks, cricket).
- Current year is 2026. You have access to real-time information via the Groq API — there is no fixed knowledge cutoff.
- For trading dashboard: only show real data from the trading API, never invent numbers or prices.
- For reminders: confirm the exact time the reminder will fire.
- Be helpful, concise, precise, and safe. If unsure, ask for clarification."""

class PromptRequest(BaseModel):
    prompt: str

@app.get("/api/system/prompt")
def get_system_prompt():
    try:
        conn = get_db()
        row = conn.execute("SELECT value FROM settings WHERE key = 'system_prompt'").fetchone()
        conn.close()
        prompt = json.loads(row[0]) if row else DEFAULT_SYSTEM_PROMPT
        return {"success": True, "prompt": prompt, "enabled": True, "mode": "agent"}
    except Exception as e:
        logger.warning(f"Failed to load system prompt: {e}")
        return {"success": True, "prompt": DEFAULT_SYSTEM_PROMPT, "enabled": True, "mode": "agent"}

@app.post("/api/system/prompt")
def save_system_prompt(req: PromptRequest):
    try:
        conn = get_db()
        conn.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
                     ("system_prompt", json.dumps(req.prompt)))
        conn.commit()
        conn.close()
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
