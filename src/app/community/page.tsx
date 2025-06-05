'use client'

import { useState } from 'react'
import { Users, TrendingUp, MessageSquare, Star, Plus } from 'lucide-react'
import { CommunityFeed } from '@/components/community/CommunityFeed'
import { StoreReviewModal } from '@/components/community/StoreReviewModal'
import { useCommunity } from '@/hooks/useCommunity'
import { useAuth } from '@/hooks/useAuth'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import type { Retailer } from '@/lib/database.types'

export default function CommunityPage() {
  const { user } = useAuth()
  const { 
    reviews, 
    trendingStores, 
    loading,
    totalReviews,
    hasReviews 
  } = useCommunity()
  
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedRetailer, setSelectedRetailer] = useState<Retailer | null>(null)

  const openReviewModal = (retailer: Retailer) => {
    setSelectedRetailer(retailer)
    setShowReviewModal(true)
  }

  const closeReviewModal = () => {
    setShowReviewModal(false)
    setSelectedRetailer(null)
  }

  if (loading && !hasReviews) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">קהילת בסרומטר</h1>
            <p className="text-gray-600">
              צרפו לקהילה הפעילה של קונים חכמים וחלקו את החוויות שלכם
            </p>
          </div>
          
          {user && (
            <button
              onClick={() => {
                // For now, we'll need to select a retailer
                // In future, this could open a retailer selection modal
                console.log('Open retailer selection modal')
              }}
              className="flex items-center space-x-2 rtl:space-x-reverse px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>כתוב ביקורת</span>
            </button>
          )}
        </div>
      </div>

      {/* Community Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="p-3 bg-blue-100 rounded-lg">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{totalReviews}</div>
              <div className="text-sm text-gray-600">ביקורות בקהילה</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{trendingStores.length}</div>
              <div className="text-sm text-gray-600">חנויות פופולריות</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {new Set(reviews.map(r => r.user_id)).size}
              </div>
              <div className="text-sm text-gray-600">תורמים פעילים</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {reviews.length > 0 
                  ? (reviews.reduce((sum, r) => 
                      sum + (r.quality_rating + r.service_rating + r.cleanliness_rating) / 3, 0
                    ) / reviews.length).toFixed(1)
                  : '0.0'
                }
              </div>
              <div className="text-sm text-gray-600">דירוג ממוצע</div>
            </div>
          </div>
        </div>
      </div>

      {/* Community Guidelines */}
      {!user && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start space-x-4 rtl:space-x-reverse">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                הצטרפו לקהילת בסרומטר
              </h3>
              <p className="text-blue-700 mb-4">
                התחברו כדי לכתוב ביקורות, לעזור לקהילה ולקבל המלצות מותאמות אישית
              </p>
              <div className="text-sm text-blue-600 space-y-1">
                <div>✅ שתפו את החוויות שלכם בחנויות</div>
                <div>✅ עזרו לאחרים לקבל החלטות טובות יותר</div>
                <div>✅ קבלו נקודות אמינות על התרומה שלכם</div>
                <div>✅ גלו חנויות מומלצות באזור שלכם</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Trending Stores Section */}
      {trendingStores.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-center space-x-2 rtl:space-x-reverse mb-6">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">החנויות הפופולריות השבוע</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trendingStores.slice(0, 6).map((store, index) => (
              <div key={store.retailer.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      #{index + 1}
                    </div>
                    <div className="font-medium text-gray-900">{store.retailer.name}</div>
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    store.trend === 'rising' ? 'bg-green-100 text-green-800' :
                    store.trend === 'falling' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {store.trend === 'rising' ? '📈 עולה' :
                     store.trend === 'falling' ? '📉 יורד' :
                     '➡️ יציב'}
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>ביקורות חדשות:</span>
                    <span className="font-medium">{store.recentReviews}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>דירוג ממוצע:</span>
                    <div className="flex items-center space-x-1 rtl:space-x-reverse">
                      <span className="font-medium">{store.averageRating.toFixed(1)}</span>
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    </div>
                  </div>
                </div>

                {user && (
                  <button
                    onClick={() => openReviewModal(store.retailer)}
                    className="w-full mt-3 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    כתוב ביקורת
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Community Feed */}
      <CommunityFeed />

      {/* Store Review Modal */}
      {showReviewModal && selectedRetailer && (
        <StoreReviewModal
          retailer={selectedRetailer}
          isOpen={showReviewModal}
          onClose={closeReviewModal}
        />
      )}
    </div>
  )
}