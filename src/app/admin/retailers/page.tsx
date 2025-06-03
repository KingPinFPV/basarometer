'use client'

import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { createClient } from '@/lib/supabase'
import { Database } from '@/lib/database.types'
import { Shield, Store, Plus, Edit, Trash2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

type Retailer = Database['public']['Tables']['retailers']['Row']

export default function RetailersManagement() {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()
  const [retailers, setRetailers] = useState<Retailer[]>([])
  const [loadingRetailers, setLoadingRetailers] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    if (!loading) {
      if (!user || !isAdmin) {
        router.push('/')
        return
      }
      loadRetailers()
    }
  }, [user, isAdmin, loading, router])
  
  const loadRetailers = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('retailers')
        .select('*')
        .order('name')
      
      if (error) throw error
      setRetailers(data || [])
    } catch (err) {
      console.error('Error loading retailers:', err)
      setError('שגיאה בטעינת הקמעונאים')
    } finally {
      setLoadingRetailers(false)
    }
  }
  
  const deleteRetailer = async (id: number, name: string) => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את "${name}"?`)) {
      return
    }
    
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('retailers')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      setRetailers(retailers.filter(r => r.id !== id))
    } catch (err) {
      console.error('Error deleting retailer:', err)
      alert('שגיאה במחיקת הקמעונאי')
    }
  }
  
  if (loading || loadingRetailers) {
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
            <span>ניהול קמעונאים</span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Shield className="text-amber-600" size={28} />
              <Store className="text-blue-600" size={28} />
              <h1 className="text-2xl font-bold text-gray-900">ניהול קמעונאים</h1>
            </div>
            <Link
              href="/admin/retailers/new"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              הוסף קמעונאי
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
              רשימת קמעונאים ({retailers.length})
            </h2>
          </div>
          
          {retailers.length === 0 ? (
            <div className="text-center py-12">
              <Store size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">אין קמעונאים במערכת</p>
              <Link
                href="/admin/retailers/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
                הוסף קמעונאי ראשון
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      שם
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      סוג
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      עיר
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
                  {retailers.map((retailer) => (
                    <tr key={retailer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {retailer.logo_url && (
                            <img
                              src={retailer.logo_url}
                              alt={retailer.name}
                              className="h-8 w-8 rounded-full ml-3"
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {retailer.name}
                            </div>
                            {retailer.website && (
                              <div className="text-sm text-gray-500">
                                <a
                                  href={retailer.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  {retailer.website}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {retailer.type === 'supermarket' && 'סופרמרקט'}
                          {retailer.type === 'butcher' && 'קצביה'}
                          {retailer.type === 'online' && 'אונליין'}
                          {retailer.type === 'wholesale' && 'סיטונאי'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {retailer.city || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          retailer.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {retailer.is_active ? 'פעיל' : 'לא פעיל'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/retailers/${retailer.id}/edit`}
                            className="text-blue-600 hover:text-blue-700 p-1 rounded"
                          >
                            <Edit size={16} />
                          </Link>
                          <button
                            onClick={() => deleteRetailer(retailer.id, retailer.name)}
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