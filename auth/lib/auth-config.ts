// =============================================================================
// BASAROMETER ENHANCED INTELLIGENCE SYSTEM - AUTHENTICATION CONFIGURATION
// =============================================================================
// Purpose: Central authentication configuration and utilities
// Integration: Supabase Auth + Enhanced Intelligence System
// Security: Production-ready authentication patterns
// =============================================================================

import { createBrowserClient } from '@supabase/ssr'
import { createServerClient as createSSRServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

// =============================================================================
// AUTHENTICATION CONFIGURATION
// =============================================================================

export const AuthConfig = {
  // Session configuration
  session: {
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60,   // 1 hour
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production'
  },
  
  // Admin configuration
  admin: {
    checkFunction: 'check_user_admin',
    defaultPermissions: ['read', 'write'],
    requiredTables: ['user_profiles']
  },
  
  // Enhanced Intelligence API permissions
  enhancedIntelligence: {
    matrix: {
      read: 'public' as const,
      write: 'admin' as const,
      admin: 'admin' as const
    },
    queue: {
      read: 'admin' as const,
      write: 'admin' as const,
      approve: 'admin' as const
    },
    analytics: {
      read: 'admin' as const,
      generate: 'admin' as const
    }
  },
  
  // Scanner API configuration
  scanner: {
    apiKey: process.env.SCANNER_API_KEY || 'basarometer-scanner-v5-2025',
    sources: ['browser-use-ai', 'manual', 'import'],
    rateLimits: {
      perMinute: 10,
      perHour: 100,
      perDay: 1000
    }
  },
  
  // Rate limiting configuration
  rateLimits: {
    anonymous: {
      requests: 100,
      windowMs: 60000 // 1 minute
    },
    authenticated: {
      requests: 500,
      windowMs: 60000 // 1 minute
    },
    admin: {
      requests: 1000,
      windowMs: 60000 // 1 minute
    }
  }
} as const

// =============================================================================
// SUPABASE CLIENT INSTANCES
// =============================================================================

// Client-side Supabase client (for components)
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Server-side Supabase client (for API routes)
export async function createServerClient() {
  const cookieStore = await cookies()
  
  return createSSRServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle cookie setting errors
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle cookie removal errors
          }
        },
      },
    }
  )
}

// Service role client (for admin operations)
export function createServiceClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  }
  
  const { createClient } = require('@supabase/supabase-js')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

// =============================================================================
// AUTHENTICATION UTILITIES
// =============================================================================

export async function getSession() {
  try {
    const supabase = await createServerClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Session error:', error)
      return null
    }
    
    return session
  } catch (error) {
    console.error('Get session error:', error)
    return null
  }
}

export async function getCurrentUser() {
  try {
    const session = await getSession()
    if (!session?.user) return null
    
    const supabase = await createServerClient()
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    
    if (error) {
      console.error('User profile error:', error)
      return { user: session.user, profile: null }
    }
    
    return { user: session.user, profile }
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}

export async function checkAdminStatus(userId?: string) {
  try {
    const session = await getSession()
    const targetUserId = userId || session?.user?.id
    
    if (!targetUserId) return false
    
    const supabase = await createServerClient()
    const { data: isAdmin, error } = await supabase
      .rpc('check_user_admin')
    
    if (error) {
      console.error('Admin check error:', error)
      return false
    }
    
    return Boolean(isAdmin)
  } catch (error) {
    console.error('Check admin status error:', error)
    return false
  }
}

// =============================================================================
// USER PROFILE MANAGEMENT
// =============================================================================

export async function createUserProfile(userId: string, profileData: {
  full_name?: string
  email?: string
  phone?: string
  city?: string
}) {
  try {
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        full_name: profileData.full_name,
        email: profileData.email,
        phone: profileData.phone,
        city: profileData.city,
        reputation_score: 100,
        total_reports: 0,
        verified_reports: 0,
        is_admin: false
      })
      .select()
      .single()
    
    if (error) {
      console.error('Create user profile error:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Create user profile error:', error)
    return null
  }
}

export async function updateUserProfile(userId: string, updates: {
  full_name?: string
  phone?: string
  city?: string
  preferences?: Record<string, any>
}) {
  try {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()
    
    if (error) {
      console.error('Update user profile error:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Update user profile error:', error)
    return null
  }
}

// =============================================================================
// ENHANCED INTELLIGENCE PERMISSIONS
// =============================================================================

export async function checkEnhancedIntelligencePermission(
  action: 'read' | 'write' | 'admin' | 'approve',
  resource: 'matrix' | 'queue' | 'analytics'
) {
  try {
    const isAdmin = await checkAdminStatus()
    const permissions = AuthConfig.enhancedIntelligence[resource]
    
    // Check if action is allowed for the resource
    const requiredRole = permissions[action as keyof typeof permissions]
    
    switch (requiredRole) {
      case 'public':
        return true
      case 'admin':
        return isAdmin
      default:
        return false
    }
  } catch (error) {
    console.error('Check Enhanced Intelligence permission error:', error)
    return false
  }
}

// =============================================================================
// API KEY VALIDATION
// =============================================================================

export function validateApiKey(providedKey: string, requiredKey?: string): boolean {
  const validKey = requiredKey || AuthConfig.scanner.apiKey
  return providedKey === validKey
}

export function extractApiKey(headers: Headers): string | null {
  return (
    headers.get('x-scanner-api-key') ||
    headers.get('x-api-key') ||
    headers.get('authorization')?.replace('Bearer ', '') ||
    null
  )
}

// =============================================================================
// SECURITY HELPERS
// =============================================================================

export function sanitizeUserInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .substring(0, 1000) // Limit length
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhoneNumber(phone: string): boolean {
  // Israeli phone number validation
  const israeliPhoneRegex = /^(\+972|0)([2-9]\d{7,8})$/
  return israeliPhoneRegex.test(phone.replace(/[-\s]/g, ''))
}

// =============================================================================
// SESSION MANAGEMENT
// =============================================================================

export async function refreshSession() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.auth.refreshSession()
    
    if (error) {
      console.error('Refresh session error:', error)
      return null
    }
    
    return data.session
  } catch (error) {
    console.error('Refresh session error:', error)
    return null
  }
}

export async function signOut() {
  try {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Sign out error:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Sign out error:', error)
    return false
  }
}

// =============================================================================
// AUDIT LOGGING
// =============================================================================

export async function logAuthEvent(
  userId: string,
  action: string,
  details?: Record<string, any>,
  ipAddress?: string
) {
  try {
    const supabase = createServiceClient()
    
    // Log to a security audit table (if exists)
    // This is optional and can be implemented later
    console.log('Auth event:', {
      userId,
      action,
      details,
      ipAddress,
      timestamp: new Date().toISOString()
    })
    
    return true
  } catch (error) {
    console.error('Log auth event error:', error)
    return false
  }
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

export class AuthenticationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 401
  ) {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 403
  ) {
    super(message)
    this.name = 'AuthorizationError'
  }
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const AUTH_EVENTS = {
  SIGN_IN: 'auth.sign_in',
  SIGN_OUT: 'auth.sign_out',
  SIGN_UP: 'auth.sign_up',
  TOKEN_REFRESHED: 'auth.token_refreshed',
  USER_UPDATED: 'auth.user_updated',
  PASSWORD_RECOVERY: 'auth.password_recovery',
  ADMIN_ACTION: 'auth.admin_action',
  API_KEY_USED: 'auth.api_key_used'
} as const

export const PERMISSIONS = {
  READ: 'read',
  WRITE: 'write',
  DELETE: 'delete',
  ADMIN: 'admin',
  APPROVE: 'approve'
} as const

export const USER_ROLES = {
  ANONYMOUS: 'anonymous',
  AUTHENTICATED: 'authenticated',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
} as const