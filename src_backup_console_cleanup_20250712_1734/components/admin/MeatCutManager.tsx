'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Link2, Edit, Eye, EyeOff, Search } from 'lucide-react'
import type { MeatCut, MeatCategory, MeatSubCategory } from '@/lib/database.types'

interface MeatCutWithDetails extends MeatCut {
  category_name: string
  sub_category_name: string | null
}

export default function MeatCutManager() {
  const [meatCuts, setMeatCuts] = useState<MeatCutWithDetails[]>([])
  const [categories, setCategories] = useState<MeatCategory[]>([])
  const [subCategories, setSubCategories] = useState<MeatSubCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [linkingCut, setLinkingCut] = useState<MeatCut | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch categories
      const { data: cats, error: catsError } = await supabase
        .from('meat_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order')

      if (catsError) throw catsError

      // Fetch sub-categories
      const { data: subs, error: subsError } = await supabase
        .from('meat_sub_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order')

      if (subsError) throw subsError

      // Fetch meat cuts with category info
      const { data: cuts, error: cutsError } = await supabase
        .from('meat_cuts')
        .select(`
          *,
          meat_categories!inner(name_hebrew),
          meat_sub_categories(name_hebrew)
        `)
        .order('display_order')

      if (cutsError) throw cutsError

      const cutsWithDetails: MeatCutWithDetails[] = cuts.map(cut => {
        const cutWithRefs = cut as MeatCut & {
          meat_categories: { name_hebrew: string }
          meat_sub_categories?: { name_hebrew: string }
        }
        return {
          ...cut,
          category_name: cutWithRefs.meat_categories.name_hebrew,
          sub_category_name: cutWithRefs.meat_sub_categories?.name_hebrew || null
        }
      })

      setCategories(cats)
      setSubCategories(subs)
      setMeatCuts(cutsWithDetails)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleLinkToSubCategory = async (cutId: string, subCategoryId: string) => {
    try {
      const { error } = await supabase
        .from('meat_cuts')
        .update({ sub_category_id: subCategoryId })
        .eq('id', cutId)

      if (error) throw error

      setShowLinkForm(false)
      setLinkingCut(null)
      fetchData()
    } catch (error) {
      console.error('Error linking cut to sub-category:', error)
    }
  }

  const toggleCutActive = async (cut: MeatCut) => {
    try {
      const { error } = await supabase
        .from('meat_cuts')
        .update({ is_active: !cut.is_active })
        .eq('id', cut.id)

      if (error) throw error

      fetchData()
    } catch (error) {
      console.error('Error toggling cut:', error)
    }
  }

  // Filter cuts based on selections and search
  const filteredCuts = meatCuts.filter(cut => {
    const matchesCategory = !selectedCategory || cut.category_id === selectedCategory
    const matchesSubCategory = !selectedSubCategory || cut.sub_category_id === selectedSubCategory
    const matchesSearch = !searchTerm || 
      cut.name_hebrew.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cut.name_english && cut.name_english.toLowerCase().includes(searchTerm.toLowerCase()))
    
    return matchesCategory && matchesSubCategory && matchesSearch
  })

  // Get sub-categories for selected category
  const availableSubCategories = selectedCategory 
    ? subCategories.filter(sub => sub.category_id === selectedCategory)
    : subCategories

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="mr-4 text-gray-600 text-lg">טוען נתחי בשר...</span>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ניהול נתחי בשר</h1>
        <p className="text-gray-600">קישור נתחים לתת-קטגוריות וניהול מאפיינים</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              חיפוש
            </label>
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="חפש נתח..."
                className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              קטגוריה
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value)
                setSelectedSubCategory('')
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">כל הקטגוריות</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name_hebrew}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              תת-קטגוריה
            </label>
            <select
              value={selectedSubCategory}
              onChange={(e) => setSelectedSubCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">כל התת-קטגוריות</option>
              {availableSubCategories.map(sub => (
                <option key={sub.id} value={sub.id}>
                  {sub.icon} {sub.name_hebrew}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedCategory('')
                setSelectedSubCategory('')
                setSearchTerm('')
              }}
              className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              נקה מסננים
            </button>
          </div>
        </div>
      </div>

      {/* Results Stats */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          מציג {filteredCuts.length} נתחים מתוך {meatCuts.length}
        </p>
      </div>

      {/* Meat Cuts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCuts.map((cut) => (
          <div key={cut.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  {cut.name_hebrew}
                </h3>
                {cut.name_english && (
                  <p className="text-sm text-gray-500 mb-2">{cut.name_english}</p>
                )}
                <div className="text-sm text-gray-600">
                  <p>קטגוריה: {cut.category_name}</p>
                  <p>תת-קטגוריה: {cut.sub_category_name || 'לא מקושר'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-1 rtl:space-x-reverse">
                {cut.is_active ? (
                  <span className="text-green-600">
                    <Eye className="w-4 h-4" />
                  </span>
                ) : (
                  <span className="text-gray-400">
                    <EyeOff className="w-4 h-4" />
                  </span>
                )}
              </div>
            </div>

            {/* Price Range */}
            {(cut.typical_price_range_min || cut.typical_price_range_max) && (
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600">טווח מחירים:</p>
                <p className="text-sm font-medium">
                  ₪{((cut.typical_price_range_min || 0) / 100).toFixed(2)} - 
                  ₪{((cut.typical_price_range_max || 0) / 100).toFixed(2)}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center">
              <div className="flex space-x-2 rtl:space-x-reverse">
                <button
                  onClick={() => {
                    setLinkingCut(cut)
                    setShowLinkForm(true)
                  }}
                  className="flex items-center px-3 py-1 text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 text-sm"
                >
                  <Link2 className="w-4 h-4 ml-1" />
                  קשר
                </button>
                <button
                  onClick={() => toggleCutActive(cut)}
                  className={`px-3 py-1 text-sm rounded-md ${
                    cut.is_active
                      ? 'text-gray-600 border border-gray-300 hover:bg-gray-50'
                      : 'text-green-600 border border-green-300 hover:bg-green-50'
                  }`}
                >
                  {cut.is_active ? 'השבת' : 'הפעל'}
                </button>
              </div>
              <button className="p-1 text-gray-400 hover:text-gray-600">
                <Edit className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Link to Sub-Category Modal */}
      {showLinkForm && linkingCut && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" dir="rtl">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              קשר נתח לתת-קטגוריה
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              נתח: <strong>{linkingCut.name_hebrew}</strong>
            </p>
            
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const subCategoryId = formData.get('sub_category_id') as string
              if (subCategoryId) {
                handleLinkToSubCategory(linkingCut.id, subCategoryId)
              }
            }}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  בחר תת-קטגוריה
                </label>
                <select
                  name="sub_category_id"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">בחר תת-קטגוריה...</option>
                  {subCategories
                    .filter(sub => sub.category_id === linkingCut.category_id)
                    .map(sub => (
                      <option key={sub.id} value={sub.id}>
                        {sub.icon} {sub.name_hebrew}
                      </option>
                    ))}
                </select>
              </div>
              
              <div className="flex justify-end space-x-2 rtl:space-x-reverse">
                <button
                  type="button"
                  onClick={() => {
                    setShowLinkForm(false)
                    setLinkingCut(null)
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  קשר
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}