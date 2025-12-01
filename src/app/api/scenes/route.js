import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/app/lib/supabase";
import { listScenesForUser, putScene } from "@/app/lib/demoScenes";

const supabase = getSupabaseClient();

// List scenes for a user, and create new scene
export async function GET(request) {
  try {
    const userId = (await request.headers.get("x-user-id")) || "demo_user";
    try {
      // Query scenes - note: scenes table uses project_id, but we'll query by user_id if available
      // For now, we'll use a fallback approach
      const { data: scenes, error } = await supabase
        .from('scenes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Filter by user if needed (assuming scenes might have user_id in scene_data or we need to join with projects)
      // For now, return all scenes or filter based on available fields
      return NextResponse.json({ scenes: scenes || [] });
    } catch (ddbErr) {
      // Fallback to in-memory
      const scenes = listScenesForUser(userId);
      return NextResponse.json({ scenes });
    }
  } catch (err) {
    console.error("List scenes error", err);
    return NextResponse.json({ error: "Failed to list scenes" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const userId = (await request.headers.get("x-user-id")) || "demo_user";
    const sceneId = body.id || `scene_${Date.now()}`;
    const now = new Date().toISOString();
    
    // Note: scenes table requires project_id, so we'll need to adapt
    // For now, we'll create a scene with a default project_id or use the scene_data field
    const item = {
      scene_id: sceneId,
      project_id: body.projectId || `project_${userId}`, // Default project ID
      name: body.name || "Untitled Scene",
      scene_data: {
        objects: body.objects || [],
        groups: body.groups || [],
        user_id: userId
      },
      created_at: now,
      updated_at: now,
    };

    try {
      const { data: newScene, error } = await supabase
        .from('scenes')
        .insert(item)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return NextResponse.json({ scene: newScene }, { status: 201 });
    } catch (ddbErr) {
      // Fallback to in-memory
      const fallbackItem = {
        id: sceneId,
        user_id: userId,
        name: body.name || "Untitled Scene",
        objects: body.objects || [],
        groups: body.groups || [],
        created_at: now,
        updated_at: now,
      };
      putScene(fallbackItem);
      return NextResponse.json({ scene: fallbackItem }, { status: 201 });
    }
  } catch (err) {
    console.error("Create scene error", err);
    return NextResponse.json({ error: "Failed to create scene" }, { status: 500 });
  }
}
