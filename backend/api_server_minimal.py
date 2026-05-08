from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json, os, sqlite3

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

@app.get("/api/health")
def health():
    return {"status": "ok"}
