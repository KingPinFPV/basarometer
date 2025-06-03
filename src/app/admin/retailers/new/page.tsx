'use client'

import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { createClient } from '@/lib/supabase'
import { Shield, Store, Save, ArrowRight, Globe, MapPin, Phone } from 'lucide-react'
import Link from 'next/link'

export default function NewRetailer() {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    type: 'supermarket' as 'supermarket' | 'butcher' | 'online' | 'wholesale',
    address: '',
    city: '',
    region: '',
    phone: '',
    email: '',
    website: '',
    logo_url: '',
    chain_id: '',
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
    }
  }, [user, isAdmin, loading, router])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    
    try {
      if (!formData.name.trim()) {
        setError('שם הקמעונאי הוא שדה חובה')
        setSubmitting(false)
        return
      }
      
      const supabase = createClient()
      const { error: insertError } = await supabase
        .from('retailers')
        .insert({
          name: formData.name.trim(),
          type: formData.type,
          address: formData.address.trim() || null,
          city: formData.city.trim() || null,
          region: formData.region.trim() || null,
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          website: formData.website.trim() || null,
          logo_url: formData.logo_url.trim() || null,
          chain_id: formData.chain_id.trim() || null,
          is_active: formData.is_active
        })
      
      if (insertError) throw insertError
      
      router.push('/admin/retailers')
    } catch (err) {
      console.error('Error creating retailer:', err)
      setError('שגיאה ביצירת הקמעונאי. אנא נסה שוב.')
    } finally {
      setSubmitting(false)
    }
  }
  
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
            <Link href="/admin/retailers" className="hover:text-blue-600">ניהול קמעונאים</Link>
            <ArrowRight size={16} />
            <span>קמעונאי חדש</span>
          </div>
          
          <div className="flex items-center gap-3">
            <Shield className="text-amber-600" size={28} />
            <Store className="text-blue-600" size={28} />
            <h1 className="text-2xl font-bold text-gray-900">הוסף קמעונאי חדש</h1>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">פרטי הקמעונאי</h2>
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
                  שם הקמעונאי *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="שם החנות או הקמעונאי"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  סוג הקמעונאי *
                </label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as 'supermarket' | 'butcher' | 'online' | 'wholesale'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="supermarket">סופרמרקט</option>
                  <option value="butcher">קצביה</option>
                  <option value="online">חנות אונליין</option>
                  <option value="wholesale">סיטונאי</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <MapPin size={16} />
                  עיר
                </label>
                <input
                  type="text"
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="תל אביב, ירושלים, חיפה..."
                />
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  כתובת
                </label>
                <input
                  type="text"
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="כתובת מלאה של החנות"
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Phone size={16} />
                  טלפון
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="03-1234567"
                  dir="ltr"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  אימייל
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="info@store.com"
                  dir="ltr"
                />
              </div>
              
              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Globe size={16} />
                  אתר אינטרנט
                </label>
                <input
                  type="url"
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://www.store.com"
                  dir="ltr"
                />
              </div>
              
              <div>
                <label htmlFor="logo_url" className="block text-sm font-medium text-gray-700 mb-1">
                  לוגו (URL)
                </label>
                <input
                  type="url"
                  id="logo_url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/logo.png"
                  dir="ltr"
                />
              </div>
              
              <div>
                <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
                  אזור
                </label>
                <input
                  type="text"
                  id="region"
                  value={formData.region}
                  onChange={(e) => setFormData({...formData, region: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="מרכז, צפון, דרום..."
                />
              </div>
              
              <div>
                <label htmlFor="chain_id" className="block text-sm font-medium text-gray-700 mb-1">
                  זיהוי רשת
                </label>
                <input
                  type="text"
                  id="chain_id"
                  value={formData.chain_id}
                  onChange={(e) => setFormData({...formData, chain_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="רמי לוי, שופרסל, וכד'"
                />
              </div>
              
              <div className="md:col-span-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                    הקמעונאי פעיל במערכת
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={20} />
                {submitting ? 'שומר...' : 'שמור קמעונאי'}
              </button>
              <Link
                href="/admin/retailers"
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