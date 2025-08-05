'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useUINotifications } from '@/hooks/useUINotifications'
import { ToastContainer } from '@/components/ui/Toast'
import { Plus, Trash2, Upload } from 'lucide-react'
import type { MeatCategory, MeatSubCategory } from '@/lib/database.types'

interface BulkCutData {
  name_hebrew: string
  name_english: string
  category_id: string
  sub_category_id: string
  typical_price_range_min: string
  typical_price_range_max: string
  is_popular: boolean
  description: string
}

export default function BulkCutCreator() {
  const { showError, showSuccess, toasts, removeToast } = useUINotifications()
  const [categories, setCategories] = useState<MeatCategory[]>([])
  const [subCategories, setSubCategories] = useState<MeatSubCategory[]>([])
  const [cuts, setCuts] = useState<BulkCutData[]>([{
    name_hebrew: '',
    name_english: '',
    category_id: '',
    sub_category_id: '',
    typical_price_range_min: '',
    typical_price_range_max: '',
    is_popular: false,
    description: ''
  }])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [successCount, setSuccessCount] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        const [categoriesResult, subCategoriesResult] = await Promise.all([
          supabase.from('meat_categories').select('*').eq('is_active', true).order('display_order'),
          supabase.from('meat_sub_categories').select('*').eq('is_active', true).order('display_order')
        ])

        if (categoriesResult.error) throw categoriesResult.error
        if (subCategoriesResult.error) throw subCategoriesResult.error

        setCategories(categoriesResult.data || [])
        setSubCategories(subCategoriesResult.data || [])
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const addNewCut = () => {
    setCuts([...cuts, {
      name_hebrew: '',
      name_english: '',
      category_id: '',
      sub_category_id: '',
      typical_price_range_min: '',
      typical_price_range_max: '',
      is_popular: false,
      description: ''
    }])
  }

  const removeCut = (index: number) => {
    setCuts(cuts.filter((_, i) => i !== index))
  }

  const updateCut = (index: number, field: keyof BulkCutData, value: string | boolean) => {
    const updatedCuts = [...cuts]
    updatedCuts[index] = { ...updatedCuts[index], [field]: value }
    setCuts(updatedCuts)
  }

  const getAvailableSubCategories = (categoryId: string) => {
    return subCategories.filter(sub => sub.category_id === categoryId)
  }

  const validateCut = (cut: BulkCutData): boolean => {
    return !!(cut.name_hebrew && cut.category_id && cut.sub_category_id)
  }

  const submitBulkCuts = async () => {
    try {
      setSubmitting(true)
      setSuccessCount(0)

      const validCuts = cuts.filter(validateCut)
      if (validCuts.length === 0) {
        showError('אין נתחים תקינים לשמירה')
        return
      }

      const cutsToInsert = validCuts.map(cut => ({
        name_hebrew: cut.name_hebrew,
        name_english: cut.name_english || null,
        category_id: cut.category_id,
        sub_category_id: cut.sub_category_id,
        typical_price_range_min: cut.typical_price_range_min ? parseInt(cut.typical_price_range_min) * 100 : null,
        typical_price_range_max: cut.typical_price_range_max ? parseInt(cut.typical_price_range_max) * 100 : null,
        is_popular: cut.is_popular,
        description: cut.description || null,
        is_active: true
      }))

      const { data, error } = await supabase
        .from('meat_cuts')
        .insert(cutsToInsert)
        .select()

      if (error) throw error

      setSuccessCount(data.length)
      
      // Reset form
      setCuts([{
        name_hebrew: '',
        name_english: '',
        category_id: '',
        sub_category_id: '',
        typical_price_range_min: '',
        typical_price_range_max: '',
        is_popular: false,
        description: ''
      }])

      showSuccess(`נוספו בהצלחה ${data.length} נתחי בשר!`, 'הוספה הושלמה')
    } catch (error) {
      console.error('Error creating bulk cuts:', error)
      showError('שגיאה בהוספת הנתחים')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="mr-4 text-gray-600 text-lg">טוען נתונים...</span>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">הוספה בכמויות - נתחי בשר</h1>
        <p className="text-gray-600">הוסף מספר נתחי בשר בו-זמנית עם קטגוריזציה</p>
        {successCount > 0 && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">נוספו בהצלחה {successCount} נתחי בשר!</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={addNewCut}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 ml-2" />
          הוסף נתח
        </button>
        
        <div className="flex space-x-4 rtl:space-x-reverse">
          <span className="text-sm text-gray-600">
            {cuts.filter(validateCut).length} מתוך {cuts.length} נתחים תקינים
          </span>
          <button
            onClick={submitBulkCuts}
            disabled={submitting || cuts.filter(validateCut).length === 0}
            className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
          >
            <Upload className="w-5 h-5 ml-2" />
            {submitting ? 'שומר...' : 'שמור הכל'}
          </button>
        </div>
      </div>

      {/* Cuts Form */}
      <div className="space-y-6">
        {cuts.map((cut, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">נתח #{index + 1}</h3>
              {cuts.length > 1 && (
                <button
                  onClick={() => removeCut(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Hebrew Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  שם בעברית *
                </label>
                <input
                  type="text"
                  value={cut.name_hebrew}
                  onChange={(e) => updateCut(index, 'name_hebrew', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="אנטריקוט, פילה, חזה..."
                />
              </div>

              {/* English Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  שם באנגלית
                </label>
                <input
                  type="text"
                  value={cut.name_english}
                  onChange={(e) => updateCut(index, 'name_english', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Entrecote, Filet, Breast..."
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  קטגוריה *
                </label>
                <select
                  value={cut.category_id}
                  onChange={(e) => {
                    updateCut(index, 'category_id', e.target.value)
                    updateCut(index, 'sub_category_id', '') // Reset sub-category
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">בחר קטגוריה...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name_hebrew}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sub-Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  תת-קטגוריה *
                </label>
                <select
                  value={cut.sub_category_id}
                  onChange={(e) => updateCut(index, 'sub_category_id', e.target.value)}
                  disabled={!cut.category_id}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">בחר תת-קטגוריה...</option>
                  {getAvailableSubCategories(cut.category_id).map(sub => (
                    <option key={sub.id} value={sub.id}>
                      {sub.icon} {sub.name_hebrew}
                    </option>
                  ))}
                </select>
              </div>

              {/* Min Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  מחיר מינימלי (₪)
                </label>
                <input
                  type="number"
                  value={cut.typical_price_range_min}
                  onChange={(e) => updateCut(index, 'typical_price_range_min', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="50"
                />
              </div>

              {/* Max Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  מחיר מקסימלי (₪)
                </label>
                <input
                  type="number"
                  value={cut.typical_price_range_max}
                  onChange={(e) => updateCut(index, 'typical_price_range_max', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="120"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  תיאור
                </label>
                <input
                  type="text"
                  value={cut.description}
                  onChange={(e) => updateCut(index, 'description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="תיאור קצר של הנתח..."
                />
              </div>

              {/* Popular */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`popular-${index}`}
                  checked={cut.is_popular}
                  onChange={(e) => updateCut(index, 'is_popular', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor={`popular-${index}`} className="mr-2 block text-sm text-gray-900">
                  נתח פופולרי
                </label>
              </div>
            </div>

            {/* Validation Status */}
            <div className="mt-4 flex items-center">
              {validateCut(cut) ? (
                <span className="text-green-600 text-sm">✓ נתח תקין</span>
              ) : (
                <span className="text-red-600 text-sm">✗ נדרשים שם בעברית, קטגוריה ותת-קטגוריה</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  )
}