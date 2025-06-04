'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { PriceMatrix } from '@/components/matrix/PriceMatrix'
import { PriceReportModal } from '@/components/forms/PriceReportModal'
import { AuthTrigger } from '@/components/auth/AuthGuard'
import { ToastContainer, useToast } from '@/components/ui/Toast'
import { Plus, TrendingUp, Users, Zap } from 'lucide-react'
import { PriceLegend } from '@/components/PriceLegend'
import AdminButtons from '@/components/AdminButtons'
import AddProductForm from '@/components/forms/AddProductForm'
import AddRetailerForm from '@/components/forms/AddRetailerForm'
import { useAuth } from '@/hooks/useAuth'

export default function HomePage() {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [isAddProductOpen, setIsAddProductOpen] = useState(false)
  const [isAddRetailerOpen, setIsAddRetailerOpen] = useState(false)
  const [preSelectedMeatCutId, setPreSelectedMeatCutId] = useState<string>('')
  const [preSelectedRetailerId, setPreSelectedRetailerId] = useState<string>('')
  const [refreshKey, setRefreshKey] = useState(0)
  const { toasts, removeToast, success } = useToast()
  const { profile } = useAuth()

  const handleReportPrice = (meatCutId?: string, retailerId?: string) => {
    setPreSelectedMeatCutId(meatCutId || '')
    setPreSelectedRetailerId(retailerId || '')
    setIsReportModalOpen(true)
  }

  const handleReportSuccess = () => {
    // Show success toast
    success('דיווח נשלח בהצלחה!', 'תודה על התרומה לקהילה 🎉')
    
    // Refresh the matrix data by forcing a re-render
    setRefreshKey(prev => prev + 1)
    
    // Close the modal
    setIsReportModalOpen(false)
  }

  const handleAddProduct = () => {
    setIsAddProductOpen(true)
  }

  const handleAddProductSuccess = () => {
    success('המוצר נוסף בהצלחה!', 'המוצר החדש נוסף למאגר 🎉')
    setRefreshKey(prev => prev + 1)
  }

  const handleAddRetailer = () => {
    setIsAddRetailerOpen(true)
  }

  const handleAddRetailerSuccess = () => {
    success('הקמעונאי נוסף בהצלחה!', 'הקמעונאי החדש נוסף למאגר 🎉')
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="min-h-screen" dir="rtl">
      <Header />
      
      {/* Header Section */}
      <div className="bg-gradient-to-b from-blue-50 to-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center space-y-6">
            <h1 className="text-4xl font-bold text-gray-900">
              השוואת מחירי בשר בישראל
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              מטריקס מחירים חכם המתעדכן בזמן אמת על ידי הקהילה
            </p>
          </div>
        </div>
      </div>

      {/* Price Matrix Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Buttons */}
        <AdminButtons
          isAdmin={profile?.is_admin ?? false}
          onAddProduct={handleAddProduct}
          onAddRetailer={handleAddRetailer}
        />
        
        {/* Price Legend */}
        <div className="mb-6">
          <PriceLegend />
        </div>
        
        {/* Matrix */}
        <PriceMatrix key={refreshKey} onReportPrice={handleReportPrice} />
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

      <AddProductForm
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onSuccess={handleAddProductSuccess}
      />

      <AddRetailerForm
        isOpen={isAddRetailerOpen}
        onClose={() => setIsAddRetailerOpen(false)}
        onSuccess={handleAddRetailerSuccess}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  )
}