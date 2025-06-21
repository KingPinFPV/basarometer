'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { X, Mail, Lock, Eye, EyeOff, User, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { ModalPortal } from '@/components/ui/ModalPortal'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSwitchToSignup: () => void
  onSuccess?: () => void
}

export function LoginModal({ isOpen, onClose, onSwitchToSignup, onSuccess }: LoginModalProps) {
  const { signIn, resetPassword, isSubmitting, authError, clearError } = useAuth()
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [resetEmailSent, setResetEmailSent] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setValidationErrors([])
    clearError()
  }

  const validateForm = (): string[] => {
    const errors: string[] = []
    
    if (!formData.email.trim()) {
      errors.push('יש להזין כתובת מייל')
    } else if (!isValidEmail(formData.email)) {
      errors.push('כתובת המייל אינה תקינה')
    }
    
    if (!formData.password) {
      errors.push('יש להזין סיסמה')
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

    const result = await signIn({
      email: formData.email,
      password: formData.password
    })

    if (result.user && !result.error) {
      // Success - close modal and call success callback
      setFormData({ email: '', password: '' })
      setValidationErrors([])
      onClose()
      if (onSuccess) {
        onSuccess()
      }
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({ email: '', password: '' })
      setValidationErrors([])
      clearError()
      onClose()
    }
  }

  const handleSwitchToSignup = () => {
    setFormData({ email: '', password: '' })
    setValidationErrors([])
    clearError()
    onSwitchToSignup()
  }

  const handleForgotPassword = async () => {
    if (!formData.email.trim()) {
      setValidationErrors(['אנא הזן כתובת מייל כדי לאפס את הסיסמה'])
      return
    }

    if (!isValidEmail(formData.email)) {
      setValidationErrors(['אנא הזן כתובת מייל תקינה'])
      return
    }

    try {
      const result = await resetPassword(formData.email)
      if (result.error) {
        setValidationErrors([result.error])
      } else {
        setResetEmailSent(true)
        setValidationErrors([])
      }
    } catch (error) {
      setValidationErrors(['שגיאה בשליחת איפוס סיסמה'])
    }
  }

  return (
    <ModalPortal isOpen={isOpen}>
      <div 
        className="card max-w-md w-full mx-auto animate-fade-in"
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
          maxWidth: '28rem',
          width: '100%',
          margin: '0 auto',
          position: 'relative',
          zIndex: 10000
        }}
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        {/* Header */}
        <div className="bg-gradient-primary text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <User className="w-6 h-6" />
              <h2 className="text-xl font-bold">התחברות</h2>
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
            התחבר כדי לדווח מחירים ולעזור לקהילה
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

          {/* Reset Password Success */}
          {resetEmailSent && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3 rtl:space-x-reverse">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-green-800">קישור איפוס נשלח!</h4>
                  <p className="text-sm text-green-700 mt-1">
                    נשלח קישור לאיפוס סיסמה לכתובת המייל <strong>{formData.email}</strong>
                  </p>
                  <p className="text-xs text-green-600 mt-2">
                    בדוק את תיבת המייל (כולל ספאם) ולחץ על הקישור כדי לאפס את הסיסמה
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right flex items-center space-x-2 rtl:space-x-reverse">
              <Mail className="w-4 h-4" />
              <span>כתובת מייל</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              required
              autoComplete="email"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right flex items-center space-x-2 rtl:space-x-reverse">
              <Lock className="w-4 h-4" />
              <span>סיסמה</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="הזן סיסמה"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 pl-12"
                required
                autoComplete="current-password"
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="min-h-[44px] w-full bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 active:bg-blue-800 font-medium rounded-lg flex items-center justify-center space-x-2 rtl:space-x-reverse disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>מתחבר...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>התחבר</span>
              </>
            )}
          </button>

          {/* Footer Links */}
          <div className="space-y-3 pt-4 border-t border-gray-200">
            <div className="text-center">
              <button
                type="button"
                onClick={handleSwitchToSignup}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                disabled={isSubmitting}
              >
                אין לך חשבון? הירשם כאן
              </button>
            </div>
            
            <div className="text-center">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-gray-600 hover:text-gray-800 text-sm"
                disabled={isSubmitting}
              >
                שכחת סיסמה?
              </button>
            </div>
          </div>
        </form>
      </div>
    </ModalPortal>
  )
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}