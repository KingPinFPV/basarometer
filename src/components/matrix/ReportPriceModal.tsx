'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuthProfile } from '@/hooks/useAuthProfile'
import { X, AlertCircle, DollarSign, Calendar, FileText } from 'lucide-react'

interface ReportPriceModalProps {
  isOpen: boolean
  onClose: () => void
  meatCutId: string
  retailerId: string
  productName: string
  retailerName: string
  currentPrice?: number
}

export default function ReportPriceModal({
  isOpen,
  onClose,
  meatCutId,
  retailerId,
  productName,
  retailerName,
  currentPrice
}: ReportPriceModalProps) {
  const [price, setPrice] = useState(currentPrice?.toString() || '')
  const [isOnSale, setIsOnSale] = useState(false)
  const [salePrice, setSalePrice] = useState('')
  const [saleExpiresAt, setSaleExpiresAt] = useState('')
  const [notes, setNotes] = useState('')
  const [storeLocation, setStoreLocation] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const { user } = useAuthProfile()

  const calculateDiscount = () => {
    if (!isOnSale || !price || !salePrice) return null
    const originalPrice = parseFloat(price)
    const discountedPrice = parseFloat(salePrice)
    if (originalPrice > 0 && discountedPrice > 0) {
      return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!user) {
        setError('יש להתחבר כדי לדווח מחיר')
        setLoading(false)
        return
      }

      const supabase = createClient()
      
      const priceValue = parseFloat(price)
      if (isNaN(priceValue) || priceValue <= 0) {
        setError('אנא הכנס מחיר תקין')
        setLoading(false)
        return
      }

      let salePriceValue = null
      let discountPercentage = null

      if (isOnSale) {
        if (!salePrice) {
          setError('אנא הכנס מחיר מבצע')
          setLoading(false)
          return
        }
        salePriceValue = parseFloat(salePrice)
        if (isNaN(salePriceValue) || salePriceValue <= 0) {
          setError('אנא הכנס מחיר מבצע תקין')
          setLoading(false)
          return
        }
        if (salePriceValue >= priceValue) {
          setError('מחיר המבצע חייב להיות נמוך ממחיר הרגיל')
          setLoading(false)
          return
        }
        discountPercentage = calculateDiscount()
      }

      const { error: insertError } = await supabase
        .from('price_reports')
        .insert({
          meat_cut_id: meatCutId,
          retailer_id: retailerId,
          price_per_kg: priceValue,
          is_on_sale: isOnSale,
          sale_price: salePriceValue,
          sale_expires_at: isOnSale && saleExpiresAt ? saleExpiresAt : null,
          discount_percentage: discountPercentage,
          notes: notes.trim() || null,
          user_id: user.id,
          purchase_date: purchaseDate,
          store_location: storeLocation.trim() || retailerName,
          confidence_score: 5
        })

      if (insertError) throw insertError

      setSuccess(true)
      
      // Reset form and close modal after 2 seconds
      setTimeout(() => {
        setPrice('')
        setIsOnSale(false)
        setSalePrice('')
        setSaleExpiresAt('')
        setNotes('')
        setStoreLocation('')
        setPurchaseDate(new Date().toISOString().split('T')[0])
        setSuccess(false)
        onClose()
      }, 2000)

    } catch (err) {
      console.error('Failed to report price:', err)
      setError(err instanceof Error ? err.message : 'שגיאה בדיווח המחיר')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-md text-center" dir="rtl">
          <div className="text-green-500 text-4xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">הדיווח נשלח בהצלחה!</h2>
          <p className="text-gray-600">תודה על תרומתך לקהילה</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto" dir="rtl">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign size={24} className="text-blue-600" />
            דיווח מחיר מתקדם
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">מוצר:</span> {productName}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-semibold">חנות:</span> {retailerName}
            </p>
          </div>

          {!user && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
              <AlertCircle size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">נדרשת התחברות</p>
                <p className="text-sm text-amber-700">יש להתחבר לחשבון כדי לדווח מחירים</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <DollarSign size={16} />
                מחיר רגיל (₪ לק&quot;ג)
              </label>
              <input
                type="number"
                id="price"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                required
                disabled={!user}
              />
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="is-on-sale"
                checked={isOnSale}
                onChange={(e) => setIsOnSale(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
                disabled={!user}
              />
              <label htmlFor="is-on-sale" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                🏷️ המוצר במבצע
              </label>
            </div>

            {isOnSale && (
              <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div>
                  <label htmlFor="sale-price" className="block text-sm font-medium text-green-800 mb-1 flex items-center gap-2">
                    🔥 מחיר במבצע (₪ לק&quot;ג)
                  </label>
                  <input
                    type="number"
                    id="sale-price"
                    step="0.01"
                    min="0"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="0.00"
                    required={isOnSale}
                    disabled={!user}
                  />
                  {calculateDiscount() && (
                    <p className="text-sm text-green-700 mt-1 font-medium">
                      חיסכון: {calculateDiscount()}% ({(parseFloat(price) - parseFloat(salePrice)).toFixed(2)} ₪)
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="sale-expires" className="block text-sm font-medium text-green-800 mb-1 flex items-center gap-2">
                    <Calendar size={16} />
                    תוקף המבצע (אופציונלי)
                  </label>
                  <input
                    type="datetime-local"
                    id="sale-expires"
                    value={saleExpiresAt}
                    onChange={(e) => setSaleExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={!user}
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="purchase-date" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Calendar size={16} />
                תאריך רכישה *
              </label>
              <input
                type="date"
                id="purchase-date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={!user}
              />
            </div>

            <div>
              <label htmlFor="store-location" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                📍 מיקום חנות *
              </label>
              <input
                type="text"
                id="store-location"
                value={storeLocation}
                onChange={(e) => setStoreLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`לדוגמה: ${retailerName} תל אביב`}
                required
                disabled={!user}
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <FileText size={16} />
                הערות נוספות (אופציונלי)
              </label>
              <textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="איכות המוצר, מיקום בחנות, המלצות..."
                disabled={!user}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading || !user}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    שולח דיווח...
                  </>
                ) : (
                  <>
                    <DollarSign size={16} />
                    דווח מחיר
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                ביטול
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}