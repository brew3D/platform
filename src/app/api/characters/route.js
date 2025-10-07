import { NextResponse } from 'next/server';
import { 
  createCharacter, 
  getProjectCharacters 
} from '@/app/lib/dynamodb-operations';

// GET /api/characters?projectId=xxx
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const characters = await getProjectCharacters(projectId);
    
    return NextResponse.json({ characters });
  } catch (error) {
    console.error('Error fetching characters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch characters' },
      { status: 500 }
    );
  }
}

// POST /api/characters
export async function POST(request) {
  try {
    const body = await request.json();
    const { projectId, name, type, stats, abilities, equipment, aiBehavior, tags, coverImage } = body;
    
    if (!projectId || !name) {
      return NextResponse.json(
        { error: 'Project ID and name are required' },
        { status: 400 }
      );
    }

    const characterData = {
      projectId,
      name,
      description: body.description || '',
      type: type || 'NPC',
      stats: stats || { hp: 100, attack: 50, defense: 50, speed: 50, mana: 50, stamina: 50 },
      characterData: {
        model: coverImage || '',
        animations: [],
        abilities: abilities || [],
        inventory: equipment || [],
        ai: {
          behavior: aiBehavior || 'neutral',
          scripts: []
        },
        metadata: {
          tags: tags || []
        }
      },
      thumbnail: coverImage || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await createCharacter(characterData);
    
    return NextResponse.json({ 
      success: true, 
      character: result.character 
    });
  } catch (error) {
    console.error('Error creating character:', error);
    return NextResponse.json(
      { error: 'Failed to create character' },
      { status: 500 }
    );
  }
}
