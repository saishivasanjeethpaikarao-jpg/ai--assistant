from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json, os, sqlite3

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*", "https://airis-9ox.pages.dev"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_DIR = "/opt/render/project/data"
DB_PATH = os.path.join(DB_DIR, "settings.db")

def get_db():
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)")
    return conn

def load():
    try:
        conn = get_db()
        row = conn.execute("SELECT value FROM settings WHERE key = 'data'").fetchone()
        conn.close()
        if row:
            return json.loads(row["value"])
    except Exception:
        pass
    return {"settings": {}, "preferences": {}}

def save(data):
    try:
        conn = get_db()
        conn.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('data', ?)", (json.dumps(data),))
        conn.commit()
        conn.close()
    except Exception:
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
