// =============================================================================
// BASAROMETER ENHANCED INTELLIGENCE SYSTEM - ADMIN AUTHENTICATION COMPONENT
// =============================================================================
// Purpose: Admin login interface for Enhanced Intelligence System
// Integration: Works with existing useAuth hook and admin verification
// Security: Proper error handling and validation
// =============================================================================

'use client'

import React, { useState, useEffect } from 'react'
import { Shield, Lock, Eye, EyeOff, Brain, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface AdminAuthProps {
  onAuthSuccess?: () => void
  onAuthFailure?: (error: string) => void
  redirectTo?: string
  className?: string
}

export default function AdminAuth({
  onAuthSuccess,
  onAuthFailure,
  redirectTo = '/admin/dashboard',
  className = ''
}: AdminAuthProps) {
  const { user, profile, signIn, signOut, loading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [authError, setAuthError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check if user is already admin
  const isAdmin = profile?.is_admin || false

  useEffect(() => {
    if (user && isAdmin) {
      onAuthSuccess?.()
      if (typeof window !== 'undefined' && redirectTo) {
        window.location.href = redirectTo
      }
    }
  }, [user, isAdmin, onAuthSuccess, redirectTo])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (authError) setAuthError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isSubmitting) return
    
    setIsSubmitting(true)
    setAuthError(null)

    try {
      // Validate input
      if (!formData.email || !formData.password) {
        setAuthError('אנא מלא את כל השדות')
        setIsSubmitting(false)
        return
      }

      // Attempt sign in
      const result = await signIn({
        email: formData.email,
        password: formData.password
      })

      if (result?.error) {
        setAuthError(result.error.message || 'שגיאה בהתחברות')
        onAuthFailure?.(result.error.message || 'Authentication failed')
        setIsSubmitting(false)
        return
      }

      // Success will be handled by useEffect when user/profile updates
    } catch (error) {
      console.error('Admin auth error:', error)
      const errorMessage = error instanceof Error ? error.message : 'שגיאה בהתחברות'
      setAuthError(errorMessage)
      onAuthFailure?.(errorMessage)
      setIsSubmitting(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setFormData({ email: '', password: '' })
      setAuthError(null)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  // If user is authenticated but not admin
  if (user && !loading && !isAdmin) {
    return (
      <div className={`max-w-md mx-auto ${className}`} dir="rtl">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
          <div className="text-center mb-6">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              גישה מוגבלת
            </h2>
            <p className="text-gray-600">
              אין לך הרשאות מנהל למערכת האינטליגנציה המתקדמת
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>משתמש נוכחי:</strong> {user.email}
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                צור קשר עם מנהל המערכת לקבלת הרשאות
              </p>
            </div>
            
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              התנתק
            </button>
          </div>
        </div>
      </div>
    )
  }

  // If user is authenticated and is admin
  if (user && isAdmin) {
    return (
      <div className={`max-w-md mx-auto ${className}`} dir="rtl">
        <div className="bg-white rounded-lg shadow-lg border border-green-200 p-8">
          <div className="text-center mb-6">
            <Brain className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              מנהל מורשה
            </h2>
            <p className="text-gray-600">
              גישה מלאה למערכת האינטליגנציה המתקדמת
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <strong>מנהל:</strong> {user.email}
              </p>
              <p className="text-xs text-green-600 mt-1">
                כל התכונות המתקדמות זמינות
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => window.location.href = redirectTo}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                לוח מנהל
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                התנתק
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Login form for non-authenticated users
  return (
    <div className={`max-w-md mx-auto ${className}`} dir="rtl">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            התחברות מנהל
          </h1>
          <p className="text-gray-600">
            מערכת האינטליגנציה המתקדמת
          </p>
        </div>

        {/* Error Alert */}
        {authError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 ml-2" />
              <p className="text-sm text-red-700">{authError}</p>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              כתובת אימייל
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="admin@basarometer.org"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              required
              disabled={isSubmitting || loading}
            />
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              סיסמה
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="הכנס סיסמה"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pl-12"
                required
                disabled={isSubmitting || loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={isSubmitting || loading}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting || loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                מתחבר...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Lock className="h-5 w-5 ml-2" />
                התחבר למערכת
              </div>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-center">
            <p className="text-xs text-gray-500">
              מערכת מאובטחת עם אימות דו-שלבי
            </p>
            <div className="flex items-center justify-center mt-2 space-x-2 rtl:space-x-reverse">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-500">מערכת פעילה</span>
            </div>
          </div>
        </div>

        {/* Test Credentials Note (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800 text-center">
              <strong>בדיקה:</strong> admintest1@basarometer.org / 123123
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// ADMIN AUTH GUARD COMPONENT
// =============================================================================

interface AdminAuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}

export function AdminAuthGuard({ 
  children, 
  fallback,
  redirectTo = '/admin/login'
}: AdminAuthGuardProps) {
  const { user, profile, loading } = useAuth()
  const [checkComplete, setCheckComplete] = useState(false)

  useEffect(() => {
    if (!loading) {
      setCheckComplete(true)
      
      // Redirect if not authenticated or not admin
      if (!user || !profile?.is_admin) {
        if (typeof window !== 'undefined' && redirectTo) {
          window.location.href = redirectTo
        }
      }
    }
  }, [user, profile, loading, redirectTo])

  if (loading || !checkComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">בודק הרשאות מנהל...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile?.is_admin) {
    return fallback || <AdminAuth redirectTo="/admin/dashboard" />
  }

  return <>{children}</>
}