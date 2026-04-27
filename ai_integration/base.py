"""
Base AI provider interface.
All AI providers implement this interface.
"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
import os

from core.logger import logger


class AIProvider(ABC):
    """Abstract base class for AI providers."""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
        self.name = self.__class__.__name__
        self.is_available = False
        self._setup()
    
    @abstractmethod
    def _setup(self) -> None:
        """Initialize the provider. Subclasses must implement."""
        pass
    
    @abstractmethod
    def query(self, text: str, context: Optional[Dict[str, Any]] = None) -> Optional[str]:
        """
        Query the AI provider.
        
        Args:
            text: User query
            context: Optional context dict
        
        Returns:
            Response string or None if failed
        """
        pass
    
    def is_ready(self) -> bool:
        """Check if provider is ready to use."""
        return self.is_available
    
    def get_status(self) -> Dict[str, Any]:
        """Get provider status."""
        return {
            "name": self.name,
            "available": self.is_available,
            "has_api_key": bool(self.api_key),
        }


class AIRouter:
    """Routes queries to available AI providers with fallback."""
    
    def __init__(self):
        self.providers: list[AIProvider] = []
        self.current_provider: Optional[AIProvider] = None
    
    def register(self, provider: AIProvider) -> None:
        """Register an AI provider."""
        if provider.is_ready():
            self.providers.append(provider)
            logger.info(f"Registered AI provider: {provider.name}")
            if self.current_provider is None:
                self.current_provider = provider
        else:
            logger.warning(f"Provider {provider.name} not ready, skipping")
    
    def query(self, text: str, context: Optional[Dict[str, Any]] = None) -> Optional[str]:
        """Query with automatic fallback."""
        if not self.providers:
            logger.error("No AI providers available")
            return None
        
        # Try current provider first
        if self.current_provider and self.current_provider.is_ready():
            try:
                logger.debug(f"Querying {self.current_provider.name}")
                result = self.current_provider.query(text, context)
                if result:
                    return result
            except Exception as e:
                logger.error(f"{self.current_provider.name} failed: {e}")
        
        # Try other providers
        for provider in self.providers:
            if provider == self.current_provider:
                continue
            try:
                logger.debug(f"Trying fallback provider: {provider.name}")
                result = provider.query(text, context)
                if result:
                    self.current_provider = provider  # Update current
                    return result
            except Exception as e:
                logger.error(f"{provider.name} failed: {e}")
        
        logger.error("All AI providers failed")
        return None
    
    def get_status(self) -> Dict[str, Any]:
        """Get status of all providers."""
        return {
            "providers": [p.get_status() for p in self.providers],
            "current": self.current_provider.name if self.current_provider else None,
        }
    
    def list_providers(self) -> list[str]:
        """List available providers."""
        return [p.name for p in self.providers]


# Global router instance
ai_router = AIRouter()
