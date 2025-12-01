import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/app/lib/supabase';
import { generateId, getCurrentTimestamp } from '@/app/lib/dynamodb-schema';
import { requireAuth } from '@/app/lib/auth';

const supabase = getSupabaseClient();

export async function GET(request) {
  try {
    const { data: tutorials, error } = await supabase
      .from('tutorials')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ items: tutorials || [] });
  } catch (e) {
    console.error('Docs list error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
    
    const { title, content, tags = [] } = await request.json();
    if (!title || !content) return NextResponse.json({ message: 'Title and content required' }, { status: 400 });
    
    const now = getCurrentTimestamp();
    const doc = {
      tutorial_id: generateId('doc'),
      title,
      description: content,
      category: 'documentation',
      creator_id: auth.userId,
      tags: Array.isArray(tags) ? tags : [],
      is_published: true,
      created_at: now,
      updated_at: now
    };
    
    const { data: newDoc, error } = await supabase
      .from('tutorials')
      .insert(doc)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ doc: newDoc });
  } catch (e) {
    console.error('Docs create error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
