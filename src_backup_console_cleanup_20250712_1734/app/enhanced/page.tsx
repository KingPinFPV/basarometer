// Enhanced Intelligence Matrix Page - Smart Meat Classification
// Public-facing enhanced matrix with quality grade filtering
// Built on existing V5.2 patterns with Enhanced Intelligence System

'use client'

import MeatIntelligenceMatrix from '@/components/enhanced/MeatIntelligenceMatrix'

export default function EnhancedPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <MeatIntelligenceMatrix />
      </div>
    </div>
  )
}