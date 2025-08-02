'use client'

import React from 'react'
import styles from '@/styles/comparison.module.css'

interface LoadingStateProps {
  viewMode?: 'grid' | 'list'
}

export function LoadingState({ viewMode = 'grid' }: LoadingStateProps) {
  const skeletonCount = viewMode === 'grid' ? 9 : 6

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-3">
              <div className={`h-8 bg-gray-200 rounded-lg w-80 ${styles.skeleton}`} />
              <div className={`h-5 bg-gray-200 rounded-lg w-64 ${styles.skeleton}`} />
              <div className={`h-4 bg-gray-200 rounded-lg w-96 ${styles.skeleton}`} />
            </div>
            <div className="flex gap-3">
              <div className={`h-20 w-24 bg-gray-200 rounded-lg ${styles.skeleton}`} />
              <div className={`h-20 w-24 bg-gray-200 rounded-lg ${styles.skeleton}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs Skeleton */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto space-x-8 space-x-reverse py-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 px-4 py-3 min-w-max">
                <div className={`w-6 h-6 bg-gray-200 rounded ${styles.skeleton}`} />
                <div className="space-y-1">
                  <div className={`h-4 bg-gray-200 rounded w-16 ${styles.skeleton}`} />
                  <div className={`h-3 bg-gray-200 rounded w-12 ${styles.skeleton}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="space-y-4">
            {/* Search bar */}
            <div className={`h-12 bg-gray-200 rounded-lg ${styles.skeleton}`} />
            
            {/* Filter controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className={`h-10 bg-gray-200 rounded-lg ${styles.skeleton}`} />
              ))}
            </div>
            
            {/* Network filters */}
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className={`h-8 w-20 bg-gray-200 rounded-lg ${styles.skeleton}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Products Grid Skeleton */}
        <div className={`mt-6 ${styles.productGrid} ${viewMode === 'grid' ? styles.grid : ''} gap-6`}>
          {Array.from({ length: skeletonCount }).map((_, index) => (
            <ProductCardSkeleton key={index} viewMode={viewMode} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ProductCardSkeleton({ viewMode }: { viewMode: 'grid' | 'list' }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${
      viewMode === 'list' ? 'p-6' : 'overflow-hidden'
    }`}>
      <div className={viewMode === 'grid' ? 'p-6 pb-4' : ''}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 bg-gray-200 rounded ${styles.skeleton}`} />
              <div className={`h-5 bg-gray-200 rounded w-48 ${styles.skeleton}`} />
              <div className={`w-4 h-4 bg-gray-200 rounded ${styles.skeleton}`} />
            </div>
            <div className={`h-4 bg-gray-200 rounded w-32 ${styles.skeleton}`} />
            <div className={`h-6 bg-gray-200 rounded w-20 ${styles.skeleton}`} />
          </div>
          <div className="flex gap-2">
            <div className={`w-8 h-8 bg-gray-200 rounded-lg ${styles.skeleton}`} />
            <div className={`w-8 h-8 bg-gray-200 rounded-lg ${styles.skeleton}`} />
          </div>
        </div>

        {/* Price cards */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className={`h-6 bg-gray-200 rounded w-16 mx-auto ${styles.skeleton}`} />
              <div className={`h-3 bg-gray-200 rounded w-20 mx-auto ${styles.skeleton}`} />
            </div>
          ))}
        </div>

        {/* Best value highlight */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 bg-gray-200 rounded ${styles.skeleton}`} />
              <div className="space-y-1">
                <div className={`h-4 bg-gray-200 rounded w-24 ${styles.skeleton}`} />
                <div className={`h-3 bg-gray-200 rounded w-32 ${styles.skeleton}`} />
              </div>
            </div>
            <div className="space-y-1">
              <div className={`h-5 bg-gray-200 rounded w-16 ${styles.skeleton}`} />
              <div className={`h-3 bg-gray-200 rounded w-8 ${styles.skeleton}`} />
            </div>
          </div>
        </div>

        {/* Expand button */}
        <div className={`h-10 bg-gray-200 rounded-lg ${styles.skeleton}`} />
      </div>
    </div>
  )
}

// Performance-optimized error state
export function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="text-center py-16" dir="rtl">
      <div className="max-w-md mx-auto">
        <div className="text-6xl mb-6">⚠️</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          שגיאה בטעינת השוואת המחירים
        </h3>
        <p className="text-gray-600 mb-6 leading-relaxed">
          לא ניתן לטעון את נתוני 59 המוצרים מ-6 הרשתות. 
          אנא בדוק את החיבור לאינטרנט ונסה שוב.
        </p>
        <div className="space-y-3">
          <button
            onClick={onRetry}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            נסה שוב
          </button>
          <p className="text-sm text-gray-500">
            שגיאה: {error}
          </p>
        </div>
      </div>
    </div>
  )
}

// Performance-optimized empty state
export function EmptyState({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <div className="text-center py-16" dir="rtl">
      <div className="max-w-md mx-auto">
        <div className="text-8xl mb-6">🔍</div>
        <h3 className="text-2xl font-semibold text-gray-900 mb-4">
          לא נמצאו מוצרים
        </h3>
        <p className="text-gray-600 mb-8 text-lg leading-relaxed">
          לא מצאנו מוצרים שמתאימים לפילטרים שבחרת.
          נסה לשנות את מילות החיפוש או להרחיב את הקריטריונים.
        </p>
        <div className="space-y-4">
          <button
            onClick={onClearFilters}
            className="w-full px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
          >
            נקה כל הפילטרים
          </button>
          <div className="text-sm text-gray-500 space-y-1">
            <p>💡 טיפים לחיפוש מוצלח:</p>
            <p>• נסה מילות חיפוש כלליות יותר</p>
            <p>• בדוק שהקטגוריה נכונה</p>
            <p>• הרחב את טווח המחירים</p>
          </div>
        </div>
      </div>
    </div>
  )
}