'use client'

import React, { useState } from 'react'
import MatrixTable from './matrix/MatrixTable'
import ReportPriceModal from './matrix/ReportPriceModal'
import { MatrixActions } from '@/types/matrix'

export default function MatrixPriceDashboard() {
  const [reportModal, setReportModal] = useState<{
    isOpen: boolean
    productId: number
    retailerId: number
    productName: string
    retailerName: string
    currentPrice?: number
  }>({
    isOpen: false,
    productId: 0,
    retailerId: 0,
    productName: '',
    retailerName: ''
  })

  const actions: MatrixActions = {
    onReportPrice: (productId: number, retailerId: number) => {
      // In a real implementation, you'd fetch product and retailer names
      setReportModal({
        isOpen: true,
        productId,
        retailerId,
        productName: `מוצר ${productId}`,
        retailerName: `חנות ${retailerId}`
      })
    },
    onAddProduct: (category: string) => {
      console.log('Add product to category:', category)
      // Implement add product functionality
    },
    onUpdatePrice: (productId: number, retailerId: number, currentPrice?: number) => {
      // Same as report price, but with current price pre-filled
      setReportModal({
        isOpen: true,
        productId,
        retailerId,
        productName: `מוצר ${productId}`,
        retailerName: `חנות ${retailerId}`,
        currentPrice
      })
    }
  }

  const closeReportModal = () => {
    setReportModal({
      isOpen: false,
      productId: 0,
      retailerId: 0,
      productName: '',
      retailerName: ''
    })
  }

  return (
    <div>
      <MatrixTable actions={actions} />
      
      <ReportPriceModal
        isOpen={reportModal.isOpen}
        onClose={closeReportModal}
        meatCutId={reportModal.productId?.toString() || ''}
        retailerId={reportModal.retailerId?.toString() || ''}
        productName={reportModal.productName}
        retailerName={reportModal.retailerName}
        currentPrice={reportModal.currentPrice}
      />
    </div>
  )
}