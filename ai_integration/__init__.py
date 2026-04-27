"""
AI Integration module - Multiple provider support with fallback routing.
"""

from ai_integration.base import AIProvider, AIRouter, ai_router
from ai_integration.groq_handler import GroqProvider

__all__ = [
    "AIProvider",
    "AIRouter",
    "ai_router",
    "GroqProvider",
]


def initialize_ai_providers() -> None:
    """Initialize available AI providers (Groq + Ollama via ai_switcher)."""
    # Groq provider (with OpenAI-compatible API)
    try:
        groq = GroqProvider()
        if groq.is_ready():
            ai_router.register(groq)
    except Exception as e:
        from core.logger import logger
        logger.debug(f"Could not initialize Groq: {e}")
    
    # Note: Ollama is handled via ai_switcher.py with local fallback routing
