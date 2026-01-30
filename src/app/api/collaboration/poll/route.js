import { NextResponse } from 'next/server';

// Stub: AWS DynamoDB removed (dead code)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  if (!searchParams.get('sceneId')) {
    return NextResponse.json({ error: 'sceneId is required' }, { status: 400 });
  }
  return NextResponse.json({ activeUsers: [] });
}
