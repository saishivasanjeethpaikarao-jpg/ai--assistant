from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json, os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SETTINGS_FILE = "/tmp/settings.json"

def load():
    if os.path.exists(SETTINGS_FILE):
        with open(SETTINGS_FILE) as f:
            return json.load(f)
    return {"settings": {}, "preferences": {}}

def save(data):
    with open(SETTINGS_FILE, "w") as f:
        json.dump(data, f)

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
