import { NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth';
import { scanTable } from '@/app/lib/dynamodb-operations';
import { TABLE_NAMES } from '@/app/lib/dynamodb-schema';

export async function GET(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
    if (!['admin', 'moderator'].includes(auth.role || 'member')) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    const users = await scanTable(TABLE_NAMES.USERS);
    const posts = await scanTable(TABLE_NAMES.COMMUNITY_POSTS);
    return NextResponse.json({ users: users.length, posts: posts.length });
  } catch (e) {
    console.error('Admin stats error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


