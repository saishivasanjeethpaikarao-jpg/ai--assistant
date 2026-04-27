"""
Installer Builder
Orchestrates .msi build process
"""

import logging
import time
import json
import subprocess
import sys
from pathlib import Path
from typing import Dict, Optional

from .config import InstallerConfig
from .wix_generator import WiXGenerator

logger = logging.getLogger(__name__)


class InstallerBuilder:
    """Builds Windows .msi installer"""
    
    def __init__(self, config: Optional[InstallerConfig] = None):
        """
        Initialize installer builder
        
        Args:
            config: Installer configuration
        """
        self.config = config or InstallerConfig()
        self.build_start = None
        self.build_time = 0
        self.msi_path = None
        
        logger.info(f"Installer builder initialized: {self.config.app_name} v{self.config.version}")
    
    def prepare_build(self) -> bool:
        """
        Prepare build environment
        
        Returns:
            Success status
        """
        try:
            logger.info("Preparing build environment...")
            
            # Create directories
            self.config.output_dir.mkdir(parents=True, exist_ok=True)
            self.config.build_dir.mkdir(parents=True, exist_ok=True)
            
            # Verify configuration
            if not self.config.validate():
                logger.warning("Configuration validation warnings")
            
            logger.info("✓ Build environment prepared")
            return True
        except Exception as e:
            logger.error(f"Error preparing build: {e}")
            return False
    
    def build_msi(self) -> bool:
        """
        Build .msi installer
        
        Returns:
            Success status
        """
        try:
            self.build_start = time.time()
            logger.info("="*70)
            logger.info(f"Building installer: {self.config.app_name} {self.config.version}")
            logger.info("="*70)
            
            # Prepare
            if not self.prepare_build():
                return False
            
            # Generate WiX
            if not self._generate_wix():
                return False
            
            # Compile with WiX (optional - if WiX is installed)
            if not self._compile_wix():
                logger.info("WiX compilation skipped (WiX not installed)")
            
            self.build_time = time.time() - self.build_start
            logger.info(f"✓ Build completed in {self.build_time:.1f}s")
            
            return True
        except Exception as e:
            logger.error(f"Build failed: {e}")
            return False
    
    def _generate_wix(self) -> bool:
        """Generate WiX files"""
        try:
            logger.info("Generating WiX files...")
            
            generator = WiXGenerator(self.config)
            if not generator.save_wxs_files():
                return False
            
            generator.print_wix_summary()
            logger.info("✓ WiX files generated")
            return True
        except Exception as e:
            logger.error(f"Error generating WiX: {e}")
            return False
    
    def _compile_wix(self) -> bool:
        """Compile WiX to .msi"""
        try:
            logger.info("Compiling WiX files...")
            
            # Check if WiX is installed
            wix_path = self.config.wix_path
            if not wix_path.exists():
                logger.warning(f"WiX not found at: {wix_path}")
                return False
            
            candle_exe = wix_path / 'candle.exe'
            light_exe = wix_path / 'light.exe'
            
            if not candle_exe.exists() or not light_exe.exists():
                logger.warning("WiX tools not found")
                return False
            
            # Run candle (preprocess and compile)
            wxs_files = list(self.config.build_dir.glob('*.wxs'))
            for wxs in wxs_files:
                cmd = [str(candle_exe), '-o', str(self.config.build_dir / f'{wxs.stem}.obj'), str(wxs)]
                result = subprocess.run(cmd, capture_output=True, text=True)
                
                if result.returncode != 0:
                    logger.error(f"Candle failed: {result.stderr}")
                    return False
            
            # Run light (link)
            obj_files = list(self.config.build_dir.glob('*.obj'))
            self.msi_path = self.config.output_dir / f'{self.config.app_name}-{self.config.version}.msi'
            
            cmd = [str(light_exe), '-out', str(self.msi_path)] + [str(obj) for obj in obj_files]
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode != 0:
                logger.error(f"Light failed: {result.stderr}")
                return False
            
            logger.info(f"✓ MSI created: {self.msi_path}")
            return True
        except Exception as e:
            logger.error(f"WiX compilation error: {e}")
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
                'manufacturer': self.config.manufacturer,
                'build_time': f"{self.build_time:.1f}s",
                'python_version': sys.version.split()[0],
                'platform': sys.platform,
            }
            
            if self.msi_path and self.msi_path.exists():
                report['installer'] = str(self.msi_path)
                report['file_size'] = f"{self.msi_path.stat().st_size / 1024 / 1024:.1f} MB"
            
            return report
        except Exception as e:
            logger.error(f"Error generating report: {e}")
            return {}
    
    def print_build_report(self) -> None:
        """Print build report"""
        report = self.get_build_report()
        
        print("\n" + "="*70)
        print("INSTALLER BUILD REPORT")
        print("="*70)
        for key, value in report.items():
            print(f"{key}: {value}")
        print("="*70)
    
    def save_build_artifacts(self) -> bool:
        """Save build artifacts"""
        try:
            logger.info("Saving build artifacts...")
            
            report_path = self.config.output_dir / 'installer-report.json'
            with open(report_path, 'w') as f:
                json.dump(self.get_build_report(), f, indent=2)
            
            logger.info("✓ Artifacts saved")
            return True
        except Exception as e:
            logger.error(f"Error saving artifacts: {e}")
            return False


def build_jarvis_installer(config: Optional[InstallerConfig] = None) -> bool:
    """
    Build Jarvis installer
    
    Args:
        config: Installer configuration
        
    Returns:
        Success status
    """
    builder = InstallerBuilder(config)
    
    try:
        if not builder.build_msi():
            return False
        
        if not builder.save_build_artifacts():
            return False
        
        builder.print_build_report()
        return True
    except Exception as e:
        logger.error(f"Installer build failed: {e}")
        return False


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    success = build_jarvis_installer()
    sys.exit(0 if success else 1)
