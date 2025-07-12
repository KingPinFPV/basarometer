'use client'

import React, { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell } from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { MeatIndexData } from '@/hooks/useMeatIndex'

interface EconomicChartsProps {
  indexHistory: MeatIndexData[]
  currentIndex: MeatIndexData | null
}

export function EconomicCharts({ indexHistory, currentIndex }: EconomicChartsProps) {
  const chartData = useMemo(() => {
    return indexHistory.slice(-30).map(item => ({
      date: new Date(item.date).toLocaleDateString('he-IL', { 
        month: 'short', 
        day: 'numeric' 
      }),
      indexValue: item.indexValue,
      volatility: item.marketVolatility,
      beef: item.beefAverage,
      chicken: item.chickenAverage,
      lamb: item.lambAverage,
      turkey: item.turkeyAverage,
      reports: item.totalReports
    }))
  }, [indexHistory])

  const categoryData = useMemo(() => {
    if (!currentIndex) return []
    
    return [
      { 
        name: 'בקר', 
        value: currentIndex.beefAverage,
        color: '#ef4444'
      },
      { 
        name: 'עוף', 
        value: currentIndex.chickenAverage,
        color: '#f59e0b'
      },
      { 
        name: 'כבש', 
        value: currentIndex.lambAverage,
        color: '#8b5cf6'
      },
      { 
        name: 'הודו', 
        value: currentIndex.turkeyAverage,
        color: '#06b6d4'
      }
    ].filter(item => item.value > 0)
  }, [currentIndex])

  const trendData = useMemo(() => {
    if (indexHistory.length < 7) return null

    const recent = indexHistory.slice(-7)
    const weeklyChange = recent[recent.length - 1].indexValue - recent[0].indexValue
    const weeklyPercent = (weeklyChange / recent[0].indexValue) * 100

    return {
      weeklyChange,
      weeklyPercent,
      trend: weeklyChange > 1 ? 'up' : weeklyChange < -1 ? 'down' : 'stable'
    }
  }, [indexHistory])

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg" dir="rtl">
          <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              <span className="font-medium">{entry.name}:</span> 
              {entry.name === 'דיווחים' ? ` ${entry.value}` : ` ₪${entry.value?.toFixed(2)}`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500" dir="rtl">
        <div className="text-center">
          <BarChart className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>אין מספיק נתונים היסטוריים</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8" dir="rtl">
      {/* Index Trend Chart */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">מגמת המדד - 30 ימים אחרונים</h3>
          {trendData && (
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              {trendData.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-600" />}
              {trendData.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-600" />}
              {trendData.trend === 'stable' && <Minus className="w-4 h-4 text-gray-600" />}
              <span className={`text-sm font-medium ${
                trendData.trend === 'up' ? 'text-green-600' : 
                trendData.trend === 'down' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {trendData.weeklyPercent > 0 ? '+' : ''}{trendData.weeklyPercent.toFixed(1)}% השבוע
              </span>
            </div>
          )}
        </div>
        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="indexGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }} 
                stroke="#6b7280"
                reversed
              />
              <YAxis 
                tick={{ fontSize: 12 }} 
                stroke="#6b7280"
                domain={['dataMin - 2', 'dataMax + 2']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="indexValue"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#indexGradient)"
                name="מדד הבשר"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Comparison */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">השוואת קטגוריות - מחירים נוכחיים</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }} 
                stroke="#6b7280"
              />
              <YAxis 
                tick={{ fontSize: 12 }} 
                stroke="#6b7280"
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="value" 
                name="מחיר ממוצע"
                radius={[4, 4, 0, 0]}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Volatility Chart */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">תנודתיות שוק ודיווחים יומיים</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }} 
                stroke="#6b7280"
                reversed
              />
              <YAxis 
                yAxisId="volatility"
                orientation="right"
                tick={{ fontSize: 12 }} 
                stroke="#f59e0b"
                domain={[0, 'dataMax + 5']}
              />
              <YAxis 
                yAxisId="reports"
                orientation="left"
                tick={{ fontSize: 12 }} 
                stroke="#10b981"
                domain={[0, 'dataMax + 5']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                yAxisId="volatility"
                type="monotone"
                dataKey="volatility"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="תנודתיות %"
              />
              <Line
                yAxisId="reports"
                type="monotone"
                dataKey="reports"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="דיווחים"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center space-x-6 rtl:space-x-reverse mt-2 text-sm">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
            <span className="text-gray-600">תנודתיות שוק</span>
          </div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">מספר דיווחים</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EconomicCharts