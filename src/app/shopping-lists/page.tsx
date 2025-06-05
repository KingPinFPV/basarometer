'use client'

import { useState } from 'react'
import { useShoppingList, type ShoppingListOptimization } from '@/hooks/useShoppingList'
import { useAuth } from '@/hooks/useAuth'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Plus, ShoppingCart, TrendingDown, MapPin, Trash2 } from 'lucide-react'

export default function ShoppingListsPage() {
  const { user } = useAuth()
  const {
    lists,
    currentList,
    currentItems,
    loading,
    error,
    createList,
    removeItem,
    updateItem,
    deleteList,
    calculateOptimization,
    setCurrentList,
    hasItems
  } = useShoppingList()

  const [showNewListForm, setShowNewListForm] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [optimizations, setOptimizations] = useState<ShoppingListOptimization[]>([])
  const [showOptimization, setShowOptimization] = useState(false)
  const [optimizationLoading, setOptimizationLoading] = useState(false)

  // Calculate store optimizations
  const handleOptimize = async () => {
    if (!hasItems) return

    setOptimizationLoading(true)
    try {
      const results = await calculateOptimization(currentItems)
      setOptimizations(results)
      setShowOptimization(true)
    } catch (err) {
      console.error('Optimization failed:', err)
    } finally {
      setOptimizationLoading(false)
    }
  }

  // Create new list
  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newListName.trim()) return

    const success = await createList(newListName.trim())
    if (success) {
      setNewListName('')
      setShowNewListForm(false)
    }
  }

  // Format price for display
  const formatPrice = (priceInAgorot: number): string => {
    return `₪${(priceInAgorot / 100).toFixed(2)}`
  }

  if (!user) {
    return <AuthGuard />
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <ShoppingCart className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  רשימות קניות חכמות
                </h1>
                <p className="text-gray-600">
                  תכנון קניות אופטימלי עם השוואת מחירים ומסלולים
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowNewListForm(true)}
              className="flex items-center space-x-2 rtl:space-x-reverse bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>רשימה חדשה</span>
            </button>
          </div>

          {/* List Selector */}
          {lists.length > 0 && (
            <div className="flex space-x-2 rtl:space-x-reverse overflow-x-auto pb-2">
              {lists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => setCurrentList(list)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    currentList?.id === list.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {list.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* New List Form */}
        {showNewListForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">יצירת רשימת קניות חדשה</h3>
              <form onSubmit={handleCreateList}>
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="שם הרשימה"
                  className="w-full p-3 border border-gray-300 rounded-lg mb-4 text-right"
                  autoFocus
                />
                <div className="flex space-x-2 rtl:space-x-reverse">
                  <button
                    type="submit"
                    disabled={!newListName.trim() || loading}
                    className="flex-1 bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'יוצר...' : 'צור רשימה'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewListForm(false)
                      setNewListName('')
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 p-3 rounded-lg hover:bg-gray-400"
                  >
                    ביטול
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-red-800 font-medium">שגיאה</div>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Shopping List Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    {currentList ? currentList.name : 'בחר רשימת קניות'}
                  </h2>
                  {currentList && hasItems && (
                    <button
                      onClick={handleOptimize}
                      disabled={optimizationLoading}
                      className="flex items-center space-x-2 rtl:space-x-reverse bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      <TrendingDown className="w-4 h-4" />
                      <span>{optimizationLoading ? 'מחשב...' : 'אופטימיזציה'}</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4">
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner />
                  </div>
                )}

                {!loading && !currentList && (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">צור רשימת קניות ראשונה כדי להתחיל</p>
                  </div>
                )}

                {!loading && currentList && currentItems.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-gray-500 text-lg mb-2">הרשימה ריקה</div>
                    <p className="text-gray-400">הוסף פריטים מהמטריצה הראשית או צור פריטים חדשים</p>
                  </div>
                )}

                {!loading && currentItems.length > 0 && (
                  <div className="space-y-3">
                    {currentItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {item.meat_cut?.name_hebrew || 'פריט לא ידוע'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.quantity} {item.unit === 'kg' ? 'קילו' : item.unit === '100g' ? '100 גרם' : 'יחידות'}
                            {item.notes && ` • ${item.notes}`}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <button
                            onClick={() => updateItem(item.id, { quantity: Math.max(0.1, item.quantity - 0.1) })}
                            className="w-8 h-8 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="min-w-[3rem] text-center font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateItem(item.id, { quantity: item.quantity + 0.1 })}
                            className="w-8 h-8 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 flex items-center justify-center"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="w-8 h-8 bg-red-100 text-red-600 rounded-full hover:bg-red-200 flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Store Optimization Results */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold flex items-center">
                  <MapPin className="w-5 h-5 ml-2" />
                  המלצות חנויות
                </h3>
              </div>

              <div className="p-4">
                {!showOptimization && (
                  <div className="text-center py-6">
                    <TrendingDown className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">
                      הוסף פריטים ולחץ על &quot;אופטימיזציה&quot; לקבלת המלצות
                    </p>
                  </div>
                )}

                {showOptimization && optimizations.length === 0 && (
                  <div className="text-center py-6">
                    <p className="text-gray-500">לא נמצאו נתוני מחירים</p>
                  </div>
                )}

                {showOptimization && optimizations.length > 0 && (
                  <div className="space-y-3">
                    {optimizations.slice(0, 5).map((opt, index) => (
                      <div
                        key={opt.retailer.id}
                        className={`p-3 rounded-lg border-2 ${
                          index === 0 
                            ? 'border-green-300 bg-green-50' 
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-gray-900">
                            {opt.retailer.name}
                          </div>
                          {index === 0 && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              הכי זול
                            </span>
                          )}
                        </div>

                        <div className="text-lg font-bold text-gray-900 mb-1">
                          {formatPrice(Math.round(opt.totalCost * 100))}
                        </div>

                        {opt.estimatedSavings > 0 && (
                          <div className="text-sm text-green-600">
                            חסכון: {formatPrice(Math.round(opt.estimatedSavings * 100))}
                          </div>
                        )}

                        <div className="text-xs text-gray-500 mt-1">
                          {opt.items.length} פריטים זמינים
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            {currentList && (
              <div className="mt-4 bg-white rounded-lg shadow-sm border">
                <div className="p-4">
                  <h4 className="text-md font-semibold mb-3">פעולות מהירות</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => {/* TODO: Navigate to main matrix */}}
                      className="w-full text-right p-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      🥩 הוסף מהמטריצה הראשית
                    </button>
                    <button
                      onClick={() => setShowOptimization(!showOptimization)}
                      className="w-full text-right p-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      📊 {showOptimization ? 'הסתר' : 'הצג'} אופטימיזציה
                    </button>
                    <button
                      onClick={() => deleteList(currentList.id)}
                      className="w-full text-right p-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      🗑️ מחק רשימה
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}