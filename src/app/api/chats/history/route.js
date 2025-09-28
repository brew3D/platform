import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const MESSAGES_TABLE = process.env.DDB_MESSAGES_TABLE || 'ruchi-ai-messages';

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
    const chatId = `chat_${Math.min(userId, recipientId)}_${Math.max(userId, recipientId)}`;

    const params = {
      TableName: MESSAGES_TABLE,
      IndexName: 'chatId-timestamp-index',
      KeyConditionExpression: 'chatId = :chatId',
      ExpressionAttributeValues: {
        ':chatId': chatId
      },
      ScanIndexForward: true, // Sort by timestamp ascending
      Limit: 50 // Limit to last 50 messages
    };

    const result = await docClient.send(new QueryCommand(params));

    return NextResponse.json({ 
      success: true, 
      messages: result.Items || [] 
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch chat history' 
    }, { status: 500 });
  }
}
