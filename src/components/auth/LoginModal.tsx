'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { X, Mail, Lock, Eye, EyeOff, User, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSwitchToSignup: () => void
  onSuccess?: () => void
}

export function LoginModal({ isOpen, onClose, onSwitchToSignup, onSuccess }: LoginModalProps) {
  const { signIn, isSubmitting, authError, clearError } = useAuth()
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 modal-overlay flex items-center justify-center p-4 z-50" dir="rtl">
      <div className="card max-w-md w-full animate-fade-in">
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
                placeholder="הזן סיסמה"
                className="focus-ring w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 pl-12"
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
            className="btn-primary w-full px-6 py-3 rounded-lg flex items-center justify-center space-x-2 rtl:space-x-reverse disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="text-gray-600 hover:text-gray-800 text-sm"
                disabled={isSubmitting}
              >
                שכחת סיסמה?
              </button>
            </div>
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