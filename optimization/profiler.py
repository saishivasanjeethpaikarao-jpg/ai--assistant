"""
Performance Profiler
Measures and analyzes performance metrics for Jarvis components
"""

import time
import logging
import psutil
import os
from typing import Dict, Optional, Callable
from functools import wraps
from dataclasses import dataclass, asdict
from datetime import datetime

logger = logging.getLogger(__name__)


@dataclass
class PerformanceMetrics:
    """Performance measurement data"""
    timestamp: str
    startup_ms: float = 0.0
    memory_mb: float = 0.0
    cpu_percent: float = 0.0
    response_ms: float = 0.0
    function_name: str = ""
    call_count: int = 0
    total_time_ms: float = 0.0
    avg_time_ms: float = 0.0
    max_time_ms: float = 0.0
    min_time_ms: float = 0.0


class PerformanceProfiler:
    """Measure and analyze performance"""
    
    def __init__(self):
        """Initialize profiler"""
        self.process = psutil.Process(os.getpid())
        self.metrics = []
        self.function_stats = {}
        self.start_time = time.time()
        logger.info("Performance profiler initialized")
    
    def measure_startup_time(self, func: Callable) -> float:
        """
        Measure function startup time
        
        Args:
            func: Function to measure
            
        Returns:
            Execution time in milliseconds
        """
        start = time.time()
        func()
        elapsed_ms = (time.time() - start) * 1000
        
        metric = PerformanceMetrics(
            timestamp=datetime.now().isoformat(),
            startup_ms=elapsed_ms
        )
        self.metrics.append(metric)
        logger.info(f"Startup time: {elapsed_ms:.2f}ms")
        
        return elapsed_ms
    
    def measure_memory_usage(self) -> float:
        """
        Get current memory usage
        
        Returns:
            Memory usage in MB
        """
        memory_info = self.process.memory_info()
        memory_mb = memory_info.rss / 1024 / 1024
        
        metric = PerformanceMetrics(
            timestamp=datetime.now().isoformat(),
            memory_mb=memory_mb
        )
        self.metrics.append(metric)
        logger.info(f"Memory usage: {memory_mb:.2f}MB")
        
        return memory_mb
    
    def measure_cpu_usage(self, duration: float = 1.0) -> float:
        """
        Get CPU usage percentage
        
        Args:
            duration: Measurement duration in seconds
            
        Returns:
            CPU usage percentage
        """
        cpu_percent = self.process.cpu_percent(interval=duration)
        
        metric = PerformanceMetrics(
            timestamp=datetime.now().isoformat(),
            cpu_percent=cpu_percent
        )
        self.metrics.append(metric)
        logger.info(f"CPU usage: {cpu_percent:.2f}%")
        
        return cpu_percent
    
    def measure_response_time(self, func: Callable, *args, **kwargs) -> tuple:
        """
        Measure function response time
        
        Args:
            func: Function to measure
            *args, **kwargs: Function arguments
            
        Returns:
            Tuple of (result, elapsed_ms)
        """
        start = time.time()
        result = func(*args, **kwargs)
        elapsed_ms = (time.time() - start) * 1000
        
        metric = PerformanceMetrics(
            timestamp=datetime.now().isoformat(),
            response_ms=elapsed_ms,
            function_name=func.__name__
        )
        self.metrics.append(metric)
        logger.info(f"Response time ({func.__name__}): {elapsed_ms:.2f}ms")
        
        return result, elapsed_ms
    
    def profile(self, func: Callable) -> Callable:
        """
        Decorator for profiling function performance
        
        Args:
            func: Function to profile
            
        Returns:
            Wrapped function
        """
        @wraps(func)
        def wrapper(*args, **kwargs):
            func_name = func.__name__
            start = time.time()
            
            try:
                result = func(*args, **kwargs)
                elapsed_ms = (time.time() - start) * 1000
                
                # Update statistics
                if func_name not in self.function_stats:
                    self.function_stats[func_name] = {
                        'call_count': 0,
                        'total_time_ms': 0,
                        'max_time_ms': 0,
                        'min_time_ms': float('inf')
                    }
                
                stats = self.function_stats[func_name]
                stats['call_count'] += 1
                stats['total_time_ms'] += elapsed_ms
                stats['max_time_ms'] = max(stats['max_time_ms'], elapsed_ms)
                stats['min_time_ms'] = min(stats['min_time_ms'], elapsed_ms)
                
                return result
            except Exception as e:
                logger.error(f"Error in profiled function {func_name}: {e}")
                raise
        
        return wrapper
    
    def get_function_stats(self, func_name: str) -> Optional[Dict]:
        """Get statistics for a profiled function"""
        if func_name not in self.function_stats:
            return None
        
        stats = self.function_stats[func_name]
        stats['avg_time_ms'] = stats['total_time_ms'] / stats['call_count'] if stats['call_count'] > 0 else 0
        
        return stats
    
    def get_all_function_stats(self) -> Dict:
        """Get statistics for all profiled functions"""
        results = {}
        for func_name, stats in self.function_stats.items():
            stats_copy = stats.copy()
            stats_copy['avg_time_ms'] = stats_copy['total_time_ms'] / stats_copy['call_count'] if stats_copy['call_count'] > 0 else 0
            results[func_name] = stats_copy
        return results
    
    def generate_report(self) -> Dict:
        """
        Generate comprehensive performance report
        
        Returns:
            Dictionary with performance metrics
        """
        if not self.metrics:
            return {}
        
        startup_times = [m.startup_ms for m in self.metrics if m.startup_ms > 0]
        memory_usages = [m.memory_mb for m in self.metrics if m.memory_mb > 0]
        cpu_usages = [m.cpu_percent for m in self.metrics if m.cpu_percent > 0]
        response_times = [m.response_ms for m in self.metrics if m.response_ms > 0]
        
        report = {
            'total_measurements': len(self.metrics),
            'startup': {
                'latest': startup_times[-1] if startup_times else 0,
                'average': sum(startup_times) / len(startup_times) if startup_times else 0,
                'min': min(startup_times) if startup_times else 0,
                'max': max(startup_times) if startup_times else 0,
            },
            'memory': {
                'latest': memory_usages[-1] if memory_usages else 0,
                'average': sum(memory_usages) / len(memory_usages) if memory_usages else 0,
                'min': min(memory_usages) if memory_usages else 0,
                'max': max(memory_usages) if memory_usages else 0,
            },
            'cpu': {
                'latest': cpu_usages[-1] if cpu_usages else 0,
                'average': sum(cpu_usages) / len(cpu_usages) if cpu_usages else 0,
                'min': min(cpu_usages) if cpu_usages else 0,
                'max': max(cpu_usages) if cpu_usages else 0,
            },
            'response': {
                'latest': response_times[-1] if response_times else 0,
                'average': sum(response_times) / len(response_times) if response_times else 0,
                'min': min(response_times) if response_times else 0,
                'max': max(response_times) if response_times else 0,
            },
            'function_stats': self.get_all_function_stats()
        }
        
        return report
    
    def print_report(self) -> None:
        """Print formatted performance report"""
        report = self.generate_report()
        
        if not report:
            print("No metrics collected yet")
            return
        
        print("\n" + "="*60)
        print("PERFORMANCE REPORT")
        print("="*60)
        
        print("\nSTARTUP TIME (ms):")
        print(f"  Latest:  {report['startup']['latest']:.2f}")
        print(f"  Average: {report['startup']['average']:.2f}")
        print(f"  Min/Max: {report['startup']['min']:.2f} / {report['startup']['max']:.2f}")
        
        print("\nMEMORY USAGE (MB):")
        print(f"  Latest:  {report['memory']['latest']:.2f}")
        print(f"  Average: {report['memory']['average']:.2f}")
        print(f"  Min/Max: {report['memory']['min']:.2f} / {report['memory']['max']:.2f}")
        
        print("\nCPU USAGE (%):")
        print(f"  Latest:  {report['cpu']['latest']:.2f}")
        print(f"  Average: {report['cpu']['average']:.2f}")
        print(f"  Min/Max: {report['cpu']['min']:.2f} / {report['cpu']['max']:.2f}")
        
        print("\nRESPONSE TIME (ms):")
        print(f"  Latest:  {report['response']['latest']:.2f}")
        print(f"  Average: {report['response']['average']:.2f}")
        print(f"  Min/Max: {report['response']['min']:.2f} / {report['response']['max']:.2f}")
        
        if report['function_stats']:
            print("\nFUNCTION STATISTICS:")
            for func_name, stats in report['function_stats'].items():
                print(f"\n  {func_name}():")
                print(f"    Calls:   {stats['call_count']}")
                print(f"    Total:   {stats['total_time_ms']:.2f}ms")
                print(f"    Average: {stats['avg_time_ms']:.2f}ms")
                print(f"    Min/Max: {stats['min_time_ms']:.2f} / {stats['max_time_ms']:.2f}ms")
        
        print("\n" + "="*60)
