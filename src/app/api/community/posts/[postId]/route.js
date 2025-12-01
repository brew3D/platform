import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/app/lib/supabase';
import { getCurrentTimestamp } from '@/app/lib/dynamodb-schema';
import { requireAuth } from '@/app/lib/auth';

const supabase = getSupabaseClient();

export async function GET(request, { params }) {
  try {
    const { postId } = await params;
    const { data: post, error } = await supabase
      .from('community_posts')
      .select('*')
      .eq('post_id', postId)
      .single();

    if (error || !post) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (e) {
    console.error('Get post error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
    
    const { postId } = await params;
    const { content, tags, isPinned } = await request.json();
    
    // Get current post
    const { data: currentPost, error: fetchError } = await supabase
      .from('community_posts')
      .select('*')
      .eq('post_id', postId)
      .single();

    if (fetchError || !currentPost) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 });
    }

    const isOwner = currentPost.user_id === auth.userId;
    const isMod = ['admin', 'moderator'].includes(auth.role || 'member');
    if (!isOwner && !isMod) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const now = getCurrentTimestamp();
    const updateData = {
      updated_at: now
    };

    if (typeof content === 'string') {
      updateData.content = content;
    }
    if (Array.isArray(tags)) {
      updateData.tags = tags;
    }
    if (typeof isPinned === 'boolean') {
      updateData.is_pinned = isPinned;
    }

    const { data: updatedPost, error: updateError } = await supabase
      .from('community_posts')
      .update(updateData)
      .eq('post_id', postId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ post: updatedPost });
  } catch (e) {
    console.error('Update post error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
    
    const { postId } = await params;
    
    // Get current post
    const { data: currentPost, error: fetchError } = await supabase
      .from('community_posts')
      .select('*')
      .eq('post_id', postId)
      .single();

    if (fetchError || !currentPost) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 });
    }

    const isOwner = currentPost.user_id === auth.userId;
    const isMod = ['admin', 'moderator'].includes(auth.role || 'member');
    if (!isOwner && !isMod) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from('community_posts')
      .delete()
      .eq('post_id', postId);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Delete post error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
