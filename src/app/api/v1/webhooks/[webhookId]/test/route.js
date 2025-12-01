import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/app/lib/supabase';
import { getCurrentTimestamp } from '@/app/lib/dynamodb-schema';
import { withApiAuth } from '../../../_middleware/auth';
import crypto from 'crypto';

const supabase = getSupabaseClient();

// POST /api/v1/webhooks/[webhookId]/test - Test webhook
export const POST = withApiAuth(async (request, { params }) => {
  try {
    const { webhookId } = params;
    const userId = request.user?.userId || request.apiKey?.userId;

    // Get webhook
    const { data: webhook, error: fetchError } = await supabase
      .from('webhooks')
      .select('*')
      .eq('webhook_id', webhookId)
      .single();

    if (fetchError || !webhook) {
      return NextResponse.json({ 
        success: false, 
        error: 'Webhook not found' 
      }, { status: 404 });
    }

    // Check ownership
    if (webhook.user_id !== userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied' 
      }, { status: 403 });
    }

    // Create test payload
    const testPayload = {
      event: 'webhook.test',
      data: {
        webhookId: webhook.webhook_id || webhook.webhookId,
        message: 'This is a test webhook from Brew3D Platform',
        timestamp: new Date().toISOString(),
        test: true
      }
    };

    // Send test webhook
    const testResult = await sendWebhook(webhook, testPayload);

    // Update webhook stats
    await supabase
      .from('webhooks')
      .update({
        last_triggered: getCurrentTimestamp(),
        updated_at: getCurrentTimestamp()
      })
      .eq('webhook_id', webhookId);

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
      'User-Agent': 'Brew3D-Platform-Webhook/1.0',
      'X-Webhook-Event': payload.event,
      'X-Webhook-ID': webhook.webhook_id || webhook.webhookId,
      ...(webhook.headers || {})
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
