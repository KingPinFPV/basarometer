'use client'

import { useState } from 'react'
import { Star, ThumbsUp, Flag, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { he } from 'date-fns/locale'
import { useCommunity, type StoreReview } from '@/hooks/useCommunity'

interface ReviewCardProps {
  review: StoreReview
  showStore?: boolean
  compact?: boolean
  className?: string
}

export function ReviewCard({ 
  review, 
  showStore = true, 
  compact = false,
  className = '' 
}: ReviewCardProps) {
  const { likeReview, flagReview } = useCommunity()
  const [liked, setLiked] = useState(false)
  const [flagged, setFlagged] = useState(false)
  const [showFlagModal, setShowFlagModal] = useState(false)

  const handleLike = async () => {
    if (liked) return
    
    const success = await likeReview(review.id)
    if (success) {
      setLiked(true)
    }
  }

  const handleFlag = async (reason: string) => {
    const success = await flagReview(review.id, reason)
    if (success) {
      setFlagged(true)
      setShowFlagModal(false)
    }
  }

  const averageRating = (review.quality_rating + review.service_rating + review.cleanliness_rating) / 3

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600'
    if (rating >= 3) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getReputationBadge = (score: number) => {
    if (score >= 100) return { label: 'מומחה', color: 'bg-purple-100 text-purple-800' }
    if (score >= 50) return { label: 'תורם', color: 'bg-blue-100 text-blue-800' }
    if (score >= 20) return { label: 'פעיל', color: 'bg-green-100 text-green-800' }
    return { label: 'חדש', color: 'bg-gray-100 text-gray-800' }
  }

  const timeAgo = formatDistanceToNow(new Date(review.created_at), {
    addSuffix: true,
    locale: he
  })

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          {/* User Avatar */}
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            {review.user_profile?.avatar_url ? (
              <img 
                src={review.user_profile.avatar_url} 
                alt={review.user_profile.display_name}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <span className="text-gray-600 font-medium">
                {review.user_profile?.display_name?.charAt(0) || '?'}
              </span>
            )}
          </div>

          {/* User Info */}
          <div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <span className="font-medium text-gray-900">
                {review.user_profile?.display_name || 'משתמש אנונימי'}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                getReputationBadge(review.user_profile?.reputation_score || 0).color
              }`}>
                {getReputationBadge(review.user_profile?.reputation_score || 0).label}
              </span>
            </div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>{timeAgo}</span>
            </div>
          </div>
        </div>

        {/* Overall Rating */}
        <div className="text-left">
          <div className={`text-lg font-bold ${getRatingColor(averageRating)}`}>
            {averageRating.toFixed(1)}
          </div>
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.round(averageRating) 
                    ? 'text-yellow-400 fill-current' 
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Store Info */}
      {showStore && review.retailer && (
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="font-medium text-gray-900">{review.retailer.name}</div>
          <div className="text-sm text-gray-500">
            {review.retailer.type === 'supermarket' ? 'סופרמרקט' : 
             review.retailer.type === 'butcher' ? 'קצבייה' :
             review.retailer.type === 'online' ? 'אונליין' : review.retailer.type}
          </div>
        </div>
      )}

      {/* Detailed Ratings */}
      {!compact && (
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-sm text-gray-600">איכות</div>
            <div className={`font-medium ${getRatingColor(review.quality_rating)}`}>
              {review.quality_rating}/5
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">שירות</div>
            <div className={`font-medium ${getRatingColor(review.service_rating)}`}>
              {review.service_rating}/5
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">ניקיון</div>
            <div className={`font-medium ${getRatingColor(review.cleanliness_rating)}`}>
              {review.cleanliness_rating}/5
            </div>
          </div>
        </div>
      )}

      {/* Review Content */}
      <div className="text-gray-800 leading-relaxed">
        {review.content}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          {/* Like Button */}
          <button
            onClick={handleLike}
            disabled={liked}
            className={`flex items-center space-x-1 rtl:space-x-reverse text-sm transition-colors ${
              liked 
                ? 'text-blue-600' 
                : 'text-gray-500 hover:text-blue-600'
            }`}
          >
            <ThumbsUp className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
            <span>{liked ? 'אהבת' : 'מועיל'}</span>
            {review.likes_count > 0 && (
              <span className="text-gray-400">({review.likes_count})</span>
            )}
          </button>

          {/* Flag Button */}
          <button
            onClick={() => setShowFlagModal(true)}
            disabled={flagged}
            className={`flex items-center space-x-1 rtl:space-x-reverse text-sm transition-colors ${
              flagged 
                ? 'text-red-600' 
                : 'text-gray-500 hover:text-red-600'
            }`}
          >
            <Flag className={`w-4 h-4 ${flagged ? 'fill-current' : ''}`} />
            <span>{flagged ? 'דווח' : 'דווח'}</span>
          </button>
        </div>

        {/* Reputation Score */}
        <div className="text-sm text-gray-500">
          נקודות אמינות: {review.user_profile?.reputation_score || 0}
        </div>
      </div>

      {/* Flag Modal */}
      {showFlagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4" dir="rtl">
            <h3 className="text-lg font-semibold mb-4">דווח על ביקורת</h3>
            <p className="text-gray-600 mb-4">
              מדוע ברצונך לדווח על ביקורת זו?
            </p>
            <div className="space-y-2">
              {[
                'תוכן לא הולם או פוגעני',
                'ביקורת לא רלוונטית',
                'מידע שגוי או מטעה',
                'ספאם או פרסומת'
              ].map((reason) => (
                <button
                  key={reason}
                  onClick={() => handleFlag(reason)}
                  className="w-full text-right p-2 hover:bg-gray-50 rounded transition-colors"
                >
                  {reason}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowFlagModal(false)}
              className="w-full mt-4 p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ביטול
            </button>
          </div>
        </div>
      )}
    </div>
  )
}