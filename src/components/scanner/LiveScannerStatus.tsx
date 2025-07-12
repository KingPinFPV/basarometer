'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Bot, Activity } from 'lucide-react';

interface LiveStatusData {
  totalProductsToday: number;
  averageConfidence: number;
  lastUpdate: string | null;
  activeSites: number;
}

export default function LiveScannerStatus() {
  const [status, setStatus] = useState<LiveStatusData>({
    totalProductsToday: 0,
    averageConfidence: 0,
    lastUpdate: null,
    activeSites: 0
  });
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuickStatus();
    
    // Subscribe to real-time updates with error handling
    const subscription = supabase
      .channel('scanner-live-status')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'price_reports' },
        handleRealtimeUpdate
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsLive(true);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsLive(false);
        }
      });
    
    // Refresh status every 2 minutes (reduced from 30 seconds)
    const interval = setInterval(() => {
      if (!loading) { // Only fetch if not already loading
        fetchQuickStatus();
      }
    }, 120000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
      setIsLive(false);
    };
  }, [loading, fetchQuickStatus, handleRealtimeUpdate]);

  const fetchQuickStatus = useCallback(async () => {
    try {
      // Quick aggregation for header display
      const { data, error } = await supabase
        .from('price_reports')
        .select('scanner_source, scanner_confidence, created_at')
        .not('scanner_source', 'is', null)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      
      if (error) {
        // Handle specific error cases
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          return;
        }
        if (error.message?.includes('400') || error.message?.includes('unauthorized')) {
          return;
        }
        throw error;
      }
      
      if (data) {
        const totalProducts = data.length;
        const avgConfidence = data && data.length > 0 
          ? (data || []).reduce((sum, item) => sum + (item?.scanner_confidence || 0), 0) / data.length 
          : 0;
        const lastUpdate = data && data.length > 0 
          ? Math.max(...(data || []).map(item => new Date(item?.created_at || new Date()).getTime()))
          : null;
        const activeSites = new Set((data || []).map(item => item?.scanner_source).filter(Boolean)).size;
        
        setStatus({
          totalProductsToday: totalProducts,
          averageConfidence: avgConfidence,
          lastUpdate: lastUpdate ? new Date(lastUpdate).toISOString() : null,
          activeSites
        });
      }
    } catch (error) {
      // Don't show the component if there are persistent errors
      if (status.totalProductsToday === 0) {
        return;
      }
    } finally {
      setLoading(false);
    }
  }, [status.totalProductsToday]);

  const handleRealtimeUpdate = useCallback((payload: { new: { scanner_source?: string } }) => {
    if (payload.new.scanner_source) {
      // Quick refresh when new scanner data arrives
      fetchQuickStatus();
    }
  }, [fetchQuickStatus]);

  const formatLastUpdate = (timestamp: string | null): string => {
    if (!timestamp) return 'אין נתונים';
    
    try {
      const now = new Date();
      const lastUpdate = new Date(timestamp);
      
      // Ensure valid dates
      if (isNaN(lastUpdate.getTime()) || isNaN(now.getTime())) {
        return 'אין נתונים';
      }
      
      const diffInMinutes = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'זה עתה';
      if (diffInMinutes < 60) return `לפני ${diffInMinutes} דקות`;
      if (diffInMinutes < 1440) return `לפני ${Math.floor(diffInMinutes / 60)} שעות`;
      
      // Use consistent date formatting
      return lastUpdate.toLocaleDateString('he-IL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return 'אין נתונים';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <div className="w-3 h-3 bg-gray-300 rounded-full animate-pulse"></div>
        <span className="text-sm">טוען...</span>
      </div>
    );
  }

  // Show nothing if no scanner data
  if (status.totalProductsToday === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm">
      <div className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
        <Bot className="w-4 h-4 text-blue-600" />
        <span className="font-medium text-blue-800">סריקה אוטומטית</span>
      </div>
      
      <div className="flex items-center gap-3 text-blue-700">
        <span className="flex items-center gap-1">
          <Activity className="w-3 h-3" />
          {status.totalProductsToday} מוצרים היום
        </span>
        
        {status.averageConfidence > 0 && (
          <span className="text-xs">
            דיוק: {(status.averageConfidence * 100).toFixed(0)}%
          </span>
        )}
        
        <span className="text-xs text-blue-600">
          {formatLastUpdate(status.lastUpdate)}
        </span>
      </div>
    </div>
  );
}