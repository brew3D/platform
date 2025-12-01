import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/app/lib/supabase';
import { generateId, getCurrentTimestamp } from '@/app/lib/dynamodb-schema';
import { withApiAuth } from '../_middleware/auth';

const supabase = getSupabaseClient();

// GET /api/v1/webhooks - List user's webhooks
export const GET = withApiAuth(async (request) => {
  try {
    const userId = request.user?.userId || request.apiKey?.userId;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const { data: webhooks, error } = await supabase
      .from('webhooks')
      .select('*')
      .eq('user_id', userId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const { count } = await supabase
      .from('webhooks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    return NextResponse.json({
      success: true,
      webhooks: webhooks || [],
      pagination: {
        limit,
        offset,
        total: count || 0
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

    const webhookId = generateId('webhook');
    const now = getCurrentTimestamp();

    const webhook = {
      webhook_id: webhookId,
      user_id: userId,
      url,
      events: events,
      secret: secret || '',
      is_active: isActive,
      description: description || '',
      headers: headers || {},
      created_at: now,
      updated_at: now
    };

    const { data: newWebhook, error: insertError } = await supabase
      .from('webhooks')
      .insert(webhook)
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      webhook: newWebhook
    });
  } catch (error) {
    console.error('Create webhook error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create webhook' 
    }, { status: 500 });
  }
});
