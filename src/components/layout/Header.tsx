'use client'

import Link from 'next/link'

export function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4 rtl:space-x-reverse" dir="rtl">
            <Link href="/" className="flex items-center space-x-2 rtl:space-x-reverse">
              <span className="text-2xl">🗄️</span>
              <div>
                <h1 className="text-xl font-bold text-gray-900">בשרומטר V3</h1>
                <p className="text-xs text-gray-500">גרסת חירום מייוצבת</p>
              </div>
            </Link>
          </div>
          
          <nav className="flex items-center space-x-6 rtl:space-x-reverse" dir="rtl">
            <Link 
              href="/" 
              className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              מטריקס מחירים
            </Link>
            <Link 
              href="/admin" 
              className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              ניהול
            </Link>
            <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
              זמין
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}