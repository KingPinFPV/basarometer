'use client'

import { useAuth } from '@/hooks/useAuth'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Shield, Store, Package, Users, BarChart3, Settings } from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
  const { user, profile, loading, isAdmin } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/')
        return
      }
      if (!isAdmin) {
        router.push('/')
        return
      }
    }
  }, [user, isAdmin, loading, router])
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
        </div>
      </div>
    )
  }
  
  if (!user || !isAdmin) {
    return null // Will redirect
  }
  
  const adminCards = [
    {
      title: 'ניהול קמעונאים',
      description: 'הוסף, ערוך ונהל חנויות וקמעונאים',
      icon: Store,
      href: '/admin/retailers',
      color: 'bg-blue-50 border-blue-200 text-blue-700'
    },
    {
      title: 'ניהול מוצרים',
      description: 'הוסף, ערוך ונהל מוצרים וקטגוריות',
      icon: Package,
      href: '/admin/products',
      color: 'bg-green-50 border-green-200 text-green-700'
    },
    {
      title: 'ניהול משתמשים',
      description: 'צפה ונהל חשבונות משתמשים',
      icon: Users,
      href: '/admin/users',
      color: 'bg-purple-50 border-purple-200 text-purple-700'
    },
    {
      title: 'דוחות ונתונים',
      description: 'צפה בסטטיסטיקות ודוחות מערכת',
      icon: BarChart3,
      href: '/admin/reports',
      color: 'bg-orange-50 border-orange-200 text-orange-700'
    }
  ]
  
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="text-amber-600" size={32} />
            <h1 className="text-3xl font-bold text-gray-900">פאנל ניהול מערכת</h1>
          </div>
          <p className="text-gray-600">
            ברוך הבא {profile?.full_name || user.email}, ניהול מלא של פלטפורמת בשרומטר
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {adminCards.map((card, index) => {
            const IconComponent = card.icon
            return (
              <Link
                key={index}
                href={card.href}
                className={`p-6 rounded-lg border-2 transition-all hover:shadow-lg hover:scale-105 ${card.color}`}
              >
                <div className="flex items-start gap-4">
                  <IconComponent size={32} />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
                    <p className="text-sm opacity-80">{card.description}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Settings size={24} />
            פעולות מהירות
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/admin/retailers/new"
              className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Store size={20} className="text-blue-600 mb-2" />
              <p className="font-medium text-blue-900">הוסף קמעונאי חדש</p>
            </Link>
            <Link
              href="/admin/products/new"
              className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Package size={20} className="text-green-600 mb-2" />
              <p className="font-medium text-green-900">הוסף מוצר חדש</p>
            </Link>
            <Link
              href="/admin/reports"
              className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <BarChart3 size={20} className="text-orange-600 mb-2" />
              <p className="font-medium text-orange-900">צפה בדוחות</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}