import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/app/lib/supabase';
import { generateId, getCurrentTimestamp } from '@/app/lib/dynamodb-schema';
import { requireAuth } from '@/app/lib/auth';

const supabase = getSupabaseClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const { data: posts, error } = await supabase
      .from('community_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return NextResponse.json({ items: posts || [], count: posts?.length || 0 });
  } catch (e) {
    console.error('List posts error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
    
    const { content, type = 'text', attachments = [], tags = [] } = await request.json();
    if (!content || !content.trim()) return NextResponse.json({ message: 'Content required' }, { status: 400 });
    
    const now = getCurrentTimestamp();
    const post = {
      post_id: generateId('post'),
      user_id: auth.userId,
      content: content.trim(),
      type,
      attachments: Array.isArray(attachments) ? attachments : [],
      likes: [],
      comments: [],
      shares: 0,
      tags: Array.isArray(tags) ? tags : [],
      is_pinned: false,
      created_at: now,
      updated_at: now
    };
    
    const { data: newPost, error } = await supabase
      .from('community_posts')
      .insert(post)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ post: newPost });
  } catch (e) {
    console.error('Create post error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
