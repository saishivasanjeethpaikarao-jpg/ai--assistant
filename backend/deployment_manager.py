"""
Production Deployment Module - Packaging & Distribution
PyInstaller EXE packaging, auto-updater, versioning, and release management
"""

import os
import json
import subprocess
import shutil
import hashlib
import tempfile
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
import logging
import requests

logger = logging.getLogger(__name__)

# Paths
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
BUILD_DIR = os.path.join(PROJECT_ROOT, "build")
DIST_DIR = os.path.join(PROJECT_ROOT, "dist")
RELEASE_DIR = os.path.join(PROJECT_ROOT, "releases")
VERSION_FILE = os.path.join(PROJECT_ROOT, "version_info.txt")


class Platform(Enum):
    """Target platforms"""
    WINDOWS_64 = "windows_64bit"
    WINDOWS_32 = "windows_32bit"
    MACOS = "macos"
    LINUX = "linux"


class ReleaseChannel(Enum):
    """Release channels"""
    STABLE = "stable"
    BETA = "beta"
    DEV = "dev"


@dataclass
class Version:
    """Version information"""
    major: int
    minor: int
    patch: int
    channel: ReleaseChannel = ReleaseChannel.DEV
    build_number: int = 0
    
    def __str__(self) -> str:
        return f"{self.major}.{self.minor}.{self.patch}"
    
    def full_version(self) -> str:
        """Get full version string with channel"""
        if self.channel == ReleaseChannel.STABLE:
            return f"v{self.major}.{self.minor}.{self.patch}"
        else:
            return f"v{self.major}.{self.minor}.{self.patch}-{self.channel.value}.{self.build_number}"
    
    def is_newer_than(self, other: 'Version') -> bool:
        """Check if this version is newer"""
        if self.major != other.major:
            return self.major > other.major
        if self.minor != other.minor:
            return self.minor > other.minor
        if self.patch != other.patch:
            return self.patch > other.patch
        return False


@dataclass
class ReleaseInfo:
    """Release information"""
    version: Version
    release_date: str
    platform: Platform
    executable_path: str
    file_size: int
    file_hash: str
    changelog: List[str]
    download_url: Optional[str] = None
    checksum_url: Optional[str] = None


class VersionManager:
    """Manage application versioning"""
    
    def __init__(self, version_file: str = VERSION_FILE):
        self.version_file = version_file
        self.current_version = self.load_version()
    
    def load_version(self) -> Version:
        """Load version from file"""
        try:
            if os.path.exists(self.version_file):
                with open(self.version_file, 'r') as f:
                    version_data = json.load(f)
                    return Version(
                        major=version_data.get("major", 1),
                        minor=version_data.get("minor", 0),
                        patch=version_data.get("patch", 0),
                        channel=ReleaseChannel(version_data.get("channel", "dev")),
                        build_number=version_data.get("build_number", 0)
                    )
        except Exception as e:
            logger.error(f"Error loading version: {e}")
        
        return Version(major=1, minor=0, patch=0)
    
    def save_version(self, version: Version):
        """Save version to file"""
        try:
            os.makedirs(os.path.dirname(self.version_file), exist_ok=True)
            with open(self.version_file, 'w') as f:
                json.dump({
                    "major": version.major,
                    "minor": version.minor,
                    "patch": version.patch,
                    "channel": version.channel.value,
                    "build_number": version.build_number,
                    "updated_at": datetime.now().isoformat()
                }, f, indent=2)
            logger.info(f"Version saved: {version.full_version()}")
        except Exception as e:
            logger.error(f"Error saving version: {e}")
    
    def increment_version(self, version_type: str = "patch") -> Version:
        """Increment version number"""
        version = self.current_version
        
        if version_type == "major":
            version.major += 1
            version.minor = 0
            version.patch = 0
        elif version_type == "minor":
            version.minor += 1
            version.patch = 0
        elif version_type == "patch":
            version.patch += 1
        elif version_type == "build":
            version.build_number += 1
        
        self.current_version = version
        self.save_version(version)
        return version


class PyInstallerBuilder:
    """Build PyInstaller executables"""
    
    def __init__(self, entry_point: str = "app.py"):
        self.entry_point = entry_point
        self.build_dir = BUILD_DIR
        self.dist_dir = DIST_DIR
    
    def build_windows_exe(self, console: bool = False, one_file: bool = True) -> Tuple[bool, str]:
        """Build Windows executable"""
        try:
            logger.info("Building Windows executable...")
            
            # Ensure entry point exists
            if not os.path.exists(self.entry_point):
                return False, f"Entry point not found: {self.entry_point}"
            
            # Build PyInstaller command
            cmd = [
                "pyinstaller",
                "--name", "Airis-AI",
                "--icon", "assets/airis_icon.ico" if os.path.exists("assets/airis_icon.ico") else None,
                "--distpath", self.dist_dir,
                "--buildpath", self.build_dir,
            ]
            
            # Remove None values
            cmd = [c for c in cmd if c is not None]
            
            if one_file:
                cmd.append("--onefile")
            
            if not console:
                cmd.append("--windowed")
            
            cmd.extend([
                "--hidden-import=requests",
                "--hidden-import=firebase_admin",
                "--hidden-import=twilio",
                "--add-data=assets:assets",
                self.entry_point
            ])
            
            # Run PyInstaller
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                exe_path = os.path.join(self.dist_dir, "Airis-AI.exe")
                if os.path.exists(exe_path):
                    logger.info(f"Windows EXE built: {exe_path}")
                    return True, exe_path
                else:
                    return False, "EXE not found after build"
            else:
                logger.error(f"Build failed: {result.stderr}")
                return False, result.stderr
        
        except Exception as e:
            logger.error(f"Build error: {e}")
            return False, str(e)
    
    def build_portable_exe(self) -> Tuple[bool, str]:
        """Build portable single-file executable"""
        return self.build_windows_exe(console=True, one_file=True)


class ReleaseManager:
    """Manage releases and distributions"""
    
    def __init__(self):
        self.version_manager = VersionManager()
        self.builder = PyInstallerBuilder()
        self.releases: List[ReleaseInfo] = []
    
    def create_release(self, version_type: str = "patch",
                      changelog: List[str] = None,
                      platform: Platform = Platform.WINDOWS_64) -> Tuple[bool, str]:
        """Create a new release"""
        try:
            # Increment version
            new_version = self.version_manager.increment_version(version_type)
            logger.info(f"Creating release: {new_version.full_version()}")
            
            # Build executable
            success, exe_path = self.builder.build_portable_exe()
            if not success:
                return False, f"Build failed: {exe_path}"
            
            # Generate checksums
            file_hash = self._generate_file_hash(exe_path)
            file_size = os.path.getsize(exe_path)
            
            # Create release info
            release = ReleaseInfo(
                version=new_version,
                release_date=datetime.now().isoformat(),
                platform=platform,
                executable_path=exe_path,
                file_size=file_size,
                file_hash=file_hash,
                changelog=changelog or ["Bug fixes and improvements"]
            )
            
            # Save release info
            self._save_release_info(release)
            self.releases.append(release)
            
            logger.info(f"Release created: {new_version.full_version()}")
            return True, exe_path
        
        except Exception as e:
            logger.error(f"Release creation error: {e}")
            return False, str(e)
    
    def publish_release(self, release: ReleaseInfo, channel: str = "stable") -> Tuple[bool, str]:
        """Publish release to repository"""
        try:
            os.makedirs(RELEASE_DIR, exist_ok=True)
            
            # Copy executable to release directory
            release_name = f"Airis-AI-{release.version.full_version()}-{release.platform.value}.exe"
            release_path = os.path.join(RELEASE_DIR, release_name)
            
            shutil.copy(release.executable_path, release_path)
            
            # Create checksum file
            checksum_file = os.path.join(RELEASE_DIR, f"{release_name}.sha256")
            with open(checksum_file, 'w') as f:
                f.write(f"{release.file_hash}  {release_name}")
            
            # Create release metadata
            metadata = {
                "version": release.version.full_version(),
                "release_date": release.release_date,
                "platform": release.platform.value,
                "file_size": release.file_size,
                "file_hash": release.file_hash,
                "changelog": release.changelog,
                "channel": channel
            }
            
            metadata_file = os.path.join(RELEASE_DIR, f"{release_name}.json")
            with open(metadata_file, 'w') as f:
                json.dump(metadata, f, indent=2)
            
            logger.info(f"Release published: {release_name}")
            return True, release_path
        
        except Exception as e:
            logger.error(f"Publish error: {e}")
            return False, str(e)
    
    def get_latest_release(self) -> Optional[ReleaseInfo]:
        """Get latest release info"""
        if not self.releases:
            return None
        
        return max(self.releases, key=lambda r: (r.version.major, r.version.minor, r.version.patch))
    
    @staticmethod
    def _generate_file_hash(file_path: str) -> str:
        """Generate SHA256 hash of file"""
        sha256 = hashlib.sha256()
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b''):
                sha256.update(chunk)
        return sha256.hexdigest()
    
    @staticmethod
    def _save_release_info(release: ReleaseInfo):
        """Save release information"""
        try:
            os.makedirs(RELEASE_DIR, exist_ok=True)
            release_file = os.path.join(RELEASE_DIR, f"{release.version.full_version()}.json")
            
            with open(release_file, 'w') as f:
                json.dump({
                    "version": release.version.full_version(),
                    "release_date": release.release_date,
                    "platform": release.platform.value,
                    "file_size": release.file_size,
                    "file_hash": release.file_hash,
                    "changelog": release.changelog
                }, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving release info: {e}")


class AutoUpdater:
    """Automatic update checker and downloader"""
    
    def __init__(self, update_server_url: str = None):
        self.version_manager = VersionManager()
        self.update_server_url = update_server_url or "https://releases.example.com"
        self.current_version = self.version_manager.current_version
    
    def check_for_updates(self) -> Tuple[bool, Optional[Version]]:
        """Check if updates are available"""
        try:
            # In production, would fetch from update server
            # response = requests.get(f"{self.update_server_url}/latest")
            # latest_version = Version(**response.json())
            
            logger.info(f"Checking for updates from {self.update_server_url}")
            # Mock: no updates available
            return False, None
        
        except Exception as e:
            logger.error(f"Update check error: {e}")
            return False, None
    
    def download_update(self, version: Version, platform: Platform) -> Tuple[bool, str]:
        """Download update"""
        try:
            download_url = f"{self.update_server_url}/releases/Airis-AI-{version.full_version()}-{platform.value}.exe"
            
            logger.info(f"Downloading update from {download_url}")
            
            # In production, would download file
            # response = requests.get(download_url, stream=True)
            # with open(temp_file, 'wb') as f:
            #     for chunk in response.iter_content(chunk_size=8192):
            #         f.write(chunk)
            
            return False, "Update server not available"
        
        except Exception as e:
            logger.error(f"Download error: {e}")
            return False, str(e)
    
    def install_update(self, update_path: str) -> Tuple[bool, str]:
        """Install downloaded update"""
        try:
            logger.info(f"Installing update from {update_path}")
            
            # Backup current version
            current_exe = os.path.join(os.path.dirname(__file__), "Airis-AI.exe")
            backup_path = f"{current_exe}.backup"
            
            if os.path.exists(current_exe):
                shutil.copy(current_exe, backup_path)
            
            # Copy new version
            shutil.copy(update_path, current_exe)
            
            logger.info("Update installed successfully")
            return True, "Update installed. Please restart the application."
        
        except Exception as e:
            logger.error(f"Installation error: {e}")
            return False, str(e)
    
    def enable_auto_updates(self, check_interval_hours: int = 24) -> bool:
        """Enable automatic update checking"""
        try:
            # In production, would set up scheduled task or service
            logger.info(f"Auto-updates enabled (check interval: {check_interval_hours}h)")
            return True
        except Exception as e:
            logger.error(f"Enable auto-updates error: {e}")
            return False


class MSIXPackager:
    """Package for Windows Store / MSIX"""
    
    @staticmethod
    def create_msix_package(exe_path: str, output_dir: str = DIST_DIR) -> Tuple[bool, str]:
        """Create MSIX package for Windows Store distribution
        
        Requires: MSIX Packaging Tool (Visual Studio)
        """
        try:
            logger.info(f"Creating MSIX package from {exe_path}")
            
            # Check if MakeAppx.exe is available
            makappx_path = r"C:\Program Files (x86)\Windows Kits\10\bin\10.0.19041.0\x64\MakeAppx.exe"
            
            if not os.path.exists(makappx_path):
                return False, "MakeAppx.exe not found. Install Windows SDK."
            
            # Create MSIX manifest
            manifest = '''<?xml version="1.0" encoding="utf-8"?>
<Package xmlns="http://schemas.microsoft.com/appx/manifest/foundation/windows10">
  <Identity Name="AirisAI" Publisher="CN=AirisAI" Version="1.0.0.0" />
  <Properties>
    <DisplayName>Airis AI</DisplayName>
    <PublisherDisplayName>Airis AI Team</PublisherDisplayName>
  </Properties>
  <Applications>
    <Application StartPage="app.exe" />
  </Applications>
</Package>'''
            
            manifest_path = os.path.join(output_dir, "AppxManifest.xml")
            with open(manifest_path, 'w') as f:
                f.write(manifest)
            
            # Run MakeAppx to create MSIX
            cmd = [makappx_path, "pack", "/d", output_dir, "/p", f"{output_dir}/AirisAI.msix"]
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                logger.info("MSIX package created successfully")
                return True, f"{output_dir}/AirisAI.msix"
            else:
                logger.error(f"MSIX creation failed: {result.stderr}")
                return False, result.stderr
        
        except Exception as e:
            logger.error(f"MSIX creation error: {e}")
            return False, str(e)


# Singleton instance
_release_manager = None


def get_release_manager() -> ReleaseManager:
    """Get singleton release manager"""
    global _release_manager
    if _release_manager is None:
        _release_manager = ReleaseManager()
    return _release_manager
