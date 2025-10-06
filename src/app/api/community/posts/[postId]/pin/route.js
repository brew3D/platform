import { NextResponse } from 'next/server';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { getDynamoDocClient } from '../../../lib/dynamodb';
import { TABLE_NAMES } from '../../../lib/dynamodb-schema';
import { requireAuth } from '../../../lib/auth';

const docClient = getDynamoDocClient();

export async function POST(request, { params }) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
    const role = auth.role || 'member';
    if (!['admin', 'moderator'].includes(role)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    const { postId } = params;
    const { pinned } = await request.json();
    const res = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAMES.COMMUNITY_POSTS,
      Key: { postId },
      UpdateExpression: 'SET #isPinned = :v',
      ExpressionAttributeNames: { '#isPinned': 'isPinned' },
      ExpressionAttributeValues: { ':v': !!pinned },
      ReturnValues: 'ALL_NEW'
    }));
    return NextResponse.json({ post: res.Attributes });
  } catch (e) {
    console.error('Pin post error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


