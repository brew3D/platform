import { NextResponse } from 'next/server';
import { getColumnsByBoard } from '@/app/lib/barista-board-operations';
import { requireAuth } from '@/app/lib/auth';

export async function GET(request, { params }) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    const { boardId } = await params;
    const columns = await getColumnsByBoard(boardId);
    return NextResponse.json(columns);
  } catch (error) {
    console.error('Get columns error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch columns' }, { status: 500 });
  }
}
