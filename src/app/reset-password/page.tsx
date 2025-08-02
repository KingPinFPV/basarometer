'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

// Loading component for Suspense fallback
function ResetPasswordLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center mb-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
        <p className="text-center text-gray-600">טוען...</p>
      </div>
    </div>
  )
}

// Separate component that uses useSearchParams
function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isValidToken, setIsValidToken] = useState(false)

  useEffect(() => {
    // Check if we have a valid token from the URL
    const accessToken = searchParams?.get('access_token')
    const refreshToken = searchParams?.get('refresh_token')
    const type = searchParams?.get('type')

    if (type === 'recovery' && accessToken && refreshToken) {
      setIsValidToken(true)
      // Set the session with the tokens
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      })
    } else {
      setError('קישור איפוס הסיסמה אינו תקף או שפג תוקפו')
    }
  }, [searchParams])

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = []
    
    if (pwd.length < 6) {
      errors.push('הסיסמה חייבת להכיל לפחות 6 תווים')
    }
    
    if (!/(?=.*[a-zA-Z])/.test(pwd)) {
      errors.push('הסיסמה חייבת להכיל לפחות אות אחת')
    }
    
    if (!/(?=.*\d)/.test(pwd)) {
      errors.push('הסיסמה חייבת להכיל לפחות ספרה אחת')
    }
    
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    // Validate passwords
    const passwordErrors = validatePassword(password)
    if (passwordErrors.length > 0) {
      setError(passwordErrors.join(', '))
      return
    }

    if (password !== confirmPassword) {
      setError('הסיסמאות אינן זהות')
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        throw error
      }

      setMessage('הסיסמה עודכנה בהצלחה! מעביר לדף הראשי...')
      
      setTimeout(() => {
        router.push('/')
      }, 2000)

    } catch (err: any) {
      console.error('Password reset error:', err)
      setError(err.message || 'שגיאה בעדכון הסיסמה')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isValidToken && !error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-center mb-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
          <p className="text-center text-gray-600">בודק את קישור איפוס הסיסמה...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            עדכון סיסמה
          </h1>
          <p className="text-gray-600">
            אנא הזן סיסמה חדשה לחשבון שלך
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 rtl:space-x-reverse">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        {/* Success Message */}
        {message && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2 rtl:space-x-reverse">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <span className="text-green-700 text-sm">{message}</span>
          </div>
        )}

        {/* Form */}
        {isValidToken && !message && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                סיסמה חדשה
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                  placeholder="הזן סיסמה חדשה"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                אימוד סיסמה
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                  placeholder="הזן שוב את הסיסמה החדשה"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
              <p className="font-medium mb-1">דרישות סיסמה:</p>
              <ul className="space-y-1">
                <li className={password.length >= 6 ? 'text-green-600' : 'text-gray-500'}>
                  • לפחות 6 תווים
                </li>
                <li className={/(?=.*[a-zA-Z])/.test(password) ? 'text-green-600' : 'text-gray-500'}>
                  • לפחות אות אחת
                </li>
                <li className={/(?=.*\d)/.test(password) ? 'text-green-600' : 'text-gray-500'}>
                  • לפחות ספרה אחת
                </li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !password || !confirmPassword}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 rtl:space-x-reverse transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>מעדכן סיסמה...</span>
                </>
              ) : (
                <span>עדכן סיסמה</span>
              )}
            </button>
          </form>
        )}

        {/* Back to Login */}
        {error && (
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              חזור לדף הראשי
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Main page component with Suspense wrapper
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordForm />
    </Suspense>
  )
}