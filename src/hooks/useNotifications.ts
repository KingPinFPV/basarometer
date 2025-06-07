'use client'

import { useState, useEffect, useCallback } from 'react'
// import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useMeatIndex } from '@/hooks/useMeatIndex'
import { usePriceData } from '@/hooks/usePriceData'
import { useShoppingList } from '@/hooks/useShoppingList'

export interface Notification {
  id: string
  type: 'price_alert' | 'deal_notification' | 'market_alert' | 'shopping_reminder' | 'community_update'
  title: string
  message: string
  severity: 'low' | 'medium' | 'high'
  read: boolean
  actionUrl?: string
  actionLabel?: string
  metadata?: Record<string, string | number>
  createdAt: string
  expiresAt?: string
}

export interface PriceAlert {
  id: string
  userId: string
  meatCutId: string
  targetPrice: number
  isActive: boolean
  createdAt: string
  lastTriggered?: string
}

export interface Deal {
  id: string
  meatCutId: string
  retailerId: string
  originalPrice: number
  salePrice: number
  discountPercent: number
  validUntil: string
  isActive: boolean
}

export interface PersonalizedDeal {
  id: string
  userId: string
  deal: Deal
  relevanceScore: number
  reason: string
}

export interface ShoppingAlert {
  id: string
  listId: string
  type: 'price_drop' | 'item_available' | 'optimal_time'
  message: string
  priority: number
}

export interface MarketAlert {
  id: string
  type: 'index_change' | 'volatility_spike' | 'seasonal_warning'
  title: string
  message: string
  severity: 'low' | 'medium' | 'high'
  affectedCategories: string[]
}

export function useNotifications() {
  const { user } = useAuth()
  const { currentIndex, priceAlerts: indexAlerts } = useMeatIndex()
  // const { marketAnomalies } = useMeatIndex()
  const { priceReports, meatCuts } = usePriceData()
  // const { retailers } = usePriceData()
  const { lists: shoppingLists } = useShoppingList()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([])
  const [deals] = useState<Deal[]>([])
  // const [setDeals] = useState<Deal[]>([])
  const [personalizedDeals, setPersonalizedDeals] = useState<PersonalizedDeal[]>([])
  const [shoppingAlerts, setShoppingAlerts] = useState<ShoppingAlert[]>([])
  const [marketAlerts] = useState<MarketAlert[]>([])
  // const [setMarketAlerts] = useState<MarketAlert[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch user notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      // In a real implementation, this would fetch from a notifications table
      // For now, we'll generate notifications based on current data
      const generatedNotifications = await generateNotifications()
      setNotifications(generatedNotifications)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת התראות')
    } finally {
      setLoading(false)
    }
  }, [user])

  // Generate notifications based on current data
  const generateNotifications = async (): Promise<Notification[]> => {
    const notifications: Notification[] = []

    // Price alerts
    if (indexAlerts.length > 0) {
      indexAlerts.forEach(alert => {
        notifications.push({
          id: `price-alert-${alert.id}`,
          type: 'price_alert',
          title: alert.title,
          message: alert.message,
          severity: alert.severity,
          read: false,
          actionUrl: '/trends',
          actionLabel: 'צפה במגמות',
          metadata: { alertId: alert.id },
          createdAt: alert.createdAt
        })
      })
    }

    // Market alerts
    if (currentIndex && currentIndex.indexValue > 70) {
      notifications.push({
        id: 'market-high-prices',
        type: 'market_alert',
        title: 'מחירים גבוהים במיוחד',
        message: `מדד הבשר עומד על ₪${currentIndex.indexValue.toFixed(2)} - גבוה משמעותית`,
        severity: 'high',
        read: false,
        actionUrl: '/index',
        actionLabel: 'צפה במדד',
        createdAt: new Date().toISOString()
      })
    }

    // Deal notifications
    const deals = await generateDeals()
    if (deals.length > 0) {
      notifications.push({
        id: 'new-deals',
        type: 'deal_notification',
        title: 'מבצעים חדשים זמינים',
        message: `נמצאו ${deals.length} מבצעים רלוונטיים עבורך`,
        severity: 'medium',
        read: false,
        actionUrl: '/deals',
        actionLabel: 'צפה במבצעים',
        createdAt: new Date().toISOString()
      })
    }

    // Shopping list reminders
    if (shoppingLists.length > 0) {
      const outdatedLists = shoppingLists.filter(list => {
        const daysSinceUpdate = (Date.now() - new Date(list.created_at).getTime()) / (1000 * 60 * 60 * 24)
        return daysSinceUpdate > 7
      })

      if (outdatedLists.length > 0) {
        notifications.push({
          id: 'shopping-reminder',
          type: 'shopping_reminder',
          title: 'רשימות קניות ישנות',
          message: `יש לך ${outdatedLists.length} רשימות שלא עודכנו השבוע`,
          severity: 'low',
          read: false,
          actionUrl: '/shopping-lists',
          actionLabel: 'עדכן רשימות',
          createdAt: new Date().toISOString()
        })
      }
    }

    // Community updates
    if (Math.random() > 0.7) { // Simulate occasional community updates
      notifications.push({
        id: 'community-update',
        type: 'community_update',
        title: 'עדכון קהילתי',
        message: 'דיווחים חדשים נוספו באזורך',
        severity: 'low',
        read: false,
        actionUrl: '/community',
        actionLabel: 'צפה בעדכונים',
        createdAt: new Date().toISOString()
      })
    }

    return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  // Generate current deals
  const generateDeals = async (): Promise<Deal[]> => {
    const deals: Deal[] = []

    // Simulate finding deals by looking for price variations
    const recentReports = priceReports.slice(-50)
    const priceGroups = new Map<string, number[]>()

    // Group prices by meat cut
    recentReports.forEach(report => {
      if (!priceGroups.has(report.meat_cut_id)) {
        priceGroups.set(report.meat_cut_id, [])
      }
      priceGroups.get(report.meat_cut_id)!.push(report.price_per_kg)
    })

    // Find potential deals (prices significantly below average)
    priceGroups.forEach((prices, meatCutId) => {
      if (prices.length < 3) return

      const avgPrice = prices && prices.length > 0 ? (prices || []).reduce((sum, price) => sum + price, 0) / prices.length : 0
      const minPrice = Math.min(...prices)
      const discountPercent = ((avgPrice - minPrice) / avgPrice) * 100

      if (discountPercent > 20) { // 20% or more discount
        const reportWithDeal = recentReports.find(r => 
          r.meat_cut_id === meatCutId && r.price_per_kg === minPrice
        )

        if (reportWithDeal) {
          deals.push({
            id: `deal-${meatCutId}-${Date.now()}`,
            meatCutId,
            retailerId: reportWithDeal.retailer_id,
            originalPrice: avgPrice,
            salePrice: minPrice,
            discountPercent: Math.round(discountPercent),
            validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
            isActive: true
          })
        }
      }
    })

    return deals.slice(0, 10) // Limit to 10 deals
  }

  // Create price alert
  const createPriceAlert = useCallback(async (
    meatCutId: string,
    targetPrice: number
  ): Promise<boolean> => {
    if (!user) return false

    try {
      // In real implementation, save to database
      const newAlert: PriceAlert = {
        id: `alert-${Date.now()}`,
        userId: user.id,
        meatCutId,
        targetPrice,
        isActive: true,
        createdAt: new Date().toISOString()
      }

      setPriceAlerts(prev => [...prev, newAlert])
      return true

    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה ביצירת התראה')
      return false
    }
  }, [user])

  // Remove price alert
  const removePriceAlert = useCallback(async (alertId: string): Promise<boolean> => {
    try {
      setPriceAlerts(prev => prev.filter(alert => alert.id !== alertId))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בהסרת התראה')
      return false
    }
  }, [])

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      )
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בעדכון התראה')
      return false
    }
  }, [])

  // Mark all notifications as read
  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    try {
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      )
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בעדכון התראות')
      return false
    }
  }, [])

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      setNotifications(prev =>
        prev.filter(notification => notification.id !== notificationId)
      )
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה במחיקת התראה')
      return false
    }
  }, [])

  // Get personalized deals for user
  const getPersonalizedDeals = useCallback(async (): Promise<PersonalizedDeal[]> => {
    if (!user) return []

    const deals = await generateDeals()
    const personalized: PersonalizedDeal[] = []

    // Score deals based on user's shopping history and preferences
    for (const deal of deals) {
      const meatCut = meatCuts.find(cut => cut.id === deal.meatCutId)
      if (!meatCut) continue

      // Simple scoring based on user's recent reports
      const userReports = priceReports.filter(report => 
        report.reported_by === user.id && report.meat_cut_id === deal.meatCutId
      )

      let relevanceScore = 0.5 // Base score

      // Boost score if user has reported this item before
      if (userReports.length > 0) {
        relevanceScore += 0.3
      }

      // Boost score for bigger discounts
      if (deal.discountPercent > 30) {
        relevanceScore += 0.2
      }

      // Boost score if item is in user's shopping lists
      // Simplified check - this functionality can be enhanced later
      const isInShoppingList = false
      if (isInShoppingList) {
        relevanceScore += 0.4
      }

      const reason = `${deal.discountPercent}% הנחה${isInShoppingList ? ' (ברשימת הקניות שלך)' : ''}`

      personalized.push({
        id: `personalized-${deal.id}`,
        userId: user.id,
        deal,
        relevanceScore: Math.min(1, relevanceScore),
        reason
      })
    }

    return personalized
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5) // Top 5 most relevant deals
  }, [user, meatCuts, priceReports, shoppingLists, generateDeals])

  // Check for price drops in shopping lists
  const checkShoppingListAlerts = useCallback(async (): Promise<ShoppingAlert[]> => {
    const alerts: ShoppingAlert[] = []

    // Simplified shopping list alerts - this functionality can be enhanced later
    // for (const list of shoppingLists) {
    //   // Logic for checking shopping list items
    // }

    return alerts
  }, [shoppingLists, priceReports, meatCuts])

  // Initialize data
  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [user, fetchNotifications])

  // Check for new alerts periodically (reduced frequency)
  useEffect(() => {
    if (!user) return

    const interval = setInterval(async () => {
      try {
        const newDeals = await getPersonalizedDeals()
        setPersonalizedDeals(newDeals)

        const shoppingAlerts = await checkShoppingListAlerts()
        setShoppingAlerts(shoppingAlerts)
      } catch (error) {
        console.warn('Failed to update notifications:', error)
      }
    }, 15 * 60 * 1000) // Check every 15 minutes (reduced from 5)

    return () => clearInterval(interval)
  }, [user, getPersonalizedDeals, checkShoppingListAlerts])

  return {
    // State
    notifications,
    priceAlerts,
    deals,
    personalizedDeals,
    shoppingAlerts,
    marketAlerts,
    loading,
    error,

    // Actions
    fetchNotifications,
    createPriceAlert,
    removePriceAlert,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getPersonalizedDeals,
    checkShoppingListAlerts,

    // Computed
    unreadCount: notifications.filter(n => !n.read).length,
    highPriorityCount: notifications.filter(n => n.severity === 'high' && !n.read).length,
    hasUnread: notifications.some(n => !n.read),
    activeAlertsCount: priceAlerts.filter(alert => alert.isActive).length,
    availableDealsCount: personalizedDeals.length
  }
}