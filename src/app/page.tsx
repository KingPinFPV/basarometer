'use client'

import MatrixPriceDashboard from '@/components/MatrixPriceDashboard'

export default function Home() {
  return (
    <main className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
          🏗️ בשרומטר V3 - מטריקס מחירים
        </h1>
        
        <MatrixPriceDashboard />
      </div>
    </main>
  )
}
