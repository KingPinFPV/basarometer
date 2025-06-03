'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { User, Settings, LogOut, Shield, ChevronDown } from 'lucide-react'
import Link from 'next/link'

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, profile, isAdmin, signOut } = useAuth()
  const menuRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const handleSignOut = async () => {
    await signOut()
    setIsOpen(false)
  }
  
  if (!user) return null
  
  const displayName = profile?.full_name || user.email?.split('@')[0] || 'משתמש'
  
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <User size={16} />
        <span className="hidden sm:inline max-w-24 truncate">{displayName}</span>
        {isAdmin && <Shield size={14} className="text-amber-500" />}
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50" dir="rtl">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{displayName}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
            {isAdmin && (
              <span className="inline-flex items-center gap-1 px-2 py-1 mt-1 text-xs font-medium text-amber-800 bg-amber-100 rounded-full">
                <Shield size={12} />
                מנהל
              </span>
            )}
          </div>
          
          <div className="py-1">
            <Link
              href="/profile"
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              <Settings size={16} />
              פרופיל והגדרות
            </Link>
            
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                <Shield size={16} />
                ניהול מערכת
              </Link>
            )}
            
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut size={16} />
              התנתק
            </button>
          </div>
        </div>
      )}
    </div>
  )
}