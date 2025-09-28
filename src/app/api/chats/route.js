import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DDB_CHATS_TABLE || 'ruchi-ai-chats';

// GET /api/chats - Get all chats for a user
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Query chats where the user is a participant using the GSI
    const params = {
      TableName: TABLE_NAME,
      IndexName: 'userId-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    };

    const result = await docClient.send(new QueryCommand(params));
    
    // Get unique chats by chatId
    const chatMap = new Map();
    (result.Items || []).forEach(chat => {
      if (!chatMap.has(chat.chatId)) {
        chatMap.set(chat.chatId, chat);
      }
    });
    
    const uniqueChats = Array.from(chatMap.values());

    return NextResponse.json({ 
      success: true, 
      chats: uniqueChats 
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

    // Get user details for participants - use provided user data
    const participantDetails = participants.map(userId => ({
      userId,
      name: participantNames[userId] || (userId === createdBy ? 'You' : 'Team Member'),
      joinedAt: now,
      online: false
    }));

    // Create entries for each participant (this is the correct way with composite key)
    for (const userId of participants) {
      const userChatEntry = {
        chatId,
        userId, // This is required for the composite key
        type,
        name: type === 'group' ? name : null,
        participants: participants,
        participantDetails,
        createdBy,
        createdAt: now,
        updatedAt: now,
        lastMessage: null,
        lastMessageTime: null,
        unreadCount: 0,
        settings: {
          allowInvites: true,
          allowFileUploads: true,
          allowVoiceMessages: true
        }
      };

      const params = {
        TableName: TABLE_NAME,
        Item: userChatEntry
      };

      await docClient.send(new PutCommand(params));
    }

    // Return the chat object for the creator
    const chat = {
      chatId,
      type,
      name: type === 'group' ? name : null,
      participants: participants,
      participantDetails,
      createdBy,
      createdAt: now,
      updatedAt: now,
      lastMessage: null,
      lastMessageTime: null,
      unreadCount: 0,
      settings: {
        allowInvites: true,
        allowFileUploads: true,
        allowVoiceMessages: true
      }
    };

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
