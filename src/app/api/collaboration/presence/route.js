import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/app/lib/supabase';

const supabase = getSupabaseClient();

// Update user presence
export async function POST(request) {
  try {
    const { userId, sceneId, userInfo, action = 'join' } = await request.json();

    if (!userId || !sceneId) {
      return NextResponse.json({ error: 'userId and sceneId are required' }, { status: 400 });
    }

    const timestamp = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 60000); // 60 seconds TTL

    if (action === 'join' || action === 'heartbeat') {
      const presenceData = {
        user_id: userId,
        scene_id: sceneId,
        cursor_position: userInfo?.cursorPosition || {},
        last_seen: timestamp,
        expires_at: expiresAt.toISOString(),
        action
      };

      const { error: upsertError } = await supabase
        .from('presence')
        .upsert(presenceData, { onConflict: 'user_id,scene_id' });

      if (upsertError) {
        throw upsertError;
      }

      console.log(`✅ User ${userId} ${action} scene ${sceneId}`);
    } else if (action === 'leave') {
      const { error: deleteError } = await supabase
        .from('presence')
        .delete()
        .eq('user_id', userId)
        .eq('scene_id', sceneId);

      if (deleteError) {
        throw deleteError;
      }

      console.log(`👋 User ${userId} left scene ${sceneId}`);
    }

    return NextResponse.json({ success: true, action, timestamp });
  } catch (error) {
    console.error('Error updating presence:', error);
    return NextResponse.json({ error: 'Failed to update presence' }, { status: 500 });
  }
}

// Get active users in a scene
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sceneId = searchParams.get('sceneId');

    if (!sceneId) {
      return NextResponse.json({ error: 'sceneId is required' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const { data: activeUsers, error } = await supabase
      .from('presence')
      .select('*')
      .eq('scene_id', sceneId)
      .gt('expires_at', now);

    if (error) {
      throw error;
    }

    console.log(`👥 Found ${activeUsers?.length || 0} active users in scene ${sceneId}`);

    return NextResponse.json({
      success: true,
      users: activeUsers || [],
      count: activeUsers?.length || 0
    });
  } catch (error) {
    console.error('Error fetching presence:', error);
    return NextResponse.json({ error: 'Failed to fetch presence' }, { status: 500 });
  }
}
