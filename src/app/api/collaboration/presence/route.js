import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const PRESENCE_TABLE = process.env.DDB_PRESENCE_TABLE || 'ruchi-ai-presence';

// Update user presence
export async function POST(request) {
  try {
    const { userId, sceneId, userInfo, action = 'join' } = await request.json();

    if (!userId || !sceneId) {
      return NextResponse.json({ error: 'userId and sceneId are required' }, { status: 400 });
    }

    const timestamp = new Date().toISOString();
    const ttl = Math.floor(Date.now() / 1000) + 60; // 60 seconds TTL

    if (action === 'join' || action === 'heartbeat') {
      const presenceData = {
        userId,
        sceneId,
        ...userInfo,
        lastSeen: timestamp,
        ttl,
        action
      };

      await docClient.send(new PutCommand({
        TableName: PRESENCE_TABLE,
        Item: presenceData
      }));

      console.log(`✅ User ${userId} ${action} scene ${sceneId}`);
    } else if (action === 'leave') {
      await docClient.send(new DeleteCommand({
        TableName: PRESENCE_TABLE,
        Key: { userId, sceneId }
      }));

      console.log(`👋 User ${userId} left scene ${sceneId}`);
    }

    return NextResponse.json({ success: true, action, timestamp });
  } catch (error) {
    console.error('Error updating presence:', error);
    return NextResponse.json({ error: 'Failed to update presence' }, { status: 500 });
  }
}

// Get active users in a scene
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sceneId = searchParams.get('sceneId');

    if (!sceneId) {
      return NextResponse.json({ error: 'sceneId is required' }, { status: 400 });
    }

    const result = await docClient.send(new ScanCommand({
      TableName: PRESENCE_TABLE,
      FilterExpression: 'sceneId = :sceneId AND ttl > :currentTime',
      ExpressionAttributeValues: {
        ':sceneId': sceneId,
        ':currentTime': Math.floor(Date.now() / 1000)
      }
    }));

    const activeUsers = result.Items || [];
    console.log(`👥 Found ${activeUsers.length} active users in scene ${sceneId}`);

    return NextResponse.json({ activeUsers });
  } catch (error) {
    console.error('Error getting active users:', error);
    return NextResponse.json({ error: 'Failed to get active users' }, { status: 500 });
  }
}
