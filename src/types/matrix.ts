export interface MatrixProduct {
  id: number
  name: string
  brand?: string
  category: string
  cut_name?: string
  normalized_name?: string
}

export interface MatrixRetailer {
  id: number
  name: string
  type?: string
  logo_url?: string
}

export interface PriceCell {
  productId: number
  retailerId: number
  price?: number
  pricePerUnit?: number
  originalPrice?: number
  isPromotion: boolean
  confidence: number
  lastReported?: Date
  reportCount: number
  priceColor: 'green' | 'red' | 'blue' | 'yellow' | 'gray'
  hasData: boolean
}

export interface CategoryData {
  name: string
  products: MatrixProduct[]
  priceMatrix: PriceCell[][]
  isExpanded: boolean
}

export interface MatrixData {
  categories: { [categoryName: string]: CategoryData }
  retailers: MatrixRetailer[]
  totalProducts: number
  totalPricePoints: number
  lastUpdated: Date
}

export interface MatrixFilters {
  showPromotionsOnly: boolean
  hideEmptyRows: boolean
  selectedCategories: string[]
  minReports: number
}

export interface MatrixActions {
  onReportPrice: (productId: number, retailerId: number) => void
  onAddProduct: (category: string) => void
  onUpdatePrice: (productId: number, retailerId: number, currentPrice?: number) => void
}

export type PriceColor = 'green' | 'red' | 'blue' | 'yellow' | 'gray'

export interface PriceComparison {
  category: string
  prices: number[]
  averagePrice: number
  minPrice: number
  maxPrice: number
  priceRange: number
}