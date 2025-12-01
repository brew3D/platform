import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/app/lib/supabase';
import { requireAuth } from '@/app/lib/auth';

const supabase = getSupabaseClient();

export async function POST(request, { params }) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
    const role = auth.role || 'member';
    if (!['admin', 'moderator'].includes(role)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    const { postId } = params;
    const { pinned } = await request.json();
    const { data: updatedPost, error } = await supabase
      .from('community_posts')
      .update({ is_pinned: !!pinned })
      .eq('post_id', postId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ post: updatedPost });
  } catch (e) {
    console.error('Pin post error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


