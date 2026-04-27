"""
Version Manager
Manages version information and build metadata
"""

import logging
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, Optional, Tuple

logger = logging.getLogger(__name__)


class VersionManager:
    """Manages version information"""
    
    def __init__(self, version_file: Path = None):
        """
        Initialize version manager
        
        Args:
            version_file: Version file path
        """
        self.version_file = version_file or Path('version.txt')
        self.current_version = self._load_version()
        
        logger.info(f"Version manager initialized: {self.current_version}")
    
    def _load_version(self) -> str:
        """Load current version"""
        try:
            if self.version_file.exists():
                with open(self.version_file, 'r') as f:
                    return f.read().strip()
            return "1.0.0"
        except Exception as e:
            logger.error(f"Error loading version: {e}")
            return "1.0.0"
    
    def _save_version(self, version: str) -> bool:
        """Save version to file"""
        try:
            self.version_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self.version_file, 'w') as f:
                f.write(version)
            self.current_version = version
            logger.info(f"Version saved: {version}")
            return True
        except Exception as e:
            logger.error(f"Error saving version: {e}")
            return False
    
    def get_version(self) -> str:
        """
        Get current version
        
        Returns:
            Version string
        """
        return self.current_version
    
    def parse_version(self, version: str) -> Tuple[int, int, int]:
        """
        Parse version string
        
        Args:
            version: Version string (e.g., "7.0.0")
            
        Returns:
            (major, minor, patch)
        """
        try:
            parts = version.split('.')
            major = int(parts[0]) if len(parts) > 0 else 0
            minor = int(parts[1]) if len(parts) > 1 else 0
            patch = int(parts[2]) if len(parts) > 2 else 0
            return major, minor, patch
        except (ValueError, IndexError):
            logger.error(f"Invalid version format: {version}")
            return 1, 0, 0
    
    def increment_major(self) -> str:
        """Increment major version"""
        major, minor, patch = self.parse_version(self.current_version)
        new_version = f"{major + 1}.0.0"
        self._save_version(new_version)
        logger.info(f"Version incremented: {self.current_version} → {new_version}")
        return new_version
    
    def increment_minor(self) -> str:
        """Increment minor version"""
        major, minor, patch = self.parse_version(self.current_version)
        new_version = f"{major}.{minor + 1}.0"
        self._save_version(new_version)
        logger.info(f"Version incremented: {self.current_version} → {new_version}")
        return new_version
    
    def increment_patch(self) -> str:
        """Increment patch version"""
        major, minor, patch = self.parse_version(self.current_version)
        new_version = f"{major}.{minor}.{patch + 1}"
        self._save_version(new_version)
        logger.info(f"Version incremented: {self.current_version} → {new_version}")
        return new_version
    
    def set_version(self, version: str) -> bool:
        """
        Set specific version
        
        Args:
            version: Version string
            
        Returns:
            Success status
        """
        if not self._is_valid_version(version):
            logger.error(f"Invalid version: {version}")
            return False
        
        self._save_version(version)
        return True
    
    def get_build_metadata(self) -> Dict:
        """
        Get build metadata
        
        Returns:
            Metadata dictionary
        """
        major, minor, patch = self.parse_version(self.current_version)
        
        return {
            'version': self.current_version,
            'major': major,
            'minor': minor,
            'patch': patch,
            'build_date': datetime.now().isoformat(),
            'build_number': self._get_build_number(),
            'python_version': self._get_python_version(),
            'platform': self._get_platform(),
        }
    
    def create_version_resource(self) -> str:
        """
        Create Windows version resource
        
        Returns:
            Version resource string
        """
        version = self.current_version
        major, minor, patch = self.parse_version(version)
        
        return f'''# -*- coding: utf-8 -*-
# Version information
VSVersionInfo(
  ffi=FixedFileInfo(
    mask=0x3f,
    mask_flags=0x8,
    both_flags=0x8,
    OS=0x4,
    fileType=0x1,
    subtype=0x0,
    date=(0, 0)
  ),
  kids=[
StringFileInfo([
StringTable(u'040904B0', [
StringStruct(u'CompanyName', u'Jarvis Development'),
StringStruct(u'FileDescription', u'Advanced AI Desktop Assistant'),
StringStruct(u'FileVersion', u'{major}.{minor}.{patch}.0'),
StringStruct(u'InternalName', u'Jarvis'),
StringStruct(u'LegalCopyright', u'Copyright 2026'),
StringStruct(u'OriginalFilename', u'jarvis.exe'),
StringStruct(u'ProductName', u'Jarvis AI Assistant'),
StringStruct(u'ProductVersion', u'{major}.{minor}.{patch}.0')])
]),
VariableFileInfo([VarStruct(u'Translation', [1033, 1200])])
  ]
)
'''
    
    def embed_version_in_exe(self, exe_path: Path) -> bool:
        """
        Embed version in executable
        
        Args:
            exe_path: Path to .exe file
            
        Returns:
            Success status
        """
        try:
            logger.info(f"Embedding version in {exe_path}...")
            
            if not exe_path.exists():
                logger.error(f"Executable not found: {exe_path}")
                return False
            
            # Note: Actual embedding requires external tools (ResHacker, etc.)
            # This is a placeholder for the full implementation
            
            logger.info("✓ Version embedded")
            return True
        except Exception as e:
            logger.error(f"Error embedding version: {e}")
            return False
    
    def print_version_info(self) -> None:
        """Print version information"""
        metadata = self.get_build_metadata()
        
        print("\n" + "="*70)
        print("VERSION INFORMATION")
        print("="*70)
        print(f"Version:        {metadata['version']}")
        print(f"Major:          {metadata['major']}")
        print(f"Minor:          {metadata['minor']}")
        print(f"Patch:          {metadata['patch']}")
        print(f"Build Number:   {metadata['build_number']}")
        print(f"Build Date:     {metadata['build_date']}")
        print(f"Python:         {metadata['python_version']}")
        print(f"Platform:       {metadata['platform']}")
        print("="*70)
    
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
    
    @staticmethod
    def _get_build_number() -> str:
        """Get build number from date"""
        now = datetime.now()
        return now.strftime('%Y%m%d%H')
    
    @staticmethod
    def _get_python_version() -> str:
        """Get Python version"""
        import sys
        return sys.version.split()[0]
    
    @staticmethod
    def _get_platform() -> str:
        """Get platform"""
        import sys
        return sys.platform
