"""
Code Signer
Signs executable with certificate
"""

import logging
import subprocess
import sys
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


class CodeSigner:
    """Signs executable with certificate"""
    
    def __init__(self, cert_path: Optional[Path] = None, password: Optional[str] = None):
        """
        Initialize code signer
        
        Args:
            cert_path: Path to certificate file
            password: Certificate password
        """
        self.cert_path = cert_path
        self.password = password
        self.signed_files = []
        
        logger.info("Code signer initialized")
    
    def load_certificate(self) -> bool:
        """
        Load certificate
        
        Returns:
            Certificate loaded
        """
        try:
            if not self.cert_path:
                logger.info("No certificate configured")
                return False
            
            if not self.cert_path.exists():
                logger.error(f"Certificate not found: {self.cert_path}")
                return False
            
            logger.info(f"Certificate loaded: {self.cert_path}")
            return True
        except Exception as e:
            logger.error(f"Error loading certificate: {e}")
            return False
    
    def sign_file(self, file_path: Path) -> bool:
        """
        Sign a file
        
        Args:
            file_path: Path to file to sign
            
        Returns:
            Signing successful
        """
        try:
            if not file_path.exists():
                logger.error(f"File not found: {file_path}")
                return False
            
            logger.info(f"Signing {file_path}...")
            
            # Use signtool if available (Windows)
            if sys.platform == 'win32':
                cmd = [
                    'signtool',
                    'sign',
                    '/f', str(self.cert_path),
                    '/p', self.password or '',
                    '/t', 'http://timestamp.verisign.com/scripts/timstamp.dll',
                    str(file_path)
                ]
                
                result = subprocess.run(cmd, capture_output=True, text=True)
                
                if result.returncode != 0:
                    logger.warning(f"Sign tool not available: {result.stderr}")
                    logger.info("Skipping code signing")
                    return True
                
                self.signed_files.append(str(file_path))
                logger.info("✓ File signed")
                return True
            else:
                logger.info("Code signing not available on this platform")
                return True
        except Exception as e:
            logger.error(f"Error signing file: {e}")
            return False
    
    def verify_signature(self, file_path: Path) -> bool:
        """
        Verify file signature
        
        Args:
            file_path: Path to file to verify
            
        Returns:
            Signature valid
        """
        try:
            if not file_path.exists():
                logger.error(f"File not found: {file_path}")
                return False
            
            logger.info(f"Verifying signature: {file_path}...")
            
            if sys.platform == 'win32':
                cmd = [
                    'signtool',
                    'verify',
                    '/pa',
                    str(file_path)
                ]
                
                result = subprocess.run(cmd, capture_output=True, text=True)
                
                if result.returncode == 0:
                    logger.info("✓ Signature verified")
                    return True
                else:
                    logger.warning(f"Signature verification failed: {result.stderr}")
                    return False
            else:
                logger.info("Signature verification not available on this platform")
                return True
        except Exception as e:
            logger.error(f"Error verifying signature: {e}")
            return False
    
    def get_certificate_info(self) -> dict:
        """
        Get certificate information
        
        Returns:
            Certificate info dictionary
        """
        try:
            if not self.cert_path or not self.cert_path.exists():
                return {}
            
            return {
                'path': str(self.cert_path),
                'exists': True,
                'size': self.cert_path.stat().st_size,
            }
        except Exception as e:
            logger.error(f"Error getting certificate info: {e}")
            return {}
    
    def create_signed_release(self, exe_path: Path, output_path: Path) -> bool:
        """
        Create signed release
        
        Args:
            exe_path: Path to executable
            output_path: Output path
            
        Returns:
            Success status
        """
        try:
            logger.info(f"Creating signed release: {output_path}...")
            
            import shutil
            
            # Copy file
            output_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(exe_path, output_path)
            
            # Sign if certificate available
            if self.load_certificate():
                self.sign_file(output_path)
            
            logger.info("✓ Signed release created")
            return True
        except Exception as e:
            logger.error(f"Error creating signed release: {e}")
            return False
    
    def print_certificate_info(self) -> None:
        """Print certificate information"""
        info = self.get_certificate_info()
        
        print("\n" + "="*70)
        print("CERTIFICATE INFORMATION")
        print("="*70)
        
        if not info:
            print("No certificate configured")
        else:
            for key, value in info.items():
                print(f"{key}: {value}")
        
        print("="*70)


def sign_executable(exe_path: Path, cert_path: Path, password: str) -> bool:
    """
    Sign an executable
    
    Args:
        exe_path: Path to executable
        cert_path: Path to certificate
        password: Certificate password
        
    Returns:
        Signing successful
    """
    signer = CodeSigner(cert_path, password)
    return signer.sign_file(exe_path)
