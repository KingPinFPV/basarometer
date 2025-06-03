'use client'

import { Header } from '@/components/layout/Header'
import CleanMatrix from '@/components/CleanMatrix'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🗄️ בשרומטר V3 - פלטפורמת הקהילה
            </h1>
            <p className="text-gray-600">
              השוואת מחירי בשר מתקדמת עם דיווחים קהילתיים ומבצעים
            </p>
          </div>
          
          <CleanMatrix />
        </div>
      </main>
    </div>
  )
}
