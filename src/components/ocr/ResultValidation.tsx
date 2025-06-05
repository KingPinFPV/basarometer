'use client'

import React, { useState } from 'react'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Edit3, 
  Trash2, 
  ShoppingCart,
  DollarSign,
  Tag,
  Package
} from 'lucide-react'
import type { ExtractedItem, ValidationResult } from '@/hooks/useOCR'
import { usePriceData } from '@/hooks/usePriceData'

interface ResultValidationProps {
  validationResult: ValidationResult
  onItemUpdate: (index: number, updatedItem: ExtractedItem) => void
  onItemRemove: (index: number) => void
  onValidate: () => void
  processing: boolean
}

export function ResultValidation({
  validationResult,
  onItemUpdate,
  onItemRemove,
  onValidate,
  processing
}: ResultValidationProps) {
  const { meatCuts, retailers } = usePriceData()
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const allItems = [...validationResult.validItems, ...validationResult.invalidItems]

  const handleItemEdit = (index: number, field: keyof ExtractedItem, value: any) => {
    const item = allItems[index]
    if (!item) return

    const updatedItem: ExtractedItem = {
      ...item,
      [field]: value,
      isValidated: false // Reset validation when editing
    }

    onItemUpdate(index, updatedItem)
  }

  const getItemStatusIcon = (item: ExtractedItem) => {
    if (validationResult.validItems.includes(item)) {
      return <CheckCircle className="w-5 h-5 text-green-500" />
    }
    if (validationResult.invalidItems.includes(item)) {
      return <XCircle className="w-5 h-5 text-red-500" />
    }
    return <AlertTriangle className="w-5 h-5 text-yellow-500" />
  }

  const getItemStatusColor = (item: ExtractedItem) => {
    if (validationResult.validItems.includes(item)) {
      return 'border-green-200 bg-green-50'
    }
    if (validationResult.invalidItems.includes(item)) {
      return 'border-red-200 bg-red-50'
    }
    return 'border-yellow-200 bg-yellow-50'
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100'
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'גבוה'
    if (confidence >= 0.6) return 'בינוני'
    return 'נמוך'
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Validation Summary */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">תוצאות זיהוי קבלה</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-900">{allItems.length}</div>
            <div className="text-sm text-blue-700">פריטים זוהו</div>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-900">{validationResult.validItems.length}</div>
            <div className="text-sm text-green-700">פריטים תקינים</div>
          </div>

          <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
            <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-red-900">{validationResult.invalidItems.length}</div>
            <div className="text-sm text-red-700">פריטים לתיקון</div>
          </div>
        </div>

        {/* Errors and Warnings */}
        {validationResult.errors.length > 0 && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <span className="font-medium text-red-800">שגיאות שיש לתקן:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-red-700 text-sm">
              {validationResult.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {validationResult.warnings.length > 0 && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <span className="font-medium text-yellow-800">אזהרות:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-yellow-700 text-sm">
              {validationResult.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Items List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">פריטים שזוהו מהקבלה</h3>
        
        {allItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>לא זוהו פריטי בשר בקבלה</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allItems.map((item, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 transition-all ${getItemStatusColor(item)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 rtl:space-x-reverse flex-1">
                    {getItemStatusIcon(item)}
                    
                    <div className="flex-1">
                      {editingIndex === index ? (
                        <EditItemForm
                          item={item}
                          meatCuts={meatCuts}
                          onSave={(updatedItem) => {
                            onItemUpdate(index, updatedItem)
                            setEditingIndex(null)
                          }}
                          onCancel={() => setEditingIndex(null)}
                        />
                      ) : (
                        <ViewItemDetails
                          item={item}
                          meatCuts={meatCuts}
                          onEdit={() => setEditingIndex(index)}
                          onRemove={() => onItemRemove(index)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end">
        <button
          onClick={onValidate}
          disabled={processing || allItems.length === 0}
          className="flex items-center justify-center space-x-2 rtl:space-x-reverse bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          <CheckCircle className="w-5 h-5" />
          <span>{processing ? 'מעבד...' : 'אמת ושלח דיווחים'}</span>
        </button>
      </div>
    </div>
  )
}

// Component for viewing item details
function ViewItemDetails({ 
  item, 
  meatCuts, 
  onEdit, 
  onRemove 
}: { 
  item: ExtractedItem
  meatCuts: any[]
  onEdit: () => void
  onRemove: () => void
}) {
  const matchedCut = meatCuts.find(cut => cut.id === item.meatCutId)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">{item.text}</h4>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            item.confidence >= 0.8 ? 'bg-green-100 text-green-800' :
            item.confidence >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            ביטחון: {Math.round(item.confidence * 100)}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-gray-600">מחיר:</span>
          <div className="font-medium">₪{item.price.toFixed(2)}</div>
        </div>

        {item.quantity && (
          <div>
            <span className="text-gray-600">כמות:</span>
            <div className="font-medium">{item.quantity} {item.unit || ''}</div>
          </div>
        )}

        <div>
          <span className="text-gray-600">מוצר:</span>
          <div className="font-medium">
            {matchedCut ? matchedCut.name_hebrew : 'לא זוהה'}
          </div>
        </div>

        <div>
          <span className="text-gray-600">קטגוריה:</span>
          <div className="font-medium">{item.suggestedCategory || 'לא זוהתה'}</div>
        </div>
      </div>

      <div className="flex items-center space-x-2 rtl:space-x-reverse">
        <button
          onClick={onEdit}
          className="flex items-center space-x-1 rtl:space-x-reverse text-blue-600 hover:text-blue-800 text-sm transition-colors"
        >
          <Edit3 className="w-4 h-4" />
          <span>ערוך</span>
        </button>
        <button
          onClick={onRemove}
          className="flex items-center space-x-1 rtl:space-x-reverse text-red-600 hover:text-red-800 text-sm transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>הסר</span>
        </button>
      </div>
    </div>
  )
}

// Component for editing item
function EditItemForm({ 
  item, 
  meatCuts, 
  onSave, 
  onCancel 
}: { 
  item: ExtractedItem
  meatCuts: any[]
  onSave: (item: ExtractedItem) => void
  onCancel: () => void
}) {
  const [editedItem, setEditedItem] = useState<ExtractedItem>(item)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(editedItem)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            תיאור הפריט
          </label>
          <input
            type="text"
            value={editedItem.text}
            onChange={(e) => setEditedItem({ ...editedItem, text: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="שם הפריט"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            מחיר (₪)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={editedItem.price}
            onChange={(e) => setEditedItem({ ...editedItem, price: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            מוצר מהמאגר
          </label>
          <select
            value={editedItem.meatCutId || ''}
            onChange={(e) => {
              const selectedCut = meatCuts.find(cut => cut.id === e.target.value)
              setEditedItem({
                ...editedItem,
                meatCutId: e.target.value || undefined,
                suggestedCategory: selectedCut ? getCategoryName(selectedCut.category_id) : undefined
              })
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">בחר מוצר...</option>
            {meatCuts.map((cut) => (
              <option key={cut.id} value={cut.id}>
                {cut.name_hebrew}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            כמות
          </label>
          <div className="flex space-x-2 rtl:space-x-reverse">
            <input
              type="number"
              step="0.01"
              min="0"
              value={editedItem.quantity || ''}
              onChange={(e) => setEditedItem({ ...editedItem, quantity: parseFloat(e.target.value) || undefined })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="כמות"
            />
            <select
              value={editedItem.unit || ''}
              onChange={(e) => setEditedItem({ ...editedItem, unit: e.target.value || undefined })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">יחידה</option>
              <option value="ק״ג">ק״ג</option>
              <option value="גרם">גרם</option>
              <option value="יחידה">יחידה</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-3 rtl:space-x-reverse">
        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          שמור
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          ביטול
        </button>
      </div>
    </form>
  )
}

// Helper function - same as in useOCR
function getCategoryName(categoryId: string): string {
  const categoryMap: Record<string, string> = {
    'beef': 'בקר',
    'chicken': 'עוף',
    'lamb': 'כבש',
    'turkey': 'הודו',
    'pork': 'חזיר'
  }
  return categoryMap[categoryId] || 'כללי'
}

export default ResultValidation