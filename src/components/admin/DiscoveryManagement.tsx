// Discovery Management Admin Interface
'use client'

import React, { useState, useEffect } from 'react'
import { 
    DiscoveredSource, 
    PriceConflict, 
    DiscoveryPattern,
    LearningPattern,
    QualityPrediction,
    AdvancedConflict,
    MarketIntelligence,
    LearningSystemStats
} from '@/lib/database.types'

interface DiscoveryManagementProps {
    isAdmin: boolean
}

interface DiscoveryStats {
    total_sources: number
    pending_sources: number
    approved_sources: number
    avg_reliability: number
    recent_scans: number
}

const DiscoveryManagement: React.FC<DiscoveryManagementProps> = ({ isAdmin }) => {
    const [activeTab, setActiveTab] = useState<'sources' | 'conflicts' | 'queue' | 'analytics' | 'learning'>('sources')
    const [sources, setSources] = useState<DiscoveredSource[]>([])
    const [conflicts, setConflicts] = useState<PriceConflict[]>([])
    const [stats, setStats] = useState<DiscoveryStats | null>(null)
    const [patterns, setPatterns] = useState<DiscoveryPattern[]>([])
    const [loading, setLoading] = useState(false)
    const [runningDiscovery, setRunningDiscovery] = useState(false)
    
    // Advanced Learning state
    const [learningPatterns, setLearningPatterns] = useState<LearningPattern[]>([])
    const [qualityPredictions, setQualityPredictions] = useState<QualityPrediction[]>([])
    const [advancedConflicts, setAdvancedConflicts] = useState<AdvancedConflict[]>([])
    const [marketIntelligence, setMarketIntelligence] = useState<MarketIntelligence[]>([])
    const [learningStats, setLearningStats] = useState<LearningSystemStats | null>(null)
    const [runningLearning, setRunningLearning] = useState(false)

    useEffect(() => {
        if (isAdmin) {
            loadDiscoveryData()
        }
    }, [isAdmin, activeTab])

    const loadDiscoveryData = async () => {
        setLoading(true)
        try {
            const loadPromises = [
                loadSources(),
                loadConflicts(),
                loadStats(),
                loadPatterns()
            ]
            
            // Load Advanced Learning data if on learning tab
            if (activeTab === 'learning') {
                loadPromises.push(
                    loadLearningPatterns(),
                    loadQualityPredictions(),
                    loadAdvancedConflicts(),
                    loadMarketIntelligence(),
                    loadLearningStats()
                )
            }
            
            await Promise.all(loadPromises)
        } catch (error) {
            console.error('Failed to load discovery data:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadSources = async () => {
        try {
            const response = await fetch('/api/discovery/sources')
            const data = await response.json()
            if (data.success) {
                setSources(data.sources)
            }
        } catch (error) {
            console.error('Failed to load sources:', error)
        }
    }

    const loadConflicts = async () => {
        try {
            const response = await fetch('/api/discovery/conflicts?status=unresolved')
            const data = await response.json()
            if (data.success) {
                setConflicts(data.conflicts)
            }
        } catch (error) {
            console.error('Failed to load conflicts:', error)
        }
    }

    const loadStats = async () => {
        try {
            const response = await fetch('/api/discovery/queue')
            const data = await response.json()
            if (data.success) {
                setStats(data.stats)
            }
        } catch (error) {
            console.error('Failed to load stats:', error)
        }
    }

    const loadPatterns = async () => {
        try {
            const response = await fetch('/api/discovery/patterns?active_only=true')
            const data = await response.json()
            if (data.success) {
                setPatterns(data.patterns)
            }
        } catch (error) {
            console.error('Failed to load patterns:', error)
        }
    }

    // Advanced Learning data loading functions
    const loadLearningPatterns = async () => {
        try {
            const response = await fetch('/api/discovery/learning/patterns')
            const data = await response.json()
            if (data.success) {
                setLearningPatterns(data.patterns)
            }
        } catch (error) {
            console.error('Failed to load learning patterns:', error)
        }
    }

    const loadQualityPredictions = async () => {
        try {
            const response = await fetch('/api/discovery/learning/predictions')
            const data = await response.json()
            if (data.success) {
                setQualityPredictions(data.predictions)
            }
        } catch (error) {
            console.error('Failed to load quality predictions:', error)
        }
    }

    const loadAdvancedConflicts = async () => {
        try {
            const response = await fetch('/api/discovery/learning/conflicts')
            const data = await response.json()
            if (data.success) {
                setAdvancedConflicts(data.conflicts)
            }
        } catch (error) {
            console.error('Failed to load advanced conflicts:', error)
        }
    }

    const loadMarketIntelligence = async () => {
        try {
            const response = await fetch('/api/discovery/learning/intelligence')
            const data = await response.json()
            if (data.success) {
                setMarketIntelligence(data.intelligence)
            }
        } catch (error) {
            console.error('Failed to load market intelligence:', error)
        }
    }

    const loadLearningStats = async () => {
        try {
            const response = await fetch('/api/discovery/learning/stats')
            const data = await response.json()
            if (data.success) {
                setLearningStats(data.stats)
            }
        } catch (error) {
            console.error('Failed to load learning stats:', error)
        }
    }

    const runDiscoverySession = async () => {
        setRunningDiscovery(true)
        try {
            const response = await fetch('/api/discovery/queue', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'run_discovery' })
            })
            
            const data = await response.json()
            if (data.success) {
                alert(`Discovery complete! Found ${data.result.totalDiscovered} sources, validated ${data.result.validated}`)
                await loadDiscoveryData()
            } else {
                alert('Discovery failed: ' + data.error)
            }
        } catch (error) {
            console.error('Discovery session failed:', error)
            alert('Discovery session failed')
        } finally {
            setRunningDiscovery(false)
        }
    }

    const approveSource = async (sourceId: string) => {
        try {
            const response = await fetch('/api/discovery/queue', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    action: 'approve', 
                    source_id: sourceId,
                    admin_notes: 'Approved via admin interface'
                })
            })
            
            const data = await response.json()
            if (data.success) {
                await loadSources()
            }
        } catch (error) {
            console.error('Failed to approve source:', error)
        }
    }

    const rejectSource = async (sourceId: string) => {
        try {
            const response = await fetch('/api/discovery/queue', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    action: 'reject', 
                    source_id: sourceId,
                    admin_notes: 'Rejected via admin interface'
                })
            })
            
            const data = await response.json()
            if (data.success) {
                await loadSources()
            }
        } catch (error) {
            console.error('Failed to reject source:', error)
        }
    }

    const resolveConflict = async (conflictId: string) => {
        try {
            const response = await fetch('/api/discovery/conflicts/resolve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    conflict_id: conflictId,
                    method: 'algorithm'
                })
            })
            
            const data = await response.json()
            if (data.success) {
                await loadConflicts()
            }
        } catch (error) {
            console.error('Failed to resolve conflict:', error)
        }
    }

    // Advanced Learning action functions
    const runLearningSession = async () => {
        setRunningLearning(true)
        try {
            const response = await fetch('/api/discovery/learning/run-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'run_learning' })
            })
            
            const data = await response.json()
            if (data.success) {
                alert(`Learning session complete! Learned ${data.result.patternsLearned} patterns, accuracy: ${data.result.accuracy}%`)
                await loadDiscoveryData()
            } else {
                alert('Learning session failed: ' + data.error)
            }
        } catch (error) {
            console.error('Learning session failed:', error)
            alert('Learning session failed')
        } finally {
            setRunningLearning(false)
        }
    }

    const optimizePatterns = async () => {
        try {
            const response = await fetch('/api/discovery/learning/patterns', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'optimize' })
            })
            
            const data = await response.json()
            if (data.success) {
                alert('Pattern optimization completed successfully')
                await loadLearningPatterns()
            } else {
                alert('Pattern optimization failed: ' + data.error)
            }
        } catch (error) {
            console.error('Failed to optimize patterns:', error)
            alert('Pattern optimization failed')
        }
    }

    const generateMarketIntelligence = async () => {
        try {
            const response = await fetch('/api/discovery/learning/intelligence', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'generate' })
            })
            
            const data = await response.json()
            if (data.success) {
                alert('Market intelligence generated successfully')
                await loadMarketIntelligence()
            } else {
                alert('Market intelligence generation failed: ' + data.error)
            }
        } catch (error) {
            console.error('Failed to generate market intelligence:', error)
            alert('Market intelligence generation failed')
        }
    }

    if (!isAdmin) {
        return (
            <div className="text-center p-8">
                <p className="text-red-500">גישה מוגבלת למנהלים בלבד</p>
            </div>
        )
    }

    return (
        <div className="discovery-management max-w-7xl mx-auto p-6" dir="rtl">
            <div className="header mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    מנוע הגילוי - ניהול מקורות
                </h1>
                <p className="text-gray-600">
                    ניהול וניטור של מקורות חדשים לבשר בישראל
                </p>
            </div>

            {/* Stats Dashboard */}
            {stats && (
                <div className="stats-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                    <div className="stat-card bg-blue-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{stats.total_sources}</div>
                        <div className="text-sm text-blue-800">סה&quot;כ מקורות</div>
                    </div>
                    <div className="stat-card bg-yellow-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">{stats.pending_sources}</div>
                        <div className="text-sm text-yellow-800">ממתינים לאישור</div>
                    </div>
                    <div className="stat-card bg-green-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{stats.approved_sources}</div>
                        <div className="text-sm text-green-800">מאושרים</div>
                    </div>
                    <div className="stat-card bg-purple-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                            {Math.round(stats.avg_reliability)}%
                        </div>
                        <div className="text-sm text-purple-800">אמינות ממוצעת</div>
                    </div>
                    <div className="stat-card bg-indigo-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-indigo-600">{stats.recent_scans}</div>
                        <div className="text-sm text-indigo-800">סריקות אחרונות</div>
                    </div>
                </div>
            )}

            {/* Advanced Learning Stats Dashboard */}
            {activeTab === 'learning' && learningStats && (
                <div className="learning-stats-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="stat-card bg-emerald-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-emerald-600">{learningStats.totalPatterns}</div>
                        <div className="text-sm text-emerald-800">תבניות למידה</div>
                    </div>
                    <div className="stat-card bg-cyan-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-cyan-600">
                            {Math.round(learningStats.averageAccuracy)}%
                        </div>
                        <div className="text-sm text-cyan-800">דיוק ממוצע</div>
                    </div>
                    <div className="stat-card bg-pink-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-pink-600">
                            {Math.round(learningStats.autoResolutionRate)}%
                        </div>
                        <div className="text-sm text-pink-800">פתרון אוטומטי</div>
                    </div>
                    <div className="stat-card bg-orange-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{learningStats.marketInsights}</div>
                        <div className="text-sm text-orange-800">תובנות שוק</div>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="actions mb-6">
                <div className="flex flex-wrap gap-4">
                    <button
                        onClick={runDiscoverySession}
                        disabled={runningDiscovery}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                    >
                        {runningDiscovery ? 'מריץ גילוי...' : 'הפעל גילוי חדש'}
                    </button>
                    
                    {activeTab === 'learning' && (
                        <>
                            <button
                                onClick={runLearningSession}
                                disabled={runningLearning}
                                className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 transition-colors"
                            >
                                {runningLearning ? 'מריץ למידה...' : 'הפעל למידה מתקדמת'}
                            </button>
                            <button
                                onClick={optimizePatterns}
                                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                אמן תבניות
                            </button>
                            <button
                                onClick={generateMarketIntelligence}
                                className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors"
                            >
                                צור תובנות שוק
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <div className="tab-buttons flex space-x-4 rtl:space-x-reverse mb-6 border-b">
                    {[
                        { key: 'sources', label: 'מקורות שהתגלו' },
                        { key: 'conflicts', label: 'סתירות מחירים' },
                        { key: 'queue', label: 'תור גילוי' },
                        { key: 'analytics', label: 'אנליטיקס' },
                        { key: 'learning', label: 'למידה מתקדמת' }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                                activeTab === tab.key
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Sources Tab */}
                {activeTab === 'sources' && (
                    <div className="sources-tab">
                        <h3 className="text-xl font-semibold mb-4">
                            מקורות שהתגלו ({sources.length})
                        </h3>
                        
                        {loading ? (
                            <div className="text-center py-8">טוען...</div>
                        ) : sources.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                לא נמצאו מקורות
                            </div>
                        ) : (
                            <div className="sources-grid grid gap-4">
                                {sources.map(source => (
                                    <SourceCard
                                        key={source.id}
                                        source={source}
                                        onApprove={() => approveSource(source.id)}
                                        onReject={() => rejectSource(source.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Conflicts Tab */}
                {activeTab === 'conflicts' && (
                    <div className="conflicts-tab">
                        <h3 className="text-xl font-semibold mb-4">
                            סתירות מחירים ({conflicts.length})
                        </h3>
                        
                        {loading ? (
                            <div className="text-center py-8">טוען...</div>
                        ) : conflicts.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                אין סתירות פתוחות
                            </div>
                        ) : (
                            <div className="conflicts-grid grid gap-4">
                                {conflicts.map(conflict => (
                                    <ConflictCard
                                        key={conflict.id}
                                        conflict={conflict}
                                        onResolve={() => resolveConflict(conflict.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Queue Tab */}
                {activeTab === 'queue' && (
                    <div className="queue-tab">
                        <h3 className="text-xl font-semibold mb-4">תור גילוי</h3>
                        <div className="text-center py-8 text-gray-500">
                            תור הגילוי מנוהל אוטומטית
                        </div>
                    </div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                    <div className="analytics-tab">
                        <h3 className="text-xl font-semibold mb-4">אנליטיקס וביצועים</h3>
                        
                        <div className="patterns-section mb-8">
                            <h4 className="text-lg font-medium mb-3">תבניות גילוי פעילות</h4>
                            {patterns.length > 0 ? (
                                <div className="patterns-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {patterns.slice(0, 6).map(pattern => (
                                        <div key={pattern.id} className="pattern-card bg-gray-50 p-4 rounded-lg">
                                            <div className="font-medium">{pattern.pattern_value}</div>
                                            <div className="text-sm text-gray-600">
                                                סוג: {pattern.pattern_type}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                הצלחה: {Math.round(pattern.success_rate || 0)}%
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                שימושים: {pattern.times_used || 0}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-gray-500">אין תבניות זמינות</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Advanced Learning Tab */}
                {activeTab === 'learning' && (
                    <div className="learning-tab">
                        <h3 className="text-xl font-semibold mb-4">למידה מתקדמת ובינה מלאכותית</h3>
                        
                        {/* Learning Patterns Section */}
                        <div className="learning-patterns-section mb-8">
                            <h4 className="text-lg font-medium mb-3">תבניות למידה מתקדמות ({learningPatterns.length})</h4>
                            {learningPatterns.length > 0 ? (
                                <div className="learning-patterns-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {learningPatterns.slice(0, 6).map(pattern => (
                                        <div key={pattern.id} className="learning-pattern-card bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                                            <div className="font-medium text-emerald-900">{pattern.pattern_value}</div>
                                            <div className="text-sm text-emerald-700 mt-1">
                                                קטגוריה: {pattern.pattern_category}
                                            </div>
                                            <div className="text-sm text-emerald-700">
                                                ביטחון: {Math.round(pattern.confidence_score)}%
                                            </div>
                                            <div className="text-sm text-emerald-700">
                                                הצלחה: {Math.round(pattern.success_rate)}%
                                            </div>
                                            {pattern.hebrew_specific && (
                                                <div className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded mt-2 inline-block">
                                                    מותאם לעברית
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-gray-500">אין תבניות למידה זמינות</div>
                            )}
                        </div>

                        {/* Quality Predictions Section */}
                        <div className="quality-predictions-section mb-8">
                            <h4 className="text-lg font-medium mb-3">תחזיות איכות ({qualityPredictions.length})</h4>
                            {qualityPredictions.length > 0 ? (
                                <div className="predictions-grid grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {qualityPredictions.slice(0, 4).map(prediction => (
                                        <div key={prediction.id} className="prediction-card bg-cyan-50 p-4 rounded-lg border border-cyan-200">
                                            <div className="font-medium text-cyan-900">{prediction.target_name}</div>
                                            <div className="text-sm text-cyan-700 mt-1">
                                                סוג: {prediction.target_type}
                                            </div>
                                            <div className="text-sm text-cyan-700">
                                                אמינות צפויה: {Math.round(prediction.predicted_reliability || 0)}%
                                            </div>
                                            <div className="text-sm text-cyan-700">
                                                ביטחון תחזית: {Math.round(prediction.prediction_confidence || 0)}%
                                            </div>
                                            <div className="text-sm text-cyan-700">
                                                שיטה: {prediction.prediction_method}
                                            </div>
                                            {prediction.validated && (
                                                <div className="text-xs bg-cyan-100 text-cyan-800 px-2 py-1 rounded mt-2 inline-block">
                                                    מאומת
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-gray-500">אין תחזיות איכות זמינות</div>
                            )}
                        </div>

                        {/* Advanced Conflicts Section */}
                        <div className="advanced-conflicts-section mb-8">
                            <h4 className="text-lg font-medium mb-3">סתירות מתקדמות ({advancedConflicts.length})</h4>
                            {advancedConflicts.length > 0 ? (
                                <div className="advanced-conflicts-grid grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {advancedConflicts.slice(0, 4).map(conflict => (
                                        <div key={conflict.id} className="advanced-conflict-card bg-pink-50 p-4 rounded-lg border border-pink-200">
                                            <div className="font-medium text-pink-900">{conflict.primary_item_name}</div>
                                            <div className="text-sm text-pink-700 mt-1">
                                                סוג סתירה: {conflict.conflict_type}
                                            </div>
                                            {conflict.auto_resolution_attempted && (
                                                <div className="text-sm text-pink-700">
                                                    פתרון אוטומטי: {conflict.auto_resolution_success ? 'הצליח' : 'נכשל'}
                                                </div>
                                            )}
                                            {conflict.resolution_confidence && (
                                                <div className="text-sm text-pink-700">
                                                    ביטחון פתרון: {Math.round(conflict.resolution_confidence)}%
                                                </div>
                                            )}
                                            {conflict.hebrew_processing_involved && (
                                                <div className="text-xs bg-pink-100 text-pink-800 px-2 py-1 rounded mt-2 inline-block">
                                                    עיבוד עברית
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-gray-500">אין סתירות מתקדמות</div>
                            )}
                        </div>

                        {/* Market Intelligence Section */}
                        <div className="market-intelligence-section mb-8">
                            <h4 className="text-lg font-medium mb-3">תובנות שוק ({marketIntelligence.length})</h4>
                            {marketIntelligence.length > 0 ? (
                                <div className="intelligence-grid grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {marketIntelligence.slice(0, 4).map(intelligence => (
                                        <div key={intelligence.id} className="intelligence-card bg-orange-50 p-4 rounded-lg border border-orange-200">
                                            <div className="font-medium text-orange-900">
                                                {intelligence.intelligence_type} - {intelligence.market_segment}
                                            </div>
                                            <div className="text-sm text-orange-700 mt-1">
                                                כיוון מגמה: {intelligence.trend_direction}
                                            </div>
                                            <div className="text-sm text-orange-700">
                                                עוצמת מגמה: {Math.round(intelligence.trend_strength || 0)}%
                                            </div>
                                            <div className="text-sm text-orange-700">
                                                רמת ביטחון: {Math.round(intelligence.confidence_level || 0)}%
                                            </div>
                                            {intelligence.hebrew_analysis && (
                                                <div className="text-xs mt-2 text-orange-800 bg-orange-100 p-2 rounded">
                                                    {intelligence.hebrew_analysis.substring(0, 100)}...
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-gray-500">אין תובנות שוק זמינות</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// Source Card Component
interface SourceCardProps {
    source: DiscoveredSource
    onApprove: () => void
    onReject: () => void
}

const SourceCard: React.FC<SourceCardProps> = ({ source, onApprove, onReject }) => {
    const getReliabilityColor = (score: number) => {
        if (score >= 80) return 'text-green-600 bg-green-50'
        if (score >= 60) return 'text-yellow-600 bg-yellow-50'
        return 'text-red-600 bg-red-50'
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'text-green-600 bg-green-50'
            case 'pending': return 'text-yellow-600 bg-yellow-50'
            case 'rejected': return 'text-red-600 bg-red-50'
            default: return 'text-gray-600 bg-gray-50'
        }
    }

    return (
        <div className="source-card bg-white border rounded-lg p-6 shadow-sm">
            <div className="source-header flex justify-between items-start mb-4">
                <div>
                    <h4 className="font-semibold text-lg">{source.name || 'ללא שם'}</h4>
                    <p className="text-sm text-gray-600">{source.url}</p>
                    {source.location && (
                        <p className="text-sm text-gray-600">{source.location}</p>
                    )}
                </div>
                <div className="badges flex flex-col gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getReliabilityColor(source.reliability_score || 0)}`}>
                        {source.reliability_score || 0}% אמינות
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(source.status || 'unknown')}`}>
                        {source.status || 'לא ידוע'}
                    </span>
                </div>
            </div>

            <div className="source-details mb-4">
                <div className="detail-row flex justify-between py-1">
                    <span className="text-sm text-gray-600">שיטת גילוי:</span>
                    <span className="text-sm font-medium">{source.discovery_method || 'לא ידוע'}</span>
                </div>
                <div className="detail-row flex justify-between py-1">
                    <span className="text-sm text-gray-600">תאריך גילוי:</span>
                    <span className="text-sm font-medium">
                        {source.discovery_date ? new Date(source.discovery_date).toLocaleDateString('he-IL') : 'לא ידוע'}
                    </span>
                </div>
                {source.product_categories && source.product_categories.length > 0 && (
                    <div className="detail-row flex justify-between py-1">
                        <span className="text-sm text-gray-600">קטגוריות:</span>
                        <span className="text-sm font-medium">{source.product_categories.join(', ')}</span>
                    </div>
                )}
            </div>

            {source.status === 'pending' && (
                <div className="source-actions flex gap-2">
                    <button
                        onClick={onApprove}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
                    >
                        אשר
                    </button>
                    <button
                        onClick={onReject}
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
                    >
                        דחה
                    </button>
                </div>
            )}
        </div>
    )
}

// Conflict Card Component
interface ConflictCardProps {
    conflict: PriceConflict
    onResolve: () => void
}

const ConflictCard: React.FC<ConflictCardProps> = ({ conflict, onResolve }) => {
    return (
        <div className="conflict-card bg-white border rounded-lg p-6 shadow-sm">
            <div className="conflict-header mb-4">
                <h4 className="font-semibold text-lg">{conflict.product_identifier || 'מוצר לא ידוע'}</h4>
                <div className="price-comparison flex items-center justify-between mt-2">
                    <div className="price-source">
                        <span className="text-sm text-gray-600">מקור 1</span>
                        <div className="text-lg font-bold text-blue-600">₪{conflict.price1}</div>
                    </div>
                    <div className="vs text-gray-400 font-bold">VS</div>
                    <div className="price-source">
                        <span className="text-sm text-gray-600">מקור 2</span>
                        <div className="text-lg font-bold text-red-600">₪{conflict.price2}</div>
                    </div>
                </div>
                <div className="price-difference text-center mt-2">
                    <span className="text-sm text-orange-600 font-medium">
                        הפרש: {conflict.percentage_difference}%
                    </span>
                </div>
            </div>

            <div className="conflict-actions">
                <button
                    onClick={onResolve}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                >
                    פתור אוטומטית
                </button>
            </div>
        </div>
    )
}

export default DiscoveryManagement