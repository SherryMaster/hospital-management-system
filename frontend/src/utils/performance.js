/**
 * Frontend Performance Optimization Utilities
 * 
 * Provides caching, lazy loading, memoization, and performance monitoring
 * for the React Hospital Management System frontend
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'

// Performance monitoring
export class PerformanceMonitor {
  static measurements = new Map()
  static observers = new Map()

  static startMeasurement(name) {
    const startTime = performance.now()
    this.measurements.set(name, { startTime, endTime: null })
    
    // Use Performance Observer API if available
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === name) {
            console.log(`Performance: ${name} took ${entry.duration.toFixed(2)}ms`)
          }
        }
      })
      observer.observe({ entryTypes: ['measure'] })
      this.observers.set(name, observer)
    }
    
    return startTime
  }

  static endMeasurement(name) {
    const measurement = this.measurements.get(name)
    if (!measurement) return null

    const endTime = performance.now()
    const duration = endTime - measurement.startTime
    
    measurement.endTime = endTime
    measurement.duration = duration

    // Create performance mark
    if ('performance' in window && 'mark' in performance) {
      performance.mark(`${name}-end`)
      performance.measure(name, `${name}-start`, `${name}-end`)
    }

    // Log slow operations
    if (duration > 100) { // 100ms threshold
      console.warn(`Slow operation: ${name} took ${duration.toFixed(2)}ms`)
    }

    return duration
  }

  static getMetrics() {
    const metrics = {}
    for (const [name, measurement] of this.measurements) {
      if (measurement.duration) {
        metrics[name] = measurement.duration
      }
    }
    return metrics
  }

  static clearMetrics() {
    this.measurements.clear()
    for (const observer of this.observers.values()) {
      observer.disconnect()
    }
    this.observers.clear()
  }
}

// Memory-efficient cache implementation
export class MemoryCache {
  constructor(maxSize = 100, ttl = 5 * 60 * 1000) { // 5 minutes default TTL
    this.cache = new Map()
    this.maxSize = maxSize
    this.ttl = ttl
  }

  set(key, value) {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now()
    })
  }

  get(key) {
    const item = this.cache.get(key)
    if (!item) return null

    // Check if item has expired
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.value
  }

  has(key) {
    return this.get(key) !== null
  }

  delete(key) {
    return this.cache.delete(key)
  }

  clear() {
    this.cache.clear()
  }

  size() {
    return this.cache.size
  }

  // Clean expired entries
  cleanup() {
    const now = Date.now()
    for (const [key, item] of this.cache) {
      if (now - item.timestamp > this.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

// Global cache instance
export const globalCache = new MemoryCache(200, 10 * 60 * 1000) // 10 minutes TTL

// Debounce hook for performance optimization
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Throttle hook for performance optimization
export function useThrottle(value, limit) {
  const [throttledValue, setThrottledValue] = useState(value)
  const lastRan = useRef(Date.now())

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value)
        lastRan.current = Date.now()
      }
    }, limit - (Date.now() - lastRan.current))

    return () => {
      clearTimeout(handler)
    }
  }, [value, limit])

  return throttledValue
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(options = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [entry, setEntry] = useState(null)
  const elementRef = useRef(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
      setEntry(entry)
    }, options)

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [options])

  return [elementRef, isIntersecting, entry]
}

// Virtual scrolling hook for large lists
export function useVirtualScrolling(items, itemHeight, containerHeight) {
  const [scrollTop, setScrollTop] = useState(0)
  
  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight)
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    )
    
    return {
      startIndex,
      endIndex,
      items: items.slice(startIndex, endIndex),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight
    }
  }, [items, itemHeight, containerHeight, scrollTop])

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop)
  }, [])

  return {
    visibleItems,
    handleScroll,
    totalHeight: visibleItems.totalHeight
  }
}

// Memoized API call hook
export function useMemoizedAPI(apiCall, dependencies = [], cacheKey = null) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const memoizedCall = useCallback(async () => {
    // Check cache first
    if (cacheKey && globalCache.has(cacheKey)) {
      const cachedData = globalCache.get(cacheKey)
      setData(cachedData)
      return cachedData
    }

    setLoading(true)
    setError(null)

    try {
      PerformanceMonitor.startMeasurement(`api-${cacheKey || 'call'}`)
      const result = await apiCall()
      
      setData(result)
      
      // Cache the result
      if (cacheKey) {
        globalCache.set(cacheKey, result)
      }
      
      PerformanceMonitor.endMeasurement(`api-${cacheKey || 'call'}`)
      return result
    } catch (err) {
      setError(err)
      PerformanceMonitor.endMeasurement(`api-${cacheKey || 'call'}`)
      throw err
    } finally {
      setLoading(false)
    }
  }, dependencies)

  useEffect(() => {
    memoizedCall()
  }, [memoizedCall])

  return { data, loading, error, refetch: memoizedCall }
}

// Image lazy loading component
export function LazyImage({ src, alt, placeholder, className, ...props }) {
  const [imageSrc, setImageSrc] = useState(placeholder)
  const [imageRef, isIntersecting] = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px'
  })

  useEffect(() => {
    if (isIntersecting && src) {
      const img = new Image()
      img.onload = () => {
        setImageSrc(src)
      }
      img.src = src
    }
  }, [isIntersecting, src])

  return (
    <img
      ref={imageRef}
      src={imageSrc}
      alt={alt}
      className={className}
      {...props}
    />
  )
}

// Bundle splitting utilities
export const loadComponent = (componentImport) => {
  return React.lazy(() => {
    PerformanceMonitor.startMeasurement('component-load')
    return componentImport().then(module => {
      PerformanceMonitor.endMeasurement('component-load')
      return module
    })
  })
}

// Performance-optimized list component
export function VirtualizedList({ 
  items, 
  renderItem, 
  itemHeight = 50, 
  containerHeight = 400,
  className = ''
}) {
  const { visibleItems, handleScroll, totalHeight } = useVirtualScrolling(
    items, 
    itemHeight, 
    containerHeight
  )

  return (
    <div 
      className={`virtualized-list ${className}`}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div 
          style={{ 
            transform: `translateY(${visibleItems.offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.items.map((item, index) => (
            <div 
              key={visibleItems.startIndex + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, visibleItems.startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Performance metrics collection
export class MetricsCollector {
  static metrics = {
    pageLoads: 0,
    apiCalls: 0,
    errors: 0,
    slowOperations: 0,
    cacheHits: 0,
    cacheMisses: 0
  }

  static increment(metric) {
    if (this.metrics.hasOwnProperty(metric)) {
      this.metrics[metric]++
    }
  }

  static getMetrics() {
    return { ...this.metrics }
  }

  static reset() {
    Object.keys(this.metrics).forEach(key => {
      this.metrics[key] = 0
    })
  }

  static sendMetrics() {
    // Send metrics to analytics service
    if (window.gtag) {
      window.gtag('event', 'performance_metrics', {
        custom_parameter: this.metrics
      })
    }
  }
}

// Web Vitals monitoring
export function initWebVitals() {
  if ('web-vitals' in window) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(console.log)
      getFID(console.log)
      getFCP(console.log)
      getLCP(console.log)
      getTTFB(console.log)
    })
  }
}

// Resource preloading utilities
export function preloadResource(href, as = 'fetch', crossorigin = 'anonymous') {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.href = href
  link.as = as
  if (crossorigin) link.crossOrigin = crossorigin
  document.head.appendChild(link)
}

export function preloadRoute(routeComponent) {
  // Preload route component
  if (typeof routeComponent === 'function') {
    routeComponent()
  }
}

// Service Worker utilities for caching
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration)
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError)
        })
    })
  }
}

// Performance optimization HOC
export function withPerformanceMonitoring(WrappedComponent, componentName) {
  return function PerformanceMonitoredComponent(props) {
    useEffect(() => {
      PerformanceMonitor.startMeasurement(`${componentName}-render`)
      return () => {
        PerformanceMonitor.endMeasurement(`${componentName}-render`)
      }
    }, [])

    return <WrappedComponent {...props} />
  }
}

// Memory leak prevention
export function useMemoryLeakPrevention() {
  const timeouts = useRef([])
  const intervals = useRef([])
  const listeners = useRef([])

  const addTimeout = useCallback((callback, delay) => {
    const id = setTimeout(callback, delay)
    timeouts.current.push(id)
    return id
  }, [])

  const addInterval = useCallback((callback, delay) => {
    const id = setInterval(callback, delay)
    intervals.current.push(id)
    return id
  }, [])

  const addEventListener = useCallback((element, event, handler) => {
    element.addEventListener(event, handler)
    listeners.current.push({ element, event, handler })
  }, [])

  useEffect(() => {
    return () => {
      // Cleanup timeouts
      timeouts.current.forEach(clearTimeout)
      
      // Cleanup intervals
      intervals.current.forEach(clearInterval)
      
      // Cleanup event listeners
      listeners.current.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler)
      })
    }
  }, [])

  return { addTimeout, addInterval, addEventListener }
}
