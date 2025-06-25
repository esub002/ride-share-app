import { InteractionManager } from 'react-native';

class PerformanceOptimizer {
  constructor() {
    this.debounceTimers = new Map();
    this.throttleTimers = new Map();
    this.memoizedResults = new Map();
    this.apiCallCache = new Map();
  }

  // Debounce function calls
  debounce(key, func, delay = 300) {
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
    }
    
    const timer = setTimeout(() => {
      func();
      this.debounceTimers.delete(key);
    }, delay);
    
    this.debounceTimers.set(key, timer);
  }

  // Throttle function calls
  throttle(key, func, delay = 100) {
    if (this.throttleTimers.has(key)) {
      return;
    }
    
    func();
    
    const timer = setTimeout(() => {
      this.throttleTimers.delete(key);
    }, delay);
    
    this.throttleTimers.set(key, timer);
  }

  // Memoize expensive calculations
  memoize(key, func, dependencies = []) {
    const dependencyString = JSON.stringify(dependencies);
    const cacheKey = `${key}_${dependencyString}`;
    
    if (this.memoizedResults.has(cacheKey)) {
      return this.memoizedResults.get(cacheKey);
    }
    
    const result = func();
    this.memoizedResults.set(cacheKey, result);
    
    // Clear old cache entries (keep only last 100)
    if (this.memoizedResults.size > 100) {
      const keys = Array.from(this.memoizedResults.keys());
      keys.slice(0, 50).forEach(key => this.memoizedResults.delete(key));
    }
    
    return result;
  }

  // Optimize API calls with caching
  async optimizedApiCall(key, apiFunction, cacheTime = 5 * 60 * 1000) {
    const now = Date.now();
    const cached = this.apiCallCache.get(key);
    
    if (cached && (now - cached.timestamp) < cacheTime) {
      return cached.data;
    }
    
    try {
      const data = await apiFunction();
      this.apiCallCache.set(key, {
        data,
        timestamp: now
      });
      return data;
    } catch (error) {
      // Return cached data if available, even if expired
      if (cached) {
        console.warn('API call failed, using cached data:', error);
        return cached.data;
      }
      throw error;
    }
  }

  // Batch multiple API calls
  async batchApiCalls(apiCalls, batchSize = 5) {
    const results = [];
    
    for (let i = 0; i < apiCalls.length; i += batchSize) {
      const batch = apiCalls.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(batch.map(call => call()));
      results.push(...batchResults);
      
      // Add small delay between batches to prevent overwhelming the server
      if (i + batchSize < apiCalls.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  // Optimize list rendering with virtualization hints
  optimizeListRendering(items, itemHeight, containerHeight) {
    const visibleItemCount = Math.ceil(containerHeight / itemHeight);
    const totalItems = items.length;
    
    return {
      shouldVirtualize: totalItems > visibleItemCount * 2,
      estimatedItemSize: itemHeight,
      maxToRenderPerBatch: visibleItemCount + 5,
      windowSize: visibleItemCount + 10,
      removeClippedSubviews: true,
      initialNumToRender: Math.min(visibleItemCount, totalItems),
    };
  }

  // Optimize image loading
  optimizeImageLoading(images, priority = 'normal') {
    return images.map((image, index) => ({
      ...image,
      priority: index < 3 ? 'high' : priority,
      loading: index < 3 ? 'eager' : 'lazy',
      preload: index < 3,
    }));
  }

  // Defer non-critical operations
  deferOperation(operation, priority = 'normal') {
    const priorities = {
      high: 0,
      normal: 100,
      low: 500
    };
    
    const delay = priorities[priority] || 100;
    
    return new Promise((resolve) => {
      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => {
          const result = operation();
          resolve(result);
        }, delay);
      });
    });
  }

  // Optimize component updates
  shouldComponentUpdate(prevProps, nextProps, keysToCompare = []) {
    if (keysToCompare.length === 0) {
      return JSON.stringify(prevProps) !== JSON.stringify(nextProps);
    }
    
    return keysToCompare.some(key => {
      const prevValue = prevProps[key];
      const nextValue = nextProps[key];
      
      if (typeof prevValue === 'object' && typeof nextValue === 'object') {
        return JSON.stringify(prevValue) !== JSON.stringify(nextValue);
      }
      
      return prevValue !== nextValue;
    });
  }

  // Optimize re-renders with React.memo equivalent
  memoizeComponent(Component, propsAreEqual = null) {
    if (propsAreEqual) {
      return React.memo(Component, propsAreEqual);
    }
    
    return React.memo(Component, (prevProps, nextProps) => {
      return !this.shouldComponentUpdate(prevProps, nextProps);
    });
  }

  // Optimize state updates
  batchStateUpdates(updates) {
    return new Promise((resolve) => {
      InteractionManager.runAfterInteractions(() => {
        updates.forEach(update => update());
        resolve();
      });
    });
  }

  // Optimize animations
  optimizeAnimation(animation, duration = 300, easing = 'ease') {
    return {
      ...animation,
      duration,
      easing,
      useNativeDriver: true,
      isInteraction: false,
    };
  }

  // Clear all caches
  clearCaches() {
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    
    this.throttleTimers.forEach(timer => clearTimeout(timer));
    this.throttleTimers.clear();
    
    this.memoizedResults.clear();
    this.apiCallCache.clear();
  }

  // Get performance metrics
  getPerformanceMetrics() {
    return {
      debounceTimers: this.debounceTimers.size,
      throttleTimers: this.throttleTimers.size,
      memoizedResults: this.memoizedResults.size,
      apiCallCache: this.apiCallCache.size,
    };
  }

  // Memory usage optimization
  optimizeMemoryUsage() {
    // Clear old cache entries
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes
    
    this.apiCallCache.forEach((value, key) => {
      if (now - value.timestamp > maxAge) {
        this.apiCallCache.delete(key);
      }
    });
    
    // Keep only recent memoized results
    if (this.memoizedResults.size > 50) {
      const keys = Array.from(this.memoizedResults.keys());
      keys.slice(0, 25).forEach(key => this.memoizedResults.delete(key));
    }
  }
}

export default new PerformanceOptimizer(); 