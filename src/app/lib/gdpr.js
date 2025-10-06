import { DeleteCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { getDynamoDocClient } from './dynamodb';
import { TABLE_NAMES, GSI_NAMES } from './dynamodb-schema';

const docClient = getDynamoDocClient();

export async function deleteUserAndData(userId) {
  // Delete user record
  await docClient.send(new DeleteCommand({ TableName: TABLE_NAMES.USERS, Key: { userId } }));

  // Delete posts by user (scan + filter for MVP)
  const posts = await docClient.send(new ScanCommand({ TableName: TABLE_NAMES.COMMUNITY_POSTS }));
  const myPosts = (posts.Items || []).filter(p => p.userId === userId);
  for (const p of myPosts) {
    await docClient.send(new DeleteCommand({ TableName: TABLE_NAMES.COMMUNITY_POSTS, Key: { postId: p.postId } }));
  }
  // Extend: projects, assets, chats, etc.
}


