import { NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth';

// Stub: AWS DynamoDB removed (dead code)
export async function GET(request) {
  const auth = requireAuth(request);
  if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  return NextResponse.json({
    success: true,
    plugins: [],
    pagination: { limit, offset, total: 0, hasMore: false },
  });
}

export async function POST(request) {
  const auth = requireAuth(request);
  if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
  const body = await request.json().catch(() => ({}));
  if (!body.name || !body.description) {
    return NextResponse.json({ success: false, error: 'Name and description are required' }, { status: 400 });
  }
  return NextResponse.json({ success: true, plugin: { ...body, pluginId: `plugin-${Date.now()}` } });
}
