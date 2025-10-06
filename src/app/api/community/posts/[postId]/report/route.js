import { NextResponse } from 'next/server';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { getDynamoDocClient } from '../../../../../lib/dynamodb';
import { TABLE_NAMES, getCurrentTimestamp, generateId } from '../../../../../lib/dynamodb-schema';
import { requireAuth } from '../../../../../lib/auth';

const docClient = getDynamoDocClient();

export async function POST(request, { params }) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
    const { postId } = params;
    const { reason } = await request.json();
    const report = { id: generateId('rpt'), userId: auth.userId, reason: reason || 'unspecified', createdAt: getCurrentTimestamp() };
    const res = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAMES.COMMUNITY_POSTS,
      Key: { postId },
      UpdateExpression: 'SET #reports = list_append(if_not_exists(#reports, :empty), :new)',
      ExpressionAttributeNames: { '#reports': 'reports' },
      ExpressionAttributeValues: { ':new': [report], ':empty': [] },
      ReturnValues: 'ALL_NEW'
    }));
    return NextResponse.json({ post: res.Attributes });
  } catch (e) {
    console.error('Report post error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


