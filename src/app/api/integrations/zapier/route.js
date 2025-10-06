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

// GET /api/integrations/zapier - Zapier webhook endpoints
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const trigger = searchParams.get('trigger');
    const apiKey = request.headers.get('x-api-key');

    // Verify API key
    if (!apiKey || !await verifyApiKey(apiKey)) {
      return NextResponse.json({ 
        error: 'Invalid API key' 
      }, { status: 401 });
    }

    switch (trigger) {
      case 'new_post':
        return await getNewPosts(request);
      
      case 'new_event':
        return await getNewEvents(request);
      
      case 'new_user':
        return await getNewUsers(request);
      
      case 'post_updated':
        return await getUpdatedPosts(request);
      
      case 'event_updated':
        return await getUpdatedEvents(request);
      
      default:
        return NextResponse.json({ 
          error: 'Unknown trigger type',
          available_triggers: [
            'new_post',
            'new_event', 
            'new_user',
            'post_updated',
            'event_updated'
          ]
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Zapier integration error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// POST /api/integrations/zapier - Zapier action endpoints
export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const apiKey = request.headers.get('x-api-key');

    // Verify API key
    if (!apiKey || !await verifyApiKey(apiKey)) {
      return NextResponse.json({ 
        error: 'Invalid API key' 
      }, { status: 401 });
    }

    const body = await request.json();

    switch (action) {
      case 'create_post':
        return await createPost(body);
      
      case 'create_event':
        return await createEvent(body);
      
      case 'send_notification':
        return await sendNotification(body);
      
      case 'update_user':
        return await updateUser(body);
      
      default:
        return NextResponse.json({ 
          error: 'Unknown action type',
          available_actions: [
            'create_post',
            'create_event',
            'send_notification',
            'update_user'
          ]
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Zapier action error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// Get new posts for Zapier trigger
async function getNewPosts(request) {
  try {
    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const params = {
      TableName: TABLE_NAMES.COMMUNITY_POSTS,
      Limit: limit
    };

    if (since) {
      params.FilterExpression = 'createdAt >= :since';
      params.ExpressionAttributeValues = { ':since': since };
    }

    const result = await docClient.send(new ScanCommand(params));
    const posts = result.Items || [];

    // Format for Zapier
    const formattedPosts = posts.map(post => ({
      id: post.postId,
      content: post.content,
      author: post.userId,
      likes: post.likes?.length || 0,
      comments: post.comments?.length || 0,
      shares: post.shares || 0,
      tags: post.tags || [],
      created_at: post.createdAt,
      updated_at: post.updatedAt,
      is_pinned: post.isPinned || false
    }));

    return NextResponse.json(formattedPosts);
  } catch (error) {
    console.error('Error getting new posts:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch posts' 
    }, { status: 500 });
  }
}

// Get new events for Zapier trigger
async function getNewEvents(request) {
  try {
    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const params = {
      TableName: TABLE_NAMES.EVENTS,
      FilterExpression: '#status = :status',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':status': 'published' },
      Limit: limit
    };

    if (since) {
      params.FilterExpression += ' AND createdAt >= :since';
      params.ExpressionAttributeValues[':since'] = since;
    }

    const result = await docClient.send(new ScanCommand(params));
    const events = result.Items || [];

    // Format for Zapier
    const formattedEvents = events.map(event => ({
      id: event.eventId,
      title: event.title,
      description: event.description,
      organizer: event.organizerId,
      start_time: event.startTime,
      end_time: event.endTime,
      location: event.location,
      category: event.category,
      type: event.type,
      max_attendees: event.maxAttendees,
      current_attendees: event.currentAttendees,
      price: event.price,
      currency: event.currency,
      tags: event.tags || [],
      created_at: event.createdAt,
      updated_at: event.updatedAt
    }));

    return NextResponse.json(formattedEvents);
  } catch (error) {
    console.error('Error getting new events:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch events' 
    }, { status: 500 });
  }
}

// Get new users for Zapier trigger
async function getNewUsers(request) {
  try {
    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const params = {
      TableName: TABLE_NAMES.USERS,
      FilterExpression: 'isActive = :active',
      ExpressionAttributeValues: { ':active': true },
      Limit: limit
    };

    if (since) {
      params.FilterExpression += ' AND createdAt >= :since';
      params.ExpressionAttributeValues[':since'] = since;
    }

    const result = await docClient.send(new ScanCommand(params));
    const users = result.Items || [];

    // Format for Zapier
    const formattedUsers = users.map(user => ({
      id: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
      profile_picture: user.profilePicture,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
      last_login: user.lastLoginAt
    }));

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error('Error getting new users:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch users' 
    }, { status: 500 });
  }
}

// Get updated posts for Zapier trigger
async function getUpdatedPosts(request) {
  try {
    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const params = {
      TableName: TABLE_NAMES.COMMUNITY_POSTS,
      FilterExpression: 'updatedAt > createdAt',
      Limit: limit
    };

    if (since) {
      params.FilterExpression += ' AND updatedAt >= :since';
      params.ExpressionAttributeValues = { ':since': since };
    }

    const result = await docClient.send(new ScanCommand(params));
    const posts = result.Items || [];

    // Format for Zapier
    const formattedPosts = posts.map(post => ({
      id: post.postId,
      content: post.content,
      author: post.userId,
      likes: post.likes?.length || 0,
      comments: post.comments?.length || 0,
      shares: post.shares || 0,
      tags: post.tags || [],
      created_at: post.createdAt,
      updated_at: post.updatedAt,
      is_pinned: post.isPinned || false
    }));

    return NextResponse.json(formattedPosts);
  } catch (error) {
    console.error('Error getting updated posts:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch updated posts' 
    }, { status: 500 });
  }
}

// Get updated events for Zapier trigger
async function getUpdatedEvents(request) {
  try {
    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const params = {
      TableName: TABLE_NAMES.EVENTS,
      FilterExpression: '#status = :status AND updatedAt > createdAt',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':status': 'published' },
      Limit: limit
    };

    if (since) {
      params.FilterExpression += ' AND updatedAt >= :since';
      params.ExpressionAttributeValues[':since'] = since;
    }

    const result = await docClient.send(new ScanCommand(params));
    const events = result.Items || [];

    // Format for Zapier
    const formattedEvents = events.map(event => ({
      id: event.eventId,
      title: event.title,
      description: event.description,
      organizer: event.organizerId,
      start_time: event.startTime,
      end_time: event.endTime,
      location: event.location,
      category: event.category,
      type: event.type,
      max_attendees: event.maxAttendees,
      current_attendees: event.currentAttendees,
      price: event.price,
      currency: event.currency,
      tags: event.tags || [],
      created_at: event.createdAt,
      updated_at: event.updatedAt
    }));

    return NextResponse.json(formattedEvents);
  } catch (error) {
    console.error('Error getting updated events:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch updated events' 
    }, { status: 500 });
  }
}

// Create post action
async function createPost(body) {
  try {
    const { content, author, tags = [] } = body;

    if (!content || !author) {
      return NextResponse.json({ 
        error: 'Content and author are required' 
      }, { status: 400 });
    }

    // This would typically call your existing post creation API
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/community/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, tags })
    });

    const result = await response.json();

    if (result.success) {
      return NextResponse.json({
        success: true,
        post: result.post
      });
    } else {
      return NextResponse.json({ 
        error: result.message || 'Failed to create post' 
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ 
      error: 'Failed to create post' 
    }, { status: 500 });
  }
}

// Create event action
async function createEvent(body) {
  try {
    const { title, description, start_time, end_time, organizer } = body;

    if (!title || !description || !start_time || !end_time || !organizer) {
      return NextResponse.json({ 
        error: 'Title, description, start_time, end_time, and organizer are required' 
      }, { status: 400 });
    }

    // This would typically call your existing event creation API
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        startTime: start_time,
        endTime: end_time,
        organizerId: organizer
      })
    });

    const result = await response.json();

    if (result.success) {
      return NextResponse.json({
        success: true,
        event: result.event
      });
    } else {
      return NextResponse.json({ 
        error: result.message || 'Failed to create event' 
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ 
      error: 'Failed to create event' 
    }, { status: 500 });
  }
}

// Send notification action
async function sendNotification(body) {
  try {
    const { message, channel, type = 'info' } = body;

    if (!message) {
      return NextResponse.json({ 
        error: 'Message is required' 
      }, { status: 400 });
    }

    // This would integrate with your notification system
    // For now, just return success
    return NextResponse.json({
      success: true,
      message: 'Notification sent',
      notification: {
        message,
        channel,
        type,
        sent_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json({ 
      error: 'Failed to send notification' 
    }, { status: 500 });
  }
}

// Update user action
async function updateUser(body) {
  try {
    const { user_id, updates } = body;

    if (!user_id || !updates) {
      return NextResponse.json({ 
        error: 'User ID and updates are required' 
      }, { status: 400 });
    }

    // This would typically call your existing user update API
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/profile/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });

    const result = await response.json();

    if (result.success) {
      return NextResponse.json({
        success: true,
        user: result.user
      });
    } else {
      return NextResponse.json({ 
        error: result.message || 'Failed to update user' 
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ 
      error: 'Failed to update user' 
    }, { status: 500 });
  }
}

// Verify API key
async function verifyApiKey(apiKey) {
  try {
    // In a real implementation, you would check against a database
    const validApiKeys = process.env.API_KEYS ? JSON.parse(process.env.API_KEYS) : {};
    return !!validApiKeys[apiKey];
  } catch (error) {
    console.error('Error verifying API key:', error);
    return false;
  }
}
