// V3 Clean Market Types for Israeli Meat Market

export interface MeatCategory {
  id: string
  name_hebrew: string
  name_english: string
  display_order: number
  is_active: boolean
  created_at: string
  meat_cuts?: MeatCut[]
}

export interface MeatCut {
  id: string
  category_id: string
  name_hebrew: string
  name_english?: string
  description?: string
  typical_price_range_min?: number
  typical_price_range_max?: number
  is_popular: boolean
  display_order?: number
  is_active: boolean
  created_at: string
}

export interface Retailer {
  id: string
  name: string
  type: 'supermarket' | 'butcher' | 'online' | 'wholesale'
  logo_url?: string
  website_url?: string
  is_chain: boolean
  location_coverage: string[]
  is_active: boolean
  created_at: string
}

export interface PriceReport {
  id: string
  meat_cut_id: string
  retailer_id: string
  price_per_kg: number
  is_on_sale: boolean
  sale_price_per_kg?: number
  reported_by?: string
  location?: string
  confidence_score: number
  verified_at?: string
  expires_at: string
  is_active: boolean
  created_at: string
}

export interface UserProfile {
  id: string
  username?: string
  full_name?: string
  preferred_retailers: string[]
  location?: string
  reputation_score: number
  total_reports: number
  created_at: string
}

// Matrix display types
export interface MatrixCell {
  cutId: string
  retailerId: string
  price?: number
  isOnSale: boolean
  priceColor: 'green' | 'red' | 'blue' | 'yellow' | 'gray'
  confidence: number
  lastUpdated?: Date
}

export interface MatrixRow {
  cut: MeatCut
  cells: MatrixCell[]
}

export interface MatrixCategory {
  category: MeatCategory
  rows: MatrixRow[]
  isExpanded: boolean
}

export interface CleanMatrixData {
  categories: MatrixCategory[]
  retailers: Retailer[]
  totalCuts: number
  totalPricePoints: number
  lastUpdated: Date
}

// Utility functions for price formatting
export const formatPrice = (priceInAgorot: number): string => {
  return `₪${(priceInAgorot / 100).toFixed(2)}`
}

export const getPriceColor = (price: number, minPrice: number, maxPrice: number, isOnSale: boolean): string => {
  if (isOnSale) return 'blue'
  if (price === 0) return 'gray'
  
  const range = maxPrice - minPrice
  const threshold = range * 0.25
  
  if (price <= minPrice + threshold) return 'green'
  if (price >= maxPrice - threshold) return 'red'
  return 'yellow'
}