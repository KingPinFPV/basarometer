'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Settings, Database, PlusCircle, BarChart3, Users, Package } from 'lucide-react'
import Link from 'next/link'

interface AdminStats {
  totalCategories: number
  totalSubCategories: number
  totalMeatCuts: number
  totalRetailers: number
  totalPriceReports: number
  totalUsers: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalCategories: 0,
    totalSubCategories: 0,
    totalMeatCuts: 0,
    totalRetailers: 0,
    totalPriceReports: 0,
    totalUsers: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)

        const [
          categoriesResult,
          subCategoriesResult,
          cutsResult,
          retailersResult,
          reportsResult,
          usersResult
        ] = await Promise.all([
          supabase.from('meat_categories').select('id', { count: 'exact' }).eq('is_active', true),
          supabase.from('meat_sub_categories').select('id', { count: 'exact' }).eq('is_active', true),
          supabase.from('meat_cuts').select('id', { count: 'exact' }).eq('is_active', true),
          supabase.from('retailers').select('id', { count: 'exact' }).eq('is_active', true),
          supabase.from('price_reports').select('id', { count: 'exact' }).eq('is_active', true),
          supabase.from('user_profiles').select('id', { count: 'exact' })
        ])

        setStats({
          totalCategories: categoriesResult.count || 0,
          totalSubCategories: subCategoriesResult.count || 0,
          totalMeatCuts: cutsResult.count || 0,
          totalRetailers: retailersResult.count || 0,
          totalPriceReports: reportsResult.count || 0,
          totalUsers: usersResult.count || 0
        })
      } catch (error) {
        console.error('Error fetching admin stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="mr-4 text-gray-600 text-lg">טוען נתוני ניהול...</span>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          לוח בקרה ניהולי
        </h1>
        <p className="text-gray-600">
          ניהול מערכת בשרומטר V4 - קטגוריות, נתחים וקמעונאים
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Database className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mr-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  קטגוריות עיקריות
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats.totalCategories}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-8 w-8 text-green-600" />
            </div>
            <div className="mr-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  תת-קטגוריות
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats.totalSubCategories}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Settings className="h-8 w-8 text-purple-600" />
            </div>
            <div className="mr-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  נתחי בשר
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats.totalMeatCuts}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="mr-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  קמעונאים
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats.totalRetailers}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart3 className="h-8 w-8 text-red-600" />
            </div>
            <div className="mr-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  דיווחי מחירים
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats.totalPriceReports}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-indigo-600" />
            </div>
            <div className="mr-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  משתמשים רשומים
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats.totalUsers}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Actions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">פעולות ניהול</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/admin/categories"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <Database className="h-6 w-6 text-blue-600 ml-3" />
              <div>
                <h3 className="text-sm font-medium text-gray-900">ניהול קטגוריות</h3>
                <p className="text-sm text-gray-500">הוספה, עריכה ומחיקה של קטגוריות ותת-קטגוריות</p>
              </div>
            </Link>

            <Link
              href="/admin/cuts"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
            >
              <Settings className="h-6 w-6 text-green-600 ml-3" />
              <div>
                <h3 className="text-sm font-medium text-gray-900">ניהול נתחי בשר</h3>
                <p className="text-sm text-gray-500">קישור נתחים לתת-קטגוריות וניהול מאפיינים</p>
              </div>
            </Link>

            <Link
              href="/admin/bulk-add"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
            >
              <PlusCircle className="h-6 w-6 text-purple-600 ml-3" />
              <div>
                <h3 className="text-sm font-medium text-gray-900">הוספה בכמויות</h3>
                <p className="text-sm text-gray-500">הוספת נתחים מרובים עם קטגוריזציה</p>
              </div>
            </Link>

            <Link
              href="/admin/retailers"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-yellow-300 hover:bg-yellow-50 transition-colors"
            >
              <Users className="h-6 w-6 text-yellow-600 ml-3" />
              <div>
                <h3 className="text-sm font-medium text-gray-900">ניהול קמעונאים</h3>
                <p className="text-sm text-gray-500">הוספה ועריכה של רשתות וחנויות</p>
              </div>
            </Link>

            <Link
              href="/admin/reports"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors"
            >
              <BarChart3 className="h-6 w-6 text-red-600 ml-3" />
              <div>
                <h3 className="text-sm font-medium text-gray-900">דוחות מחירים</h3>
                <p className="text-sm text-gray-500">ניהול ואישור דיווחי מחירים</p>
              </div>
            </Link>

            <Link
              href="/admin/attributes"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
            >
              <Package className="h-6 w-6 text-indigo-600 ml-3" />
              <div>
                <h3 className="text-sm font-medium text-gray-900">ניהול מאפיינים</h3>
                <p className="text-sm text-gray-500">הגדרת תגיות טרי/קפוא/פרימיום</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}