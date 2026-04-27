"""
Build Manager
Orchestrates .exe build process
"""

import logging
import time
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, Optional
import subprocess
import sys

from .config import BuildConfig
from .utils import (
    clean_directory, copy_directory_tree, run_command,
    find_files, calculate_file_hash, format_file_size,
    generate_build_report, save_build_log
)

logger = logging.getLogger(__name__)


class BuildManager:
    """Manages .exe build process"""
    
    def __init__(self, config: Optional[BuildConfig] = None):
        """
        Initialize build manager
        
        Args:
            config: Build configuration
        """
        self.config = config or BuildConfig()
        self.build_start = None
        self.build_time = 0
        self.exe_path = None
        self.build_log = []
        
        logger.info(f"Build Manager initialized: {self.config.app_name} v{self.config.version}")
    
    def prepare_build(self) -> bool:
        """
        Prepare build environment
        
        Returns:
            Success status
        """
        try:
            logger.info("Preparing build environment...")
            
            # Create directories
            self.config.dist_dir.mkdir(parents=True, exist_ok=True)
            self.config.build_dir.mkdir(parents=True, exist_ok=True)
            self.config.temp_dir.mkdir(parents=True, exist_ok=True)
            
            # Clean old builds
            clean_directory(self.config.dist_dir, exclude=['.gitkeep'])
            clean_directory(self.config.build_dir, exclude=['.gitkeep'])
            
            logger.info("✓ Build environment prepared")
            return True
        except Exception as e:
            logger.error(f"Error preparing build: {e}")
            return False
    
    def build_executable(self) -> bool:
        """
        Execute build using PyInstaller
        
        Returns:
            Success status
        """
        try:
            self.build_start = time.time()
            logger.info("="*70)
            logger.info(f"Building {self.config.app_name} {self.config.version}...")
            logger.info("="*70)
            
            # Prepare
            if not self.prepare_build():
                return False
            
            # Build
            if not self._run_pyinstaller():
                return False
            
            # Verify
            if not self._verify_build():
                return False
            
            self.build_time = time.time() - self.build_start
            logger.info(f"✓ Build completed in {self.build_time:.1f}s")
            
            return True
        except Exception as e:
            logger.error(f"Build failed: {e}")
            return False
    
    def _run_pyinstaller(self) -> bool:
        """Run PyInstaller"""
        try:
            logger.info("Running PyInstaller...")
            
            # Build command
            cmd = [
                sys.executable, '-m', 'PyInstaller',
                '--name', self.config.app_name,
                '--version-file', self._create_version_file(),
                '--icon', str(self.config.icon_path),
                '--distpath', str(self.config.dist_dir),
                '--buildpath', str(self.config.build_dir),
                '--specpath', str(self.config.temp_dir),
            ]
            
            # Flags
            if self.config.one_file:
                cmd.append('--onefile')
            
            if self.config.windowed:
                cmd.append('--windowed')
            
            if self.config.optimize >= 2:
                cmd.extend(['--optimize', str(self.config.optimize)])
            
            # Hidden imports
            for imp in self.config.hidden_imports:
                cmd.extend(['--hidden-import', imp])
            
            # Data files
            for src, dst in self.config.datas:
                cmd.extend(['--add-data', f'{src}{self.config._get_sep()}{dst}'])
            
            # Entry point
            cmd.append('core/jarvis_main_v6.py')
            
            # Run
            stdout, stderr, code = run_command(cmd)
            
            if code != 0:
                logger.error(f"PyInstaller failed: {stderr}")
                return False
            
            logger.info("✓ PyInstaller completed")
            return True
        except Exception as e:
            logger.error(f"Error running PyInstaller: {e}")
            return False
    
    def _verify_build(self) -> bool:
        """Verify build output"""
        try:
            logger.info("Verifying build...")
            
            # Find .exe
            exe_files = list(self.config.dist_dir.glob('**/*.exe'))
            if not exe_files:
                logger.error("No .exe file found")
                return False
            
            self.exe_path = exe_files[0]
            
            # Check file exists
            if not self.exe_path.exists():
                logger.error(f"Executable not found: {self.exe_path}")
                return False
            
            # Check size
            size = self.exe_path.stat().st_size
            if size > self.config.max_exe_size:
                logger.warning(f"Executable too large: {format_file_size(size)}")
            
            logger.info(f"✓ Executable verified: {format_file_size(size)}")
            return True
        except Exception as e:
            logger.error(f"Error verifying build: {e}")
            return False
    
    def get_build_report(self) -> Dict:
        """
        Get build report
        
        Returns:
            Report dictionary
        """
        try:
            report = {
                'app_name': self.config.app_name,
                'version': self.config.version,
                'build_date': datetime.now().isoformat(),
                'build_time': f"{self.build_time:.1f}s",
                'python_version': sys.version.split()[0],
                'platform': sys.platform,
            }
            
            if self.exe_path and self.exe_path.exists():
                report['executable'] = str(self.exe_path)
                report['file_size'] = format_file_size(self.exe_path.stat().st_size)
                report['file_hash'] = calculate_file_hash(self.exe_path)
            
            return report
        except Exception as e:
            logger.error(f"Error generating report: {e}")
            return {}
    
    def print_build_report(self) -> None:
        """Print build report"""
        report = self.get_build_report()
        print("\n" + generate_build_report(report))
    
    def save_build_artifacts(self) -> bool:
        """Save build artifacts and metadata"""
        try:
            logger.info("Saving build artifacts...")
            
            # Save report
            report_path = self.config.dist_dir / 'build-report.json'
            with open(report_path, 'w') as f:
                json.dump(self.get_build_report(), f, indent=2)
            
            logger.info(f"✓ Artifacts saved to {self.config.dist_dir}")
            return True
        except Exception as e:
            logger.error(f"Error saving artifacts: {e}")
            return False
    
    def cleanup(self) -> bool:
        """Cleanup temporary files"""
        try:
            logger.info("Cleaning up temporary files...")
            clean_directory(self.config.temp_dir)
            logger.info("✓ Cleanup complete")
            return True
        except Exception as e:
            logger.error(f"Cleanup error: {e}")
            return False
    
    @staticmethod
    def _create_version_file() -> str:
        """Create version file for Windows"""
        version_content = '''# UTF-8
#
# For more details about fixed file info 'ffi' see:
# http://msdn.microsoft.com/en-us/library/ms646997.aspx?id=7
VSVersionInfo(
  ffi=FixedFileInfo(
# Contains as much info as Windows will allow. Change not needed.
    mask=0x3f,
    mask_flags=0x8,
    both_flags=0x8,
    OS=0x4,
    fileType=0x1,
    subtype=0x0,
    date=(0, 0)
    ),
  kids=[
StringFileInfo(
  [
  StringTable(
    u'040904B0',
    [StringStruct(u'CompanyName', u'Jarvis Development'),
    StringStruct(u'FileDescription', u'Advanced AI Desktop Assistant'),
    StringStruct(u'FileVersion', u'7.0.0.0'),
    StringStruct(u'InternalName', u'Jarvis'),
    StringStruct(u'LegalCopyright', u'Copyright 2026'),
    StringStruct(u'OriginalFilename', u'jarvis.exe'),
    StringStruct(u'ProductName', u'Jarvis AI Assistant'),
    StringStruct(u'ProductVersion', u'7.0.0.0')])
  ]), 
VariableFileInfo([VarStruct(u'Translation', [1033, 1200])])
  ]
)
'''
        return version_content
    
    @staticmethod
    def _get_sep() -> str:
        """Get path separator for PyInstaller"""
        return ';' if sys.platform == 'win32' else ':'


def build_jarvis_exe(config: Optional[BuildConfig] = None) -> bool:
    """
    Build Jarvis .exe executable
    
    Args:
        config: Build configuration
        
    Returns:
        Success status
    """
    manager = BuildManager(config)
    
    try:
        if not manager.build_executable():
            return False
        
        if not manager.save_build_artifacts():
            return False
        
        manager.print_build_report()
        manager.cleanup()
        
        return True
    except Exception as e:
        logger.error(f"Build failed: {e}")
        return False


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    success = build_jarvis_exe()
    sys.exit(0 if success else 1)
