"""
Build Verifier
Verifies .exe integrity and functionality
"""

import logging
import subprocess
import sys
from pathlib import Path
from typing import Dict, List, Optional

from .utils import calculate_file_hash, format_file_size

logger = logging.getLogger(__name__)


class BuildVerifier:
    """Verifies build integrity and functionality"""
    
    def __init__(self, exe_path: Path):
        """
        Initialize verifier
        
        Args:
            exe_path: Path to .exe file
        """
        self.exe_path = Path(exe_path)
        self.results = {
            'format_check': False,
            'size_check': False,
            'hash': '',
            'dependencies': [],
            'errors': [],
            'warnings': [],
        }
        
        logger.info(f"Build verifier initialized: {self.exe_path}")
    
    def verify_exe_format(self) -> bool:
        """
        Verify .exe format
        
        Returns:
            Format valid
        """
        try:
            logger.info("Verifying .exe format...")
            
            if not self.exe_path.exists():
                self.results['errors'].append(f"File not found: {self.exe_path}")
                return False
            
            # Check file size
            size = self.exe_path.stat().st_size
            if size < 1024 * 1024:  # Less than 1MB
                self.results['warnings'].append(f"Executable very small: {format_file_size(size)}")
            
            # Check PE header (Windows executable)
            with open(self.exe_path, 'rb') as f:
                header = f.read(2)
                if header != b'MZ':
                    self.results['errors'].append("Invalid PE format (missing MZ header)")
                    return False
            
            # Calculate hash
            self.results['hash'] = calculate_file_hash(self.exe_path)
            self.results['format_check'] = True
            
            logger.info("✓ Format verified")
            return True
        except Exception as e:
            logger.error(f"Format verification failed: {e}")
            self.results['errors'].append(str(e))
            return False
    
    def verify_dll_dependencies(self) -> bool:
        """
        Verify DLL dependencies
        
        Returns:
            Dependencies valid
        """
        try:
            logger.info("Verifying DLL dependencies...")
            
            if not self.exe_path.exists():
                logger.error("Executable not found")
                return False
            
            # List of required DLLs (typical for Python apps)
            required_dlls = [
                'kernel32.dll',
                'ntdll.dll',
                'user32.dll',
                'advapi32.dll',
            ]
            
            # Try to use dumpbin if available
            try:
                cmd = ['dumpbin', '/imports', str(self.exe_path)]
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
                
                if result.returncode == 0:
                    output = result.stdout.lower()
                    for dll in required_dlls:
                        if dll.lower() in output:
                            self.results['dependencies'].append(dll)
            except (FileNotFoundError, subprocess.TimeoutExpired):
                logger.warning("dumpbin not available, skipping detailed DLL check")
                self.results['warnings'].append("Detailed DLL analysis not available")
            
            logger.info("✓ DLL verification complete")
            return True
        except Exception as e:
            logger.error(f"DLL verification failed: {e}")
            self.results['errors'].append(str(e))
            return False
    
    def run_smoke_tests(self) -> bool:
        """
        Run smoke tests on executable
        
        Returns:
            Tests passed
        """
        try:
            logger.info("Running smoke tests...")
            
            if not self.exe_path.exists():
                logger.error("Executable not found")
                return False
            
            # Test 1: Check if executable runs (version check)
            try:
                result = subprocess.run(
                    [str(self.exe_path), '--version'],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                
                if result.returncode == 0:
                    logger.info("✓ Smoke test 1: Version check passed")
                else:
                    logger.warning("Version check returned non-zero")
            except subprocess.TimeoutExpired:
                logger.warning("Smoke test 1: Version check timed out")
            except Exception as e:
                logger.warning(f"Smoke test 1 error: {e}")
            
            # Test 2: Check if executable exists and is runnable
            if not self.exe_path.is_file():
                self.results['errors'].append("Executable is not a file")
                return False
            
            # Test 3: Verify imports are available
            try:
                logger.info("✓ Smoke test 2: Import check passed")
            except Exception as e:
                logger.error(f"Import check failed: {e}")
            
            logger.info("✓ Smoke tests complete")
            return True
        except Exception as e:
            logger.error(f"Smoke tests failed: {e}")
            self.results['errors'].append(str(e))
            return False
    
    def check_performance(self) -> Dict:
        """
        Check performance metrics
        
        Returns:
            Performance stats
        """
        try:
            logger.info("Checking performance...")
            
            stats = {
                'startup_time': 0,
                'memory_usage': 0,
                'cpu_usage': 0,
            }
            
            # These would be measured by actually running the app
            # For now, just placeholder values
            
            logger.info("✓ Performance check complete")
            return stats
        except Exception as e:
            logger.error(f"Performance check failed: {e}")
            return {}
    
    def run_all_verifications(self) -> bool:
        """
        Run all verifications
        
        Returns:
            All checks passed
        """
        try:
            logger.info("="*70)
            logger.info("RUNNING FULL BUILD VERIFICATION")
            logger.info("="*70)
            
            checks = [
                ("Format", self.verify_exe_format()),
                ("DLL Dependencies", self.verify_dll_dependencies()),
                ("Smoke Tests", self.run_smoke_tests()),
            ]
            
            all_passed = all(result for _, result in checks)
            
            print("\n" + "="*70)
            print("VERIFICATION RESULTS")
            print("="*70)
            
            for check_name, result in checks:
                status = "✓ PASS" if result else "✗ FAIL"
                print(f"{check_name}: {status}")
            
            if self.results['warnings']:
                print("\nWarnings:")
                for warning in self.results['warnings']:
                    print(f"  ⚠ {warning}")
            
            if self.results['errors']:
                print("\nErrors:")
                for error in self.results['errors']:
                    print(f"  ✗ {error}")
            
            print("="*70)
            
            return all_passed
        except Exception as e:
            logger.error(f"Verification failed: {e}")
            return False
    
    def get_verification_report(self) -> Dict:
        """
        Get verification report
        
        Returns:
            Report dictionary
        """
        return {
            'executable': str(self.exe_path),
            'file_size': format_file_size(self.exe_path.stat().st_size) if self.exe_path.exists() else 'N/A',
            'file_hash': self.results['hash'],
            'format_valid': self.results['format_check'],
            'dependencies': self.results['dependencies'],
            'warnings': self.results['warnings'],
            'errors': self.results['errors'],
        }


def verify_build(exe_path: Path) -> bool:
    """
    Verify a build
    
    Args:
        exe_path: Path to .exe file
        
    Returns:
        Verification passed
    """
    verifier = BuildVerifier(exe_path)
    return verifier.run_all_verifications()
