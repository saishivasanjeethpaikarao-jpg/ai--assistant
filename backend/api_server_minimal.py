from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json, os, sqlite3

app = FastAPI()

# BUG FIX #9: Add CORS origins for all deployment URLs
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*",
        "https://airis-9ox.pages.dev",
        "https://ai-assistant-8r3x.onrender.com",
        "http://localhost:5173",
        "http://localhost:5000",
        "http://localhost:8000",
        "http://localhost:3000",
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
    except:
        return {"settings": {}, "preferences": {}}

def save(data):
    try:
        conn = get_db()
        for key, value in data.items():
            conn.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
                         (key, json.dumps(value)))
        conn.commit()
        conn.close()
    except:
        pass

@app.get("/api/settings")
def get_settings():
    data = load()
    s = data.get("settings", {})
    s["groq_api_key_set"] = bool(s.get("groq_api_key"))
    s["fish_audio_api_key_set"] = bool(s.get("fish_audio_api_key"))
    s["elevenlabs_api_key_set"] = bool(s.get("elevenlabs_api_key"))
    s["firebase_api_key_set"] = bool(s.get("firebase_api_key"))
    
    # BUG FIX #2: Build providers dynamically from saved settings
    providers = []
    
    # Groq provider
    if s.get("groq_api_key"):
        providers.append({
            "name": "Groq",
            "model": s.get("groq_model", "llama-3.3-70b-versatile"),
            "enabled": True,
            "base_url": "https://api.groq.com/openai/v1"
        })
    
    # Claude provider
    if s.get("claude_api_key"):
        providers.append({
            "name": "Claude",
            "model": s.get("claude_model", "claude-3-5-sonnet-20241022"),
            "enabled": True,
            "base_url": "https://api.anthropic.com"
        })
    
    # OpenAI provider
    if s.get("openai_api_key"):
        providers.append({
            "name": "OpenAI",
            "model": s.get("openai_model", "gpt-4-turbo"),
            "enabled": True,
            "base_url": "https://api.openai.com/v1"
        })
    
    # Google Gemini provider
    if s.get("gemini_api_key"):
        providers.append({
            "name": "Gemini",
            "model": s.get("gemini_model", "gemini-2.0-flash"),
            "enabled": True,
            "base_url": "https://generativelanguage.googleapis.com"
        })
    
    # NVIDIA NIM provider
    if s.get("nvidia_api_key"):
        providers.append({
            "name": "NVIDIA NIM",
            "model": s.get("nvidia_model", "meta/llama-3.1-405b-instruct"),
            "enabled": True,
            "base_url": "https://integrate.api.nvidia.com/v1"
        })
    
    # Mistral provider
    if s.get("mistral_api_key"):
        providers.append({
            "name": "Mistral",
            "model": s.get("mistral_model", "mistral-large-latest"),
            "enabled": True,
            "base_url": "https://api.mistral.ai/v1"
        })
    
    # Together AI provider
    if s.get("together_api_key"):
        providers.append({
            "name": "Together AI",
            "model": s.get("together_model", "meta-llama/Llama-3-70b-chat-hf"),
            "enabled": True,
            "base_url": "https://api.together.xyz/v1"
        })
    
    # Ollama provider (local)
    if s.get("ollama_enabled") and s.get("ollama_url"):
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

@app.get("/api/health")
def health():
    return {"status": "ok"}
