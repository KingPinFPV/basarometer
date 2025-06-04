import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface AddRetailerFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddRetailerForm({ isOpen, onClose, onSuccess }: AddRetailerFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'supermarket',
    website_url: '',
    logo_url: ''
  })


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase.rpc('add_retailer_simple', {
      p_name: formData.name,
      p_type: formData.type,
      p_website_url: formData.website_url || null
    })

    if (error) {
      console.error('Error adding retailer:', error)
      // TODO: Show error toast
      setLoading(false)
      return
    }

    if (data?.success) {
      onSuccess()
      onClose()
      setFormData({
        name: '',
        type: 'supermarket',
        website_url: '',
        logo_url: ''
      })
    }
    setLoading(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4" dir="rtl">
        <h2 className="text-xl font-bold mb-4 text-right">הוספת קמעונאי חדש</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-right">שם הקמעונאי</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full p-2 border rounded-lg text-right"
              placeholder="למשל: סופר פארם"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-right">סוג</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              className="w-full p-2 border rounded-lg text-right"
            >
              <option value="supermarket">סופרמרקט</option>
              <option value="butcher">קצבייה</option>
              <option value="market">שוק</option>
              <option value="online">קניות מקוונות</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-right">אתר אינטרנט (אופציונלי)</label>
            <input
              type="url"
              value={formData.website_url}
              onChange={(e) => setFormData({...formData, website_url: e.target.value})}
              className="w-full p-2 border rounded-lg text-right"
              placeholder="https://..."
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'מוסיף...' : 'הוסף קמעונאי'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 