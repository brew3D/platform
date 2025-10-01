import { NextResponse } from 'next/server';
import { getProjectCharacters } from '../../../../lib/dynamodb-operations.js';

// GET /api/projects/[id]/assets - Get all assets for a project
export async function GET(request, { params }) {
  try {
    const { id: projectId } = params;
    
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Get characters from the project
    const characters = await getProjectCharacters(projectId);
    
    // Transform characters into assets format for maps
    const assets = characters.map(character => ({
      id: character.characterId,
      name: character.name,
      type: 'character',
      category: 'characters',
      description: character.description || '',
      thumbnail: character.thumbnail || '',
      fileUrl: character.characterData?.model || '',
      tags: character.characterData?.metadata?.tags || character.tags || [],
      stats: character.stats || {},
      abilities: character.characterData?.abilities || [],
      equipment: character.characterData?.inventory || {},
      aiBehavior: character.characterData?.ai?.behavior || 'neutral',
      isPublicAsset: character.characterData?.metadata?.isPublicAsset || false,
      originalAssetId: character.characterData?.metadata?.originalAssetId || null,
      createdAt: character.createdAt,
      updatedAt: character.updatedAt
    }));
    
    return NextResponse.json({ 
      success: true,
      assets,
      count: assets.length,
      projectId 
    });
  } catch (error) {
    console.error('Error fetching project assets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project assets' },
      { status: 500 }
    );
  }
}
