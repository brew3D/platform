import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabase';

// GET /api/users/search - Search for users
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const exclude = searchParams.get('exclude');
    const search = searchParams.get('search');

    const supabase = getSupabaseAdmin();
    
    let query = supabase
      .from('users')
      .select('user_id, name, email, profile_picture, is_active')
      .limit(50);

    // Add filter to exclude specific user
    if (exclude) {
      query = query.neq('user_id', exclude);
    }

    // Add search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      query = query.or(`email.ilike.%${searchLower}%,name.ilike.%${searchLower}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Format user data for chat
    const users = (data || []).map(user => ({
      userId: user.user_id,
      name: user.name || user.email,
      email: user.email,
      profilePicture: user.profile_picture || '',
      online: user.is_active || false
    }));

    return NextResponse.json({ 
      success: true, 
      users 
    });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to search users',
      details: error.message 
    }, { status: 500 });
  }
}
