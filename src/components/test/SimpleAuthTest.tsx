'use client'

import { useState } from 'react'
import { LoginModal } from '@/components/auth/LoginModal'
import { SignupModal } from '@/components/auth/SignupModal'

export default function SimpleAuthTest() {
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)

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

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="bg-white p-4 rounded-lg shadow-lg border">
        <h3 className="text-sm font-bold mb-2">Auth Test</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              console.log('🚀 DIRECT Login button clicked!')
              console.log('🔄 Setting showLoginModal to true')
              setShowLoginModal(true)
              console.log('✅ Login modal state should be true now')
            }}
            className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
          >
            Test Login
          </button>
          
          <button
            onClick={() => {
              console.log('🚀 DIRECT Signup button clicked!')
              console.log('🔄 Setting showSignupModal to true')
              setShowSignupModal(true)
              console.log('✅ Signup modal state should be true now')
            }}
            className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
          >
            Test Signup
          </button>
        </div>
        
        <div className="text-xs mt-2 text-gray-600">
          Login: {showLoginModal ? 'OPEN' : 'CLOSED'} | 
          Signup: {showSignupModal ? 'OPEN' : 'CLOSED'}
        </div>
      </div>

      {/* Use the same LoginModal as AuthButton */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => {
          console.log('🚪 Closing login modal from SimpleAuthTest')
          setShowLoginModal(false)
        }}
        onSwitchToSignup={switchToSignup}
        onSuccess={() => {
          console.log('✅ Login successful from SimpleAuthTest')
          setShowLoginModal(false)
        }}
      />

      {/* Use the same SignupModal as AuthButton */}
      <SignupModal
        isOpen={showSignupModal}
        onClose={() => {
          console.log('🚪 Closing signup modal from SimpleAuthTest')
          setShowSignupModal(false)
        }}
        onSwitchToLogin={switchToLogin}
        onSuccess={() => {
          console.log('✅ Signup successful from SimpleAuthTest')
          setShowSignupModal(false)
        }}
      />
    </div>
  )
}