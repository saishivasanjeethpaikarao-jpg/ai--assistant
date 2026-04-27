"""
Cache Layer
Caches results to reduce redundant API calls and computations
"""

import logging
import time
from typing import Any, Dict, Optional, Callable
from collections import OrderedDict
from functools import wraps

logger = logging.getLogger(__name__)


class CacheLayer:
    """Cache results with TTL expiration"""
    
    def __init__(self, max_size: int = 100, ttl_seconds: int = 3600):
        """
        Initialize cache
        
        Args:
            max_size: Maximum cache size
            ttl_seconds: Time-to-live in seconds
        """
        self.cache: Dict[str, Any] = OrderedDict()
        self.expiry: Dict[str, float] = {}
        self.max_size = max_size
        self.ttl_seconds = ttl_seconds
        self.hits = 0
        self.misses = 0
        logger.info(f"Cache initialized (size={max_size}, ttl={ttl_seconds}s)")
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """
        Set cached value with optional TTL
        
        Args:
            key: Cache key
            value: Value to cache
            ttl: Time-to-live in seconds (uses default if None)
        """
        try:
            # Remove oldest if at capacity
            if len(self.cache) >= self.max_size:
                oldest_key = next(iter(self.cache))
                del self.cache[oldest_key]
                del self.expiry[oldest_key]
                logger.debug(f"Evicted oldest cache entry: {oldest_key}")
            
            # Set value and expiry
            ttl_seconds = ttl or self.ttl_seconds
            self.cache[key] = value
            self.expiry[key] = time.time() + ttl_seconds
            
            logger.debug(f"Cached {key} (expires in {ttl_seconds}s)")
        except Exception as e:
            logger.error(f"Error setting cache: {e}")
    
    def get(self, key: str) -> Optional[Any]:
        """
        Get cached value if not expired
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None
        """
        try:
            if key not in self.cache:
                self.misses += 1
                return None
            
            # Check expiry
            if time.time() > self.expiry.get(key, 0):
                del self.cache[key]
                del self.expiry[key]
                self.misses += 1
                logger.debug(f"Cache expired: {key}")
                return None
            
            self.hits += 1
            logger.debug(f"Cache hit: {key}")
            return self.cache[key]
        except Exception as e:
            logger.error(f"Error getting cache: {e}")
            return None
    
    def exists(self, key: str) -> bool:
        """Check if key exists and is not expired"""
        return self.get(key) is not None
    
    def delete(self, key: str) -> bool:
        """Delete cached entry"""
        try:
            if key in self.cache:
                del self.cache[key]
                del self.expiry[key]
                logger.debug(f"Deleted cache entry: {key}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error deleting cache: {e}")
            return False
    
    def clear(self) -> None:
        """Clear all cache entries"""
        try:
            self.cache.clear()
            self.expiry.clear()
            logger.info("Cleared all cache entries")
        except Exception as e:
            logger.error(f"Error clearing cache: {e}")
    
    def cache_result(self, ttl: Optional[int] = None) -> Callable:
        """
        Decorator to cache function results
        
        Args:
            ttl: Time-to-live in seconds
            
        Returns:
            Decorator function
        """
        def decorator(func: Callable) -> Callable:
            @wraps(func)
            def wrapper(*args, **kwargs) -> Any:
                # Create cache key from function name and arguments
                cache_key = f"{func.__name__}:{str(args)}:{str(kwargs)}"
                
                # Check cache
                cached = self.get(cache_key)
                if cached is not None:
                    return cached
                
                # Execute function and cache result
                result = func(*args, **kwargs)
                self.set(cache_key, result, ttl)
                return result
            
            return wrapper
        return decorator
    
    def cache_async(self, ttl: Optional[int] = None) -> Callable:
        """
        Decorator to cache async function results
        
        Args:
            ttl: Time-to-live in seconds
            
        Returns:
            Decorator function
        """
        def decorator(func: Callable) -> Callable:
            @wraps(func)
            async def wrapper(*args, **kwargs) -> Any:
                # Create cache key
                cache_key = f"{func.__name__}:{str(args)}:{str(kwargs)}"
                
                # Check cache
                cached = self.get(cache_key)
                if cached is not None:
                    return cached
                
                # Execute async function and cache result
                result = await func(*args, **kwargs)
                self.set(cache_key, result, ttl)
                return result
            
            return wrapper
        return decorator
    
    def get_stats(self) -> Dict:
        """Get cache statistics"""
        total_requests = self.hits + self.misses
        hit_rate = (self.hits / total_requests * 100) if total_requests > 0 else 0
        
        return {
            'size': len(self.cache),
            'max_size': self.max_size,
            'hits': self.hits,
            'misses': self.misses,
            'total_requests': total_requests,
            'hit_rate': hit_rate,
            'keys': list(self.cache.keys())
        }
    
    def print_stats(self) -> None:
        """Print cache statistics"""
        stats = self.get_stats()
        
        print("\n" + "="*50)
        print("CACHE STATISTICS")
        print("="*50)
        print(f"Size:           {stats['size']} / {stats['max_size']}")
        print(f"Hits:           {stats['hits']}")
        print(f"Misses:         {stats['misses']}")
        print(f"Total Requests: {stats['total_requests']}")
        print(f"Hit Rate:       {stats['hit_rate']:.1f}%")
        
        if stats['keys']:
            print("\nCached Keys:")
            for key in stats['keys'][:10]:
                print(f"  - {key}")
            if len(stats['keys']) > 10:
                print(f"  ... and {len(stats['keys']) - 10} more")
        
        print("="*50)


class APIResponseCache(CacheLayer):
    """Specialized cache for API responses"""
    
    def __init__(self, max_size: int = 50, ttl_seconds: int = 300):
        """
        Initialize API response cache
        
        Args:
            max_size: Maximum number of cached responses
            ttl_seconds: Default TTL (5 minutes)
        """
        super().__init__(max_size, ttl_seconds)
        logger.info("API response cache initialized")
    
    def cache_api_call(self, endpoint: str, params: Dict) -> Callable:
        """Cache API endpoint responses"""
        def decorator(func: Callable) -> Callable:
            @wraps(func)
            def wrapper(*args, **kwargs):
                cache_key = f"api:{endpoint}:{str(params)}"
                cached = self.get(cache_key)
                
                if cached is not None:
                    logger.info(f"Using cached API response: {endpoint}")
                    return cached
                
                result = func(*args, **kwargs)
                self.set(cache_key, result, ttl=self.ttl_seconds)
                return result
            
            return wrapper
        return decorator


class ComputationCache(CacheLayer):
    """Specialized cache for expensive computations"""
    
    def __init__(self, max_size: int = 100, ttl_seconds: int = 7200):
        """
        Initialize computation cache
        
        Args:
            max_size: Maximum number of cached results
            ttl_seconds: Default TTL (2 hours)
        """
        super().__init__(max_size, ttl_seconds)
        logger.info("Computation cache initialized")
    
    def cache_expensive_operation(self, ttl: Optional[int] = None) -> Callable:
        """Cache expensive computation results"""
        return self.cache_result(ttl or self.ttl_seconds)
