'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface ScannerStatus {
  site_name: string;
  products_today: number;
  avg_confidence: number;
  last_update: string;
  products_last_hour: number;
  quality_rating: string;
  trend_7d: number;
}

interface ScannerLog {
  id: string;
  timestamp: string;
  target_site: string;
  total_products: number;
  processed_products: number;
  status: string;
  average_confidence: number;
}

export default function ScannerDashboard() {
  const [status, setStatus] = useState<ScannerStatus[]>([]);
  const [logs, setLogs] = useState<ScannerLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    fetchScannerData();
    
    // Subscribe to real-time updates
    const statusSubscription = supabase
      .channel('scanner-status')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'price_reports' },
        handleRealtimeUpdate
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'scanner_ingestion_logs' },
        handleLogUpdate
      )
      .subscribe();

    setIsLive(true);

    return () => {
      statusSubscription.unsubscribe();
      setIsLive(false);
    };
  }, [handleLogUpdate, handleRealtimeUpdate]);

  const fetchScannerData = async () => {
    try {
      // Fetch scanner status with error handling
      try {
        const { data: statusData, error: statusError } = await supabase
          .rpc('get_scanner_dashboard_data');
        
        if (statusError) {
          if (statusError.code === 'PGRST202' || statusError.message?.includes('does not exist')) {
            setStatus([]);
          } else {
            throw statusError;
          }
        } else if (statusData) {
          setStatus(statusData);
        }
      } catch (rpcError) {
        setStatus([]);
      }

      // Fetch recent logs with error handling
      try {
        const { data: logsData, error: logsError } = await supabase
          .from('scanner_ingestion_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(10);
          
        if (logsError) {
          if (logsError.code === 'PGRST116' || logsError.message?.includes('does not exist')) {
            setLogs([]);
          } else {
            throw logsError;
          }
        } else if (logsData) {
          setLogs(logsData);
        }
      } catch (logsError) {
        setLogs([]);
      }
      
    } catch (error) {
      // Error already handled
    } finally {
      setLoading(false);
    }
  };

  const handleRealtimeUpdate = useCallback((payload: { new: { scanner_source?: string } }) => {
    if (payload.new.scanner_source) {
      fetchScannerData(); // Refresh the status
    }
  }, []);

  const handleLogUpdate = useCallback((payload: { new: ScannerLog }) => {
    setLogs(prev => [payload.new, ...prev.slice(0, 9)]);
  }, []);

  const getStatusColor = (rating: string): string => {
    switch (rating) {
      case 'Excellent': return 'text-green-600 bg-green-100';
      case 'Good': return 'text-blue-600 bg-blue-100';
      case 'Fair': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-red-600 bg-red-100';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'success': return '✅';
      case 'completed': return '🎯';
      case 'started': return '🚀';
      case 'failed': return '❌';
      default: return '⏸️';
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse bg-white rounded-lg shadow-md p-6" dir="rtl">
        <div className="h-6 bg-gray-200 rounded mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          🤖 מערכת הסריקה האוטומטית
        </h2>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <span className="text-sm text-gray-600">
            {isLive ? 'חי' : 'לא מחובר'}
          </span>
        </div>
      </div>

      {/* Scanner Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {status.map((scanner) => (
          <div key={scanner.site_name} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">{scanner.site_name}</h3>
              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(scanner.quality_rating)}`}>
                {scanner.quality_rating}
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">מוצרים היום:</span>
                <span className="font-bold text-blue-600">
                  {scanner.products_today.toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">ביטחון ממוצע:</span>
                <span className={`font-bold ${
                  scanner.avg_confidence >= 0.85 ? 'text-green-600' : 
                  scanner.avg_confidence >= 0.7 ? 'text-blue-600' : 'text-yellow-600'
                }`}>
                  {(scanner.avg_confidence * 100).toFixed(1)}%
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">בשעה האחרונה:</span>
                <span className="font-bold text-purple-600">
                  {scanner.products_last_hour}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">ממוצע שבועי:</span>
                <span className="font-bold text-gray-600">
                  {Math.round(scanner.trend_7d)}
                </span>
              </div>
              
              <div className="text-xs text-gray-500 mt-3 border-t pt-2">
                עדכון אחרון: {new Date(scanner.last_update).toLocaleString('he-IL')}
              </div>
            </div>
          </div>
        ))}
        
        {status.length === 0 && (
          <div className="col-span-full text-center text-gray-500 py-8">
            אין נתוני סריקה זמינים היום
          </div>
        )}
      </div>

      {/* Recent Activity Log */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">פעילות אחרונה</h3>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-lg">{getStatusIcon(log.status)}</span>
                <div>
                  <div className="font-medium">{log.target_site}</div>
                  <div className="text-sm text-gray-600">
                    {log.processed_products} מתוך {log.total_products} מוצרים
                    {log.average_confidence && (
                      <span className="mr-2">
                        | ביטחון: {(log.average_confidence * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {new Date(log.timestamp).toLocaleString('he-IL')}
              </div>
            </div>
          ))}
          
          {logs.length === 0 && (
            <div className="text-center text-gray-500 py-4">
              אין פעילות אחרונה
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {(status || []).reduce((sum, s) => sum + (s?.products_today || 0), 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">סה&quot;כ מוצרים היום</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {status && status.length ? ((status || []).reduce((sum, s) => sum + (s?.avg_confidence || 0), 0) / status.length * 100).toFixed(1) : 0}%
          </div>
          <div className="text-sm text-gray-600">ביטחון ממוצע</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {(status || []).reduce((sum, s) => sum + (s?.products_last_hour || 0), 0)}
          </div>
          <div className="text-sm text-gray-600">מוצרים בשעה</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {(status || []).filter(s => s?.quality_rating === 'Excellent' || s?.quality_rating === 'Good').length}
          </div>
          <div className="text-sm text-gray-600">אתרים איכותיים</div>
        </div>
      </div>
    </div>
  );
}