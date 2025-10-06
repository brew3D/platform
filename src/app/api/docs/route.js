import { NextResponse } from 'next/server';
import { PutCommand, ScanCommand, GetCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { getDynamoDocClient } from '../../lib/dynamodb';
import { TABLE_NAMES, generateId, getCurrentTimestamp } from '../../lib/dynamodb-schema';
import { requireAuth } from '../../lib/auth';

const docClient = getDynamoDocClient();

export async function GET(request) {
  try {
    const result = await docClient.send(new ScanCommand({ TableName: TABLE_NAMES.TUTORIALS }));
    return NextResponse.json({ items: result.Items || [] });
  } catch (e) {
    console.error('Docs list error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
    const { title, content, tags = [] } = await request.json();
    if (!title || !content) return NextResponse.json({ message: 'Title and content required' }, { status: 400 });
    const now = getCurrentTimestamp();
    const doc = { id: generateId('doc'), title, content, tags, createdAt: now, updatedAt: now, userId: auth.userId };
    await docClient.send(new PutCommand({ TableName: TABLE_NAMES.TUTORIALS, Item: doc }));
    return NextResponse.json({ doc });
  } catch (e) {
    console.error('Docs create error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


