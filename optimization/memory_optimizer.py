"""
Memory Optimizer
Optimizes memory usage through pooling, weak references, and GC tuning
"""

import gc
import logging
import weakref
from typing import Any, Dict, List, Optional, Type
from collections import OrderedDict

logger = logging.getLogger(__name__)


class MemoryOptimizer:
    """Optimize memory usage"""
    
    def __init__(self):
        """Initialize memory optimizer"""
        self.object_pool: Dict[Type, List] = {}
        self.weak_cache = weakref.WeakValueDictionary()
        self.gc_tuned = False
        logger.info("Memory optimizer initialized")
    
    def enable_gc_optimization(self) -> None:
        """
        Tune garbage collection for better performance
        Reduces GC frequency but may increase memory temporarily
        """
        try:
            # Increase thresholds to reduce GC frequency
            gc.set_threshold(700, 10, 10)
            
            # Collect once to start clean
            gc.collect()
            
            self.gc_tuned = True
            logger.info("GC optimization enabled")
        except Exception as e:
            logger.error(f"Error tuning GC: {e}")
    
    def disable_gc_temporarily(self) -> None:
        """Disable GC for performance-critical section"""
        try:
            gc.disable()
            logger.debug("GC temporarily disabled")
        except Exception as e:
            logger.error(f"Error disabling GC: {e}")
    
    def enable_gc(self) -> None:
        """Re-enable garbage collection"""
        try:
            gc.enable()
            gc.collect()
            logger.debug("GC re-enabled and collected")
        except Exception as e:
            logger.error(f"Error enabling GC: {e}")
    
    def create_object_pool(self, cls: Type, max_size: int = 10) -> List:
        """
        Create a pool of reusable objects
        
        Args:
            cls: Class to pool
            max_size: Maximum pool size
            
        Returns:
            Pool list
        """
        try:
            pool = []
            for _ in range(max_size):
                try:
                    pool.append(cls())
                except Exception as e:
                    logger.warning(f"Could not create pooled object: {e}")
                    break
            
            self.object_pool[cls] = pool
            logger.info(f"Created object pool for {cls.__name__} (size: {len(pool)})")
            return pool
        except Exception as e:
            logger.error(f"Error creating object pool: {e}")
            return []
    
    def get_pooled_object(self, cls: Type) -> Optional[Any]:
        """
        Get object from pool (reuse or create new)
        
        Args:
            cls: Class to get
            
        Returns:
            Object instance
        """
        try:
            if cls not in self.object_pool or not self.object_pool[cls]:
                # Pool empty or doesn't exist, create new
                return cls()
            
            # Reuse from pool
            obj = self.object_pool[cls].pop()
            return obj
        except Exception as e:
            logger.error(f"Error getting pooled object: {e}")
            return cls()
    
    def return_pooled_object(self, cls: Type, obj: Any) -> bool:
        """
        Return object to pool for reuse
        
        Args:
            cls: Class of object
            obj: Object to return
            
        Returns:
            True if returned to pool
        """
        try:
            if cls not in self.object_pool:
                return False
            
            if len(self.object_pool[cls]) < 10:
                self.object_pool[cls].append(obj)
                return True
            
            return False
        except Exception as e:
            logger.error(f"Error returning pooled object: {e}")
            return False
    
    def cache_weak(self, key: str, value: Any) -> None:
        """
        Cache using weak references (allows GC when unused)
        
        Args:
            key: Cache key
            value: Value to cache
        """
        try:
            self.weak_cache[key] = value
        except Exception as e:
            logger.error(f"Error caching weakly: {e}")
    
    def get_weak(self, key: str) -> Optional[Any]:
        """
        Get value from weak cache
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None
        """
        try:
            return self.weak_cache.get(key)
        except Exception as e:
            logger.error(f"Error getting from weak cache: {e}")
            return None
    
    def cleanup_unused(self) -> int:
        """
        Force cleanup of unused memory
        
        Returns:
            Number of objects collected
        """
        try:
            collected = gc.collect()
            self.weak_cache.clear()
            logger.info(f"Cleaned up {collected} objects")
            return collected
        except Exception as e:
            logger.error(f"Error cleaning up: {e}")
            return 0
    
    def get_memory_stats(self) -> Dict:
        """
        Get memory statistics
        
        Returns:
            Dictionary with memory info
        """
        try:
            import psutil
            import os
            
            process = psutil.Process(os.getpid())
            memory_info = process.memory_info()
            
            return {
                'rss_mb': memory_info.rss / 1024 / 1024,
                'vms_mb': memory_info.vms / 1024 / 1024,
                'percent': process.memory_percent(),
                'gc_stats': gc.get_stats() if hasattr(gc, 'get_stats') else {},
                'pool_sizes': {cls.__name__: len(objs) for cls, objs in self.object_pool.items()},
                'gc_tuned': self.gc_tuned
            }
        except Exception as e:
            logger.error(f"Error getting memory stats: {e}")
            return {}
    
    def print_memory_stats(self) -> None:
        """Print memory statistics"""
        stats = self.get_memory_stats()
        
        if not stats:
            print("Could not get memory stats")
            return
        
        print("\n" + "="*50)
        print("MEMORY STATISTICS")
        print("="*50)
        print(f"RSS Memory:     {stats['rss_mb']:.2f} MB")
        print(f"VMS Memory:     {stats['vms_mb']:.2f} MB")
        print(f"Memory %:       {stats['percent']:.2f}%")
        print(f"GC Tuned:       {stats['gc_tuned']}")
        
        if stats['pool_sizes']:
            print("\nObject Pools:")
            for cls_name, size in stats['pool_sizes'].items():
                print(f"  {cls_name}: {size} objects")
        
        print("="*50)
