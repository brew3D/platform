import { NextResponse } from 'next/server';
import { getProject, getProjectMaps } from '@/app/lib/supabase-operations';

// GET /api/projects/[id]/export - Export project as downloadable package
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    // Get project data
    const project = await getProject(id);
    if (!project) {
      return NextResponse.json({ 
        success: false, 
        error: 'Project not found' 
      }, { status: 404 });
    }

    // Get all maps for the project
    const maps = await getProjectMaps(id);
    
    // Get all scripts for each map
    const mapsWithScripts = await Promise.all(
      maps.map(async (map) => {
        try {
          // Try to get scripts from Supabase
          const { getMapScripts } = await import('@/app/lib/supabase-operations');
          const scripts = await getMapScripts(map.mapId);
          return { ...map, scripts: scripts || [] };
        } catch (error) {
          console.error(`Error loading scripts for map ${map.mapId}:`, error);
          return { ...map, scripts: [] };
        }
      })
    );

    // Build export package
    const exportPackage = {
      project: {
        id: project.projectId,
        name: project.name,
        description: project.description,
        settings: project.settings
      },
      maps: mapsWithScripts,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };

    // Return as JSON download
    return new NextResponse(JSON.stringify(exportPackage, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${project.name || 'game'}-export.json"`
      }
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to export project' 
    }, { status: 500 });
  }
}

