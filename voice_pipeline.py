"""
Voice pipeline - Complete voice interaction flow.
Connects STT → Command Engine → TTS with proper threading.
"""

import threading
from typing import Callable, Optional

from core.logger import logger
from core.command_engine import command_engine
from core.voice_manager import voice_manager, VoiceState
from voice import stt, tts
from ai_integration import ai_router


class VoicePipeline:
    """Manages complete voice input-to-output pipeline."""
    
    def __init__(self):
        self.is_active = False
        self._listen_thread: Optional[threading.Thread] = None
        self.on_error: Optional[Callable[[str], None]] = None
    
    def set_error_handler(self, callback: Callable[[str], None]) -> None:
        """Set callback for errors."""
        self.on_error = callback
    
    def start_voice_interaction(self) -> None:
        """Start listening for voice input."""
        if self.is_active:
            logger.warning("Voice interaction already active")
            return
        
        self.is_active = True
        logger.info("Starting voice interaction...")
        
        # Start listening in background thread
        voice_manager.listen_async(
            on_result=self._on_speech_recognized,
            on_error=self._on_listen_error
        )
    
    def stop_voice_interaction(self) -> None:
        """Stop voice interaction."""
        self.is_active = False
        voice_manager.stop_listening()
        logger.info("Voice interaction stopped")
    
    def _on_speech_recognized(self, text: str) -> None:
        """Callback when speech is recognized."""
        try:
            logger.info(f"Recognized: {text}")
            
            # Update UI state
            voice_manager.set_state(VoiceState.PROCESSING)
            
            # Execute command
            response = command_engine.execute(text)
            
            logger.info(f"Command response: {response[:50]}")
            
            # Speak response
            self._speak_response(response)
        
        except Exception as e:
            logger.exception(f"Error processing speech: {e}")
            self._on_listen_error(f"Error: {str(e)}")
    
    def _on_listen_error(self, error_msg: str) -> None:
        """Callback when listening fails."""
        logger.error(f"Listen error: {error_msg}")
        voice_manager.set_state(VoiceState.ERROR)
        
        # Speak error
        error_response = f"Sorry, I couldn't hear you. {error_msg}"
        self._speak_response(error_response)
        
        # Call external error handler
        if self.on_error:
            try:
                self.on_error(error_msg)
            except Exception as e:
                logger.error(f"Error handler failed: {e}")
    
    def _speak_response(self, text: str) -> None:
        """Speak the response."""
        try:
            logger.debug(f"Speaking: {text[:50]}")
            voice_manager.set_state(VoiceState.SPEAKING)
            
            # Speak and wait for completion
            tts.speak(text)
            
            voice_manager.set_state(VoiceState.IDLE)
            logger.debug("Response spoken")
        
        except Exception as e:
            logger.error(f"TTS error: {e}")
            voice_manager.set_state(VoiceState.ERROR)


class VoiceInteractiveMode:
    """Interactive voice mode for CLI."""
    
    def __init__(self):
        self.pipeline = VoicePipeline()
        self._continue = True
    
    def run(self) -> None:
        """Run interactive voice mode."""
        print("\n" + "=" * 60)
        print("JARVIS - Voice Mode")
        print("=" * 60)
        print("Say 'Jarvis' and then your command")
        print("Say 'exit' or 'quit' to stop\n")
        
        # Set error handler for UI feedback
        self.pipeline.set_error_handler(lambda err: print(f"Error: {err}"))
        
        try:
            while self._continue:
                try:
                    print("Listening...")
                    self.pipeline.start_voice_interaction()
                    
                    # Wait for interaction to complete (blocking)
                    # In real app, this would be event-driven
                    import time
                    time.sleep(30)  # Max listen time
                    
                except KeyboardInterrupt:
                    print("\nInterrupted by user")
                    break
                except Exception as e:
                    logger.exception(f"Error in voice mode: {e}")
                    print(f"Error: {e}")
        
        finally:
            self.pipeline.stop_voice_interaction()
            print("Voice mode closed")


# Singleton instance
voice_pipeline = VoicePipeline()
