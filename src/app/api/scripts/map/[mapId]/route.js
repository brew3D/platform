import { NextResponse } from 'next/server';
import { getMapScripts } from '@/app/lib/supabase-operations';

// GET /api/scripts/map/[mapId] - Get all scripts for a map
export async function GET(request, { params }) {
  try {
    const { mapId } = params;
    
    const scripts = await getMapScripts(mapId);
    
    return NextResponse.json(scripts || []);
  } catch (error) {
    console.error('Error fetching map scripts:', error);
    return NextResponse.json([], { status: 200 });
  }
}

