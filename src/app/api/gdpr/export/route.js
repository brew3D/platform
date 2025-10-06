import { NextResponse } from 'next/server';
import { requireAuth } from '../../lib/auth';
import { getUserById, getUserProjects, scanTable } from '../../lib/dynamodb-operations';
import { TABLE_NAMES } from '../../lib/dynamodb-schema';

export async function GET(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
    const user = await getUserById(auth.userId);
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    // Collect basic user data and related entities (extend as needed)
    const projects = await getUserProjects(auth.userId);
    // Posts: naive scan + filter by userId for MVP
    const posts = (await scanTable(TABLE_NAMES.COMMUNITY_POSTS)).filter(p => p.userId === auth.userId);

    const payload = { user, projects, posts };
    return new NextResponse(JSON.stringify(payload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="gdpr-export.json"'
      }
    });
  } catch (e) {
    console.error('GDPR export error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


