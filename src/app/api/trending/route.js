import { NextResponse } from 'next/server';

// Stub: AWS DynamoDB removed (dead code)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'all';
  const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);
  const results = { posts: [], tags: [], users: [], total: 0 };
  if (type === 'all' || type === 'posts') results.posts = [];
  if (type === 'all' || type === 'tags') results.tags = [];
  if (type === 'all' || type === 'users') results.users = [];
  results.total = results.posts.length + results.tags.length + results.users.length;
  return NextResponse.json({ success: true, trending: results });
}
