// =============================================================================
// BASAROMETER ENHANCED INTELLIGENCE SYSTEM - AUTHENTICATION HELPERS
// =============================================================================
// Purpose: Utility functions for authentication and authorization
// Integration: Server and client-side authentication helpers
// Security: Production-ready with proper error handling
// =============================================================================

import type { User } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type UserProfile = Database['public']['Tables']['user_profiles']['Row']

export interface AuthUser extends User {
  profile?: UserProfile | null
}

export interface AuthResult {
  success: boolean
  user?: AuthUser
  error?: string
  code?: string
}

export interface SessionInfo {
  user: AuthUser
  isAuthenticated: boolean
  isAdmin: boolean
  profile: UserProfile | null
  expiresAt?: string
}

// =============================================================================
// CLIENT-SIDE HELPERS
// =============================================================================

export function formatAuthError(error: any): string {
  if (!error) return 'An unknown error occurred'
  
  // Handle Supabase Auth errors
  if (error.message) {
    switch (error.message) {
      case 'Invalid login credentials':
        return 'כתובת האימייל או הסיסמה שגויים'
      case 'Email not confirmed':
        return 'נא לאמת את כתובת האימייל'
      case 'Too many requests':
        return 'יותר מדי נסיונות התחברות. נא לנסות שוב מאוחר יותר'
      case 'User not found':
        return 'משתמש לא קיים במערכת'
      case 'Password is too weak':
        return 'הסיסמה חלשה מדי'
      default:
        return error.message
    }
  }
  
  return 'שגיאה בהתחברות'
}

export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 6) {
    errors.push('הסיסמה חייבת להכיל לפחות 6 תווים')
  }
  
  if (!/\d/.test(password)) {
    errors.push('הסיסמה חייבת להכיל לפחות ספרה אחת')
  }
  
  if (!/[a-zA-Z]/.test(password)) {
    errors.push('הסיסמה חייבת להכיל לפחות אות אחת')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function formatUserDisplayName(user: AuthUser): string {
  if (user.profile?.full_name) {
    return user.profile.full_name
  }
  
  if (user.email) {
    return user.email.split('@')[0]
  }
  
  return 'משתמש'
}

export function getUserInitials(user: AuthUser): string {
  if (user.profile?.full_name) {
    const names = user.profile.full_name.split(' ')
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase()
    }
    return names[0][0].toUpperCase()
  }
  
  if (user.email) {
    return user.email[0].toUpperCase()
  }
  
  return 'U'
}

// =============================================================================
// PERMISSION HELPERS
// =============================================================================

export function checkPermission(
  user: AuthUser | null,
  permission: 'read' | 'write' | 'admin' | 'approve'
): boolean {
  if (!user) return permission === 'read'
  
  switch (permission) {
    case 'read':
      return true
    case 'write':
      return true
    case 'admin':
    case 'approve':
      return user.profile?.is_admin === true
    default:
      return false
  }
}

export function requireAuth(user: AuthUser | null): AuthUser {
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

export function requireAdmin(user: AuthUser | null): AuthUser {
  const authUser = requireAuth(user)
  if (!authUser.profile?.is_admin) {
    throw new Error('Admin privileges required')
  }
  return authUser
}

// =============================================================================
// SESSION HELPERS
// =============================================================================

export function getSessionInfo(user: AuthUser | null): SessionInfo | null {
  if (!user) return null
  
  return {
    user,
    isAuthenticated: true,
    isAdmin: user.profile?.is_admin === true,
    profile: user.profile || null,
    expiresAt: user.app_metadata?.expires_at
  }
}

export function isSessionExpired(sessionInfo: SessionInfo | null): boolean {
  if (!sessionInfo?.expiresAt) return false
  
  const expiryTime = new Date(sessionInfo.expiresAt).getTime()
  const currentTime = Date.now()
  
  return currentTime >= expiryTime
}

export function getSessionTimeRemaining(sessionInfo: SessionInfo | null): number {
  if (!sessionInfo?.expiresAt) return 0
  
  const expiryTime = new Date(sessionInfo.expiresAt).getTime()
  const currentTime = Date.now()
  
  return Math.max(0, expiryTime - currentTime)
}

// =============================================================================
// URL AND REDIRECT HELPERS
// =============================================================================

export function getLoginRedirectUrl(returnTo?: string): string {
  const baseUrl = '/auth/login'
  if (returnTo) {
    const encodedReturnTo = encodeURIComponent(returnTo)
    return `${baseUrl}?returnTo=${encodedReturnTo}`
  }
  return baseUrl
}

export function getPostLoginRedirectUrl(
  user: AuthUser,
  returnTo?: string
): string {
  // Admin users go to admin dashboard by default
  if (user.profile?.is_admin && !returnTo) {
    return '/admin/dashboard'
  }
  
  // Return to specified URL or home
  return returnTo && returnTo !== '/auth/login' ? returnTo : '/'
}

export function sanitizeRedirectUrl(url: string): string {
  // Only allow relative URLs or same-origin URLs
  if (url.startsWith('/')) {
    return url
  }
  
  if (typeof window !== 'undefined') {
    try {
      const urlObj = new URL(url)
      if (urlObj.origin === window.location.origin) {
        return url
      }
    } catch {
      // Invalid URL, fallback to home
    }
  }
  
  return '/'
}

// =============================================================================
// REPUTATION AND SCORING HELPERS
// =============================================================================

export function calculateUserTrustLevel(profile: UserProfile | null): {
  level: 'new' | 'trusted' | 'verified' | 'expert'
  score: number
  permissions: string[]
} {
  if (!profile) {
    return {
      level: 'new',
      score: 0,
      permissions: ['read']
    }
  }
  
  const { reputation_score } = profile
  const score = reputation_score || 0
  
  if (score >= 500) {
    return {
      level: 'expert',
      score,
      permissions: ['read', 'write', 'moderate', 'verify']
    }
  }
  
  if (score >= 200) {
    return {
      level: 'verified',
      score,
      permissions: ['read', 'write', 'verify']
    }
  }
  
  if (score >= 50) {
    return {
      level: 'trusted',
      score,
      permissions: ['read', 'write']
    }
  }
  
  return {
    level: 'new',
    score,
    permissions: ['read', 'write_limited']
  }
}

export function canUserPerformAction(
  user: AuthUser | null,
  action: string
): boolean {
  if (!user?.profile) return false
  
  const trustLevel = calculateUserTrustLevel(user.profile)
  
  switch (action) {
    case 'submit_price_report':
      return trustLevel.permissions.includes('write') || 
             trustLevel.permissions.includes('write_limited')
    case 'submit_review':
      return trustLevel.permissions.includes('write')
    case 'verify_price':
      return trustLevel.permissions.includes('verify')
    case 'moderate_content':
      return trustLevel.permissions.includes('moderate')
    default:
      return false
  }
}

// =============================================================================
// ERROR HANDLING HELPERS
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

export function handleAuthError(error: any): AuthResult {
  console.error('Auth error:', error)
  
  if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
    return {
      success: false,
      error: error.message,
      code: error.code
    }
  }
  
  if (error?.message) {
    return {
      success: false,
      error: formatAuthError(error),
      code: error.code || 'UNKNOWN_ERROR'
    }
  }
  
  return {
    success: false,
    error: 'שגיאה לא צפויה',
    code: 'UNEXPECTED_ERROR'
  }
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const AUTH_CONSTANTS = {
  SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours in ms
  REFRESH_THRESHOLD: 60 * 60 * 1000,     // 1 hour in ms
  ADMIN_SESSION_DURATION: 8 * 60 * 60 * 1000, // 8 hours in ms
  
  REPUTATION_THRESHOLDS: {
    NEW: 0,
    TRUSTED: 50,
    VERIFIED: 200,
    EXPERT: 500
  },
  
  RATE_LIMITS: {
    LOGIN_ATTEMPTS: 5,
    PASSWORD_RESET: 3,
    SIGNUP_ATTEMPTS: 3
  }
} as const

export const AUTH_ROUTES = {
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  RESET_PASSWORD: '/auth/reset-password',
  ADMIN_LOGIN: '/admin/login',
  ADMIN_DASHBOARD: '/admin/dashboard',
  PROFILE: '/profile',
  SETTINGS: '/settings'
} as const