import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/app/lib/supabase';
import { getCurrentTimestamp } from '@/app/lib/dynamodb-schema';
import { requireAuth } from '@/app/lib/auth';

const supabase = getSupabaseClient();

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

    const { data: event, error } = await supabase
      .from('events')
      .select('*')
      .eq('event_id', eventId)
      .single();

    if (error || !event) {
      return NextResponse.json({ 
        success: false, 
        error: 'Event not found' 
      }, { status: 404 });
    }

    // Get RSVP details
    const rsvpCount = await getEventRSVPCount(eventId);
    const eventWithCounts = {
      ...event,
      currentAttendees: rsvpCount.attending,
      waitlistCount: rsvpCount.waitlist,
      rsvpCounts: rsvpCount
    };

    return NextResponse.json({ 
      success: true, 
      event: eventWithCounts 
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
    const { data: currentEvent, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .eq('event_id', eventId)
      .single();

    if (fetchError || !currentEvent) {
      return NextResponse.json({ 
        success: false, 
        error: 'Event not found' 
      }, { status: 404 });
    }

    // Check if user is organizer or admin/moderator
    const isOrganizer = currentEvent.organizer_id === auth.userId;
    const isModerator = ['admin', 'moderator'].includes(auth.role || 'member');

    if (!isOrganizer && !isModerator) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authorized to update this event' 
      }, { status: 403 });
    }

    const now = getCurrentTimestamp();
    const updateData = {
      updated_at: now
    };

    // Build update data dynamically
    const allowedFields = [
      'title', 'description', 'start_time', 'end_time', 'location', 
      'category', 'type', 'max_attendees', 'price', 'currency', 
      'tags', 'requirements', 'resources', 'status', 'is_public', 
      'allow_waitlist', 'registration_deadline', 'reminder_settings'
    ];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    // Update event_date if start_time is being updated
    if (body.start_time) {
      updateData.event_date = body.start_time.split('T')[0];
    }

    const { data: updatedEvent, error: updateError } = await supabase
      .from('events')
      .update(updateData)
      .eq('event_id', eventId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ 
      success: true, 
      event: updatedEvent 
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
    const { data: currentEvent, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .eq('event_id', eventId)
      .single();

    if (fetchError || !currentEvent) {
      return NextResponse.json({ 
        success: false, 
        error: 'Event not found' 
      }, { status: 404 });
    }

    // Check if user is organizer or admin
    const isOrganizer = currentEvent.organizer_id === auth.userId;
    const isAdmin = auth.role === 'admin';

    if (!isOrganizer && !isAdmin) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authorized to delete this event' 
      }, { status: 403 });
    }

    // Delete all RSVPs for this event first (cascade delete)
    await supabase
      .from('event_rsvps')
      .delete()
      .eq('event_id', eventId);

    // Delete the event
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('event_id', eventId);

    if (deleteError) {
      throw deleteError;
    }

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
    const { data: rsvps, error } = await supabase
      .from('event_rsvps')
      .select('status')
      .eq('event_id', eventId);

    if (error) {
      throw error;
    }

    const counts = {
      attending: 0,
      notAttending: 0,
      maybe: 0,
      waitlist: 0
    };

    (rsvps || []).forEach(rsvp => {
      const status = rsvp.status;
      if (counts.hasOwnProperty(status)) {
        counts[status] = (counts[status] || 0) + 1;
      }
    });

    return counts;
  } catch (error) {
    console.error('Error getting RSVP count:', error);
    return { attending: 0, notAttending: 0, maybe: 0, waitlist: 0 };
  }
}
