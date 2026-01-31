import { NextResponse } from 'next/server';
import { createBoard, getBoardsByProject } from '@/app/lib/barista-board-operations';
import { requireAuth } from '@/app/lib/auth';

export async function GET(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const boards = await getBoardsByProject(projectId);
    return NextResponse.json(boards || []);
  } catch (error) {
    console.error('Get boards error:', error);
    // Check if table doesn't exist
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      return NextResponse.json({ 
        error: 'Barista Board tables not found. Please run the SQL migration from src/app/lib/barista-board-schema.sql',
        code: 'TABLE_NOT_FOUND'
      }, { status: 500 });
    }
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch boards',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    const body = await request.json();
    const { projectId, name, description, settings } = body;

    if (!projectId || !name) {
      return NextResponse.json({ error: 'projectId and name are required' }, { status: 400 });
    }

    const board = await createBoard({
      projectId,
      name,
      description,
      settings,
      createdBy: auth.userId
    });

    return NextResponse.json(board);
  } catch (error) {
    console.error('Create board error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      stack: error.stack
    });
    return NextResponse.json({ 
      error: error.message || 'Failed to create board',
      code: error.code,
      details: error.details,
      hint: error.hint,
      fullError: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    }, { status: 500 });
  }
}
