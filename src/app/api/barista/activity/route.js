import { NextResponse } from 'next/server';
import { logActivity, getActivityByBoard } from '@/app/lib/barista-board-operations';
import { requireAuth } from '@/app/lib/auth';

export async function GET(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get('boardId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (!boardId) {
      return NextResponse.json({ error: 'boardId is required' }, { status: 400 });
    }

    const activities = await getActivityByBoard(boardId, limit);
    return NextResponse.json(activities);
  } catch (error) {
    console.error('Get activity error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch activity' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    const body = await request.json();
    const { boardId, cardId, userId, actionType, oldValue, newValue, metadata } = body;

    if (!boardId || !userId || !actionType) {
      return NextResponse.json({ error: 'boardId, userId, and actionType are required' }, { status: 400 });
    }

    const activity = await logActivity({
      boardId,
      cardId,
      userId,
      actionType,
      oldValue,
      newValue,
      metadata
    });

    return NextResponse.json(activity);
  } catch (error) {
    console.error('Log activity error:', error);
    return NextResponse.json({ error: error.message || 'Failed to log activity' }, { status: 500 });
  }
}
