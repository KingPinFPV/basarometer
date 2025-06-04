'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthProfile } from './useAuthProfile'
import type { AuthError } from '@supabase/supabase-js'

interface AuthCredentials {
  email: string
  password: string
  fullName?: string
}

export function useAuth() {
  const { user, profile, loading, signOut } = useAuthProfile()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const signIn = useCallback(async ({ email, password }: AuthCredentials) => {
    try {
      setIsSubmitting(true)
      setAuthError(null)

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      return { error: null, success: true }
    } catch (err) {
      console.error('Auth error:', err)
      const error = err as AuthError
      setAuthError(error.message)
      return { error, success: false }
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const signUp = useCallback(async ({ email, password, fullName }: AuthCredentials) => {
    try {
      setIsSubmitting(true)
      setAuthError(null)

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName?.trim() || ''
          }
        }
      })

      if (error) {
        throw new Error(getHebrewErrorMessage(error.message))
      }

      if (data.user && !data.user.email_confirmed_at) {
        // User needs to confirm email
        return { 
          user: data.user, 
          error: null, 
          needsConfirmation: true,
          message: 'נשלח קישור אימות לכתובת המייל. אנא לחץ על הקישור לאימות החשבון.'
        }
      }

      return { user: data.user, error: null, needsConfirmation: false }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה ביצירת החשבון'
      setAuthError(errorMessage)
      return { user: null, error: errorMessage }
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    try {
      setIsSubmitting(true)
      setAuthError(null)

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        throw new Error(getHebrewErrorMessage(error.message))
      }

      return { 
        error: null, 
        message: 'נשלח קישור איפוס סיסמה לכתובת המייל שלך'
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה בשליחת איפוס סיסמה'
      setAuthError(errorMessage)
      return { error: errorMessage }
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setAuthError(null)
  }, [])

  return {
    // Current auth state
    user,
    profile,
    isAuthenticated: !!user,
    loading,

    // Auth actions
    signIn,
    signUp,
    signOut,
    resetPassword,

    // Auth form state
    isSubmitting,
    error: authError,
    clearError
  }
}

// Helper function to convert English errors to Hebrew
function getHebrewErrorMessage(errorMessage: string): string {
  const errorMap: Record<string, string> = {
    'Invalid login credentials': 'כתובת מייל או סיסמה שגויים',
    'Email not confirmed': 'יש לאמת את כתובת המייל לפני ההתחברות',
    'User already registered': 'כתובת המייל כבר רשומה במערכת',
    'Password should be at least 6 characters': 'הסיסמה חייבת להכיל לפחות 6 תווים',
    'Unable to validate email address: invalid format': 'כתובת המייל אינה תקינה',
    'Email rate limit exceeded': 'נשלחו יותר מדי מיילים. נסה שוב מאוחר יותר',
    'For security purposes, you can only request this once every 60 seconds': 'מטעמי אבטחה, ניתן לבקש זאת רק פעם ב-60 שניות',
    'signup is disabled': 'הרשמה אינה זמינה כרגע',
    'Email link is invalid or has expired': 'קישור המייל אינו תקף או פג תוקפו',
    'Token has expired or is invalid': 'הטוקן פג תוקף או אינו תקף',
    'Password is too weak': 'הסיסמה חלשה מדי',
    'User not found': 'משתמש לא נמצא'
  }

  return errorMap[errorMessage] || errorMessage || 'שגיאה לא צפויה'
}