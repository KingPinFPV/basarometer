'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase'

interface ReportPriceModalProps {
  isOpen: boolean
  onClose: () => void
  productId: number
  retailerId: number
  productName: string
  retailerName: string
  currentPrice?: number
}

export default function ReportPriceModal({
  isOpen,
  onClose,
  productId,
  retailerId,
  productName,
  retailerName,
  currentPrice
}: ReportPriceModalProps) {
  const [price, setPrice] = useState(currentPrice?.toString() || '')
  const [isPromotion, setIsPromotion] = useState(false)
  const [originalPrice, setOriginalPrice] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      
      const priceValue = parseFloat(price)
      if (isNaN(priceValue) || priceValue <= 0) {
        setError('אנא הכנס מחיר תקין')
        return
      }

      const originalPriceValue = isPromotion && originalPrice 
        ? parseFloat(originalPrice) 
        : null

      const { error: insertError } = await supabase
        .from('price_reports')
        .insert({
          product_id: productId,
          retailer_id: retailerId,
          price: priceValue,
          price_per_unit: priceValue, // Assume per kg for now
          original_price: originalPriceValue,
          is_promotion: isPromotion,
          notes: notes || null,
          confidence_score: 5, // Default confidence
          verification_status: 'pending'
        })

      if (insertError) throw insertError

      // Reset form and close modal
      setPrice('')
      setIsPromotion(false)
      setOriginalPrice('')
      setNotes('')
      onClose()

    } catch (err) {
      console.error('Failed to report price:', err)
      setError(err instanceof Error ? err.message : 'שגיאה בדיווח המחיר')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">דווח מחיר</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">מוצר: <span className="font-semibold">{productName}</span></p>
          <p className="text-sm text-gray-600">חנות: <span className="font-semibold">{retailerName}</span></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              מחיר (₪)
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
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is-promotion"
              checked={isPromotion}
              onChange={(e) => setIsPromotion(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="is-promotion" className="text-sm text-gray-700">
              המוצר במבצע
            </label>
          </div>

          {isPromotion && (
            <div>
              <label htmlFor="original-price" className="block text-sm font-medium text-gray-700 mb-1">
                מחיר מקורי (₪)
              </label>
              <input
                type="number"
                id="original-price"
                step="0.01"
                min="0"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          )}

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              הערות (אופציונלי)
            </label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="הערות נוספות על המחיר..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'שולח...' : 'דווח מחיר'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}