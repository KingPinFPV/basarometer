export function PriceLegend() {
  return (
    <div className="flex flex-wrap gap-4 items-center justify-center p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-red-500 rounded"></div>
        <span className="text-sm text-gray-700">הכי יקר</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-green-500 rounded"></div>
        <span className="text-sm text-gray-700">הכי זול</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-yellow-500 rounded"></div>
        <span className="text-sm text-gray-700">מחיר ממוצע</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-gray-400 rounded"></div>
        <span className="text-sm text-gray-700">אין מידע</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-white rounded ring-2 ring-blue-500"></div>
        <span className="text-sm text-gray-700">במבצע</span>
      </div>
    </div>
  )
} 