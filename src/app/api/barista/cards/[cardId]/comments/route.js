import { NextResponse } from 'next/server';
import { getCommentsByCard } from '@/app/lib/barista-board-operations';
import { requireAuth } from '@/app/lib/auth';

export async function GET(request, { params }) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    const { cardId } = await params;
    const comments = await getCommentsByCard(cardId);
    return NextResponse.json(comments);
  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch comments' }, { status: 500 });
  }
}
