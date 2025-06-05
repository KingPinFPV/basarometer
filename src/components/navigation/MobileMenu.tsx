'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { NavItem } from './NavItem'
import { AuthButton } from '@/components/auth/AuthButton'
import { navigationItems } from './navigationConfig'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Mobile Menu Panel */}
      <div 
        className={`
          fixed top-0 right-0 h-full w-80 max-w-full bg-white shadow-2xl z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            תפריט ראשי
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="סגור תפריט"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Authentication Section */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-center">
            <AuthButton size="md" showText={true} className="w-full justify-center" />
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col p-4 space-y-2">
          {navigationItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              description={item.description}
              onClick={onClose}
              className="w-full justify-start rounded-xl p-4 hover:bg-gray-50"
              showDescription={true}
            />
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-center">
            <div className="text-sm font-medium text-gray-900 mb-1">
              בשרומטר V5.1
            </div>
            <div className="text-xs text-gray-500">
              פלטפורמת קנייה חכמה לכל המשפחה
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default MobileMenu