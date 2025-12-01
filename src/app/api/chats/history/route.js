import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/app/lib/supabase';

const supabase = getSupabaseClient();

// GET /api/chats/history - Get chat history between two users
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const recipientId = searchParams.get('recipientId');

    if (!userId || !recipientId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID and recipient ID are required' 
      }, { status: 400 });
    }

    // Find individual chat between the two users
    // In Supabase, we need to find a chat where both users are participants
    const { data: chats, error: chatError } = await supabase
      .from('chats')
      .select('chat_id')
      .eq('type', 'direct')
      .contains('participants', [userId, recipientId])
      .limit(1);

    if (chatError || !chats || chats.length === 0) {
      return NextResponse.json({ 
        success: true, 
        messages: [] 
      });
    }

    const chatId = chats[0].chat_id;

    // Get messages for this chat
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('timestamp', { ascending: true })
      .limit(50);

    if (messagesError) {
      throw messagesError;
    }

    return NextResponse.json({ 
      success: true, 
      messages: messages || [] 
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch chat history' 
    }, { status: 500 });
  }
}
