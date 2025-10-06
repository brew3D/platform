import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, PutCommand, GetCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { TABLE_NAMES, generateId, getCurrentTimestamp } from '../../../../lib/dynamodb-schema';
import { withApiAuth } from '../_middleware/auth';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

// GET /api/v1/webhooks - List user's webhooks
export const GET = withApiAuth(async (request) => {
  try {
    const userId = request.user?.userId || request.apiKey?.userId;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const params = {
      TableName: TABLE_NAMES.WEBHOOKS,
      FilterExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      Limit: limit
    };

    const result = await docClient.send(new ScanCommand(params));
    const webhooks = (result.Items || []).slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      webhooks,
      pagination: {
        limit,
        offset,
        total: result.Items?.length || 0
      }
    });
  } catch (error) {
    console.error('List webhooks error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to list webhooks' 
    }, { status: 500 });
  }
});

// POST /api/v1/webhooks - Create a new webhook
export const POST = withApiAuth(async (request) => {
  try {
    const userId = request.user?.userId || request.apiKey?.userId;
    const body = await request.json();
    const { 
      url, 
      events, 
      secret, 
      isActive = true,
      description = '',
      headers = {}
    } = body;

    if (!url || !events || !Array.isArray(events)) {
      return NextResponse.json({ 
        success: false, 
        error: 'URL and events array are required' 
      }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(url);
    } catch (urlError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid URL format' 
      }, { status: 400 });
    }

    // Validate events
    const validEvents = [
      'post.created', 'post.updated', 'post.deleted',
      'event.created', 'event.updated', 'event.deleted',
      'user.registered', 'user.updated',
      'comment.created', 'comment.deleted',
      'rsvp.created', 'rsvp.updated'
    ];

    const invalidEvents = events.filter(event => !validEvents.includes(event));
    if (invalidEvents.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: `Invalid events: ${invalidEvents.join(', ')}` 
      }, { status: 400 });
    }

    const webhookId = generateId('webhook');
    const now = getCurrentTimestamp();

    const webhook = {
      webhookId,
      userId,
      url,
      events,
      secret: secret || generateWebhookSecret(),
      isActive,
      description,
      headers,
      createdAt: now,
      updatedAt: now,
      lastTriggered: null,
      failureCount: 0,
      successCount: 0
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAMES.WEBHOOKS,
      Item: webhook
    }));

    return NextResponse.json({ 
      success: true, 
      webhook: {
        ...webhook,
        secret: undefined // Don't return the secret
      }
    });
  } catch (error) {
    console.error('Create webhook error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create webhook' 
    }, { status: 500 });
  }
});

// Generate webhook secret
function generateWebhookSecret() {
  return 'whsec_' + require('crypto').randomBytes(32).toString('hex');
}
