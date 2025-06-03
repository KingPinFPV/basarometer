'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'login' | 'register'
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto" dir="rtl">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">
            {mode === 'login' ? 'התחברות לבשרומטר' : 'הרשמה לבשרומטר'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6">
          {mode === 'login' ? (
            <LoginForm onSuccess={onClose} onSwitchToRegister={() => setMode('register')} />
          ) : (
            <RegisterForm onSuccess={onClose} onSwitchToLogin={() => setMode('login')} />
          )}
        </div>
      </div>
    </div>
  )
}