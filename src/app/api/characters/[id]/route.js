import { NextResponse } from 'next/server';
import { getCharacterById, updateCharacter, deleteCharacter } from '@/app/lib/supabase-operations';

// GET /api/characters/[id]
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const character = await getCharacterById(id);

    if (!character) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ character });
  } catch (error) {
    console.error('Error fetching character:', error);
    return NextResponse.json(
      { error: 'Failed to fetch character' },
      { status: 500 }
    );
  }
}

// PUT /api/characters/[id]
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { character } = await updateCharacter(id, body);

    return NextResponse.json({
      success: true,
      character
    });
  } catch (error) {
    console.error('Error updating character:', error);
    return NextResponse.json(
      { error: 'Failed to update character' },
      { status: 500 }
    );
  }
}

// DELETE /api/characters/[id]
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    await deleteCharacter(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting character:', error);
    return NextResponse.json(
      { error: 'Failed to delete character' },
      { status: 500 }
    );
  }
}
