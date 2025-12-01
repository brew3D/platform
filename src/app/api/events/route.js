import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/app/lib/supabase';
import { generateId, getCurrentTimestamp } from '@/app/lib/dynamodb-schema';
import { requireAuth } from '@/app/lib/auth';

const supabase = getSupabaseClient();

// GET /api/events - Get all events with filtering and pagination
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const status = searchParams.get('status') || 'published';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const organizerId = searchParams.get('organizerId');
    const isPublic = searchParams.get('isPublic') !== 'false';

    let query = supabase
      .from('events')
      .select('*')
      .eq('status', status)
      .limit(limit)
      .offset(offset)
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }
    if (type) {
      query = query.eq('type', type);
    }
    if (organizerId) {
      query = query.eq('organizer_id', organizerId);
    }
    if (isPublic) {
      query = query.eq('is_public', true);
    }
    if (startDate) {
      query = query.gte('event_date', startDate);
    }
    if (endDate) {
      query = query.lte('event_date', endDate);
    }

    const { data: events, error } = await query;
    
    if (error) {
      throw error;
    }

    // Get RSVP counts for each event
    const eventsWithRSVPs = await Promise.all(
      (events || []).map(async (event) => {
        const rsvpCount = await getEventRSVPCount(event.event_id);
        return {
          ...event,
          currentAttendees: rsvpCount.attending,
          waitlistCount: rsvpCount.waitlist
        };
      })
    );

    return NextResponse.json({ 
      success: true,
      events: eventsWithRSVPs,
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
      event_id: eventId,
      title: title.trim(),
      description: description.trim(),
      organizer_id: auth.userId,
      event_date: startTime.split('T')[0], // YYYY-MM-DD format
      start_time: startTime,
      end_time: endTime,
      location: location || {},
      category,
      type,
      max_attendees: parseInt(maxAttendees, 10),
      current_attendees: 0,
      price: parseInt(price, 10),
      currency,
      tags: Array.isArray(tags) ? tags : [],
      requirements: Array.isArray(requirements) ? requirements : [],
      resources: Array.isArray(resources) ? resources : [],
      status: 'published',
      is_public: Boolean(isPublic),
      allow_waitlist: Boolean(allowWaitlist),
      registration_deadline: registrationDeadline || endTime,
      reminder_settings: reminderSettings || {},
      created_at: now_timestamp,
      updated_at: now_timestamp
    };

    const { data: newEvent, error: insertError } = await supabase
      .from('events')
      .insert(event)
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({ 
      success: true, 
      event: newEvent 
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
