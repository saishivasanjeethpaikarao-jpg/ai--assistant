"""
JARVIS MODE - Continuous Voice Assistant System
Provides persistent, always-available assistant with context memory and smart routing.
"""

import threading
import time
import logging
from typing import List, Optional, Callable
from datetime import datetime

from assistant_core import speak, listen_voice_once, handle_command
from orchestrator_v2 import SmartOrchestrator

logger = logging.getLogger(__name__)


class ConversationContext:
    """Manages short-term conversation memory."""
    
    def __init__(self, max_turns: int = 10):
        self.context: List[dict] = []
        self.max_turns = max_turns
        
    def add_turn(self, user_input: str, response: str):
        """Add a conversation turn to context."""
        self.context.append({
            "user": user_input,
            "assistant": response,
            "timestamp": datetime.now().isoformat()
        })
        
        # Keep only recent turns
        if len(self.context) > self.max_turns:
            self.context = self.context[-self.max_turns:]
    
    def get_context_string(self) -> str:
        """Get formatted context string for AI."""
        if not self.context:
            return ""
        
        lines = ["Recent conversation:"]
        for turn in self.context[-5:]:  # Last 5 turns
            lines.append(f"User: {turn['user']}")
            lines.append(f"Assistant: {turn['assistant'][:100]}...")
        
        return "\n".join(lines)
    
    def clear(self):
        """Clear conversation context."""
        self.context.clear()


class JarvisMode:
    """Continuous voice assistant with context and smart routing."""
    
    def __init__(self, orchestrator: Optional[SmartOrchestrator] = None):
        self.orchestrator = orchestrator
        self.context = ConversationContext()
        self.running = False
        self.current_task: Optional[threading.Thread] = None
        self.interrupt_requested = False
        self.state = "idle"  # idle, listening, thinking, executing, speaking
        
        # Callbacks for UI updates
        self.state_callback: Optional[Callable] = None
        self.message_callback: Optional[Callable] = None
        
    def set_state_callback(self, callback: Callable):
        """Set callback for state changes."""
        self.state_callback = callback
        
    def set_message_callback(self, callback: Callable):
        """Set callback for messages."""
        self.message_callback = callback
        
    def _update_state(self, new_state: str):
        """Update state and notify callback."""
        self.state = new_state
        if self.state_callback:
            self.state_callback(new_state)
    
    def _send_message(self, message: str):
        """Send message to UI."""
        if self.message_callback:
            self.message_callback(message)
    
    def is_simple_command(self, text: str) -> bool:
        """
        Determine if command is simple (quick response) or complex (needs agent).
        
        Simple: open, run, search, play, what is, tell me
        Complex: analyze, research, prepare, build, organize, setup
        """
        text_lower = text.lower()
        
        simple_keywords = [
            "open", "run", "search", "play", "what is", "tell me",
            "what's", "how to", "who is", "when is", "where is"
        ]
        
        complex_keywords = [
            "analyze", "research", "prepare", "build", "organize",
            "setup", "plan", "debug", "optimize", "create project"
        ]
        
        # Check for interrupt commands
        if any(word in text_lower for word in ["stop", "wait", "cancel", "never mind"]):
            return True  # Simple interrupt
        
        # Check for complex keywords
        if any(kw in text_lower for kw in complex_keywords):
            return False  # Complex, needs agent
        
        # Default to simple
        return True
    
    def process_command(self, command: str) -> str:
        """Process command with context and smart routing."""
        if self.interrupt_requested:
            self.interrupt_requested = False
            return "Task cancelled."
        
        # Voice feedback
        speak("Processing...")
        
        # Add context
        context_str = self.context.get_context_string()
        if context_str:
            full_command = f"{context_str}\n\nCurrent request: {command}"
        else:
            full_command = command
        
        # Smart routing
        if self.is_simple_command(command):
            # Quick response
            self._update_state("thinking")
            response = handle_command(command)
        else:
            # Use orchestrator for complex tasks
            self._update_state("thinking")
            if self.orchestrator:
                response = self.orchestrator.run(command)
            else:
                response = handle_command(command)
        
        # Store in context
        self.context.add_turn(command, response)
        
        # Voice feedback for completion
        speak("Done.")
        
        return response
    
    def request_interrupt(self):
        """Request to interrupt current task."""
        self.interrupt_requested = True
        self._send_message("Interrupt requested...")
    
    def conversation_loop(self, timeout_seconds: int = 5):
        """
        Continuous conversation loop with timeout.
        
        Args:
            timeout_seconds: Time to wait for next input before exiting
        """
        self._update_state("listening")
        self._send_message("Listening...")
        speak("Listening...")
        
        while self.running and not self.interrupt_requested:
            # Listen for command with timeout
            command = listen_voice_once()
            
            if not command:
                # Timeout or error
                break
            
            command = command.strip()
            if not command:
                continue
            
            # Check for exit commands
            if any(word in command.lower() for word in ["exit", "goodbye", "that's all"]):
                self._send_message("Exiting conversation mode.")
                speak("Exiting conversation mode.")
                break
            
            # Check for interrupt
            if any(word in command.lower() for word in ["stop", "wait", "cancel"]):
                self._send_message("Cancelled.")
                speak("Cancelled.")
                break
            
            # Process command
            self._update_state("thinking")
            self._send_message(f"Processing: {command[:50]}...")
            
            try:
                response = self.process_command(command)
                
                # Speak response
                self._update_state("speaking")
                self._send_message(f"Response: {response[:100]}...")
                speak(response)
                
                # Continue listening
                self._update_state("listening")
                self._send_message("Listening...")
                speak("Listening...")
                
            except Exception as e:
                logger.error(f"Command processing failed: {e}")
                self._send_message(f"Error: {str(e)}")
                speak(f"Error: {str(e)}")
                break
        
        self._update_state("idle")
        speak("Conversation mode ended.")
    
    def start_conversation(self):
        """Start conversation mode in background thread."""
        if self.running:
            return False
        
        self.running = True
        self.current_task = threading.Thread(
            target=self.conversation_loop,
            daemon=True
        )
        self.current_task.start()
        return True
    
    def stop_conversation(self):
        """Stop conversation mode."""
        self.running = False
        self.interrupt_requested = True
        if self.current_task:
            self.current_task.join(timeout=2)
        self._update_state("idle")
    
    def clear_context(self):
        """Clear conversation context."""
        self.context.clear()
        self._send_message("Conversation context cleared.")


# Singleton instance
_jarvis_mode: Optional[JarvisMode] = None


def get_jarvis_mode() -> JarvisMode:
    """Get or create JarvisMode instance."""
    global _jarvis_mode
    if _jarvis_mode is None:
        _jarvis_mode = JarvisMode()
    return _jarvis_mode
