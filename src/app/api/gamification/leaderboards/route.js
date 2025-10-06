import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { TABLE_NAMES } from '../../../../lib/dynamodb-schema';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

// GET /api/gamification/leaderboards - Get all leaderboards
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const timeRange = searchParams.get('timeRange') || 'all-time';
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const params = {
      TableName: TABLE_NAMES.LEADERBOARDS,
      FilterExpression: 'isActive = :active AND isPublic = :public',
      ExpressionAttributeValues: {
        ':active': true,
        ':public': true
      }
    };

    // Add filters
    const filters = [];
    if (type) {
      filters.push('#type = :type');
      params.ExpressionAttributeNames = { '#type': 'type' };
      params.ExpressionAttributeValues[':type'] = type;
    }
    if (category) {
      filters.push('category = :category');
      params.ExpressionAttributeValues[':category'] = category;
    }
    if (timeRange !== 'all-time') {
      filters.push('timeRange = :timeRange');
      params.ExpressionAttributeValues[':timeRange'] = timeRange;
    }

    if (filters.length > 0) {
      params.FilterExpression += ' AND ' + filters.join(' AND ');
    }

    const result = await docClient.send(new ScanCommand(params));
    
    // Sort leaderboards by last updated and limit results
    const leaderboards = (result.Items || [])
      .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
      .slice(0, limit);

    // Get user details for each leaderboard entry
    const leaderboardsWithUsers = await Promise.all(
      leaderboards.map(async (leaderboard) => {
        const entriesWithUsers = await Promise.all(
          (leaderboard.entries || []).slice(0, leaderboard.maxEntries || 10).map(async (entry) => {
            try {
              const user = await docClient.send(new GetCommand({
                TableName: TABLE_NAMES.USERS,
                Key: { userId: entry.userId }
              }));
              
              return {
                ...entry,
                user: user.Item ? {
                  userId: user.Item.userId,
                  name: user.Item.name || user.Item.email,
                  email: user.Item.email,
                  profilePicture: user.Item.profilePicture || '',
                  role: user.Item.role || 'member'
                } : null
              };
            } catch (error) {
              console.error('Error fetching user:', error);
              return {
                ...entry,
                user: null
              };
            }
          })
        );

        return {
          ...leaderboard,
          entries: entriesWithUsers
        };
      })
    );

    return NextResponse.json({ 
      success: true, 
      leaderboards: leaderboardsWithUsers,
      count: leaderboardsWithUsers.length
    });
  } catch (error) {
    console.error('Get leaderboards error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch leaderboards' 
    }, { status: 500 });
  }
}
