// =============================================================================
// BASAROMETER ENHANCED INTELLIGENCE SYSTEM - AUTHENTICATION MIDDLEWARE
// =============================================================================
// Purpose: Secure API routes with proper authentication and admin verification
// Integration: Works with existing Supabase Auth + Enhanced Intelligence APIs
// Security: JWT token validation + Row Level Security + Admin role checking
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '../lib/auth-config'

// =============================================================================
// AUTHENTICATION MIDDLEWARE FOR ENHANCED INTELLIGENCE APIs
// =============================================================================

export async function withAuth(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Get session from request
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      return NextResponse.json(
        { success: false, error: 'Authentication session error' },
        { status: 401 }
      )
    }

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return { session, user: session.user, supabase }
  } catch (error) {
    console.error('Authentication middleware error:', error)
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

// =============================================================================
// ADMIN AUTHENTICATION MIDDLEWARE (For Enhanced Intelligence APIs)
// =============================================================================

export async function withAdminAuth(request: NextRequest) {
  try {
    const authResult = await withAuth(request)
    
    // Check if auth failed
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { user, supabase } = authResult

    // Check admin status using existing database function
    const { data: isAdmin, error: adminError } = await supabase
      .rpc('check_user_admin')

    if (adminError) {
      console.error('Admin check error:', adminError)
      return NextResponse.json(
        { success: false, error: 'Admin verification failed' },
        { status: 500 }
      )
    }

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    return { user, supabase, isAdmin: true }
  } catch (error) {
    console.error('Admin authentication middleware error:', error)
    return NextResponse.json(
      { success: false, error: 'Admin authentication failed' },
      { status: 500 }
    )
  }
}

// =============================================================================
// API KEY AUTHENTICATION (For Scanner Integration)
// =============================================================================

export function withApiKeyAuth(request: NextRequest, validApiKey: string = 'basarometer-scanner-v5-2025') {
  try {
    const apiKey = request.headers.get('x-scanner-api-key') || 
                   request.headers.get('x-api-key') ||
                   request.headers.get('authorization')?.replace('Bearer ', '')

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key required' },
        { status: 401 }
      )
    }

    if (apiKey !== validApiKey) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key' },
        { status: 403 }
      )
    }

    return { authenticated: true, source: 'api_key' }
  } catch (error) {
    console.error('API key authentication error:', error)
    return NextResponse.json(
      { success: false, error: 'API key authentication failed' },
      { status: 500 }
    )
  }
}

// =============================================================================
// COMBINED AUTHENTICATION WRAPPER
// =============================================================================

export async function withCombinedAuth(
  request: NextRequest, 
  options: {
    requireAdmin?: boolean
    allowApiKey?: boolean
    apiKey?: string
  } = {}
) {
  try {
    // Try API key authentication first if allowed
    if (options.allowApiKey) {
      const apiKeyResult = withApiKeyAuth(request, options.apiKey)
      if (!(apiKeyResult instanceof NextResponse)) {
        return { authType: 'api_key', ...apiKeyResult }
      }
    }

    // Try user authentication
    const authResult = options.requireAdmin 
      ? await withAdminAuth(request)
      : await withAuth(request)

    if (authResult instanceof NextResponse) {
      return authResult
    }

    return { authenticated: true, authType: 'user', ...authResult }
  } catch (error) {
    console.error('Combined authentication error:', error)
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

// =============================================================================
// RATE LIMITING MIDDLEWARE
// =============================================================================

interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyGenerator?: (request: NextRequest) => string // Custom key generator
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function withRateLimit(request: NextRequest, options: RateLimitOptions) {
  try {
    const key = options.keyGenerator 
      ? options.keyGenerator(request)
      : getClientIP(request)

    const now = Date.now()
    const record = rateLimitStore.get(key)

    if (!record || now > record.resetTime) {
      // Create new record or reset expired one
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + options.windowMs
      })
      return { allowed: true, remaining: options.maxRequests - 1 }
    }

    if (record.count >= options.maxRequests) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((record.resetTime - now) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((record.resetTime - now) / 1000).toString(),
            'X-RateLimit-Limit': options.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': record.resetTime.toString()
          }
        }
      )
    }

    // Increment counter
    record.count++
    rateLimitStore.set(key, record)

    return { 
      allowed: true, 
      remaining: options.maxRequests - record.count,
      resetTime: record.resetTime
    }
  } catch (error) {
    console.error('Rate limiting error:', error)
    // Allow request on error to avoid breaking functionality
    return { allowed: true, remaining: options.maxRequests }
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function createAuthHeaders(rateLimitResult?: { remaining: number; resetTime?: number }) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  if (rateLimitResult) {
    headers['X-RateLimit-Remaining'] = rateLimitResult.remaining.toString()
    if (rateLimitResult.resetTime) {
      headers['X-RateLimit-Reset'] = rateLimitResult.resetTime.toString()
    }
  }

  return headers
}

export function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

// =============================================================================
// AUTHENTICATION ERROR RESPONSES
// =============================================================================

export const AuthErrors = {
  MISSING_TOKEN: {
    success: false,
    error: 'Authentication token required',
    code: 'MISSING_TOKEN'
  },
  INVALID_TOKEN: {
    success: false,
    error: 'Invalid authentication token',
    code: 'INVALID_TOKEN'
  },
  EXPIRED_TOKEN: {
    success: false,
    error: 'Authentication token expired',
    code: 'EXPIRED_TOKEN'
  },
  INSUFFICIENT_PERMISSIONS: {
    success: false,
    error: 'Insufficient permissions for this action',
    code: 'INSUFFICIENT_PERMISSIONS'
  },
  ADMIN_REQUIRED: {
    success: false,
    error: 'Administrator privileges required',
    code: 'ADMIN_REQUIRED'
  },
  RATE_LIMITED: {
    success: false,
    error: 'Too many requests. Please try again later.',
    code: 'RATE_LIMITED'
  },
  API_KEY_REQUIRED: {
    success: false,
    error: 'Valid API key required',
    code: 'API_KEY_REQUIRED'
  }
} as const

// =============================================================================
// ENHANCED INTELLIGENCE API AUTHENTICATION CONFIG
// =============================================================================

export const EnhancedIntelligenceAuth = {
  // Matrix API - Public read, admin for advanced features
  matrix: {
    GET: { requireAuth: false, requireAdmin: false },
    POST: { requireAuth: true, requireAdmin: true },
    PUT: { requireAuth: true, requireAdmin: true },
    DELETE: { requireAuth: true, requireAdmin: true }
  },
  
  // Queue API - Admin only
  queue: {
    GET: { requireAuth: true, requireAdmin: true },
    POST: { requireAuth: true, requireAdmin: true },
    PUT: { requireAuth: true, requireAdmin: true },
    DELETE: { requireAuth: true, requireAdmin: true }
  },
  
  // Analytics API - Admin only
  analytics: {
    GET: { requireAuth: true, requireAdmin: true },
    POST: { requireAuth: true, requireAdmin: true }
  },
  
  // Approval API - Admin only
  approve: {
    POST: { requireAuth: true, requireAdmin: true },
    PUT: { requireAuth: true, requireAdmin: true }
  }
} as const

// =============================================================================
// RATE LIMIT CONFIGURATIONS
// =============================================================================

export const RateLimits = {
  // Enhanced Intelligence APIs
  enhancedMatrix: { windowMs: 60000, maxRequests: 100 }, // 100 requests per minute
  enhancedQueue: { windowMs: 60000, maxRequests: 30 },   // 30 requests per minute
  enhancedApproval: { windowMs: 60000, maxRequests: 50 }, // 50 requests per minute
  
  // Scanner APIs
  scannerIngest: { windowMs: 60000, maxRequests: 10 },   // 10 scans per minute
  
  // General APIs
  generalAPI: { windowMs: 60000, maxRequests: 200 },     // 200 requests per minute
  
  // User actions
  priceReports: { windowMs: 3600000, maxRequests: 20 },  // 20 reports per hour
  reviews: { windowMs: 86400000, maxRequests: 10 },      // 10 reviews per day
  ocrProcessing: { windowMs: 86400000, maxRequests: 50 } // 50 OCR processes per day
} as const