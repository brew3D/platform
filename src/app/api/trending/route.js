import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { TABLE_NAMES } from '../../../lib/dynamodb-schema';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

// GET /api/trending - Get trending content based on engagement metrics
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // 'all', 'posts', 'tags', 'users'
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const timeframe = searchParams.get('timeframe') || 'week'; // 'day', 'week', 'month'

    const results = {
      posts: [],
      tags: [],
      users: [],
      total: 0
    };

    // Get trending posts
    if (type === 'all' || type === 'posts') {
      results.posts = await getTrendingPosts(limit, timeframe);
    }

    // Get trending tags
    if (type === 'all' || type === 'tags') {
      results.tags = await getTrendingTags(limit, timeframe);
    }

    // Get trending users
    if (type === 'all' || type === 'users') {
      results.users = await getTrendingUsers(limit, timeframe);
    }

    results.total = results.posts.length + results.tags.length + results.users.length;

    return NextResponse.json({ 
      success: true, 
      trending: results,
      timeframe,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Trending content error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch trending content' 
    }, { status: 500 });
  }
}

// Get trending posts based on engagement metrics
async function getTrendingPosts(limit, timeframe) {
  try {
    const cutoffDate = getCutoffDate(timeframe);
    
    const params = {
      TableName: TABLE_NAMES.COMMUNITY_POSTS,
      FilterExpression: 'createdAt >= :cutoff',
      ExpressionAttributeValues: {
        ':cutoff': cutoffDate
      }
    };

    const result = await docClient.send(new ScanCommand(params));
    
    // Calculate trending score for each post
    const posts = (result.Items || []).map(post => {
      const engagementScore = calculatePostEngagement(post);
      const timeDecay = calculateTimeDecay(post.createdAt, timeframe);
      const trendingScore = engagementScore * timeDecay;
      
      return {
        id: post.postId,
        type: 'post',
        title: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
        content: post.content,
        author: post.userId,
        tags: post.tags || [],
        likes: post.likes?.length || 0,
        comments: post.comments?.length || 0,
        shares: post.shares || 0,
        isPinned: post.isPinned || false,
        createdAt: post.createdAt,
        trendingScore,
        engagementScore,
        timeDecay
      };
    });

    // Sort by trending score and return top posts
    return posts
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting trending posts:', error);
    return [];
  }
}

// Get trending tags based on usage frequency
async function getTrendingTags(limit, timeframe) {
  try {
    const cutoffDate = getCutoffDate(timeframe);
    
    const params = {
      TableName: TABLE_NAMES.COMMUNITY_POSTS,
      FilterExpression: 'createdAt >= :cutoff',
      ExpressionAttributeValues: {
        ':cutoff': cutoffDate
      },
      ProjectionExpression: 'tags, createdAt'
    };

    const result = await docClient.send(new ScanCommand(params));
    
    // Count tag usage and calculate trending scores
    const tagCounts = new Map();
    const tagTimestamps = new Map();
    
    (result.Items || []).forEach(post => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => {
          const count = tagCounts.get(tag) || 0;
          tagCounts.set(tag, count + 1);
          
          // Track most recent usage
          if (!tagTimestamps.get(tag) || post.createdAt > tagTimestamps.get(tag)) {
            tagTimestamps.set(tag, post.createdAt);
          }
        });
      }
    });

    // Calculate trending scores
    const tags = Array.from(tagCounts.entries()).map(([tag, count]) => {
      const timeDecay = calculateTimeDecay(tagTimestamps.get(tag), timeframe);
      const trendingScore = count * timeDecay;
      
      return {
        id: tag,
        type: 'tag',
        name: tag,
        count,
        lastUsed: tagTimestamps.get(tag),
        trendingScore,
        timeDecay
      };
    });

    // Sort by trending score and return top tags
    return tags
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting trending tags:', error);
    return [];
  }
}

// Get trending users based on activity and engagement
async function getTrendingUsers(limit, timeframe) {
  try {
    const cutoffDate = getCutoffDate(timeframe);
    
    // Get all posts from the timeframe
    const postsParams = {
      TableName: TABLE_NAMES.COMMUNITY_POSTS,
      FilterExpression: 'createdAt >= :cutoff',
      ExpressionAttributeValues: {
        ':cutoff': cutoffDate
      },
      ProjectionExpression: 'userId, likes, comments, shares, createdAt'
    };

    const postsResult = await docClient.send(new ScanCommand(postsParams));
    
    // Calculate user activity scores
    const userActivity = new Map();
    
    (postsResult.Items || []).forEach(post => {
      const userId = post.userId;
      if (!userActivity.has(userId)) {
        userActivity.set(userId, {
          posts: 0,
          totalLikes: 0,
          totalComments: 0,
          totalShares: 0,
          lastActivity: post.createdAt
        });
      }
      
      const activity = userActivity.get(userId);
      activity.posts += 1;
      activity.totalLikes += post.likes?.length || 0;
      activity.totalComments += post.comments?.length || 0;
      activity.totalShares += post.shares || 0;
      
      if (post.createdAt > activity.lastActivity) {
        activity.lastActivity = post.createdAt;
      }
    });

    // Get user details
    const usersParams = {
      TableName: TABLE_NAMES.USERS,
      FilterExpression: 'userId IN :userIds',
      ExpressionAttributeValues: {
        ':userIds': Array.from(userActivity.keys())
      }
    };

    const usersResult = await docClient.send(new ScanCommand(usersParams));
    const usersMap = new Map();
    (usersResult.Items || []).forEach(user => {
      usersMap.set(user.userId, user);
    });

    // Calculate trending scores for users
    const users = Array.from(userActivity.entries()).map(([userId, activity]) => {
      const user = usersMap.get(userId);
      const engagementScore = activity.totalLikes + (activity.totalComments * 2) + (activity.totalShares * 3);
      const timeDecay = calculateTimeDecay(activity.lastActivity, timeframe);
      const trendingScore = (activity.posts * 10 + engagementScore) * timeDecay;
      
      return {
        id: userId,
        type: 'user',
        name: user?.name || user?.email || 'Unknown User',
        email: user?.email || '',
        profilePicture: user?.profilePicture || '',
        role: user?.role || 'member',
        posts: activity.posts,
        totalLikes: activity.totalLikes,
        totalComments: activity.totalComments,
        totalShares: activity.totalShares,
        lastActivity: activity.lastActivity,
        trendingScore,
        engagementScore,
        timeDecay
      };
    });

    // Sort by trending score and return top users
    return users
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting trending users:', error);
    return [];
  }
}

// Calculate post engagement score
function calculatePostEngagement(post) {
  const likes = post.likes?.length || 0;
  const comments = post.comments?.length || 0;
  const shares = post.shares || 0;
  
  // Weighted engagement score
  return (likes * 1) + (comments * 3) + (shares * 5) + (post.isPinned ? 10 : 0);
}

// Calculate time decay factor
function calculateTimeDecay(timestamp, timeframe) {
  const now = new Date();
  const postTime = new Date(timestamp);
  const hoursDiff = (now - postTime) / (1000 * 60 * 60);
  
  // Different decay rates based on timeframe
  let decayRate;
  switch (timeframe) {
    case 'day':
      decayRate = 0.1; // 10% decay per hour
      break;
    case 'week':
      decayRate = 0.02; // 2% decay per hour
      break;
    case 'month':
      decayRate = 0.005; // 0.5% decay per hour
      break;
    default:
      decayRate = 0.02;
  }
  
  return Math.exp(-decayRate * hoursDiff);
}

// Get cutoff date based on timeframe
function getCutoffDate(timeframe) {
  const now = new Date();
  let cutoff;
  
  switch (timeframe) {
    case 'day':
      cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'week':
      cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  
  return cutoff.toISOString();
}
