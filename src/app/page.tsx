// Enhanced Intelligence Homepage - Basarometer V5.2
// Replacing broken homepage with fully functional Enhanced Intelligence Matrix
// Built on working /enhanced route patterns with Hebrew Excellence

'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import MeatIntelligenceMatrix from '@/components/enhanced/MeatIntelligenceMatrix'
import { ToastContainer, useToast } from '@/components/ui/Toast'
import { TrendingUp, Users, Zap, Brain, BarChart3, Sparkles } from 'lucide-react'
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

  // Check admin status with error handling
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
      {/* Enhanced Intelligence Hero Section */}
      <div className="bg-gradient-to-bl from-blue-50 via-white to-purple-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center space-x-3 rtl:space-x-reverse mb-4">
              <Brain className="w-12 h-12 text-blue-600" />
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              ברוכים הבאים לבשרומטר
            </h1>
            
            <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              מערכת האינטליגנציה הישראלית המתקדמת למחירי בשר
              <br />
              עם 54+ נתחי בשר מנורמלים ואוטומציה מלאה
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mt-8">
              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border">
                <div className="text-2xl font-bold text-blue-600 mb-1">54+</div>
                <div className="text-sm text-gray-600">נתחי בשר מנורמלים</div>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border">
                <div className="text-2xl font-bold text-green-600 mb-1">97%</div>
                <div className="text-sm text-gray-600">דיוק זיהוי אוטומטי</div>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border">
                <div className="text-2xl font-bold text-purple-600 mb-1">12+</div>
                <div className="text-sm text-gray-600">רשתות שיווק</div>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border">
                <div className="text-2xl font-bold text-orange-600 mb-1">100%</div>
                <div className="text-sm text-gray-600">אוטומציה חכמה</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <a 
                href="/enhanced"
                className="inline-flex items-center px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
              >
                <Sparkles className="w-5 h-5 ml-2" />
                חקור מטריצת אינטליגנציה
              </a>
              <a 
                href="/admin"
                className="inline-flex items-center px-6 py-3 rounded-lg bg-white text-gray-700 font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <BarChart3 className="w-5 h-5 ml-2" />
                מערכת ניהול
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Price Legend */}
        <div>
          <PriceLegend />
        </div>

        {/* Admin Buttons - Only shown to admins */}
        {isAdmin && (
          <div>
            <AdminButtons
              isAdmin={isAdmin}
              onAddProduct={handleAddProduct}
              onAddRetailer={handleAddRetailer}
            />
          </div>
        )}
        
        {/* Enhanced Intelligence Matrix - Main Feature */}
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Brain className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                מטריצת אינטליגנציה מתקדמת
              </h2>
            </div>
            <p className="text-gray-600 mt-1">
              מערכת זיהוי אוטומטית עם למידה מתמשכת ודיוק של 97%
            </p>
          </div>
          <div className="p-6">
            <MeatIntelligenceMatrix key={refreshKey} />
          </div>
        </div>
      </div>

      {/* Features Showcase */}
      <div className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center space-y-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                פלטפורמה לעזור לציבור הישראלי לחסוך בעלויות מזון
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                מערכת האינטליגנציה המתקדמת שלנו משתמשת בטכנולוגיות AI מתקדמות 
                לזיהוי אוטומטי של מחירי בשר ברחבי הארץ
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center space-y-4">
                <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                  <Brain className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">אינטליגנציה מתקדמת</h3>
                <p className="text-gray-600 leading-relaxed">
                  מערכת AI מתקדמת לזיהוי אוטומטי של 54+ נתחי בשר עם דיוק של 97% 
                  ולמידה מתמשכת מהשוק הישראלי
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                  <TrendingUp className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">השוואת מחירים חכמה</h3>
                <p className="text-gray-600 leading-relaxed">
                  מטריקס מתקדם להשוואת מחירי בשר בין רשתות שונות עם ניתוח איכות 
                  וטווחי מחירים בזמן אמת
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                  <Users className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">קהילה פעילה</h3>
                <p className="text-gray-600 leading-relaxed">
                  דיווחי מחירים מהקהילה הישראלית לעדכונים מדויקים ורלוונטיים 
                  עם מערכת מוניטין מתקדמת
                </p>
              </div>
            </div>

            {/* Enhanced Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <Zap className="w-8 h-8 text-yellow-500 mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">עדכונים בזמן אמת</h4>
                <p className="text-sm text-gray-600">
                  מידע עדכני על מחירים ומבצעים ברחבי הארץ עם התראות חכמות
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <BarChart3 className="w-8 h-8 text-blue-500 mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">ניתוח שוק מתקדם</h4>
                <p className="text-sm text-gray-600">
                  תובנות עמוקות על מגמות שוק ותחזיות מחירים עם AI
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <Sparkles className="w-8 h-8 text-purple-500 mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">זיהוי איכות אוטומטי</h4>
                <p className="text-sm text-gray-600">
                  הבחנה אוטומטית בין רגיל/פרמיום/אנגוס/וואגיו/עגל
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <Brain className="w-8 h-8 text-green-500 mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">למידה מתמשכת</h4>
                <p className="text-sm text-gray-600">
                  המערכת לומדת ומשתפרת כל הזמן מנתוני השוק הישראלי
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center space-x-3 rtl:space-x-reverse">
              <Brain className="w-8 h-8" />
              <TrendingUp className="w-6 h-6" />
              <span className="text-2xl font-bold">בשרומטר V5.2</span>
            </div>
            <p className="text-gray-400 text-lg">
              פלטפורמת אינטליגנציה ישראלית מתקדמת להשוואת מחירי בשר
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              <span>54+ נתחי בשר מנורמלים</span>
              <span>•</span>
              <span>97% דיוק זיהוי</span>
              <span>•</span>
              <span>12+ רשתות שיווק</span>
              <span>•</span>
              <span>אוטומציה מלאה</span>
            </div>
            <div className="text-xs text-gray-500 pt-4 border-t border-gray-800">
              גרסה 5.2 Enhanced Intelligence - מעוצב עם ❤️ לקהילה הישראלית
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