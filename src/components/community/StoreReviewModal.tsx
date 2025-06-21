'use client'

import { useState } from 'react'
import { X, Star } from 'lucide-react'
import { useCommunity } from '@/hooks/useCommunity'
import { ModalPortal } from '@/components/ui/ModalPortal'
import type { Retailer } from '@/lib/database.types'

interface StoreReviewModalProps {
  retailer: Retailer
  isOpen: boolean
  onClose: () => void
}

export function StoreReviewModal({ retailer, isOpen, onClose }: StoreReviewModalProps) {
  const { submitReview, loading } = useCommunity()
  
  const [qualityRating, setQualityRating] = useState(0)
  const [serviceRating, setServiceRating] = useState(0)
  const [cleanlinessRating, setCleanlinessRating] = useState(0)
  const [content, setContent] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    // Validation
    if (qualityRating === 0 || serviceRating === 0 || cleanlinessRating === 0) {
      setSubmitError('נא לדרג את כל הקטגוריות')
      return
    }

    if (content.trim().length < 10) {
      setSubmitError('נא לכתוב ביקורת של לפחות 10 תווים')
      return
    }

    const success = await submitReview(
      retailer.id,
      qualityRating,
      serviceRating,
      cleanlinessRating,
      content.trim()
    )

    if (success) {
      // Reset form
      setQualityRating(0)
      setServiceRating(0)
      setCleanlinessRating(0)
      setContent('')
      onClose()
    } else {
      setSubmitError('שגיאה בשליחת הביקורת')
    }
  }

  const RatingStars = ({ 
    rating, 
    onRatingChange, 
    label 
  }: { 
    rating: number
    onRatingChange: (rating: number) => void
    label: string 
  }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="flex space-x-1 rtl:space-x-reverse">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          >
            <Star
              className={`w-6 h-6 transition-colors ${
                star <= rating
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300 hover:text-yellow-200'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <ModalPortal isOpen={isOpen}>
      <div 
        className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto" 
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            ביקורת על {retailer.name}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Store Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="font-medium text-gray-900">{retailer.name}</div>
            <div className="text-sm text-gray-500">
              {retailer.type === 'supermarket' ? 'סופרמרקט' : 
               retailer.type === 'butcher' ? 'קצבייה' :
               retailer.type === 'online' ? 'אונליין' : retailer.type}
            </div>
          </div>

          {/* Rating Categories */}
          <div className="space-y-4">
            <RatingStars
              rating={qualityRating}
              onRatingChange={setQualityRating}
              label="איכות המוצרים ⭐"
            />

            <RatingStars
              rating={serviceRating}
              onRatingChange={setServiceRating}
              label="איכות השירות 🤝"
            />

            <RatingStars
              rating={cleanlinessRating}
              onRatingChange={setCleanlinessRating}
              label="ניקיון החנות 🧹"
            />
          </div>

          {/* Written Review */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              ביקורת כתובה (חובה)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="ספר על החוויה שלך בחנות... מה היה טוב? מה אפשר לשפר?"
              className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxLength={500}
            />
            <div className="text-xs text-gray-500 text-left">
              {content.length}/500 תווים
            </div>
          </div>

          {/* Error Message */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="text-red-800 text-sm">{submitError}</div>
            </div>
          )}

          {/* Guidelines */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-blue-800 text-sm space-y-1">
              <div className="font-medium">הנחיות לביקורת:</div>
              <div>• היה הוגן ובונה בביקורת</div>
              <div>• התמקד בחוויה האישית שלך</div>
              <div>• הימנע משפה פוגענית</div>
              <div>• עזור לקהילה לקבל החלטות טובות יותר</div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 rtl:space-x-reverse pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={loading || qualityRating === 0 || serviceRating === 0 || cleanlinessRating === 0 || content.trim().length < 10}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'שולח...' : 'פרסם ביקורת'}
            </button>
          </div>
        </form>
      </div>
    </ModalPortal>
  )
}