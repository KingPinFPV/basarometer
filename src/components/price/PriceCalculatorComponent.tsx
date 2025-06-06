'use client'

import { useState } from 'react'
import type { PriceReport, MeatCut } from '@/lib/database.types'

interface PriceCalculatorComponentProps {
  priceReport: PriceReport
  meatCut: MeatCut
  showConverter?: boolean
  className?: string
}

interface PriceCalculation {
  pricePerKg: number
  pricePer100g: number
  salePricePerKg?: number
  salePricePer100g?: number
  savings?: number
  savingsPercentage?: number
}

export function PriceCalculatorComponent({
  priceReport,
  meatCut,
  showConverter = false,
  className = ''
}: PriceCalculatorComponentProps) {
  const [selectedUnit, setSelectedUnit] = useState<'kg' | '100g'>('kg')

  const calculation = calculatePriceNormalization(priceReport)

  return (
    <div className={`price-calculator ${className}`}>
      {/* Main Normalized Price Display */}
      <div className="flex flex-col items-center space-y-1">
        {/* Primary Price */}
        <div className="text-lg font-bold text-center">
          {priceReport.is_on_sale && calculation.salePricePerKg ? (
            <>
              <div className="text-red-600">
                ₪{selectedUnit === 'kg' ? calculation.salePricePerKg.toFixed(2) : calculation.salePricePer100g!.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 line-through">
                ₪{selectedUnit === 'kg' ? calculation.pricePerKg.toFixed(2) : calculation.pricePer100g.toFixed(2)}
              </div>
            </>
          ) : (
            <div>
              ₪{selectedUnit === 'kg' ? calculation.pricePerKg.toFixed(2) : calculation.pricePer100g.toFixed(2)}
            </div>
          )}
        </div>

        {/* Unit Label */}
        <div className="text-xs text-gray-600">
          ל{selectedUnit === 'kg' ? 'קילו' : '100 גרם'}
        </div>

        {/* Sale Badge */}
        {priceReport.is_on_sale && calculation.savings && (
          <div className="flex flex-col items-center">
            <div className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
              מבצע! חסכון ₪{calculation.savings.toFixed(2)}
            </div>
            {calculation.savingsPercentage && (
              <div className="text-xs text-red-600">
                ({calculation.savingsPercentage.toFixed(0)}% הנחה)
              </div>
            )}
          </div>
        )}
      </div>

      {/* Unit Converter */}
      {showConverter && (
        <div className="mt-3 p-2 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-600 mb-2 text-center">
            מחשבון יחידות
          </div>
          
          {/* Unit Toggle */}
          <div className="flex justify-center mb-2">
            <div className="bg-white rounded-lg p-1 flex">
              <button
                onClick={() => setSelectedUnit('kg')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  selectedUnit === 'kg' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                קילו
              </button>
              <button
                onClick={() => setSelectedUnit('100g')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  selectedUnit === '100g' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                100 גרם
              </button>
            </div>
          </div>

          {/* Conversion Display */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>1 קילו:</span>
              <span className="font-medium">
                ₪{priceReport.is_on_sale && calculation.salePricePerKg ? 
                  calculation.salePricePerKg.toFixed(2) : 
                  calculation.pricePerKg.toFixed(2)
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span>100 גרם:</span>
              <span className="font-medium">
                ₪{priceReport.is_on_sale && calculation.salePricePer100g ? 
                  calculation.salePricePer100g.toFixed(2) : 
                  calculation.pricePer100g.toFixed(2)
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span>500 גרם:</span>
              <span className="font-medium">
                ₪{((priceReport.is_on_sale && calculation.salePricePerKg ? 
                  calculation.salePricePerKg : 
                  calculation.pricePerKg) * 0.5).toFixed(2)
                }
              </span>
            </div>
          </div>

          {/* Cut-Specific Info */}
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              {meatCut.name_hebrew}
            </div>
            {meatCut.typical_price_range_min && meatCut.typical_price_range_max && (
              <div className="text-xs text-gray-500 text-center">
                טווח רגיל: ₪{(meatCut.typical_price_range_min / 100).toFixed(2)}-
                ₪{(meatCut.typical_price_range_max / 100).toFixed(2)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Comparison */}
      {!showConverter && (
        <div className="mt-1 text-xs text-gray-500 text-center">
          100גר = ₪{calculation.pricePer100g.toFixed(2)}
        </div>
      )}
    </div>
  )
}

/**
 * Calculate normalized prices for all units
 */
export function calculatePriceNormalization(priceReport: PriceReport): PriceCalculation {
  // Price is stored in agorot, convert to shekels
  const pricePerKg = priceReport.price_per_kg / 100
  const pricePer100g = pricePerKg / 10

  let result: PriceCalculation = {
    pricePerKg,
    pricePer100g
  }

  // Handle sale prices
  if (priceReport.is_on_sale && priceReport.sale_price_per_kg) {
    const salePricePerKg = priceReport.sale_price_per_kg / 100
    const salePricePer100g = salePricePerKg / 10
    const savings = pricePerKg - salePricePerKg
    const savingsPercentage = (savings / pricePerKg) * 100

    result = {
      ...result,
      salePricePerKg,
      salePricePer100g,
      savings,
      savingsPercentage
    }
  }

  return result
}

/**
 * Compare prices between different cuts/stores
 */
export function comparePrices(
  priceReports: PriceReport[]
): {
  cheapest: PriceReport
  mostExpensive: PriceReport
  averagePrice: number
  priceRange: number
} {
  const calculations = priceReports.map(report => ({
    report,
    effectivePrice: report.is_on_sale && report.sale_price_per_kg ? 
      report.sale_price_per_kg : report.price_per_kg
  }))

  const prices = (calculations || []).map(c => c?.effectivePrice || 0)
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0
  const averagePrice = prices && prices.length > 0 ? (prices || []).reduce((sum, price) => sum + price, 0) / prices.length : 0

  const cheapest = calculations.find(c => c?.effectivePrice === minPrice)?.report || calculations[0]?.report
  const mostExpensive = calculations.find(c => c?.effectivePrice === maxPrice)?.report || calculations[0]?.report

  return {
    cheapest,
    mostExpensive,
    averagePrice: averagePrice / 100, // Convert to shekels
    priceRange: (maxPrice - minPrice) / 100 // Convert to shekels
  }
}