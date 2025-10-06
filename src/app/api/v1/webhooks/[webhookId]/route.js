import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { TABLE_NAMES, getCurrentTimestamp } from '../../../lib/dynamodb-schema';
import { withApiAuth } from '../../_middleware/auth';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

// GET /api/v1/webhooks/[webhookId] - Get webhook details
export const GET = withApiAuth(async (request, { params }) => {
  try {
    const { webhookId } = params;
    const userId = request.user?.userId || request.apiKey?.userId;

    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAMES.WEBHOOKS,
      Key: { webhookId }
    }));

    if (!result.Item) {
      return NextResponse.json({ 
        success: false, 
        error: 'Webhook not found' 
      }, { status: 404 });
    }

    // Check ownership
    if (result.Item.userId !== userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied' 
      }, { status: 403 });
    }

    return NextResponse.json({ 
      success: true, 
      webhook: {
        ...result.Item,
        secret: undefined // Don't return the secret
      }
    });
  } catch (error) {
    console.error('Get webhook error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to get webhook' 
    }, { status: 500 });
  }
});

// PUT /api/v1/webhooks/[webhookId] - Update webhook
export const PUT = withApiAuth(async (request, { params }) => {
  try {
    const { webhookId } = params;
    const userId = request.user?.userId || request.apiKey?.userId;
    const body = await request.json();

    // Get existing webhook
    const existing = await docClient.send(new GetCommand({
      TableName: TABLE_NAMES.WEBHOOKS,
      Key: { webhookId }
    }));

    if (!existing.Item) {
      return NextResponse.json({ 
        success: false, 
        error: 'Webhook not found' 
      }, { status: 404 });
    }

    // Check ownership
    if (existing.Item.userId !== userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied' 
      }, { status: 403 });
    }

    const now = getCurrentTimestamp();
    const updates = [];
    const names = {};
    const values = { ':updatedAt': now };

    // Build update expression
    if (body.url !== undefined) {
      // Validate URL
      try {
        new URL(body.url);
        updates.push('#url = :url');
        names['#url'] = 'url';
        values[':url'] = body.url;
      } catch (urlError) {
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid URL format' 
        }, { status: 400 });
      }
    }

    if (body.events !== undefined) {
      updates.push('#events = :events');
      names['#events'] = 'events';
      values[':events'] = body.events;
    }

    if (body.isActive !== undefined) {
      updates.push('#isActive = :isActive');
      names['#isActive'] = 'isActive';
      values[':isActive'] = body.isActive;
    }

    if (body.description !== undefined) {
      updates.push('#description = :description');
      names['#description'] = 'description';
      values[':description'] = body.description;
    }

    if (body.headers !== undefined) {
      updates.push('#headers = :headers');
      names['#headers'] = 'headers';
      values[':headers'] = body.headers;
    }

    updates.push('#updatedAt = :updatedAt');
    names['#updatedAt'] = 'updatedAt';

    if (updates.length === 1) { // Only updatedAt
      return NextResponse.json({ 
        success: false, 
        error: 'No valid fields to update' 
      }, { status: 400 });
    }

    const result = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAMES.WEBHOOKS,
      Key: { webhookId },
      UpdateExpression: 'SET ' + updates.join(', '),
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: 'ALL_NEW'
    }));

    return NextResponse.json({ 
      success: true, 
      webhook: {
        ...result.Attributes,
        secret: undefined // Don't return the secret
      }
    });
  } catch (error) {
    console.error('Update webhook error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update webhook' 
    }, { status: 500 });
  }
});

// DELETE /api/v1/webhooks/[webhookId] - Delete webhook
export const DELETE = withApiAuth(async (request, { params }) => {
  try {
    const { webhookId } = params;
    const userId = request.user?.userId || request.apiKey?.userId;

    // Get existing webhook
    const existing = await docClient.send(new GetCommand({
      TableName: TABLE_NAMES.WEBHOOKS,
      Key: { webhookId }
    }));

    if (!existing.Item) {
      return NextResponse.json({ 
        success: false, 
        error: 'Webhook not found' 
      }, { status: 404 });
    }

    // Check ownership
    if (existing.Item.userId !== userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied' 
      }, { status: 403 });
    }

    await docClient.send(new DeleteCommand({
      TableName: TABLE_NAMES.WEBHOOKS,
      Key: { webhookId }
    }));

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook deleted successfully' 
    });
  } catch (error) {
    console.error('Delete webhook error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete webhook' 
    }, { status: 500 });
  }
});
