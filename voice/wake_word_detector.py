"""
Wake Word Detection Module

Detects "Jarvis" wake word from audio stream.
Uses PocketSphinx for lightweight, always-on detection.
Triggers voice interaction when detected.
"""

import threading
import speech_recognition as sr
from typing import Callable, Optional
from dataclasses import dataclass
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class WakeWordState(Enum):
    """Wake word detector state"""
    IDLE = "idle"
    LISTENING = "listening"
    DETECTED = "detected"
    ERROR = "error"


@dataclass
class WakeWordConfig:
    """Wake word configuration"""
    keyword: str = "jarvis"
    sensitivity: float = 1.0  # 0.0-1.0, higher = more sensitive
    timeout: int = 5  # seconds before auto-reset
    enable_pocketsphinx: bool = True
    enable_google_fallback: bool = False


class WakeWordDetector:
    """
    Detects wake word ("Jarvis") from audio stream.
    
    Uses PocketSphinx for lightweight offline detection.
    Falls back to Google speech recognition if configured.
    
    Runs in background thread for continuous listening.
    """
    
    def __init__(
        self,
        config: WakeWordConfig = None,
        on_detected: Optional[Callable[[], None]] = None
    ):
        """
        Initialize wake word detector.
        
        Args:
            config: WakeWordConfig object
            on_detected: Callback when wake word detected
        """
        self.config = config or WakeWordConfig()
        self.on_detected = on_detected
        self.recognizer = sr.Recognizer()
        self.microphone = sr.Microphone()
        
        self.state = WakeWordState.IDLE
        self._running = False
        self._thread: Optional[threading.Thread] = None
        
        # Initialize PocketSphinx
        self._init_pocketsphinx()
        
        logger.info(f"WakeWordDetector initialized with keyword: '{self.config.keyword}'")
    
    def _init_pocketsphinx(self) -> None:
        """Initialize PocketSphinx for offline detection"""
        try:
            # Try to load PocketSphinx for faster, offline detection
            from pocketsphinx import Decoder
            self.pocketsphinx_decoder = Decoder()
            self.pocketsphinx_decoder.set_keyphrase(
                'wake',
                self.config.keyword.lower()
            )
            logger.debug("PocketSphinx initialized for wake word detection")
        except (ImportError, Exception) as e:
            logger.warning(f"PocketSphinx not available: {e}")
            self.pocketsphinx_decoder = None
    
    def start(self) -> None:
        """Start background listening for wake word"""
        if self._running:
            logger.warning("Wake word detector already running")
            return
        
        self._running = True
        self.state = WakeWordState.LISTENING
        
        # Start background thread
        self._thread = threading.Thread(
            target=self._listen_loop,
            daemon=True,
            name="WakeWordDetector"
        )
        self._thread.start()
        logger.info("Wake word detector started")
    
    def stop(self) -> None:
        """Stop background listening"""
        self._running = False
        self.state = WakeWordState.IDLE
        
        if self._thread:
            self._thread.join(timeout=2.0)
            self._thread = None
        
        logger.info("Wake word detector stopped")
    
    def _listen_loop(self) -> None:
        """Background listening loop - runs in thread"""
        while self._running:
            try:
                self._listen_once()
            except Exception as e:
                logger.error(f"Error in listen loop: {e}")
                self.state = WakeWordState.ERROR
                # Continue listening despite error
    
    def _listen_once(self) -> None:
        """Listen for one phrase and check for wake word"""
        try:
            with self.microphone as source:
                # Adjust for ambient noise
                self.recognizer.adjust_for_ambient_noise(source, duration=0.1)
                
                # Listen with timeout
                audio = self.recognizer.listen(
                    source,
                    timeout=self.config.timeout,
                    phrase_time_limit=3
                )
            
            # Check for wake word
            if self._check_wake_word(audio):
                self.state = WakeWordState.DETECTED
                logger.info(f"Wake word '{self.config.keyword}' detected!")
                
                if self.on_detected:
                    self.on_detected()
                
                self.state = WakeWordState.LISTENING
        
        except sr.UnknownValueError:
            # No speech detected, continue
            pass
        except sr.RequestError as e:
            logger.warning(f"Speech recognition error: {e}")
        except Exception as e:
            logger.error(f"Error in listen_once: {e}")
    
    def _check_wake_word(self, audio: sr.AudioData) -> bool:
        """
        Check if audio contains wake word.
        
        Uses PocketSphinx first (offline), then falls back to Google.
        """
        # Try PocketSphinx (offline, fastest)
        if self.pocketsphinx_decoder:
            try:
                if self._check_with_pocketsphinx(audio):
                    return True
            except Exception as e:
                logger.debug(f"PocketSphinx check failed: {e}")
        
        # Fall back to Google speech recognition
        if self.config.enable_google_fallback:
            try:
                if self._check_with_google(audio):
                    return True
            except Exception as e:
                logger.debug(f"Google recognition failed: {e}")
        
        return False
    
    def _check_with_pocketsphinx(self, audio: sr.AudioData) -> bool:
        """Check wake word using PocketSphinx (offline)"""
        if not self.pocketsphinx_decoder:
            return False
        
        try:
            # Convert audio to raw format for PocketSphinx
            wav_data = audio.get_wav_data()
            
            # Process with PocketSphinx
            self.pocketsphinx_decoder.start_utt()
            self.pocketsphinx_decoder.process_raw(wav_data, False, False)
            self.pocketsphinx_decoder.end_utt()
            
            # Check if wake word was recognized
            result = self.pocketsphinx_decoder.hyp()
            if result and result.hypstr:
                recognized_text = result.hypstr.lower()
                logger.debug(f"PocketSphinx recognized: {recognized_text}")
                
                if self.config.keyword.lower() in recognized_text:
                    return True
        
        except Exception as e:
            logger.debug(f"PocketSphinx processing error: {e}")
        
        return False
    
    def _check_with_google(self, audio: sr.AudioData) -> bool:
        """Check wake word using Google Speech Recognition (online)"""
        try:
            text = self.recognizer.recognize_google(audio)
            text_lower = text.lower()
            logger.debug(f"Google recognized: {text}")
            
            # Check for wake word (allow some variations)
            if self.config.keyword.lower() in text_lower:
                return True
        
        except sr.UnknownValueError:
            pass  # No speech detected
        except sr.RequestError as e:
            logger.debug(f"Google API error: {e}")
        
        return False
    
    def get_state(self) -> WakeWordState:
        """Get current detector state"""
        return self.state
    
    def is_running(self) -> bool:
        """Check if detector is running"""
        return self._running


class BackgroundWakeWordListener:
    """
    Manages continuous background listening for wake word.
    
    Handles startup/shutdown, state management, and triggers
    voice interaction when wake word detected.
    """
    
    def __init__(
        self,
        keyword: str = "jarvis",
        on_activated: Optional[Callable[[], None]] = None
    ):
        """
        Initialize background listener.
        
        Args:
            keyword: Wake word to listen for
            on_activated: Callback when activated
        """
        self.keyword = keyword
        self.on_activated = on_activated
        self.config = WakeWordConfig(keyword=keyword)
        self.detector = WakeWordDetector(
            config=self.config,
            on_detected=self._on_wake_word_detected
        )
        self._active = False
    
    def activate(self) -> None:
        """Activate background listening"""
        if self._active:
            return
        
        self._active = True
        self.detector.start()
        logger.info("Background wake word listener activated")
    
    def deactivate(self) -> None:
        """Deactivate background listening"""
        if not self._active:
            return
        
        self._active = False
        self.detector.stop()
        logger.info("Background wake word listener deactivated")
    
    def _on_wake_word_detected(self) -> None:
        """Called when wake word is detected"""
        if self.on_activated:
            self.on_activated()
    
    def is_active(self) -> bool:
        """Check if listener is active"""
        return self._active
    
    def set_callback(self, callback: Callable[[], None]) -> None:
        """Set callback for wake word detection"""
        self.on_activated = callback
