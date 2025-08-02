// Mobile-Optimized Homepage with Touch Gestures
// Phase 3 UX Enhancement - Complete mobile-first experience
// Hebrew voice search, swipe gestures, haptic feedback

'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Star,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  MapPin,
  Mic,
  MicOff,
  Menu,
  X,
  Heart,
  Share2,
  Settings,
  TrendingUp,
  Clock,
  Zap
} from 'lucide-react'

// Import our new enhanced components
import EnhancedComparisonTable from './EnhancedComparisonTable'
import SmartFilterPanel from './SmartFilterPanel'
import PriceVisualization from './PriceVisualization'
import QuickCompareDrawer from './QuickCompareDrawer'
import NetworkSelectorGrid from './NetworkSelectorGrid'
import { useEnhancedMeatData } from '@/hooks/useEnhancedMeatData'
import { usePriceMatrixData } from '@/hooks/usePriceMatrixData'

interface TouchPosition {
  x: number
  y: number
  timestamp: number
}

interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down'
  distance: number
  velocity: number
}

interface FilterState {
  search: string
  location: string
  priceRange: [number, number]
  quality: string[]
  networks: string[]
  dietary: string[]
  timePreference: string
  showOnlyOffers: boolean
  showOnlyNearby: boolean
  showOnlyInStock: boolean
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

interface HomePageState {
  activeView: 'comparison' | 'visualization' | 'networks'
  quickCompareProducts: string[]
  isQuickCompareOpen: boolean
  isFilterPanelOpen: boolean
  isPullToRefreshActive: boolean
  lastRefreshTime: number
}

const SWIPE_THRESHOLD = 50
const SWIPE_VELOCITY_THRESHOLD = 0.5
const HAPTIC_FEEDBACK_ENABLED = typeof navigator !== 'undefined' && 'vibrate' in navigator

export default function MobileOptimizedHomepage() {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    location: '',
    priceRange: [0, 200],
    quality: [],
    networks: [],
    dietary: [],
    timePreference: 'anytime',
    showOnlyOffers: false,
    showOnlyNearby: false,
    showOnlyInStock: true,
    sortBy: 'popularity',
    sortOrder: 'desc'
  })

  const [homePageState, setHomePageState] = useState<HomePageState>({
    activeView: 'comparison',
    quickCompareProducts: [],
    isQuickCompareOpen: false,
    isFilterPanelOpen: false,
    isPullToRefreshActive: false,
    lastRefreshTime: Date.now()
  })

  const [touchState, setTouchState] = useState<{
    startPosition: TouchPosition | null
    isScrolling: boolean
  }>({
    startPosition: null,
    isScrolling: false
  })

  const containerRef = useRef<HTMLDivElement>(null)
  const pullRefreshRef = useRef<HTMLDivElement>(null)

  // Enhanced data hooks
  const { 
    enhancedMeatData, 
    marketInsights,
    loading: meatLoading,
    refetch: refetchMeatData
  } = useEnhancedMeatData()
  
  const { 
    priceMatrix, 
    loading: priceLoading,
    refetch: refetchPriceData
  } = usePriceMatrixData()

  // Haptic feedback function
  const triggerHapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30]
      }
      navigator.vibrate(patterns[type])
    }
  }, [])

  // Pull to refresh functionality
  const handlePullToRefresh = useCallback(async () => {
    if (homePageState.isPullToRefreshActive) return

    setHomePageState(prev => ({ ...prev, isPullToRefreshActive: true }))
    triggerHapticFeedback('medium')

    try {
      await Promise.all([
        refetchMeatData(),
        refetchPriceData()
      ])
      
      setHomePageState(prev => ({ 
        ...prev, 
        lastRefreshTime: Date.now() 
      }))
      
      triggerHapticFeedback('light')
    } catch (error) {
      console.error('Refresh failed:', error)
      triggerHapticFeedback('heavy')
    } finally {
      setTimeout(() => {
        setHomePageState(prev => ({ ...prev, isPullToRefreshActive: false }))
      }, 500)
    }
  }, [homePageState.isPullToRefreshActive, refetchMeatData, refetchPriceData, triggerHapticFeedback])

  // Touch gesture handling
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    setTouchState({
      startPosition: {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now()
      },
      isScrolling: false
    })
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchState.startPosition) return

    const touch = e.touches[0]
    const deltaY = touch.clientY - touchState.startPosition.y
    const deltaX = touch.clientX - touchState.startPosition.x

    // Detect scrolling vs gestures
    if (Math.abs(deltaY) > 10) {
      setTouchState(prev => ({ ...prev, isScrolling: true }))
    }

    // Pull to refresh gesture
    if (deltaY > 0 && window.scrollY === 0 && !touchState.isScrolling) {
      e.preventDefault()
      const pullDistance = Math.min(deltaY * 0.5, 100)
      
      if (pullRefreshRef.current) {
        pullRefreshRef.current.style.transform = `translateY(${pullDistance}px)`
        pullRefreshRef.current.style.opacity = String(pullDistance / 100)
      }

      if (pullDistance > 60 && !homePageState.isPullToRefreshActive) {
        triggerHapticFeedback('light')
      }
    }
  }, [touchState, homePageState.isPullToRefreshActive, triggerHapticFeedback])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchState.startPosition) return

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchState.startPosition.x
    const deltaY = touch.clientY - touchState.startPosition.y
    const deltaTime = Date.now() - touchState.startPosition.timestamp
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const velocity = distance / deltaTime

    // Reset pull refresh visual
    if (pullRefreshRef.current) {
      pullRefreshRef.current.style.transform = 'translateY(0)'
      pullRefreshRef.current.style.opacity = '0'
    }

    // Pull to refresh trigger
    if (deltaY > 60 && window.scrollY === 0 && !touchState.isScrolling) {
      handlePullToRefresh()
    }

    // Horizontal swipe gestures for view switching
    if (!touchState.isScrolling && Math.abs(deltaX) > SWIPE_THRESHOLD && velocity > SWIPE_VELOCITY_THRESHOLD) {
      const views: Array<'comparison' | 'visualization' | 'networks'> = ['comparison', 'visualization', 'networks']
      const currentIndex = views.indexOf(homePageState.activeView)
      
      if (deltaX < 0 && currentIndex < views.length - 1) {
        // Swipe left - next view
        setHomePageState(prev => ({ ...prev, activeView: views[currentIndex + 1] }))
        triggerHapticFeedback('light')
      } else if (deltaX > 0 && currentIndex > 0) {
        // Swipe right - previous view
        setHomePageState(prev => ({ ...prev, activeView: views[currentIndex - 1] }))
        triggerHapticFeedback('light')
      }
    }

    setTouchState({ startPosition: null, isScrolling: false })
  }, [touchState, homePageState.activeView, handlePullToRefresh, triggerHapticFeedback])

  // Quick compare functions
  const addToQuickCompare = useCallback((productId: string) => {
    if (homePageState.quickCompareProducts.includes(productId)) return
    
    setHomePageState(prev => ({
      ...prev,
      quickCompareProducts: [...prev.quickCompareProducts, productId]
    }))
    triggerHapticFeedback('light')
  }, [homePageState.quickCompareProducts, triggerHapticFeedback])

  const removeFromQuickCompare = useCallback((productId: string) => {
    setHomePageState(prev => ({
      ...prev,
      quickCompareProducts: prev.quickCompareProducts.filter(id => id !== productId)
    }))
    triggerHapticFeedback('light')
  }, [triggerHapticFeedback])

  // View switching with haptic feedback
  const switchView = useCallback((view: 'comparison' | 'visualization' | 'networks') => {
    setHomePageState(prev => ({ ...prev, activeView: view }))
    triggerHapticFeedback('light')
  }, [triggerHapticFeedback])

  // Convert enhanced meat data to products for quick compare
  const products = enhancedMeatData?.map(meat => {
    const networkPrices: Record<string, number> = {}
    const priceData = priceMatrix?.[meat.id] || {}
    
    Object.entries(priceData).forEach(([networkId, price]) => {
      if (typeof price === 'number' && !isNaN(price)) {
        networkPrices[networkId] = price
      }
    })
    
    const prices = Object.values(networkPrices).filter(p => p > 0)
    const bestPrice = prices.length > 0 ? Math.min(...prices) : 0
    const worstPrice = prices.length > 0 ? Math.max(...prices) : 0
    const savingsPotential = worstPrice > 0 ? ((worstPrice - bestPrice) / worstPrice) * 100 : 0
    
    return {
      id: meat.id,
      name_hebrew: meat.name_hebrew,
      name_english: meat.name_english,
      quality_tier: meat.quality_grades?.[0]?.tier || 'regular',
      best_price: bestPrice,
      worst_price: worstPrice,
      avg_price: prices.length > 0 ? prices.reduce((sum, p) => sum + p, 0) / prices.length : 0,
      trend: meat.trending_direction || 'stable' as const,
      availability: Object.keys(networkPrices).length,
      is_popular: meat.is_popular,
      network_prices: networkPrices,
      savings_potential: savingsPotential,
      last_updated: new Date().toISOString()
    }
  }).filter(product => product.availability > 0) || []

  const quickCompareProductData = products.filter(p => homePageState.quickCompareProducts.includes(p.id))

  const loading = meatLoading || priceLoading

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-gray-50"
      dir="rtl"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to Refresh Indicator */}
      <div
        ref={pullRefreshRef}
        className="fixed top-0 left-1/2 transform -translate-x-1/2 z-30 bg-white rounded-full shadow-lg p-3 opacity-0 transition-all duration-200"
      >
        <RefreshCw className={`w-6 h-6 text-blue-600 ${homePageState.isPullToRefreshActive ? 'animate-spin' : ''}`} />
      </div>

      {/* Enhanced Header with Mobile Actions */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-gray-900">בשרומטר</h1>
            
            <div className="flex items-center gap-2">
              {/* Quick Compare Badge */}
              {homePageState.quickCompareProducts.length > 0 && (
                <button
                  onClick={() => setHomePageState(prev => ({ ...prev, isQuickCompareOpen: true }))}
                  className="relative bg-blue-600 text-white rounded-full px-3 py-1.5 text-sm font-medium transition-all active:scale-95"
                >
                  השווה ({homePageState.quickCompareProducts.length})
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                </button>
              )}

              {/* Filter Toggle */}
              <button
                onClick={() => setHomePageState(prev => ({ ...prev, isFilterPanelOpen: !prev.isFilterPanelOpen }))}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-all active:scale-95"
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-blue-600">
                {enhancedMeatData?.length || 0}
              </div>
              <div className="text-xs text-gray-600">מוצרים</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">
                {marketInsights?.active_retailers || 8}
              </div>
              <div className="text-xs text-gray-600">רשתות</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-600">
                {Math.round((marketInsights?.avg_confidence || 0) * 100)}%
              </div>
              <div className="text-xs text-gray-600">דיוק</div>
            </div>
          </div>
        </div>

        {/* View Switcher with Swipe Indicator */}
        <div className="px-4 pb-3">
          <div className="flex rounded-lg bg-gray-100 p-1">
            {[
              { id: 'comparison', label: 'השוואה', icon: Grid3X3 },
              { id: 'visualization', label: 'ניתוח', icon: TrendingUp },
              { id: 'networks', label: 'רשתות', icon: MapPin }
            ].map(view => (
              <button
                key={view.id}
                onClick={() => switchView(view.id as any)}
                className={`flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-md text-sm font-medium transition-all active:scale-95 ${
                  homePageState.activeView === view.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                <view.icon className="w-4 h-4" />
                {view.label}
              </button>
            ))}
          </div>
          
          {/* Swipe Hint */}
          <div className="text-center mt-2">
            <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
              <ArrowUp className="w-3 h-3" />
              החלק למעלה לרענון • החלק לצדדים למעבר בין תצוגות
              <ArrowDown className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>

      {/* Smart Filter Panel */}
      {homePageState.isFilterPanelOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-full max-w-md h-full bg-white shadow-xl transform transition-transform duration-300">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">סינון וחיפוש</h2>
              <button
                onClick={() => setHomePageState(prev => ({ ...prev, isFilterPanelOpen: false }))}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SmartFilterPanel
                filters={filters}
                onFiltersChange={setFilters}
                className="border-0 shadow-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="pb-20">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">טוען נתונים...</p>
            </div>
          </div>
        ) : (
          <div className="px-4 py-6">
            {homePageState.activeView === 'comparison' && (
              <EnhancedComparisonTable />
            )}
            
            {homePageState.activeView === 'visualization' && enhancedMeatData && enhancedMeatData.length > 0 && (
              <PriceVisualization
                productId={enhancedMeatData[0].id}
                currentPrices={priceMatrix?.[enhancedMeatData[0].id] || {}}
                className="shadow-sm"
              />
            )}
            
            {homePageState.activeView === 'networks' && (
              <NetworkSelectorGrid
                selectedNetworks={filters.networks}
                onNetworkToggle={(networkId) => {
                  setFilters(prev => ({
                    ...prev,
                    networks: prev.networks.includes(networkId)
                      ? prev.networks.filter(id => id !== networkId)
                      : [...prev.networks, networkId]
                  }))
                }}
                onNetworkSelect={(networkId) => {
                  setFilters(prev => ({ ...prev, networks: [networkId] }))
                }}
                showDetails={true}
                className="space-y-4"
              />
            )}
          </div>
        )}
      </div>

      {/* Quick Compare Drawer */}
      <QuickCompareDrawer
        isOpen={homePageState.isQuickCompareOpen}
        onClose={() => setHomePageState(prev => ({ ...prev, isQuickCompareOpen: false }))}
        products={quickCompareProductData}
        onAddProduct={addToQuickCompare}
        onRemoveProduct={removeFromQuickCompare}
      />

      {/* Floating Action Button - Add to Compare */}
      {!homePageState.isQuickCompareOpen && homePageState.activeView === 'comparison' && (
        <div className="fixed bottom-6 left-6 z-30">
          <button
            onClick={() => setHomePageState(prev => ({ ...prev, isQuickCompareOpen: true }))}
            className="bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-all active:scale-95"
          >
            <Heart className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Performance Indicator */}
      <div className="fixed bottom-6 right-6 z-30">
        <div className="bg-white rounded-full shadow-lg p-2 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
          <span className="text-xs text-gray-600">
            {new Date(homePageState.lastRefreshTime).toLocaleTimeString('he-IL', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>
      </div>
    </div>
  )
}