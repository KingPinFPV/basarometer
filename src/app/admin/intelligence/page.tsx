// Admin Intelligence Page - Enhanced Meat Classification Management
// Main entry point for MeatIntelligenceAdmin component
// Built on existing admin patterns with V5.2 architecture

'use client'

import MeatIntelligenceAdmin from '@/components/admin/MeatIntelligenceAdmin'

export default function AdminIntelligencePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <MeatIntelligenceAdmin />
      </div>
    </div>
  )
}