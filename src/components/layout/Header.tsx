'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { UserMenu } from './UserMenu'
import { AuthModal } from '../auth/AuthModal'
import { LiveIndicator } from '../LiveIndicator'
import { LogIn, UserPlus } from 'lucide-react'
import Link from 'next/link'

export function Header() {
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const { user, loading } = useAuth()
  
  const openLoginModal = () => {
    setAuthMode('login')
    setAuthModalOpen(true)
  }
  
  const openRegisterModal = () => {
    setAuthMode('register')
    setAuthModalOpen(true)
  }
  
  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-xl font-bold text-blue-600 hover:text-blue-700">
                בשרומטר V3
              </Link>
              <LiveIndicator />
            </div>
            
            <div className="flex items-center gap-3">
              {loading ? (
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : user ? (
                <UserMenu />
              ) : (
                <>
                  <button
                    onClick={openLoginModal}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <LogIn size={16} />
                    <span className="hidden sm:inline">התחבר</span>
                  </button>
                  <button
                    onClick={openRegisterModal}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <UserPlus size={16} />
                    <span className="hidden sm:inline">הירשם</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </>
  )
}