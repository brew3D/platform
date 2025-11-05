import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { TABLE_NAMES, getCurrentTimestamp } from '@/app/lib/dynamodb-schema';
import { withApiAuth } from '../../../_middleware/auth';
import crypto from 'crypto';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

// POST /api/v1/webhooks/[webhookId]/test - Test webhook
export const POST = withApiAuth(async (request, { params }) => {
  try {
    const { webhookId } = params;
    const userId = request.user?.userId || request.apiKey?.userId;

    // Get webhook
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

    const webhook = result.Item;

    // Create test payload
    const testPayload = {
      event: 'webhook.test',
      data: {
        webhookId: webhook.webhookId,
        message: 'This is a test webhook from Brew3D Platform',
        timestamp: new Date().toISOString(),
        test: true
      }
    };

    // Send test webhook
    const testResult = await sendWebhook(webhook, testPayload);

    // Update webhook stats
    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAMES.WEBHOOKS,
      Key: { webhookId },
      UpdateExpression: 'SET lastTriggered = :timestamp, successCount = successCount + :inc',
      ExpressionAttributeValues: {
        ':timestamp': getCurrentTimestamp(),
        ':inc': testResult.success ? 1 : 0
      }
    }));

    return NextResponse.json({ 
      success: true, 
      testResult: {
        success: testResult.success,
        statusCode: testResult.statusCode,
        responseTime: testResult.responseTime,
        error: testResult.error
      }
    });
  } catch (error) {
    console.error('Test webhook error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to test webhook' 
    }, { status: 500 });
  }
});

// Send webhook to URL
async function sendWebhook(webhook, payload) {
  const startTime = Date.now();
  
  try {
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'Simo-Platform-Webhook/1.0',
      'X-Webhook-Event': payload.event,
      'X-Webhook-ID': webhook.webhookId,
      ...webhook.headers
    };

    // Add signature if secret is provided
    if (webhook.secret) {
      const signature = generateWebhookSignature(JSON.stringify(payload), webhook.secret);
      headers['X-Webhook-Signature'] = `sha256=${signature}`;
    }

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      timeout: 10000 // 10 second timeout
    });

    const responseTime = Date.now() - startTime;

    return {
      success: response.ok,
      statusCode: response.status,
      responseTime,
      error: response.ok ? null : `HTTP ${response.status}: ${response.statusText}`
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      success: false,
      statusCode: 0,
      responseTime,
      error: error.message
    };
  }
}

// Generate webhook signature
function generateWebhookSignature(payload, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
}
