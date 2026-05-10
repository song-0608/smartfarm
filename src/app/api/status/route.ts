import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.ZHIPU_API_KEY;
  
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    ai: {
      configured: !!apiKey,
      keyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : null,
      keyLength: apiKey ? apiKey.length : 0,
    },
    environment: process.env.NODE_ENV,
  });
}
