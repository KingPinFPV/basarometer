'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Eye, EyeOff, UserPlus } from 'lucide-react'

interface RegisterFormProps {
  onSuccess?: () => void
  onSwitchToLogin: () => void
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const { signUp } = useAuth()
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    // Validation
    if (password !== confirmPassword) {
      setError('הסיסמאות אינן תואמות')
      setLoading(false)
      return
    }
    
    if (password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים')
      setLoading(false)
      return
    }
    
    if (!fullName.trim()) {
      setError('יש להזין שם מלא')
      setLoading(false)
      return
    }
    
    try {
      const { error } = await signUp(email, password, fullName.trim())
      
      if (error) {
        if (error.message.includes('User already registered')) {
          setError('משתמש עם כתובת אימייל זו כבר קיים')
        } else if (error.message.includes('Password should be at least')) {
          setError('הסיסמה חייבת להכיל לפחות 6 תווים')
        } else if (error.message.includes('Unable to validate email address')) {
          setError('כתובת אימייל לא תקינה')
        } else {
          setError('שגיאה בהרשמה. אנא נסה שוב.')
        }
      } else {
        setSuccess(true)
        // Auto-switch to login after successful registration
        setTimeout(() => {
          onSwitchToLogin()
        }, 3000)
      }
    } catch {
      setError('שגיאה בהרשמה. אנא נסה שוב.')
    } finally {
      setLoading(false)
    }
  }
  
  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="text-green-600 text-lg font-medium">
          🎉 ההרשמה הושלמה בהצלחה!
        </div>
        <div className="text-gray-600">
          נשלח אליך אימייל לאימות החשבון.
          <br />
          לאחר האימות תוכל להתחבר לחשבונך.
        </div>
        <button
          onClick={onSwitchToLogin}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          חזור להתחברות
        </button>
      </div>
    )
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
          שם מלא
        </label>
        <input
          type="text"
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="הכנס שם מלא"
          required
        />
      </div>
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          כתובת אימייל
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="your@email.com"
          required
          dir="ltr"
        />
      </div>
      
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          סיסמה
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="לפחות 6 תווים"
            required
            minLength={6}
            dir="ltr"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>
      
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
          אימות סיסמה
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="הכנס סיסמה שוב"
            required
            dir="ltr"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="text-red-600 text-sm text-center p-2 bg-red-50 rounded-md">
          {error}
        </div>
      )}
      
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <UserPlus size={20} />
        {loading ? 'נרשם...' : 'הירשם'}
      </button>
      
      <div className="text-center">
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-blue-600 hover:text-blue-700 text-sm"
        >
          יש לך כבר חשבון? התחבר כאן
        </button>
      </div>
    </form>
  )
}