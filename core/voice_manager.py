"""
Voice manager for coordinating speech-to-text and text-to-speech operations.
Handles threading to prevent UI freezing.
"""

import os
import threading
from typing import Callable, Optional
from enum import Enum

from core.logger import logger
from core.config import config


class VoiceState(Enum):
    """Voice system states."""
    IDLE = "idle"
    LISTENING = "listening"
    PROCESSING = "processing"
    SPEAKING = "speaking"
    ERROR = "error"


class VoiceManager:
    """Manages voice input and output operations."""
    
    def __init__(self):
        self.state = VoiceState.IDLE
        self.state_callbacks: list = []
        self._listen_thread: Optional[threading.Thread] = None
        self._tts_thread: Optional[threading.Thread] = None
        self._stop_listening = threading.Event()
        self.last_error: Optional[str] = None
    
    def on_state_changed(self, callback: Callable[[VoiceState], None]) -> None:
        """Register callback for state changes."""
        self.state_callbacks.append(callback)
    
    def set_state(self, state: VoiceState) -> None:
        """Update voice state and notify callbacks."""
        old_state = self.state
        self.state = state
        logger.debug(f"Voice state: {old_state.value} -> {state.value}")
        
        for callback in self.state_callbacks:
            try:
                callback(state)
            except Exception as e:
                logger.error(f"Error in state callback: {e}")
    
    def listen_async(
        self,
        on_result: Callable[[str], None],
        on_error: Callable[[str], None]
    ) -> None:
        """Start listening for voice input (async, non-blocking)."""
        if self._listen_thread and self._listen_thread.is_alive():
            logger.warning("Already listening")
            return
        
        self._stop_listening.clear()
        self._listen_thread = threading.Thread(
            target=self._listen_worker,
            args=(on_result, on_error),
            daemon=True,
            name="VoiceListener"
        )
        self._listen_thread.start()
        logger.info("Async listening started")
    
    def stop_listening(self) -> None:
        """Stop current listening session."""
        self._stop_listening.set()
        if self._listen_thread:
            self._listen_thread.join(timeout=5)
            self._listen_thread = None
        self.set_state(VoiceState.IDLE)
        logger.info("Listening stopped")
    
    def speak_async(
        self,
        text: str,
        on_complete: Optional[Callable[[], None]] = None
    ) -> None:
        """Speak text (async, non-blocking)."""
        if self._tts_thread and self._tts_thread.is_alive():
            logger.warning("Already speaking")
            return
        
        self._tts_thread = threading.Thread(
            target=self._speak_worker,
            args=(text, on_complete),
            daemon=True,
            name="VoiceSpeaker"
        )
        self._tts_thread.start()
    
    def _listen_worker(
        self,
        on_result: Callable[[str], None],
        on_error: Callable[[str], None]
    ) -> None:
        """Worker thread for listening."""
        try:
            self.set_state(VoiceState.LISTENING)
            
            try:
                import speech_recognition as sr
            except ImportError:
                error_msg = "Speech recognition not installed"
                logger.error(error_msg)
                self.last_error = error_msg
                on_error(error_msg)
                self.set_state(VoiceState.ERROR)
                return
            
            recognizer = sr.Recognizer()
            
            try:
                with sr.Microphone() as source:
                    logger.debug("Listening for voice input...")
                    recognizer.adjust_for_ambient_noise(source, duration=0.5)
                    audio = recognizer.listen(
                        source,
                        timeout=config.voice.timeout_secs
                    )
                
                # Try online first, fallback to offline
                text = None
                try:
                    logger.debug("Using Google Speech Recognition")
                    text = recognizer.recognize_google(audio)
                except Exception as e:
                    logger.warning(f"Google STT failed: {e}")
                    # Try other services if available
                    try:
                        logger.debug("Trying Sphinx (offline)")
                        text = recognizer.recognize_sphinx(audio)
                    except Exception as e2:
                        logger.error(f"Sphinx STT failed: {e2}")
                
                if text:
                    logger.info(f"Recognized: {text}")
                    on_result(text)
                else:
                    error_msg = "Could not understand audio"
                    self.last_error = error_msg
                    on_error(error_msg)
            
            except sr.UnknownValueError:
                error_msg = "Could not understand audio"
                logger.warning(error_msg)
                self.last_error = error_msg
                on_error(error_msg)
            except sr.RequestError as e:
                error_msg = f"Speech service error: {str(e)}"
                logger.error(error_msg)
                self.last_error = error_msg
                on_error(error_msg)
        
        except Exception as e:
            error_msg = f"Unexpected listening error: {str(e)}"
            logger.exception(error_msg)
            self.last_error = error_msg
            on_error(error_msg)
            self.set_state(VoiceState.ERROR)
        
        finally:
            self.set_state(VoiceState.IDLE)
    
    def _speak_worker(
        self,
        text: str,
        on_complete: Optional[Callable[[], None]]
    ) -> None:
        """Worker thread for speaking."""
        try:
            self.set_state(VoiceState.SPEAKING)
            
            success = False
            
            # Try ElevenLabs first if available
            if config.voice.engine == "elevenlabs":
                success = self._speak_elevenlabs(text)
            
            # Fallback to pyttsx3
            if not success:
                success = self._speak_pyttsx3(text)
            
            if not success:
                logger.warning("TTS failed with all engines")
            
            if on_complete:
                on_complete()
        
        except Exception as e:
            logger.exception(f"TTS error: {e}")
            self.last_error = str(e)
        
        finally:
            self.set_state(VoiceState.IDLE)
    
    def _speak_pyttsx3(self, text: str) -> bool:
        """Speak using pyttsx3."""
        try:
            import pyttsx3
            engine = pyttsx3.init()
            engine.setProperty('rate', config.voice.rate)
            engine.setProperty('volume', config.voice.volume)
            engine.say(text)
            engine.runAndWait()
            logger.debug("pyttsx3 TTS completed")
            return True
        except Exception as e:
            logger.error(f"pyttsx3 TTS failed: {e}")
            return False
    
    def _speak_elevenlabs(self, text: str) -> bool:
        """Speak using ElevenLabs."""
        try:
            from elevenlabs.client import ElevenLabs
            from elevenlabs import play
            
            api_key = os.getenv("ELEVENLABS_API_KEY")
            if not api_key:
                logger.debug("ElevenLabs API key not set")
                return False
            
            client = ElevenLabs(api_key=api_key)
            audio = client.generate(text=text, voice="Jarvis")
            play(audio)
            logger.debug("ElevenLabs TTS completed")
            return True
        except Exception as e:
            logger.debug(f"ElevenLabs TTS failed: {e}")
            return False


# Singleton instance
voice_manager = VoiceManager()

