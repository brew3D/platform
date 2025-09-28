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
const PRESENCE_TABLE = process.env.DDB_PRESENCE_TABLE || 'ruchi-ai-presence';

// Poll for active users in a scene
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sceneId = searchParams.get('sceneId');
    const lastPoll = searchParams.get('lastPoll');

    if (!sceneId) {
      return NextResponse.json({ error: 'sceneId is required' }, { status: 400 });
    }

    const currentTime = Math.floor(Date.now() / 1000);
    
    const result = await docClient.send(new ScanCommand({
      TableName: PRESENCE_TABLE,
      FilterExpression: 'sceneId = :sceneId AND #ttl > :currentTime',
      ExpressionAttributeNames: {
        '#ttl': 'ttl'
      },
      ExpressionAttributeValues: {
        ':sceneId': sceneId,
        ':currentTime': currentTime
      }
    }));

    const activeUsers = result.Items || [];
    
    // Filter out users who haven't been active in the last 30 seconds
    const now = new Date().getTime();
    const recentUsers = activeUsers.filter(user => {
      const lastSeen = new Date(user.lastSeen || 0).getTime();
      return (now - lastSeen) < 30000; // 30 seconds
    });

    console.log(`🔄 Polling scene ${sceneId}: ${recentUsers.length} active users`);
    
    return NextResponse.json({ 
      activeUsers: recentUsers,
      timestamp: new Date().toISOString(),
      sceneId
    });
  } catch (error) {
    console.error('Error polling active users:', error);
    return NextResponse.json({ error: 'Failed to poll active users' }, { status: 500 });
  }
}
