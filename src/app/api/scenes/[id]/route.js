import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/app/lib/supabase";
import { getScene, putScene, deleteScene } from "@/app/lib/demoScenes";

const supabase = getSupabaseClient();

export async function GET(_request, ctx) {
  try {
    const { id } = await ctx.params;
    try {
      const { data: scene, error } = await supabase
        .from('scenes')
        .select('*')
        .eq('scene_id', id)
        .single();

      if (error || !scene) {
        // Fallback to in-memory
        const sc = getScene(id);
        if (!sc) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json({ scene: sc });
      }

      return NextResponse.json({ scene });
    } catch (ddbErr) {
      const sc = getScene(id);
      if (!sc) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ scene: sc });
    }
  } catch (err) {
    console.error("Get scene error", err);
    return NextResponse.json({ error: "Failed to get scene" }, { status: 500 });
  }
}

export async function PUT(request, ctx) {
  try {
    const { id } = await ctx.params;
    const body = await request.json();
    const now = new Date().toISOString();
    try {
      const updateData = {
        name: body.name || "Untitled Scene",
        scene_data: {
          objects: body.objects || [],
          groups: body.groups || []
        },
        updated_at: now
      };

      const { data: updatedScene, error } = await supabase
        .from('scenes')
        .update(updateData)
        .eq('scene_id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return NextResponse.json({ scene: updatedScene });
    } catch (ddbErr) {
      // Fallback: upsert into memory
      const existing = getScene(id) || { id, user_id: "demo_user", name: body.name || "Untitled Scene", created_at: now };
      const merged = { ...existing, objects: body.objects || [], groups: body.groups || [], name: body.name || existing.name, updated_at: now };
      putScene(merged);
      return NextResponse.json({ scene: merged });
    }
  } catch (err) {
    console.error("Update scene error", err);
    return NextResponse.json({ error: "Failed to update scene" }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { id } = await params;
    try {
      const { error } = await supabase
        .from('scenes')
        .delete()
        .eq('scene_id', id);

      if (error) {
        throw error;
      }

      return NextResponse.json({ ok: true });
    } catch (ddbErr) {
      deleteScene(id);
      return NextResponse.json({ ok: true });
    }
  } catch (err) {
    console.error("Delete scene error", err);
    return NextResponse.json({ error: "Failed to delete scene" }, { status: 500 });
  }
}
