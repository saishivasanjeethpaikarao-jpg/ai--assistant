"""
Centralized configuration management for Jarvis AI Assistant.
Loads settings from environment variables and config files.
"""

import os
import json
from pathlib import Path
from dataclasses import dataclass, asdict
from typing import Optional


@dataclass
class VoiceConfig:
    """Voice system configuration."""
    engine: str = "pyttsx3"  # pyttsx3, elevenlabs
    rate: int = 150  # speech rate
    volume: float = 0.9
    language: str = "en-US"
    use_offline: bool = True
    timeout_secs: float = 10.0


@dataclass
class WakeWordConfig:
    """Wake word detection configuration."""
    enabled: bool = False  # Will enable in Phase 3
    keyword: str = "jarvis"
    sensitivity: float = 0.5
    model_type: str = "pvporcupine"  # Can be pocketsphinx, pvporcupine, etc.


@dataclass
class UIConfig:
    """UI configuration."""
    theme: str = "dark"
    floating_mode: bool = True
    start_minimized: bool = True
    show_waveform: bool = True
    auto_hide_delay: int = 5000  # milliseconds


@dataclass
class CommandConfig:
    """Command execution configuration."""
    safe_mode: bool = True
    max_retries: int = 3
    timeout_secs: float = 30.0
    enable_code_execution: bool = False


class JarvisConfig:
    """Centralized configuration management."""
    
    def __init__(self):
        self.base_dir = Path(__file__).parent.parent
        self.config_file = self.base_dir / "jarvis_config.json"
        
        # Load environment
        self._load_env()
        
        # Initialize config objects
        self.voice = VoiceConfig()
        self.wake_word = WakeWordConfig()
        self.ui = UIConfig()
        self.command = CommandConfig()
        
        # Load from file if exists
        self._load_config()
    
    def _load_env(self) -> None:
        """Load environment variables."""
        from dotenv import load_dotenv
        env_file = self.base_dir / ".env"
        if env_file.exists():
            load_dotenv(env_file)
    
    def _load_config(self) -> None:
        """Load configuration from JSON file."""
        if not self.config_file.exists():
            return
        
        try:
            with open(self.config_file, "r") as f:
                data = json.load(f)
            
            if "voice" in data:
                self.voice = VoiceConfig(**data["voice"])
            if "wake_word" in data:
                self.wake_word = WakeWordConfig(**data["wake_word"])
            if "ui" in data:
                self.ui = UIConfig(**data["ui"])
            if "command" in data:
                self.command = CommandConfig(**data["command"])
        except Exception as e:
            from core.logger import logger
            logger.warning(f"Failed to load config: {e}")
    
    def save(self) -> None:
        """Save current configuration to JSON file."""
        data = {
            "voice": asdict(self.voice),
            "wake_word": asdict(self.wake_word),
            "ui": asdict(self.ui),
            "command": asdict(self.command),
        }
        
        try:
            with open(self.config_file, "w") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            from core.logger import logger
            logger.error(f"Failed to save config: {e}")
    
    def get_env(self, key: str, default: Optional[str] = None) -> Optional[str]:
        """Get environment variable."""
        return os.getenv(key, default)
    
    def get_api_key(self, provider: str) -> Optional[str]:
        """Get API key for a provider."""
        key_var = f"{provider.upper()}_API_KEY"
        return self.get_env(key_var)


# Singleton instance
config = JarvisConfig()
