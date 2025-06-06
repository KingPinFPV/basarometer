// Admin Interface for Meat Cut Intelligence Management
// Handles approval of auto-discovered cuts and quality grade management
// Built on existing admin patterns with enhanced meat classification

'use client'

import React, { useState, useEffect } from 'react'
import { 
  Check, 
  X, 
  Eye, 
  Brain, 
  TrendingUp, 
  AlertTriangle,
  Settings,
  Plus,
  Edit3,
  Trash2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

interface DiscoveryItem {
  id: string
  product_name: string
  normalized_suggestion: string
  quality_grade_suggestion: string
  confidence_score: number
  source_site: string
  auto_classification: any
  manual_review_needed: boolean
  created_at: string
  occurrence_count: number
}

interface MappingRule {
  id: string
  original_name: string
  normalized_name: string
  quality_grade: string
  confidence_score: number
  source: string
  auto_learned: boolean
  usage_count: number
  last_seen: string
}

interface AdminStats {
  pending_reviews: number
  auto_approved: number
  accuracy_rate: number
  new_variations_week: number
  total_mappings: number
  learning_performance: {
    high_confidence: number
    medium_confidence: number
    low_confidence: number
  }
}

export default function MeatIntelligenceAdmin() {
  const { profile } = useAuth()
  const isAdmin = profile?.is_admin || false
  const [discoveryQueue, setDiscoveryQueue] = useState<DiscoveryItem[]>([])
  const [mappingRules, setMappingRules] = useState<MappingRule[]>([])
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState('queue')

  // Filter states
  const [confidenceFilter, setConfidenceFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [gradeFilter] = useState('all')

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData()
    }
  }, [isAdmin])

  if (!isAdmin) {
    return (
      <div className="text-center py-12" dir="rtl">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">גישה מוגבלת</h2>
        <p className="text-gray-600">אין לך הרשאות מנהל למערכת החכמה</p>
      </div>
    )
  }

  const fetchAdminData = async () => {
    try {
      setLoading(true)

      // Fetch discovery queue
      const { data: queueData, error: queueError } = await supabase
        .from('meat_discovery_queue')
        .select('*')
        .eq('approved', false)
        .order('confidence_score', { ascending: false })

      if (queueError) throw queueError

      // Fetch mapping rules
      const { data: mappingData, error: mappingError } = await supabase
        .from('meat_name_mappings')
        .select('*')
        .order('usage_count', { ascending: false })

      if (mappingError) throw mappingError

      // Calculate admin stats
      const stats = await calculateAdminStats(queueData || [], mappingData || [])

      setDiscoveryQueue(queueData || [])
      setMappingRules(mappingData || [])
      setAdminStats(stats)

    } catch (error) {
      console.error('Error fetching admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const approveDiscoveryItem = async (item: DiscoveryItem, approved: boolean) => {
    try {
      if (approved) {
        // Create new mapping rule
        const { error: mappingError } = await supabase
          .from('meat_name_mappings')
          .insert({
            original_name: item.product_name,
            normalized_name: item.normalized_suggestion,
            quality_grade: item.quality_grade_suggestion,
            confidence_score: item.confidence_score,
            source: 'admin_approved',
            auto_learned: false
          })

        if (mappingError) throw mappingError
      }

      // Update discovery item
      const { error: updateError } = await supabase
        .from('meat_discovery_queue')
        .update({ 
          approved: approved,
          manual_review_needed: false 
        })
        .eq('id', item.id)

      if (updateError) throw updateError

      // Refresh data
      fetchAdminData()

    } catch (error) {
      console.error('Error updating discovery item:', error)
    }
  }

  const updateMappingRule = async (ruleId: string, updates: Partial<MappingRule>) => {
    try {
      const { error } = await supabase
        .from('meat_name_mappings')
        .update(updates)
        .eq('id', ruleId)

      if (error) throw error

      fetchAdminData()
    } catch (error) {
      console.error('Error updating mapping rule:', error)
    }
  }

  const deleteMappingRule = async (ruleId: string) => {
    try {
      const { error } = await supabase
        .from('meat_name_mappings')
        .delete()
        .eq('id', ruleId)

      if (error) throw error

      fetchAdminData()
    } catch (error) {
      console.error('Error deleting mapping rule:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען נתוני מנהל...</p>
        </div>
      </div>
    )
  }

  const filteredQueue = discoveryQueue.filter(item => {
    if (confidenceFilter !== 'all') {
      const threshold = parseFloat(confidenceFilter)
      if (item.confidence_score < threshold) return false
    }
    if (sourceFilter !== 'all' && item.source_site !== sourceFilter) return false
    if (gradeFilter !== 'all' && item.quality_grade_suggestion !== gradeFilter) return false
    return true
  })

  const filteredMappings = mappingRules.filter(rule => {
    if (gradeFilter !== 'all' && rule.quality_grade !== gradeFilter) return false
    return true
  })

  return (
    <div className="space-y-6" dir="rtl">
      {/* Admin Header */}
      <div className="bg-gradient-to-l from-purple-50 to-white rounded-lg p-6 border">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="h-8 w-8 text-purple-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              מערכת החכמה - ניהול מנהל
            </h1>
            <p className="text-gray-600">
              ניהול ואישור מיפויי בשר אוטומטיים
            </p>
          </div>
        </div>

        {/* Admin Stats */}
        {adminStats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {adminStats.pending_reviews}
              </div>
              <div className="text-sm text-gray-600">ממתינים לאישור</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {adminStats.auto_approved}
              </div>
              <div className="text-sm text-gray-600">אושר אוטומטית</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(adminStats.accuracy_rate)}%
              </div>
              <div className="text-sm text-gray-600">דיוק למידה</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {adminStats.new_variations_week}
              </div>
              <div className="text-sm text-gray-600">חדשים השבוע</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-700">
                {adminStats.total_mappings}
              </div>
              <div className="text-sm text-gray-600">כלל המיפויים</div>
            </div>
          </div>
        )}
      </div>

      {/* Simple Tab Navigation */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setSelectedTab('queue')}
              className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm ${
                selectedTab === 'queue'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Eye className="h-4 w-4 inline ml-2" />
              תור אישורים ({discoveryQueue.length})
            </button>
            <button
              onClick={() => setSelectedTab('mappings')}
              className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm ${
                selectedTab === 'mappings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Settings className="h-4 w-4 inline ml-2" />
              כללי מיפוי ({mappingRules.length})
            </button>
            <button
              onClick={() => setSelectedTab('analytics')}
              className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm ${
                selectedTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <TrendingUp className="h-4 w-4 inline ml-2" />
              ניתוח ביצועים
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {selectedTab === 'queue' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h3 className="text-lg font-semibold">גילויים חדשים - דורשים אישור</h3>
                
                {/* Filters */}
                <div className="flex gap-2">
                  <select 
                    value={confidenceFilter} 
                    onChange={(e) => setConfidenceFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="all">כל הרמות</option>
                    <option value="0.8">80%+</option>
                    <option value="0.6">60%+</option>
                    <option value="0.4">40%+</option>
                  </select>

                  <select 
                    value={sourceFilter} 
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="all">כל המקורות</option>
                    <option value="rami-levy">רמי לוי</option>
                    <option value="shufersal">שופרסל</option>
                    <option value="carrefour">קרפור</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                {filteredQueue.map((item) => (
                  <DiscoveryItemCard
                    key={item.id}
                    item={item}
                    onApprove={(approved) => approveDiscoveryItem(item, approved)}
                  />
                ))}
                
                {filteredQueue.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    אין פריטים חדשים לבדיקה
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedTab === 'mappings' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">כללי מיפוי פעילים</h3>
                <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                  <Plus className="h-4 w-4 ml-2" />
                  הוסף כלל חדש
                </button>
              </div>

              <div className="space-y-4">
                {filteredMappings.slice(0, 20).map((rule) => (
                  <MappingRuleCard
                    key={rule.id}
                    rule={rule}
                    onUpdate={(updates) => updateMappingRule(rule.id, updates)}
                    onDelete={() => deleteMappingRule(rule.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {selectedTab === 'analytics' && (
            <div>
              <h3 className="text-lg font-semibold mb-6">ביצועי מערכת הלמידה</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {adminStats?.learning_performance && Object.entries(adminStats.learning_performance).map(([level, count]) => (
                  <div key={level} className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold mb-2">
                      {count}
                    </div>
                    <div className="text-sm text-gray-600">
                      {level === 'high_confidence' && 'ביטחון גבוה (80%+)'}
                      {level === 'medium_confidence' && 'ביטחון בינוני (60-80%)'}
                      {level === 'low_confidence' && 'ביטחון נמוך (<60%)'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Discovery Item Card Component
function DiscoveryItemCard({ 
  item, 
  onApprove 
}: {
  item: DiscoveryItem
  onApprove: (approved: boolean) => void
}) {
  const confidenceColor = item.confidence_score >= 0.8 ? 'text-green-600' : 
                         item.confidence_score >= 0.6 ? 'text-yellow-600' : 'text-red-600'

  return (
    <div className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-medium text-lg mb-1">
            {item.product_name}
          </h3>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {item.normalized_suggestion}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {item.quality_grade_suggestion}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            מקור: {item.source_site} • 
            <span className={`font-medium ${confidenceColor}`}>
              {Math.round(item.confidence_score * 100)}% ביטחון
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onApprove(true)}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            onClick={() => onApprove(false)}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Auto Classification Details */}
      {item.auto_classification && (
        <div className="bg-gray-50 rounded p-3 text-sm">
          <div className="font-medium mb-1">פירוט סיווג אוטומטי:</div>
          <pre className="text-xs text-gray-600 whitespace-pre-wrap">
            {JSON.stringify(item.auto_classification, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

// Mapping Rule Card Component
function MappingRuleCard({ 
  rule, 
  onUpdate, 
  onDelete 
}: {
  rule: MappingRule
  onUpdate: (updates: Partial<MappingRule>) => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [editValues, setEditValues] = useState({
    normalized_name: rule.normalized_name,
    quality_grade: rule.quality_grade,
    confidence_score: rule.confidence_score
  })

  const handleSave = () => {
    onUpdate(editValues)
    setEditing(false)
  }

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">שם מקורי:</label>
                <div className="text-sm text-gray-600">{rule.original_name}</div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">שם מנורמל:</label>
                <input
                  type="text"
                  value={editValues.normalized_name}
                  onChange={(e) => setEditValues({...editValues, normalized_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">איכות:</label>
                <select 
                  value={editValues.quality_grade} 
                  onChange={(e) => setEditValues({...editValues, quality_grade: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="regular">רגיל</option>
                  <option value="premium">פרמיום</option>
                  <option value="angus">אנגוס</option>
                  <option value="wagyu">וואגיו</option>
                  <option value="veal">עגל</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleSave}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                  שמור
                </button>
                <button 
                  onClick={() => setEditing(false)}
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
                >
                  ביטול
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="font-medium mb-1">{rule.original_name}</div>
              <div className="text-sm text-gray-600 mb-1">
                → {rule.normalized_name}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  {rule.quality_grade}
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  {Math.round(rule.confidence_score * 100)}% ביטחון
                </span>
                {rule.auto_learned && (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                    למידה אוטומטית
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500">
                שימושים: {rule.usage_count} • מקור: {rule.source}
              </div>
            </div>
          )}
        </div>

        {!editing && (
          <div className="flex gap-1">
            <button
              onClick={() => setEditing(true)}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <Edit3 className="h-4 w-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-red-400 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Calculate admin statistics
async function calculateAdminStats(
  queueData: DiscoveryItem[],
  mappingData: MappingRule[]
): Promise<AdminStats> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  
  const pendingReviews = (queueData || []).filter(item => item?.manual_review_needed).length
  const autoApproved = (queueData || []).filter(item => !item?.manual_review_needed).length
  
  const totalConfidenceSum = (mappingData || []).reduce((sum, rule) => sum + (rule?.confidence_score || 0), 0)
  const accuracyRate = mappingData && mappingData.length > 0 ? (totalConfidenceSum / mappingData.length) * 100 : 0
  
  const newVariationsWeek = (mappingData || []).filter(rule => 
    rule?.last_seen && new Date(rule.last_seen) > weekAgo
  ).length

  const learningPerformance = {
    high_confidence: (mappingData || []).filter(rule => (rule?.confidence_score || 0) >= 0.8).length,
    medium_confidence: (mappingData || []).filter(rule => (rule?.confidence_score || 0) >= 0.6 && (rule?.confidence_score || 0) < 0.8).length,
    low_confidence: (mappingData || []).filter(rule => (rule?.confidence_score || 0) < 0.6).length
  }

  return {
    pending_reviews: pendingReviews,
    auto_approved: autoApproved,
    accuracy_rate: accuracyRate,
    new_variations_week: newVariationsWeek,
    total_mappings: (mappingData || []).length,
    learning_performance: learningPerformance
  }
}