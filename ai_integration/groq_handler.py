"""
Groq API provider implementation (fast LLM inference).
"""

import os
from typing import Optional, Dict, Any

from core.logger import logger
from ai_integration.base import AIProvider

try:
    from groq import Groq
except ImportError:
    Groq = None


class GroqProvider(AIProvider):
    """Groq API provider (Mixtral model)."""
    
    def __init__(self, api_key: Optional[str] = None):
        self.client = None
        self.model = "mixtral-8x7b-32768"  # Fast and capable
        super().__init__(api_key or os.getenv("GROQ_API_KEY"))
    
    def _setup(self) -> None:
        """Initialize Groq client."""
        if not Groq:
            logger.warning("Groq library not installed")
            return
        
        if not self.api_key:
            logger.warning("Groq API key not set")
            return
        
        try:
            self.client = Groq(api_key=self.api_key)
            self.is_available = True
            logger.info("Groq provider initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Groq: {e}")
            self.is_available = False
    
    def query(self, text: str, context: Optional[Dict[str, Any]] = None) -> Optional[str]:
        """Query Groq."""
        if not self.is_available or not self.client:
            return None
        
        try:
            logger.debug(f"Groq query: {text[:50]}")
            
            # Build messages
            messages = [
                {
                    "role": "system",
                    "content": "You are Jarvis, a friendly and capable AI assistant. Be concise but helpful."
                }
            ]
            
            # Add context if available
            if context and "memory" in context:
                messages.append({
                    "role": "system",
                    "content": f"User context: {context['memory']}"
                })
            
            # Add user message
            messages.append({"role": "user", "content": text})
            
            # Query
            completion = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=500,
                temperature=0.7,
            )
            
            result = completion.choices[0].message.content.strip()
            logger.debug(f"Groq response: {result[:50]}")
            return result
        
        except Exception as e:
            logger.error(f"Groq query error: {e}")
            return None
