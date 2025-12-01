import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/app/lib/supabase';
import { getCurrentTimestamp, generateId } from '@/app/lib/dynamodb-schema';
import { requireAuth } from '@/app/lib/auth';

const supabase = getSupabaseClient();

export async function POST(request, { params }) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
    const { postId } = params;
    const { content } = await request.json();
    if (!content || !content.trim()) return NextResponse.json({ message: 'Content required' }, { status: 400 });
    // Get current post
    const { data: post, error: fetchError } = await supabase
      .from('community_posts')
      .select('comments')
      .eq('post_id', postId)
      .single();

    if (fetchError) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    const comment = { id: generateId('cmt'), userId: auth.userId, content: content.trim(), createdAt: getCurrentTimestamp() };
    const updatedComments = [...(post.comments || []), comment];

    const { data: updatedPost, error: updateError } = await supabase
      .from('community_posts')
      .update({ comments: updatedComments, updated_at: getCurrentTimestamp() })
      .eq('post_id', postId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ post: updatedPost });
  } catch (e) {
    console.error('Add comment error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


