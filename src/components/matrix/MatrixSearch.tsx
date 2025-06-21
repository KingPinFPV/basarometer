'use client'

import { Search, X } from 'lucide-react'

interface MatrixSearchProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  totalCategories: number
  totalCuts: number
  totalRetailers: number
}

export function MatrixSearch({
  searchTerm,
  onSearchChange,
  totalCategories,
  totalCuts,
  totalRetailers
}: MatrixSearchProps) {
  
  return (
    <div className="max-w-2xl mx-auto">
      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="חפש נתח בשר (לדוגמא: אנטריקוט, פילה, חזה)..."
          className="w-full pr-12 pl-10 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchTerm && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search Results Summary */}
      {searchTerm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="text-blue-800 text-sm">
            מחפש: &ldquo;<strong>{searchTerm}</strong>&rdquo;
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex justify-center gap-8 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="text-lg">📂</span>
            <span>{totalCategories} קטגוריות</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🥩</span>
            <span>{totalCuts} נתחי בשר</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🏪</span>
            <span>{totalRetailers} קמעונאים</span>
          </div>
        </div>
      </div>

      {/* Price Legend */}
      <div className="flex justify-center items-center gap-6 mb-8">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
          <span className="text-sm text-gray-600">מחיר נמוך</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
          <span className="text-sm text-gray-600">מחיר בינוני</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
          <span className="text-sm text-gray-600">מחיר גבוה</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm">🔥</span>
          <span className="text-sm text-gray-600">מבצע</span>
        </div>
      </div>
    </div>
  )
}