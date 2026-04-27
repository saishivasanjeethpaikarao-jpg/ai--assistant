"""
Build Utilities
Helper functions for packaging
"""

import logging
import hashlib
import json
import shutil
import subprocess
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


def calculate_file_hash(file_path: Path, algorithm: str = 'sha256') -> str:
    """
    Calculate file hash
    
    Args:
        file_path: Path to file
        algorithm: Hash algorithm (sha256, md5)
        
    Returns:
        Hex hash string
    """
    try:
        hash_obj = hashlib.new(algorithm)
        with open(file_path, 'rb') as f:
            while chunk := f.read(8192):
                hash_obj.update(chunk)
        return hash_obj.hexdigest()
    except Exception as e:
        logger.error(f"Error calculating hash: {e}")
        return ""


def get_file_size(file_path: Path) -> int:
    """Get file size in bytes"""
    try:
        return file_path.stat().st_size if file_path.exists() else 0
    except Exception as e:
        logger.error(f"Error getting file size: {e}")
        return 0


def format_file_size(size_bytes: int) -> str:
    """Format bytes to human readable"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.1f}{unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.1f}TB"


def clean_directory(directory: Path, exclude: Optional[List[str]] = None) -> bool:
    """
    Clean directory safely
    
    Args:
        directory: Directory to clean
        exclude: Patterns to exclude
        
    Returns:
        Success status
    """
    try:
        exclude = exclude or []
        
        if not directory.exists():
            logger.debug(f"Directory not found: {directory}")
            return True
        
        for item in directory.iterdir():
            # Skip excluded
            if any(exc in item.name for exc in exclude):
                logger.debug(f"Skipping excluded: {item.name}")
                continue
            
            if item.is_dir():
                shutil.rmtree(item)
            else:
                item.unlink()
        
        logger.info(f"Cleaned directory: {directory}")
        return True
    except Exception as e:
        logger.error(f"Error cleaning directory: {e}")
        return False


def copy_directory_tree(src: Path, dst: Path, exclude: Optional[List[str]] = None) -> bool:
    """
    Copy directory tree
    
    Args:
        src: Source directory
        dst: Destination directory
        exclude: Patterns to exclude
        
    Returns:
        Success status
    """
    try:
        exclude = exclude or ['.git', '.pytest_cache', '__pycache__']
        
        if not src.exists():
            logger.error(f"Source not found: {src}")
            return False
        
        dst.mkdir(parents=True, exist_ok=True)
        
        for src_item in src.rglob('*'):
            # Skip excluded
            if any(exc in src_item.parts for exc in exclude):
                continue
            
            rel_path = src_item.relative_to(src)
            dst_item = dst / rel_path
            
            if src_item.is_dir():
                dst_item.mkdir(parents=True, exist_ok=True)
            else:
                dst_item.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(src_item, dst_item)
        
        logger.info(f"Copied tree: {src} → {dst}")
        return True
    except Exception as e:
        logger.error(f"Error copying tree: {e}")
        return False


def run_command(cmd: List[str], cwd: Optional[Path] = None, timeout: int = 300) -> tuple:
    """
    Run command and return output
    
    Args:
        cmd: Command parts
        cwd: Working directory
        timeout: Timeout in seconds
        
    Returns:
        (stdout, stderr, return_code)
    """
    try:
        logger.info(f"Running: {' '.join(cmd)}")
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            cwd=cwd,
            timeout=timeout
        )
        
        if result.returncode != 0:
            logger.warning(f"Command failed: {result.stderr}")
        
        return result.stdout, result.stderr, result.returncode
    except subprocess.TimeoutExpired:
        logger.error(f"Command timeout: {' '.join(cmd)}")
        return "", f"Timeout after {timeout}s", 1
    except Exception as e:
        logger.error(f"Error running command: {e}")
        return "", str(e), 1


def find_files(directory: Path, pattern: str = "*", exclude: Optional[List[str]] = None) -> List[Path]:
    """
    Find files matching pattern
    
    Args:
        directory: Search directory
        pattern: File pattern
        exclude: Patterns to exclude
        
    Returns:
        List of matching files
    """
    try:
        exclude = exclude or []
        files = []
        
        for file in directory.rglob(pattern):
            if any(exc in str(file) for exc in exclude):
                continue
            if file.is_file():
                files.append(file)
        
        return files
    except Exception as e:
        logger.error(f"Error finding files: {e}")
        return []


def create_manifest(items: Dict, output_path: Path) -> bool:
    """
    Create JSON manifest
    
    Args:
        items: Dictionary of items
        output_path: Output file path
        
    Returns:
        Success status
    """
    try:
        manifest = {
            'created': datetime.now().isoformat(),
            'items': items,
        }
        
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w') as f:
            json.dump(manifest, f, indent=2)
        
        logger.info(f"Created manifest: {output_path}")
        return True
    except Exception as e:
        logger.error(f"Error creating manifest: {e}")
        return False


def read_manifest(manifest_path: Path) -> Dict:
    """
    Read JSON manifest
    
    Args:
        manifest_path: Manifest file path
        
    Returns:
        Manifest dictionary
    """
    try:
        if not manifest_path.exists():
            return {}
        
        with open(manifest_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error reading manifest: {e}")
        return {}


def generate_build_report(metadata: Dict) -> str:
    """
    Generate build report
    
    Args:
        metadata: Build metadata
        
    Returns:
        Report string
    """
    report = [
        "="*70,
        "BUILD REPORT",
        "="*70,
    ]
    
    for key, value in metadata.items():
        if isinstance(value, dict):
            report.append(f"\n{key}:")
            for k, v in value.items():
                report.append(f"  {k}: {v}")
        else:
            report.append(f"{key}: {value}")
    
    report.append("="*70)
    return "\n".join(report)


def save_build_log(log_content: str, log_path: Path) -> bool:
    """
    Save build log
    
    Args:
        log_content: Log content
        log_path: Output path
        
    Returns:
        Success status
    """
    try:
        log_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(log_path, 'w') as f:
            f.write(log_content)
        
        logger.info(f"Saved build log: {log_path}")
        return True
    except Exception as e:
        logger.error(f"Error saving build log: {e}")
        return False
