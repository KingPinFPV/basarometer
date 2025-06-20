'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { LoginModal } from './LoginModal'
import { SignupModal } from './SignupModal'
import { User, LogIn, UserPlus, LogOut, Loader2, Settings } from 'lucide-react'

interface AuthButtonProps {
  className?: string
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function AuthButton({ 
  className = '', 
  showText = true, 
  size = 'md' 
}: AuthButtonProps) {
  const { user, isAuthenticated, signOut, loading } = useAuth()
  console.log('🔍 AuthButton render - isAuthenticated:', isAuthenticated, 'loading:', loading, 'user:', user)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)
  
  console.log('📊 Current modal states - login:', showLoginModal, 'signup:', showSignupModal)

  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  }

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const handleLoginSuccess = () => {
    setShowLoginModal(false)
  }

  const handleSignupSuccess = () => {
    setShowSignupModal(false)
  }

  const switchToSignup = () => {
    console.log('🔄 Switching to signup modal')
    setShowLoginModal(false)
    setShowSignupModal(true)
  }

  const switchToLogin = () => {
    console.log('🔄 Switching to login modal')
    setShowSignupModal(false)
    setShowLoginModal(true)
  }

  // Loading state
  if (loading) {
    return (
      <div className={`flex items-center space-x-2 rtl:space-x-reverse ${sizeClasses[size]} ${className}`}>
        <Loader2 className={`${iconSizeClasses[size]} animate-spin`} />
        {showText && <span>טוען...</span>}
      </div>
    )
  }

  // Authenticated state
  if (isAuthenticated && user) {
    const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'משתמש'
    
    return (
      <div className={`flex items-center space-x-2 rtl:space-x-reverse ${className}`}>
        {/* User Info */}
        <div className={`flex items-center space-x-2 rtl:space-x-reverse ${sizeClasses[size]} text-gray-700`}>
          <User className={iconSizeClasses[size]} />
          {showText && (
            <span className="max-w-20 truncate">
              שלום, {displayName}
            </span>
          )}
        </div>

        {/* Change Password Link */}
        <a
          href="/change-password"
          className={`
            flex items-center space-x-1 rtl:space-x-reverse ${sizeClasses[size]}
            text-gray-600 hover:text-gray-800 hover:bg-gray-50 
            rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500
          `}
          title="שנה סיסמה"
        >
          <Settings className={iconSizeClasses[size]} />
          {showText && <span>שנה סיסמה</span>}
        </a>

        {/* Logout Button */}
        <button
          onClick={handleSignOut}
          className={`
            flex items-center space-x-1 rtl:space-x-reverse ${sizeClasses[size]}
            text-red-600 hover:text-red-800 hover:bg-red-50 
            rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500
          `}
          title="התנתק"
        >
          <LogOut className={iconSizeClasses[size]} />
          {showText && <span>התנתק</span>}
        </button>
      </div>
    )
  }

  // Not authenticated state
  return (
    <>
      <div className={`flex items-center space-x-2 rtl:space-x-reverse ${className}`}>
        {/* Login Button */}
        <button
          onClick={() => {
            console.log('🔑 Login button clicked! Setting showLoginModal to true')
            console.log('Current showLoginModal state:', showLoginModal)
            setShowLoginModal(true)
          }}
          className={`
            flex items-center space-x-1 rtl:space-x-reverse ${sizeClasses[size]}
            text-blue-600 hover:text-blue-800 hover:bg-blue-50 
            rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
          `}
          title="התחבר"
        >
          <LogIn className={iconSizeClasses[size]} />
          {showText && <span>התחבר</span>}
        </button>

        {/* Signup Button */}
        <button
          onClick={() => {
            console.log('📝 Signup button clicked! Setting showSignupModal to true')
            console.log('Current showSignupModal state:', showSignupModal)
            setShowSignupModal(true)
          }}
          className={`
            flex items-center space-x-1 rtl:space-x-reverse ${sizeClasses[size]}
            text-green-600 hover:text-green-800 hover:bg-green-50 
            rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500
          `}
          title="הירשם"
        >
          <UserPlus className={iconSizeClasses[size]} />
          {showText && <span>הירשם</span>}
        </button>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => {
          console.log('🚪 Closing login modal')
          setShowLoginModal(false)
        }}
        onSwitchToSignup={switchToSignup}
        onSuccess={handleLoginSuccess}
      />

      {/* Signup Modal */}
      <SignupModal
        isOpen={showSignupModal}
        onClose={() => {
          console.log('🚪 Closing signup modal')
          setShowSignupModal(false)
        }}
        onSwitchToLogin={switchToLogin}
        onSuccess={handleSignupSuccess}
      />
    </>
  )
}

export default AuthButton