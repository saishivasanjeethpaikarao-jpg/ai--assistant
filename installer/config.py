"""
Installer Configuration
Settings for Windows .msi installer
"""

import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)


@dataclass
class InstallerConfig:
    """Installer configuration"""
    
    # Product information
    app_name: str = 'Jarvis'
    version: str = '8.0.0'
    manufacturer: str = 'Jarvis Development'
    description: str = 'Advanced AI Desktop Assistant'
    
    # Installation settings
    install_dir: str = 'ProgramFilesX64'  # ProgramFiles, ProgramFilesX64
    install_scope: str = 'perMachine'    # perMachine, perUser
    
    # Paths
    source_exe: Path = field(default_factory=lambda: Path('dist/jarvis.exe'))
    install_folder: Path = field(default_factory=lambda: Path('C:/Program Files/Jarvis'))
    
    # Shortcuts
    desktop_shortcut: bool = True
    start_menu_folder: str = 'Jarvis'
    start_menu_shortcut: bool = True
    quick_launch: bool = True
    
    # Features
    features: List[str] = field(default_factory=lambda: [
        'Application',
        'Documentation',
        'Shortcuts',
    ])
    
    # Registry entries
    registry_entries: Dict[str, str] = field(default_factory=lambda: {
        'InstallPath': '[INSTALLFOLDER]',
        'Version': '8.0.0',
        'DisplayName': 'Jarvis AI Assistant',
        'DisplayVersion': '8.0.0',
        'Publisher': 'Jarvis Development',
    })
    
    # File associations
    file_associations: Dict[str, str] = field(default_factory=lambda: {
        '.jarvis': 'Jarvis Configuration File',
    })
    
    # UI/Branding
    license_file: Path = field(default_factory=lambda: Path('LICENSE.txt'))
    banner_image: Path = field(default_factory=lambda: Path('assets/installer-banner.bmp'))
    dialog_background: Path = field(default_factory=lambda: Path('assets/installer-bg.bmp'))
    icon_path: Path = field(default_factory=lambda: Path('assets/jarvis.ico'))
    
    # Build settings
    wix_path: Path = field(default_factory=lambda: Path('C:/Program Files (x86)/WiX Toolset v3.11/bin'))
    output_dir: Path = field(default_factory=lambda: Path('dist'))
    build_dir: Path = field(default_factory=lambda: Path('build/wix'))
    
    def validate(self) -> bool:
        """Validate configuration"""
        try:
            if not self.source_exe.exists():
                logger.warning(f"Source exe not found: {self.source_exe}")
            
            if not self.license_file.exists():
                logger.warning(f"License file not found: {self.license_file}")
            
            if self.version and not self._is_valid_version(self.version):
                logger.error(f"Invalid version: {self.version}")
                return False
            
            logger.info("Installer configuration validated")
            return True
        except Exception as e:
            logger.error(f"Config validation failed: {e}")
            return False
    
    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        return {
            'app_name': self.app_name,
            'version': self.version,
            'manufacturer': self.manufacturer,
            'install_scope': self.install_scope,
            'desktop_shortcut': self.desktop_shortcut,
            'start_menu_shortcut': self.start_menu_shortcut,
            'registry_entries': self.registry_entries,
        }
    
    @staticmethod
    def _is_valid_version(version: str) -> bool:
        """Check if version format is valid"""
        parts = version.split('.')
        if len(parts) < 2 or len(parts) > 3:
            return False
        
        try:
            for part in parts:
                int(part)
            return True
        except ValueError:
            return False
