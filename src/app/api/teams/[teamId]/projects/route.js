import { NextResponse } from 'next/server';

// Stub: AWS DynamoDB removed (dead code)
export async function GET(request, { params }) {
  const { teamId } = await params;
  if (!teamId) return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
  return NextResponse.json({ projects: [] });
}
