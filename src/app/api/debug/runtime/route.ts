import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test basic functionality
    const testData = {
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      supabaseUrlExists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceKeyExists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      runtimeVersion: process.version,
      platform: process.platform,
      memoryUsage: process.memoryUsage(),
      nextjsVersion: '15.1.4'
    };

    return NextResponse.json({
      success: true,
      message: "Runtime diagnostic successful",
      data: testData
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}