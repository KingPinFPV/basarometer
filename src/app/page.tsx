'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/Header'
import AccordionMatrixContainer from '@/components/matrix/AccordionMatrixContainer'
import { ToastContainer, useToast } from '@/components/ui/Toast'
import { TrendingUp, Users, Zap } from 'lucide-react'
import { PriceLegend } from '@/components/PriceLegend'
import AdminButtons from '@/components/AdminButtons'
import AddProductForm from '@/components/forms/AddProductForm'
import AddRetailerForm from '@/components/forms/AddRetailerForm'

export default function HomePage() {
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showAddRetailer, setShowAddRetailer] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const { toasts, removeToast, success } = useToast()


  // useCallback for checkAdmin
  const checkAdmin = useCallback(async () => {
    try {
      const { data, error: adminError } = await supabase.rpc('check_user_admin')
      if (adminError) {
        console.error('Error checking admin:', adminError)
        return
      }
      setIsAdmin(data || false)
    } catch (err) {
      console.error('Error checking admin:', err)
    }
  }, [])

  useEffect(() => {
    checkAdmin()
  }, [checkAdmin])

  const handleAddProduct = () => {
    setShowAddProduct(true)
  }

  const handleAddProductSuccess = () => {
    success('המוצר נוסף בהצלחה!', 'המוצר החדש נוסף למאגר 🎉')
    setRefreshKey(prev => prev + 1)
    setShowAddProduct(false)
  }

  const handleAddRetailer = () => {
    setShowAddRetailer(true)
  }

  const handleAddRetailerSuccess = () => {
    success('הקמעונאי נוסף בהצלחה!', 'הקמעונאי החדש נוסף למאגר 🎉')
    setRefreshKey(prev => prev + 1)
    setShowAddRetailer(false)
  }

  return (
    <div className="min-h-screen" dir="rtl">
      <Header />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Price Legend */}
        <div className="mb-6">
          <PriceLegend />
        </div>

        {/* Admin Buttons - Only shown to admins */}
        {isAdmin && (
          <div className="mb-6">
            <AdminButtons
              isAdmin={isAdmin}
              onAddProduct={handleAddProduct}
              onAddRetailer={handleAddRetailer}
            />
          </div>
        )}
        
        {/* Enhanced Accordion Matrix */}
        <AccordionMatrixContainer key={refreshKey} />
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

      {/* Modals */}
      <AddProductForm
        isOpen={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        onSuccess={handleAddProductSuccess}
      />

      <AddRetailerForm
        isOpen={showAddRetailer}
        onClose={() => setShowAddRetailer(false)}
        onSuccess={handleAddRetailerSuccess}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  )
}