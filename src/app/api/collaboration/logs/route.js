import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const LOGS_TABLE = process.env.DDB_LOGS_TABLE || 'ruchi-ai-logs';

// Add a new log entry
export async function POST(request) {
  try {
    const { sceneId, userId, userName, action, details, timestamp } = await request.json();

    if (!sceneId || !userId || !action) {
      return NextResponse.json({ error: 'sceneId, userId, and action are required' }, { status: 400 });
    }

    const logEntry = {
      sceneId,
      userId,
      userName: userName || 'Unknown User',
      action,
      details: details || '',
      timestamp: timestamp || new Date().toISOString(),
      ttl: Math.floor(Date.now() / 1000) + 3600 // 1 hour TTL
    };

    await docClient.send(new PutCommand({
      TableName: LOGS_TABLE,
      Item: logEntry
    }));

    console.log(`📝 Log added: ${userName} ${action} in scene ${sceneId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding log:', error);
    return NextResponse.json({ error: 'Failed to add log' }, { status: 500 });
  }
}

// Get logs for a scene
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sceneId = searchParams.get('sceneId');

    if (!sceneId) {
      return NextResponse.json({ error: 'sceneId is required' }, { status: 400 });
    }

    const result = await docClient.send(new ScanCommand({
      TableName: LOGS_TABLE,
      FilterExpression: 'sceneId = :sceneId AND #ttl > :currentTime',
      ExpressionAttributeNames: {
        '#ttl': 'ttl'
      },
      ExpressionAttributeValues: {
        ':sceneId': sceneId,
        ':currentTime': Math.floor(Date.now() / 1000)
      }
    }));

    const logs = (result.Items || [])
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 50); // Limit to 50 most recent logs

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Error getting logs:', error);
    return NextResponse.json({ error: 'Failed to get logs' }, { status: 500 });
  }
}
