export function PriceLegend() {
  return (
    <div className="flex flex-wrap gap-4 items-center justify-center p-4 bg-white rounded-lg shadow-sm">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-green-500 rounded"></div>
        <span>הכי זול</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-yellow-500 rounded"></div>
        <span>מחיר ממוצע</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-red-500 rounded"></div>
        <span>הכי יקר</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-gray-200 rounded"></div>
        <span>אין מידע</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-blue-500">🔵</span>
        <span>במבצע</span>
      </div>
    </div>
  );
} 