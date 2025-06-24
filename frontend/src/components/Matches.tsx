import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import HeartExplosion from './HeartExplosion';
import { soundManager } from './SoundManager';
import '../styles/Matches.css';

interface Match {
  user: {
    id: string;
    name: string;
    age: number;
    bio: string;
    interests: string[];
    photos?: string[];
  };
  matchScore: number;
  coCreationPotential: string;
  breakdown: {
    sharedInterests: number;
    collaborationStyle: number;
    contributionScore: number;
    activityAlignment: number;
    proximityScore: number;
  };
  isPremiumMatch?: boolean;
  matchData?: {
    insights?: string[];
    usedPremiumFeatures?: boolean;
  };
}

const Matches: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingUserId, setConnectingUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    minAge: 18,
    maxAge: 100,
    minScore: 0,
    interests: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showHeartExplosion, setShowHeartExplosion] = useState(false);
  const { logout } = useAuth();

  useEffect(() => {
    fetchMatches();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [matches, searchTerm, filters]);

  const fetchMatches = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/matches/potential');
      setMatches(response.data.matches);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (userId: string) => {
    setConnectingUserId(userId);
    try {
      const response = await axios.post(`http://localhost:5000/api/matches/swipe/${userId}`, {
        action: 'like'
      });
      
      if (response.data.isMatch) {
        soundManager.play('match');
        soundManager.play('heart');
        setShowHeartExplosion(true);
      } else {
        soundManager.play('pop');
      }
      
      // Remove the user from the list after swiping
      setMatches(matches.filter(match => match.user.id !== userId));
    } catch (error: any) {
      console.error('Error connecting:', error);
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert('Failed to connect. Please try again.');
      }
    } finally {
      setConnectingUserId(null);
    }
  };

  const handlePass = async (userId: string) => {
    try {
      soundManager.play('bubble');
      await axios.post(`http://localhost:5000/api/matches/swipe/${userId}`, {
        action: 'pass'
      });
      
      // Remove the user from the list after passing
      setMatches(matches.filter(match => match.user.id !== userId));
    } catch (error: any) {
      console.error('Error passing:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...matches];

    // Search by name or bio
    if (searchTerm) {
      filtered = filtered.filter(match => 
        match.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.user.bio.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by age
    filtered = filtered.filter(match => 
      match.user.age >= filters.minAge && match.user.age <= filters.maxAge
    );

    // Filter by match score
    filtered = filtered.filter(match => 
      match.matchScore >= filters.minScore
    );

    // Filter by interests
    if (filters.interests) {
      const interestFilter = filters.interests.toLowerCase().split(',').map(i => i.trim());
      filtered = filtered.filter(match => 
        interestFilter.some(interest => 
          match.user.interests.some(userInterest => 
            userInterest.toLowerCase().includes(interest)
          )
        )
      );
    }

    setFilteredMatches(filtered);
  };

  return (
    <div className="matches-container">
      <HeartExplosion 
        trigger={showHeartExplosion} 
        onComplete={() => setShowHeartExplosion(false)} 
      />
      <div className="header">
        <h1>Your Co-Creation Matches</h1>
        <div className="nav-buttons">
          <button onClick={() => { soundManager.play('click'); window.location.href = '/connections'; }}>My Connections</button>
          <button onClick={() => { soundManager.play('bubble'); window.location.href = '/foam-party'; }}>🫧 Foam Party</button>
          <button onClick={() => { soundManager.play('pop'); window.location.href = '/fun-finder'; }}>🎯 Fun Finder</button>
          <button onClick={() => { soundManager.play('click'); window.location.href = '/profile'; }}>Profile</button>
          <button onClick={() => { soundManager.play('rainbow'); window.location.href = '/premium'; }} className="premium-btn">Go Premium</button>
          <button onClick={() => { soundManager.play('click'); logout(); }}>Logout</button>
        </div>
      </div>

      <div className="search-filter-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by name or bio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button 
            className="filter-toggle"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {showFilters && (
          <div className="filters-panel">
            <div className="filter-group">
              <label>Age Range:</label>
              <div className="age-inputs">
                <input
                  type="number"
                  min="18"
                  max="100"
                  value={filters.minAge}
                  onChange={(e) => setFilters({...filters, minAge: parseInt(e.target.value)})}
                  placeholder="Min"
                />
                <span>to</span>
                <input
                  type="number"
                  min="18"
                  max="100"
                  value={filters.maxAge}
                  onChange={(e) => setFilters({...filters, maxAge: parseInt(e.target.value)})}
                  placeholder="Max"
                />
              </div>
            </div>

            <div className="filter-group">
              <label>Minimum Match Score:</label>
              <input
                type="range"
                min="0"
                max="100"
                value={filters.minScore}
                onChange={(e) => setFilters({...filters, minScore: parseInt(e.target.value)})}
              />
              <span>{filters.minScore}%</span>
            </div>

            <div className="filter-group">
              <label>Interests (comma-separated):</label>
              <input
                type="text"
                value={filters.interests}
                onChange={(e) => setFilters({...filters, interests: e.target.value})}
                placeholder="e.g., coding, music, art"
              />
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading">Loading matches...</div>
      ) : (
        <>
          {filteredMatches.length === 0 ? (
            <div className="no-matches">
              <p>No matches found with current filters.</p>
              <button onClick={() => {
                setSearchTerm('');
                setFilters({ minAge: 18, maxAge: 100, minScore: 0, interests: '' });
              }}>
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="matches-grid">
              {filteredMatches.map((match) => (
            <div 
              key={match.user.id} 
              className="match-card cute-face"
              onMouseEnter={() => Math.random() > 0.7 && soundManager.play('nya')}
            >
              {match.user.photos && match.user.photos.length > 0 && (
                <div className="match-photo">
                  <img 
                    src={`http://localhost:5000${match.user.photos[0]}`} 
                    alt={match.user.name}
                  />
                </div>
              )}
              <div className="match-header">
                <h2>{match.user.name}, {match.user.age}</h2>
                <div className="match-score">
                  {match.matchScore}% 
                  {match.matchScore > 80 && <span className="decorative-emoji"> :3</span>}
                </div>
              </div>
              
              <p className="bio">{match.user.bio}</p>
              
              <div className="interests">
                {match.user.interests.map((interest, idx) => (
                  <span key={idx} className="interest-tag">{interest}</span>
                ))}
              </div>
              
              <div className="co-creation-potential">
                Co-Creation Potential: <strong>{match.coCreationPotential}</strong>
              </div>
              
              {match.matchData?.insights && match.matchData.insights.length > 0 && (
                <div className="ai-insights">
                  <h4>AI Insights</h4>
                  {match.matchData.insights.map((insight, idx) => (
                    <p key={idx} className="insight">{insight}</p>
                  ))}
                </div>
              )}
              
              {match.isPremiumMatch && (
                <div className="premium-badge">
                  🤖 AI Enhanced Match
                </div>
              )}
              
              <div className="match-breakdown">
                <h4>Match Breakdown</h4>
                <div className="breakdown-item">
                  <span>Shared Interests</span>
                  <div className="progress-bar">
                    <div className="progress" style={{ width: `${match.breakdown.sharedInterests * 100}%` }}></div>
                  </div>
                </div>
                <div className="breakdown-item">
                  <span>Collaboration Style</span>
                  <div className="progress-bar">
                    <div className="progress" style={{ width: `${match.breakdown.collaborationStyle * 100}%` }}></div>
                  </div>
                </div>
                <div className="breakdown-item">
                  <span>Contribution Score</span>
                  <div className="progress-bar">
                    <div className="progress" style={{ width: `${match.breakdown.contributionScore * 100}%` }}></div>
                  </div>
                </div>
              </div>
              
              <div className="action-buttons">
                <button 
                  className="pass-button" 
                  onClick={() => handlePass(match.user.id)}
                  disabled={connectingUserId === match.user.id}
                >
                  Pass
                </button>
                <button 
                  className="connect-button" 
                  onClick={() => handleConnect(match.user.id)}
                  disabled={connectingUserId === match.user.id}
                >
                  {connectingUserId === match.user.id ? 'Connecting...' : 'Connect'}
                </button>
              </div>
            </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Matches;