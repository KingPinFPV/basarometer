import React from 'react';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  totalProducts, 
  productsPerPage, 
  onPageChange,
  hasNext,
  hasPrev 
}) => {
  const getPageNumbers = () => {
    const pages = [];
    const showPages = 5; // Show 5 page numbers
    
    let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
    let endPage = Math.min(totalPages, startPage + showPages - 1);
    
    // Adjust start if we're near the end
    if (endPage - startPage < showPages - 1) {
      startPage = Math.max(1, endPage - showPages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const startProduct = (currentPage - 1) * productsPerPage + 1;
  const endProduct = Math.min(currentPage * productsPerPage, totalProducts);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6">
      {/* Results Summary */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-600">
          מציג מוצרים {startProduct}-{endProduct} מתוך {totalProducts} מוצרים
        </div>
        <div className="text-sm text-blue-600 font-medium">
          עמוד {currentPage} מתוך {totalPages}
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-center items-center gap-1">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrev}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            hasPrev
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          ← הקודם
        </button>

        {/* First Page */}
        {getPageNumbers()[0] > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="px-3 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              1
            </button>
            {getPageNumbers()[0] > 2 && (
              <span className="px-2 text-gray-400">...</span>
            )}
          </>
        )}

        {/* Page Numbers */}
        {getPageNumbers().map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              page === currentPage
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {page}
          </button>
        ))}

        {/* Last Page */}
        {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
          <>
            {getPageNumbers()[getPageNumbers().length - 1] < totalPages - 1 && (
              <span className="px-2 text-gray-400">...</span>
            )}
            <button
              onClick={() => onPageChange(totalPages)}
              className="px-3 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              {totalPages}
            </button>
          </>
        )}

        {/* Next Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNext}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            hasNext
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          הבא →
        </button>
      </div>

      {/* Page Size Options */}
      <div className="flex justify-center mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">מוצרים בעמוד:</span>
          {[25, 50, 100].map(size => (
            <button
              key={size}
              onClick={() => onPageChange(1, size)}
              className={`px-2 py-1 rounded transition-colors ${
                productsPerPage === size
                  ? 'bg-blue-100 text-blue-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Pagination;