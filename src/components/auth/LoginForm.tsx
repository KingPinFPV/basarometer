'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Eye, EyeOff, LogIn } from 'lucide-react'

interface LoginFormProps {
  onSuccess: () => void
  onSwitchToRegister: () => void
}

export function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { signIn } = useAuth()
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const { error } = await signIn(email, password)
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('כתובת אימייל או סיסמה שגויים')
        } else if (error.message.includes('Email not confirmed')) {
          setError('יש לאמת את כתובת האימייל לפני ההתחברות')
        } else {
          setError('שגיאה בהתחברות. אנא נסה שוב.')
        }
      } else {
        onSuccess()
      }
    } catch {
      setError('שגיאה בהתחברות. אנא נסה שוב.')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
            placeholder="הכנס סיסמה"
            required
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
      
      {error && (
        <div className="text-red-600 text-sm text-center p-2 bg-red-50 rounded-md">
          {error}
        </div>
      )}
      
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <LogIn size={20} />
        {loading ? 'מתחבר...' : 'התחבר'}
      </button>
      
      <div className="text-center">
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-blue-600 hover:text-blue-700 text-sm"
        >
          אין לך חשבון? הירשם כאן
        </button>
      </div>
      
      <div className="text-center text-sm text-gray-500">
        <p>משתמשי בדיקות:</p>
        <p>admin@basarometer.org / test1@basarometer.org</p>
        <p>סיסמה: password123</p>
      </div>
    </form>
  )
}