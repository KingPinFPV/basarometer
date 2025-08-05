// High-Performance API Response Caching System
// System Optimizer Specialist Implementation
// Target: <50ms API response times for 300+ products

import { Logger } from '@/lib/discovery/utils/Logger'

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiryTime: number;
  hitCount: number;
  lastAccessed: number;
}

interface CacheStats {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  hitRatio: number;
  avgResponseTime: number;
  memoryUsage: number;
}

class ApiCache {
  private cache = new Map<string, CacheEntry<any>>();
  private stats: CacheStats = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    hitRatio: 0,
    avgResponseTime: 0,
    memoryUsage: 0
  };
  private readonly maxSize: number;
  private readonly defaultTTL: number;
  private cleanupInterval: NodeJS.Timeout;
  private logger = new Logger('ApiCache');

  constructor(maxSize = 1000, defaultTTL = 5 * 60 * 1000) { // 5 minutes default
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    
    // Cleanup expired entries every 30 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 30000);
  }

  // Smart caching with different TTL based on data type
  set<T>(key: string, data: T, customTTL?: number): void {
    const ttl = customTTL || this.getTTLByDataType(key);
    const now = Date.now();
    
    // Evict if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      expiryTime: now + ttl,
      hitCount: 0,
      lastAccessed: now
    });
  }

  get<T>(key: string): T | null {
    this.stats.totalRequests++;
    const startTime = Date.now();
    
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.cacheMisses++;
      this.updateStats(startTime);
      return null;
    }

    const now = Date.now();
    
    // Check if expired
    if (now > entry.expiryTime) {
      this.cache.delete(key);
      this.stats.cacheMisses++;
      this.updateStats(startTime);
      return null;
    }

    // Update access stats
    entry.hitCount++;
    entry.lastAccessed = now;
    this.stats.cacheHits++;
    this.updateStats(startTime);
    
    return entry.data as T;
  }

  // Optimized cache key generation
  generateKey(baseKey: string, params?: Record<string, any>): string {
    if (!params) return baseKey;
    
    // Sort params for consistent keys
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${JSON.stringify(params[key])}`)
      .join('|');
    
    return `${baseKey}:${sortedParams}`;
  }

  // Invalidate cache entries by pattern
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // Smart TTL based on data type and update frequency
  private getTTLByDataType(key: string): number {
    if (key.includes('price_reports')) return 2 * 60 * 1000; // 2 minutes - price data changes frequently
    if (key.includes('meat_cuts')) return 30 * 60 * 1000; // 30 minutes - product data stable
    if (key.includes('retailers')) return 60 * 60 * 1000; // 1 hour - retailer data very stable
    if (key.includes('scanner_data')) return 1 * 60 * 1000; // 1 minute - real-time data
    if (key.includes('analytics')) return 15 * 60 * 1000; // 15 minutes - analytics can be stale
    if (key.includes('discovery')) return 10 * 60 * 1000; // 10 minutes - discovery results
    
    return this.defaultTTL;
  }

  // LRU eviction strategy
  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  // Cleanup expired entries
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiryTime) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    this.updateMemoryUsage();
  }

  private updateStats(startTime: number): void {
    const responseTime = Date.now() - startTime;
    this.stats.avgResponseTime = (this.stats.avgResponseTime + responseTime) / 2;
    this.stats.hitRatio = (this.stats.cacheHits / this.stats.totalRequests) * 100;
  }

  private updateMemoryUsage(): void {
    // Rough estimate of memory usage
    this.stats.memoryUsage = this.cache.size * 1024; // Assume 1KB per entry average
  }

  // Performance monitoring
  getStats(): CacheStats {
    this.updateMemoryUsage();
    return { ...this.stats };
  }

  // Cache warming for critical data
  async warmCache(warmupQueries: Array<() => Promise<any>>): Promise<void> {
    this.logger.info('🔥 Warming API cache for optimal performance...');
    
    const promises = warmupQueries.map(async (query, index) => {
      try {
        await query();
        this.logger.info(`✅ Cache warmed: Query ${index + 1}`);
      } catch (error) {
        this.logger.warn(`⚠️ Cache warmup failed for query ${index + 1}:`, error);
      }
    });
    
    await Promise.allSettled(promises);
    this.logger.info('🎯 Cache warmup completed');
  }

  // Clear cache
  clear(): void {
    this.cache.clear();
    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      hitRatio: 0,
      avgResponseTime: 0,
      memoryUsage: 0
    };
  }

  // Destroy cache and clear intervals
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// Global cache instance
export const apiCache = new ApiCache(2000, 5 * 60 * 1000); // 2000 entries, 5min default TTL

// Cache decorator for API functions
export function cacheable<T extends (...args: any[]) => Promise<any>>(
  cacheKey: string,
  ttl?: number
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const key = apiCache.generateKey(cacheKey, { args });
      
      // Try cache first
      const cached = apiCache.get(key);
      if (cached !== null) {
        return cached;
      }

      // Execute original method
      const result = await method.apply(this, args);
      
      // Cache result
      apiCache.set(key, result, ttl);
      
      return result;
    };

    return descriptor;
  };
}

// Cache invalidation helper
export function invalidateCache(pattern: string): void {
  apiCache.invalidatePattern(pattern);
}

// Performance monitoring helper
export function getCachePerformance(): CacheStats {
  return apiCache.getStats();
}

export default apiCache;