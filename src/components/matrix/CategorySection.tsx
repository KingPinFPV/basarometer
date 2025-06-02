'use client'

import React, { useState } from 'react'
import { CategoryData, MatrixRetailer, MatrixActions } from '@/types/matrix'
import PriceCell from './PriceCell'

interface CategorySectionProps {
  category: CategoryData
  retailers: MatrixRetailer[]
  actions?: MatrixActions
}

export default function CategorySection({ category, retailers, actions }: CategorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(category.isExpanded)

  const toggleExpanded = () => setIsExpanded(!isExpanded)

  const getTotalPricePoints = () => {
    return category.priceMatrix.flat().filter(cell => cell.hasData).length
  }

  const getAveragePrice = () => {
    const prices = category.priceMatrix.flat()
      .filter(cell => cell.hasData && cell.price)
      .map(cell => cell.price!)
    
    if (prices.length === 0) return 0
    return prices.reduce((sum, price) => sum + price, 0) / prices.length
  }

  return (
    <>
      {/* Category Header Row */}
      <tr className="bg-gray-100 border-t-2 border-gray-300">
        <td colSpan={retailers.length + 1} className="p-3">
          <div className="flex items-center justify-between">
            <button
              onClick={toggleExpanded}
              className="flex items-center gap-2 text-lg font-bold text-gray-800 hover:text-blue-600 transition-colors"
            >
              <span className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                ▶
              </span>
              <span>{category.name}</span>
              <span className="text-sm font-normal text-gray-600">
                ({category.products.length} מוצרים)
              </span>
            </button>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>{getTotalPricePoints()} נקודות מחיר</span>
              <span>ממוצע: ₪{getAveragePrice().toFixed(2)}</span>
              {actions?.onAddProduct && (
                <button
                  onClick={() => actions.onAddProduct(category.name)}
                  className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                >
                  הוסף מוצר
                </button>
              )}
            </div>
          </div>
        </td>
      </tr>

      {/* Product Rows */}
      {isExpanded && category.products.map((product, productIndex) => (
        <tr key={product.id} className="hover:bg-gray-50">
          {/* Product Name Column */}
          <td className="p-2 md:p-3 border-r border-gray-200 bg-white sticky right-0 min-w-[150px] md:min-w-[200px]">
            <div className="flex flex-col">
              <span className="font-semibold text-gray-900 text-sm md:text-base">{product.name}</span>
              {product.brand && (
                <span className="text-xs md:text-sm text-gray-600">{product.brand}</span>
              )}
              {product.cut_name && (
                <span className="text-xs text-blue-600">{product.cut_name}</span>
              )}
            </div>
          </td>

          {/* Price Cells */}
          {category.priceMatrix[productIndex]?.map((cell, retailerIndex) => (
            <PriceCell
              key={`${product.id}-${retailers[retailerIndex].id}`}
              cell={cell}
              onReportPrice={actions?.onReportPrice ? 
                () => actions.onReportPrice(product.id, retailers[retailerIndex].id) : 
                undefined
              }
              onUpdatePrice={actions?.onUpdatePrice ? 
                () => actions.onUpdatePrice(product.id, retailers[retailerIndex].id, cell.price) : 
                undefined
              }
            />
          ))}
        </tr>
      ))}
    </>
  )
}