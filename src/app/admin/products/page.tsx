'use client'

import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { createClient } from '@/lib/supabase'
import { Database } from '@/lib/database.types'
import { Shield, Package, Plus, Edit, Trash2, ArrowRight, Tag } from 'lucide-react'
import Link from 'next/link'

type Product = Database['public']['Tables']['products']['Row'] & {
  cuts?: Database['public']['Tables']['cuts']['Row']
}

export default function ProductsManagement() {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    if (!loading) {
      if (!user || !isAdmin) {
        router.push('/')
        return
      }
      loadProducts()
    }
  }, [user, isAdmin, loading, router])
  
  const loadProducts = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          cuts (
            id,
            name,
            category
          )
        `)
        .order('name')
      
      if (error) throw error
      setProducts(data || [])
    } catch (err) {
      console.error('Error loading products:', err)
      setError('שגיאה בטעינת המוצרים')
    } finally {
      setLoadingProducts(false)
    }
  }
  
  const deleteProduct = async (id: number, name: string) => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את "${name}"?`)) {
      return
    }
    
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      setProducts(products.filter(p => p.id !== id))
    } catch (err) {
      console.error('Error deleting product:', err)
      alert('שגיאה במחיקת המוצר')
    }
  }
  
  if (loading || loadingProducts) {
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/admin" className="hover:text-blue-600">ניהול מערכת</Link>
            <ArrowRight size={16} />
            <span>ניהול מוצרים</span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Shield className="text-amber-600" size={28} />
              <Package className="text-green-600" size={28} />
              <h1 className="text-2xl font-bold text-gray-900">ניהול מוצרים</h1>
            </div>
            <Link
              href="/admin/products/new"
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Plus size={20} />
              הוסף מוצר
            </Link>
          </div>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              רשימת מוצרים ({products.length})
            </h2>
          </div>
          
          {products.length === 0 ? (
            <div className="text-center py-12">
              <Package size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">אין מוצרים במערכת</p>
              <Link
                href="/admin/products/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Plus size={20} />
                הוסף מוצר ראשון
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      מוצר
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      מותג
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      חתך
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      קטגוריה
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      סטטוס
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      פעולות
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {product.image_url && (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="h-8 w-8 rounded-full ml-3 object-cover"
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                            </div>
                            {product.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {product.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.brand || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.cuts ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {product.cuts.name}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.category ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <Tag size={12} className="ml-1" />
                            {product.category}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.is_active ? 'פעיל' : 'לא פעיל'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="text-green-600 hover:text-green-700 p-1 rounded"
                          >
                            <Edit size={16} />
                          </Link>
                          <button
                            onClick={() => deleteProduct(product.id, product.name)}
                            className="text-red-600 hover:text-red-700 p-1 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}