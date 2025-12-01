import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/app/lib/supabase';
import { generateId, getCurrentTimestamp } from '@/app/lib/dynamodb-schema';
import { requireAuth } from '@/app/lib/auth';

const supabase = getSupabaseClient();

export async function GET(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
    
    // Note: If notifications table doesn't exist, we'll need to create it or use a different approach
    // For now, return empty array if table doesn't exist
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', auth.userId)
      .order('created_at', { ascending: false });

    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === '42P01') {
        return NextResponse.json({ items: [] });
      }
      throw error;
    }

    return NextResponse.json({ items: notifications || [] });
  } catch (e) {
    console.error('Notifications list error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
    
    const { type, payload } = await request.json();
    const item = {
      notification_id: generateId('ntf'),
      user_id: auth.userId,
      type: type || 'generic',
      payload: payload || {},
      read: false,
      created_at: getCurrentTimestamp()
    };
    
    // Note: If notifications table doesn't exist, this will fail gracefully
    const { data: newNotification, error } = await supabase
      .from('notifications')
      .insert(item)
      .select()
      .single();

    if (error) {
      // If table doesn't exist, just return the item without saving
      if (error.code === '42P01') {
        return NextResponse.json({ notification: item });
      }
      throw error;
    }

    return NextResponse.json({ notification: newNotification });
  } catch (e) {
    console.error('Notifications create error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
