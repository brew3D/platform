import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/app/lib/supabase';

const supabase = getSupabaseClient();

// GET /api/chats - Get all chats for a user
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Query chats where the user is a participant
    // Use filter to check if userId is in the participants array
    // In PostgREST, we use @> operator: participants @> ARRAY[userId]
    const { data: chats, error } = await supabase
      .from('chats')
      .select('*')
      .contains('participants', [userId])
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    // Format chats for frontend (convert snake_case to camelCase)
    const formattedChats = (chats || []).map(chat => ({
      chatId: chat.chat_id,
      userId: chat.user_id,
      name: chat.name,
      type: chat.type,
      participants: chat.participants || [],
      lastMessage: null, // Will be populated separately if needed
      lastMessageTime: chat.last_message_at,
      unreadCount: 0, // Will be calculated separately if needed
      createdAt: chat.created_at,
      updatedAt: chat.updated_at
    }));

    return NextResponse.json({ 
      success: true, 
      chats: formattedChats 
    });
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch chats' 
    }, { status: 500 });
  }
}

// POST /api/chats - Create a new chat
export async function POST(request) {
  try {
    const body = await request.json();
    const { type, name, participants, createdBy, participantNames = {} } = body;

    if (!type || !participants || !createdBy) {
      return NextResponse.json({ 
        success: false, 
        error: 'Type, participants, and createdBy are required' 
      }, { status: 400 });
    }

    if (type === 'group' && !name) {
      return NextResponse.json({ 
        success: false, 
        error: 'Group name is required for group chats' 
      }, { status: 400 });
    }

    if (participants.length < 2) {
      return NextResponse.json({ 
        success: false, 
        error: 'At least 2 participants are required' 
      }, { status: 400 });
    }

    const chatId = `chat_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const now = new Date().toISOString();

    // Create entries for each participant
    const chatEntries = participants.map(userId => ({
      chat_id: chatId,
      user_id: userId,
      type,
      name: type === 'group' ? name : null,
      participants: participants,
      created_at: now,
      updated_at: now
    }));

    const { data: newChats, error: insertError } = await supabase
      .from('chats')
      .insert(chatEntries)
      .select();

    if (insertError) {
      throw insertError;
    }

    // Return the chat object for the creator
    const chat = newChats.find(c => c.user_id === createdBy) || newChats[0];

    return NextResponse.json({ 
      success: true, 
      chat 
    });
  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create chat' 
    }, { status: 500 });
  }
}
