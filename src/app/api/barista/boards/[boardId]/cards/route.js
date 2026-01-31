import { NextResponse } from 'next/server';
import { getCardsByBoard } from '@/app/lib/barista-board-operations';
import { requireAuth } from '@/app/lib/auth';

export async function GET(request, { params }) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    const { boardId } = await params;
    const cards = await getCardsByBoard(boardId);
    return NextResponse.json(cards);
  } catch (error) {
    console.error('Get cards error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch cards' }, { status: 500 });
  }
}
