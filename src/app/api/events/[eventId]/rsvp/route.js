import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/app/lib/supabase';
import { getCurrentTimestamp } from '@/app/lib/dynamodb-schema';
import { requireAuth } from '@/app/lib/auth';

const supabase = getSupabaseClient();

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
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('event_id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ 
        success: false, 
        error: 'Event not found' 
      }, { status: 404 });
    }

    // Get user's RSVP
    const { data: rsvp } = await supabase
      .from('event_rsvps')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', auth.userId)
      .single();

    return NextResponse.json({ 
      success: true, 
      rsvp: rsvp || null,
      event: event
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
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('event_id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ 
        success: false, 
        error: 'Event not found' 
      }, { status: 404 });
    }

    // Check if event is still accepting RSVPs
    const now = new Date();
    const registrationDeadline = event.registration_deadline ? new Date(event.registration_deadline) : null;
    
    if (registrationDeadline && now > registrationDeadline) {
      return NextResponse.json({ 
        success: false, 
        error: 'Registration deadline has passed' 
      }, { status: 400 });
    }

    // Check if event is full and handle waitlist
    const { data: rsvps } = await supabase
      .from('event_rsvps')
      .select('status')
      .eq('event_id', eventId)
      .eq('status', 'attending');
    
    const attendingCount = rsvps?.length || 0;
    const isEventFull = event.max_attendees && attendingCount >= event.max_attendees;
    
    let finalStatus = status;
    if (status === 'attending' && isEventFull && event.allow_waitlist) {
      finalStatus = 'waitlist';
    } else if (status === 'attending' && isEventFull && !event.allow_waitlist) {
      return NextResponse.json({ 
        success: false, 
        error: 'Event is full and waitlist is not available' 
      }, { status: 400 });
    }

    const now_timestamp = getCurrentTimestamp();
    const rsvpData = {
      event_id: eventId,
      user_id: auth.userId,
      status: finalStatus,
      rsvp_date: now_timestamp,
      plus_ones: parseInt(plusOnes, 10) || 0,
      dietary_restrictions: dietaryRestrictions.trim(),
      notes: notes.trim(),
      created_at: now_timestamp,
      updated_at: now_timestamp
    };

    // Check if RSVP already exists
    const { data: existingRSVP } = await supabase
      .from('event_rsvps')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', auth.userId)
      .single();

    if (existingRSVP) {
      // Update existing RSVP
      const { error: updateError } = await supabase
        .from('event_rsvps')
        .update({
          status: finalStatus,
          rsvp_date: now_timestamp,
          plus_ones: rsvpData.plus_ones,
          dietary_restrictions: rsvpData.dietary_restrictions,
          notes: rsvpData.notes,
          updated_at: now_timestamp
        })
        .eq('event_id', eventId)
        .eq('user_id', auth.userId);

      if (updateError) throw updateError;
    } else {
      // Create new RSVP
      const { error: insertError } = await supabase
        .from('event_rsvps')
        .insert(rsvpData);

      if (insertError) throw insertError;
    }

    // Event attendee count is updated automatically by trigger

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
    const { data: existingRSVP, error: fetchError } = await supabase
      .from('event_rsvps')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', auth.userId)
      .single();

    if (fetchError || !existingRSVP) {
      return NextResponse.json({ 
        success: false, 
        error: 'RSVP not found' 
      }, { status: 404 });
    }

    // Delete RSVP
    const { error: deleteError } = await supabase
      .from('event_rsvps')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', auth.userId);

    if (deleteError) throw deleteError;

    // Event attendee count is updated automatically by trigger

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
    const { data: rsvps } = await supabase
      .from('event_rsvps')
      .select('status')
      .eq('event_id', eventId);

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

// Helper function to update event attendee count (now handled by trigger)
async function updateEventAttendeeCount(eventId) {
  // This is now handled automatically by the database trigger
  // No need to manually update
  return;
}
