import { Plus, Package, Store } from 'lucide-react'

interface AdminButtonsProps {
  onAddProduct: () => void
  onAddRetailer: () => void
}

export default function AdminButtons({ onAddProduct, onAddRetailer }: AdminButtonsProps) {
  return (
    <div className="flex gap-3 mb-6" dir="rtl">
      <button
        onClick={onAddProduct}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
      >
        <Package size={18} />
        <span>הוסף מוצר חדש</span>
      </button>
      
      <button
        onClick={onAddRetailer}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
      >
        <Store size={18} />
        <span>הוסף קמעונאי חדש</span>
      </button>
    </div>
  )
} 