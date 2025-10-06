import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { TABLE_NAMES, generateId, getCurrentTimestamp } from '../../../lib/dynamodb-schema';
import { requireAuth } from '../../../lib/auth';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

// GET /api/events - Get all events with filtering and pagination
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const lastKey = searchParams.get('lastKey');
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const status = searchParams.get('status') || 'published';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const organizerId = searchParams.get('organizerId');
    const isPublic = searchParams.get('isPublic') !== 'false';

    const params = {
      TableName: TABLE_NAMES.EVENTS,
      Limit: limit,
      FilterExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': status
      }
    };

    // Add pagination
    if (lastKey) {
      try {
        params.ExclusiveStartKey = JSON.parse(Buffer.from(lastKey, 'base64').toString('utf8'));
      } catch (e) {
        console.error('Invalid lastKey:', e);
      }
    }

    // Add filters
    const filters = [];
    if (category) {
      filters.push('category = :category');
      params.ExpressionAttributeValues[':category'] = category;
    }
    if (type) {
      filters.push('#type = :type');
      params.ExpressionAttributeNames['#type'] = 'type';
      params.ExpressionAttributeValues[':type'] = type;
    }
    if (organizerId) {
      filters.push('organizerId = :organizerId');
      params.ExpressionAttributeValues[':organizerId'] = organizerId;
    }
    if (isPublic) {
      filters.push('isPublic = :isPublic');
      params.ExpressionAttributeValues[':isPublic'] = true;
    }
    if (startDate) {
      filters.push('eventDate >= :startDate');
      params.ExpressionAttributeValues[':startDate'] = startDate;
    }
    if (endDate) {
      filters.push('eventDate <= :endDate');
      params.ExpressionAttributeValues[':endDate'] = endDate;
    }

    if (filters.length > 0) {
      params.FilterExpression += ' AND ' + filters.join(' AND ');
    }

    const result = await docClient.send(new ScanCommand(params));
    
    // Get RSVP counts for each event
    const eventsWithRSVPs = await Promise.all(
      (result.Items || []).map(async (event) => {
        const rsvpCount = await getEventRSVPCount(event.eventId);
        return {
          ...event,
          currentAttendees: rsvpCount.attending,
          waitlistCount: rsvpCount.waitlist
        };
      })
    );

    const encodedLastKey = result.LastEvaluatedKey 
      ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64') 
      : null;

    return NextResponse.json({ 
      success: true,
      events: eventsWithRSVPs,
      lastKey: encodedLastKey,
      count: eventsWithRSVPs.length
    });
  } catch (error) {
    console.error('Get events error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch events' 
    }, { status: 500 });
  }
}

// POST /api/events - Create a new event
export async function POST(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    const body = await request.json();
    const {
      title,
      description,
      startTime,
      endTime,
      location,
      category = 'other',
      type = 'online',
      maxAttendees = 100,
      price = 0,
      currency = 'USD',
      tags = [],
      requirements = [],
      resources = [],
      isPublic = true,
      allowWaitlist = true,
      registrationDeadline,
      reminderSettings = {}
    } = body;

    // Validate required fields
    if (!title || !description || !startTime || !endTime) {
      return NextResponse.json({ 
        success: false, 
        error: 'Title, description, start time, and end time are required' 
      }, { status: 400 });
    }

    // Validate dates
    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (start <= now) {
      return NextResponse.json({ 
        success: false, 
        error: 'Event start time must be in the future' 
      }, { status: 400 });
    }

    if (end <= start) {
      return NextResponse.json({ 
        success: false, 
        error: 'Event end time must be after start time' 
      }, { status: 400 });
    }

    const eventId = generateId('event');
    const now_timestamp = getCurrentTimestamp();

    const event = {
      eventId,
      title: title.trim(),
      description: description.trim(),
      organizerId: auth.userId,
      eventDate: startTime.split('T')[0], // YYYY-MM-DD format for GSI
      startTime,
      endTime,
      location: {
        name: location?.name || '',
        address: location?.address || '',
        city: location?.city || '',
        state: location?.state || '',
        country: location?.country || '',
        postalCode: location?.postalCode || '',
        coordinates: location?.coordinates || {},
        onlineLink: location?.onlineLink || '',
        meetingId: location?.meetingId || '',
        meetingPassword: location?.meetingPassword || ''
      },
      category,
      type,
      maxAttendees: parseInt(maxAttendees, 10),
      currentAttendees: 0,
      price: parseInt(price, 10),
      currency,
      tags: Array.isArray(tags) ? tags : [],
      requirements: Array.isArray(requirements) ? requirements : [],
      resources: Array.isArray(resources) ? resources : [],
      status: 'published',
      isPublic: Boolean(isPublic),
      allowWaitlist: Boolean(allowWaitlist),
      registrationDeadline: registrationDeadline || endTime,
      reminderSettings: {
        emailReminders: reminderSettings.emailReminders !== false,
        pushNotifications: reminderSettings.pushNotifications !== false,
        reminderTimes: reminderSettings.reminderTimes || [24, 2, 1],
        customMessage: reminderSettings.customMessage || ''
      },
      createdAt: now_timestamp,
      updatedAt: now_timestamp
    };

    await docClient.send(new PutCommand({ 
      TableName: TABLE_NAMES.EVENTS, 
      Item: event 
    }));

    return NextResponse.json({ 
      success: true, 
      event 
    });
  } catch (error) {
    console.error('Create event error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create event' 
    }, { status: 500 });
  }
}

// Helper function to get RSVP count for an event
async function getEventRSVPCount(eventId) {
  try {
    const params = {
      TableName: TABLE_NAMES.EVENT_RSVPS,
      KeyConditionExpression: 'eventId = :eventId',
      ExpressionAttributeValues: {
        ':eventId': eventId
      }
    };

    const result = await docClient.send(new QueryCommand(params));
    const rsvps = result.Items || [];

    const counts = {
      attending: 0,
      notAttending: 0,
      maybe: 0,
      waitlist: 0
    };

    rsvps.forEach(rsvp => {
      counts[rsvp.status] = (counts[rsvp.status] || 0) + 1;
    });

    return counts;
  } catch (error) {
    console.error('Error getting RSVP count:', error);
    return { attending: 0, notAttending: 0, maybe: 0, waitlist: 0 };
  }
}
