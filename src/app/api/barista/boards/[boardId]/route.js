import { NextResponse } from 'next/server';
import { getBoard, updateBoard } from '@/app/lib/barista-board-operations';
import { requireAuth } from '@/app/lib/auth';

export async function GET(request, { params }) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    const { boardId } = await params;
    const board = await getBoard(boardId);
    return NextResponse.json(board);
  } catch (error) {
    console.error('Get board error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch board' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    const { boardId } = await params;
    const body = await request.json();
    const board = await updateBoard(boardId, body);
    return NextResponse.json(board);
  } catch (error) {
    console.error('Update board error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update board' }, { status: 500 });
  }
}
