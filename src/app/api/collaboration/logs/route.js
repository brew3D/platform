import { NextResponse } from 'next/server';

// Stub: AWS DynamoDB removed (dead code)
export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  if (!body.sceneId || !body.userId || !body.action) {
    return NextResponse.json({ error: 'sceneId, userId, and action are required' }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  if (!searchParams.get('sceneId')) {
    return NextResponse.json({ error: 'sceneId is required' }, { status: 400 });
  }
  return NextResponse.json({ logs: [] });
}
