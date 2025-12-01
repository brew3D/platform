import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/app/lib/supabase';
import { getCurrentTimestamp } from '@/app/lib/dynamodb-schema';
import { withApiAuth } from '../../_middleware/auth';

const supabase = getSupabaseClient();

// GET /api/v1/webhooks/[webhookId] - Get webhook details
export const GET = withApiAuth(async (request, { params }) => {
  try {
    const { webhookId } = params;
    const userId = request.user?.userId || request.apiKey?.userId;

    const { data: webhook, error } = await supabase
      .from('webhooks')
      .select('*')
      .eq('webhook_id', webhookId)
      .single();

    if (error || !webhook) {
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

    const { secret, ...webhookWithoutSecret } = webhook;
    return NextResponse.json({ 
      success: true, 
      webhook: webhookWithoutSecret
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
    const { data: existing, error: fetchError } = await supabase
      .from('webhooks')
      .select('*')
      .eq('webhook_id', webhookId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ 
        success: false, 
        error: 'Webhook not found' 
      }, { status: 404 });
    }

    // Check ownership
    if (existing.user_id !== userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied' 
      }, { status: 403 });
    }

    const updateData = {
      updated_at: getCurrentTimestamp()
    };

    // Build update data
    if (body.url !== undefined) {
      // Validate URL
      try {
        new URL(body.url);
        updateData.url = body.url;
      } catch (urlError) {
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid URL format' 
        }, { status: 400 });
      }
    }

    if (body.events !== undefined) {
      updateData.events = body.events;
    }

    if (body.isActive !== undefined) {
      updateData.is_active = body.isActive;
    }

    if (body.description !== undefined) {
      updateData.description = body.description;
    }

    if (body.headers !== undefined) {
      updateData.headers = body.headers;
    }

    if (Object.keys(updateData).length === 1) { // Only updated_at
      return NextResponse.json({ 
        success: false, 
        error: 'No valid fields to update' 
      }, { status: 400 });
    }

    const { data: updatedWebhook, error: updateError } = await supabase
      .from('webhooks')
      .update(updateData)
      .eq('webhook_id', webhookId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    const { secret, ...webhookWithoutSecret } = updatedWebhook;
    return NextResponse.json({ 
      success: true, 
      webhook: webhookWithoutSecret
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
    const { data: existing, error: fetchError } = await supabase
      .from('webhooks')
      .select('user_id')
      .eq('webhook_id', webhookId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ 
        success: false, 
        error: 'Webhook not found' 
      }, { status: 404 });
    }

    // Check ownership
    if (existing.user_id !== userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied' 
      }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from('webhooks')
      .delete()
      .eq('webhook_id', webhookId);

    if (deleteError) {
      throw deleteError;
    }

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
