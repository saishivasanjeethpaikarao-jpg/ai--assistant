"""
Premium Voice Manager - Fish Audio & ElevenLabs
High-quality AI voices like Jarvis/Siri
"""

import os
import logging
from typing import Optional
from datetime import datetime

try:
    import requests
except ImportError:
    requests = None

logger = logging.getLogger(__name__)


class PremiumVoiceManager:
    """Manages premium AI voices from Fish Audio and ElevenLabs."""
    
    def __init__(self):
        self.fish_api_key = os.getenv("FISH_AUDIO_API_KEY", "").strip()
        self.fish_reference_id = os.getenv("FISH_AUDIO_REFERENCE_ID", "").strip()
        self.fish_model = os.getenv("FISH_AUDIO_MODEL", "s2-pro").strip()
        
        self.elevenlabs_api_key = os.getenv("ELEVENLABS_API_KEY", "").strip()
        self.elevenlabs_voice = os.getenv("ELEVENLABS_VOICE", "Jarvis").strip()
        
        self.preferred_provider = os.getenv("PREFERRED_VOICE_PROVIDER", "fish").strip()
        
        logger.info(f"Premium Voice Manager initialized")
        logger.info(f"Fish Audio: {'✓' if self.fish_api_key else '✗'}")
        logger.info(f"ElevenLabs: {'✓' if self.elevenlabs_api_key else '✗'}")
        logger.info(f"Preferred: {self.preferred_provider}")
    
    def synthesize_speech(self, text: str, provider: Optional[str] = None) -> Optional[str]:
        """
        Synthesize speech using premium AI voice.
        
        Args:
            text: Text to synthesize
            provider: 'fish' or 'elevenlabs' (uses preferred if None)
            
        Returns:
            Audio file path or None
        """
        provider = provider or self.preferred_provider
        
        if provider == "fish" and self.fish_api_key:
            return self._synthesize_fish(text)
        elif provider == "elevenlabs" and self.elevenlabs_api_key:
            return self._synthesize_elevenlabs(text)
        else:
            # Try fallback
            if self.fish_api_key:
                return self._synthesize_fish(text)
            elif self.elevenlabs_api_key:
                return self._synthesize_elevenlabs(text)
            else:
                logger.error("No premium voice provider available")
                return None
    
    def _synthesize_fish(self, text: str) -> Optional[str]:
        """Synthesize using Fish Audio."""
        if not self.fish_api_key or not self.fish_reference_id:
            logger.error("Fish Audio not configured")
            return None
        
        try:
            from backend.voice.fish_audio import fish_tts_to_file
            
            audio_path = fish_tts_to_file(
                text=text,
                api_key=self.fish_api_key,
                reference_id=self.fish_reference_id,
                model=self.fish_model
            )
            
            logger.info(f"Fish Audio synthesis complete: {audio_path}")
            return audio_path
            
        except Exception as e:
            logger.error(f"Fish Audio synthesis failed: {e}")
            return None
    
    def _synthesize_elevenlabs(self, text: str) -> Optional[str]:
        """Synthesize using ElevenLabs."""
        if not self.elevenlabs_api_key:
            logger.error("ElevenLabs not configured")
            return None
        
        if requests is None:
            logger.error("requests not installed")
            return None
        
        try:
            url = "https://api.elevenlabs.io/v1/text-to-speech/" + self.elevenlabs_voice
            headers = {
                "xi-api-key": self.elevenlabs_api_key,
                "Content-Type": "application/json"
            }
            body = {
                "text": text,
                "model_id": "eleven_multilingual_v2",
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.75
                }
            }
            
            response = requests.post(url, json=body, headers=headers, timeout=60)
            
            if response.ok:
                import tempfile
                fd, path = tempfile.mkstemp(suffix=".mp3")
                os.close(fd)
                with open(path, "wb") as f:
                    f.write(response.content)
                
                logger.info(f"ElevenLabs synthesis complete: {path}")
                return path
            else:
                logger.error(f"ElevenLabs API error: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"ElevenLabs synthesis failed: {e}")
            return None
    
    def play_premium_voice(self, text: str, provider: Optional[str] = None) -> bool:
        """
        Synthesize and play premium voice.
        
        Args:
            text: Text to speak
            provider: 'fish' or 'elevenlabs' (uses preferred if None)
            
        Returns:
            True if successful
        """
        audio_path = self.synthesize_speech(text, provider)
        
        if audio_path:
            try:
                from playsound import playsound
                playsound(audio_path)
                
                # Clean up
                try:
                    os.unlink(audio_path)
                except OSError:
                    pass
                
                return True
            except Exception as e:
                logger.error(f"Playback failed: {e}")
                return False
        else:
            return False
    
    def clone_voice(self, audio_path: str, provider: str = "fish") -> Optional[str]:
        """
        Clone voice from audio sample.
        
        Args:
            audio_path: Path to audio file
            provider: 'fish' or 'elevenlabs'
            
        Returns:
            Voice model ID or None
        """
        if provider == "fish":
            return self._clone_voice_fish(audio_path)
        elif provider == "elevenlabs":
            return self._clone_voice_elevenlabs(audio_path)
        else:
            logger.error(f"Unknown provider: {provider}")
            return None
    
    def _clone_voice_fish(self, audio_path: str) -> Optional[str]:
        """Clone voice using Fish Audio."""
        if not self.fish_api_key:
            logger.error("Fish Audio not configured")
            return None
        
        try:
            from backend.voice.fish_audio import fish_create_voice_model
            
            model_id = fish_create_voice_model(
                api_key=self.fish_api_key,
                title=f"Jarvis Clone {datetime.now().strftime('%Y%m%d')}",
                audio_path=audio_path
            )
            
            logger.info(f"Voice cloned with Fish Audio: {model_id}")
            return model_id
            
        except Exception as e:
            logger.error(f"Fish Audio voice cloning failed: {e}")
            return None
    
    def _clone_voice_elevenlabs(self, audio_path: str) -> Optional[str]:
        """Clone voice using ElevenLabs."""
        if not self.elevenlabs_api_key:
            logger.error("ElevenLabs not configured")
            return None
        
        if requests is None:
            logger.error("requests not installed")
            return None
        
        try:
            url = "https://api.elevenlabs.io/v1/voices/add"
            headers = {
                "xi-api-key": self.elevenlabs_api_key
            }
            
            with open(audio_path, "rb") as f:
                files = {"files": (audio_path, f, "audio/mpeg")}
                response = requests.post(url, files=files, headers=headers)
            
            if response.ok:
                voice_id = response.json().get("voice_id")
                logger.info(f"Voice cloned with ElevenLabs: {voice_id}")
                return voice_id
            else:
                logger.error(f"ElevenLabs cloning error: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"ElevenLabs voice cloning failed: {e}")
            return None
    
    def get_available_voices(self) -> dict:
        """Get information about available voices."""
        return {
            "fish_audio": {
                "available": bool(self.fish_api_key),
                "reference_id": self.fish_reference_id if self.fish_api_key else None,
                "model": self.fish_model
            },
            "elevenlabs": {
                "available": bool(self.elevenlabs_api_key),
                "voice": self.elevenlabs_voice if self.elevenlabs_api_key else None
            },
            "preferred": self.preferred_provider
        }


# Singleton instance
_premium_voice_manager: Optional[PremiumVoiceManager] = None


def get_premium_voice_manager() -> PremiumVoiceManager:
    """Get or create premium voice manager instance."""
    global _premium_voice_manager
    if _premium_voice_manager is None:
        _premium_voice_manager = PremiumVoiceManager()
    return _premium_voice_manager
