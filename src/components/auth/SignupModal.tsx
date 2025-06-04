'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { X, Mail, Lock, Eye, EyeOff, User, AlertCircle, CheckCircle, Loader2, UserPlus } from 'lucide-react'

interface SignupModalProps {
  isOpen: boolean
  onClose: () => void
  onSwitchToLogin: () => void
  onSuccess?: () => void
}

export function SignupModal({ isOpen, onClose, onSwitchToLogin, onSuccess }: SignupModalProps) {
  const { signUp, isSubmitting, authError, clearError } = useAuth()
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setValidationErrors([])
    setSuccessMessage(null)
    clearError()
  }

  const validateForm = (): string[] => {
    const errors: string[] = []
    
    if (!formData.fullName.trim()) {
      errors.push('יש להזין שם מלא')
    }
    
    if (!formData.email.trim()) {
      errors.push('יש להזין כתובת מייל')
    } else if (!isValidEmail(formData.email)) {
      errors.push('כתובת המייל אינה תקינה')
    }
    
    if (!formData.password) {
      errors.push('יש להזין סיסמה')
    } else if (formData.password.length < 6) {
      errors.push('הסיסמה חייבת להכיל לפחות 6 תווים')
    }
    
    if (!formData.confirmPassword) {
      errors.push('יש לאמת את הסיסמה')
    } else if (formData.password !== formData.confirmPassword) {
      errors.push('הסיסמאות אינן תואמות')
    }
    
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const errors = validateForm()
    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }

    const result = await signUp({
      email: formData.email,
      password: formData.password,
      fullName: formData.fullName
    })

    if (result.needsConfirmation) {
      // Show confirmation message
      setSuccessMessage(result.message || 'נשלח קישור אימות לכתובת המייל')
      setFormData({ fullName: '', email: '', password: '', confirmPassword: '' })
      setValidationErrors([])
    } else if (result.user && !result.error) {
      // Success - close modal and call success callback
      setFormData({ fullName: '', email: '', password: '', confirmPassword: '' })
      setValidationErrors([])
      setSuccessMessage(null)
      onClose()
      if (onSuccess) {
        onSuccess()
      }
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({ fullName: '', email: '', password: '', confirmPassword: '' })
      setValidationErrors([])
      setSuccessMessage(null)
      clearError()
      onClose()
    }
  }

  const handleSwitchToLogin = () => {
    setFormData({ fullName: '', email: '', password: '', confirmPassword: '' })
    setValidationErrors([])
    setSuccessMessage(null)
    clearError()
    onSwitchToLogin()
  }

  if (!isOpen) return null

  // Success state for email confirmation
  if (successMessage) {
    return (
      <div className="fixed inset-0 modal-overlay flex items-center justify-center p-4 z-50" dir="rtl">
        <div className="card max-w-md w-full text-center animate-fade-in">
          <div className="p-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">נרשמת בהצלחה!</h3>
            <p className="text-gray-600 mb-6">{successMessage}</p>
            <div className="space-y-3">
              <button
                onClick={handleSwitchToLogin}
                className="btn-primary w-full px-6 py-3 rounded-lg"
              >
                חזור להתחברות
              </button>
              <button
                onClick={handleClose}
                className="btn-secondary w-full px-6 py-3 rounded-lg"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 modal-overlay flex items-center justify-center p-4 z-50" dir="rtl">
      <div className="card max-w-md w-full animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-primary text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <UserPlus className="w-6 h-6" />
              <h2 className="text-xl font-bold">הרשמה</h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-white/90 mt-2 text-sm">
            הצטרף לקהילה ועזור לכולם לחסוך כסף
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Display */}
          {(validationErrors.length > 0 || authError) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3 rtl:space-x-reverse">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-red-800">יש לתקן את השגיאות הבאות:</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                    {authError && <li>• {authError}</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Full Name Field */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2 rtl:space-x-reverse text-sm font-semibold text-gray-900">
              <User className="w-4 h-4" />
              <span>שם מלא</span>
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              placeholder="הזן שם מלא"
              className="focus-ring w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900"
              required
              autoComplete="name"
            />
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2 rtl:space-x-reverse text-sm font-semibold text-gray-900">
              <Mail className="w-4 h-4" />
              <span>כתובת מייל</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="your@email.com"
              className="focus-ring w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900"
              required
              autoComplete="email"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2 rtl:space-x-reverse text-sm font-semibold text-gray-900">
              <Lock className="w-4 h-4" />
              <span>סיסמה</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="לפחות 6 תווים"
                className="focus-ring w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 pl-12"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2 rtl:space-x-reverse text-sm font-semibold text-gray-900">
              <Lock className="w-4 h-4" />
              <span>אימות סיסמה</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="הזן שוב את הסיסמה"
                className="focus-ring w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 pl-12"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full px-6 py-3 rounded-lg flex items-center justify-center space-x-2 rtl:space-x-reverse disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>יוצר חשבון...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                <span>הירשם</span>
              </>
            )}
          </button>

          {/* Footer Links */}
          <div className="pt-4 border-t border-gray-200 text-center">
            <button
              type="button"
              onClick={handleSwitchToLogin}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              disabled={isSubmitting}
            >
              יש לך כבר חשבון? התחבר כאן
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}