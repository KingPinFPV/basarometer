'use client'

import { useState, useEffect } from 'react'
import { Store, Plus, Edit2, Trash2, Save, X, MapPin, Globe, Phone } from 'lucide-react'

interface Retailer {
  id: number
  name: string
  name_he: string
  chain_name?: string
  website?: string
  phone?: string
  address?: string
  city: string
  is_active: boolean
  created_at: string
  store_count?: number
}

export default function RetailersPage() {
  const [retailers, setRetailers] = useState<Retailer[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    name_he: '',
    chain_name: '',
    website: '',
    phone: '',
    address: '',
    city: ''
  })

  useEffect(() => {
    // Mock data for now - replace with actual API call
    const mockRetailers: Retailer[] = [
      {
        id: 1,
        name: 'shufersal',
        name_he: 'שופרסל',
        chain_name: 'שופרסל',
        website: 'https://www.shufersal.co.il',
        phone: '03-9444444',
        address: 'רחוב הרצל 123',
        city: 'תל אביב',
        is_active: true,
        created_at: new Date().toISOString(),
        store_count: 450
      },
      {
        id: 2,
        name: 'rami_levy',
        name_he: 'רמי לוי',
        chain_name: 'רמי לוי השקעות',
        website: 'https://www.rami-levy.co.il',
        phone: '02-6789999',
        address: 'שדרות יצחק רבין 45',
        city: 'ירושלים',
        is_active: true,
        created_at: new Date().toISOString(),
        store_count: 180
      },
      {
        id: 3,
        name: 'victory',
        name_he: 'ויקטורי',
        chain_name: 'ויקטורי מרכזי קניות',
        website: 'https://www.victory.co.il',
        phone: '04-8555555',
        address: 'רחוב הכרמל 89',
        city: 'חיפה',
        is_active: true,
        created_at: new Date().toISOString(),
        store_count: 75
      },
      {
        id: 4,
        name: 'mega',
        name_he: 'מגא',
        chain_name: 'מגה בעמ',
        website: 'https://www.mega.co.il',
        phone: '08-9333333',
        address: 'שדרות בן גוריון 12',
        city: 'באר שבע',
        is_active: true,
        created_at: new Date().toISOString(),
        store_count: 95
      },
      {
        id: 5,
        name: 'yohananof',
        name_he: 'יוחננוף',
        chain_name: 'יוחננוף חברה לשיווק קמעוני',
        website: 'https://www.yohananof.co.il',
        phone: '09-7444444',
        address: 'רחוב הרב קוק 67',
        city: 'פתח תקוה',
        is_active: true,
        created_at: new Date().toISOString(),
        store_count: 120
      }
    ]
    
    setTimeout(() => {
      setRetailers(mockRetailers)
      setLoading(false)
    }, 500)
  }, [])

  const handleSave = () => {
    if (editingId) {
      // Update existing
      setRetailers(retailers.map(retailer => 
        retailer.id === editingId 
          ? { ...retailer, ...formData }
          : retailer
      ))
      setEditingId(null)
    } else {
      // Add new
      const newRetailer: Retailer = {
        id: Date.now(),
        ...formData,
        is_active: true,
        created_at: new Date().toISOString(),
        store_count: 0
      }
      setRetailers([...retailers, newRetailer])
      setIsAdding(false)
    }
    setFormData({
      name: '',
      name_he: '',
      chain_name: '',
      website: '',
      phone: '',
      address: '',
      city: ''
    })
  }

  const handleEdit = (retailer: Retailer) => {
    setEditingId(retailer.id)
    setFormData({
      name: retailer.name,
      name_he: retailer.name_he,
      chain_name: retailer.chain_name || '',
      website: retailer.website || '',
      phone: retailer.phone || '',
      address: retailer.address || '',
      city: retailer.city
    })
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
    setFormData({
      name: '',
      name_he: '',
      chain_name: '',
      website: '',
      phone: '',
      address: '',
      city: ''
    })
  }

  const handleDelete = (id: number) => {
    if (confirm('האם אתה בטוח שברצונך למחוק קמעונאי זה?')) {
      setRetailers(retailers.filter(retailer => retailer.id !== id))
    }
  }

  const toggleActive = (id: number) => {
    setRetailers(retailers.map(retailer => 
      retailer.id === id 
        ? { ...retailer, is_active: !retailer.is_active }
        : retailer
    ))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="mr-4 text-gray-600 text-lg">טוען קמעונאים...</span>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ניהול קמעונאים
        </h1>
        <p className="text-gray-600">
          הוספה ועריכה של רשתות קמעונות וחנויות בודדות
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Store className="h-8 w-8 text-blue-600" />
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-500">רשתות פעילות</p>
              <p className="text-2xl font-bold text-gray-900">
                {retailers.filter(r => r.is_active).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <MapPin className="h-8 w-8 text-green-600" />
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-500">סה&quot;כ חנויות</p>
              <p className="text-2xl font-bold text-gray-900">
                {retailers.reduce((sum, r) => sum + (r.store_count || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Globe className="h-8 w-8 text-purple-600" />
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-500">ערים מכוסות</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(retailers.map(r => r.city)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Button */}
      <div className="mb-6">
        <button
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5 ml-2" />
          הוסף קמעונאי חדש
        </button>
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingId ? 'עריכת קמעונאי' : 'הוספת קמעונאי חדש'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                שם באנגלית *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="shufersal, rami_levy"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                שם בעברית *
              </label>
              <input
                type="text"
                value={formData.name_he}
                onChange={(e) => setFormData({ ...formData, name_he: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="שופרסל, רמי לוי"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                שם הרשת המלא
              </label>
              <input
                type="text"
                value={formData.chain_name}
                onChange={(e) => setFormData({ ...formData, chain_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="שופרסל בע״מ"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                עיר *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="תל אביב"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                כתובת
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="רחוב הרצל 123"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                טלפון
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="03-1234567"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                אתר אינטרנט
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://www.shufersal.co.il"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 rtl:space-x-reverse mt-6">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="h-4 w-4 ml-1 inline" />
              ביטול
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={!formData.name || !formData.name_he || !formData.city}
            >
              <Save className="h-4 w-4 ml-1 inline" />
              שמור
            </button>
          </div>
        </div>
      )}

      {/* Retailers Table */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <Store className="h-5 w-5 ml-2" />
            רשימת קמעונאים ({retailers.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  שם הרשת
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  מיקום
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  פרטי קשר
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  חנויות
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  סטטוס
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  פעולות
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {retailers.map((retailer) => (
                <tr key={retailer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Store className="h-8 w-8 text-blue-500 ml-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {retailer.name_he}
                        </div>
                        <div className="text-sm text-gray-500 font-mono">
                          {retailer.name}
                        </div>
                        {retailer.chain_name && (
                          <div className="text-xs text-gray-400">
                            {retailer.chain_name}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 flex items-center">
                      <MapPin className="h-4 w-4 ml-1 text-gray-400" />
                      {retailer.city}
                    </div>
                    {retailer.address && (
                      <div className="text-xs text-gray-500 mt-1">
                        {retailer.address}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {retailer.phone && (
                        <div className="text-sm text-gray-600 flex items-center">
                          <Phone className="h-3 w-3 ml-1" />
                          {retailer.phone}
                        </div>
                      )}
                      {retailer.website && (
                        <div className="text-sm">
                          <a 
                            href={retailer.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 flex items-center"
                          >
                            <Globe className="h-3 w-3 ml-1" />
                            אתר
                          </a>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {retailer.store_count || 0}
                    </div>
                    <div className="text-xs text-gray-500">
                      חנויות
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleActive(retailer.id)}
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer transition-colors ${
                        retailer.is_active 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {retailer.is_active ? 'פעיל' : 'לא פעיל'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <button
                        onClick={() => handleEdit(retailer)}
                        className="text-blue-600 hover:text-blue-800"
                        title="ערוך"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(retailer.id)}
                        className="text-red-600 hover:text-red-800"
                        title="מחק"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {retailers.length === 0 && (
        <div className="text-center py-12">
          <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">אין קמעונאים במערכת</p>
          <button
            onClick={() => setIsAdding(true)}
            className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5 ml-2" />
            הוסף קמעונאי ראשון
          </button>
        </div>
      )}
    </div>
  )
}