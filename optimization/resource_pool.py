"""
Resource Pool
Manages reusable resources like database connections and thread pools
"""

import logging
import queue
import threading
from typing import Any, Optional, Type, List

logger = logging.getLogger(__name__)


class ResourcePool:
    """Generic resource pool for connection/object reuse"""
    
    def __init__(self, resource_factory, max_size: int = 10, timeout: float = 5.0):
        """
        Initialize resource pool
        
        Args:
            resource_factory: Callable that creates resources
            max_size: Maximum pool size
            timeout: Timeout for getting resource
        """
        self.resource_factory = resource_factory
        self.max_size = max_size
        self.timeout = timeout
        self.pool: queue.Queue = queue.Queue(maxsize=max_size)
        self.all_resources: List[Any] = []
        self.lock = threading.Lock()
        
        # Pre-populate pool
        for _ in range(max_size):
            try:
                resource = resource_factory()
                self.pool.put(resource, block=False)
                self.all_resources.append(resource)
            except Exception as e:
                logger.warning(f"Failed to create pooled resource: {e}")
        
        logger.info(f"Resource pool initialized (size={len(self.all_resources)}/{max_size})")
    
    def get(self) -> Optional[Any]:
        """
        Get resource from pool
        
        Returns:
            Resource object or None
        """
        try:
            # Try to get from pool
            resource = self.pool.get(timeout=self.timeout)
            return resource
        except queue.Empty:
            # Pool empty, create new if possible
            try:
                resource = self.resource_factory()
                with self.lock:
                    if len(self.all_resources) < self.max_size:
                        self.all_resources.append(resource)
                logger.debug("Created new resource")
                return resource
            except Exception as e:
                logger.error(f"Failed to create resource: {e}")
                return None
    
    def put(self, resource: Any) -> bool:
        """
        Return resource to pool
        
        Args:
            resource: Resource to return
            
        Returns:
            True if returned to pool
        """
        try:
            self.pool.put(resource, timeout=1.0)
            return True
        except queue.Full:
            logger.debug("Pool full, discarding resource")
            return False
    
    def __enter__(self):
        """Context manager support"""
        return self.get()
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager support"""
        if isinstance(exc_type, Exception):
            self.put(None)  # Return None for bad resource
        else:
            self.put(self.__enter__())
    
    def get_size(self) -> int:
        """Get current pool size"""
        return self.pool.qsize()
    
    def get_total_resources(self) -> int:
        """Get total resources created"""
        with self.lock:
            return len(self.all_resources)
    
    def clear(self) -> None:
        """Clear pool and cleanup resources"""
        try:
            while True:
                resource = self.pool.get_nowait()
                if hasattr(resource, 'close'):
                    resource.close()
        except queue.Empty:
            pass
        
        with self.lock:
            self.all_resources.clear()
        
        logger.info("Resource pool cleared")


class ConnectionPool(ResourcePool):
    """Specialized pool for database connections"""
    
    def __init__(self, connection_factory, max_size: int = 5):
        """
        Initialize connection pool
        
        Args:
            connection_factory: Callable that creates connections
            max_size: Maximum connections
        """
        super().__init__(connection_factory, max_size)
        logger.info(f"Connection pool initialized (max={max_size})")
    
    def execute(self, query: str, *args) -> Optional[Any]:
        """
        Execute query using pooled connection
        
        Args:
            query: SQL query
            *args: Query parameters
            
        Returns:
            Query result or None
        """
        connection = self.get()
        if not connection:
            logger.error("No connection available")
            return None
        
        try:
            cursor = connection.cursor()
            cursor.execute(query, args)
            result = cursor.fetchall()
            cursor.close()
            return result
        except Exception as e:
            logger.error(f"Query execution failed: {e}")
            return None
        finally:
            self.put(connection)


class ThreadPool:
    """Simple thread pool for async operations"""
    
    def __init__(self, max_threads: int = 10):
        """
        Initialize thread pool
        
        Args:
            max_threads: Maximum number of threads
        """
        self.max_threads = max_threads
        self.queue: queue.Queue = queue.Queue()
        self.workers: List[threading.Thread] = []
        self.running = True
        
        # Start worker threads
        for _ in range(max_threads):
            worker = threading.Thread(target=self._worker, daemon=True)
            worker.start()
            self.workers.append(worker)
        
        logger.info(f"Thread pool initialized ({max_threads} threads)")
    
    def _worker(self) -> None:
        """Worker thread main loop"""
        while self.running:
            try:
                func, args, kwargs = self.queue.get(timeout=1.0)
                try:
                    func(*args, **kwargs)
                except Exception as e:
                    logger.error(f"Thread task error: {e}")
            except queue.Empty:
                continue
    
    def submit(self, func, *args, **kwargs) -> bool:
        """
        Submit task to pool
        
        Args:
            func: Function to execute
            *args, **kwargs: Function arguments
            
        Returns:
            True if submitted
        """
        try:
            self.queue.put((func, args, kwargs), timeout=1.0)
            return True
        except queue.Full:
            logger.warning("Thread pool queue full")
            return False
    
    def shutdown(self) -> None:
        """Shutdown thread pool"""
        self.running = False
        for worker in self.workers:
            worker.join(timeout=1.0)
        logger.info("Thread pool shutdown")
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.shutdown()


class BufferPool:
    """Pool of reusable buffers"""
    
    def __init__(self, buffer_size: int = 4096, pool_size: int = 10):
        """
        Initialize buffer pool
        
        Args:
            buffer_size: Size of each buffer
            pool_size: Number of buffers
        """
        self.buffer_size = buffer_size
        self.pool: queue.Queue = queue.Queue(maxsize=pool_size)
        
        for _ in range(pool_size):
            self.pool.put(bytearray(buffer_size), block=False)
        
        logger.info(f"Buffer pool initialized ({pool_size} buffers of {buffer_size} bytes)")
    
    def get_buffer(self) -> Optional[bytearray]:
        """Get buffer from pool"""
        try:
            return self.pool.get_nowait()
        except queue.Empty:
            return bytearray(self.buffer_size)
    
    def return_buffer(self, buffer: bytearray) -> bool:
        """Return buffer to pool"""
        try:
            buffer.clear()
            self.pool.put(buffer, block=False)
            return True
        except queue.Full:
            return False
