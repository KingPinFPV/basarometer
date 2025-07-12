// Smart Filter Panel with Hebrew Voice Search
// Phase 3 UX Enhancement - Advanced filtering with voice recognition
// Supports Israeli shopping patterns and Hebrew voice commands

'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { 
  Search, 
  Filter, 
  Mic, 
  MicOff, 
  X, 
  Settings,
  MapPin,
  Clock,
  Star,
  TrendingUp,
  Sliders,
  Volume2
} from 'lucide-react'

interface FilterState {
  search: string
  location: string
  priceRange: [number, number]
  quality: string[]
  networks: string[]
  dietary: string[]
  timePreference: string
  showOnlyOffers: boolean
  showOnlyNearby: boolean
  showOnlyInStock: boolean
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

interface VoiceCommand {
  trigger: string[]
  action: (filters: FilterState) => FilterState
  description: string
}

const VOICE_COMMANDS: VoiceCommand[] = [
  {
    trigger: ['מחפש', 'אני מחפש', 'רוצה', 'צריך'],
    action: (filters) => ({ ...filters, search: '' }),
    description: 'חיפוש כללי'
  },
  {
    trigger: ['זול', 'זולים', 'במחיר נמוך', 'במחיר זול'],
    action: (filters) => ({ ...filters, sortBy: 'price', sortOrder: 'asc' }),
    description: 'מיון לפי מחיר נמוך'
  },
  {
    trigger: ['יקר', 'יקרים', 'פרמיום', 'איכותי'],
    action: (filters) => ({ ...filters, quality: ['premium', 'angus', 'wagyu'] }),
    description: 'מוצרי איכות גבוהה'
  },
  {
    trigger: ['קרוב', 'קרוב אלי', 'באזור', 'בסביבה'],
    action: (filters) => ({ ...filters, showOnlyNearby: true }),
    description: 'מוצרים זמינים באזור'
  },
  {
    trigger: ['מבצע', 'מבצעים', 'הנחה', 'הנחות'],
    action: (filters) => ({ ...filters, showOnlyOffers: true }),
    description: 'מוצרים במבצע'
  },
  {
    trigger: ['כשר', 'כשרות'],
    action: (filters) => ({ ...filters, dietary: [...filters.dietary, 'kosher'] }),
    description: 'מוצרים כשרים'
  },
  {
    trigger: ['רמי לוי'],
    action: (filters) => ({ ...filters, networks: ['rami-levy'] }),
    description: 'רק רמי לוי'
  },
  {
    trigger: ['שופרסל'],
    action: (filters) => ({ ...filters, networks: ['shufersal'] }),
    description: 'רק שופרסל'
  }
]

const NETWORKS = [
  { id: 'rami-levy', name: 'רמי לוי', icon: '🛒', color: 'bg-blue-100 text-blue-800' },
  { id: 'shufersal', name: 'שופרסל', icon: '🛍️', color: 'bg-red-100 text-red-800' },
  { id: 'mega', name: 'מגה', icon: '🏪', color: 'bg-orange-100 text-orange-800' },
  { id: 'yohananof', name: 'יוחננוף', icon: '🛒', color: 'bg-purple-100 text-purple-800' },
  { id: 'victory', name: 'ויקטורי', icon: '🏬', color: 'bg-green-100 text-green-800' },
  { id: 'yeinot-bitan', name: 'יינות ביתן', icon: '🍷', color: 'bg-pink-100 text-pink-800' },
  { id: 'hazi-hinam', name: 'חצי חינם', icon: '💰', color: 'bg-indigo-100 text-indigo-800' },
  { id: 'tiv-taam', name: 'טיב טעם', icon: '🥩', color: 'bg-yellow-100 text-yellow-800' }
]

const QUALITY_OPTIONS = [
  { id: 'regular', label: 'רגיל', description: 'איכות סטנדרטית' },
  { id: 'premium', label: 'פרמיום', description: 'איכות מעולה' },
  { id: 'angus', label: 'אנגוס', description: 'בקר אנגוס מובחר' },
  { id: 'wagyu', label: 'וואגיו', description: 'בקר וואגיו יפני' },
  { id: 'veal', label: 'עגל', description: 'בשר עגל צעיר' }
]

const DIETARY_OPTIONS = [
  { id: 'kosher', label: 'כשר', icon: '✡️' },
  { id: 'halal', label: 'חלאל', icon: '☪️' },
  { id: 'organic', label: 'אורגני', icon: '🌱' },
  { id: 'grass-fed', label: 'מאכיל דשא', icon: '🌿' }
]

const HEBREW_MEAT_TERMS = [
  'אנטריקוט', 'בשר טחון', 'פילה', 'צלעות', 'כתף', 'קובה',
  'שניצל', 'המבורגר', 'קברט', 'סטייק', 'צוואר', 'שוק',
  'בקר', 'עגל', 'טלה', 'כבש', 'עוף', 'הודו'
]

interface SmartFilterPanelProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  className?: string
}

export default function SmartFilterPanel({ 
  filters, 
  onFiltersChange, 
  className = '' 
}: SmartFilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isVoiceRecording, setIsVoiceRecording] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState('')
  
  const searchInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)

  // Check for voice recognition support
  useEffect(() => {
    const isSupported = typeof window !== 'undefined' && 
      ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
    setVoiceSupported(isSupported)
  }, [])

  // Generate search suggestions based on input
  const generateSuggestions = useCallback((query: string) => {
    if (!query.trim()) {
      setSuggestions([])
      return
    }

    const queryLower = query.toLowerCase()
    const matchedTerms = HEBREW_MEAT_TERMS.filter(term => 
      term.toLowerCase().includes(queryLower)
    ).slice(0, 5)

    // Add popular searches
    const popularSearches = [
      `${query} זול`,
      `${query} פרמיום`,
      `${query} באזור`,
      `${query} במבצע`
    ].filter(search => !matchedTerms.includes(search)).slice(0, 3)

    setSuggestions([...matchedTerms, ...popularSearches])
  }, [])

  // Handle search input change
  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value })
    generateSuggestions(value)
    setShowSuggestions(value.length > 0)
  }

  // Voice recognition functionality
  const startVoiceRecognition = () => {
    if (!voiceSupported || isVoiceRecording || typeof window === 'undefined') return

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.lang = 'he-IL'
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 3

    recognition.onstart = () => {
      setIsVoiceRecording(true)
      setVoiceTranscript('')
    }

    recognition.onresult = (event) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      setVoiceTranscript(finalTranscript || interimTranscript)

      if (finalTranscript) {
        processVoiceCommand(finalTranscript)
      }
    }

    recognition.onerror = (event) => {
      console.error('Voice recognition error:', event.error)
      setIsVoiceRecording(false)
      setVoiceTranscript('')
    }

    recognition.onend = () => {
      setIsVoiceRecording(false)
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  // Stop voice recognition
  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsVoiceRecording(false)
  }

  // Process voice commands
  const processVoiceCommand = (transcript: string) => {
    const lowerTranscript = transcript.toLowerCase()
    
    // Check for specific commands
    const matchedCommand = VOICE_COMMANDS.find(command =>
      command.trigger.some(trigger => lowerTranscript.includes(trigger))
    )

    if (matchedCommand) {
      const newFilters = matchedCommand.action(filters)
      onFiltersChange(newFilters)
    } else {
      // Fallback to search
      handleSearchChange(transcript)
    }

    if (searchInputRef.current) {
      searchInputRef.current.value = transcript
    }
  }

  // Clear all filters
  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      location: '',
      priceRange: [0, 200],
      quality: [],
      networks: [],
      dietary: [],
      timePreference: 'anytime',
      showOnlyOffers: false,
      showOnlyNearby: false,
      showOnlyInStock: true,
      sortBy: 'popularity',
      sortOrder: 'desc'
    })
    setSuggestions([])
    setShowSuggestions(false)
  }

  // Toggle filter option
  const toggleArrayFilter = (filterKey: keyof FilterState, value: string) => {
    const currentArray = filters[filterKey] as string[]
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value]
    
    onFiltersChange({ ...filters, [filterKey]: newArray })
  }

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`} dir="rtl">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            חיפוש וסינון חכם
          </h2>
          <div className="flex items-center gap-2">
            {/* Voice Commands Help */}
            {voiceSupported && (
              <button
                className="p-2 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"
                title="פקודות קוליות זמינות"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Smart Search Bar with Voice */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="חפש מוצר... נסה 'אנטריקוט זול' או השתמש בקול"
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setShowSuggestions(filters.search.length > 0)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="w-full pr-10 pl-16 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            />
            
            {/* Voice Button */}
            {voiceSupported && (
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                <button
                  onClick={isVoiceRecording ? stopVoiceRecognition : startVoiceRecognition}
                  className={`p-2 rounded-full transition-all duration-200 ${
                    isVoiceRecording 
                      ? 'text-red-600 bg-red-50 animate-pulse' 
                      : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                  title={isVoiceRecording ? 'עצור הקלטה' : 'חיפוש קולי'}
                >
                  {isVoiceRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              </div>
            )}

            {/* Clear Search */}
            {filters.search && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute left-12 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Voice Transcript Display */}
          {isVoiceRecording && voiceTranscript && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-blue-600" />
                <span className="text-blue-800 font-medium">מזהה:</span>
                <span className="text-blue-700">{voiceTranscript}</span>
              </div>
            </div>
          )}

          {/* Search Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    handleSearchChange(suggestion)
                    setShowSuggestions(false)
                  }}
                  className="w-full px-4 py-2 text-right hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <Search className="w-4 h-4 inline ml-2 text-gray-400" />
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Filters Row */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onFiltersChange({ ...filters, showOnlyOffers: !filters.showOnlyOffers })}
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filters.showOnlyOffers 
                ? 'bg-red-100 text-red-800 border border-red-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <TrendingUp className="w-4 h-4 ml-1" />
            מבצעים
          </button>
          
          <button
            onClick={() => onFiltersChange({ ...filters, showOnlyNearby: !filters.showOnlyNearby })}
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filters.showOnlyNearby 
                ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <MapPin className="w-4 h-4 ml-1" />
            באזור
          </button>
          
          <button
            onClick={() => onFiltersChange({ ...filters, quality: filters.quality.includes('premium') ? [] : ['premium', 'angus', 'wagyu'] })}
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filters.quality.length > 0 
                ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Star className="w-4 h-4 ml-1" />
            איכותי
          </button>

          {(filters.search || filters.quality.length > 0 || filters.networks.length > 0 || filters.showOnlyOffers || filters.showOnlyNearby) && (
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
            >
              <X className="w-4 h-4 ml-1" />
              נקה הכל
            </button>
          )}
        </div>

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t border-gray-200 animate-fade-in">
            {/* Networks Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                רשתות שיווק:
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {NETWORKS.map(network => (
                  <button
                    key={network.id}
                    onClick={() => toggleArrayFilter('networks', network.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filters.networks.includes(network.id)
                        ? network.color + ' ring-2 ring-blue-500'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>{network.icon}</span>
                    {network.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                סוג איכות:
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {QUALITY_OPTIONS.map(quality => (
                  <button
                    key={quality.id}
                    onClick={() => toggleArrayFilter('quality', quality.id)}
                    className={`flex flex-col gap-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                      filters.quality.includes(quality.id)
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="font-medium">{quality.label}</span>
                    <span className="text-xs opacity-75">{quality.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dietary Preferences */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                העדפות תזונה:
              </label>
              <div className="flex flex-wrap gap-2">
                {DIETARY_OPTIONS.map(option => (
                  <button
                    key={option.id}
                    onClick={() => toggleArrayFilter('dietary', option.id)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      filters.dietary.includes(option.id)
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span>{option.icon}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                טווח מחירים (₪ לק&quot;ג):
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={filters.priceRange[0]}
                  onChange={(e) => onFiltersChange({
                    ...filters,
                    priceRange: [Number(e.target.value), filters.priceRange[1]]
                  })}
                  className="flex-1"
                />
                <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                  ₪{filters.priceRange[0]} - ₪{filters.priceRange[1]}
                </span>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={filters.priceRange[1]}
                  onChange={(e) => onFiltersChange({
                    ...filters,
                    priceRange: [filters.priceRange[0], Number(e.target.value)]
                  })}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        )}

        {/* Voice Commands Help */}
        {voiceSupported && isExpanded && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              פקודות קוליות זמינות:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-sm text-blue-700">
              {VOICE_COMMANDS.slice(0, 6).map((command, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="font-mono bg-blue-100 px-1 rounded text-xs">
                    &quot;{command.trigger[0]}&quot;
                  </span>
                  <span>{command.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}