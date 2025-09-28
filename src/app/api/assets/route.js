import { NextResponse } from 'next/server';
import { getAllAssets, getAllPacks, searchAssets, getAssetsByPack, getPackInfo } from '../../lib/asset-library';

// GET /api/assets - Get all assets or search
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const packId = searchParams.get('packId');
    const type = searchParams.get('type'); // 'packs' or 'assets'

    if (type === 'packs') {
      // Return all asset packs
      const packs = getAllPacks();
      return NextResponse.json({ 
        success: true, 
        packs,
        count: packs.length 
      });
    }

    if (packId) {
      // Return assets from specific pack
      const assets = getAssetsByPack(packId);
      const packInfo = getPackInfo(packId);
      
      if (!packInfo) {
        return NextResponse.json({ 
          success: false, 
          error: 'Pack not found' 
        }, { status: 404 });
      }

      return NextResponse.json({ 
        success: true, 
        assets,
        packInfo,
        count: assets.length 
      });
    }

    if (search) {
      // Search assets across all packs
      const assets = searchAssets(search);
      return NextResponse.json({ 
        success: true, 
        assets,
        count: assets.length,
        query: search 
      });
    }

    // Return all assets
    const assets = getAllAssets();
    return NextResponse.json({ 
      success: true, 
      assets,
      count: assets.length 
    });

  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch assets' 
    }, { status: 500 });
  }
}

// POST /api/assets - Create new asset (for future upload functionality)
export async function POST(request) {
  try {
    const body = await request.json();
    
    // This would integrate with DynamoDB for storing user-uploaded assets
    // For now, we'll just return a placeholder response
    return NextResponse.json({ 
      success: true, 
      message: 'Asset creation not yet implemented',
      asset: body 
    });

  } catch (error) {
    console.error('Error creating asset:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create asset' 
    }, { status: 500 });
  }
}
