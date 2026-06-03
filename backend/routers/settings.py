"""
Settings Router - Manage user settings and preferences
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
import database

router = APIRouter()

class SettingsRequest(BaseModel):
    settings: Dict[str, Any] = {}
    preferences: Dict[str, Any] = {}

@router.get("/settings")
def get_settings():
    """Get all settings and preferences"""
    settings = database.get_all_settings()
    preferences = database.get_all_preferences()
    
    # Add provider status flags
    settings["groq_api_key_set"] = bool(settings.get("groq_api_key"))
    settings["claude_api_key_set"] = bool(settings.get("claude_api_key"))
    settings["openai_api_key_set"] = bool(settings.get("openai_api_key"))
    settings["gemini_api_key_set"] = bool(settings.get("gemini_api_key"))
    settings["nvidia_api_key_set"] = bool(settings.get("nvidia_api_key"))
    settings["mistral_api_key_set"] = bool(settings.get("mistral_api_key"))
    settings["together_api_key_set"] = bool(settings.get("together_api_key"))
    settings["fish_audio_api_key_set"] = bool(settings.get("fish_audio_api_key"))
    settings["elevenlabs_api_key_set"] = bool(settings.get("elevenlabs_api_key"))
    settings["firebase_api_key_set"] = bool(settings.get("firebase_api_key"))
    
    # Build providers list dynamically
    providers = []
    
    if settings.get("groq_api_key"):
        providers.append({
            "name": "Groq",
            "model": settings.get("groq_model", "llama-3.3-70b-versatile"),
            "enabled": True,
            "base_url": "https://api.groq.com/openai/v1"
        })
    
    if settings.get("claude_api_key"):
        providers.append({
            "name": "Claude",
            "model": settings.get("claude_model", "claude-3-5-sonnet-20241022"),
            "enabled": True,
            "base_url": "https://api.anthropic.com"
        })
    
    if settings.get("openai_api_key"):
        providers.append({
            "name": "OpenAI",
            "model": settings.get("openai_model", "gpt-4-turbo"),
            "enabled": True,
            "base_url": "https://api.openai.com/v1"
        })
    
    if settings.get("gemini_api_key"):
        providers.append({
            "name": "Gemini",
            "model": settings.get("gemini_model", "gemini-2.0-flash"),
            "enabled": True,
            "base_url": "https://generativelanguage.googleapis.com"
        })
    
    if settings.get("nvidia_api_key"):
        providers.append({
            "name": "NVIDIA NIM",
            "model": settings.get("nvidia_model", "meta/llama-3.1-405b-instruct"),
            "enabled": True,
            "base_url": "https://integrate.api.nvidia.com/v1"
        })
    
    if settings.get("mistral_api_key"):
        providers.append({
            "name": "Mistral",
            "model": settings.get("mistral_model", "mistral-large-latest"),
            "enabled": True,
            "base_url": "https://api.mistral.ai/v1"
        })
    
    if settings.get("together_api_key"):
        providers.append({
            "name": "Together AI",
            "model": settings.get("together_model", "meta-llama/Llama-3-70b-chat-hf"),
            "enabled": True,
            "base_url": "https://api.together.xyz/v1"
        })
    
    if settings.get("ollama_enabled") and settings.get("ollama_url"):
        providers.append({
            "name": "Ollama",
            "model": settings.get("ollama_model", "llama3.2"),
            "enabled": True,
            "base_url": settings.get("ollama_url", "http://localhost:11434")
        })
    
    return {
        "success": True,
        "settings": settings,
        "preferences": preferences,
        "providers": providers
    }

@router.post("/settings")
def save_settings(req: SettingsRequest):
    """Save settings and preferences"""
    try:
        # Save all settings
        for key, value in req.settings.items():
            database.set_setting(key, value)
        
        # Save all preferences
        for key, value in req.preferences.items():
            database.set_preference(key, value)
        
        return {"success": True, "message": "Settings saved"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/settings/{key}")
def get_setting(key: str):
    """Get a specific setting"""
    value = database.get_setting(key)
    if value is None:
        raise HTTPException(status_code=404, detail=f"Setting '{key}' not found")
    return {"key": key, "value": value}

@router.post("/settings/{key}")
def set_setting(key: str, value: Any):
    """Set a specific setting"""
    try:
        database.set_setting(key, value)
        return {"success": True, "key": key, "value": value}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/settings/{key}")
def delete_setting(key: str):
    """Delete a specific setting"""
    try:
        conn = database.get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM settings WHERE key = ?", (key,))
        conn.commit()
        conn.close()
        return {"success": True, "message": f"Setting '{key}' deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
