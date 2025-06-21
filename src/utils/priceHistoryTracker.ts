import { supabase } from '@/lib/supabase'
import type { PriceReport } from '@/lib/database.types'

export interface PriceChangeEvent {
  price_report_id: string
  old_price: number
  new_price: number
  change_type: 'increase' | 'decrease' | 'sale_start' | 'sale_end'
  changed_at: string
}

/**
 * Price History Tracker - Automatically tracks all price changes for trend analysis
 * This system starts building data from V5.1 deployment onwards
 */
export class PriceHistoryTracker {
  
  /**
   * Track a new price report (initial entry)
   */
  static async trackNewPriceReport(priceReport: PriceReport): Promise<void> {
    try {
      await supabase
        .from('price_history')
        .insert({
          price_report_id: priceReport.id,
          old_price: 0, // Initial entry
          new_price: priceReport.price_per_kg,
          change_type: priceReport.is_on_sale ? 'sale_start' : 'increase',
          changed_at: priceReport.created_at
        })
    } catch (err) {
      console.error('Failed to track new price report:', err)
    }
  }

  /**
   * Track price update (when existing report is modified)
   */
  static async trackPriceUpdate(
    priceReportId: string,
    oldPrice: number,
    newPrice: number,
    oldSaleStatus: boolean,
    newSaleStatus: boolean
  ): Promise<void> {
    try {
      let changeType: PriceChangeEvent['change_type']

      // Determine change type
      if (!oldSaleStatus && newSaleStatus) {
        changeType = 'sale_start'
      } else if (oldSaleStatus && !newSaleStatus) {
        changeType = 'sale_end'
      } else if (newPrice > oldPrice) {
        changeType = 'increase'
      } else if (newPrice < oldPrice) {
        changeType = 'decrease'
      } else {
        return // No significant change
      }

      await supabase
        .from('price_history')
        .insert({
          price_report_id: priceReportId,
          old_price: oldPrice,
          new_price: newPrice,
          change_type: changeType,
          changed_at: new Date().toISOString()
        })
    } catch (err) {
      console.error('Failed to track price update:', err)
    }
  }

  /**
   * Track price expiration (when report becomes inactive)
   */
  static async trackPriceExpiration(priceReportId: string, lastPrice: number): Promise<void> {
    try {
      await supabase
        .from('price_history')
        .insert({
          price_report_id: priceReportId,
          old_price: lastPrice,
          new_price: 0, // Expired
          change_type: 'decrease', // Treat expiration as decrease
          changed_at: new Date().toISOString()
        })
    } catch (err) {
      console.error('Failed to track price expiration:', err)
    }
  }

  /**
   * Bulk initialize history for existing price reports (one-time migration)
   */
  static async initializeExistingReports(): Promise<void> {
    try {
      // Get all existing active price reports that don't have history
      const { data: existingReports, error: fetchError } = await supabase
        .from('price_reports')
        .select(`
          id,
          price_per_kg,
          is_on_sale,
          created_at,
          price_history!left(price_report_id)
        `)
        .eq('is_active', true)
        .is('price_history.price_report_id', null)
        .limit(100) // Process in batches

      if (fetchError) throw fetchError

      if (!existingReports || existingReports.length === 0) {
        console.log('No existing reports to initialize')
        return
      }

      // Create initial history entries
      const historyEntries = existingReports.map(report => ({
        price_report_id: report.id,
        old_price: 0,
        new_price: report.price_per_kg,
        change_type: report.is_on_sale ? 'sale_start' : 'increase' as const,
        changed_at: report.created_at
      }))

      const { error: insertError } = await supabase
        .from('price_history')
        .insert(historyEntries)

      if (insertError) throw insertError

      console.log(`Initialized history for ${existingReports.length} price reports`)
    } catch (err) {
      console.error('Failed to initialize existing reports:', err)
    }
  }

  /**
   * Get price change statistics for a meat cut
   */
  static async getPriceChangeStats(meatCutId: string, days: number = 30): Promise<{
    totalChanges: number
    increases: number
    decreases: number
    saleStarts: number
    saleEnds: number
    avgChangePercent: number
  }> {
    try {
      const fromDate = new Date()
      fromDate.setDate(fromDate.getDate() - days)

      const { data: changes, error: fetchError } = await supabase
        .from('price_history')
        .select(`
          *,
          price_report:price_reports!inner(
            meat_cut_id
          )
        `)
        .eq('price_report.meat_cut_id', meatCutId)
        .gte('changed_at', fromDate.toISOString())

      if (fetchError) throw fetchError

      if (!changes || changes.length === 0) {
        return {
          totalChanges: 0,
          increases: 0,
          decreases: 0,
          saleStarts: 0,
          saleEnds: 0,
          avgChangePercent: 0
        }
      }

      const stats = (changes || []).reduce((acc, change) => {
        acc.totalChanges++
        
        switch (change.change_type) {
          case 'increase':
            acc.increases++
            break
          case 'decrease':
            acc.decreases++
            break
          case 'sale_start':
            acc.saleStarts++
            break
          case 'sale_end':
            acc.saleEnds++
            break
        }

        // Calculate percentage change
        if ((change?.old_price || 0) > 0) {
          const changePercent = (((change?.new_price || 0) - (change?.old_price || 0)) / (change?.old_price || 1)) * 100
          acc.totalChangePercent += Math.abs(changePercent)
        }

        return acc
      }, {
        totalChanges: 0,
        increases: 0,
        decreases: 0,
        saleStarts: 0,
        saleEnds: 0,
        totalChangePercent: 0
      })

      return {
        ...stats,
        avgChangePercent: stats.totalChanges > 0 ? stats.totalChangePercent / stats.totalChanges : 0
      }
    } catch (err) {
      console.error('Failed to get price change stats:', err)
      return {
        totalChanges: 0,
        increases: 0,
        decreases: 0,
        saleStarts: 0,
        saleEnds: 0,
        avgChangePercent: 0
      }
    }
  }

  /**
   * Clean up old history entries (keep last 2 years)
   */
  static async cleanupOldHistory(): Promise<void> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 2)

      const { error: deleteError } = await supabase
        .from('price_history')
        .delete()
        .lt('changed_at', cutoffDate.toISOString())

      if (deleteError) throw deleteError

      console.log('Cleaned up old price history entries')
    } catch (err) {
      console.error('Failed to cleanup old history:', err)
    }
  }
}

/**
 * Hook into price report changes to automatically track history
 * This should be called whenever price reports are created/updated
 */
export const setupPriceHistoryTracking = () => {
  // This would typically be set up as database triggers or in API routes
  console.log('Price history tracking setup - ready to track changes from V5.1 onwards')
  
  // Initialize existing reports (one-time migration)
  PriceHistoryTracker.initializeExistingReports()
}

/**
 * Utility to manually trigger price change tracking
 * Use this in forms/API routes when price reports are modified
 */
export const triggerPriceChangeTracking = async (
  action: 'create' | 'update' | 'expire',
  priceReport: PriceReport,
  oldPrice?: number,
  oldSaleStatus?: boolean
) => {
  switch (action) {
    case 'create':
      await PriceHistoryTracker.trackNewPriceReport(priceReport)
      break
    case 'update':
      if (oldPrice !== undefined && oldSaleStatus !== undefined) {
        await PriceHistoryTracker.trackPriceUpdate(
          priceReport.id,
          oldPrice,
          priceReport.price_per_kg,
          oldSaleStatus,
          priceReport.is_on_sale
        )
      }
      break
    case 'expire':
      await PriceHistoryTracker.trackPriceExpiration(priceReport.id, priceReport.price_per_kg)
      break
  }
}