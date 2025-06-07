import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Check environment variables first
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({
        success: false,
        error: 'Missing NEXT_PUBLIC_SUPABASE_URL environment variable'
      }, { status: 500 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Missing SUPABASE_SERVICE_ROLE_KEY environment variable'
      }, { status: 500 });
    }

    // Test Supabase connection
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Test simple query to existing table
    const { data: existingData, error: existingError } = await supabase
      .from('meat_cuts')
      .select('id')
      .limit(1);

    if (existingError) {
      throw new Error(`Existing table query failed: ${existingError.message}`);
    }

    // Test query to learning table
    const { data: learningData, error: learningError } = await supabase
      .from('learning_patterns')
      .select('id')
      .limit(1);

    // Test each learning table individually
    const tables = [
      'learning_patterns',
      'quality_predictions', 
      'advanced_conflicts',
      'market_intelligence',
      'pattern_learning_sessions',
      'hebrew_nlp_analytics'
    ];

    const tableTests: Record<string, any> = {};
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .limit(1);
        
        tableTests[table] = {
          exists: !error,
          error: error?.message || null,
          recordCount: data?.length || 0
        };
      } catch (err) {
        tableTests[table] = {
          exists: false,
          error: err instanceof Error ? err.message : 'Unknown error',
          recordCount: 0
        };
      }
    }

    return NextResponse.json({
      success: true,
      message: "Database connectivity test successful",
      existingTableWorks: !existingError,
      existingRecords: existingData?.length || 0,
      learningTableWorks: !learningError,
      learningRecords: learningData?.length || 0,
      learningError: learningError?.message || null,
      tableTests,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Database test failed',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}