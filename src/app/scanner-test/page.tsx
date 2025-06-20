// Scanner Test Page - Direct view of scanner_products data
'use client'

import React from 'react'
import ScannerComparisonTable from '@/components/scanner/ScannerComparisonTable'

export default function ScannerTestPage() {
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🔬 בדיקת נתוני הסורק
          </h1>
          <p className="text-gray-600 max-w-3xl">
            עמוד זה מציג את נתוני המוצרים שנסרקו ישירות מטבלת scanner_products. 
            זה מאפשר לנו לוודא שהנתונים מאוחסנים נכון ומוכנים לשילוב בעמוד ההשוואה הראשי.
          </p>
        </div>

        {/* Scanner Data Table */}
        <ScannerComparisonTable />

        {/* Debug Information */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📊 מידע טכני על הנתונים
          </h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div>
              <strong>מקור הנתונים:</strong> טבלת scanner_products במסד הנתונים
            </div>
            <div>
              <strong>עדכון אחרון:</strong> בזמן אמת דרך Supabase Real-time
            </div>
            <div>
              <strong>פילטרים זמינים:</strong> חיפוש טקסט, חנויות, קטגוריות, רמת אמינות
            </div>
            <div>
              <strong>ייצוא:</strong> תמיכה בייצוא לקובץ CSV
            </div>
            <div>
              <strong>מטרה:</strong> אימות הנתונים לפני שילוב בעמוד ההשוואה הראשי
            </div>
          </div>
        </div>

        {/* Integration Notes */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            🔧 הערות שילוב
          </h3>
          <div className="space-y-2 text-sm text-blue-800">
            <div>• הנתונים כוללים 24 מוצרים מ-5 חנויות שונות</div>
            <div>• כל מוצר כולל מחיר, מחיר לקילו, ורמת אמינות</div>
            <div>• הנתונים מחולקים לקטגוריות: עוף, בקר, כבש</div>
            <div>• רמת האמינות הממוצעת היא 73%</div>
            <div>• הנתונים מוכנים לשילוב בעמוד ההשוואה הראשי</div>
          </div>
        </div>
      </div>
    </div>
  )
}