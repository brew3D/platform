import { NextResponse } from 'next/server';
import { createComment } from '@/app/lib/barista-board-operations';
import { requireAuth } from '@/app/lib/auth';

export async function POST(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    const body = await request.json();
    const { cardId, text, authorId, parentCommentId, context, attachments } = body;

    if (!cardId || !text || !authorId) {
      return NextResponse.json({ error: 'cardId, text, and authorId are required' }, { status: 400 });
    }

    const comment = await createComment({
      cardId,
      text,
      authorId,
      parentCommentId,
      context: context || {
        type: '2D', // TODO: Support '3D' when Testbox is integrated
        worldPosition: null,
        cameraPose: null,
        buildId: null
      },
      attachments: attachments || []
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create comment' }, { status: 500 });
  }
}
