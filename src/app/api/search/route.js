import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { TABLE_NAMES } from '../../../lib/dynamodb-schema';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

// GET /api/search - Unified search across posts, users, and tags
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'all'; // 'all', 'posts', 'users', 'tags'
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ 
        success: false, 
        error: 'Search query must be at least 2 characters long' 
      }, { status: 400 });
    }

    const searchTerm = query.trim().toLowerCase();
    const results = {
      posts: [],
      users: [],
      tags: [],
      total: 0
    };

    // Search posts
    if (type === 'all' || type === 'posts') {
      const posts = await searchPosts(searchTerm, limit, offset);
      results.posts = posts;
    }

    // Search users
    if (type === 'all' || type === 'users') {
      const users = await searchUsers(searchTerm, limit, offset);
      results.users = users;
    }

    // Search tags
    if (type === 'all' || type === 'tags') {
      const tags = await searchTags(searchTerm, limit, offset);
      results.tags = tags;
    }

    // Calculate total results
    results.total = results.posts.length + results.users.length + results.tags.length;

    return NextResponse.json({ 
      success: true, 
      query: searchTerm,
      results,
      pagination: {
        limit,
        offset,
        hasMore: results.total >= limit
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Search failed' 
    }, { status: 500 });
  }
}

// Search posts by content and tags
async function searchPosts(searchTerm, limit, offset) {
  try {
    const params = {
      TableName: TABLE_NAMES.COMMUNITY_POSTS,
      FilterExpression: 'contains(content, :search) OR contains(#tags, :search)',
      ExpressionAttributeNames: {
        '#tags': 'tags'
      },
      ExpressionAttributeValues: {
        ':search': searchTerm
      },
      Limit: limit,
      ScanIndexForward: false // Sort by creation time descending
    };

    const result = await docClient.send(new ScanCommand(params));
    
    // Sort by relevance (exact matches first, then partial matches)
    const posts = (result.Items || []).map(post => ({
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
      updatedAt: post.updatedAt,
      relevance: calculateRelevance(post, searchTerm)
    }));

    return posts.sort((a, b) => b.relevance - a.relevance);
  } catch (error) {
    console.error('Error searching posts:', error);
    return [];
  }
}

// Search users by name and email
async function searchUsers(searchTerm, limit, offset) {
  try {
    const params = {
      TableName: TABLE_NAMES.USERS,
      FilterExpression: 'contains(#name, :search) OR contains(email, :search)',
      ExpressionAttributeNames: {
        '#name': 'name'
      },
      ExpressionAttributeValues: {
        ':search': searchTerm
      },
      Limit: limit
    };

    const result = await docClient.send(new ScanCommand(params));
    
    const users = (result.Items || []).map(user => ({
      id: user.userId,
      type: 'user',
      name: user.name || user.email,
      email: user.email,
      profilePicture: user.profilePicture || '',
      role: user.role || 'member',
      isActive: user.isActive || false,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      relevance: calculateUserRelevance(user, searchTerm)
    }));

    return users.sort((a, b) => b.relevance - a.relevance);
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
}

// Search tags across all posts
async function searchTags(searchTerm, limit, offset) {
  try {
    const params = {
      TableName: TABLE_NAMES.COMMUNITY_POSTS,
      ProjectionExpression: 'tags',
      Limit: 100 // Get more posts to extract tags
    };

    const result = await docClient.send(new ScanCommand(params));
    
    // Extract and count tags
    const tagCounts = new Map();
    (result.Items || []).forEach(post => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => {
          if (tag.toLowerCase().includes(searchTerm.toLowerCase())) {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
          }
        });
      }
    });

    // Convert to array and sort by count
    const tags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({
        id: tag,
        type: 'tag',
        name: tag,
        count,
        relevance: calculateTagRelevance(tag, searchTerm)
      }))
      .sort((a, b) => b.relevance - a.relevance)
      .slice(offset, offset + limit);

    return tags;
  } catch (error) {
    console.error('Error searching tags:', error);
    return [];
  }
}

// Calculate relevance score for posts
function calculateRelevance(post, searchTerm) {
  let score = 0;
  const content = post.content.toLowerCase();
  const tags = (post.tags || []).map(tag => tag.toLowerCase());
  
  // Exact match in content
  if (content === searchTerm) score += 100;
  // Starts with search term
  else if (content.startsWith(searchTerm)) score += 80;
  // Contains search term
  else if (content.includes(searchTerm)) score += 60;
  
  // Tag matches
  tags.forEach(tag => {
    if (tag === searchTerm) score += 50;
    else if (tag.startsWith(searchTerm)) score += 30;
    else if (tag.includes(searchTerm)) score += 20;
  });
  
  // Boost for pinned posts
  if (post.isPinned) score += 10;
  
  // Boost for recent posts
  const daysSinceCreation = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceCreation < 7) score += 5;
  else if (daysSinceCreation < 30) score += 2;
  
  return score;
}

// Calculate relevance score for users
function calculateUserRelevance(user, searchTerm) {
  let score = 0;
  const name = (user.name || '').toLowerCase();
  const email = (user.email || '').toLowerCase();
  
  // Exact match in name
  if (name === searchTerm) score += 100;
  // Starts with search term
  else if (name.startsWith(searchTerm)) score += 80;
  // Contains search term in name
  else if (name.includes(searchTerm)) score += 60;
  
  // Email matches
  if (email === searchTerm) score += 90;
  else if (email.startsWith(searchTerm)) score += 70;
  else if (email.includes(searchTerm)) score += 50;
  
  // Boost for active users
  if (user.isActive) score += 10;
  
  return score;
}

// Calculate relevance score for tags
function calculateTagRelevance(tag, searchTerm) {
  const tagLower = tag.toLowerCase();
  const searchLower = searchTerm.toLowerCase();
  
  if (tagLower === searchLower) return 100;
  if (tagLower.startsWith(searchLower)) return 80;
  if (tagLower.includes(searchLower)) return 60;
  
  return 0;
}
