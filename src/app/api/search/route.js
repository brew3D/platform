import { NextResponse } from 'next/server';

// Stub: AWS DynamoDB removed (dead code)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const type = searchParams.get('type') || 'all';
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ success: false, error: 'Search query must be at least 2 characters long' }, { status: 400 });
  }

  const results = { posts: [], users: [], tags: [], total: 0 };
  results.total = results.posts.length + results.users.length + results.tags.length;

  return NextResponse.json({
    success: true,
    query: query.trim().toLowerCase(),
    results,
    pagination: { limit, offset, hasMore: false },
  });
}
