import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/app/lib/supabase';

const supabase = getSupabaseClient();

// POST /api/chats/send - Send a message
export async function POST(request) {
  try {
    const body = await request.json();
    const { chatId, senderId, senderName, content, timestamp } = body;

    if (!chatId || !senderId || !content) {
      return NextResponse.json({ 
        success: false, 
        error: 'Chat ID, sender ID, and content are required' 
      }, { status: 400 });
    }

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const now = timestamp || new Date().toISOString();

    const message = {
      message_id: messageId,
      chat_id: chatId,
      user_id: senderId,
      content: content.trim(),
      type: 'text',
      timestamp: now,
      created_at: now
    };

    // Save message to messages table
    const { data: newMessage, error: insertError } = await supabase
      .from('messages')
      .insert(message)
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // Update chat's last_message_at (this is handled by trigger, but we can also update it explicitly)
    const { error: updateError } = await supabase
      .from('chats')
      .update({ 
        last_message_at: now,
        updated_at: now
      })
      .eq('chat_id', chatId);

    if (updateError) {
      console.warn('Failed to update chat last_message_at:', updateError);
      // Don't fail the entire request if this fails
    }

    return NextResponse.json({ 
      success: true, 
      message: newMessage 
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to send message' 
    }, { status: 500 });
  }
}
