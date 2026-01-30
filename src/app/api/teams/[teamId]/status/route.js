import { NextResponse } from 'next/server';

// Stub: AWS DynamoDB removed (dead code)
export async function PUT(request, { params }) {
  const { teamId } = await params;
  const body = await request.json().catch(() => ({}));
  if (!body.userId || typeof body.online !== 'boolean') {
    return NextResponse.json({ error: 'User ID and online status are required' }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
