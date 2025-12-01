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
    const { reason } = await request.json();
    // Get current post
    const { data: post, error: fetchError } = await supabase
      .from('community_posts')
      .select('reports')
      .eq('post_id', postId)
      .single();

    if (fetchError) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    const report = { id: generateId('rpt'), userId: auth.userId, reason: reason || 'unspecified', createdAt: getCurrentTimestamp() };
    const updatedReports = [...(post.reports || []), report];

    const { data: updatedPost, error: updateError } = await supabase
      .from('community_posts')
      .update({ reports: updatedReports, updated_at: getCurrentTimestamp() })
      .eq('post_id', postId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ post: updatedPost });
  } catch (e) {
    console.error('Report post error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


