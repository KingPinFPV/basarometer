// Network Selector Grid - Visual network selection interface
// Phase 3 UX Enhancement - Interactive network filtering
// Mobile-first design with Hebrew RTL support

'use client'

import React, { useState, useEffect } from 'react'
import { 
  MapPin, 
  Star, 
  Clock, 
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Info,
  Navigation,
  Store,
  Phone,
  Globe,
  Heart
} from 'lucide-react'

interface Network {
  id: string
  name: string
  name_english: string
  logo?: string
  color: string
  bgColor: string
  description: string
  features: string[]
  locations: number
  avg_rating: number
  delivery_available: boolean
  online_shopping: boolean
  loyalty_program: boolean
  kosher_certified: boolean
  contact: {
    phone?: string
    website?: string
    app_store?: string
    google_play?: string
  }
  operating_hours: {
    weekdays: string
    weekend: string
    special_notes?: string
  }
  strengths: string[]
  specialties: string[]
}

interface NetworkSelectorGridProps {
  selectedNetworks: string[]
  onNetworkToggle: (networkId: string) => void
  onNetworkSelect: (networkId: string) => void
  showDetails?: boolean
  maxSelections?: number
  className?: string
}

interface NetworkStatsProps {
  networks: Network[]
  selectedNetworks: string[]
}

const ISRAELI_NETWORKS: Network[] = [
  {
    id: 'rami-levy',
    name: 'רמי לוי',
    name_english: 'Rami Levy',
    color: 'text-blue-800',
    bgColor: 'bg-blue-100',
    description: 'רשת סופרמרקטים עם מחירים תחרותיים במיוחד',
    features: ['מחירים נמוכים', 'מגוון רחב', 'פריסה ארצית'],
    locations: 31,
    avg_rating: 4.2,
    delivery_available: true,
    online_shopping: true,
    loyalty_program: true,
    kosher_certified: true,
    contact: {
      phone: '*6555',
      website: 'rami-levy.co.il',
      app_store: 'ios-app-link',
      google_play: 'android-app-link'
    },
    operating_hours: {
      weekdays: '07:00-23:00',
      weekend: '07:00-22:00',
      special_notes: 'סגור בשבת'
    },
    strengths: ['מחירים זולים', 'מגוון בשר איכותי', 'שירות מהיר'],
    specialties: ['בשר טרי יומי', 'חתיכות מובחרות', 'מבצעים שבועיים']
  },
  {
    id: 'shufersal',
    name: 'שופרסל',
    name_english: 'Shufersal',
    color: 'text-red-800',
    bgColor: 'bg-red-100',
    description: 'רשת הסופרמרקטים הגדולה בישראל',
    features: ['פריסה הרחבה ביותר', 'מגוון ענק', 'שירותים מתקדמים'],
    locations: 285,
    avg_rating: 4.0,
    delivery_available: true,
    online_shopping: true,
    loyalty_program: true,
    kosher_certified: true,
    contact: {
      phone: '*7000',
      website: 'shufersal.co.il',
      app_store: 'ios-app-link',
      google_play: 'android-app-link'
    },
    operating_hours: {
      weekdays: '06:30-23:30',
      weekend: '07:00-22:30',
      special_notes: 'חלק מהסניפים פועלים בשבת'
    },
    strengths: ['זמינות גבוהה', 'מגוון רחב', 'שירות לקוחות מעולה'],
    specialties: ['בשר פרמיום', 'מותגים בלעדיים', 'מקצועיות בטרף']
  },
  {
    id: 'mega',
    name: 'מגה',
    name_english: 'Mega',
    color: 'text-orange-800',
    bgColor: 'bg-orange-100',
    description: 'רשת סופרמרקטים עם דגש על איכות ושירות',
    features: ['איכות גבוהה', 'שירות אישי', 'מוצרים יבוא'],
    locations: 50,
    avg_rating: 4.3,
    delivery_available: true,
    online_shopping: true,
    loyalty_program: true,
    kosher_certified: true,
    contact: {
      phone: '*6076',
      website: 'mega.co.il',
      app_store: 'ios-app-link',
      google_play: 'android-app-link'
    },
    operating_hours: {
      weekdays: '07:00-23:00',
      weekend: '07:00-22:00',
      special_notes: 'סגור בשבת'
    },
    strengths: ['איכות מעולה', 'שירות מותאם אישית', 'מוצרי יבוא'],
    specialties: ['בשר אנגוס', 'וואגיו יפני', 'חתיכות מיוחדות']
  },
  {
    id: 'yohananof',
    name: 'יוחננוף',
    name_english: 'Yohananof',
    color: 'text-purple-800',
    bgColor: 'bg-purple-100',
    description: 'רשת פרמיום עם דגש על איכות ושירות יוקרתי',
    features: ['מוצרים איכותיים', 'שירות יוקרתי', 'מגוון גורמה'],
    locations: 20,
    avg_rating: 4.5,
    delivery_available: true,
    online_shopping: true,
    loyalty_program: true,
    kosher_certified: true,
    contact: {
      phone: '1-700-70-80-90',
      website: 'yohananof.co.il'
    },
    operating_hours: {
      weekdays: '07:30-22:30',
      weekend: '08:00-21:30',
      special_notes: 'סגור בשבת'
    },
    strengths: ['איכות פרמיום', 'שירות אישי', 'מוצרי בוטיק'],
    specialties: ['בשר יבוא איכותי', 'חתיכות מובחרות', 'ייעוץ מקצועי']
  },
  {
    id: 'victory',
    name: 'ויקטורי',
    name_english: 'Victory',
    color: 'text-green-800',
    bgColor: 'bg-green-100',
    description: 'רשת סופרמרקטים חדשנית עם מחירים תחרותיים',
    features: ['חדשנות טכנולוגית', 'מחירים תחרותיים', 'קנייה מהירה'],
    locations: 15,
    avg_rating: 4.1,
    delivery_available: true,
    online_shopping: true,
    loyalty_program: true,
    kosher_certified: true,
    contact: {
      phone: '*2070',
      website: 'victory.co.il'
    },
    operating_hours: {
      weekdays: '07:00-23:00',
      weekend: '07:00-22:00',
      special_notes: 'סגור בשבת'
    },
    strengths: ['טכנולוגיה מתקדמת', 'זמינות טובה', 'מחירים הוגנים'],
    specialties: ['בשר טרי יומי', 'מגוון איכותי', 'שירות מהיר']
  },
  {
    id: 'yeinot-bitan',
    name: 'יינות ביתן',
    name_english: 'Yeinot Bitan',
    color: 'text-pink-800',
    bgColor: 'bg-pink-100',
    description: 'רשת מובילה במזון איכותי ויינות מובחרים',
    features: ['מזון גורמה', 'יינות מובחרים', 'מוצרי איכות'],
    locations: 35,
    avg_rating: 4.4,
    delivery_available: true,
    online_shopping: true,
    loyalty_program: true,
    kosher_certified: true,
    contact: {
      phone: '*3030',
      website: 'ybitan.co.il'
    },
    operating_hours: {
      weekdays: '08:00-22:00',
      weekend: '08:00-21:00',
      special_notes: 'סגור בשבת'
    },
    strengths: ['מזון איכותי', 'יינות מובחרים', 'שירות מעולה'],
    specialties: ['בשר פרמיום', 'חתיכות מיוחדות', 'ייעוץ מקצועי']
  },
  {
    id: 'hazi-hinam',
    name: 'חצי חינם',
    name_english: 'Hazi Hinam',
    color: 'text-indigo-800',
    bgColor: 'bg-indigo-100',
    description: 'רשת דיסקאונט עם מחירים זולים במיוחד',
    features: ['מחירי דיסקאונט', 'מבצעים מתמידים', 'חיסכון מקסימלי'],
    locations: 18,
    avg_rating: 3.8,
    delivery_available: false,
    online_shopping: false,
    loyalty_program: true,
    kosher_certified: true,
    contact: {
      phone: '03-6486486',
      website: 'hazihinam.co.il'
    },
    operating_hours: {
      weekdays: '08:00-22:00',
      weekend: '08:00-21:00',
      special_notes: 'סגור בשבת'
    },
    strengths: ['מחירים זולים', 'מבצעים מתמידים', 'יחס מחיר-איכות'],
    specialties: ['בשר במחירי דיסקאונט', 'מבצעים שבועיים', 'כמויות גדולות']
  },
  {
    id: 'tiv-taam',
    name: 'טיב טעם',
    name_english: 'Tiv Taam',
    color: 'text-yellow-800',
    bgColor: 'bg-yellow-100',
    description: 'רשת מובילה במזון איכותי ומוצרי טבע',
    features: ['מזון איכותי', 'מוצרי טבע', 'מותגים מובחרים'],
    locations: 22,
    avg_rating: 4.3,
    delivery_available: true,
    online_shopping: true,
    loyalty_program: true,
    kosher_certified: true,
    contact: {
      phone: '*8780',
      website: 'tivtaam.co.il'
    },
    operating_hours: {
      weekdays: '07:30-22:30',
      weekend: '08:00-21:30',
      special_notes: 'סגור בשבת'
    },
    strengths: ['מזון איכותי', 'מוצרי טבע', 'שירות מקצועי'],
    specialties: ['בשר אורגני', 'מוצרי טבע', 'איכות מובטחת']
  }
]

export default function NetworkSelectorGrid({ 
  selectedNetworks, 
  onNetworkToggle, 
  onNetworkSelect,
  showDetails = false,
  maxSelections,
  className = ''
}: NetworkSelectorGridProps) {
  const [expandedNetwork, setExpandedNetwork] = useState<string | null>(null)
  const [favoriteNetworks, setFavoriteNetworks] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<'rating' | 'locations' | 'name'>('rating')

  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('favorite-networks')
    if (saved) {
      setFavoriteNetworks(new Set(JSON.parse(saved)))
    }
  }, [])

  // Save favorites to localStorage
  const toggleFavorite = (networkId: string) => {
    const newFavorites = new Set(favoriteNetworks)
    if (newFavorites.has(networkId)) {
      newFavorites.delete(networkId)
    } else {
      newFavorites.add(networkId)
    }
    setFavoriteNetworks(newFavorites)
    localStorage.setItem('favorite-networks', JSON.stringify(Array.from(newFavorites)))
  }

  // Sort networks
  const sortedNetworks = [...ISRAELI_NETWORKS].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.avg_rating - a.avg_rating
      case 'locations':
        return b.locations - a.locations
      case 'name':
        return a.name.localeCompare(b.name, 'he')
      default:
        return 0
    }
  })

  const canSelectMore = !maxSelections || selectedNetworks.length < maxSelections

  return (
    <div className={`space-y-4 ${className}`} dir="rtl">
      {/* Header with Stats and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            בחר רשתות שיווק
          </h2>
          <p className="text-sm text-gray-600">
            {selectedNetworks.length} נבחרו מתוך {ISRAELI_NETWORKS.length} רשתות זמינות
            {maxSelections && ` (מקסימום ${maxSelections})`}
          </p>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">מיון לפי:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm border rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500"
          >
            <option value="rating">דירוג</option>
            <option value="locations">מספר סניפים</option>
            <option value="name">שם</option>
          </select>
        </div>
      </div>

      {/* Selection Summary */}
      {selectedNetworks.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                נבחרו {selectedNetworks.length} רשתות
              </span>
            </div>
            <button
              onClick={() => selectedNetworks.forEach(id => onNetworkToggle(id))}
              className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              נקה הכל
            </button>
          </div>
        </div>
      )}

      {/* Network Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sortedNetworks.map(network => {
          const isSelected = selectedNetworks.includes(network.id)
          const isFavorite = favoriteNetworks.has(network.id)
          const isExpanded = expandedNetwork === network.id
          const canSelect = canSelectMore || isSelected

          return (
            <div
              key={network.id}
              className={`relative bg-white border-2 rounded-lg p-4 transition-all duration-200 cursor-pointer hover:shadow-lg ${
                isSelected 
                  ? 'border-blue-500 bg-blue-50' 
                  : canSelect 
                    ? 'border-gray-200 hover:border-blue-300'
                    : 'border-gray-200 opacity-50 cursor-not-allowed'
              }`}
              onClick={() => {
                if (canSelect) {
                  onNetworkToggle(network.id)
                }
              }}
            >
              {/* Favorite Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFavorite(network.id)
                }}
                className={`absolute top-2 left-2 p-1 rounded-full transition-colors ${
                  isFavorite 
                    ? 'text-red-500 bg-red-50' 
                    : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              </button>

              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              )}

              {/* Network Info */}
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg ${network.bgColor} flex items-center justify-center`}>
                    <Store className={`w-6 h-6 ${network.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{network.name}</h3>
                    <p className="text-xs text-gray-600">{network.name_english}</p>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500" />
                    <span>{network.avg_rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-gray-500" />
                    <span>{network.locations} סניפים</span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-1">
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {network.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {network.features.slice(0, 2).map(feature => (
                      <span key={feature} className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${network.bgColor} ${network.color}`}>
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Services Icons */}
                <div className="flex items-center gap-2">
                  {network.delivery_available && (
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center" title="משלוחים">
                      <Navigation className="w-3 h-3 text-green-600" />
                    </div>
                  )}
                  {network.online_shopping && (
                    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center" title="קניות אונלין">
                      <Globe className="w-3 h-3 text-blue-600" />
                    </div>
                  )}
                  {network.loyalty_program && (
                    <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center" title="תוכנית נאמנות">
                      <Star className="w-3 h-3 text-purple-600" />
                    </div>
                  )}
                  {network.kosher_certified && (
                    <div className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center" title="כשר">
                      <CheckCircle className="w-3 h-3 text-yellow-600" />
                    </div>
                  )}
                </div>

                {/* Expand/Collapse Button */}
                {showDetails && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setExpandedNetwork(isExpanded ? null : network.id)
                    }}
                    className="w-full text-xs text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 pt-2 border-t border-gray-200"
                  >
                    <Info className="w-3 h-3" />
                    {isExpanded ? 'פחות פרטים' : 'עוד פרטים'}
                  </button>
                )}

                {/* Expanded Details */}
                {showDetails && isExpanded && (
                  <div className="space-y-3 pt-3 border-t border-gray-200 animate-fade-in">
                    {/* Contact */}
                    <div>
                      <h4 className="text-xs font-medium text-gray-900 mb-1">יצירת קשר:</h4>
                      <div className="space-y-1 text-xs text-gray-600">
                        {network.contact.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{network.contact.phone}</span>
                          </div>
                        )}
                        {network.contact.website && (
                          <div className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            <span>{network.contact.website}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Operating Hours */}
                    <div>
                      <h4 className="text-xs font-medium text-gray-900 mb-1">שעות פעילות:</h4>
                      <div className="space-y-1 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>ראשון-חמישי: {network.operating_hours.weekdays}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>סוף שבוע: {network.operating_hours.weekend}</span>
                        </div>
                        {network.operating_hours.special_notes && (
                          <div className="text-xs text-orange-600">
                            {network.operating_hours.special_notes}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Specialties */}
                    <div>
                      <h4 className="text-xs font-medium text-gray-900 mb-1">התמחויות:</h4>
                      <div className="flex flex-wrap gap-1">
                        {network.specialties.map(specialty => (
                          <span key={specialty} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Network Stats Component */}
      <NetworkStats networks={ISRAELI_NETWORKS} selectedNetworks={selectedNetworks} />
    </div>
  )
}

// Network Stats Component
function NetworkStats({ networks, selectedNetworks }: NetworkStatsProps) {
  const selectedNetworkData = networks.filter(n => selectedNetworks.includes(n.id))
  
  if (selectedNetworkData.length === 0) return null

  const totalLocations = selectedNetworkData.reduce((sum, n) => sum + n.locations, 0)
  const avgRating = selectedNetworkData.reduce((sum, n) => sum + n.avg_rating, 0) / selectedNetworkData.length
  const hasDelivery = selectedNetworkData.some(n => n.delivery_available)
  const hasOnline = selectedNetworkData.some(n => n.online_shopping)
  const allKosher = selectedNetworkData.every(n => n.kosher_certified)

  return (
    <div className="bg-gradient-to-l from-gray-50 to-white rounded-lg border p-4">
      <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
        <TrendingUp className="w-4 h-4" />
        סטטיסטיקות הרשתות הנבחרות
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{totalLocations}</div>
          <div className="text-sm text-gray-600">סניפים בסך הכל</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{avgRating.toFixed(1)}</div>
          <div className="text-sm text-gray-600">דירוג ממוצע</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${hasDelivery ? 'text-green-600' : 'text-gray-400'}`}>
            {hasDelivery ? '✓' : '✗'}
          </div>
          <div className="text-sm text-gray-600">משלוחים זמינים</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${allKosher ? 'text-green-600' : 'text-yellow-600'}`}>
            {allKosher ? '✓' : '~'}
          </div>
          <div className="text-sm text-gray-600">הכשרה</div>
        </div>
      </div>

      {/* Coverage Map Placeholder */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-center gap-2 text-sm text-blue-800">
          <MapPin className="w-4 h-4" />
          <span>כיסוי גיאוגרפי: הרשתות הנבחרות מכסות את רוב השטח הישראלי</span>
        </div>
      </div>
    </div>
  )
}