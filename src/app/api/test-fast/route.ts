// Ultra-fast test endpoint to verify API performance
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  // Return immediate response with minimal computation
  const response = {
    success: true,
    message: 'Fast API test endpoint',
    timestamp: new Date().toISOString(),
    query_time_ms: Date.now() - startTime
  }

  return NextResponse.json(response)
}