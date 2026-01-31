import { NextResponse } from 'next/server';
import { getCard, updateCard, deleteCard } from '@/app/lib/barista-board-operations';
import { requireAuth } from '@/app/lib/auth';

export async function GET(request, { params }) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    const { cardId } = await params;
    const card = await getCard(cardId);
    return NextResponse.json(card);
  } catch (error) {
    console.error('Get card error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch card' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    const { cardId } = await params;
    const body = await request.json();
    const card = await updateCard(cardId, body);
    return NextResponse.json(card);
  } catch (error) {
    console.error('Update card error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update card' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    const { cardId } = await params;
    await deleteCard(cardId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete card error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete card' }, { status: 500 });
  }
}
