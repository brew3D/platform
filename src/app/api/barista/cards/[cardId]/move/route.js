import { NextResponse } from 'next/server';
import { moveCard } from '@/app/lib/barista-board-operations';
import { requireAuth } from '@/app/lib/auth';

export async function POST(request, { params }) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    const { cardId } = await params;
    const { columnId, position } = await request.json();
    
    if (!columnId) {
      return NextResponse.json({ error: 'columnId is required' }, { status: 400 });
    }

    const card = await moveCard(cardId, columnId, position || 0);
    return NextResponse.json(card);
  } catch (error) {
    console.error('Move card error:', error);
    return NextResponse.json({ error: error.message || 'Failed to move card' }, { status: 500 });
  }
}
