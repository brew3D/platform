import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { TABLE_NAMES, getCurrentTimestamp } from '../../../../../lib/dynamodb-schema';
import { requireAuth } from '../../../../../lib/auth';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

// GET /api/events/[eventId]/rsvp - Get RSVP status for current user
export async function GET(request, { params }) {
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

    // Check if event exists
    const event = await docClient.send(new GetCommand({ 
      TableName: TABLE_NAMES.EVENTS, 
      Key: { eventId } 
    }));

    if (!event.Item) {
      return NextResponse.json({ 
        success: false, 
        error: 'Event not found' 
      }, { status: 404 });
    }

    // Get user's RSVP
    const rsvp = await docClient.send(new GetCommand({
      TableName: TABLE_NAMES.EVENT_RSVPS,
      Key: { eventId, userId: auth.userId }
    }));

    return NextResponse.json({ 
      success: true, 
      rsvp: rsvp.Item || null,
      event: event.Item
    });
  } catch (error) {
    console.error('Get RSVP error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch RSVP' 
    }, { status: 500 });
  }
}

// POST /api/events/[eventId]/rsvp - Create or update RSVP
export async function POST(request, { params }) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    const { eventId } = params;
    const body = await request.json();
    const { status, plusOnes = 0, dietaryRestrictions = '', notes = '' } = body;

    if (!eventId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Event ID is required' 
      }, { status: 400 });
    }

    if (!status || !['attending', 'not-attending', 'maybe', 'waitlist'].includes(status)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Valid RSVP status is required' 
      }, { status: 400 });
    }

    // Get event details
    const event = await docClient.send(new GetCommand({ 
      TableName: TABLE_NAMES.EVENTS, 
      Key: { eventId } 
    }));

    if (!event.Item) {
      return NextResponse.json({ 
        success: false, 
        error: 'Event not found' 
      }, { status: 404 });
    }

    // Check if event is still accepting RSVPs
    const now = new Date();
    const registrationDeadline = new Date(event.Item.registrationDeadline);
    
    if (now > registrationDeadline) {
      return NextResponse.json({ 
        success: false, 
        error: 'Registration deadline has passed' 
      }, { status: 400 });
    }

    // Check if event is full and handle waitlist
    const currentRSVPs = await getEventRSVPCount(eventId);
    const isEventFull = currentRSVPs.attending >= event.Item.maxAttendees;
    
    let finalStatus = status;
    if (status === 'attending' && isEventFull && event.Item.allowWaitlist) {
      finalStatus = 'waitlist';
    } else if (status === 'attending' && isEventFull && !event.Item.allowWaitlist) {
      return NextResponse.json({ 
        success: false, 
        error: 'Event is full and waitlist is not available' 
      }, { status: 400 });
    }

    const now_timestamp = getCurrentTimestamp();
    const rsvpData = {
      eventId,
      userId: auth.userId,
      status: finalStatus,
      rsvpDate: now_timestamp,
      plusOnes: parseInt(plusOnes, 10) || 0,
      dietaryRestrictions: dietaryRestrictions.trim(),
      notes: notes.trim(),
      createdAt: now_timestamp,
      updatedAt: now_timestamp
    };

    // Check if RSVP already exists
    const existingRSVP = await docClient.send(new GetCommand({
      TableName: TABLE_NAMES.EVENT_RSVPS,
      Key: { eventId, userId: auth.userId }
    }));

    if (existingRSVP.Item) {
      // Update existing RSVP
      await docClient.send(new UpdateCommand({
        TableName: TABLE_NAMES.EVENT_RSVPS,
        Key: { eventId, userId: auth.userId },
        UpdateExpression: 'SET #status = :status, #rsvpDate = :rsvpDate, plusOnes = :plusOnes, dietaryRestrictions = :dietaryRestrictions, notes = :notes, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#status': 'status',
          '#rsvpDate': 'rsvpDate'
        },
        ExpressionAttributeValues: {
          ':status': finalStatus,
          ':rsvpDate': now_timestamp,
          ':plusOnes': rsvpData.plusOnes,
          ':dietaryRestrictions': rsvpData.dietaryRestrictions,
          ':notes': rsvpData.notes,
          ':updatedAt': now_timestamp
        }
      }));
    } else {
      // Create new RSVP
      await docClient.send(new PutCommand({
        TableName: TABLE_NAMES.EVENT_RSVPS,
        Item: rsvpData
      }));
    }

    // Update event attendee count
    await updateEventAttendeeCount(eventId);

    return NextResponse.json({ 
      success: true, 
      rsvp: rsvpData,
      message: finalStatus === 'waitlist' ? 'Added to waitlist' : 'RSVP updated successfully'
    });
  } catch (error) {
    console.error('RSVP error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update RSVP' 
    }, { status: 500 });
  }
}

// DELETE /api/events/[eventId]/rsvp - Remove RSVP
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

    // Check if RSVP exists
    const existingRSVP = await docClient.send(new GetCommand({
      TableName: TABLE_NAMES.EVENT_RSVPS,
      Key: { eventId, userId: auth.userId }
    }));

    if (!existingRSVP.Item) {
      return NextResponse.json({ 
        success: false, 
        error: 'RSVP not found' 
      }, { status: 404 });
    }

    // Delete RSVP
    await docClient.send(new DeleteCommand({
      TableName: TABLE_NAMES.EVENT_RSVPS,
      Key: { eventId, userId: auth.userId }
    }));

    // Update event attendee count
    await updateEventAttendeeCount(eventId);

    return NextResponse.json({ 
      success: true, 
      message: 'RSVP removed successfully' 
    });
  } catch (error) {
    console.error('Delete RSVP error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to remove RSVP' 
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

// Helper function to update event attendee count
async function updateEventAttendeeCount(eventId) {
  try {
    const rsvpCounts = await getEventRSVPCount(eventId);
    
    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAMES.EVENTS,
      Key: { eventId },
      UpdateExpression: 'SET currentAttendees = :currentAttendees',
      ExpressionAttributeValues: {
        ':currentAttendees': rsvpCounts.attending
      }
    }));
  } catch (error) {
    console.error('Error updating attendee count:', error);
  }
}
