// /src/app/api/scanner/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface WebhookPayload {
  event: 'scan_completed' | 'scan_started' | 'scan_failed';
  timestamp: string;
  site: string;
  data?: {
    products?: number;
    confidence?: number;
    duration?: number;
    error?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const payload: WebhookPayload = await request.json();
    
    // Validate webhook signature/API key
    const webhookSecret = request.headers.get('x-webhook-secret');
    if (webhookSecret !== process.env.SCANNER_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized webhook' }, { status: 401 });
    }
    
    // Process webhook based on event type
    switch (payload.event) {
      case 'scan_completed':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await handleScanCompleted(supabase as any, payload);
        break;
        
      case 'scan_started':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await handleScanStarted(supabase as any, payload);
        break;
        
      case 'scan_failed':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await handleScanFailed(supabase as any, payload);
        break;
        
      default:
        return NextResponse.json({ error: 'Unknown event type' }, { status: 400 });
    }
    
    // Trigger real-time notifications to connected clients
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await notifyClients(supabase as any, payload);
    
    return NextResponse.json({ 
      success: true, 
      event: payload.event,
      processed_at: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleScanCompleted(supabase: any, payload: WebhookPayload) {
  // Update scanner status and metrics
  await supabase
    .from('scanner_ingestion_logs')
    .insert({
      target_site: payload.site,
      total_products: payload.data?.products || 0,
      processed_products: payload.data?.products || 0,
      status: 'completed',
      processing_time_ms: payload.data?.duration || 0,
      average_confidence: payload.data?.confidence || 0,
      metadata: {
        webhook_received: true,
        timestamp: payload.timestamp
      }
    });

  // Calculate and update daily metrics
  await supabase.rpc('calculate_scanner_metrics', {
    scan_date: new Date().toISOString().split('T')[0],
    site: payload.site
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleScanStarted(supabase: any, payload: WebhookPayload) {
  // Log scan initiation
  await supabase
    .from('scanner_ingestion_logs')
    .insert({
      target_site: payload.site,
      total_products: 0,
      processed_products: 0,
      status: 'started',
      metadata: {
        scan_started: true,
        timestamp: payload.timestamp
      }
    });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleScanFailed(supabase: any, payload: WebhookPayload) {
  // Log scan failure
  await supabase
    .from('scanner_ingestion_logs')
    .insert({
      target_site: payload.site,
      total_products: 0,
      processed_products: 0,
      status: 'failed',
      error_message: payload.data?.error || 'Unknown error',
      metadata: {
        scan_failed: true,
        timestamp: payload.timestamp
      }
    });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function notifyClients(supabase: any, payload: WebhookPayload) {
  // Supabase automatically handles real-time subscriptions
  // We can also insert a notification record that clients can subscribe to
  try {
    await supabase
      .from('scanner_notifications')
      .insert({
        event_type: payload.event,
        site_name: payload.site,
        data: payload.data,
        created_at: new Date().toISOString()
      });
  } catch {
    // Table might not exist yet, that's ok
    console.log('Scanner notifications table not yet created');
  }

  console.log(`Real-time notification sent: ${payload.event} for ${payload.site}`);
}

// GET endpoint for webhook health check
export async function GET() {
  return NextResponse.json({ 
    status: 'Scanner webhook endpoint active',
    timestamp: new Date().toISOString(),
    events_supported: ['scan_completed', 'scan_started', 'scan_failed']
  });
}