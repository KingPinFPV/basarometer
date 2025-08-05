/**
 * Scraping Execution API Endpoint
 * Triggers autonomous scraper coordination and returns real-time status
 * Integrates with existing Basarometer V8 performance-optimized architecture
 */

import { NextRequest, NextResponse } from 'next/server'
import { ScraperCoordinator } from '@/lib/scrapers/scraper-coordinator'

// Global coordinator instance for session management
let globalCoordinator: ScraperCoordinator | null = null

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'
    const retailers = searchParams.get('retailers')?.split(',') || ['victory', 'mega']
    
    // Initialize coordinator if needed
    if (!globalCoordinator) {
      globalCoordinator = new ScraperCoordinator()
    }

    // Check if scraping session is already running
    if (globalCoordinator.isCurrentlyRunning() && !force) {
      const currentSession = globalCoordinator.getCurrentSession()
      return NextResponse.json({
        success: false,
        error: 'Scraping session already in progress',
        current_session: currentSession,
        estimated_completion: calculateEstimatedCompletion(currentSession?.start_time)
      }, { status: 409 })
    }

    // Execute scraping session
    console.log(`🚀 Starting scraping session for retailers: ${retailers.join(', ')}`)
    const session = await globalCoordinator.executeScrapingSession()

    const responseTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        duration_ms: responseTime,
        scrapers_executed: session.scrapers_run,
        total_products: session.total_products,
        new_products: session.new_products,
        updated_products: session.updated_products,
        validation_score: Math.round(session.validation_score * 100),
        performance_metrics: session.performance_metrics,
        errors: session.errors,
        data_sources: session.scrapers_run.map(scraper => ({
          retailer: scraper,
          status: 'completed',
          confidence: session.validation_score
        }))
      },
      metadata: {
        execution_time_ms: responseTime,
        api_version: '8.0.0',
        hebrew_processing: true,
        market_coverage_update: true
      }
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown scraping error'
    console.error('Scraping API Error:', error)

    return NextResponse.json({
      success: false,
      error: 'Scraping execution failed',
      details: errorMessage,
      execution_time_ms: Date.now() - startTime
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Return current scraping status
    if (!globalCoordinator) {
      return NextResponse.json({
        success: true,
        status: 'idle',
        coordinator_initialized: false,
        available_scrapers: ['victory', 'mega'],
        estimated_products: 150
      })
    }

    const currentSession = globalCoordinator.getCurrentSession()
    const isRunning = globalCoordinator.isCurrentlyRunning()

    if (isRunning && currentSession) {
      return NextResponse.json({
        success: true,
        status: 'running',
        current_session: {
          id: currentSession.id,
          start_time: currentSession.start_time,
          duration_seconds: Math.floor((Date.now() - new Date(currentSession.start_time).getTime()) / 1000),
          scrapers_completed: currentSession.scrapers_run,
          estimated_completion: calculateEstimatedCompletion(currentSession.start_time),
          current_products: currentSession.total_products
        }
      })
    }

    // Return last session results if available
    if (currentSession && currentSession.end_time) {
      return NextResponse.json({
        success: true,
        status: 'completed',
        last_session: {
          id: currentSession.id,
          completed_at: currentSession.end_time,
          total_products: currentSession.total_products,
          validation_score: Math.round(currentSession.validation_score * 100),
          performance_score: Math.round(currentSession.performance_metrics.data_quality_score),
          errors: currentSession.errors.length
        },
        next_scheduled: calculateNextScheduledRun()
      })
    }

    return NextResponse.json({
      success: true,
      status: 'ready',
      coordinator_initialized: true,
      available_scrapers: ['victory', 'mega'],
      system_health: 'optimal'
    })

  } catch (error) {
    console.error('Scraping Status API Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get scraping status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Calculate estimated completion time for running session
 */
function calculateEstimatedCompletion(startTime?: string): string {
  if (!startTime) return new Date(Date.now() + 180000).toISOString() // 3 minutes default

  const start = new Date(startTime).getTime()
  const elapsed = Date.now() - start
  const estimatedTotal = 180000 // 3 minutes average session time
  const remaining = Math.max(0, estimatedTotal - elapsed)
  
  return new Date(Date.now() + remaining).toISOString()
}

/**
 * Calculate next scheduled automatic run
 */
function calculateNextScheduledRun(): string {
  // Schedule next run for every 6 hours
  const nextRun = new Date()
  nextRun.setHours(nextRun.getHours() + 6)
  return nextRun.toISOString()
}