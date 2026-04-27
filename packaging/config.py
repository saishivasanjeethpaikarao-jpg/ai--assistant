"""
Build Configuration
Settings for .exe packaging
"""

import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)


@dataclass
class BuildConfig:
    """Build configuration"""
    
    # Project info
    app_name: str = 'Jarvis'
    version: str = '7.0.0'
    author: str = 'Development Team'
    description: str = 'Advanced AI Desktop Assistant'
    
    # Build paths
    source_dir: Path = field(default_factory=lambda: Path('core'))
    dist_dir: Path = field(default_factory=lambda: Path('dist'))
    build_dir: Path = field(default_factory=lambda: Path('build'))
    temp_dir: Path = field(default_factory=lambda: Path('.build_temp'))
    
    # Assets
    icon_path: Path = field(default_factory=lambda: Path('assets/jarvis.ico'))
    assets_dir: Path = field(default_factory=lambda: Path('assets'))
    
    # PyInstaller settings
    one_file: bool = True
    windowed: bool = True
    console: bool = False
    optimize: int = 2
    
    # Features
    enable_code_signing: bool = False
    certificate_path: Optional[Path] = None
    enable_compression: bool = True
    
    # Build parameters
    max_build_time: int = 300  # 5 minutes
    max_exe_size: int = 200 * 1024 * 1024  # 200MB
    
    # Hidden and excluded imports
    hidden_imports: List[str] = field(default_factory=lambda: [
        'speech_recognition',
        'pyttsx3',
        'PyQt6',
        'selenium',
        'google.cloud',
        'google.auth',
        'google.gmail',
    ])
    
    excluded_imports: List[str] = field(default_factory=lambda: [
        'matplotlib',
        'pandas',
        'numpy',
        'scipy',
        'sklearn',
    ])
    
    # Data files to include
    datas: List[tuple] = field(default_factory=lambda: [
        ('assets', 'assets'),
        ('configs', 'configs'),
        ('requirements.txt', '.'),
    ])
    
    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        return {
            'app_name': self.app_name,
            'version': self.version,
            'author': self.author,
            'description': self.description,
            'one_file': self.one_file,
            'windowed': self.windowed,
            'console': self.console,
            'optimize': self.optimize,
            'hidden_imports': self.hidden_imports,
            'excluded_imports': self.excluded_imports,
            'datas': self.datas,
        }
    
    def validate(self) -> bool:
        """Validate configuration"""
        try:
            if not self.source_dir.exists():
                logger.warning(f"Source dir not found: {self.source_dir}")
            
            if not self.icon_path.exists():
                logger.warning(f"Icon not found: {self.icon_path}")
            
            if self.max_exe_size <= 0:
                logger.error("Max exe size must be positive")
                return False
            
            if self.version and not self._is_valid_version(self.version):
                logger.error(f"Invalid version format: {self.version}")
                return False
            
            logger.info("Config validation passed")
            return True
        except Exception as e:
            logger.error(f"Config validation failed: {e}")
            return False
    
    @staticmethod
    def _is_valid_version(version: str) -> bool:
        """Check if version format is valid"""
        parts = version.split('.')
        if len(parts) < 2:
            return False
        
        try:
            for part in parts[:3]:
                int(part)
            return True
        except ValueError:
            return False
