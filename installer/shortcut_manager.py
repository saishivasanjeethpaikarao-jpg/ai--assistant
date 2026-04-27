"""
Shortcut Manager
Creates Windows shortcuts (.lnk files)
"""

import logging
from pathlib import Path
from typing import Dict, Optional

logger = logging.getLogger(__name__)


class ShortcutManager:
    """Manages Windows shortcuts"""
    
    def __init__(self, app_name: str, app_path: Path, icon_path: Optional[Path] = None):
        """
        Initialize shortcut manager
        
        Args:
            app_name: Application name
            app_path: Path to executable
            icon_path: Path to icon file
        """
        self.app_name = app_name
        self.app_path = app_path
        self.icon_path = icon_path
        self.shortcuts = {}
        
        logger.info(f"Shortcut manager initialized: {app_name}")
    
    def create_desktop_shortcut(self) -> Dict:
        """
        Create desktop shortcut
        
        Returns:
            Shortcut info dictionary
        """
        shortcut_info = {
            'name': self.app_name,
            'target': str(self.app_path),
            'location': 'Desktop',
            'icon': str(self.icon_path) if self.icon_path else str(self.app_path),
        }
        
        self.shortcuts['desktop'] = shortcut_info
        logger.info(f"Created desktop shortcut: {self.app_name}")
        
        return shortcut_info
    
    def create_start_menu_shortcut(self) -> Dict:
        """
        Create Start Menu shortcut
        
        Returns:
            Shortcut info dictionary
        """
        shortcut_info = {
            'name': self.app_name,
            'target': str(self.app_path),
            'location': 'Start Menu',
            'folder': self.app_name,
            'icon': str(self.icon_path) if self.icon_path else str(self.app_path),
        }
        
        self.shortcuts['start_menu'] = shortcut_info
        logger.info(f"Created Start Menu shortcut: {self.app_name}")
        
        return shortcut_info
    
    def create_quick_launch(self) -> Dict:
        """
        Create Quick Launch shortcut
        
        Returns:
            Shortcut info dictionary
        """
        shortcut_info = {
            'name': self.app_name,
            'target': str(self.app_path),
            'location': 'Quick Launch',
            'icon': str(self.icon_path) if self.icon_path else str(self.app_path),
        }
        
        self.shortcuts['quick_launch'] = shortcut_info
        logger.info(f"Created Quick Launch shortcut: {self.app_name}")
        
        return shortcut_info
    
    def get_shortcuts_wxs(self) -> str:
        """
        Get WiX definition for shortcuts
        
        Returns:
            WiX XML content
        """
        wxs_shortcuts = []
        
        if 'desktop' in self.shortcuts:
            sc = self.shortcuts['desktop']
            wxs_shortcuts.append(f'''
      <Shortcut
        Id="DesktopShortcut"
        Directory="DesktopFolder"
        Name="{sc['name']}"
        Target="{sc['target']}"
        Icon="{Path(sc['icon']).name}"
        IconIndex="0"
        WorkingDirectory="INSTALLFOLDER" />
''')
        
        if 'start_menu' in self.shortcuts:
            sc = self.shortcuts['start_menu']
            wxs_shortcuts.append(f'''
      <Shortcut
        Id="StartMenuShortcut"
        Directory="STARTMENUFOLDER"
        Name="{sc['name']}"
        Target="{sc['target']}"
        Icon="{Path(sc['icon']).name}"
        IconIndex="0"
        WorkingDirectory="INSTALLFOLDER" />
''')
        
        return ''.join(wxs_shortcuts)
    
    def get_shortcuts_info(self) -> Dict:
        """
        Get shortcuts information
        
        Returns:
            Shortcuts dictionary
        """
        return self.shortcuts
    
    def print_shortcuts_summary(self) -> None:
        """Print shortcuts summary"""
        print("\n" + "="*70)
        print("SHORTCUTS SUMMARY")
        print("="*70)
        
        for shortcut_type, info in self.shortcuts.items():
            print(f"\n{shortcut_type.upper()}:")
            for key, value in info.items():
                print(f"  {key}: {value}")
        
        print("="*70)
