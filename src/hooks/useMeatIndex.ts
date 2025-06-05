'use client'

import { useState, useEffect, useMemo } from 'react'
// import { supabase } from '@/lib/supabase'
import { usePriceData } from '@/hooks/usePriceData'

export interface MeatIndexData {
  date: string
  indexValue: number
  beefAverage: number
  chickenAverage: number
  lambAverage: number
  turkeyAverage: number
  porkAverage: number
  totalReports: number
  marketVolatility: number
  economicTrend: 'bullish' | 'bearish' | 'stable'
}

export interface CategoryAverage {
  categoryId: string
  categoryName: string
  averagePrice: number
  reportCount: number
  priceChange: number
  trend: 'up' | 'down' | 'stable'
}

export interface PricePrediction {
  timeframe: '1w' | '1m' | '3m'
  predictedIndex: number
  confidence: number
  factors: string[]
  recommendation: string
}

export interface InflationAnalysis {
  monthlyInflation: number
  yearlyInflation: number
  comparedToGeneral: number
  meatInflationTrend: 'higher' | 'lower' | 'similar'
  impact: string
}

export interface SeasonalPattern {
  month: number
  monthName: string
  typicalIndexChange: number
  seasonalFactor: number
  recommendations: string[]
}

export interface PriceAlert {
  id: string
  type: 'significant_drop' | 'significant_rise' | 'unusual_activity' | 'seasonal_warning'
  title: string
  message: string
  severity: 'low' | 'medium' | 'high'
  affectedCategories: string[]
  actionRecommendation: string
  createdAt: string
}

export interface MarketAnomaly {
  id: string
  type: 'price_spike' | 'unusual_pattern' | 'data_inconsistency'
  description: string
  affectedStores: string[]
  detectionConfidence: number
  suggestedAction: string
}

export function useMeatIndex() {
  const { priceReports, meatCuts, loading: priceDataLoading } = usePriceData()
  
  const [indexHistory, setIndexHistory] = useState<MeatIndexData[]>([])
  const [currentIndex, setCurrentIndex] = useState<MeatIndexData | null>(null)
  const [categoryAverages] = useState<CategoryAverage[]>([])
  // const [setCategoryAverages] = useState<CategoryAverage[]>([])
  const [predictions, setPredictions] = useState<Map<string, PricePrediction>>(new Map())
  const [inflationAnalysis, setInflationAnalysis] = useState<InflationAnalysis | null>(null)
  const [seasonalPatterns, setSeasonalPatterns] = useState<SeasonalPattern[]>([])
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([])
  const [marketAnomalies, setMarketAnomalies] = useState<MarketAnomaly[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate today's meat index
  const calculateDailyIndex = useMemo(() => {
    if (!priceReports.length || !meatCuts.length) return null

    const today = new Date().toISOString().split('T')[0]
    const todayReports = priceReports.filter(report => 
      report.created_at.split('T')[0] === today
    )

    if (todayReports.length === 0) {
      // Use most recent reports if no data today
      const sortedReports = [...priceReports].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      const recentReports = sortedReports.slice(0, Math.min(50, sortedReports.length))
      return calculateIndexFromReports(recentReports, today)
    }

    return calculateIndexFromReports(todayReports, today)
  }, [priceReports, meatCuts])

  const calculateIndexFromReports = (reports: Array<{ meat_cut_id: string; price_per_kg: number }>, date: string): MeatIndexData => {
    // Group reports by category
    const categoryGroups = new Map<string, number[]>()
    const categoryNames = new Map<string, string>()

    reports.forEach(report => {
      const cut = meatCuts.find(c => c.id === report.meat_cut_id)
      if (!cut) return

      const categoryId = cut.category_id
      if (!categoryGroups.has(categoryId)) {
        categoryGroups.set(categoryId, [])
        // Map category IDs to readable names
        categoryNames.set(categoryId, getCategoryName(categoryId))
      }
      categoryGroups.get(categoryId)!.push(report.price_per_kg)
    })

    // Calculate category averages
    const categoryAverages = new Map<string, number>()
    categoryGroups.forEach((prices, categoryId) => {
      const average = prices.reduce((sum, price) => sum + price, 0) / prices.length
      categoryAverages.set(categoryId, average / 100) // Convert to shekels
    })

    // Calculate weighted index (100 = baseline, representing average price)
    const weights = {
      beef: 0.35,      // Most consumed, highest weight
      chicken: 0.25,   // Very popular
      lamb: 0.20,      // Traditional favorite
      turkey: 0.15,    // Growing popularity
      pork: 0.05       // Least consumed in Israel
    }

    let weightedSum = 0
    let totalWeight = 0

    categoryAverages.forEach((average, categoryId) => {
      const categoryName = categoryNames.get(categoryId) || ''
      let weight = 0.1 // Default weight
      
      if (categoryName.includes('בקר') || categoryName.includes('beef')) weight = weights.beef
      else if (categoryName.includes('עוף') || categoryName.includes('chicken')) weight = weights.chicken
      else if (categoryName.includes('כבש') || categoryName.includes('lamb')) weight = weights.lamb
      else if (categoryName.includes('הודו') || categoryName.includes('turkey')) weight = weights.turkey
      else if (categoryName.includes('חזיר') || categoryName.includes('pork')) weight = weights.pork

      weightedSum += average * weight
      totalWeight += weight
    })

    const indexValue = totalWeight > 0 ? (weightedSum / totalWeight) : 0

    // Calculate individual category averages
    const beefAverage = getCategoryAverage(categoryGroups, categoryNames, 'בקר') || 0
    const chickenAverage = getCategoryAverage(categoryGroups, categoryNames, 'עוף') || 0
    const lambAverage = getCategoryAverage(categoryGroups, categoryNames, 'כבש') || 0
    const turkeyAverage = getCategoryAverage(categoryGroups, categoryNames, 'הודו') || 0
    const porkAverage = getCategoryAverage(categoryGroups, categoryNames, 'חזיר') || 0

    // Calculate market volatility (standard deviation of prices)
    const allPrices = reports.map(r => r.price_per_kg / 100)
    const priceStdDev = calculateStandardDeviation(allPrices)
    const marketVolatility = (priceStdDev / indexValue) * 100

    // Determine economic trend
    let economicTrend: 'bullish' | 'bearish' | 'stable' = 'stable'
    if (marketVolatility > 15) {
      economicTrend = indexValue > 65 ? 'bearish' : 'bullish'
    }

    return {
      date,
      indexValue: Math.round(indexValue * 100) / 100,
      beefAverage,
      chickenAverage,
      lambAverage,
      turkeyAverage,
      porkAverage,
      totalReports: reports.length,
      marketVolatility: Math.round(marketVolatility * 100) / 100,
      economicTrend
    }
  }

  const getCategoryName = (categoryId: string): string => {
    // This would normally come from a categories lookup
    // For now, we'll use basic mapping
    const categoryMap: Record<string, string> = {
      'beef': 'בקר',
      'chicken': 'עוף', 
      'lamb': 'כבש',
      'turkey': 'הודו',
      'pork': 'חזיר'
    }
    return categoryMap[categoryId] || 'כללי'
  }

  const getCategoryAverage = (
    categoryGroups: Map<string, number[]>, 
    categoryNames: Map<string, string>, 
    searchTerm: string
  ): number => {
    for (const [categoryId, prices] of categoryGroups) {
      const categoryName = categoryNames.get(categoryId) || ''
      if (categoryName.includes(searchTerm)) {
        return prices.reduce((sum, price) => sum + price, 0) / prices.length / 100
      }
    }
    return 0
  }

  const calculateStandardDeviation = (values: number[]): number => {
    if (values.length === 0) return 0
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2))
    const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length
    return Math.sqrt(avgSquaredDiff)
  }

  // Generate price predictions
  const predictPriceTrends = (timeframe: '1w' | '1m' | '3m'): PricePrediction => {
    if (!currentIndex) {
      return {
        timeframe,
        predictedIndex: 0,
        confidence: 0,
        factors: [],
        recommendation: 'אין מספיק נתונים לחיזוי'
      }
    }

    const { indexValue, economicTrend, marketVolatility } = currentIndex

    // Simple prediction logic based on trends and seasonality
    let predictedChange = 0
    let confidence = 75 // Base confidence

    // Trend-based prediction
    if (economicTrend === 'bullish') {
      predictedChange = timeframe === '1w' ? 2 : timeframe === '1m' ? 5 : 8
    } else if (economicTrend === 'bearish') {
      predictedChange = timeframe === '1w' ? -2 : timeframe === '1m' ? -5 : -8
    }

    // Volatility adjustment
    if (marketVolatility > 20) {
      confidence -= 20
      predictedChange *= 1.5 // Higher volatility = more extreme predictions
    } else if (marketVolatility < 5) {
      confidence += 10
    }

    // Seasonal adjustments
    const currentMonth = new Date().getMonth()
    if (currentMonth >= 8 && currentMonth <= 10) { // Sep-Nov (holidays)
      predictedChange += 3
    } else if (currentMonth >= 5 && currentMonth <= 7) { // Jun-Aug (summer)
      predictedChange -= 2
    }

    const predictedIndex = indexValue + predictedChange
    
    const factors = [
      `מגמה כלכלית: ${economicTrend === 'bullish' ? 'חיובית' : economicTrend === 'bearish' ? 'שלילית' : 'יציבה'}`,
      `תנודתיות שוק: ${marketVolatility > 15 ? 'גבוהה' : 'נמוכה'}`,
      `גורם עונתי: ${getSeasonalFactor(currentMonth)}`
    ]

    const recommendation = generateRecommendation(predictedChange, confidence)

    return {
      timeframe,
      predictedIndex: Math.round(predictedIndex * 100) / 100,
      confidence: Math.max(20, Math.min(95, confidence)),
      factors,
      recommendation
    }
  }

  const getSeasonalFactor = (month: number): string => {
    if (month >= 8 && month <= 10) return 'עונת חגים - עלייה צפויה'
    if (month >= 5 && month <= 7) return 'קיץ - יציבות יחסית'
    if (month >= 11 || month <= 1) return 'חורף - תנודות מזג אוויר'
    return 'תקופה רגילה'
  }

  const generateRecommendation = (predictedChange: number, confidence: number): string => {
    if (confidence < 50) {
      return 'המלצה: המתן לנתונים נוספים לפני קבלת החלטות'
    }

    if (predictedChange > 5) {
      return 'המלצה: שקול רכישה מוקדמת לפני העלייה הצפויה'
    } else if (predictedChange < -5) {
      return 'המלצה: דחה רכישות גדולות - ירידת מחירים צפויה'
    } else {
      return 'המלצה: מחירים יציבים - זמן טוב לרכישה רגילה'
    }
  }

  // Calculate inflation analysis
  const calculateInflationAnalysis = (): InflationAnalysis => {
    if (indexHistory.length < 30) {
      return {
        monthlyInflation: 0,
        yearlyInflation: 0,
        comparedToGeneral: 0,
        meatInflationTrend: 'similar',
        impact: 'אין מספיק נתונים היסטוריים'
      }
    }

    // Calculate monthly and yearly changes
    const latest = indexHistory[indexHistory.length - 1]
    const oneMonthAgo = indexHistory[Math.max(0, indexHistory.length - 30)]
    const oneYearAgo = indexHistory[Math.max(0, indexHistory.length - 365)]

    const monthlyInflation = ((latest.indexValue - oneMonthAgo.indexValue) / oneMonthAgo.indexValue) * 100
    const yearlyInflation = ((latest.indexValue - oneYearAgo.indexValue) / oneYearAgo.indexValue) * 100

    // Compare to general Israeli inflation (approximately 3-4% annually)
    const generalInflation = 3.5
    const comparedToGeneral = yearlyInflation - generalInflation

    let meatInflationTrend: 'higher' | 'lower' | 'similar' = 'similar'
    if (Math.abs(comparedToGeneral) < 1) meatInflationTrend = 'similar'
    else if (comparedToGeneral > 1) meatInflationTrend = 'higher'
    else meatInflationTrend = 'lower'

    const impact = generateInflationImpact(yearlyInflation)

    return {
      monthlyInflation: Math.round(monthlyInflation * 100) / 100,
      yearlyInflation: Math.round(yearlyInflation * 100) / 100,
      comparedToGeneral: Math.round(comparedToGeneral * 100) / 100,
      meatInflationTrend,
      impact
    }
  }

  const generateInflationImpact = (yearlyInflation: number): string => {
    if (yearlyInflation > 10) {
      return 'אינפלציה גבוהה במיוחד - משפיעה משמעותית על תקציב המשפחה'
    } else if (yearlyInflation > 5) {
      return 'אינפלציה גבוהה - מומלץ לתכנן קניות בזהירות'
    } else if (yearlyInflation < 0) {
      return 'דפלציה - מחירי הבשר יורדים, זמן טוב לצריכה'
    } else {
      return 'אינפלציה מתונה - תואמת למצב הכלכלי הכללי'
    }
  }

  // Generate seasonal patterns
  const generateSeasonalPatterns = (): SeasonalPattern[] => {
    const months = [
      'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
      'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
    ]

    return months.map((monthName, index) => {
      let typicalIndexChange = 0
      let seasonalFactor = 1.0
      let recommendations: string[] = []

      // Israeli seasonal patterns
      if (index >= 8 && index <= 10) { // Sep-Nov (High holidays)
        typicalIndexChange = 5
        seasonalFactor = 1.1
        recommendations = ['עלייה בביקוש לבשר איכותי', 'מומלץ לקנות מוקדם', 'מחירי כשרות עלולים לעלות']
      } else if (index >= 5 && index <= 7) { // Jun-Aug (Summer)
        typicalIndexChange = -2
        seasonalFactor = 0.95
        recommendations = ['עונת גריל - ביקוש גבוה לבשר צלייה', 'מחירי עוף יציבים', 'הקפדה על קירור']
      } else if (index >= 11 || index <= 1) { // Dec-Feb (Winter)
        typicalIndexChange = 3
        seasonalFactor = 1.05
        recommendations = ['עלייה בביקוש לבשר בישול', 'מחירים עולים בגלל מזג אוויר', 'מומלץ לקנות כמויות גדולות']
      } else { // Spring
        typicalIndexChange = 0
        seasonalFactor = 1.0
        recommendations = ['תקופה יציבה', 'זמן טוב לרכישות שגרתיות', 'פסח עלול להשפיע על כשרות']
      }

      return {
        month: index + 1,
        monthName,
        typicalIndexChange: Math.round(typicalIndexChange * 100) / 100,
        seasonalFactor: Math.round(seasonalFactor * 100) / 100,
        recommendations
      }
    })
  }

  // Generate price alerts
  const generatePriceAlerts = (): PriceAlert[] => {
    if (!currentIndex) return []

    const alerts: PriceAlert[] = []
    const { indexValue, marketVolatility } = currentIndex
    // const { economicTrend } = currentIndex

    // Significant price change alert
    if (indexValue > 70) {
      alerts.push({
        id: 'high-prices-alert',
        type: 'significant_rise',
        title: 'מחירים גבוהים במיוחד',
        message: `מדד הבשר עומד על ${indexValue} - גבוה משמעותיות מהממוצע`,
        severity: 'high',
        affectedCategories: ['כל הקטגוריות'],
        actionRecommendation: 'שקול דחיית רכישות גדולות או חיפוש אחר מבצעים',
        createdAt: new Date().toISOString()
      })
    } else if (indexValue < 45) {
      alerts.push({
        id: 'low-prices-alert',
        type: 'significant_drop',
        title: 'מחירים נמוכים במיוחד',
        message: `מדד הבשר עומד על ${indexValue} - הזדמנות לרכישה`,
        severity: 'medium',
        affectedCategories: ['כל הקטגוריות'],
        actionRecommendation: 'זמן מצוין לרכישת כמויות גדולות ואחסון',
        createdAt: new Date().toISOString()
      })
    }

    // High volatility alert
    if (marketVolatility > 25) {
      alerts.push({
        id: 'volatility-alert',
        type: 'unusual_activity',
        title: 'תנודתיות גבוהה בשוק',
        message: `השוק חווה תנודתיות של ${marketVolatility}% - שינויי מחיר משמעותיים`,
        severity: 'medium',
        affectedCategories: ['כל הקטגוריות'],
        actionRecommendation: 'המתן ליציבות לפני רכישות גדולות',
        createdAt: new Date().toISOString()
      })
    }

    // Seasonal warning
    const currentMonth = new Date().getMonth()
    if (currentMonth === 7) { // August - before holidays
      alerts.push({
        id: 'seasonal-warning',
        type: 'seasonal_warning',
        title: 'התכוננות לעונת החגים',
        message: 'מחירי הבשר צפויים לעלות לקראת החגים בספטמבר',
        severity: 'low',
        affectedCategories: ['בקר', 'כבש'],
        actionRecommendation: 'שקול רכישה מוקדמת לחגים',
        createdAt: new Date().toISOString()
      })
    }

    return alerts
  }

  // Detect market anomalies
  const detectAnomalies = (): MarketAnomaly[] => {
    const anomalies: MarketAnomaly[] = []

    if (!currentIndex || priceReports.length < 10) return anomalies

    // Detect unusual price spikes
    const recentPrices = priceReports
      .slice(-20)
      .map(r => r.price_per_kg / 100)
    
    const avgPrice = recentPrices.reduce((sum, p) => sum + p, 0) / recentPrices.length
    const maxPrice = Math.max(...recentPrices)

    if (maxPrice > avgPrice * 1.5) {
      anomalies.push({
        id: 'price-spike-detected',
        type: 'price_spike',
        description: `זוהתה זינוק מחיר חריג - מחיר של ₪${maxPrice.toFixed(2)} לעומת ממוצע של ₪${avgPrice.toFixed(2)}`,
        affectedStores: ['נדרש בדיקה'],
        detectionConfidence: 85,
        suggestedAction: 'בדוק אמינות הדיווח ומקור המידע'
      })
    }

    return anomalies
  }

  // Fetch historical index data
  const fetchIndexHistory = async () => {
    try {
      // For now, generate synthetic historical data
      // In production, this would fetch from meat_index_daily table
      const history: MeatIndexData[] = []
      const today = new Date()
      
      for (let i = 30; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        
        // Generate realistic index values with some variation
        const baseIndex = 55 + Math.sin(i / 10) * 10 + (Math.random() - 0.5) * 8
        
        history.push({
          date: date.toISOString().split('T')[0],
          indexValue: Math.round(baseIndex * 100) / 100,
          beefAverage: baseIndex * 1.2,
          chickenAverage: baseIndex * 0.7,
          lambAverage: baseIndex * 1.5,
          turkeyAverage: baseIndex * 0.9,
          porkAverage: baseIndex * 1.1,
          totalReports: Math.floor(Math.random() * 20) + 10,
          marketVolatility: Math.random() * 20,
          economicTrend: baseIndex > 60 ? 'bearish' : baseIndex < 50 ? 'bullish' : 'stable'
        })
      }
      
      setIndexHistory(history)
    } catch (err) {
      console.error('Failed to fetch index history:', err)
    }
  }

  // Initialize data
  useEffect(() => {
    if (!priceDataLoading && priceReports.length > 0) {
      setLoading(true)
      
      try {
        // Set current index
        if (calculateDailyIndex) {
          setCurrentIndex(calculateDailyIndex)
        }

        // Generate predictions
        const weekPrediction = predictPriceTrends('1w')
        const monthPrediction = predictPriceTrends('1m')
        const quarterPrediction = predictPriceTrends('3m')
        
        setPredictions(new Map([
          ['1w', weekPrediction],
          ['1m', monthPrediction],
          ['3m', quarterPrediction]
        ]))

        // Generate seasonal patterns
        setSeasonalPatterns(generateSeasonalPatterns())

        // Generate alerts
        setPriceAlerts(generatePriceAlerts())

        // Detect anomalies
        setMarketAnomalies(detectAnomalies())

        // Fetch historical data
        fetchIndexHistory()

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to calculate index')
      } finally {
        setLoading(false)
      }
    }
  }, [priceDataLoading, priceReports, calculateDailyIndex, detectAnomalies, generatePriceAlerts, predictPriceTrends])

  // Update inflation analysis when history is available
  useEffect(() => {
    if (indexHistory.length > 0) {
      setInflationAnalysis(calculateInflationAnalysis())
    }
  }, [indexHistory, calculateInflationAnalysis])

  return {
    // Current data
    currentIndex,
    indexHistory,
    categoryAverages,
    
    // Predictions & analysis
    predictions,
    inflationAnalysis,
    seasonalPatterns,
    
    // Alerts & anomalies
    priceAlerts,
    marketAnomalies,
    
    // State
    loading: loading || priceDataLoading,
    error,
    
    // Methods
    predictPriceTrends,
    generatePriceAlerts,
    detectAnomalies,
    
    // Computed
    isDataAvailable: !!currentIndex && indexHistory.length > 0,
    marketStatus: currentIndex?.economicTrend || 'stable',
    alertCount: priceAlerts.length + marketAnomalies.length
  }
}