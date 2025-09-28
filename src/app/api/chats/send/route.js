import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const MESSAGES_TABLE = process.env.DDB_MESSAGES_TABLE || 'ruchi-ai-messages';
const CHATS_TABLE = process.env.DDB_CHATS_TABLE || 'ruchi-ai-chats';

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
    const now = new Date().toISOString();

    const message = {
      messageId,
      chatId,
      senderId,
      senderName: senderName || 'Unknown',
      content: content.trim(),
      timestamp: timestamp || now,
      type: 'text',
      status: 'sent',
      createdAt: now
    };

    // Save message to messages table
    const messageParams = {
      TableName: MESSAGES_TABLE,
      Item: message
    };

    await docClient.send(new PutCommand(messageParams));

    // Get chat participants first
    try {
      const chatResult = await docClient.send(new GetCommand({
        TableName: CHATS_TABLE,
        Key: { 
          chatId,
          userId: senderId // Get the sender's chat entry to find participants
        }
      }));

      if (chatResult.Item && chatResult.Item.participants) {
        // Update all participant entries
        for (const userId of chatResult.Item.participants) {
          const userChatUpdateParams = {
            TableName: CHATS_TABLE,
            Key: { 
              chatId,
              userId 
            },
            UpdateExpression: 'SET lastMessage = :lastMessage, lastMessageTime = :lastMessageTime, updatedAt = :updatedAt',
            ExpressionAttributeValues: {
              ':lastMessage': content.trim(),
              ':lastMessageTime': now,
              ':updatedAt': now
            }
          };

          await docClient.send(new UpdateCommand(userChatUpdateParams));
        }
      }
    } catch (updateError) {
      console.warn('Failed to update user chat entries:', updateError);
      // Don't fail the entire request if this fails
    }

    return NextResponse.json({ 
      success: true, 
      message 
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to send message' 
    }, { status: 500 });
  }
}
