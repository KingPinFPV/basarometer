'use client'

import { useState } from 'react'
import { useStoreRankings } from '@/hooks/useStoreRankings'
import { useCommunity } from '@/hooks/useCommunity'
import { useAuth } from '@/hooks/useAuth'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { StoreReviewModal } from '@/components/community/StoreReviewModal'
import { Trophy, TrendingUp, TrendingDown, Star, Medal, Crown, Award, Users, MessageSquare, Heart } from 'lucide-react'
import type { Retailer } from '@/lib/database.types'

export default function RankingsPage() {
  const {
    storeRankings,
    userRankings,
    categories,
    selectedCategoryId,
    setSelectedCategoryId,
    loading,
    error,
    topStore,
    topUser,
    totalStores,
    totalUsers
  } = useStoreRankings()
  
  const { user } = useAuth()
  const { 
    reviews, 
    // trendingStores, 
    // communityInsights, 
    getStoreInsights 
  } = useCommunity()

  const [activeTab, setActiveTab] = useState<'stores' | 'users'>('stores')
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedRetailer, setSelectedRetailer] = useState<Retailer | null>(null)

  // Format price for display
  const formatPrice = (price: number): string => {
    return `₪${price.toFixed(2)}`
  }

  // Get badge icon for users
  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case 'trusted': return <Crown className="w-4 h-4 text-yellow-500" />
      case 'expert': return <Medal className="w-4 h-4 text-purple-500" />
      case 'contributor': return <Award className="w-4 h-4 text-blue-500" />
      default: return <Star className="w-4 h-4 text-gray-400" />
    }
  }

  // Get badge label
  const getBadgeLabel = (badge: string) => {
    switch (badge) {
      case 'trusted': return 'מהימן'
      case 'expert': return 'מומחה'
      case 'contributor': return 'תורם'
      default: return 'מתחיל'
    }
  }

  // Handle review modal
  const openReviewModal = (retailer: Retailer) => {
    if (!user) {
      alert('התחבר כדי לכתוב ביקורת')
      return
    }
    setSelectedRetailer(retailer)
    setShowReviewModal(true)
  }

  const closeReviewModal = () => {
    setShowReviewModal(false)
    setSelectedRetailer(null)
  }

  // Get community insights for a retailer
  // const getRetailerInsights = (retailerId: string) => {
  //   return communityInsights.get(retailerId)
  // }

  // Get store reviews count
  const getStoreReviewsCount = (retailerId: string) => {
    return reviews.filter(r => r.retailer_id === retailerId).length
  }

  // Get store average community rating
  const getStoreAverageRating = (retailerId: string) => {
    const storeReviews = (reviews || []).filter(r => r?.retailer_id === retailerId)
    if (!storeReviews || storeReviews.length === 0) return 0
    
    const totalRating = (storeReviews || []).reduce((sum, review) => 
      sum + ((review?.quality_rating || 0) + (review?.service_rating || 0) + (review?.cleanliness_rating || 0)) / 3, 0
    )
    return totalRating / storeReviews.length
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 rtl:space-x-reverse mb-4">
            <Trophy className="w-8 h-8 text-yellow-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                דירוגים וסטטיסטיקות
              </h1>
              <p className="text-gray-600">
                דירוג חנויות לפי מחירים ודירוג משתמשים לפי תרומה לקהילה
              </p>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span className="text-sm text-gray-600">חנות מובילה</span>
              </div>
              <div className="font-bold text-lg">{topStore?.retailer.name || 'אין נתונים'}</div>
              {topStore && (
                <div className="text-sm text-gray-500">
                  ממוצע: {formatPrice(topStore.avgPrice)}
                </div>
              )}
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Crown className="w-5 h-5 text-purple-500" />
                <span className="text-sm text-gray-600">משתמש מוביל</span>
              </div>
              <div className="font-bold text-lg">{topUser?.display_name || 'אין נתונים'}</div>
              {topUser && (
                <div className="text-sm text-gray-500">
                  {topUser.reputation_score} נקודות
                </div>
              )}
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Users className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-gray-600">חנויות פעילות</span>
              </div>
              <div className="font-bold text-lg">{totalStores}</div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Star className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-600">משתמשים פעילים</span>
              </div>
              <div className="font-bold text-lg">{totalUsers}</div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-4 rtl:space-x-reverse mb-6">
            <button
              onClick={() => setActiveTab('stores')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'stores'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              🏪 דירוג חנויות
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'users'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              👥 לוח מובילים
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-red-800 font-medium">שגיאה</div>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Store Rankings Tab */}
        {activeTab === 'stores' && (
          <div>
            {/* Category Filter */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategoryId(null)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    !selectedCategoryId
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  כל הקטגוריות
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategoryId(category.id)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      selectedCategoryId === category.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {category.name_hebrew}
                  </button>
                ))}
              </div>
            </div>

            {/* Store Rankings List */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold">
                  דירוג חנויות {selectedCategoryId ? `- ${categories.find(c => c.id === selectedCategoryId)?.name_hebrew}` : ''}
                </h2>
              </div>

              <div className="p-4">
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner />
                  </div>
                )}

                {!loading && storeRankings.length === 0 && (
                  <div className="text-center py-8">
                    <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">אין נתוני דירוג זמינים</p>
                  </div>
                )}

                {!loading && storeRankings.length > 0 && (
                  <div className="space-y-4">
                    {storeRankings.map((ranking) => (
                      <div
                        key={ranking.retailer.id}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          ranking.rank === 1
                            ? 'border-yellow-300 bg-yellow-50'
                            : ranking.rank === 2
                            ? 'border-gray-300 bg-gray-50'
                            : ranking.rank === 3
                            ? 'border-orange-300 bg-orange-50'
                            : 'border-gray-200 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 rtl:space-x-reverse">
                            {/* Rank Badge */}
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                              ranking.rank === 1
                                ? 'bg-yellow-500 text-white'
                                : ranking.rank === 2
                                ? 'bg-gray-400 text-white'
                                : ranking.rank === 3
                                ? 'bg-orange-400 text-white'
                                : 'bg-gray-200 text-gray-700'
                            }`}>
                              {ranking.rank === 1 && <Crown className="w-6 h-6" />}
                              {ranking.rank === 2 && <Medal className="w-6 h-6" />}
                              {ranking.rank === 3 && <Award className="w-6 h-6" />}
                              {ranking.rank > 3 && ranking.rank}
                            </div>

                            {/* Store Info */}
                            <div>
                              <div className="font-bold text-lg text-gray-900">
                                {ranking.retailer.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {ranking.retailer.type === 'supermarket' ? 'סופרמרקט' : 
                                 ranking.retailer.type === 'butcher' ? 'קצבייה' :
                                 ranking.retailer.type === 'online' ? 'אונליין' : ranking.retailer.type}
                              </div>
                            </div>
                          </div>

                          <div className="text-left">
                            {/* Average Price */}
                            <div className="text-2xl font-bold text-gray-900">
                              {formatPrice(ranking.avgPrice)}
                            </div>
                            <div className="text-sm text-gray-500">ממוצע ק&quot;ג</div>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
                          <div className="text-center">
                            <div className="text-sm text-gray-600">דיווחי מחיר</div>
                            <div className="font-semibold">{ranking.reportCount}</div>
                          </div>

                          <div className="text-center">
                            <div className="text-sm text-gray-600">יתרון מחיר</div>
                            <div className={`font-semibold flex items-center justify-center ${
                              ranking.priceAdvantage > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {ranking.priceAdvantage > 0 ? (
                                <TrendingDown className="w-4 h-4 ml-1" />
                              ) : (
                                <TrendingUp className="w-4 h-4 ml-1" />
                              )}
                              {Math.abs(ranking.priceAdvantage).toFixed(1)}%
                            </div>
                          </div>

                          <div className="text-center">
                            <div className="text-sm text-gray-600">ביטחון</div>
                            <div className="flex justify-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < ranking.confidenceScore ? 'text-yellow-400' : 'text-gray-300'
                                  }`}
                                  fill="currentColor"
                                />
                              ))}
                            </div>
                          </div>

                          <div className="text-center">
                            <div className="text-sm text-gray-600">ביקורות קהילה</div>
                            <div className="flex items-center justify-center space-x-1 rtl:space-x-reverse">
                              <Heart className="w-4 h-4 text-red-500" />
                              <span className="font-semibold">{getStoreReviewsCount(ranking.retailer.id)}</span>
                            </div>
                            {getStoreAverageRating(ranking.retailer.id) > 0 && (
                              <div className="text-xs text-gray-500">
                                {getStoreAverageRating(ranking.retailer.id).toFixed(1)}/5
                              </div>
                            )}
                          </div>

                          <div className="text-center">
                            <div className="text-sm text-gray-600">קטגוריות</div>
                            <div className="font-semibold">
                              {Object.keys(ranking.categoryBreakdown).length}
                            </div>
                          </div>
                        </div>

                        {/* Community Actions */}
                        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                          <div className="flex items-center space-x-4 rtl:space-x-reverse">
                            <button
                              onClick={() => openReviewModal(ranking.retailer)}
                              className="flex items-center space-x-2 rtl:space-x-reverse px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                            >
                              <MessageSquare className="w-4 h-4" />
                              <span>כתוב ביקורת</span>
                            </button>
                            
                            {getStoreReviewsCount(ranking.retailer.id) > 0 && (
                              <button 
                                onClick={() => getStoreInsights(ranking.retailer.id)}
                                className="text-sm text-gray-600 hover:text-gray-900 underline"
                              >
                                ראה ביקורות ({getStoreReviewsCount(ranking.retailer.id)})
                              </button>
                            )}
                          </div>
                          
                          {getStoreAverageRating(ranking.retailer.id) > 0 && (
                            <div className="flex items-center space-x-1 rtl:space-x-reverse text-sm text-gray-600">
                              <span>דירוג קהילה:</span>
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3 h-3 ${
                                      i < Math.round(getStoreAverageRating(ranking.retailer.id)) 
                                        ? 'text-yellow-400 fill-current' 
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Category Breakdown */}
                        {!selectedCategoryId && Object.keys(ranking.categoryBreakdown).length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="text-sm text-gray-600 mb-2">פירוט לפי קטגוריות:</div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {Object.entries(ranking.categoryBreakdown).slice(0, 6).map(([catId, catData]) => (
                                <div key={catId} className="bg-gray-50 p-2 rounded text-center">
                                  <div className="text-xs text-gray-600">{catData.categoryName}</div>
                                  <div className="font-medium">{formatPrice(catData.avgPrice)}</div>
                                  <div className="text-xs text-gray-500">דירוג #{catData.rank}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* User Rankings Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">לוח מובילים - תורמי הקהילה</h2>
            </div>

            <div className="p-4">
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner />
                </div>
              )}

              {!loading && userRankings.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">אין נתוני משתמשים זמינים</p>
                </div>
              )}

              {!loading && userRankings.length > 0 && (
                <div className="space-y-3">
                  {userRankings.map((user) => (
                    <div
                      key={user.user_id}
                      className={`p-4 rounded-lg border transition-all ${
                        user.rank <= 3
                          ? 'border-yellow-300 bg-yellow-50'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 rtl:space-x-reverse">
                          {/* Rank */}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                            user.rank === 1
                              ? 'bg-yellow-500 text-white'
                              : user.rank === 2
                              ? 'bg-gray-400 text-white'
                              : user.rank === 3
                              ? 'bg-orange-400 text-white'
                              : 'bg-gray-200 text-gray-700'
                          }`}>
                            {user.rank}
                          </div>

                          {/* User Info */}
                          <div>
                            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                              <span className="font-semibold text-gray-900">
                                {user.display_name}
                              </span>
                              {getBadgeIcon(user.badge)}
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                {getBadgeLabel(user.badge)}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.total_reports} דיווחים • {user.verified_reports} מאומתים
                            </div>
                          </div>
                        </div>

                        <div className="text-left">
                          <div className="text-xl font-bold text-blue-600">
                            {user.reputation_score}
                          </div>
                          <div className="text-sm text-gray-500">נקודות</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Store Review Modal */}
        {showReviewModal && selectedRetailer && (
          <StoreReviewModal
            retailer={selectedRetailer}
            isOpen={showReviewModal}
            onClose={closeReviewModal}
          />
        )}
      </div>
    </div>
  )
}