"""
Speech-to-Text (STT) module for voice input capture.
Supports both online (Google) and offline (Sphinx) recognition.
"""

import threading
from typing import Optional, Callable

try:
    import speech_recognition as sr
except ImportError:
    sr = None

from core.logger import logger
from core.config import config


class SpeechToText:
    """Speech-to-Text handler with fallback support."""
    
    def __init__(self):
        self.recognizer = None
        self._initialized = False
    
    def _ensure_initialized(self) -> bool:
        """Initialize recognizer only when needed (lazy initialization)."""
        if self._initialized:
            return self.recognizer is not None
        
        if sr is None:
            logger.warning("SpeechRecognition not installed")
            self._initialized = True
            return False
        
        try:
            self.recognizer = sr.Recognizer()
            logger.info("Speech recognizer initialized")
            self._initialized = True
            return True
        except Exception as e:
            logger.error(f"Failed to initialize recognizer: {e}")
            self._initialized = True
            return False
    
    def _setup(self) -> None:
        """Initialize speech recognizer (lazy, not called at module load)."""
        if self._initialized:
            return
        self._ensure_initialized()
    
    def listen_once(
        self,
        timeout: float = 10.0,
        phrase_time_limit: float = 15.0
    ) -> Optional[str]:
        """Listen for a single voice command (blocking)."""
        if not self._ensure_initialized():
            logger.error("Speech recognition not available")
            return None
        
        try:
            with sr.Microphone() as source:
                logger.debug("Listening for voice input...")
                self.recognizer.adjust_for_ambient_noise(source, duration=0.5)
                audio = self.recognizer.listen(
                    source,
                    timeout=timeout,
                    phrase_time_limit=phrase_time_limit
                )
            
            # Try Google first
            try:
                logger.debug("Recognizing with Google Speech Recognition...")
                text = self.recognizer.recognize_google(audio)
                logger.info(f"Recognized (Google): {text}")
                return text
            except sr.UnknownValueError:
                logger.debug("Google: Could not understand audio")
            except sr.RequestError as e:
                logger.debug(f"Google: Service error: {e}")
            
            # Try Sphinx (offline) as fallback
            try:
                logger.debug("Recognizing with PocketSphinx (offline)...")
                text = self.recognizer.recognize_sphinx(audio)
                logger.info(f"Recognized (Sphinx): {text}")
                return text
            except sr.UnknownValueError:
                logger.warning("Sphinx: Could not understand audio")
            except sr.RequestError as e:
                logger.warning(f"Sphinx: Unavailable or error: {e}")
            
            return None
        
        except sr.UnknownValueValue:
            logger.warning("Could not understand audio")
            return None
        except sr.RequestError as e:
            logger.error(f"Speech service error: {e}")
            return None
        except Exception as e:
            logger.exception(f"Unexpected error in listen_once: {e}")
            return None
    
    def listen_async(
        self,
        on_result: Callable[[str], None],
        on_error: Callable[[str], None],
        timeout: float = 10.0
    ) -> None:
        """Listen for voice input (non-blocking, runs in thread)."""
        thread = threading.Thread(
            target=self._listen_worker,
            args=(on_result, on_error, timeout),
            daemon=True,
            name="STTWorker"
        )
        thread.start()
    
    def _listen_worker(
        self,
        on_result: Callable[[str], None],
        on_error: Callable[[str], None],
        timeout: float
    ) -> None:
        """Worker thread for async listening."""
        try:
            text = self.listen_once(timeout=timeout)
            if text:
                on_result(text)
            else:
                on_error("No speech detected")
        except Exception as e:
            logger.exception(f"STT worker error: {e}")
            on_error(f"Error: {str(e)}")


# Singleton instance
stt = SpeechToText()
