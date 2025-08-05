'use client'

import { useState, useEffect } from 'react'
import { Package, Plus, Edit2, Trash2, Save, X } from 'lucide-react'
import { useUINotifications } from '@/hooks/useUINotifications'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ToastContainer } from '@/components/ui/Toast'

interface Attribute {
  id: number
  name: string
  name_he: string
  description?: string
  is_active: boolean
  created_at: string
}

export default function AttributesPage() {
  const { showConfirm, confirmDialog, closeConfirm, toasts, removeToast } = useUINotifications()
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    name_he: '',
    description: ''
  })

  useEffect(() => {
    // Mock data for now - replace with actual API call
    const mockAttributes: Attribute[] = [
      {
        id: 1,
        name: 'fresh',
        name_he: 'טרי',
        description: 'מוצר טרי',
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        name: 'frozen',
        name_he: 'קפוא',
        description: 'מוצר קפוא',
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 3,
        name: 'premium',
        name_he: 'פרימיום',
        description: 'מוצר איכות גבוהה',
        is_active: true,
        created_at: new Date().toISOString()
      }
    ]
    
    setTimeout(() => {
      setAttributes(mockAttributes)
      setLoading(false)
    }, 500)
  }, [])

  const handleSave = () => {
    if (editingId) {
      // Update existing
      setAttributes(attributes.map(attr => 
        attr.id === editingId 
          ? { ...attr, ...formData }
          : attr
      ))
      setEditingId(null)
    } else {
      // Add new
      const newAttribute: Attribute = {
        id: Date.now(),
        ...formData,
        is_active: true,
        created_at: new Date().toISOString()
      }
      setAttributes([...attributes, newAttribute])
      setIsAdding(false)
    }
    setFormData({ name: '', name_he: '', description: '' })
  }

  const handleEdit = (attribute: Attribute) => {
    setEditingId(attribute.id)
    setFormData({
      name: attribute.name,
      name_he: attribute.name_he,
      description: attribute.description || ''
    })
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
    setFormData({ name: '', name_he: '', description: '' })
  }

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm({
      title: 'מחיקת מאפיין',
      message: 'האם אתה בטוח שברצונך למחוק מאפיין זה?',
      confirmText: 'מחק',
      cancelText: 'ביטול',
      variant: 'danger'
    })
    
    if (confirmed) {
      setAttributes(attributes.filter(attr => attr.id !== id))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="mr-4 text-gray-600 text-lg">טוען מאפיינים...</span>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ניהול מאפיינים
        </h1>
        <p className="text-gray-600">
          הגדרת תגיות וקטגוריות למוצרי בשר (טרי/קפוא/פרימיום)
        </p>
      </div>

      {/* Add Button */}
      <div className="mb-6">
        <button
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5 ml-2" />
          הוסף מאפיין חדש
        </button>
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">הוסף מאפיין חדש</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                שם באנגלית
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="fresh, frozen, premium"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                שם בעברית
              </label>
              <input
                type="text"
                value={formData.name_he}
                onChange={(e) => setFormData({ ...formData, name_he: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="טרי, קפוא, פרימיום"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              תיאור
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="תיאור המאפיין..."
            />
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
            >
              <Save className="h-4 w-4 ml-1 inline" />
              שמור
            </button>
          </div>
        </div>
      )}

      {/* Attributes Table */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <Package className="h-5 w-5 ml-2" />
            רשימת מאפיינים
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  שם בעברית
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  שם באנגלית
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  תיאור
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
              {attributes.map((attribute) => (
                <tr key={attribute.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === attribute.id ? (
                      <input
                        type="text"
                        value={formData.name_he}
                        onChange={(e) => setFormData({ ...formData, name_he: e.target.value })}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    ) : (
                      <div className="text-sm font-medium text-gray-900">
                        {attribute.name_he}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === attribute.id ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    ) : (
                      <div className="text-sm text-gray-500 font-mono">
                        {attribute.name}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === attribute.id ? (
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
                        rows={2}
                      />
                    ) : (
                      <div className="text-sm text-gray-500 max-w-xs">
                        {attribute.description || '-'}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      attribute.is_active 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {attribute.is_active ? 'פעיל' : 'לא פעיל'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {editingId === attribute.id ? (
                      <div className="flex space-x-2 rtl:space-x-reverse">
                        <button
                          onClick={handleSave}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-2 rtl:space-x-reverse">
                        <button
                          onClick={() => handleEdit(attribute)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(attribute.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {attributes.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">אין מאפיינים במערכת</p>
          <button
            onClick={() => setIsAdding(true)}
            className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5 ml-2" />
            הוסף מאפיין ראשון
          </button>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirm}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.options.title}
        message={confirmDialog.options.message}
        confirmText={confirmDialog.options.confirmText}
        cancelText={confirmDialog.options.cancelText}
        variant={confirmDialog.options.variant}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  )
}