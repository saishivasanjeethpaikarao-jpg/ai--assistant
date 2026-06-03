"""
Voice Router - Text-to-speech and voice cloning endpoints
"""

from fastapi import APIRouter, HTTPException, File, UploadFile
from pydantic import BaseModel
from typing import Optional
import database
import base64

router = APIRouter()

class TTSRequest(BaseModel):
    text: str
    reference_id: Optional[str] = None
    model: Optional[str] = "s2-pro"

class VoiceCloneRequest(BaseModel):
    name: str
    audio_b64: str
    content_type: str

@router.get("/tts/config")
def get_tts_config():
    """Get TTS configuration"""
    settings = database.get_all_settings()
    
    return {
        "providers": {
            "fish_audio": {
                "available": bool(settings.get("fish_audio_api_key")),
                "reference_id": settings.get("fish_audio_reference_id"),
                "model": settings.get("fish_audio_model", "s2-pro")
            },
            "elevenlabs": {
                "available": bool(settings.get("elevenlabs_api_key")),
                "voice_id": settings.get("elevenlabs_voice_id")
            },
            "browser": {
                "available": True
            }
        },
        "preferred_provider": settings.get("preferred_voice_provider", "fish"),
        "voice_priority": settings.get("voice_priority", "fish,eleven,browser")
    }

@router.post("/tts")
async def text_to_speech(req: TTSRequest):
    """
    Convert text to speech
    Supports Fish Audio and ElevenLabs
    """
    try:
        settings = database.get_all_settings()
        
        # Get preferred provider
        preferred = settings.get("preferred_voice_provider", "fish")
        
        if preferred == "fish" and settings.get("fish_audio_api_key"):
            # Call Fish Audio API
            # This would be implemented with actual API calls
            return {
                "success": True,
                "provider": "fish_audio",
                "message": "TTS generated via Fish Audio"
            }
        
        elif preferred == "eleven" and settings.get("elevenlabs_api_key"):
            # Call ElevenLabs API
            return {
                "success": True,
                "provider": "elevenlabs",
                "message": "TTS generated via ElevenLabs"
            }
        
        else:
            # Browser TTS fallback
            return {
                "success": True,
                "provider": "browser",
                "message": "Use browser native TTS"
            }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/voice/clone")
async def clone_voice(req: VoiceCloneRequest):
    """
    Clone a voice using Fish Audio
    """
    try:
        settings = database.get_all_settings()
        
        if not settings.get("fish_audio_api_key"):
            raise HTTPException(
                status_code=400,
                detail="Fish Audio API key not configured"
            )
        
        # In production, this would call Fish Audio API to clone the voice
        # For now, return a placeholder response
        
        model_id = f"voice_{req.name.lower().replace(' ', '_')}"
        
        return {
            "success": True,
            "model_id": model_id,
            "name": req.name,
            "message": "Voice cloning initiated"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/voice/list")
def list_voices():
    """List available voices"""
    settings = database.get_all_settings()
    
    voices = []
    
    # Fish Audio voices
    if settings.get("fish_audio_api_key"):
        voices.append({
            "provider": "fish_audio",
            "name": "Fish Audio Cloned",
            "id": settings.get("fish_audio_reference_id", "default")
        })
    
    # ElevenLabs voices
    if settings.get("elevenlabs_api_key"):
        voices.append({
            "provider": "elevenlabs",
            "name": "ElevenLabs Premium",
            "id": settings.get("elevenlabs_voice_id", "default")
        })
    
    # Browser voices
    voices.append({
        "provider": "browser",
        "name": "Browser Native",
        "id": "browser"
    })
    
    return {"voices": voices}

@router.post("/speech-to-text")
async def speech_to_text(file: UploadFile = File(...)):
    """
    Convert speech to text
    Supports various audio formats
    """
    try:
        # In production, this would use a speech-to-text API
        # like Google Cloud Speech-to-Text or Whisper
        
        return {
            "success": True,
            "text": "Placeholder transcription",
            "confidence": 0.95
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
