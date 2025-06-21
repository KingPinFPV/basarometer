'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { LoginModal } from './LoginModal'
import { SignupModal } from './SignupModal'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  requireAuth?: boolean
  onAuthRequired?: () => void
}

export function AuthGuard({ 
  children, 
  fallback,
  requireAuth = true,
  onAuthRequired 
}: AuthGuardProps) {
  const { isAuthenticated, loading } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)

  // Handle authentication requirement
  const handleAuthRequired = () => {
    if (onAuthRequired) {
      onAuthRequired()
    } else {
      setShowLoginModal(true)
    }
  }

  // If loading, show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // If auth is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>
    }
    
    // Trigger auth modal
    handleAuthRequired()
    return null
  }

  // If authenticated or auth not required, render children
  return (
    <>
      {children}
      
      {/* Auth Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToSignup={() => {
          setShowLoginModal(false)
          setShowSignupModal(true)
        }}
        onSuccess={() => {
          setShowLoginModal(false)
        }}
      />
      
      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSwitchToLogin={() => {
          setShowSignupModal(false)
          setShowLoginModal(true)
        }}
        onSuccess={() => {
          setShowSignupModal(false)
        }}
      />
    </>
  )
}

interface AuthTriggerProps {
  children: React.ReactNode
  onSuccess?: () => void
  className?: string
}

export function AuthTrigger({ children, onSuccess, className }: AuthTriggerProps) {
  const { isAuthenticated } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)

  const handleClick = () => {
    if (isAuthenticated && onSuccess) {
      onSuccess()
    } else {
      setShowLoginModal(true)
    }
  }

  return (
    <>
      <button onClick={handleClick} className={className}>
        {children}
      </button>
      
      {/* Auth Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToSignup={() => {
          setShowLoginModal(false)
          setShowSignupModal(true)
        }}
        onSuccess={() => {
          setShowLoginModal(false)
          if (onSuccess) {
            onSuccess()
          }
        }}
      />
      
      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSwitchToLogin={() => {
          setShowSignupModal(false)
          setShowLoginModal(true)
        }}
        onSuccess={() => {
          setShowSignupModal(false)
          if (onSuccess) {
            onSuccess()
          }
        }}
      />
    </>
  )
}