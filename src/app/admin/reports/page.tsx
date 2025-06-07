'use client'

import { useState, useEffect } from 'react'
import { BarChart3, Eye, Check, X, AlertTriangle, Calendar, User, MapPin } from 'lucide-react'

interface PriceReport {
  id: number
  product_name: string
  retailer_name: string
  location: string
  price: number
  unit: string
  reporter_email: string
  report_date: string
  status: 'pending' | 'approved' | 'rejected'
  notes?: string
  confidence_score: number
}

export default function ReportsPage() {
  const [reports, setReports] = useState<PriceReport[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [selectedReport, setSelectedReport] = useState<PriceReport | null>(null)

  useEffect(() => {
    // Mock data for now - replace with actual API call
    const mockReports: PriceReport[] = [
      {
        id: 1,
        product_name: 'אנטריקוט בקר',
        retailer_name: 'שופרסל',
        location: 'תל אביב - רחוב דיזנגוף',
        price: 89.90,
        unit: 'קג',
        reporter_email: 'user1@example.com',
        report_date: '2025-01-06T10:30:00Z',
        status: 'pending',
        confidence_score: 85
      },
      {
        id: 2,
        product_name: 'כתף כבש',
        retailer_name: 'רמי לוי',
        location: 'ירושלים - קניון מלחה',
        price: 75.50,
        unit: 'קג',
        reporter_email: 'user2@example.com',
        report_date: '2025-01-06T14:15:00Z',
        status: 'approved',
        confidence_score: 92
      },
      {
        id: 3,
        product_name: 'חזה עוף',
        retailer_name: 'יוחננוף',
        location: 'חיפה - כרמל',
        price: 35.90,
        unit: 'קג',
        reporter_email: 'user3@example.com',
        report_date: '2025-01-06T16:45:00Z',
        status: 'rejected',
        notes: 'מחיר לא סביר - חריג מדי',
        confidence_score: 42
      }
    ]
    
    setTimeout(() => {
      setReports(mockReports)
      setLoading(false)
    }, 500)
  }, [])

  const filteredReports = reports.filter(report => 
    filter === 'all' || report.status === filter
  )

  const handleApprove = (id: number) => {
    setReports(reports.map(report => 
      report.id === id 
        ? { ...report, status: 'approved' as const }
        : report
    ))
  }

  const handleReject = (id: number, notes?: string) => {
    setReports(reports.map(report => 
      report.id === id 
        ? { ...report, status: 'rejected' as const, notes }
        : report
    ))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'ממתין'
      case 'approved': return 'אושר'
      case 'rejected': return 'נדחה'
      default: return status
    }
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="mr-4 text-gray-600 text-lg">טוען דוחות מחירים...</span>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ניהול דוחות מחירים
        </h1>
        <p className="text-gray-600">
          בדיקה ואישור דיווחי מחירים שנשלחו על ידי משתמשים
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-500">ממתינים לאישור</p>
              <p className="text-2xl font-bold text-gray-900">
                {reports.filter(r => r.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Check className="h-8 w-8 text-green-500" />
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-500">אושרו</p>
              <p className="text-2xl font-bold text-gray-900">
                {reports.filter(r => r.status === 'approved').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <X className="h-8 w-8 text-red-500" />
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-500">נדחו</p>
              <p className="text-2xl font-bold text-gray-900">
                {reports.filter(r => r.status === 'rejected').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-blue-500" />
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-500">סה"כ דוחות</p>
              <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex space-x-4 rtl:space-x-reverse">
          {[
            { key: 'all', label: 'הכל' },
            { key: 'pending', label: 'ממתינים' },
            { key: 'approved', label: 'אושרו' },
            { key: 'rejected', label: 'נדחו' }
          ].map((filterOption) => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key as any)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === filterOption.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {filterOption.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <BarChart3 className="h-5 w-5 ml-2" />
            דוחות מחירים ({filteredReports.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  מוצר
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  חנות
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  מחיר
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  ביטחון
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  תאריך
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  סטטוס
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  פעולות
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {report.product_name}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <User className="h-3 w-3 ml-1" />
                      {report.reporter_email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {report.retailer_name}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <MapPin className="h-3 w-3 ml-1" />
                      {report.location}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">
                      ₪{report.price.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      ל{report.unit}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${getConfidenceColor(report.confidence_score)}`}>
                      {report.confidence_score}%
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                      <div 
                        className={`h-1 rounded-full ${
                          report.confidence_score >= 80 ? 'bg-green-500' :
                          report.confidence_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${report.confidence_score}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center">
                      <Calendar className="h-3 w-3 ml-1" />
                      {new Date(report.report_date).toLocaleDateString('he-IL')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(report.report_date).toLocaleTimeString('he-IL', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(report.status)}`}>
                      {getStatusText(report.status)}
                    </span>
                    {report.notes && (
                      <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                        {report.notes}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="text-blue-600 hover:text-blue-800"
                        title="צפה בפרטים"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {report.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(report.id)}
                            className="text-green-600 hover:text-green-800"
                            title="אשר דוח"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleReject(report.id)}
                            className="text-red-600 hover:text-red-800"
                            title="דחה דוח"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredReports.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {filter === 'all' ? 'אין דוחות מחירים במערכת' : `אין דוחות בסטטוס "${getStatusText(filter)}"`}
          </p>
        </div>
      )}

      {/* Report Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">פרטי דוח מחיר</h3>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">מוצר</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedReport.product_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">חנות</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedReport.retailer_name}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">מיקום</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedReport.location}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">מחיר</label>
                    <p className="mt-1 text-sm text-gray-900">₪{selectedReport.price.toFixed(2)} ל{selectedReport.unit}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">דירוג ביטחון</label>
                    <p className={`mt-1 text-sm font-medium ${getConfidenceColor(selectedReport.confidence_score)}`}>
                      {selectedReport.confidence_score}%
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">מדווח</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedReport.reporter_email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">תאריך דוח</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedReport.report_date).toLocaleString('he-IL')}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">סטטוס</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${getStatusColor(selectedReport.status)}`}>
                    {getStatusText(selectedReport.status)}
                  </span>
                </div>

                {selectedReport.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">הערות</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedReport.notes}</p>
                  </div>
                )}

                {selectedReport.status === 'pending' && (
                  <div className="flex space-x-3 rtl:space-x-reverse pt-4 border-t">
                    <button
                      onClick={() => {
                        handleApprove(selectedReport.id)
                        setSelectedReport(null)
                      }}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Check className="h-4 w-4 inline ml-1" />
                      אשר דוח
                    </button>
                    <button
                      onClick={() => {
                        const notes = prompt('הזן הערה (אופציונלי):')
                        handleReject(selectedReport.id, notes || undefined)
                        setSelectedReport(null)
                      }}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <X className="h-4 w-4 inline ml-1" />
                      דחה דוח
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}