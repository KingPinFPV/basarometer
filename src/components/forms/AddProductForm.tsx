import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface Category {
  id: string
  name_hebrew: string
  name_english: string
  display_order: number
}

interface AddProductFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddProductForm({ isOpen, onClose, onSuccess }: AddProductFormProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    category_id: '',
    name_hebrew: '',
    name_english: '',
    description: '',
    price_range_min: '',
    price_range_max: '',
    is_popular: false
  })

  const supabase = createClientComponentClient()

  // useCallback for fetchCategories
  const fetchCategories = useCallback(async () => {
    const { data } = await supabase.rpc('get_meat_categories_for_form')
    if (data) {
      setCategories(data)
    }
  }, [supabase])

  useEffect(() => {
    if (isOpen) {
      fetchCategories()
    }
  }, [isOpen, fetchCategories])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase.rpc('add_meat_cut_simple', {
      p_category_id: formData.category_id,
      p_name_hebrew: formData.name_hebrew,
      p_name_english: formData.name_english
    })

    if (error) {
      console.error('Error adding meat cut:', error)
      // TODO: Show error toast
      setLoading(false)
      return
    }

    if (data?.success) {
      onSuccess()
      onClose()
      // Reset form
      setFormData({
        category_id: '',
        name_hebrew: '',
        name_english: '',
        description: '',
        price_range_min: '',
        price_range_max: '',
        is_popular: false
      })
    }
    setLoading(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4" dir="rtl">
        <h2 className="text-xl font-bold mb-4 text-right">הוספת מוצר חדש</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-right">קטגוריה</label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({...formData, category_id: e.target.value})}
              className="w-full p-2 border rounded-lg text-right"
              required
            >
              <option value="">בחר קטגוריה</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name_hebrew}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-right">שם בעברית</label>
            <input
              type="text"
              value={formData.name_hebrew}
              onChange={(e) => setFormData({...formData, name_hebrew: e.target.value})}
              className="w-full p-2 border rounded-lg text-right"
              placeholder="למשל: ריב איי"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-right">שם באנגלית</label>
            <input
              type="text"
              value={formData.name_english}
              onChange={(e) => setFormData({...formData, name_english: e.target.value})}
              className="w-full p-2 border rounded-lg text-right"
              placeholder="למשל: Rib Eye"
              required
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'מוסיף...' : 'הוסף מוצר'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 