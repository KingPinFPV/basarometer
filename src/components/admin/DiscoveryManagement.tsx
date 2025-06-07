// Discovery Management Admin Interface
'use client'

import React, { useState, useEffect } from 'react'
import { DiscoveredSource, PriceConflict, DiscoveryPattern } from '@/lib/database.types'

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
    const [activeTab, setActiveTab] = useState<'sources' | 'conflicts' | 'queue' | 'analytics'>('sources')
    const [sources, setSources] = useState<DiscoveredSource[]>([])
    const [conflicts, setConflicts] = useState<PriceConflict[]>([])
    const [stats, setStats] = useState<DiscoveryStats | null>(null)
    const [patterns, setPatterns] = useState<DiscoveryPattern[]>([])
    const [loading, setLoading] = useState(false)
    const [runningDiscovery, setRunningDiscovery] = useState(false)

    useEffect(() => {
        if (isAdmin) {
            loadDiscoveryData()
        }
    }, [isAdmin, activeTab])

    const loadDiscoveryData = async () => {
        setLoading(true)
        try {
            await Promise.all([
                loadSources(),
                loadConflicts(),
                loadStats(),
                loadPatterns()
            ])
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

            {/* Action Buttons */}
            <div className="actions mb-6">
                <button
                    onClick={runDiscoverySession}
                    disabled={runningDiscovery}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                    {runningDiscovery ? 'מריץ גילוי...' : 'הפעל גילוי חדש'}
                </button>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <div className="tab-buttons flex space-x-4 rtl:space-x-reverse mb-6 border-b">
                    {[
                        { key: 'sources', label: 'מקורות שהתגלו' },
                        { key: 'conflicts', label: 'סתירות מחירים' },
                        { key: 'queue', label: 'תור גילוי' },
                        { key: 'analytics', label: 'אנליטיקס' }
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