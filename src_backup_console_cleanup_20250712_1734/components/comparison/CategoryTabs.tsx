'use client'

import React from 'react'
import { getAllCategories } from '@/utils/productCategorization'

interface CategoryTabsProps {
  categoryStats: any
  activeCategory: string
  onCategoryChange: (category: string) => void
}

export function CategoryTabs({ categoryStats, activeCategory, onCategoryChange }: CategoryTabsProps) {
  const allCategories = getAllCategories()
  
  // Calculate total products count
  const totalCount = Object.values(categoryStats).reduce((sum: number, stats: any) => sum + stats.count, 0)

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex overflow-x-auto scrollbar-hide">
          <div className="flex space-x-8 space-x-reverse min-w-max py-4">
            {/* All Categories Tab */}
            <button
              onClick={() => onCategoryChange('all')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeCategory === 'all'
                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-300 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-2 border-transparent'
              }`}
            >
              <span className="text-lg">🍖</span>
              <div className="text-right">
                <div className="font-bold">כל הקטגוריות</div>
                <div className="text-xs opacity-75">{totalCount} מוצרים</div>
              </div>
            </button>

            {/* Individual Category Tabs */}
            {allCategories.map((category) => {
              const stats = categoryStats[category.key] || { count: 0 }
              
              // Skip empty categories
              if (stats.count === 0) return null
              
              return (
                <button
                  key={category.key}
                  onClick={() => onCategoryChange(category.key)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    activeCategory === category.key
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-300 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-2 border-transparent'
                  }`}
                >
                  <span className="text-lg">{category.icon}</span>
                  <div className="text-right">
                    <div className="font-bold">{category.name}</div>
                    <div className="text-xs opacity-75">
                      {stats.count} מוצרים
                      {category.expectedCount && stats.count !== category.expectedCount && (
                        <span className={`mr-1 ${stats.count >= category.expectedCount * 0.8 ? 'text-green-600' : 'text-orange-600'}`}>
                          ({category.expectedCount} צפוי)
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Progress indicator for expected vs actual */}
                  {category.expectedCount && (
                    <div className="w-1 h-8 rounded-full bg-gray-200 overflow-hidden">
                      <div 
                        className={`w-full transition-all duration-500 ${
                          stats.count >= category.expectedCount * 0.8 
                            ? 'bg-green-500' 
                            : stats.count >= category.expectedCount * 0.5
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ 
                          height: `${Math.min((stats.count / category.expectedCount) * 100, 100)}%`,
                          transform: 'translateY(100%)',
                          animation: 'slideUp 0.5s ease-out forwards'
                        }}
                      />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
      
      {/* Category Info Bar */}
      {activeCategory !== 'all' && (
        <div className="bg-blue-50 border-t border-blue-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {(() => {
                  const categoryInfo = allCategories.find(c => c.key === activeCategory)
                  const stats = categoryStats[activeCategory] || { count: 0 }
                  
                  if (!categoryInfo) return null
                  
                  return (
                    <>
                      <span className="text-xl">{categoryInfo.icon}</span>
                      <div>
                        <h3 className="font-semibold text-blue-900">{categoryInfo.name}</h3>
                        <p className="text-sm text-blue-700">
                          {stats.count} מוצרים זמינים
                          {categoryInfo.expectedCount && (
                            <span className="mr-2">
                              • יעד: {categoryInfo.expectedCount} מוצרים
                            </span>
                          )}
                        </p>
                      </div>
                    </>
                  )
                })()}
              </div>
              
              {/* Category completion indicator */}
              {(() => {
                const categoryInfo = allCategories.find(c => c.key === activeCategory)
                const stats = categoryStats[activeCategory] || { count: 0 }
                
                if (!categoryInfo?.expectedCount) return null
                
                const completionRate = (stats.count / categoryInfo.expectedCount) * 100
                
                return (
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-blue-700">
                      {Math.round(completionRate)}% מהיעד
                    </div>
                    <div className="w-20 h-2 bg-blue-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          completionRate >= 80 
                            ? 'bg-green-500' 
                            : completionRate >= 50
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(completionRate, 100)}%` }}
                      />
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}