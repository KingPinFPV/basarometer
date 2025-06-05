'use client'

import React, { useState, useMemo } from 'react'
import { X, MapPin, Store, CheckCircle, AlertTriangle, Package } from 'lucide-react'
import type { ValidationResult } from '@/hooks/useOCR'
import { usePriceData } from '@/hooks/usePriceData'

interface BulkSubmitModalProps {
  isOpen: boolean
  onClose: () => void
  validationResult: ValidationResult
  onSubmit: (retailerId: string, location?: string) => Promise<boolean>
  processing: boolean
  detectedStore?: {
    name: string
    retailerId?: string
    confidence: number
  } | null
}

export function BulkSubmitModal({
  isOpen,
  onClose,
  validationResult,
  onSubmit,
  processing,
  detectedStore
}: BulkSubmitModalProps) {
  const { retailers } = usePriceData()
  const [selectedRetailerId, setSelectedRetailerId] = useState<string>(detectedStore?.retailerId || '')
  const [location, setLocation] = useState<string>('')
  const [confirmSubmit, setConfirmSubmit] = useState(false)

  const validItems = validationResult.validItems

  // Calculate submission summary
  const submissionSummary = useMemo(() => {
    const itemsWithMeatCuts = validItems.filter(item => item.meatCutId)
    const totalValue = validItems.reduce((sum, item) => sum + item.price, 0)
    const avgConfidence = validItems.length > 0 
      ? validItems.reduce((sum, item) => sum + item.confidence, 0) / validItems.length 
      : 0

    return {
      totalItems: validItems.length,
      itemsWithMeatCuts: itemsWithMeatCuts.length,
      totalValue,
      avgConfidence
    }
  }, [validItems])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedRetailerId) {
      alert('נא לבחור חנות')
      return
    }

    if (!confirmSubmit) {
      setConfirmSubmit(true)
      return
    }

    const success = await onSubmit(selectedRetailerId, location.trim() || undefined)
    if (success) {
      onClose()
      setConfirmSubmit(false)
      setLocation('')
    }
  }

  const selectedRetailer = retailers.find(r => r.id === selectedRetailerId)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" dir="rtl">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">שליחת דיווחי מחיר</h2>
          <button
            onClick={onClose}
            disabled={processing}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Store Detection Info */}
          {detectedStore && (
            <div className="p-6 bg-blue-50 border-b border-blue-200">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-medium text-blue-900">זוהתה חנות בקבלה</h3>
                  <p className="text-blue-700 text-sm">
                    {detectedStore.name} (ביטחון: {Math.round(detectedStore.confidence * 100)}%)
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                <Package className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-blue-900">{submissionSummary.totalItems}</div>
                <div className="text-sm text-blue-700">פריטים לשליחה</div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-green-900">{submissionSummary.itemsWithMeatCuts}</div>
                <div className="text-sm text-green-700">מוצרים מזוהים</div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 text-center border border-purple-200">
                <Store className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-purple-900">₪{submissionSummary.totalValue.toFixed(2)}</div>
                <div className="text-sm text-purple-700">סך הכל</div>
              </div>
            </div>

            {/* Store Selection */}
            <div>
              <label htmlFor="retailer" className="block text-sm font-medium text-gray-700 mb-2">
                בחר חנות *
              </label>
              <select
                id="retailer"
                value={selectedRetailerId}
                onChange={(e) => setSelectedRetailerId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={processing}
              >
                <option value="">בחר חנות...</option>
                {retailers.map((retailer) => (
                  <option key={retailer.id} value={retailer.id}>
                    {retailer.name}
                  </option>
                ))}
              </select>
              {detectedStore && !selectedRetailerId && (
                <p className="text-sm text-gray-600 mt-1">
                  זוהתה: {detectedStore.name} - בחר מהרשימה למעלה
                </p>
              )}
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline ml-1" />
                מיקום (אופציונלי)
              </label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="עיר, שכונה או כתובת"
                disabled={processing}
              />
            </div>

            {/* Items Preview */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">פריטים שיישלחו:</h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                <div className="space-y-2">
                  {validItems.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-900">{item.text}</span>
                      <span className="font-medium text-gray-700">₪{item.price.toFixed(2)}</span>
                    </div>
                  ))}
                  {validItems.length > 5 && (
                    <div className="text-center text-sm text-gray-500 border-t border-gray-200 pt-2">
                      ועוד {validItems.length - 5} פריטים...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Confidence Warning */}
            {submissionSummary.avgConfidence < 0.7 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-2 rtl:space-x-reverse">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">ביטחון נמוך בזיהוי</h4>
                    <p className="text-yellow-700 text-sm">
                      רמת הביטחון הממוצעת בזיהוי היא {Math.round(submissionSummary.avgConfidence * 100)}%.
                      מומלץ לבדוק את הפריטים שוב לפני השליחה.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Confirmation */}
            {!confirmSubmit ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={processing || !selectedRetailerId || validItems.length === 0}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  המשך לשליחה
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={processing}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  ביטול
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">אישור שליחה</h4>
                  <div className="text-blue-800 text-sm space-y-1">
                    <p>• {submissionSummary.totalItems} פריטים יישלחו ל{selectedRetailer?.name}</p>
                    {location && <p>• מיקום: {location}</p>}
                    <p>• תאריך: {new Date().toLocaleDateString('he-IL')}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={processing}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 rtl:space-x-reverse"
                  >
                    {processing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>שולח...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        <span>שלח דיווחים</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmSubmit(false)}
                    disabled={processing}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors"
                  >
                    חזור
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

export default BulkSubmitModal