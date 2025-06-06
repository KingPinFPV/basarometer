'use client'

import { useState } from 'react'
import { usePriceMatrixData } from '@/hooks/usePriceMatrixData'
import { useShoppingList } from '@/hooks/useShoppingList'
import { useAuth } from '@/hooks/useAuth'
import { CategoryAccordion } from './CategoryAccordion'
import { MatrixSearch } from './MatrixSearch'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ColorLegendV2 } from '@/components/ui/ColorLegendV2'
import { StoreReviewModal } from '@/components/community/StoreReviewModal'
import { PriceReportModal } from '@/components/forms/PriceReportModal'
import { MessageSquare } from 'lucide-react'
import type { Retailer } from '@/lib/database.types'

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

  const { user } = useAuth()
  const { currentList, addItem, createList } = useShoppingList()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [expandedSubCategories, setExpandedSubCategories] = useState<Set<string>>(new Set())
  const [useV2Algorithm, setUseV2Algorithm] = useState(true)
  const [showColorLegend, setShowColorLegend] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedRetailer, setSelectedRetailer] = useState<Retailer | null>(null)
  const [showPriceReportModal, setShowPriceReportModal] = useState(false)
  const [selectedMeatCutId, setSelectedMeatCutId] = useState<string | null>(null)
  const [selectedRetailerId, setSelectedRetailerId] = useState<string | null>(null)

  // Handle adding items to shopping list
  const handleAddToShoppingList = async (cutId: string) => {
    if (!user) {
      alert('התחבר כדי להשתמש ברשימות קניות')
      return
    }

    let listToUse = currentList

    // Create default list if none exists
    if (!listToUse) {
      listToUse = await createList('רשימת קניות ראשית')
      if (!listToUse) {
        alert('שגיאה ביצירת רשימת קניות')
        return
      }
    }

    const success = await addItem(listToUse.id, cutId, 1, 'kg')
    if (success) {
      const meatCut = meatCuts.find(cut => cut.id === cutId)
      alert(`${meatCut?.name_hebrew || 'פריט'} נוסף לרשימת הקניות! 🛒`)
    } else {
      alert('שגיאה בהוספה לרשימת קניות')
    }
  }

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

  // Handle review modal
  const openReviewModal = (retailer: Retailer) => {
    if (!user) {
      alert('התחבר כדי לכתוב ביקורת')
      return
    }
    setSelectedRetailer(retailer)
    setShowReviewModal(true)
  }

  const closeReviewModal = () => {
    setShowReviewModal(false)
    setSelectedRetailer(null)
  }

  // Handle price report modal
  const openPriceReportModal = (cutId: string, retailerId: string) => {
    if (!user) {
      alert('התחבר כדי לדווח מחירים')
      return
    }
    setSelectedMeatCutId(cutId)
    setSelectedRetailerId(retailerId)
    setShowPriceReportModal(true)
  }

  const closePriceReportModal = () => {
    setShowPriceReportModal(false)
    setSelectedMeatCutId(null)
    setSelectedRetailerId(null)
  }

  const handlePriceReportSuccess = () => {
    closePriceReportModal()
    refetch() // Refresh data to show new price
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
          בשרומטר V5.1 - מטריצה חכמה
        </h1>
        <p className="text-gray-600 mb-4">
          השוואת מחירי בשר מתקדמת עם אלגוריתם צבעים חדש ומחשבון מחירים
        </p>
        
        {/* V5.1 Controls */}
        <div className="flex justify-center items-center gap-4 mb-6">
          <button
            onClick={() => setUseV2Algorithm(!useV2Algorithm)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              useV2Algorithm 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {useV2Algorithm ? '🎨 אלגוריתם V2.0 פעיל' : 'אלגוריתם קלאסי'}
          </button>
          
          <button
            onClick={() => setShowColorLegend(!showColorLegend)}
            className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
          >
            🎨 {showColorLegend ? 'הסתר' : 'הצג'} מפתח צבעים
          </button>
        </div>
        
        <MatrixSearch 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          totalCategories={categoriesWithSubCategories.length}
          totalCuts={meatCuts.length}
          totalRetailers={retailers.length}
        />
      </div>

      {/* Color Legend V2 */}
      {showColorLegend && (
        <div className="mb-6 flex justify-center">
          <ColorLegendV2 
            className="max-w-md"
            compact={false}
            showDescription={true}
          />
        </div>
      )}

      {/* Retailers Header Row */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-4">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-0">
          {/* Empty corner */}
          <div className="bg-gray-100 p-4 border-b border-r border-gray-200">
            <div className="font-bold text-gray-700 text-right">קטגוריות ונתחים</div>
          </div>
          
          {/* Retailers header */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-0">
            {retailers.map((retailer) => (
              <div 
                key={retailer.id}
                className="bg-gray-100 p-3 border-b border-gray-200 text-center min-h-[100px] flex flex-col justify-between"
              >
                <div>
                  <div className="font-semibold text-gray-700 text-sm mb-1">
                    {retailer.name}
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    {retailer.type === 'supermarket' ? 'סופרמרקט' : 
                     retailer.type === 'butcher' ? 'קצבייה' :
                     retailer.type === 'online' ? 'אונליין' : retailer.type}
                  </div>
                </div>
                
                {/* Review Button */}
                <button
                  onClick={() => openReviewModal(retailer)}
                  className="flex items-center justify-center space-x-1 rtl:space-x-reverse text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>ביקורת</span>
                </button>
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
            useV2Algorithm={useV2Algorithm}
            onReportPrice={openPriceReportModal}
            onAddToShoppingList={handleAddToShoppingList}
          />
        ))}
      </div>

      {/* Footer Stats */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex justify-center gap-8">
            <span>📊 {(categoriesWithSubCategories || []).reduce((sum, cat) => sum + (cat?.sub_categories?.length || 0), 0)} תת-קטגוריות</span>
            <span>🥩 {meatCuts.length} נתחי בשר</span>
            <span>🏪 {retailers.length} קמעונאים</span>
          </div>
        </div>
        <div className="mt-4">
          עדכון אחרון: {new Date().toLocaleString('he-IL')} | 
          בשרומטר V5.1 - אלגוריתם צבעים חכם ❤️
        </div>
      </div>

      {/* Store Review Modal */}
      {showReviewModal && selectedRetailer && (
        <StoreReviewModal
          retailer={selectedRetailer}
          isOpen={showReviewModal}
          onClose={closeReviewModal}
        />
      )}

      {/* Price Report Modal */}
      {showPriceReportModal && selectedMeatCutId && selectedRetailerId && (
        <PriceReportModal
          isOpen={showPriceReportModal}
          onClose={closePriceReportModal}
          preSelectedMeatCutId={selectedMeatCutId}
          preSelectedRetailerId={selectedRetailerId}
          onSuccess={handlePriceReportSuccess}
        />
      )}
    </div>
  )
}