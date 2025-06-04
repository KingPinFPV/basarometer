'use client'

import { useState, useEffect } from 'react'
import { usePriceReport } from '@/hooks/usePriceReport'
import { usePriceMatrix } from '@/hooks/usePriceMatrix'
import { useAuth } from '@/hooks/useAuth'
import { X, DollarSign, MapPin, Calendar, Tag, CheckCircle, AlertCircle, Loader2, User } from 'lucide-react'

interface PriceReportModalProps {
  isOpen: boolean
  onClose: () => void
  preSelectedMeatCutId?: string
  preSelectedRetailerId?: string
  onSuccess?: () => void
}

export function PriceReportModal({
  isOpen,
  onClose,
  preSelectedMeatCutId,
  preSelectedRetailerId,
  onSuccess
}: PriceReportModalProps) {
  const { submitPriceReport, validatePriceReport, isSubmitting, lastResponse, clearLastResponse } = usePriceReport()
  const { meatCuts, retailers } = usePriceMatrix()
  const { isAuthenticated } = useAuth()

  // Form state
  const [formData, setFormData] = useState({
    meat_cut_id: preSelectedMeatCutId || '',
    retailer_id: preSelectedRetailerId || '',
    price_shekel: '',
    store_location: '',
    notes: '',
    purchase_date: new Date().toISOString().split('T')[0],
    is_on_sale: false,
    sale_price_shekel: ''
  })

  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [showSuccess, setShowSuccess] = useState(false)

  // Update form when props change
  useEffect(() => {
    if (preSelectedMeatCutId && preSelectedMeatCutId !== formData.meat_cut_id) {
      setFormData(prev => ({ ...prev, meat_cut_id: preSelectedMeatCutId }))
    }
    if (preSelectedRetailerId && preSelectedRetailerId !== formData.retailer_id) {
      setFormData(prev => ({ ...prev, retailer_id: preSelectedRetailerId }))
    }
  }, [preSelectedMeatCutId, preSelectedRetailerId, formData.meat_cut_id, formData.retailer_id])

  // Handle form field changes
  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setValidationErrors([])
    clearLastResponse()
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    const errors = validatePriceReport({
      ...formData,
      price_shekel: parseFloat(formData.price_shekel) || 0,
      sale_price_shekel: formData.sale_price_shekel ? parseFloat(formData.sale_price_shekel) : undefined
    })

    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }

    // Submit the report
    const result = await submitPriceReport({
      ...formData,
      price_shekel: parseFloat(formData.price_shekel),
      sale_price_shekel: formData.sale_price_shekel ? parseFloat(formData.sale_price_shekel) : undefined
    })

    if (result.success) {
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        onClose()
        if (onSuccess) {
          onSuccess()
        }
      }, 2000)
    }
  }

  // Handle modal close
  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        meat_cut_id: '',
        retailer_id: '',
        price_shekel: '',
        store_location: '',
        notes: '',
        purchase_date: new Date().toISOString().split('T')[0],
        is_on_sale: false,
        sale_price_shekel: ''
      })
      setValidationErrors([])
      clearLastResponse()
      setShowSuccess(false)
      onClose()
    }
  }

  // Don't render if not open
  if (!isOpen) return null

  // Check authentication
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 modal-overlay flex items-center justify-center p-4 z-50" dir="rtl">
        <div className="card max-w-md w-full p-8 text-center animate-fade-in">
          <User className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">נדרשת התחברות</h3>
          <p className="text-gray-600 mb-6">
            כדי לדווח מחירים, יש להתחבר למערכת תחילה
          </p>
          <button
            onClick={handleClose}
            className="btn-primary px-6 py-2 rounded-lg"
          >
            סגור
          </button>
        </div>
      </div>
    )
  }

  // Success state
  if (showSuccess) {
    return (
      <div className="fixed inset-0 modal-overlay flex items-center justify-center p-4 z-50" dir="rtl">
        <div className="card max-w-md w-full p-8 text-center animate-fade-in">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">דיווח נשלח בהצלחה!</h3>
          <p className="text-gray-600 mb-4">
            תודה על התרומה לקהילה. הדיווח שלך יעזור לאחרים לחסוך כסף.
          </p>
          <div className="text-sm text-green-600 font-medium">
            {lastResponse?.message}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 modal-overlay flex items-center justify-center p-4 z-50" dir="rtl">
      <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-primary text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <DollarSign className="w-6 h-6" />
              <h2 className="text-xl font-bold">דיווח מחיר חדש</h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-white/90 mt-2 text-sm">
            שתף את הקהילה במחירים שמצאת ועזור לאחרים לחסוך
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Display */}
          {(validationErrors.length > 0 || lastResponse?.error) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3 rtl:space-x-reverse">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-red-800">יש לתקן את השגיאות הבאות:</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                    {lastResponse?.error && <li>• {lastResponse.error}</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Meat Cut Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-900">
                חתך בשר *
              </label>
              <select
                value={formData.meat_cut_id}
                onChange={(e) => handleInputChange('meat_cut_id', e.target.value)}
                className="focus-ring w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900"
                required
              >
                <option value="">בחר חתך בשר</option>
                {meatCuts.map(cut => (
                  <option key={cut.id} value={cut.id}>
                    {cut.name_hebrew} {cut.name_english && `(${cut.name_english})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Retailer Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-900">
                רשת/חנות *
              </label>
              <select
                value={formData.retailer_id}
                onChange={(e) => handleInputChange('retailer_id', e.target.value)}
                className="focus-ring w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900"
                required
              >
                <option value="">בחר רשת או חנות</option>
                {retailers.map(retailer => (
                  <option key={retailer.id} value={retailer.id}>
                    {retailer.name} ({retailer.type === 'supermarket' ? 'סופרמרקט' : 
                                     retailer.type === 'butcher' ? 'קצביה' : retailer.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Price Input */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2 rtl:space-x-reverse text-sm font-semibold text-gray-900">
              <DollarSign className="w-4 h-4" />
              <span>מחיר לק&quot;ג (בשקלים) *</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              max="1000"
              value={formData.price_shekel}
              onChange={(e) => handleInputChange('price_shekel', e.target.value)}
              placeholder="לדוגמה: 45.90"
              className="focus-ring w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900"
              required
            />
          </div>

          {/* Sale Options */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <input
                type="checkbox"
                id="is_on_sale"
                checked={formData.is_on_sale}
                onChange={(e) => handleInputChange('is_on_sale', e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
              />
              <label htmlFor="is_on_sale" className="flex items-center space-x-2 rtl:space-x-reverse text-sm font-medium text-gray-900">
                <Tag className="w-4 h-4" />
                <span>המוצר במבצע</span>
              </label>
            </div>

            {formData.is_on_sale && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-2">
                <label className="block text-sm font-semibold text-purple-900">
                  מחיר המבצע (בשקלים)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={formData.sale_price_shekel}
                  onChange={(e) => handleInputChange('sale_price_shekel', e.target.value)}
                  placeholder="לדוגמה: 39.90"
                  className="focus-ring w-full px-4 py-3 border border-purple-300 rounded-lg bg-white text-gray-900"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Store Location */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 rtl:space-x-reverse text-sm font-semibold text-gray-900">
                <MapPin className="w-4 h-4" />
                <span>מיקום הסניף (אופציונלי)</span>
              </label>
              <input
                type="text"
                value={formData.store_location}
                onChange={(e) => handleInputChange('store_location', e.target.value)}
                placeholder="לדוגמה: תל אביב, דיזנגוף"
                className="focus-ring w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900"
                maxLength={100}
              />
            </div>

            {/* Purchase Date */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 rtl:space-x-reverse text-sm font-semibold text-gray-900">
                <Calendar className="w-4 h-4" />
                <span>תאריך הרכישה</span>
              </label>
              <input
                type="date"
                value={formData.purchase_date}
                onChange={(e) => handleInputChange('purchase_date', e.target.value)}
                className="focus-ring w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              הערות נוספות (אופציונלי)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="לדוגמה: מוצר טרי, אריזה משפחתית..."
              rows={3}
              className="focus-ring w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 resize-none"
              maxLength={500}
            />
            <div className="text-xs text-gray-500 text-left">
              {formData.notes.length}/500 תווים
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 rtl:space-x-reverse pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary px-6 py-3 rounded-lg flex items-center justify-center space-x-2 rtl:space-x-reverse disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>שולח דיווח...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>שלח דיווח</span>
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="btn-secondary px-6 py-3 rounded-lg"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}