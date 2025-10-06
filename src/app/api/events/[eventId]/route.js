import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { TABLE_NAMES, getCurrentTimestamp } from '../../../../lib/dynamodb-schema';
import { requireAuth } from '../../../../lib/auth';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

// GET /api/events/[eventId] - Get a specific event
export async function GET(request, { params }) {
  try {
    const { eventId } = params;
    
    if (!eventId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Event ID is required' 
      }, { status: 400 });
    }

    const result = await docClient.send(new GetCommand({ 
      TableName: TABLE_NAMES.EVENTS, 
      Key: { eventId } 
    }));

    if (!result.Item) {
      return NextResponse.json({ 
        success: false, 
        error: 'Event not found' 
      }, { status: 404 });
    }

    // Get RSVP details
    const rsvpCount = await getEventRSVPCount(eventId);
    const event = {
      ...result.Item,
      currentAttendees: rsvpCount.attending,
      waitlistCount: rsvpCount.waitlist,
      rsvpCounts: rsvpCount
    };

    return NextResponse.json({ 
      success: true, 
      event 
    });
  } catch (error) {
    console.error('Get event error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch event' 
    }, { status: 500 });
  }
}

// PUT /api/events/[eventId] - Update an event
export async function PUT(request, { params }) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    const { eventId } = params;
    const body = await request.json();

    if (!eventId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Event ID is required' 
      }, { status: 400 });
    }

    // Get current event to check permissions
    const currentEvent = await docClient.send(new GetCommand({ 
      TableName: TABLE_NAMES.EVENTS, 
      Key: { eventId } 
    }));

    if (!currentEvent.Item) {
      return NextResponse.json({ 
        success: false, 
        error: 'Event not found' 
      }, { status: 404 });
    }

    // Check if user is organizer or admin/moderator
    const isOrganizer = currentEvent.Item.organizerId === auth.userId;
    const isModerator = ['admin', 'moderator'].includes(auth.role || 'member');

    if (!isOrganizer && !isModerator) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authorized to update this event' 
      }, { status: 403 });
    }

    const now = getCurrentTimestamp();
    const updates = [];
    const names = {};
    const values = { ':updatedAt': now };

    // Build update expression dynamically
    const allowedFields = [
      'title', 'description', 'startTime', 'endTime', 'location', 
      'category', 'type', 'maxAttendees', 'price', 'currency', 
      'tags', 'requirements', 'resources', 'status', 'isPublic', 
      'allowWaitlist', 'registrationDeadline', 'reminderSettings'
    ];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updates.push(`#${field} = :${field}`);
        names[`#${field}`] = field;
        values[`:${field}`] = body[field];
      }
    });

    // Update eventDate if startTime is being updated
    if (body.startTime) {
      updates.push('#eventDate = :eventDate');
      names['#eventDate'] = 'eventDate';
      values[':eventDate'] = body.startTime.split('T')[0];
    }

    updates.push('#updatedAt = :updatedAt');
    names['#updatedAt'] = 'updatedAt';

    if (updates.length === 1) { // Only updatedAt
      return NextResponse.json({ 
        success: false, 
        error: 'No valid fields to update' 
      }, { status: 400 });
    }

    const result = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAMES.EVENTS,
      Key: { eventId },
      UpdateExpression: 'SET ' + updates.join(', '),
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: 'ALL_NEW'
    }));

    return NextResponse.json({ 
      success: true, 
      event: result.Attributes 
    });
  } catch (error) {
    console.error('Update event error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update event' 
    }, { status: 500 });
  }
}

// DELETE /api/events/[eventId] - Delete an event
export async function DELETE(request, { params }) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    const { eventId } = params;

    if (!eventId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Event ID is required' 
      }, { status: 400 });
    }

    // Get current event to check permissions
    const currentEvent = await docClient.send(new GetCommand({ 
      TableName: TABLE_NAMES.EVENTS, 
      Key: { eventId } 
    }));

    if (!currentEvent.Item) {
      return NextResponse.json({ 
        success: false, 
        error: 'Event not found' 
      }, { status: 404 });
    }

    // Check if user is organizer or admin
    const isOrganizer = currentEvent.Item.organizerId === auth.userId;
    const isAdmin = auth.role === 'admin';

    if (!isOrganizer && !isAdmin) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authorized to delete this event' 
      }, { status: 403 });
    }

    // Delete the event
    await docClient.send(new DeleteCommand({
      TableName: TABLE_NAMES.EVENTS,
      Key: { eventId }
    }));

    // TODO: Also delete all RSVPs for this event
    // This would require a scan and batch delete operation

    return NextResponse.json({ 
      success: true, 
      message: 'Event deleted successfully' 
    });
  } catch (error) {
    console.error('Delete event error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete event' 
    }, { status: 500 });
  }
}

// Helper function to get RSVP count for an event
async function getEventRSVPCount(eventId) {
  try {
    const { QueryCommand } = await import('@aws-sdk/lib-dynamodb');
    
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
