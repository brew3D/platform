import { NextResponse } from 'next/server';
import { GetCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { getDynamoDocClient } from '@/app/lib/dynamodb';
import { TABLE_NAMES, getCurrentTimestamp } from '@/app/lib/dynamodb-schema';
import { requireAuth } from '@/app/lib/auth';
import { getUserById } from '@/app/lib/dynamodb-operations';

const docClient = getDynamoDocClient();

export async function GET(request, { params }) {
  try {
    const { postId } = params;
    const res = await docClient.send(new GetCommand({ TableName: TABLE_NAMES.COMMUNITY_POSTS, Key: { postId } }));
    if (!res.Item) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    return NextResponse.json(res.Item);
  } catch (e) {
    console.error('Get post error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
    const { postId } = params;
    const { content, tags, isPinned } = await request.json();
    // ensure only owners or moderators/admin can update pinned or content
    const current = await docClient.send(new GetCommand({ TableName: TABLE_NAMES.COMMUNITY_POSTS, Key: { postId } }));
    const post = current.Item;
    if (!post) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    const isOwner = post.userId === auth.userId;
    const isMod = ['admin', 'moderator'].includes(auth.role || 'member');
    if (!isOwner && !isMod) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    const now = getCurrentTimestamp();
    const updates = [];
    const names = {};
    const values = { ':updatedAt': now };
    if (typeof content === 'string') { updates.push('#content = :content'); names['#content'] = 'content'; values[':content'] = content; }
    if (Array.isArray(tags)) { updates.push('#tags = :tags'); names['#tags'] = 'tags'; values[':tags'] = tags; }
    if (typeof isPinned === 'boolean') { updates.push('#isPinned = :isPinned'); names['#isPinned'] = 'isPinned'; values[':isPinned'] = isPinned; }
    updates.push('#updatedAt = :updatedAt'); names['#updatedAt'] = 'updatedAt';
    if (!updates.length) return NextResponse.json({ message: 'No changes' }, { status: 400 });
    const res = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAMES.COMMUNITY_POSTS,
      Key: { postId },
      UpdateExpression: 'SET ' + updates.join(', '),
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: 'ALL_NEW'
    }));
    return NextResponse.json({ post: res.Attributes });
  } catch (e) {
    console.error('Update post error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
    const { postId } = params;
    const current = await docClient.send(new GetCommand({ TableName: TABLE_NAMES.COMMUNITY_POSTS, Key: { postId } }));
    const post = current.Item;
    if (!post) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    const isOwner = post.userId === auth.userId;
    const isMod = ['admin', 'moderator'].includes(auth.role || 'member');
    if (!isOwner && !isMod) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    await docClient.send(new DeleteCommand({ TableName: TABLE_NAMES.COMMUNITY_POSTS, Key: { postId } }));
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Delete post error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


