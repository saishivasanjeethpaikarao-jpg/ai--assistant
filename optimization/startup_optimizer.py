"""
Startup Optimizer
Minimizes application startup time through lazy imports and parallel initialization
"""

import asyncio
import importlib
import logging
import time
import re
from typing import Callable, Dict, List, Any, Optional, Coroutine
from functools import lru_cache

logger = logging.getLogger(__name__)


class StartupOptimizer:
    """Optimize startup time"""
    
    def __init__(self):
        """Initialize startup optimizer"""
        self.import_cache: Dict[str, Any] = {}
        self.startup_time = 0.0
        self.regex_cache: Dict[str, Any] = {}
        logger.info("Startup optimizer initialized")
    
    def lazy_import(self, module_name: str) -> Any:
        """
        Import module lazily (only when first accessed)
        
        Args:
            module_name: Module to import
            
        Returns:
            Imported module
        """
        try:
            if module_name not in self.import_cache:
                logger.debug(f"Lazy importing {module_name}")
                module = importlib.import_module(module_name)
                self.import_cache[module_name] = module
            
            return self.import_cache[module_name]
        except ImportError as e:
            logger.error(f"Error lazy importing {module_name}: {e}")
            raise
    
    def lazy_attribute(self, module_name: str, attr_name: str) -> Any:
        """
        Lazy get attribute from module
        
        Args:
            module_name: Module name
            attr_name: Attribute name
            
        Returns:
            Attribute value
        """
        try:
            module = self.lazy_import(module_name)
            return getattr(module, attr_name)
        except Exception as e:
            logger.error(f"Error getting attribute {attr_name} from {module_name}: {e}")
            raise
    
    async def parallel_init(self, *tasks: Coroutine) -> List[Any]:
        """
        Initialize multiple async tasks in parallel
        
        Args:
            *tasks: Async tasks to run
            
        Returns:
            List of results
        """
        try:
            logger.info(f"Running {len(tasks)} tasks in parallel")
            results = await asyncio.gather(*tasks, return_exceptions=False)
            return results
        except Exception as e:
            logger.error(f"Error in parallel initialization: {e}")
            return []
    
    async def parallel_sync_init(self, *funcs: Callable) -> List[Any]:
        """
        Run multiple sync functions in parallel via thread pool
        
        Args:
            *funcs: Functions to run
            
        Returns:
            List of results
        """
        try:
            logger.info(f"Running {len(funcs)} functions in parallel")
            loop = asyncio.get_event_loop()
            tasks = [loop.run_in_executor(None, func) for func in funcs]
            results = await asyncio.gather(*tasks, return_exceptions=False)
            return results
        except Exception as e:
            logger.error(f"Error in parallel sync initialization: {e}")
            return []
    
    @lru_cache(maxsize=256)
    def precompile_regex(self, pattern: str) -> Any:
        """
        Cache compiled regex patterns
        
        Args:
            pattern: Regex pattern
            
        Returns:
            Compiled regex
        """
        try:
            return re.compile(pattern)
        except Exception as e:
            logger.error(f"Error compiling regex: {e}")
            raise
    
    def match_pattern(self, pattern: str, text: str) -> Optional[Any]:
        """
        Match text with cached regex pattern
        
        Args:
            pattern: Regex pattern
            text: Text to match
            
        Returns:
            Match object or None
        """
        try:
            regex = self.precompile_regex(pattern)
            return regex.search(text)
        except Exception as e:
            logger.error(f"Error matching pattern: {e}")
            return None
    
    def measure_startup(self, func: Callable) -> tuple:
        """
        Measure function startup time
        
        Args:
            func: Function to measure
            
        Returns:
            Tuple of (result, elapsed_ms)
        """
        try:
            start = time.time()
            result = func()
            elapsed_ms = (time.time() - start) * 1000
            self.startup_time = elapsed_ms
            
            logger.info(f"Startup time: {elapsed_ms:.2f}ms")
            return result, elapsed_ms
        except Exception as e:
            logger.error(f"Error measuring startup: {e}")
            raise
    
    async def measure_async_startup(self, coro: Coroutine) -> tuple:
        """
        Measure async function startup time
        
        Args:
            coro: Async coroutine
            
        Returns:
            Tuple of (result, elapsed_ms)
        """
        try:
            start = time.time()
            result = await coro
            elapsed_ms = (time.time() - start) * 1000
            self.startup_time = elapsed_ms
            
            logger.info(f"Async startup time: {elapsed_ms:.2f}ms")
            return result, elapsed_ms
        except Exception as e:
            logger.error(f"Error measuring async startup: {e}")
            raise
    
    def warm_up_caches(self) -> None:
        """Pre-warm caches with common patterns"""
        try:
            logger.info("Warming up caches")
            
            # Pre-compile common regex patterns
            common_patterns = [
                r'\d+',                    # Numbers
                r'[a-zA-Z]+',              # Words
                r'\S+@\S+',                # Email
                r'https?://\S+',           # URLs
                r'"[^"]*"',                # Quoted strings
            ]
            
            for pattern in common_patterns:
                self.precompile_regex(pattern)
            
            logger.info(f"Pre-compiled {len(common_patterns)} regex patterns")
        except Exception as e:
            logger.error(f"Error warming up caches: {e}")
    
    def get_import_cache_stats(self) -> Dict:
        """Get import cache statistics"""
        return {
            'cached_modules': len(self.import_cache),
            'cached_patterns': len(self.regex_cache),
            'modules': list(self.import_cache.keys()),
            'startup_time_ms': self.startup_time
        }
    
    def print_startup_stats(self) -> None:
        """Print startup statistics"""
        stats = self.get_import_cache_stats()
        
        print("\n" + "="*50)
        print("STARTUP STATISTICS")
        print("="*50)
        print(f"Startup Time:    {stats['startup_time_ms']:.2f}ms")
        print(f"Cached Modules:  {stats['cached_modules']}")
        print(f"Cached Patterns: {stats['cached_patterns']}")
        
        if stats['modules']:
            print("\nCached Modules:")
            for module in stats['modules'][:10]:
                print(f"  - {module}")
            if len(stats['modules']) > 10:
                print(f"  ... and {len(stats['modules']) - 10} more")
        
        print("="*50)
    
    def clear_caches(self) -> None:
        """Clear all caches"""
        try:
            self.import_cache.clear()
            self.regex_cache.clear()
            self.precompile_regex.cache_clear()
            logger.info("Cleared all caches")
        except Exception as e:
            logger.error(f"Error clearing caches: {e}")
