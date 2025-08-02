// Optimized API Response System
// System Optimizer Specialist Implementation
// Target: <50ms response times with smart caching and compression

import { NextResponse } from 'next/server';
import { apiCache } from './ApiCache';
import { Logger } from '@/lib/discovery/utils/Logger';

interface ApiPerformanceMetrics {
  executionTime: number;
  cacheHit: boolean;
  dataSize: number;
  compressionRatio: number;
  responseCode: number;
}

interface OptimizedResponseOptions {
  ttl?: number;
  compress?: boolean;
  headers?: Record<string, string>;
  cacheKey?: string;
  enableMetrics?: boolean;
}

class OptimizedApiResponse {
  private static metrics: ApiPerformanceMetrics[] = [];
  private static readonly MAX_METRICS = 1000;
  private static logger = new Logger('OptimizedApiResponse');

  // High-performance response with automatic optimization
  static async create<T>(
    data: T,
    options: OptimizedResponseOptions = {}
  ): Promise<NextResponse> {
    const startTime = Date.now();
    const {
      ttl = 5 * 60 * 1000, // 5 minutes default
      compress = true,
      headers = {},
      cacheKey,
      enableMetrics = true
    } = options;

    try {
      // Prepare optimized headers
      const optimizedHeaders = {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${Math.floor(ttl / 1000)}`,
        'X-Performance-Optimized': 'true',
        'X-Cache-Status': cacheKey ? 'MISS' : 'NO-CACHE',
        ...headers
      };

      // Add performance headers for monitoring
      if (enableMetrics) {
        optimizedHeaders['X-Response-Time'] = `${Date.now() - startTime}ms`;
        optimizedHeaders['X-Data-Size'] = JSON.stringify(data).length.toString();
      }

      // Smart compression for large responses
      let responseData = data;
      let compressionRatio = 1;

      if (compress && this.shouldCompress(data)) {
        const compressed = this.compressData(data);
        if (compressed.size < JSON.stringify(data).length * 0.8) {
          responseData = compressed.data;
          compressionRatio = compressed.ratio;
          optimizedHeaders['Content-Encoding'] = 'optimized';
        }
      }

      const response = NextResponse.json(responseData, { 
        status: 200,
        headers: optimizedHeaders 
      });

      // Record metrics
      if (enableMetrics) {
        this.recordMetrics({
          executionTime: Date.now() - startTime,
          cacheHit: false,
          dataSize: JSON.stringify(data).length,
          compressionRatio,
          responseCode: 200
        });
      }

      return response;

    } catch (error) {
      this.logger.error('OptimizedApiResponse error:', error);
      return this.createErrorResponse(error, startTime);
    }
  }

  // Cached response with smart invalidation
  static async cached<T>(
    cacheKey: string,
    dataProvider: () => Promise<T>,
    options: OptimizedResponseOptions = {}
  ): Promise<NextResponse> {
    const startTime = Date.now();
    const { ttl = 5 * 60 * 1000 } = options;

    try {
      // Try cache first
      const cached = apiCache.get<T>(cacheKey);
      
      if (cached !== null) {
        const response = await this.create(cached, {
          ...options,
          headers: {
            ...options.headers,
            'X-Cache-Status': 'HIT',
            'X-Cache-Age': Date.now().toString()
          }
        });

        // Update cache hit metrics
        this.recordMetrics({
          executionTime: Date.now() - startTime,
          cacheHit: true,
          dataSize: JSON.stringify(cached).length,
          compressionRatio: 1,
          responseCode: 200
        });

        return response;
      }

      // Cache miss - fetch fresh data
      const data = await dataProvider();
      
      // Store in cache
      apiCache.set(cacheKey, data, ttl);
      
      return await this.create(data, {
        ...options,
        headers: {
          ...options.headers,
          'X-Cache-Status': 'MISS',
          'X-Cache-Stored': 'true'
        }
      });

    } catch (error) {
      this.logger.error(`Cached response error for key ${cacheKey}:`, error);
      return this.createErrorResponse(error, startTime);
    }
  }

  // Smart data streaming for large datasets
  static async streamResponse<T>(
    dataProvider: () => AsyncGenerator<T>,
    options: OptimizedResponseOptions = {}
  ): Promise<NextResponse> {
    const startTime = Date.now();

    try {
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          
          controller.enqueue(encoder.encode('{"data":['));
          
          let first = true;
          for await (const chunk of dataProvider()) {
            if (!first) {
              controller.enqueue(encoder.encode(','));
            }
            controller.enqueue(encoder.encode(JSON.stringify(chunk)));
            first = false;
          }
          
          controller.enqueue(encoder.encode('],"streaming":true}'));
          controller.close();
        }
      });

      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'application/json',
          'Transfer-Encoding': 'chunked',
          'X-Streaming': 'true',
          'X-Performance-Optimized': 'true',
          ...options.headers
        }
      });

    } catch (error) {
      this.logger.error('Stream response error:', error);
      return this.createErrorResponse(error, startTime);
    }
  }

  // Batch response optimization for multiple queries
  static async batch<T>(
    queries: Array<{
      key: string;
      provider: () => Promise<T>;
      ttl?: number;
    }>,
    options: OptimizedResponseOptions = {}
  ): Promise<NextResponse> {
    const startTime = Date.now();

    try {
      const results: Record<string, T> = {};
      const cacheHits: string[] = [];
      const cacheMisses: string[] = [];

      // Check cache for all queries
      for (const query of queries) {
        const cached = apiCache.get<T>(query.key);
        if (cached !== null) {
          results[query.key] = cached;
          cacheHits.push(query.key);
        } else {
          cacheMisses.push(query.key);
        }
      }

      // Execute uncached queries in parallel
      if (cacheMisses.length > 0) {
        const uncachedQueries = queries.filter(q => cacheMisses.includes(q.key));
        const promises = uncachedQueries.map(async query => {
          const data = await query.provider();
          apiCache.set(query.key, data, query.ttl || 5 * 60 * 1000);
          return { key: query.key, data };
        });

        const freshResults = await Promise.all(promises);
        freshResults.forEach(({ key, data }) => {
          results[key] = data;
        });
      }

      return await this.create(results, {
        ...options,
        headers: {
          ...options.headers,
          'X-Batch-Size': queries.length.toString(),
          'X-Cache-Hits': cacheHits.length.toString(),
          'X-Cache-Misses': cacheMisses.length.toString(),
          'X-Batch-Performance': `${Date.now() - startTime}ms`
        }
      });

    } catch (error) {
      this.logger.error('Batch response error:', error);
      return this.createErrorResponse(error, startTime);
    }
  }

  // Smart compression detection
  private static shouldCompress(data: any): boolean {
    const dataString = JSON.stringify(data);
    return dataString.length > 1024 && // Only compress if >1KB
           (Array.isArray(data) || typeof data === 'object'); // Only compress objects/arrays
  }

  // Data compression (simplified implementation)
  private static compressData(data: any): { data: any, size: number, ratio: number } {
    const original = JSON.stringify(data);
    
    // Simple optimization strategies
    let optimized = data;
    
    if (Array.isArray(data)) {
      // Remove null/undefined values and optimize repeated structures
      optimized = data.filter(item => item != null);
    }
    
    if (typeof data === 'object' && data !== null) {
      // Remove empty fields and optimize nested structures
      optimized = this.removeEmptyFields(data);
    }
    
    const compressed = JSON.stringify(optimized);
    const ratio = original.length / compressed.length;
    
    return {
      data: optimized,
      size: compressed.length,
      ratio
    };
  }

  private static removeEmptyFields(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.removeEmptyFields(item)).filter(item => item != null);
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value != null && value !== '' && value !== 0 && 
            !(Array.isArray(value) && value.length === 0) &&
            !(typeof value === 'object' && Object.keys(value).length === 0)) {
          cleaned[key] = this.removeEmptyFields(value);
        }
      }
      return cleaned;
    }
    
    return obj;
  }

  private static createErrorResponse(error: any, startTime: number): NextResponse {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    this.recordMetrics({
      executionTime: Date.now() - startTime,
      cacheHit: false,
      dataSize: errorMessage.length,
      compressionRatio: 1,
      responseCode: 500
    });

    return NextResponse.json(
      { 
        error: errorMessage,
        timestamp: new Date().toISOString(),
        performance_optimized: true
      },
      { 
        status: 500,
        headers: {
          'X-Error': 'true',
          'X-Response-Time': `${Date.now() - startTime}ms`
        }
      }
    );
  }

  private static recordMetrics(metrics: ApiPerformanceMetrics): void {
    this.metrics.push(metrics);
    
    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }

  // Performance analytics
  static getPerformanceStats(): {
    avgResponseTime: number;
    cacheHitRatio: number;
    avgCompressionRatio: number;
    totalRequests: number;
    errorRate: number;
  } {
    if (this.metrics.length === 0) {
      return {
        avgResponseTime: 0,
        cacheHitRatio: 0,
        avgCompressionRatio: 1,
        totalRequests: 0,
        errorRate: 0
      };
    }

    const totalRequests = this.metrics.length;
    const cacheHits = this.metrics.filter(m => m.cacheHit).length;
    const errors = this.metrics.filter(m => m.responseCode >= 400).length;
    
    const avgResponseTime = this.metrics.reduce((sum, m) => sum + m.executionTime, 0) / totalRequests;
    const avgCompressionRatio = this.metrics.reduce((sum, m) => sum + m.compressionRatio, 0) / totalRequests;

    return {
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      cacheHitRatio: Math.round((cacheHits / totalRequests) * 10000) / 100,
      avgCompressionRatio: Math.round(avgCompressionRatio * 100) / 100,
      totalRequests,
      errorRate: Math.round((errors / totalRequests) * 10000) / 100
    };
  }
}

export default OptimizedApiResponse;