import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const USERS_TABLE = process.env.DDB_USERS_TABLE || 'ruchi-ai-users';

// GET /api/users/search - Search for users
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const exclude = searchParams.get('exclude');
    const search = searchParams.get('search');

    const params = {
      TableName: USERS_TABLE,
      Limit: 50
    };

    // Add filter to exclude specific user
    if (exclude) {
      params.FilterExpression = 'userId <> :exclude';
      params.ExpressionAttributeValues = {
        ':exclude': exclude
      };
    }

    // Add search filter if provided
    if (search) {
      const searchFilter = 'contains(email, :search) OR contains(name, :search)';
      if (params.FilterExpression) {
        params.FilterExpression += ` AND (${searchFilter})`;
      } else {
        params.FilterExpression = searchFilter;
      }
      
      if (!params.ExpressionAttributeValues) {
        params.ExpressionAttributeValues = {};
      }
      params.ExpressionAttributeValues[':search'] = search.toLowerCase();
    }

    const result = await docClient.send(new ScanCommand(params));

    // Format user data for chat
    const users = (result.Items || []).map(user => ({
      userId: user.userId,
      name: user.name || user.email,
      email: user.email,
      profilePicture: user.profilePicture || '',
      online: user.isActive || false
    }));

    return NextResponse.json({ 
      success: true, 
      users 
    });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to search users' 
    }, { status: 500 });
  }
}