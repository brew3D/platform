import { NextResponse } from 'next/server';
import { QueryCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { getDynamoDocClient } from '@/app/lib/dynamodb';
import { TABLE_NAMES, generateId, getCurrentTimestamp } from '@/app/lib/dynamodb-schema';
import { requireAuth } from '@/app/lib/auth';

const docClient = getDynamoDocClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const lastKey = searchParams.get('lastKey');
    const params = {
      TableName: TABLE_NAMES.COMMUNITY_POSTS,
      Limit: limit
    };
    if (lastKey) {
      try { params.ExclusiveStartKey = JSON.parse(Buffer.from(lastKey, 'base64').toString('utf8')); } catch {}
    }
    const result = await docClient.send(new ScanCommand(params));
    const encodedLastKey = result.LastEvaluatedKey ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64') : null;
    return NextResponse.json({ items: result.Items || [], lastKey: encodedLastKey });
  } catch (e) {
    console.error('List posts error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
    const { content, type = 'text', attachments = [], tags = [] } = await request.json();
    if (!content || !content.trim()) return NextResponse.json({ message: 'Content required' }, { status: 400 });
    const now = getCurrentTimestamp();
    const post = {
      postId: generateId('post'),
      userId: auth.userId,
      content: content.trim(),
      type,
      attachments,
      likes: [],
      comments: [],
      shares: 0,
      tags,
      isPinned: false,
      createdAt: now,
      updatedAt: now
    };
    await docClient.send(new PutCommand({ TableName: TABLE_NAMES.COMMUNITY_POSTS, Item: post }));
    return NextResponse.json({ post });
  } catch (e) {
    console.error('Create post error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


