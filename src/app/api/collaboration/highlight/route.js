import { NextResponse } from 'next/server';

// Stub: AWS DynamoDB removed (dead code)
export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  if (!body.sceneId || !body.userId || !body.objectId) {
    return NextResponse.json({ error: 'sceneId, userId, and objectId are required' }, { status: 400 });
  }
  return NextResponse.json({ success: true, highlight: { ...body, timestamp: new Date().toISOString() } });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  if (!searchParams.get('sceneId')) {
    return NextResponse.json({ error: 'sceneId is required' }, { status: 400 });
  }
  return NextResponse.json({ highlights: [] });
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  if (!searchParams.get('sceneId') || !searchParams.get('userId')) {
    return NextResponse.json({ error: 'sceneId and userId are required' }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
