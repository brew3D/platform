import { NextResponse } from 'next/server';
import { createScript, updateScript } from '@/app/lib/supabase-operations';

export async function POST(request) {
  try {
    const body = await request.json();
    const { projectId, mapId, scriptData } = body;

    if (!projectId || !mapId || !scriptData) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Save script to Supabase
    const scriptId = `script_${mapId}`;
    const script = {
      scriptId,
      projectId,
      mapId,
      name: `Script for ${mapId}`,
      code: scriptData.code || '',
      elements: scriptData.elements || [],
      metadata: {
        updatedAt: scriptData.updatedAt || Date.now()
      }
    };

    try {
      await createScript(script);
    } catch (error) {
      // If script exists, update it
      if (error.message?.includes('already exists')) {
        await updateScript(scriptId, script);
      } else {
        throw error;
      }
    }

    return NextResponse.json({
      success: true,
      scriptId
    });
  } catch (error) {
    console.error('Error saving script:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to save script'
    }, { status: 500 });
  }
}

