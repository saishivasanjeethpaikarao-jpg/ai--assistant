"""
Text-to-Speech (TTS) module for voice output generation.
Supports pyttsx3 (offline) and ElevenLabs (online) engines.
"""

import os
import threading
from typing import Optional, Callable

try:
    import pyttsx3
except ImportError:
    pyttsx3 = None

try:
    from elevenlabs.client import ElevenLabs
    from elevenlabs import play as el_play
except ImportError:
    ElevenLabs = None
    el_play = None

from core.logger import logger
from core.config import config


class TextToSpeech:
    """Text-to-Speech handler with multiple engine support."""
    
    def __init__(self):
        self.pyttsx3_engine = None
        self.elevenlabs_client = None
        self._setup()
    
    def _setup(self) -> None:
        """Initialize TTS engines."""
        # Initialize pyttsx3
        if pyttsx3:
            try:
                self.pyttsx3_engine = pyttsx3.init()
                self.pyttsx3_engine.setProperty('rate', config.voice.rate)
                self.pyttsx3_engine.setProperty('volume', config.voice.volume)
                logger.info("pyttsx3 engine initialized")
            except Exception as e:
                logger.error(f"Failed to initialize pyttsx3: {e}")
        
        # Initialize ElevenLabs
        if ElevenLabs:
            api_key = os.getenv("ELEVENLABS_API_KEY")
            if api_key:
                try:
                    self.elevenlabs_client = ElevenLabs(api_key=api_key)
                    logger.info("ElevenLabs client initialized")
                except Exception as e:
                    logger.error(f"Failed to initialize ElevenLabs: {e}")
    
    def speak(self, text: str, engine: Optional[str] = None) -> bool:
        """Speak text using specified engine (blocking)."""
        if not text:
            return False
        
        engine = engine or config.voice.engine
        
        if engine == "elevenlabs" and self.elevenlabs_client:
            return self._speak_elevenlabs(text)
        elif engine == "pyttsx3" and self.pyttsx3_engine:
            return self._speak_pyttsx3(text)
        else:
            # Try fallback
            if self.pyttsx3_engine:
                return self._speak_pyttsx3(text)
            elif self.elevenlabs_client:
                return self._speak_elevenlabs(text)
            else:
                logger.error("No TTS engine available")
                return False
    
    def speak_async(
        self,
        text: str,
        on_complete: Optional[Callable[[], None]] = None,
        engine: Optional[str] = None
    ) -> None:
        """Speak text (non-blocking, runs in thread)."""
        thread = threading.Thread(
            target=self._speak_worker,
            args=(text, on_complete, engine),
            daemon=True,
            name="TTSWorker"
        )
        thread.start()
    
    def _speak_worker(
        self,
        text: str,
        on_complete: Optional[Callable[[], None]],
        engine: Optional[str]
    ) -> None:
        """Worker thread for async speaking."""
        try:
            success = self.speak(text, engine=engine)
            if on_complete:
                on_complete()
            if not success:
                logger.warning("TTS completed but may have failed")
        except Exception as e:
            logger.exception(f"TTS worker error: {e}")
    
    def _speak_pyttsx3(self, text: str) -> bool:
        """Speak using pyttsx3."""
        if not self.pyttsx3_engine:
            logger.error("pyttsx3 engine not initialized")
            return False
        
        try:
            logger.debug(f"Speaking with pyttsx3: {text[:50]}")
            self.pyttsx3_engine.say(text)
            self.pyttsx3_engine.runAndWait()
            logger.debug("pyttsx3 speech completed")
            return True
        except Exception as e:
            logger.error(f"pyttsx3 error: {e}")
            return False
    
    def _speak_elevenlabs(self, text: str) -> bool:
        """Speak using ElevenLabs."""
        if not self.elevenlabs_client or not el_play:
            logger.debug("ElevenLabs not available")
            return False
        
        try:
            logger.debug(f"Speaking with ElevenLabs: {text[:50]}")
            audio = self.elevenlabs_client.generate(text=text, voice="Jarvis")
            el_play(audio)
            logger.debug("ElevenLabs speech completed")
            return True
        except Exception as e:
            logger.error(f"ElevenLabs error: {e}")
            return False


# Singleton instance
tts = TextToSpeech()
