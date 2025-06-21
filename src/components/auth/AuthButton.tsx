'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { LoginModal } from './LoginModal'
import { SignupModal } from './SignupModal'
import { User, LogIn, UserPlus, LogOut, Loader2, Settings } from 'lucide-react'

interface AuthButtonProps {
  className?: string
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const AuthButton = React.memo(function AuthButton({ 
  className = '', 
  showText = true, 
  size = 'md' 
}: AuthButtonProps) {
  const { user, isAuthenticated, signOut, loading } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)

  // Memoized size classes
  const sizeClasses = useMemo(() => ({
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  }), [])

  const iconSizeClasses = useMemo(() => ({
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }), [])

  const handleSignOut = useCallback(async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }, [signOut])

  const handleLoginSuccess = useCallback(() => {
    setShowLoginModal(false)
  }, [])

  const handleSignupSuccess = useCallback(() => {
    setShowSignupModal(false)
  }, [])

  const switchToSignup = useCallback(() => {
    setShowLoginModal(false)
    setShowSignupModal(true)
  }, [])

  const switchToLogin = useCallback(() => {
    setShowSignupModal(false)
    setShowLoginModal(true)
  }, [])

  // Loading state
  if (loading) {
    return (
      <div className={`flex items-center space-x-2 rtl:space-x-reverse ${sizeClasses[size]} ${className}`}>
        <Loader2 className={`${iconSizeClasses[size]} animate-spin`} />
        {showText && <span>טוען...</span>}
      </div>
    )
  }

  // Memoized display name
  const displayName = useMemo(() => {
    if (!user) return 'משתמש'
    return user.user_metadata?.full_name || user.email?.split('@')[0] || 'משתמש'
  }, [user])

  // Authenticated state
  if (isAuthenticated && user) {
    
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
            nav-item-enhanced ${sizeClasses[size]}
            text-gray-600 hover:text-gray-800 hover:bg-gray-50 
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
            nav-item-enhanced ${sizeClasses[size]}
            text-red-600 hover:text-red-800 hover:bg-red-50 
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
          onClick={() => setShowLoginModal(true)}
          className={`
            nav-item-enhanced ${sizeClasses[size]}
            text-blue-600 hover:text-blue-800 hover:bg-blue-50 
          `}
          title="התחבר"
        >
          <LogIn className={iconSizeClasses[size]} />
          {showText && <span>התחבר</span>}
        </button>

        {/* Signup Button */}
        <button
          onClick={() => setShowSignupModal(true)}
          className={`
            nav-item-enhanced ${sizeClasses[size]}
            text-green-600 hover:text-green-800 hover:bg-green-50 
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
        onClose={() => setShowLoginModal(false)}
        onSwitchToSignup={switchToSignup}
        onSuccess={handleLoginSuccess}
      />

      {/* Signup Modal */}
      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSwitchToLogin={switchToLogin}
        onSuccess={handleSignupSuccess}
      />
    </>
  )
})

export { AuthButton }
export default AuthButton