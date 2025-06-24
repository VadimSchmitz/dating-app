import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Connections.css';

interface Connection {
  matchId: string;
  user: {
    id: string;
    name: string;
    bio: string;
    photos: string[];
    interests: string[];
    lastActive: string;
  };
  matchedAt: string;
  lastMessageAt: string | null;
  compatibilityScore: number;
  coCreationPotential: number;
}

const Connections: React.FC = () => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/matches/my-matches');
      setConnections(response.data.matches);
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnmatch = async (matchId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to unmatch with ${userName}?`)) {
      try {
        await axios.delete(`http://localhost:5000/api/matches/unmatch/${matchId}`);
        setConnections(connections.filter(conn => conn.matchId !== matchId));
      } catch (error) {
        console.error('Error unmatching:', error);
        alert('Failed to unmatch. Please try again.');
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getLastActiveStatus = (lastActive: string) => {
    const now = new Date();
    const active = new Date(lastActive);
    const diffMs = now.getTime() - active.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 5) return 'Active now';
    if (diffMins < 60) return `Active ${diffMins}m ago`;
    if (diffMins < 1440) return `Active ${Math.floor(diffMins / 60)}h ago`;
    return `Active ${Math.floor(diffMins / 1440)}d ago`;
  };

  return (
    <div className="connections-container">
      <div className="header">
        <h1>Your Connections</h1>
        <div className="nav-buttons">
          <button onClick={() => window.location.href = '/matches'}>Find Matches</button>
          <button onClick={() => window.location.href = '/profile'}>Profile</button>
          <button onClick={logout}>Logout</button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading connections...</div>
      ) : connections.length === 0 ? (
        <div className="no-connections">
          <p>You don't have any connections yet.</p>
          <button 
            className="find-matches-button"
            onClick={() => window.location.href = '/matches'}
          >
            Find Matches
          </button>
        </div>
      ) : (
        <div className="connections-grid">
          {connections.map((connection) => (
            <div key={connection.matchId} className="connection-card">
              <div className="connection-header">
                <div>
                  <h3>{connection.user.name}</h3>
                  <span className="active-status">
                    {getLastActiveStatus(connection.user.lastActive)}
                  </span>
                </div>
                <div className="match-info">
                  <span className="match-score">{Math.round(connection.compatibilityScore)}%</span>
                </div>
              </div>
              
              <p className="bio">{connection.user.bio}</p>
              
              <div className="interests">
                {connection.user.interests.slice(0, 3).map((interest, idx) => (
                  <span key={idx} className="interest-tag">{interest}</span>
                ))}
                {connection.user.interests.length > 3 && (
                  <span className="interest-tag">+{connection.user.interests.length - 3} more</span>
                )}
              </div>
              
              <div className="connection-meta">
                <p>Matched on {formatDate(connection.matchedAt)}</p>
                <p>Co-Creation Potential: <strong>{Math.round(connection.coCreationPotential)}%</strong></p>
              </div>
              
              <div className="connection-actions">
                <button 
                  className="message-button"
                  onClick={() => window.location.href = `/messages/${connection.matchId}`}
                >
                  Message
                </button>
                <button 
                  className="unmatch-button"
                  onClick={() => handleUnmatch(connection.matchId, connection.user.name)}
                >
                  Unmatch
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Connections;