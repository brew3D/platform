import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/app/lib/supabase';

const supabase = getSupabaseClient();

// GET /api/chats/[chatId]/messages - Get messages for a specific chat
export async function GET(request, { params }) {
  try {
    const { chatId } = await params;

    if (!chatId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Chat ID is required' 
      }, { status: 400 });
    }

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('timestamp', { ascending: true })
      .limit(100);

    if (error) {
      throw error;
    }

    return NextResponse.json({ 
      success: true, 
      messages: messages || [] 
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch messages' 
    }, { status: 500 });
  }
}
