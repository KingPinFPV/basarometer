'use client'

import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, loading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminLoading, setAdminLoading] = useState(true)

  useEffect(() => {
    const checkAdmin = async () => {
      if (!isAuthenticated) {
        setAdminLoading(false)
        return
      }

      try {
        // For now, allow admin access for testing purposes
        // TODO: Implement proper admin authentication check
        setIsAdmin(true)
      } catch (error) {
        console.error('Error checking admin status:', error)
        setIsAdmin(false)
      } finally {
        setAdminLoading(false)
      }
    }

    // Only check admin status once per authentication session
    if (isAuthenticated && adminLoading) {
      checkAdmin()
    }
  }, [isAuthenticated, adminLoading])

  if (loading || adminLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">נדרשת הזדהות</h1>
          <p className="text-gray-600">יש להתחבר כדי לגשת לאזור הניהול</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">אין הרשאה</h1>
          <p className="text-gray-600">אין לך הרשאות למשתמש ניהול</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}