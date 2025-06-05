'use client'

import { useState } from 'react'
import { RefreshCw, TrendingUp, Users, MessageSquare } from 'lucide-react'
import { ReviewCard } from './ReviewCard'
import { useCommunity } from '@/hooks/useCommunity'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface CommunityFeedProps {
  className?: string
}

export function CommunityFeed({ className = '' }: CommunityFeedProps) {
  const {
    reviews,
    trendingStores,
    loading,
    error,
    fetchRecentReviews,
    calculateTrendingStores
  } = useCommunity()

  const [filter, setFilter] = useState<'all' | 'recent' | 'trending'>('all')
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([
      fetchRecentReviews(),
      calculateTrendingStores()
    ])
    setRefreshing(false)
  }

  // Filter reviews based on selected filter
  const filteredReviews = reviews.filter(review => {
    switch (filter) {
      case 'recent':
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        return new Date(review.created_at) > oneDayAgo
      case 'trending':
        return trendingStores.some(store => store.retailer.id === review.retailer_id)
      default:
        return true
    }
  })

  return (
    <div className={`space-y-6 ${className}`} dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">פיד הקהילה</h2>
          <p className="text-gray-600">ביקורות ופעילות עדכנית מהקהילה</p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>רענן</span>
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <MessageSquare className="w-8 h-8 text-blue-600" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{reviews.length}</div>
              <div className="text-sm text-gray-600">ביקורות פעילות</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{trendingStores.length}</div>
              <div className="text-sm text-gray-600">חנויות פופולריות</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <Users className="w-8 h-8 text-purple-600" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {new Set(reviews.map(r => r.user_id)).size}
              </div>
              <div className="text-sm text-gray-600">תורמים פעילים</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1 rtl:space-x-reverse bg-gray-100 p-1 rounded-lg">
        {[
          { key: 'all', label: 'הכל', count: reviews.length },
          { key: 'recent', label: '24 שעות', count: filteredReviews.length },
          { key: 'trending', label: 'פופולרי', count: trendingStores.length }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === tab.key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Trending Stores Preview */}
      {filter === 'all' && trendingStores.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
          <div className="flex items-center space-x-2 rtl:space-x-reverse mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">חנויות פופולריות השבוע</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trendingStores.slice(0, 3).map((store) => (
              <div key={store.retailer.id} className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-gray-900">{store.retailer.name}</div>
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
                  <div>ביקורות חדשות: {store.recentReviews}</div>
                  <div>דירוג ממוצע: {store.averageRating.toFixed(1)}/5</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800 font-medium">שגיאה</div>
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {!loading && !error && filteredReviews.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === 'recent' ? 'אין ביקורות חדשות' : 
             filter === 'trending' ? 'אין ביקורות על חנויות פופולריות' :
             'אין ביקורות עדיין'}
          </h3>
          <p className="text-gray-500">
            {filter === 'recent' ? 'בדוק שוב מאוחר יותר לביקורות חדשות' :
             filter === 'trending' ? 'נסה לבחור פילטר אחר' :
             'היה הראשון לכתוב ביקורת!'}
          </p>
        </div>
      )}

      {!loading && !error && filteredReviews.length > 0 && (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              showStore={true}
              compact={false}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {!loading && filteredReviews.length >= 20 && (
        <div className="text-center">
          <button
            onClick={() => fetchRecentReviews(reviews.length + 20)}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            טען עוד ביקורות
          </button>
        </div>
      )}
    </div>
  )
}