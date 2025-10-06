import { NextResponse } from 'next/server';
import { UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { getDynamoDocClient } from '../../../../../lib/dynamodb';
import { TABLE_NAMES, getCurrentTimestamp, generateId } from '../../../../../lib/dynamodb-schema';
import { requireAuth } from '../../../../../lib/auth';

const docClient = getDynamoDocClient();

export async function POST(request, { params }) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
    const { postId } = params;
    const { content } = await request.json();
    if (!content || !content.trim()) return NextResponse.json({ message: 'Content required' }, { status: 400 });
    const comment = { id: generateId('cmt'), userId: auth.userId, content: content.trim(), createdAt: getCurrentTimestamp() };
    const res = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAMES.COMMUNITY_POSTS,
      Key: { postId },
      UpdateExpression: 'SET #comments = list_append(if_not_exists(#comments, :empty), :new)',
      ExpressionAttributeNames: { '#comments': 'comments' },
      ExpressionAttributeValues: { ':new': [comment], ':empty': [] },
      ReturnValues: 'ALL_NEW'
    }));
    return NextResponse.json({ post: res.Attributes });
  } catch (e) {
    console.error('Add comment error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


