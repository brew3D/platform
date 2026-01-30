import { NextResponse } from 'next/server';

// Stub: AWS DynamoDB removed (dead code)
async function verifyApiKey(apiKey) {
  return !!apiKey && process.env.ZAPIER_API_KEY ? apiKey === process.env.ZAPIER_API_KEY : false;
}

const TRIGGERS = ['new_post', 'new_event', 'new_user', 'post_updated', 'event_updated'];

export async function GET(request) {
  const apiKey = request.headers.get('x-api-key');
  if (!apiKey || !(await verifyApiKey(apiKey))) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const trigger = searchParams.get('trigger');
  if (!trigger || !TRIGGERS.includes(trigger)) {
    return NextResponse.json({ error: 'Unknown trigger type', available_triggers: TRIGGERS }, { status: 400 });
  }
  return NextResponse.json({ data: [], trigger });
}

export async function POST(request) {
  const apiKey = request.headers.get('x-api-key');
  if (!apiKey || !(await verifyApiKey(apiKey))) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  return NextResponse.json({ success: true, ...body });
}
