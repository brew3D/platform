import { NextResponse } from 'next/server';

// Stub: AWS DynamoDB removed (dead code)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);
  return NextResponse.json({
    success: true,
    leaderboards: [],
    pagination: { limit, total: 0 },
  });
}
