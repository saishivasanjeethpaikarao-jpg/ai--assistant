"""
Installer Package
Windows .msi installer creation
"""

from .config import InstallerConfig
from .wix_generator import WiXGenerator
from .installer_builder import InstallerBuilder
from .shortcut_manager import ShortcutManager
from .registry_manager import RegistryManager
from .installer_verifier import InstallerVerifier

__all__ = [
    'InstallerConfig',
    'WiXGenerator',
    'InstallerBuilder',
    'ShortcutManager',
    'RegistryManager',
    'InstallerVerifier',
]
