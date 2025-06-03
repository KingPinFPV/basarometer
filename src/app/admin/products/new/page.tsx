'use client'

import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { createClient } from '@/lib/supabase'
import { Database } from '@/lib/database.types'
import { Shield, Package, Save, ArrowRight, Tag, Image } from 'lucide-react'
import Link from 'next/link'

type Cut = Database['public']['Tables']['cuts']['Row']

export default function NewProduct() {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()
  const [cuts, setCuts] = useState<Cut[]>([])
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    cut_id: '',
    description: '',
    image_url: '',
    category: '',
    subcategory: '',
    keywords: '',
    is_active: true
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    if (!loading) {
      if (!user || !isAdmin) {
        router.push('/')
        return
      }
      loadCuts()
    }
  }, [user, isAdmin, loading, router])
  
  const loadCuts = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('cuts')
        .select('*')
        .order('category, name')
      
      if (error) throw error
      setCuts(data || [])
    } catch (err) {
      console.error('Error loading cuts:', err)
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    
    try {
      if (!formData.name.trim()) {
        setError('שם המוצר הוא שדה חובה')
        setSubmitting(false)
        return
      }
      
      const supabase = createClient()
      const { error: insertError } = await supabase
        .from('products')
        .insert({
          name: formData.name.trim(),
          brand: formData.brand.trim() || null,
          cut_id: formData.cut_id ? parseInt(formData.cut_id) : null,
          description: formData.description.trim() || null,
          image_url: formData.image_url.trim() || null,
          category: formData.category.trim() || null,
          subcategory: formData.subcategory.trim() || null,
          keywords: formData.keywords.trim() || null,
          is_active: formData.is_active
        })
      
      if (insertError) throw insertError
      
      router.push('/admin/products')
    } catch (err) {
      console.error('Error creating product:', err)
      setError('שגיאה ביצירת המוצר. אנא נסה שוב.')
    } finally {
      setSubmitting(false)
    }
  }
  
  // Group cuts by category
  const cutsByCategory = cuts.reduce((acc, cut) => {
    if (!acc[cut.category]) {
      acc[cut.category] = []
    }
    acc[cut.category].push(cut)
    return acc
  }, {} as Record<string, Cut[]>)
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
        </div>
      </div>
    )
  }
  
  if (!user || !isAdmin) {
    return null
  }
  
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/admin" className="hover:text-blue-600">ניהול מערכת</Link>
            <ArrowRight size={16} />
            <Link href="/admin/products" className="hover:text-blue-600">ניהול מוצרים</Link>
            <ArrowRight size={16} />
            <span>מוצר חדש</span>
          </div>
          
          <div className="flex items-center gap-3">
            <Shield className="text-amber-600" size={28} />
            <Package className="text-green-600" size={28} />
            <h1 className="text-2xl font-bold text-gray-900">הוסף מוצר חדש</h1>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">פרטי המוצר</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  שם המוצר *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="שם המוצר הספציפי"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
                  מותג
                </label>
                <input
                  type="text"
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({...formData, brand: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="שם המותג"
                />
              </div>
              
              <div>
                <label htmlFor="cut_id" className="block text-sm font-medium text-gray-700 mb-1">
                  חתך בשר
                </label>
                <select
                  id="cut_id"
                  value={formData.cut_id}
                  onChange={(e) => setFormData({...formData, cut_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">בחר חתך בשר</option>
                  {Object.entries(cutsByCategory).map(([category, categoryFcuts]) => (
                    <optgroup key={category} label={category}>
                      {categoryFcuts.map(cut => (
                        <option key={cut.id} value={cut.id}>
                          {cut.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Tag size={16} />
                  קטגוריה
                </label>
                <input
                  type="text"
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="בקר, עוף, כבש, חזיר..."
                />
              </div>
              
              <div>
                <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-1">
                  תת-קטגוריה
                </label>
                <input
                  type="text"
                  id="subcategory"
                  value={formData.subcategory}
                  onChange={(e) => setFormData({...formData, subcategory: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="קטגוריה משנית"
                />
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  תיאור המוצר
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  placeholder="תיאור מפורט של המוצר, מאפייניו והמלצות שימוש"
                />
              </div>
              
              <div>
                <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Image size={16} />
                  תמונה (URL)
                </label>
                <input
                  type="url"
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="https://example.com/product-image.jpg"
                  dir="ltr"
                />
              </div>
              
              <div>
                <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-1">
                  מילות מפתח לחיפוש
                </label>
                <input
                  type="text"
                  id="keywords"
                  value={formData.keywords}
                  onChange={(e) => setFormData({...formData, keywords: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="מילים נוספות לחיפוש, מופרדות בפסיקים"
                />
              </div>
              
              <div className="md:col-span-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="rounded text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                    המוצר פעיל במערכת
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={20} />
                {submitting ? 'שומר...' : 'שמור מוצר'}
              </button>
              <Link
                href="/admin/products"
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                ביטול
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}