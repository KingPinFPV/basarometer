import React, { useState, useEffect, useCallback } from 'react';
import ProductFilter from './advanced-filters/ProductFilter';
import EnhancedProductCard from './EnhancedProductCard';
import Pagination from './Pagination';

const EnhancedProductsDisplay = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  const [sourceStats, setSourceStats] = useState({});
  
  const [currentFilters, setCurrentFilters] = useState({
    category: 'all',
    source: 'all',
    priceRange: [0, 300],
    sortBy: 'price',
    sortOrder: 'asc'
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(50);

  const fetchProducts = useCallback(async (page = 1, limit = 50, filters = currentFilters) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        category: filters.category,
        source: filters.source,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        minPrice: filters.priceRange[0].toString(),
        maxPrice: filters.priceRange[1].toString()
      });

      const response = await fetch(`/api/products-optimized?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.data.products);
        setPagination(data.data.pagination);
        setPerformanceMetrics(data.data.performance);
        setSourceStats(data.data.sources);
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch products');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [currentFilters]);

  useEffect(() => {
    fetchProducts(currentPage, productsPerPage, currentFilters);
  }, [fetchProducts, currentPage, productsPerPage]);

  const handleFilterChange = (newFilters) => {
    setCurrentFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
    fetchProducts(1, productsPerPage, newFilters);
  };

  const handlePageChange = (newPage, newLimit = productsPerPage) => {
    if (newLimit !== productsPerPage) {
      setProductsPerPage(newLimit);
      setCurrentPage(1);
      fetchProducts(1, newLimit, currentFilters);
    } else {
      setCurrentPage(newPage);
      fetchProducts(newPage, productsPerPage, currentFilters);
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-800 font-medium mb-2">שגיאה בטעינת המוצרים</div>
        <div className="text-red-600 text-sm">{error}</div>
        <button 
          onClick={() => fetchProducts(currentPage, productsPerPage)}
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
        >
          נסה שוב
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Stats */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🥩 השוואת מחירי בשר - 120+ מוצרים מאומתים
          </h1>
          <div className="flex justify-center gap-6 text-sm flex-wrap">
            <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-medium">
              🏛️ {sourceStats.government_products || 89} מוצרים ממשלתיים
            </div>
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-medium">
              🏪 {sourceStats.retail_products || 31} מוצרי קמעונאות
            </div>
            {performanceMetrics.response_time_ms && (
              <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-full font-medium">
                ⚡ {performanceMetrics.response_time_ms}ms זמן תגובה
              </div>
            )}
          </div>
        </div>

        {/* Advanced Filters */}
        <ProductFilter 
          onFilterChange={handleFilterChange}
          totalProducts={performanceMetrics.database_size || 120}
        />

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-gray-600">טוען מוצרים...</div>
          </div>
        )}

        {/* Products Grid */}
        {!loading && products.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {products.map((product, index) => (
                <EnhancedProductCard
                  key={product.id || index}
                  product={product}
                  isGovernmentVerified={product.source === 'government'}
                />
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={pagination.current_page || 1}
              totalPages={pagination.total_pages || 1}
              totalProducts={pagination.total_products || 0}
              productsPerPage={pagination.products_per_page || 50}
              hasNext={pagination.has_next || false}
              hasPrev={pagination.has_prev || false}
              onPageChange={handlePageChange}
            />
          </>
        )}

        {/* No Results */}
        {!loading && products.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-600 text-lg mb-4">לא נמצאו מוצרים המתאימים לחיפוש</div>
            <button
              onClick={() => handleFilterChange({
                category: 'all',
                source: 'all',
                priceRange: [0, 300],
                sortBy: 'price',
                sortOrder: 'asc'
              })}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              אפס מסננים
            </button>
          </div>
        )}

        {/* Performance Stats Footer */}
        {performanceMetrics.response_time_ms && (
          <div className="mt-8 text-center text-sm text-gray-500">
            <div className="bg-white rounded-lg shadow-sm p-4 inline-block">
              <div className="flex items-center gap-4">
                <span>⚡ זמן תגובה: {performanceMetrics.response_time_ms}ms</span>
                <span>📊 מסד נתונים: {performanceMetrics.database_size} מוצרים</span>
                <span>🔍 מסוננים: {performanceMetrics.filtered_size} תוצאות</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedProductsDisplay;