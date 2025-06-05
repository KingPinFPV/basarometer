'use client'

import { useState } from 'react'
import { usePriceMatrixData } from '@/hooks/usePriceMatrixData'
import { CategoryAccordion } from './CategoryAccordion'
import { MatrixSearch } from './MatrixSearch'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function AccordionMatrixContainer() {
  const { 
    categoriesWithSubCategories, 
    meatCuts, 
    retailers, 
    priceMatrix,
    loading, 
    error,
    refetch 
  } = usePriceMatrixData()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [expandedSubCategories, setExpandedSubCategories] = useState<Set<string>>(new Set())

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
      // Also collapse all sub-categories in this category
      const category = categoriesWithSubCategories.find(c => c.id === categoryId)
      if (category) {
        category.sub_categories.forEach(sub => {
          expandedSubCategories.delete(sub.id)
        })
        setExpandedSubCategories(new Set(expandedSubCategories))
      }
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const toggleSubCategory = (subCategoryId: string) => {
    const newExpanded = new Set(expandedSubCategories)
    if (newExpanded.has(subCategoryId)) {
      newExpanded.delete(subCategoryId)
    } else {
      newExpanded.add(subCategoryId)
    }
    setExpandedSubCategories(newExpanded)
  }

  // Filter cuts based on search
  const getFilteredCuts = (cuts: string[]) => {
    if (!searchTerm) return cuts
    
    return cuts.filter(cutId => {
      const cut = meatCuts.find(c => c.id === cutId)
      if (!cut) return false
      
      return cut.name_hebrew.toLowerCase().includes(searchTerm.toLowerCase()) ||
             (cut.name_english && cut.name_english.toLowerCase().includes(searchTerm.toLowerCase()))
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <LoadingSpinner />
        <span className="mr-4 text-gray-600 text-lg">טוען מטריצת מחירים מתקדמת...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-4">
        <div className="text-red-800 font-medium text-lg">שגיאה בטעינת נתונים</div>
        <p className="text-red-600 mt-2">{error}</p>
        <button
          onClick={refetch}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          נסה שוב
        </button>
      </div>
    )
  }

  if (categoriesWithSubCategories.length === 0) {
    return (
      <div className="text-center p-12">
        <div className="text-gray-500 text-xl">📭 אין נתונים להצגה</div>
        <p className="text-gray-400 mt-2">היו ראשונים לדווח על מחירים!</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-4" dir="rtl">
      {/* Header with Search */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          בשרומטר V4 - מטריצה היררכית
        </h1>
        <p className="text-gray-600 mb-6">
          השוואת מחירי בשר מתקדמת עם תצוגה מקובצת לפי קטגוריות
        </p>
        
        <MatrixSearch 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          totalCategories={categoriesWithSubCategories.length}
          totalCuts={meatCuts.length}
          totalRetailers={retailers.length}
        />
      </div>

      {/* Retailers Header Row */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-4">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-0">
          {/* Empty corner */}
          <div className="bg-gray-100 p-4 border-b border-r border-gray-200">
            <div className="font-bold text-gray-700 text-right">קטגוריות ונתחים</div>
          </div>
          
          {/* Retailers header */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-0">
            {retailers.map((retailer) => (
              <div 
                key={retailer.id}
                className="bg-gray-100 p-3 border-b border-gray-200 text-center min-h-[80px] flex flex-col justify-center"
              >
                <div className="font-semibold text-gray-700 text-sm mb-1">
                  {retailer.name}
                </div>
                <div className="text-xs text-gray-500">
                  {retailer.type === 'supermarket' ? 'סופרמרקט' : 
                   retailer.type === 'butcher' ? 'קצבייה' :
                   retailer.type === 'online' ? 'אונליין' : retailer.type}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Accordion Categories */}
      <div className="space-y-2">
        {categoriesWithSubCategories.map((category) => (
          <CategoryAccordion
            key={category.id}
            category={category}
            meatCuts={meatCuts}
            retailers={retailers}
            priceMatrix={priceMatrix}
            searchTerm={searchTerm}
            isExpanded={expandedCategories.has(category.id)}
            expandedSubCategories={expandedSubCategories}
            onToggleCategory={() => toggleCategory(category.id)}
            onToggleSubCategory={toggleSubCategory}
            getFilteredCuts={getFilteredCuts}
          />
        ))}
      </div>

      {/* Footer Stats */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex justify-center gap-8">
            <span>📊 {categoriesWithSubCategories.reduce((sum, cat) => sum + cat.sub_categories.length, 0)} תת-קטגוריות</span>
            <span>🥩 {meatCuts.length} נתחי בשר</span>
            <span>🏪 {retailers.length} קמעונאים</span>
          </div>
        </div>
        <div className="mt-4">
          עדכון אחרון: {new Date().toLocaleString('he-IL')} | 
          נתונים מקהילת בשרומטר V4 ❤️
        </div>
      </div>
    </div>
  )
}