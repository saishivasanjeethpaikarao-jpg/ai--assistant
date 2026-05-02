#!/usr/bin/env python3
"""
🤖 AIRIS VOICE ASSISTANT — Complete Voice-First AI Agent
Listens for voice commands, processes through 12-layer AI system, responds with natural speech.
"""

import sys
import os
import threading
import time
from typing import Optional, Callable
from enum import Enum

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Voice I/O imports
try:
    import speech_recognition as sr
except ImportError:
    print("ERROR: speech_recognition not installed")
    print("Install with: pip install SpeechRecognition pydub PyAudio pyttsx3")
    sys.exit(1)

try:
    import pyttsx3
except ImportError:
    print("ERROR: pyttsx3 not installed")
    print("Install with: pip install pyttsx3")
    sys.exit(1)

# AI System imports
from backend.system_coordinator import process_user_request
from backend.memory.adaptive_memory import log_interaction


class VoiceAssistantState(Enum):
    """Voice assistant states"""
    IDLE = "idle"
    LISTENING = "listening"
    PROCESSING = "processing"
    SPEAKING = "speaking"
    ERROR = "error"


class VoiceAssistant:
    """Complete voice-first AI assistant using 12-layer system."""
    
    def __init__(self, name: str = "AIRIS", debug: bool = False):
        """
        Initialize voice assistant.
        
        Args:
            name: Assistant name
            debug: Enable debug logging
        """
        self.name = name
        self.debug = debug
        self.is_running = False
        self.state = VoiceAssistantState.IDLE
        self.listen_thread: Optional[threading.Thread] = None
        
        # Initialize speech recognition
        self.recognizer = sr.Recognizer()
        self.recognizer.energy_threshold = 4000
        
        # Initialize text-to-speech
        self.tts_engine = pyttsx3.init()
        self.tts_engine.setProperty('rate', 150)  # Speed
        self.tts_engine.setProperty('volume', 0.9)  # Volume
        
        # Callbacks
        self.on_state_change: Optional[Callable] = None
        self.on_command_received: Optional[Callable] = None
        self.on_response_ready: Optional[Callable] = None
        self.on_error: Optional[Callable] = None
        
        if self.debug:
            print(f"[{self.name}] Initializing voice assistant...")
            print(f"  - Speech recognition: OK")
            print(f"  - Text-to-speech: OK")
            print(f"  - 12-layer AI system: Loading...")
    
    def set_state(self, new_state: VoiceAssistantState):
        """Update assistant state and notify."""
        if self.state != new_state:
            self.state = new_state
            if self.debug:
                print(f"[{self.name}] State: {new_state.value.upper()}")
            if self.on_state_change:
                self.on_state_change(new_state)
    
    def listen_for_command(self) -> Optional[str]:
        """
        Listen for voice command from microphone.
        
        Returns:
            Recognized command text or None if failed
        """
        self.set_state(VoiceAssistantState.LISTENING)
        
        try:
            with sr.Microphone() as source:
                # Adjust for ambient noise
                if self.debug:
                    print(f"[{self.name}] Adjusting for ambient noise...")
                self.recognizer.adjust_for_ambient_noise(source, duration=0.5)
                
                # Listen with timeout
                print(f"\n🎤 {self.name} is listening...")
                audio = self.recognizer.listen(source, timeout=10, phrase_time_limit=8)
        
        except sr.RequestError as e:
            error = f"Microphone error: {e}"
            if self.debug:
                print(f"[{self.name}] ERROR: {error}")
            if self.on_error:
                self.on_error(error)
            return None
        
        except sr.UnknownValueError:
            error = "Could not understand audio"
            if self.debug:
                print(f"[{self.name}] {error}")
            if self.on_error:
                self.on_error(error)
            return None
        
        except sr.Timeout:
            if self.debug:
                print(f"[{self.name}] Listening timeout")
            return None
        
        # Recognize speech
        try:
            if self.debug:
                print(f"[{self.name}] Recognizing speech...")
            
            command = self.recognizer.recognize_google(audio)
            
            print(f"✓ Heard: \"{command}\"")
            
            if self.on_command_received:
                self.on_command_received(command)
            
            return command
        
        except sr.UnknownValueError:
            error = "Speech not recognized"
            if self.debug:
                print(f"[{self.name}] {error}")
            if self.on_error:
                self.on_error(error)
            return None
        
        except sr.RequestError as e:
            error = f"Speech API error: {e}"
            if self.debug:
                print(f"[{self.name}] ERROR: {error}")
            if self.on_error:
                self.on_error(error)
            return None
    
    def process_command(self, command: str) -> str:
        """
        Process command through 12-layer AI system.
        
        Args:
            command: User command text
            
        Returns:
            AI response text
        """
        self.set_state(VoiceAssistantState.PROCESSING)
        
        try:
            if self.debug:
                print(f"[{self.name}] Processing: {command}")
            
            # Send through 12-layer system
            result = process_user_request(command)
            
            # Extract response
            response = result.get('message') or result.get('response') or str(result)
            
            if self.debug:
                print(f"[{self.name}] Response prepared: {response[:50]}...")
            
            # Log interaction for learning
            try:
                log_interaction(command, response)
            except Exception as e:
                if self.debug:
                    print(f"[{self.name}] Memory log error: {e}")
            
            if self.on_response_ready:
                self.on_response_ready(response)
            
            return response
        
        except Exception as e:
            error = f"Processing error: {str(e)}"
            if self.debug:
                print(f"[{self.name}] ERROR: {error}")
            if self.on_error:
                self.on_error(error)
            return f"Error processing command: {str(e)}"
    
    def speak_response(self, text: str):
        """
        Speak response using text-to-speech.
        
        Args:
            text: Response text to speak
        """
        self.set_state(VoiceAssistantState.SPEAKING)
        
        try:
            if self.debug:
                print(f"[{self.name}] Speaking: {text[:50]}...")
            
            print(f"\n🔊 {self.name}: {text}\n")
            
            # Use TTS engine
            self.tts_engine.say(text)
            self.tts_engine.runAndWait()
            
            if self.debug:
                print(f"[{self.name}] Speech complete")
        
        except Exception as e:
            error = f"TTS error: {str(e)}"
            if self.debug:
                print(f"[{self.name}] ERROR: {error}")
            if self.on_error:
                self.on_error(error)
    
    def run_interaction_loop(self):
        """Single voice interaction: listen → process → speak."""
        try:
            # Listen for command
            command = self.listen_for_command()
            if not command:
                self.set_state(VoiceAssistantState.IDLE)
                return
            
            # Process through AI
            response = self.process_command(command)
            
            # Speak response
            self.speak_response(response)
            
            self.set_state(VoiceAssistantState.IDLE)
        
        except Exception as e:
            error = f"Interaction error: {str(e)}"
            print(f"ERROR: {error}")
            if self.on_error:
                self.on_error(error)
            self.set_state(VoiceAssistantState.ERROR)
    
    def start_continuous(self):
        """Start continuous voice listening loop in background."""
        if self.is_running:
            print(f"[{self.name}] Already running")
            return
        
        self.is_running = True
        self.listen_thread = threading.Thread(target=self._continuous_loop, daemon=True)
        self.listen_thread.start()
        
        print(f"\n🚀 {self.name} voice assistant started (continuous mode)")
        print(f"Listening for commands... (Press Ctrl+C to stop)\n")
    
    def _continuous_loop(self):
        """Background thread: continuous listening."""
        while self.is_running:
            try:
                self.run_interaction_loop()
                time.sleep(0.5)
            except KeyboardInterrupt:
                self.stop_continuous()
                break
            except Exception as e:
                if self.debug:
                    print(f"[{self.name}] Loop error: {e}")
                self.set_state(VoiceAssistantState.ERROR)
                time.sleep(1)
    
    def stop_continuous(self):
        """Stop continuous listening loop."""
        self.is_running = False
        self.set_state(VoiceAssistantState.IDLE)
        print(f"\n[{self.name}] Stopped")
    
    def interactive_mode(self):
        """Single interaction: listen once, process, speak, exit."""
        print(f"\n{'='*50}")
        print(f"  🤖 {self.name} VOICE ASSISTANT")
        print(f"  12-Layer AI System Active")
        print(f"{'='*50}\n")
        
        self.run_interaction_loop()


def main():
    """Main entry point for voice assistant."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="AIRIS Voice Assistant with 12-Layer AI System"
    )
    parser.add_argument(
        "--mode",
        choices=["interactive", "continuous"],
        default="interactive",
        help="Run mode: single interaction (interactive) or continuous listening (continuous)"
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable debug logging"
    )
    parser.add_argument(
        "--name",
        default="AIRIS",
        help="Assistant name (default: AIRIS)"
    )
    
    args = parser.parse_args()
    
    # Create assistant
    assistant = VoiceAssistant(name=args.name, debug=args.debug)
    
    try:
        if args.mode == "continuous":
            # Continuous listening mode
            assistant.start_continuous()
            try:
                while assistant.is_running:
                    time.sleep(0.5)
            except KeyboardInterrupt:
                assistant.stop_continuous()
        else:
            # Interactive mode: single interaction
            assistant.interactive_mode()
    
    except KeyboardInterrupt:
        print("\n\nShutting down...")
    except Exception as e:
        print(f"\nFATAL ERROR: {e}")
        if args.debug:
            import traceback
            traceback.print_exc()


if __name__ == "__main__":
    main()
