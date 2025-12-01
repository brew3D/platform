import { getSupabaseClient } from './supabase.js';
import crypto from 'crypto';

const supabase = getSupabaseClient();

// Trigger webhooks for a specific event
export async function triggerWebhooks(event, data, userId = null) {
  try {
    // Get all active webhooks that listen to this event
    const webhooks = await getWebhooksForEvent(event, userId);
    
    if (webhooks.length === 0) {
      return { triggered: 0, errors: [] };
    }

    const payload = {
      event,
      data,
      timestamp: new Date().toISOString(),
      id: crypto.randomUUID()
    };

    const results = await Promise.allSettled(
      webhooks.map(webhook => sendWebhook(webhook, payload))
    );

    const triggered = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const errors = results
      .filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success))
      .map(r => r.status === 'rejected' ? r.reason : r.value.error);

    return { triggered, errors };
  } catch (error) {
    console.error('Error triggering webhooks:', error);
    return { triggered: 0, errors: [error.message] };
  }
}

// Get webhooks that should be triggered for an event
async function getWebhooksForEvent(event, userId = null) {
  try {
    let query = supabase
      .from('webhooks')
      .select('*')
      .eq('is_active', true)
      .contains('events', [event]);

    // If userId is provided, only get webhooks for that user
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting webhooks for event:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting webhooks for event:', error);
    return [];
  }
}

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
    const secret = webhook.secret || null;
    if (secret) {
      const signature = generateWebhookSignature(JSON.stringify(payload), secret);
      headers['X-Webhook-Signature'] = `sha256=${signature}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    const success = response.ok;
    
    // Update webhook stats
    await updateWebhookStats(webhook.webhookId, success);

    return {
      success,
      statusCode: response.status,
      responseTime,
      error: success ? null : `HTTP ${response.status}: ${response.statusText}`
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Update webhook stats for failure
    await updateWebhookStats(webhook.webhookId, false);
    
    return {
      success: false,
      statusCode: 0,
      responseTime,
      error: error.name === 'AbortError' ? 'Request timeout' : error.message
    };
  }
}

// Update webhook statistics
async function updateWebhookStats(webhookId, success) {
  try {
    const id = webhookId.webhook_id || webhookId;
    const updateData = {
      last_triggered: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Note: Supabase doesn't support atomic increments easily, 
    // you may need to read first then update, or use a database function
    const { error } = await supabase
      .from('webhooks')
      .update(updateData)
      .eq('webhook_id', id);

    if (error) {
      console.error('Error updating webhook stats:', error);
    }
  } catch (error) {
    console.error('Error updating webhook stats:', error);
  }
}

// Generate webhook signature
function generateWebhookSignature(payload, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
}

// Verify webhook signature (for incoming webhooks)
export function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = generateWebhookSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

// Common webhook events
export const WEBHOOK_EVENTS = {
  // Post events
  POST_CREATED: 'post.created',
  POST_UPDATED: 'post.updated',
  POST_DELETED: 'post.deleted',
  
  // Event events
  EVENT_CREATED: 'event.created',
  EVENT_UPDATED: 'event.updated',
  EVENT_DELETED: 'event.deleted',
  
  // User events
  USER_REGISTERED: 'user.registered',
  USER_UPDATED: 'user.updated',
  
  // Comment events
  COMMENT_CREATED: 'comment.created',
  COMMENT_DELETED: 'comment.deleted',
  
  // RSVP events
  RSVP_CREATED: 'rsvp.created',
  RSVP_UPDATED: 'rsvp.updated',
  
  // Badge events
  BADGE_EARNED: 'badge.earned',
  
  // System events
  WEBHOOK_TEST: 'webhook.test'
};
