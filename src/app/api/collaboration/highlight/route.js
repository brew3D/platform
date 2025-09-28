import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const HIGHLIGHT_TABLE = process.env.DDB_HIGHLIGHT_TABLE || 'ruchi-ai-highlights';

// Set object highlight
export async function POST(request) {
  try {
    const { sceneId, userId, userName, objectId, action = 'highlight' } = await request.json();

    if (!sceneId || !userId || !objectId) {
      return NextResponse.json({ error: 'sceneId, userId, and objectId are required' }, { status: 400 });
    }

    const highlightData = {
      sceneId,
      userId,
      userName: userName || 'Unknown User',
      objectId,
      action,
      timestamp: new Date().toISOString(),
      ttl: Math.floor(Date.now() / 1000) + 300 // 5 minutes TTL
    };

    await docClient.send(new PutCommand({
      TableName: HIGHLIGHT_TABLE,
      Item: highlightData
    }));

    console.log(`🎯 Object ${objectId} highlighted by ${userName} in scene ${sceneId}`);
    return NextResponse.json({ success: true, highlight: highlightData });
  } catch (error) {
    console.error('Error setting highlight:', error);
    return NextResponse.json({ error: 'Failed to set highlight' }, { status: 500 });
  }
}

// Get current highlights for a scene
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sceneId = searchParams.get('sceneId');

    if (!sceneId) {
      return NextResponse.json({ error: 'sceneId is required' }, { status: 400 });
    }

    const result = await docClient.send(new ScanCommand({
      TableName: HIGHLIGHT_TABLE,
      FilterExpression: 'sceneId = :sceneId AND #ttl > :currentTime',
      ExpressionAttributeNames: {
        '#ttl': 'ttl'
      },
      ExpressionAttributeValues: {
        ':sceneId': sceneId,
        ':currentTime': Math.floor(Date.now() / 1000)
      }
    }));

    const highlights = result.Items || [];
    console.log(`🎯 Found ${highlights.length} highlights for scene ${sceneId}`);

    return NextResponse.json({ highlights });
  } catch (error) {
    console.error('Error getting highlights:', error);
    return NextResponse.json({ error: 'Failed to get highlights' }, { status: 500 });
  }
}

// Clear highlight
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sceneId = searchParams.get('sceneId');
    const userId = searchParams.get('userId');

    if (!sceneId || !userId) {
      return NextResponse.json({ error: 'sceneId and userId are required' }, { status: 400 });
    }

    await docClient.send(new DeleteCommand({
      TableName: HIGHLIGHT_TABLE,
      Key: { sceneId, userId }
    }));

    console.log(`🎯 Highlight cleared for user ${userId} in scene ${sceneId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing highlight:', error);
    return NextResponse.json({ error: 'Failed to clear highlight' }, { status: 500 });
  }
}
