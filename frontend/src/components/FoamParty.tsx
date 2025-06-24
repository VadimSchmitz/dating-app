import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/FoamParty.css';

interface Event {
  id: string;
  title: string;
  type: string;
  description: string;
  location: any;
  date: string;
  maxAttendees: number;
  currentAttendees: number;
  hostId: string;
  vibeCheck: {
    energy: string;
    mood: string;
    dress: string;
  };
  tags: string[];
  isAttending?: boolean;
  isHost?: boolean;
  host?: {
    id: string;
    name: string;
    photos: string[];
  };
}

const FoamParty: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'foam_party',
    description: '',
    location: { city: '', venue: '' },
    date: '',
    maxAttendees: 20,
    tags: [] as string[],
    vibeCheck: {
      energy: 'high',
      mood: 'playful',
      dress: 'casual'
    }
  });

  useEffect(() => {
    fetchEvents();
  }, [filter]);

  const fetchEvents = async () => {
    try {
      const endpoint = filter === 'foam_parties' 
        ? '/api/events/foam-parties' 
        : '/api/events';
      
      const response = await axios.get(`http://localhost:5000${endpoint}`);
      setEvents(response.data.events || response.data.foamParties || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/events', newEvent);
      setEvents([response.data.event, ...events]);
      setShowCreateForm(false);
      setNewEvent({
        title: '',
        type: 'foam_party',
        description: '',
        location: { city: '', venue: '' },
        date: '',
        maxAttendees: 20,
        tags: [],
        vibeCheck: { energy: 'high', mood: 'playful', dress: 'casual' }
      });
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event');
    }
  };

  const joinEvent = async (eventId: string) => {
    try {
      await axios.post(`http://localhost:5000/api/events/${eventId}/join`);
      setEvents(events.map(event => 
        event.id === eventId 
          ? { ...event, isAttending: true, currentAttendees: event.currentAttendees + 1 }
          : event
      ));
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to join event');
    }
  };

  const leaveEvent = async (eventId: string) => {
    try {
      await axios.post(`http://localhost:5000/api/events/${eventId}/leave`);
      setEvents(events.map(event => 
        event.id === eventId 
          ? { ...event, isAttending: false, currentAttendees: event.currentAttendees - 1 }
          : event
      ));
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to leave event');
    }
  };

  const getVibeEmoji = (vibe: string) => {
    const emojis: { [key: string]: string } = {
      high: '🔥',
      medium: '✨',
      low: '😌',
      playful: '🎉',
      chill: '🍃',
      adventurous: '🚀',
      romantic: '💕',
      casual: '👕',
      themed: '🎭',
      formal: '🎩'
    };
    return emojis[vibe] || '✨';
  };

  const eventTypes = [
    { value: 'foam_party', label: '🫧 Foam Party', color: '#00bcd4' },
    { value: 'game_night', label: '🎮 Game Night', color: '#9c27b0' },
    { value: 'adventure', label: '🏃 Adventure', color: '#ff5722' },
    { value: 'creative', label: '🎨 Creative', color: '#4caf50' },
    { value: 'social', label: '🥳 Social', color: '#ff9800' },
    { value: 'outdoor', label: '🏕️ Outdoor', color: '#795548' }
  ];

  return (
    <div className="foam-party-container">
      <div className="back-button-container">
        <button onClick={() => window.location.href = '/matches'} className="back-button">
          ← Back to Matches
        </button>
      </div>
      <div className="header">
        <h1>🫧 Foam Parties & Fun Events</h1>
        <div className="header-actions">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Events</option>
            <option value="foam_parties">Foam Parties Only</option>
          </select>
          <button 
            className="create-event-btn"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            + Create Event
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="create-form-modal">
          <div className="create-form">
            <h2>Create a Fun Event</h2>
            <form onSubmit={createEvent}>
              <input
                type="text"
                placeholder="Event Title"
                value={newEvent.title}
                onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                required
              />
              
              <div className="event-type-selector">
                {eventTypes.map(type => (
                  <label 
                    key={type.value} 
                    className={`type-option ${newEvent.type === type.value ? 'selected' : ''}`}
                    style={{ borderColor: newEvent.type === type.value ? type.color : '#ddd' }}
                  >
                    <input
                      type="radio"
                      value={type.value}
                      checked={newEvent.type === type.value}
                      onChange={(e) => setNewEvent({...newEvent, type: e.target.value})}
                    />
                    {type.label}
                  </label>
                ))}
              </div>
              
              <textarea
                placeholder="Describe your event..."
                value={newEvent.description}
                onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                required
              />
              
              <div className="location-inputs">
                <input
                  type="text"
                  placeholder="City"
                  value={newEvent.location.city}
                  onChange={(e) => setNewEvent({
                    ...newEvent, 
                    location: {...newEvent.location, city: e.target.value}
                  })}
                  required
                />
                <input
                  type="text"
                  placeholder="Venue/Address"
                  value={newEvent.location.venue}
                  onChange={(e) => setNewEvent({
                    ...newEvent, 
                    location: {...newEvent.location, venue: e.target.value}
                  })}
                />
              </div>
              
              <input
                type="datetime-local"
                value={newEvent.date}
                onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                required
              />
              
              <div className="vibe-check">
                <h3>Set the Vibe</h3>
                <div className="vibe-options">
                  <label>
                    Energy Level:
                    <select 
                      value={newEvent.vibeCheck.energy}
                      onChange={(e) => setNewEvent({
                        ...newEvent,
                        vibeCheck: {...newEvent.vibeCheck, energy: e.target.value}
                      })}
                    >
                      <option value="low">Low 😌</option>
                      <option value="medium">Medium ✨</option>
                      <option value="high">High 🔥</option>
                    </select>
                  </label>
                  
                  <label>
                    Mood:
                    <select 
                      value={newEvent.vibeCheck.mood}
                      onChange={(e) => setNewEvent({
                        ...newEvent,
                        vibeCheck: {...newEvent.vibeCheck, mood: e.target.value}
                      })}
                    >
                      <option value="chill">Chill 🍃</option>
                      <option value="playful">Playful 🎉</option>
                      <option value="adventurous">Adventurous 🚀</option>
                      <option value="romantic">Romantic 💕</option>
                    </select>
                  </label>
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading fun events...</div>
      ) : (
        <div className="events-grid">
          {events.map(event => (
            <div key={event.id} className="event-card">
              <div className="event-header">
                <span className="event-type-badge">
                  {eventTypes.find(t => t.value === event.type)?.label || event.type}
                </span>
                <span className="event-date">
                  {new Date(event.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              
              <h3>{event.title}</h3>
              <p className="event-description">{event.description}</p>
              
              <div className="event-location">
                📍 {event.location.city} {event.location.venue && `- ${event.location.venue}`}
              </div>
              
              <div className="vibe-indicators">
                <span>Energy: {getVibeEmoji(event.vibeCheck.energy)}</span>
                <span>Mood: {getVibeEmoji(event.vibeCheck.mood)}</span>
                <span>Dress: {getVibeEmoji(event.vibeCheck.dress)}</span>
              </div>
              
              <div className="attendees-info">
                <div className="attendee-count">
                  👥 {event.currentAttendees}/{event.maxAttendees} attending
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${(event.currentAttendees / event.maxAttendees) * 100}%` }}
                  />
                </div>
              </div>
              
              {event.host && (
                <div className="host-info">
                  <img 
                    src={event.host.photos?.[0] ? `http://localhost:5000${event.host.photos[0]}` : '/default-avatar.png'} 
                    alt={event.host.name}
                  />
                  <span>Hosted by {event.host.name}</span>
                </div>
              )}
              
              <div className="event-actions">
                {event.isHost ? (
                  <button className="host-badge" disabled>
                    You're Hosting
                  </button>
                ) : event.isAttending ? (
                  <button 
                    className="leave-btn"
                    onClick={() => leaveEvent(event.id)}
                  >
                    Leave Event
                  </button>
                ) : (
                  <button 
                    className="join-btn"
                    onClick={() => joinEvent(event.id)}
                    disabled={event.currentAttendees >= event.maxAttendees}
                  >
                    {event.currentAttendees >= event.maxAttendees ? 'Event Full' : 'Join Event'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {events.length === 0 && !loading && (
        <div className="no-events">
          <h2>No events yet!</h2>
          <p>Be the first to create a fun event 🎉</p>
        </div>
      )}
    </div>
  );
};

export default FoamParty;