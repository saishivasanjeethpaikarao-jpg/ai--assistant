"""
Installer Utilities
Helper functions for installer creation
"""

import logging
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)


def generate_component_guid(component_name: str) -> str:
    """
    Generate consistent component GUID
    
    Args:
        component_name: Component name
        
    Returns:
        GUID string
    """
    import uuid
    namespace = uuid.NAMESPACE_DNS
    name = f"jarvis.installer.{component_name}"
    return str(uuid.uuid3(namespace, name))


def escape_xml(text: str) -> str:
    """
    Escape XML special characters
    
    Args:
        text: Text to escape
        
    Returns:
        Escaped text
    """
    replacements = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;',
    }
    
    for old, new in replacements.items():
        text = text.replace(old, new)
    
    return text


def format_file_size(size_bytes: int) -> str:
    """Format bytes to human readable"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.1f}{unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.1f}TB"


def create_installer_manifest(metadata: Dict, output_path: Path) -> bool:
    """
    Create installer manifest
    
    Args:
        metadata: Installer metadata
        output_path: Output file path
        
    Returns:
        Success status
    """
    try:
        manifest = {
            'created': datetime.now().isoformat(),
            'metadata': metadata,
        }
        
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w') as f:
            json.dump(manifest, f, indent=2)
        
        logger.info(f"Created manifest: {output_path}")
        return True
    except Exception as e:
        logger.error(f"Error creating manifest: {e}")
        return False


def read_installer_manifest(manifest_path: Path) -> Dict:
    """
    Read installer manifest
    
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


def generate_installer_report(metadata: Dict) -> str:
    """
    Generate installer report
    
    Args:
        metadata: Installer metadata
        
    Returns:
        Report string
    """
    report = [
        "="*70,
        "INSTALLER BUILD REPORT",
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


def validate_wix_installation() -> bool:
    """
    Check if WiX toolset is installed
    
    Returns:
        WiX is available
    """
    try:
        # Common WiX paths
        wix_paths = [
            Path('C:/Program Files (x86)/WiX Toolset v3.11/bin'),
            Path('C:/Program Files (x86)/WiX Toolset v3.14/bin'),
            Path('C:/Program Files/WiX Toolset v3.11/bin'),
        ]
        
        for wix_path in wix_paths:
            if (wix_path / 'candle.exe').exists() and (wix_path / 'light.exe').exists():
                logger.info(f"WiX found at: {wix_path}")
                return True
        
        logger.warning("WiX toolset not found")
        return False
    except Exception as e:
        logger.error(f"Error checking WiX: {e}")
        return False


def get_wix_path() -> Optional[Path]:
    """
    Get WiX installation path
    
    Returns:
        WiX path or None
    """
    try:
        wix_paths = [
            Path('C:/Program Files (x86)/WiX Toolset v3.11/bin'),
            Path('C:/Program Files (x86)/WiX Toolset v3.14/bin'),
            Path('C:/Program Files/WiX Toolset v3.11/bin'),
        ]
        
        for wix_path in wix_paths:
            if wix_path.exists():
                return wix_path
        
        return None
    except Exception as e:
        logger.error(f"Error getting WiX path: {e}")
        return None
