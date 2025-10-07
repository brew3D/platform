import { NextResponse } from 'next/server';
import { PutCommand, QueryCommand, UpdateCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { getDynamoDocClient } from '@/app/lib/dynamodb';
import { TABLE_NAMES, generateId, getCurrentTimestamp } from '@/app/lib/dynamodb-schema';
import { requireAuth } from '@/app/lib/auth';

const docClient = getDynamoDocClient();
const TABLE = process.env.DDB_NOTIFICATIONS_TABLE || 'ruchi-ai-notifications';

export async function GET(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
    const result = await docClient.send(new ScanCommand({ TableName: TABLE }));
    const list = (result.Items || []).filter(n => n.userId === auth.userId).sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||''));
    return NextResponse.json({ items: list });
  } catch (e) {
    console.error('Notifications list error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
    const { type, payload } = await request.json();
    const item = { id: generateId('ntf'), userId: auth.userId, type: type || 'generic', payload: payload || {}, read: false, createdAt: getCurrentTimestamp() };
    await docClient.send(new PutCommand({ TableName: TABLE, Item: item }));
    return NextResponse.json({ notification: item });
  } catch (e) {
    console.error('Notifications create error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


