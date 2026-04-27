"""
Resource Bundler
Collects and bundles resources for .exe
"""

import logging
import json
from pathlib import Path
from typing import Dict, List, Optional

from .utils import find_files, calculate_file_hash, format_file_size, create_manifest

logger = logging.getLogger(__name__)


class ResourceBundler:
    """Bundles resources into executable"""
    
    RESOURCE_TYPES = {
        'icons': ['*.ico', '*.png', '*.jpg'],
        'audio': ['*.wav', '*.mp3', '*.flac'],
        'config': ['*.json', '*.yaml', '*.yml', '*.ini'],
        'data': ['*.db', '*.csv', '*.xlsx'],
        'language': ['*.txt', '*.po', '*.mo'],
    }
    
    def __init__(self, assets_dir: Path = None):
        """
        Initialize resource bundler
        
        Args:
            assets_dir: Assets directory
        """
        self.assets_dir = assets_dir or Path('assets')
        self.resources: Dict[str, List[Path]] = {rtype: [] for rtype in self.RESOURCE_TYPES}
        self.manifest: Dict = {}
        
        logger.info(f"Resource bundler initialized: {self.assets_dir}")
    
    def collect_resources(self) -> bool:
        """
        Collect all resources
        
        Returns:
            Success status
        """
        try:
            logger.info("Collecting resources...")
            
            for rtype, patterns in self.RESOURCE_TYPES.items():
                for pattern in patterns:
                    files = find_files(self.assets_dir, pattern)
                    self.resources[rtype].extend(files)
                    
                    if files:
                        logger.debug(f"Found {len(files)} {rtype} files")
            
            total = sum(len(files) for files in self.resources.values())
            logger.info(f"✓ Collected {total} resources")
            return True
        except Exception as e:
            logger.error(f"Error collecting resources: {e}")
            return False
    
    def validate_resources(self) -> bool:
        """
        Validate collected resources
        
        Returns:
            Validation success
        """
        try:
            logger.info("Validating resources...")
            
            for rtype, files in self.resources.items():
                for file in files:
                    if not file.exists():
                        logger.error(f"Missing resource: {file}")
                        return False
                    
                    # Check size
                    size = file.stat().st_size
                    if size == 0:
                        logger.warning(f"Empty resource: {file}")
            
            logger.info("✓ Resources validated")
            return True
        except Exception as e:
            logger.error(f"Validation error: {e}")
            return False
    
    def create_manifest(self, output_path: Path = None) -> bool:
        """
        Create resource manifest
        
        Args:
            output_path: Output manifest file
            
        Returns:
            Success status
        """
        try:
            logger.info("Creating resource manifest...")
            
            manifest = {
                'resources': {},
                'total': 0,
                'size': 0,
            }
            
            # Index resources
            for rtype, files in self.resources.items():
                manifest['resources'][rtype] = []
                
                for file in files:
                    size = file.stat().st_size
                    file_hash = calculate_file_hash(file)
                    
                    manifest['resources'][rtype].append({
                        'path': str(file),
                        'size': size,
                        'hash': file_hash,
                    })
                    
                    manifest['total'] += 1
                    manifest['size'] += size
            
            self.manifest = manifest
            
            # Save if path provided
            if output_path:
                output_path.parent.mkdir(parents=True, exist_ok=True)
                with open(output_path, 'w') as f:
                    json.dump(manifest, f, indent=2)
                logger.info(f"✓ Manifest saved: {output_path}")
            
            return True
        except Exception as e:
            logger.error(f"Error creating manifest: {e}")
            return False
    
    def get_resource_stats(self) -> Dict:
        """
        Get resource statistics
        
        Returns:
            Statistics dictionary
        """
        stats = {
            'by_type': {},
            'total_files': 0,
            'total_size': 0,
        }
        
        for rtype, files in self.resources.items():
            stats['by_type'][rtype] = {
                'count': len(files),
                'size': sum(f.stat().st_size for f in files),
            }
            stats['total_files'] += len(files)
            stats['total_size'] += stats['by_type'][rtype]['size']
        
        return stats
    
    def print_resource_summary(self) -> None:
        """Print resource summary"""
        stats = self.get_resource_stats()
        
        print("\n" + "="*70)
        print("RESOURCE SUMMARY")
        print("="*70)
        
        for rtype, info in stats['by_type'].items():
            print(f"{rtype}: {info['count']} files, {format_file_size(info['size'])}")
        
        print(f"\nTotal: {stats['total_files']} files, {format_file_size(stats['total_size'])}")
        print("="*70)
    
    def get_resource_list(self, rtype: str = None) -> List[Path]:
        """
        Get resource list
        
        Args:
            rtype: Resource type filter (None for all)
            
        Returns:
            List of resource paths
        """
        if rtype:
            return self.resources.get(rtype, [])
        
        return [f for files in self.resources.values() for f in files]
    
    def bundle_resources(self, output_dir: Path) -> bool:
        """
        Bundle resources into output directory
        
        Args:
            output_dir: Output directory
            
        Returns:
            Success status
        """
        try:
            logger.info(f"Bundling resources to {output_dir}...")
            
            output_dir.mkdir(parents=True, exist_ok=True)
            
            # Copy each resource preserving structure
            for file in self.get_resource_list():
                rel_path = file.relative_to(self.assets_dir)
                output_file = output_dir / rel_path
                
                output_file.parent.mkdir(parents=True, exist_ok=True)
                
                import shutil
                shutil.copy2(file, output_file)
            
            logger.info("✓ Resources bundled")
            return True
        except Exception as e:
            logger.error(f"Error bundling resources: {e}")
            return False


def bundle_assets(assets_dir: Path = None, output_dir: Path = None) -> bool:
    """
    Bundle all assets
    
    Args:
        assets_dir: Assets directory
        output_dir: Output directory
        
    Returns:
        Success status
    """
    bundler = ResourceBundler(assets_dir)
    
    try:
        if not bundler.collect_resources():
            return False
        
        if not bundler.validate_resources():
            return False
        
        if not bundler.create_manifest():
            return False
        
        if output_dir:
            if not bundler.bundle_resources(output_dir):
                return False
        
        bundler.print_resource_summary()
        return True
    except Exception as e:
        logger.error(f"Asset bundling failed: {e}")
        return False
