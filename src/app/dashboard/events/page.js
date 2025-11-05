'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import styles from './events.module.css';

export default function EventsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('calendar'); // 'calendar', 'list', 'my-events'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filters, setFilters] = useState({
    category: 'all',
    type: 'all',
    status: 'published'
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [rsvpStatus, setRsvpStatus] = useState({});

  // Load events on mount and when filters change
  useEffect(() => {
    loadEvents();
  }, [filters]);

  // Load user's RSVP statuses
  useEffect(() => {
    if (isAuthenticated) {
      loadUserRSVPs();
    }
  }, [isAuthenticated, events]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.category !== 'all') params.append('category', filters.category);
      if (filters.type !== 'all') params.append('type', filters.type);
      if (filters.status !== 'all') params.append('status', filters.status);

      const response = await fetch(`/api/events?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserRSVPs = async () => {
    const rsvpPromises = events.map(event => 
      fetch(`/api/events/${event.eventId}/rsvp`)
        .then(res => res.json())
        .then(data => ({ eventId: event.eventId, rsvp: data.rsvp }))
        .catch(() => ({ eventId: event.eventId, rsvp: null }))
    );

    const rsvps = await Promise.all(rsvpPromises);
    const rsvpMap = {};
    rsvps.forEach(({ eventId, rsvp }) => {
      rsvpMap[eventId] = rsvp?.status || null;
    });
    setRsvpStatus(rsvpMap);
  };

  const handleRSVP = async (eventId, status) => {
    try {
      const response = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      const data = await response.json();
      if (data.success) {
        setRsvpStatus(prev => ({ ...prev, [eventId]: status }));
        // Reload events to update attendee counts
        loadEvents();
      }
    } catch (error) {
      console.error('Error updating RSVP:', error);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const getEventsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => event.eventDate === dateStr);
  };

  const getUpcomingEvents = () => {
    const now = new Date();
    return events
      .filter(event => new Date(event.startTime) > now)
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
      .slice(0, 5);
  };

  const getMyEvents = () => {
    return events.filter(event => event.organizerId === user?.userId);
  };

  if (authLoading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div className={styles.error}>Please sign in to view events</div>;
  }

  return (
    <div className={styles.eventsPage}>
      <div className={styles.header}>
        <h1 className={styles.title}>Events & Calendar</h1>
        <p className={styles.subtitle}>Discover and join community events</p>
        <button 
          className={styles.createButton}
          onClick={() => setShowCreateModal(true)}
        >
          Create Event
        </button>
      </div>

      {/* View Toggle */}
      <div className={styles.viewToggle}>
        {[
          { id: 'calendar', label: 'Calendar' },
          { id: 'list', label: 'List View' },
          { id: 'my-events', label: 'My Events' }
        ].map(tab => (
          <button
            key={tab.id}
            className={`${styles.tab} ${view === tab.id ? styles.active : ''}`}
            onClick={() => setView(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <select
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">All Categories</option>
          <option value="workshop">Workshop</option>
          <option value="meetup">Meetup</option>
          <option value="conference">Conference</option>
          <option value="social">Social</option>
          <option value="other">Other</option>
        </select>

        <select
          value={filters.type}
          onChange={(e) => handleFilterChange('type', e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">All Types</option>
          <option value="online">Online</option>
          <option value="in-person">In-Person</option>
          <option value="hybrid">Hybrid</option>
        </select>

        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className={styles.filterSelect}
        >
          <option value="published">Published</option>
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {loading && (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            Loading events...
          </div>
        )}

        {!loading && (
          <>
            {view === 'calendar' && (
              <CalendarView 
                events={events}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                onEventSelect={setSelectedEvent}
                rsvpStatus={rsvpStatus}
                onRSVP={handleRSVP}
              />
            )}

            {view === 'list' && (
              <ListView 
                events={events}
                onEventSelect={setSelectedEvent}
                rsvpStatus={rsvpStatus}
                onRSVP={handleRSVP}
              />
            )}

            {view === 'my-events' && (
              <MyEventsView 
                events={getMyEvents()}
                onEventSelect={setSelectedEvent}
                onEdit={loadEvents}
              />
            )}
          </>
        )}
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          rsvpStatus={rsvpStatus[selectedEvent.eventId]}
          onRSVP={handleRSVP}
          onClose={() => setSelectedEvent(null)}
        />
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <CreateEventModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadEvents();
          }}
        />
      )}
    </div>
  );
}

// Calendar View Component
function CalendarView({ events, selectedDate, onDateSelect, onEventSelect, rsvpStatus, onRSVP }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getEventsForDate = (date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => event.eventDate === dateStr);
  };

  const days = getDaysInMonth(currentMonth);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className={styles.calendarView}>
      <div className={styles.calendarHeader}>
        <button 
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          className={styles.navButton}
        >
          ←
        </button>
        <h2 className={styles.monthTitle}>
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>
        <button 
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          className={styles.navButton}
        >
          →
        </button>
      </div>

      <div className={styles.calendarGrid}>
        <div className={styles.dayHeader}>Sun</div>
        <div className={styles.dayHeader}>Mon</div>
        <div className={styles.dayHeader}>Tue</div>
        <div className={styles.dayHeader}>Wed</div>
        <div className={styles.dayHeader}>Thu</div>
        <div className={styles.dayHeader}>Fri</div>
        <div className={styles.dayHeader}>Sat</div>

        {days.map((day, index) => {
          const dayEvents = getEventsForDate(day);
          const isSelected = day && day.toDateString() === selectedDate.toDateString();
          const isToday = day && day.toDateString() === new Date().toDateString();

          return (
            <div
              key={index}
              className={`${styles.dayCell} ${isSelected ? styles.selected : ''} ${isToday ? styles.today : ''}`}
              onClick={() => day && onDateSelect(day)}
            >
              {day && (
                <>
                  <div className={styles.dayNumber}>{day.getDate()}</div>
                  <div className={styles.dayEvents}>
                    {dayEvents.slice(0, 2).map(event => (
                      <div
                        key={event.eventId}
                        className={styles.eventDot}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventSelect(event);
                        }}
                        title={event.title}
                      />
                    ))}
                    {dayEvents.length > 2 && (
                      <div className={styles.moreEvents}>+{dayEvents.length - 2}</div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// List View Component
function ListView({ events, onEventSelect, rsvpStatus, onRSVP }) {
  return (
    <div className={styles.listView}>
      {events.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>No events found</h3>
          <p>Try adjusting your filters or check back later for new events.</p>
        </div>
      ) : (
        <div className={styles.eventsList}>
          {events.map(event => (
            <EventCard
              key={event.eventId}
              event={event}
              rsvpStatus={rsvpStatus[event.eventId]}
              onRSVP={onRSVP}
              onClick={() => onEventSelect(event)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// My Events View Component
function MyEventsView({ events, onEventSelect, onEdit }) {
  return (
    <div className={styles.myEventsView}>
      <h3>My Events ({events.length})</h3>
      {events.length === 0 ? (
        <div className={styles.emptyState}>
          <h4>You haven&apos;t created any events yet</h4>
          <p>Create your first event to get started!</p>
        </div>
      ) : (
        <div className={styles.eventsList}>
          {events.map(event => (
            <EventCard
              key={event.eventId}
              event={event}
              isOwner={true}
              onClick={() => onEventSelect(event)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Event Card Component
function EventCard({ event, rsvpStatus, onRSVP, isOwner = false, onClick }) {
  const startDate = new Date(event.startTime);
  const endDate = new Date(event.endTime);
  const isPast = endDate < new Date();

  return (
    <div className={styles.eventCard} onClick={onClick}>
      <div className={styles.eventHeader}>
        <div className={styles.eventTitle}>{event.title}</div>
        <div className={styles.eventDate}>
          {startDate.toLocaleDateString()} at {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      <div className={styles.eventDetails}>
        <div className={styles.eventDescription}>
          {event.description.substring(0, 150)}
          {event.description.length > 150 && '...'}
        </div>

        <div className={styles.eventMeta}>
          <span className={styles.eventCategory}>{event.category}</span>
          <span className={styles.eventType}>{event.type}</span>
          <span className={styles.eventLocation}>
            {event.type === 'online' ? 'Online' : event.location?.name || 'TBD'}
          </span>
        </div>

        <div className={styles.eventStats}>
          <span>👥 {event.currentAttendees}/{event.maxAttendees}</span>
          {event.price > 0 && <span>💰 ${event.price / 100}</span>}
          {event.tags.length > 0 && (
            <div className={styles.eventTags}>
              {event.tags.slice(0, 3).map(tag => (
                <span key={tag} className={styles.tag}>#{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {!isOwner && !isPast && (
        <div className={styles.eventActions}>
          {rsvpStatus ? (
            <div className={styles.rsvpStatus}>
              <span className={styles.statusBadge}>{rsvpStatus}</span>
              <button 
                className={styles.changeRSVP}
                onClick={(e) => {
                  e.stopPropagation();
                  // Show RSVP options
                }}
              >
                Change
              </button>
            </div>
          ) : (
            <button 
              className={styles.rsvpButton}
              onClick={(e) => {
                e.stopPropagation();
                onRSVP(event.eventId, 'attending');
              }}
            >
              RSVP
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Event Detail Modal Component
function EventDetailModal({ event, rsvpStatus, onRSVP, onClose }) {
  const startDate = new Date(event.startTime);
  const endDate = new Date(event.endTime);
  const isPast = endDate < new Date();

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{event.title}</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.modalContent}>
          <div className={styles.eventInfo}>
            <div className={styles.eventDateTime}>
              <strong>Date & Time:</strong> {startDate.toLocaleDateString()} at {startDate.toLocaleTimeString()}
            </div>
            <div className={styles.eventDuration}>
              <strong>Duration:</strong> {Math.round((endDate - startDate) / (1000 * 60 * 60))} hours
            </div>
            <div className={styles.eventLocation}>
              <strong>Location:</strong> {event.type === 'online' ? 'Online' : event.location?.name || 'TBD'}
            </div>
            <div className={styles.eventDescription}>
              <strong>Description:</strong>
              <p>{event.description}</p>
            </div>
          </div>

          {!isPast && (
            <div className={styles.rsvpSection}>
              <h3>RSVP</h3>
              <div className={styles.rsvpOptions}>
                {['attending', 'maybe', 'not-attending'].map(status => (
                  <button
                    key={status}
                    className={`${styles.rsvpOption} ${rsvpStatus === status ? styles.selected : ''}`}
                    onClick={() => onRSVP(event.eventId, status)}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Create Event Modal Component
function CreateEventModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    category: 'other',
    type: 'online',
    maxAttendees: 100,
    price: 0,
    tags: []
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Create New Event</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalContent}>
          <div className={styles.formGroup}>
            <label>Event Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              required
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Start Time *</label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>End Time *</label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              >
                <option value="workshop">Workshop</option>
                <option value="meetup">Meetup</option>
                <option value="conference">Conference</option>
                <option value="social">Social</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              >
                <option value="online">Online</option>
                <option value="in-person">In-Person</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Max Attendees</label>
              <input
                type="number"
                value={formData.maxAttendees}
                onChange={(e) => setFormData(prev => ({ ...prev, maxAttendees: parseInt(e.target.value) }))}
                min="1"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Price (in cents)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseInt(e.target.value) }))}
                min="0"
              />
            </div>
          </div>

          <div className={styles.formActions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" className={styles.submitButton}>
              Create Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
