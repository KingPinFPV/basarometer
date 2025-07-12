'use client'

import React, { useState, useRef } from 'react'
import { Search, Filter, Grid3X3, List, Mic, MicOff, ArrowUpDown, X } from 'lucide-react'

const NETWORKS = [
  { id: 'rami_levy', name: 'רמי לוי', color: 'bg-blue-100 text-blue-800' },
  { id: 'shufersal', name: 'שופרסל', color: 'bg-red-100 text-red-800' },
  { id: 'mega', name: 'מגה', color: 'bg-orange-100 text-orange-800' },
  { id: 'yohananof', name: 'יוחננוף', color: 'bg-purple-100 text-purple-800' },
  { id: 'victory', name: 'ויקטורי', color: 'bg-green-100 text-green-800' },
  { id: 'carrefour', name: 'קרפור', color: 'bg-cyan-100 text-cyan-800' },
  { id: 'government', name: 'ממשלתי', color: 'bg-indigo-100 text-indigo-800' },
  { id: 'yeinot_bitan', name: 'יינות ביתן', color: 'bg-pink-100 text-pink-800' }
]

const PRICE_RANGES = [
  { label: 'עד ₪50', min: 0, max: 50 },
  { label: '₪50-100', min: 50, max: 100 },
  { label: '₪100-150', min: 100, max: 150 },
  { label: '₪150-200', min: 150, max: 200 },
  { label: '₪200+', min: 200, max: 300 }
]

const SORT_OPTIONS = [
  { value: 'pricePerKg_asc', label: 'מחיר לק״ג (נמוך לגבוה)' },
  { value: 'pricePerKg_desc', label: 'מחיר לק״ג (גבוה לנמוך)' },
  { value: 'price_asc', label: 'מחיר כולל (נמוך לגבוה)' },
  { value: 'price_desc', label: 'מחיר כולל (גבוה לנמוך)' },
  { value: 'name_asc', label: 'שם המוצר (א-ת)' }
]

interface ComparisonFiltersProps {
  filters: any
  onFiltersChange: (filters: any) => void
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
  totalProducts: number
}

export function ComparisonFilters({ 
  filters, 
  onFiltersChange, 
  viewMode, 
  onViewModeChange, 
  totalProducts 
}: ComparisonFiltersProps) {
  const [isVoiceRecording, setIsVoiceRecording] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Check for voice recognition support
  React.useEffect(() => {
    setVoiceSupported(typeof window !== 'undefined' && 
      ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window))
  }, [])

  // Voice search functionality
  const startVoiceRecognition = () => {
    if (!voiceSupported || isVoiceRecording || typeof window === 'undefined') return

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.lang = 'he-IL'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => {
      setIsVoiceRecording(true)
    }

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      onFiltersChange({ ...filters, search: transcript })
      if (searchInputRef.current) {
        searchInputRef.current.value = transcript
      }
    }

    recognition.onerror = () => {
      setIsVoiceRecording(false)
    }

    recognition.onend = () => {
      setIsVoiceRecording(false)
    }

    recognition.start()
  }

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      category: 'all',
      networks: [],
      priceRange: [0, 300],
      sortBy: 'pricePerKg_asc'
    })
    if (searchInputRef.current) {
      searchInputRef.current.value = ''
    }
  }

  const toggleNetwork = (networkId: string) => {
    const newNetworks = filters.networks.includes(networkId)
      ? filters.networks.filter((id: string) => id !== networkId)
      : [...filters.networks, networkId]
    
    onFiltersChange({ ...filters, networks: newNetworks })
  }

  const activeFiltersCount = [
    filters.search && filters.search.length > 0,
    filters.networks.length > 0,
    filters.priceRange[0] > 0 || filters.priceRange[1] < 300
  ].filter(Boolean).length

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            חיפוש וסינון חכם
            {activeFiltersCount > 0 && (
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                {activeFiltersCount} פילטרים פעילים
              </span>
            )}
          </h2>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {totalProducts} מוצרים
            </span>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
              >
                <X className="w-3 h-3" />
                נקה הכל
              </button>
            )}
          </div>
        </div>
        
        {/* Search Bar with Voice */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="חפש מוצר... (נסה 'אנטריקוט' או 'בשר טחון' או 'עוף')"
              value={filters.search}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              className="w-full pr-12 pl-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            />
            {voiceSupported && (
              <button
                onClick={startVoiceRecognition}
                disabled={isVoiceRecording}
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors ${
                  isVoiceRecording 
                    ? 'text-red-600 bg-red-50' 
                    : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                }`}
                title="חיפוש קולי"
              >
                {isVoiceRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Sort Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">מיון:</label>
            <select
              value={filters.sortBy}
              onChange={(e) => onFiltersChange({ ...filters, sortBy: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">טווח מחירים לק״ג:</label>
            <select
              value={`${filters.priceRange[0]}-${filters.priceRange[1]}`}
              onChange={(e) => {
                const [min, max] = e.target.value.split('-').map(Number)
                onFiltersChange({ ...filters, priceRange: [min, max] })
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="0-300">כל הטווחים</option>
              {PRICE_RANGES.map(range => (
                <option key={`${range.min}-${range.max}`} value={`${range.min}-${range.max}`}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">תצוגה:</label>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => onViewModeChange('grid')}
                className={`flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Grid3X3 className="w-4 h-4 ml-1" />
                רשת
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={`flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium transition-colors border-r border-gray-300 ${
                  viewMode === 'list' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <List className="w-4 h-4 ml-1" />
                רשימה
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">פעולות מהירות:</label>
            <button
              onClick={() => onFiltersChange({ ...filters, sortBy: 'pricePerKg_asc' })}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
            >
              <ArrowUpDown className="w-4 h-4" />
              הצג הכי זול
            </button>
          </div>
        </div>

        {/* Network Filter */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">
            רשתות שיווק ({filters.networks.length > 0 ? `${filters.networks.length} נבחרו` : 'כל הרשתות'}):
          </label>
          <div className="flex flex-wrap gap-2">
            {NETWORKS.map(network => (
              <button
                key={network.id}
                onClick={() => toggleNetwork(network.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  filters.networks.includes(network.id)
                    ? `${network.color} ring-2 ring-blue-500 scale-105`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105'
                }`}
              >
                {network.name}
                {filters.networks.includes(network.id) && (
                  <span className="mr-1">✓</span>
                )}
              </button>
            ))}
            {filters.networks.length > 0 && (
              <button
                onClick={() => onFiltersChange({ ...filters, networks: [] })}
                className="px-3 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
              >
                נקה בחירת רשתות
              </button>
            )}
          </div>
        </div>

        {/* Active Filters Summary */}
        {(filters.search || filters.networks.length > 0 || filters.priceRange[0] > 0 || filters.priceRange[1] < 300) && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-900 font-medium mb-2">פילטרים פעילים:</div>
            <div className="flex flex-wrap gap-2 text-xs">
              {filters.search && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  חיפוש: &quot;{filters.search}&quot;
                </span>
              )}
              {filters.networks.length > 0 && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  רשתות: {filters.networks.map((id: string) => NETWORKS.find(n => n.id === id)?.name).join(', ')}
                </span>
              )}
              {(filters.priceRange[0] > 0 || filters.priceRange[1] < 300) && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  מחיר: ₪{filters.priceRange[0]}-{filters.priceRange[1]}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}