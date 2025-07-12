import React, { useState, useEffect } from 'react';

const ProductFilter = ({ onFilterChange, totalProducts = 120 }) => {
  const [filters, setFilters] = useState({
    category: 'all',
    source: 'all',
    priceRange: [0, 300],
    sortBy: 'price',
    sortOrder: 'asc'
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const resetFilters = () => {
    const defaultFilters = {
      category: 'all',
      source: 'all',
      priceRange: [0, 300],
      sortBy: 'price',
      sortOrder: 'asc'
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-r-4 border-blue-500">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          🔍 מסנני חיפוש מתקדמים
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            {totalProducts} מוצרים זמינים
          </span>
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          {isExpanded ? 'הסתר מסננים' : 'הצג מסננים'}
        </button>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              קטגוריה
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">כל הקטגוריות</option>
              <option value="בקר">בשר בקר</option>
              <option value="עוף">עוף ופרגיות</option>
              <option value="כבש">כבש וטלה</option>
              <option value="טחון">בשר טחון</option>
              <option value="נקניקיות">נקניקיות ונקניק</option>
            </select>
          </div>

          {/* Source Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              מקור הנתונים
            </label>
            <select
              value={filters.source}
              onChange={(e) => handleFilterChange('source', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">כל המקורות</option>
              <option value="government">מאומת ממשלתית 🏛️</option>
              <option value="retail">רשתות קמעונאות 🏪</option>
            </select>
          </div>

          {/* Sort Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              מיון לפי
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="price">מחיר</option>
              <option value="name">שם המוצר</option>
              <option value="vendor">ספק</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              סדר מיון
            </label>
            <select
              value={filters.sortOrder}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="asc">מהנמוך לגבוה</option>
              <option value="desc">מהגבוה לנמוך</option>
            </select>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => handleFilterChange('source', 'government')}
            className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm hover:bg-blue-200 transition-colors"
          >
            🏛️ מאומת ממשלתית (89)
          </button>
          <button
            onClick={() => handleFilterChange('category', 'בקר')}
            className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm hover:bg-green-200 transition-colors"
          >
            🥩 בשר בקר
          </button>
          <button
            onClick={() => handleFilterChange('category', 'עוף')}
            className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm hover:bg-yellow-200 transition-colors"
          >
            🐔 עוף ופרגיות
          </button>
        </div>
        
        <button
          onClick={resetFilters}
          className="text-gray-600 hover:text-gray-800 text-sm underline transition-colors"
        >
          אפס מסננים
        </button>
      </div>
    </div>
  );
};

export default ProductFilter;