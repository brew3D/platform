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

    const queryParams = {
      TableName: MESSAGES_TABLE,
      IndexName: 'chatId-timestamp-index',
      KeyConditionExpression: 'chatId = :chatId',
      ExpressionAttributeValues: {
        ':chatId': chatId
      },
      ScanIndexForward: true, // Sort by timestamp ascending
      Limit: 100 // Limit to last 100 messages
    };

    const result = await docClient.send(new QueryCommand(queryParams));

    return NextResponse.json({ 
      success: true, 
      messages: result.Items || [] 
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch messages' 
    }, { status: 500 });
  }
}
