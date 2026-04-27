"""
Smart command routing and execution engine.
Handles command parsing, intent matching, and execution with fallback.
"""

import re
from typing import Callable, Dict, Any, Optional, List
from dataclasses import dataclass

from core.logger import logger


@dataclass
class CommandHandler:
    """Represents a command handler."""
    keywords: List[str]
    handler: Callable
    description: str
    requires_voice: bool = False


class CommandEngine:
    """Smart command routing engine."""
    
    def __init__(self):
        self.handlers: Dict[str, CommandHandler] = {}
        self.fallback_handler: Optional[Callable] = None
        self._register_default_handlers()
    
    def register(
        self,
        keywords: List[str],
        handler: Callable,
        description: str = "",
        requires_voice: bool = False
    ) -> None:
        """Register a command handler."""
        handler_id = handler.__name__
        self.handlers[handler_id] = CommandHandler(
            keywords=keywords,
            handler=handler,
            description=description,
            requires_voice=requires_voice
        )
        logger.debug(f"Registered handler: {handler_id} for {keywords}")
    
    def set_fallback(self, handler: Callable) -> None:
        """Set fallback handler for unrecognized commands."""
        self.fallback_handler = handler
        logger.debug("Fallback handler set")
    
    def execute(self, command_text: str, context: Optional[Dict] = None) -> str:
        """Execute a command and return response."""
        try:
            command_text = command_text.strip().lower()
            
            if not command_text:
                return "No command provided."
            
            logger.info(f"Executing command: {command_text[:50]}")
            
            # Find matching handler
            for handler_id, handler_obj in self.handlers.items():
                if self._matches_keywords(command_text, handler_obj.keywords):
                    logger.debug(f"Matched handler: {handler_id}")
                    try:
                        result = handler_obj.handler(command_text, context or {})
                        return result or "Command executed."
                    except Exception as e:
                        logger.exception(f"Error in handler {handler_id}")
                        return f"Error executing command: {str(e)}"
            
            # Try fallback
            if self.fallback_handler:
                logger.debug("Using fallback handler")
                try:
                    result = self.fallback_handler(command_text, context or {})
                    return result or "Command processed."
                except Exception as e:
                    logger.exception("Error in fallback handler")
                    return f"Error: {str(e)}"
            
            # No handler found
            return f"I don't understand '{command_text}'. Try 'help' for available commands."
        
        except Exception as e:
            logger.exception("Unexpected error in command execution")
            return f"Unexpected error: {str(e)}"
    
    def _matches_keywords(self, text: str, keywords: List[str]) -> bool:
        """Check if text matches any keyword."""
        text_lower = text.lower()
        
        for keyword in keywords:
            keyword_lower = keyword.lower()
            
            # Exact match
            if text_lower == keyword_lower:
                return True
            
            # Starts with
            if text_lower.startswith(keyword_lower):
                return True
            
            # Contains as word
            pattern = r'\b' + re.escape(keyword_lower) + r'\b'
            if re.search(pattern, text_lower):
                return True
        
        return False
    
    def get_help(self) -> str:
        """Get help text with all available commands."""
        lines = ["Available commands:"]
        for handler_id, handler in self.handlers.items():
            desc = handler.description or handler_id
            keywords = ", ".join(handler.keywords)
            lines.append(f"  • {keywords}: {desc}")
        return "\n".join(lines)
    
    def list_commands(self) -> List[Dict[str, Any]]:
        """Get list of all registered commands."""
        return [
            {
                "keywords": handler.keywords,
                "description": handler.description,
                "requires_voice": handler.requires_voice,
            }
            for handler in self.handlers.values()
        ]
    
    def _register_default_handlers(self) -> None:
        """Register default built-in command handlers."""
        
        def help_handler(cmd: str, ctx: Dict) -> str:
            return self.get_help()
        
        def status_handler(cmd: str, ctx: Dict) -> str:
            return "✓ Jarvis is running normally. All systems operational."
        
        def echo_handler(cmd: str, ctx: Dict) -> str:
            return f"Echo: {cmd}"
        
        self.register(
            keywords=["help", "?", "commands"],
            handler=help_handler,
            description="Show available commands"
        )
        
        self.register(
            keywords=["status", "check"],
            handler=status_handler,
            description="Check system status"
        )
        
        self.register(
            keywords=["echo"],
            handler=echo_handler,
            description="Echo the command back"
        )


# Singleton instance
command_engine = CommandEngine()
