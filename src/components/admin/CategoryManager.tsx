'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Edit, Eye, EyeOff } from 'lucide-react'
import type { MeatCategory, MeatSubCategory } from '@/lib/database.types'

interface CategoryWithSubs extends MeatCategory {
  sub_categories: MeatSubCategory[]
}

export default function CategoryManager() {
  const [categories, setCategories] = useState<CategoryWithSubs[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  // Future: Add editing functionality
  // const [editingCategory, setEditingCategory] = useState<MeatCategory | null>(null)
  // const [editingSubCategory, setEditingSubCategory] = useState<MeatSubCategory | null>(null)

  const fetchCategories = async () => {
    try {
      setLoading(true)
      
      // Fetch categories with their sub-categories
      const { data: cats, error: catsError } = await supabase
        .from('meat_categories')
        .select('*')
        .order('display_order')

      if (catsError) throw catsError

      const categoriesWithSubs: CategoryWithSubs[] = []
      
      for (const cat of cats) {
        const { data: subs, error: subsError } = await supabase
          .from('meat_sub_categories')
          .select('*')
          .eq('category_id', cat.id)
          .order('display_order')

        if (subsError) throw subsError

        categoriesWithSubs.push({
          ...cat,
          sub_categories: subs || []
        })
      }

      setCategories(categoriesWithSubs)
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleAddCategory = async (formData: FormData) => {
    try {
      const { error } = await supabase
        .from('meat_categories')
        .insert({
          name_hebrew: formData.get('name_hebrew') as string,
          name_english: formData.get('name_english') as string,
          display_order: parseInt(formData.get('display_order') as string)
        })

      if (error) throw error

      setShowAddForm(false)
      fetchCategories()
    } catch (error) {
      console.error('Error adding category:', error)
    }
  }

  const handleAddSubCategory = async (categoryId: string, formData: FormData) => {
    try {
      const { error } = await supabase
        .from('meat_sub_categories')
        .insert({
          category_id: categoryId,
          name_hebrew: formData.get('name_hebrew') as string,
          name_english: formData.get('name_english') as string,
          icon: formData.get('icon') as string || null,
          display_order: parseInt(formData.get('display_order') as string)
        })

      if (error) throw error

      fetchCategories()
    } catch (error) {
      console.error('Error adding sub-category:', error)
    }
  }

  const toggleCategoryActive = async (category: MeatCategory) => {
    try {
      const { error } = await supabase
        .from('meat_categories')
        .update({ is_active: !category.is_active })
        .eq('id', category.id)

      if (error) throw error

      fetchCategories()
    } catch (error) {
      console.error('Error toggling category:', error)
    }
  }

  const toggleSubCategoryActive = async (subCategory: MeatSubCategory) => {
    try {
      const { error } = await supabase
        .from('meat_sub_categories')
        .update({ is_active: !subCategory.is_active })
        .eq('id', subCategory.id)

      if (error) throw error

      fetchCategories()
    } catch (error) {
      console.error('Error toggling sub-category:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="mr-4 text-gray-600 text-lg">טוען קטגוריות...</span>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ניהול קטגוריות</h1>
          <p className="text-gray-600">ניהול קטגוריות עיקריות ותת-קטגוריות</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 ml-2" />
          הוסף קטגוריה
        </button>
      </div>

      {/* Add Category Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">הוסף קטגוריה חדשה</h3>
          <form onSubmit={(e) => {
            e.preventDefault()
            handleAddCategory(new FormData(e.currentTarget))
          }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  שם בעברית
                </label>
                <input
                  type="text"
                  name="name_hebrew"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  שם באנגלית
                </label>
                <input
                  type="text"
                  name="name_english"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  סדר תצוגה
                </label>
                <input
                  type="number"
                  name="display_order"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 rtl:space-x-reverse">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                ביטול
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                הוסף
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      <div className="space-y-6">
        {categories.map((category) => (
          <div key={category.id} className="bg-white rounded-lg shadow">
            {/* Category Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {category.name_hebrew}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {category.name_english} • סדר: {category.display_order}
                  </p>
                </div>
                <div className="flex items-center space-x-1 rtl:space-x-reverse">
                  {category.is_active ? (
                    <span className="flex items-center text-green-600 text-sm">
                      <Eye className="w-4 h-4 ml-1" />
                      פעיל
                    </span>
                  ) : (
                    <span className="flex items-center text-gray-400 text-sm">
                      <EyeOff className="w-4 h-4 ml-1" />
                      לא פעיל
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <button
                  onClick={() => toggleCategoryActive(category)}
                  className={`p-2 rounded-md ${
                    category.is_active
                      ? 'text-gray-600 hover:bg-gray-100'
                      : 'text-green-600 hover:bg-green-50'
                  }`}
                >
                  {category.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement editing functionality
                    console.log('Edit category:', category.name_hebrew)
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sub-Categories */}
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-medium text-gray-700">
                  תת-קטגוריות ({category.sub_categories.length})
                </h4>
                <button
                  onClick={() => {
                    const form = document.createElement('form')
                    form.innerHTML = `
                      <div class="grid grid-cols-2 gap-4 mb-4">
                        <input type="text" name="name_hebrew" placeholder="שם בעברית" required class="px-3 py-2 border rounded-md" />
                        <input type="text" name="name_english" placeholder="שם באנגלית" required class="px-3 py-2 border rounded-md" />
                        <input type="text" name="icon" placeholder="אייקון (אופציונלי)" class="px-3 py-2 border rounded-md" />
                        <input type="number" name="display_order" placeholder="סדר תצוגה" required class="px-3 py-2 border rounded-md" />
                      </div>
                      <div class="flex justify-end space-x-2">
                        <button type="button" onclick="this.closest('.fixed').remove()" class="px-4 py-2 text-gray-600 border border-gray-300 rounded-md">ביטול</button>
                        <button type="submit" class="px-4 py-2 bg-green-600 text-white rounded-md">הוסף</button>
                      </div>
                    `
                    
                    const modal = document.createElement('div')
                    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
                    modal.innerHTML = `
                      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4" dir="rtl">
                        <h3 class="text-lg font-medium mb-4">הוסף תת-קטגוריה</h3>
                        ${form.innerHTML}
                      </div>
                    `
                    
                    modal.querySelector('form')?.addEventListener('submit', (e) => {
                      e.preventDefault()
                      handleAddSubCategory(category.id, new FormData(e.currentTarget as HTMLFormElement))
                      modal.remove()
                    })
                    
                    document.body.appendChild(modal)
                  }}
                  className="text-sm px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  הוסף תת-קטגוריה
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {category.sub_categories.map((subCategory) => (
                  <div
                    key={subCategory.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      {subCategory.icon && (
                        <span className="text-lg">{subCategory.icon}</span>
                      )}
                      <div>
                        <h5 className="text-sm font-medium text-gray-900">
                          {subCategory.name_hebrew}
                        </h5>
                        <p className="text-xs text-gray-500">
                          {subCategory.name_english}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <button
                        onClick={() => toggleSubCategoryActive(subCategory)}
                        className={`p-1 rounded ${
                          subCategory.is_active
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-gray-400 hover:bg-gray-50'
                        }`}
                      >
                        {subCategory.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => {
                          // TODO: Implement sub-category editing
                          console.log('Edit sub-category:', subCategory.name_hebrew)
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}