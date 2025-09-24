import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  longTasks: number;
  memoryUsage?: number;
  requestCount: number;
  slowRequests: number;
}

export function PerformanceMonitor() {
  const metricsRef = useRef<PerformanceMetrics>({
    longTasks: 0,
    requestCount: 0,
    slowRequests: 0
  });

  useEffect(() => {
    let longTaskObserver: PerformanceObserver | null = null;
    
    // Monitor long tasks that block the main thread
    if ('PerformanceObserver' in window) {
      try {
        longTaskObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.duration > 50) { // Tasks longer than 50ms
              metricsRef.current.longTasks++;
              console.warn(`⚠️  Long task detected: ${entry.duration.toFixed(2)}ms`);
              
              if (entry.duration > 100) {
                console.error(`🚨 Very long task: ${entry.duration.toFixed(2)}ms - This may cause UI freezing`);
              }
            }
          });
        });
        
        longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        console.warn('Long task observer not supported:', error);
      }
    }

    // Monitor memory usage if available
    const checkMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);
        const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);
        
        metricsRef.current.memoryUsage = usedMB;
        
        // Warn if memory usage is high
        if (usedMB > limitMB * 0.8) {
          console.warn(`⚠️  High memory usage: ${usedMB}MB / ${limitMB}MB (${Math.round(usedMB / limitMB * 100)}%)`);
        }
        
        // Log memory info periodically
        if (Math.random() < 0.1) { // 10% chance
          console.log(`💾 Memory: ${usedMB}MB used, ${totalMB}MB total, ${limitMB}MB limit`);
        }
      }
    };

    // Intercept fetch requests to monitor network performance
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
      const startTime = performance.now();
      metricsRef.current.requestCount++;
      
      try {
        const response = await originalFetch.apply(this, args);
        const duration = performance.now() - startTime;
        
        // Log slow requests (only for very slow ones to reduce noise)
        if (duration > 8000) { // Requests slower than 8 seconds
          metricsRef.current.slowRequests++;
          const url = typeof args[0] === 'string' ? args[0] : args[0].url;
          console.warn(`⚠️  Slow request: ${url} took ${duration.toFixed(2)}ms`);
        }
        
        return response;
      } catch (error) {
        const duration = performance.now() - startTime;
        const url = typeof args[0] === 'string' ? args[0] : args[0].url;
        console.error(`🚨 Failed request: ${url} failed after ${duration.toFixed(2)}ms`, error);
        throw error;
      }
    };

    // Check memory usage periodically
    const memoryInterval = setInterval(checkMemoryUsage, 10000); // Every 10 seconds

    // Report metrics periodically
    const reportInterval = setInterval(() => {
      const metrics = metricsRef.current;
      if (metrics.longTasks > 0 || metrics.slowRequests > 0) {
        console.group('📊 Performance Report');
        console.log(`Long tasks: ${metrics.longTasks}`);
        console.log(`Total requests: ${metrics.requestCount}`);
        console.log(`Slow requests: ${metrics.slowRequests}`);
        if (metrics.memoryUsage) {
          console.log(`Memory usage: ${metrics.memoryUsage}MB`);
        }
        console.groupEnd();
      }
    }, 30000); // Every 30 seconds

    // Performance tips
    console.log('🔧 Performance monitoring active. Tips to improve performance:');
    console.log('• Keep the browser tab active');
    console.log('• Close other heavy tabs');
    console.log('• Ensure stable internet connection');
    console.log('• Refresh the page if you experience freezing');

    return () => {
      if (longTaskObserver) {
        longTaskObserver.disconnect();
      }
      clearInterval(memoryInterval);
      clearInterval(reportInterval);
      
      // Restore original fetch
      window.fetch = originalFetch;
    };
  }, []);

  return null; // This component doesn't render anything
}