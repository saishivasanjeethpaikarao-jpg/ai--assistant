"""
Voice Personality Configuration
Settings for premium AI voices like Airis/Siri
"""

import os
from typing import Dict, Any
from core.config import config

# Voice Personality Profiles
VOICE_PERSONALITIES = {
    "airis": {
        "name": "Airis",
        "description": "Professional, calm, British-accented AI assistant",
        "traits": {
            "tone": "professional",
            "pace": "medium",
            "warmth": "moderate",
            "clarity": "high"
        },
        "fish_model": "s2-pro",
        "elevenlabs_voice": "Airis"
    },
    "siri": {
        "name": "Siri",
        "description": "Friendly, helpful, American-accented assistant",
        "traits": {
            "tone": "friendly",
            "pace": "medium-fast",
            "warmth": "high",
            "clarity": "high"
        },
        "fish_model": "s2-pro",
        "elevenlabs_voice": "Bella"
    },
    "assistant": {
        "name": "Assistant",
        "description": "Neutral, efficient, clear AI assistant",
        "traits": {
            "tone": "neutral",
            "pace": "medium",
            "warmth": "low",
            "clarity": "very-high"
        },
        "fish_model": "s2-pro",
        "elevenlabs_voice": "Adam"
    },
    "custom": {
        "name": "Custom",
        "description": "Custom cloned voice",
        "traits": {
            "tone": "custom",
            "pace": "custom",
            "warmth": "custom",
            "clarity": "custom"
        },
        "fish_model": os.getenv("FISH_AUDIO_MODEL", "s2-pro"),
        "elevenlabs_voice": os.getenv("ELEVENLABS_VOICE", "Airis")
    }
}


class VoicePersonalityConfig:
    """Manages voice personality settings."""
    
    def __init__(self):
        self.current_personality = os.getenv("VOICE_PERSONALITY", "airis").strip()
        self.provider = os.getenv("PREFERRED_VOICE_PROVIDER", "fish").strip()
        
        # Voice settings
        self.voice_rate = config.voice.rate
        self.voice_volume = config.voice.volume
        self.voice_pitch = 1.0
    
    def get_personality(self, personality_name: str) -> Dict[str, Any]:
        """Get personality profile by name."""
        return VOICE_PERSONALITIES.get(personality_name, VOICE_PERSONALITIES["airis"])
    
    def set_personality(self, personality_name: str) -> bool:
        """Set current personality."""
        if personality_name in VOICE_PERSONALITIES:
            self.current_personality = personality_name
            return True
        return False
    
    def get_current_profile(self) -> Dict[str, Any]:
        """Get current personality profile."""
        return self.get_personality(self.current_personality)
    
    def get_voice_settings(self) -> Dict[str, Any]:
        """Get current voice settings."""
        profile = self.get_current_profile()
        return {
            "personality": self.current_personality,
            "provider": self.provider,
            "fish_model": profile.get("fish_model"),
            "elevenlabs_voice": profile.get("elevenlabs_voice"),
            "rate": self.voice_rate,
            "volume": self.voice_volume,
            "pitch": self.voice_pitch
        }
    
    def update_settings(self, settings: Dict[str, Any]) -> bool:
        """Update voice settings."""
        try:
            if "personality" in settings:
                self.set_personality(settings["personality"])
            if "provider" in settings:
                self.provider = settings["provider"]
            if "rate" in settings:
                self.voice_rate = settings["rate"]
            if "volume" in settings:
                self.voice_volume = settings["volume"]
            if "pitch" in settings:
                self.voice_pitch = settings["pitch"]
            return True
        except Exception:
            return False
    
    def list_personalities(self) -> Dict[str, str]:
        """List available personalities."""
        return {
            name: profile["description"]
            for name, profile in VOICE_PERSONALITIES.items()
        }


# Singleton instance
_voice_config: VoicePersonalityConfig = None


def get_voice_config() -> VoicePersonalityConfig:
    """Get or create voice config instance."""
    global _voice_config
    if _voice_config is None:
        _voice_config = VoicePersonalityConfig()
    return _voice_config
