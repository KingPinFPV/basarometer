'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { PriceMatrix } from '@/components/matrix/PriceMatrix'
import { PriceReportModal } from '@/components/forms/PriceReportModal'
import { AuthTrigger } from '@/components/auth/AuthGuard'
import { Plus, TrendingUp, Users, Zap } from 'lucide-react'

export default function HomePage() {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [preSelectedMeatCutId, setPreSelectedMeatCutId] = useState<string>('')
  const [preSelectedRetailerId, setPreSelectedRetailerId] = useState<string>('')

  const handleReportPrice = (meatCutId?: string, retailerId?: string) => {
    setPreSelectedMeatCutId(meatCutId || '')
    setPreSelectedRetailerId(retailerId || '')
    setIsReportModalOpen(true)
  }

  const handleReportSuccess = () => {
    // This will be called after successful price report submission
    // The PriceMatrix component will automatically refresh its data
    window.location.reload()
  }

  return (
    <div className="min-h-screen" dir="rtl">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-gradient-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              בשרומטר V3
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              השוואת מחירי בשר מתקדמת עם דיווחים קהילתיים בזמן אמת
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 rtl:space-x-reverse pt-6">
              <AuthTrigger
                onSuccess={() => handleReportPrice()}
                className="bg-white text-blue-600 hover:bg-gray-50 px-8 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2 rtl:space-x-reverse"
              >
                <Plus className="w-5 h-5" />
                <span>דווח מחיר חדש</span>
              </AuthTrigger>
              <div className="flex items-center space-x-6 rtl:space-x-reverse text-white/80 text-sm">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <TrendingUp className="w-4 h-4" />
                  <span>מחירים מעודכנים</span>
                </div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Users className="w-4 h-4" />
                  <span>קהילה פעילה</span>
                </div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Zap className="w-4 h-4" />
                  <span>עדכונים בזמן אמת</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PriceMatrix onReportPrice={handleReportPrice} />
      </div>

      {/* Stats Section */}
      <div className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center space-y-8">
            <h2 className="text-2xl font-bold text-gray-900">
              פלטפורמה לעזור לציבור הישראלי לחסוך בעלויות מזון
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center space-y-3">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">השוואת מחירים</h3>
                <p className="text-gray-600">
                  מטריקס מתקדם להשוואת מחירי בשר בין רשתות שונות
                </p>
              </div>

              <div className="text-center space-y-3">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">קהילה פעילה</h3>
                <p className="text-gray-600">
                  דיווחי מחירים מהקהילה לעדכונים מדויקים ורלוונטיים
                </p>
              </div>

              <div className="text-center space-y-3">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                  <Zap className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">עדכונים בזמן אמת</h3>
                <p className="text-gray-600">
                  מידע עדכני על מחירים ומבצעים ברחבי הארץ
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-3 rtl:space-x-reverse">
              <TrendingUp className="w-6 h-6" />
              <span className="text-xl font-bold">בשרומטר V3</span>
            </div>
            <p className="text-gray-400 text-sm">
              פלטפורמה קהילתית להשוואת מחירי בשר בישראל
            </p>
            <div className="text-xs text-gray-500">
              גרסה 3.0 - מעוצב עם ❤️ לקהילה הישראלית
            </div>
          </div>
        </div>
      </footer>

      {/* Price Report Modal */}
      <PriceReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        preSelectedMeatCutId={preSelectedMeatCutId}
        preSelectedRetailerId={preSelectedRetailerId}
        onSuccess={handleReportSuccess}
      />
    </div>
  )
}