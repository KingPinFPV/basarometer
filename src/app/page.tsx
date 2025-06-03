'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Header } from '@/components/layout/Header'

interface PriceData {
  meat_cut_id: string
  retailer_id: string
  price_per_kg: number
  meat_cut_name: string
  retailer_name: string
}

export default function HomePage() {
  const [priceData, setPriceData] = useState<PriceData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPriceData = async () => {
      try {
        const supabase = createClient()
        
        // Simple query with timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout - נסה שוב')), 10000)
        )
        
        const dataPromise = supabase
          .from('price_reports')
          .select(`
            meat_cut_id,
            retailer_id,
            price_per_kg,
            meat_cuts(name_hebrew),
            retailers(name)
          `)
          .limit(50)

        const result = await Promise.race([dataPromise, timeoutPromise])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = result as { data: any; error: any }
        
        if (error) {
          throw error
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedData = data?.map((item: { [key: string]: any }) => ({
          meat_cut_id: item.meat_cut_id,
          retailer_id: item.retailer_id,
          price_per_kg: item.price_per_kg,
          meat_cut_name: item.meat_cuts?.name_hebrew || 'לא ידוע',
          retailer_name: item.retailers?.name || 'לא ידוע'
        })) || []

        setPriceData(formattedData)
        setError(null)
      } catch (err) {
        console.error('Data loading error:', err)
        setError(err instanceof Error ? err.message : 'שגיאה בטעינת נתונים')
      } finally {
        setIsLoading(false)
      }
    }

    loadPriceData()
  }, [])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
        <div className="max-w-md mx-auto text-center p-6 bg-white rounded-lg shadow-lg">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-red-600 mb-4">שגיאה בטעינת הנתונים</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              רענן דף
            </button>
            <button
              onClick={() => {
                document.cookie.split(";").forEach(c => {
                  const eqPos = c.indexOf("=")
                  const name = eqPos > -1 ? c.substr(0, eqPos) : c
                  document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
                })
                localStorage.clear()
                sessionStorage.clear()
                window.location.reload()
              }}
              className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700"
            >
              נקה עוגיות ורענן
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען נתונים...</p>
          <p className="text-sm text-gray-500 mt-2">אם הטעינה לוקחת זמן רב, רענן את הדף</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <Header />
      <div className="max-w-6xl mx-auto p-4">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            מטריקס מחירי בשר ישראלי
          </h1>
          <p className="text-gray-600">
            השוואת מחירי בשר מתקדמת עם דיווחים קהילתיים ומבצעים
          </p>
        </header>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">מטריקס מחירי בשר ישראלי</h2>
          
          {priceData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">אין נתוני מחירים זמינים כרגע</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              >
                רענן נתונים
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-4">
                מציג {priceData.length} דיווחי מחירים אחרונים
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {priceData.slice(0, 12).map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-bold text-lg text-gray-900">{item.meat_cut_name}</h3>
                    <p className="text-gray-600 text-sm">{item.retailer_name}</p>
                    <p className="text-xl font-bold text-green-600 my-2">
                      ₪{(item.price_per_kg / 100).toFixed(2)} לק&quot;ג
                    </p>
                    <button 
                      onClick={() => alert('דיווח מחיר חדש יתווסף בקרוב!\\nתכונה זו תחזור בעדכון הבא.')}
                      className="w-full mt-2 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      דווח מחיר חדש
                    </button>
                  </div>
                ))}
              </div>
              
              {priceData.length > 12 && (
                <div className="text-center mt-6">
                  <p className="text-gray-600 text-sm">
                    מציג 12 מתוך {priceData.length} דיווחים
                  </p>
                </div>
              )}
            </>
          )}
        </div>
        
        <footer className="text-center mt-8 text-sm text-gray-500">
          בשרומטר V3 - גרסת חירום מייוצבת
        </footer>
      </div>
    </div>
  )
}