import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/FunFinder.css';

interface FunActivity {
  id: string;
  title: string;
  category: string;
  description: string;
  difficulty: string;
  timeEstimate: number;
  requiredPeople: number;
  tags: string[];
  prompts?: string[];
  rewards?: {
    coins: number;
    badges: string[];
  };
}

interface DateIdea {
  title: string;
  description: string;
  vibe: string;
  effort: string;
  tags: string[];
}

interface FunStats {
  funScore: number;
  completedActivities: number;
  badges: string[];
  level: number;
}

const FunFinder: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'activities' | 'date-ideas' | 'leaderboard'>('activities');
  const [currentActivity, setCurrentActivity] = useState<FunActivity | null>(null);
  const [dateIdeas, setDateIdeas] = useState<DateIdea[]>([]);
  const [funStats, setFunStats] = useState<FunStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<string>('');
  const [matches, setMatches] = useState<any[]>([]);
  const [activityProof, setActivityProof] = useState('');
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  useEffect(() => {
    fetchFunStats();
    fetchMatches();
  }, []);

  const fetchFunStats = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/fun/stats');
      setFunStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching fun stats:', error);
    }
  };

  const fetchMatches = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/matches/my-matches');
      setMatches(response.data.matches);
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
  };

  const getRandomActivity = async (category?: string, difficulty?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (difficulty) params.append('difficulty', difficulty);
      
      const response = await axios.get(`http://localhost:5000/api/fun/random-activity?${params}`);
      setCurrentActivity(response.data.activity);
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDateIdeas = async (matchId: string) => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/fun/date-ideas/${matchId}`);
      setDateIdeas(response.data.dateIdeas);
      setSelectedMatch(matchId);
    } catch (error) {
      console.error('Error fetching date ideas:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/fun/leaderboard');
      setLeaderboard(response.data.leaderboard);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeActivity = async () => {
    if (!currentActivity || !selectedMatch) return;
    
    try {
      const response = await axios.post(
        `http://localhost:5000/api/fun/activities/${currentActivity.id}/complete`,
        {
          matchId: selectedMatch,
          evidence: activityProof
        }
      );
      
      if (response.data.success) {
        setShowCompletionModal(false);
        setActivityProof('');
        fetchFunStats();
        alert(`Activity completed! ${response.data.rewards?.coins ? `You earned ${response.data.rewards.coins} coins!` : ''}`);
        getRandomActivity();
      }
    } catch (error) {
      console.error('Error completing activity:', error);
      alert('Failed to complete activity');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: { [key: string]: string } = {
      easy: '#4caf50',
      medium: '#ff9800',
      spicy: '#f44336'
    };
    return colors[difficulty] || '#666';
  };

  const getVibeEmoji = (vibe: string) => {
    const emojis: { [key: string]: string } = {
      playful: '🎉',
      cozy: '☕',
      adventurous: '🚀',
      competitive: '🏆',
      relaxed: '😌',
      romantic: '💕'
    };
    return emojis[vibe] || '✨';
  };

  return (
    <div className="fun-finder-container">
      <div className="back-button-container">
        <button onClick={() => window.location.href = '/matches'} className="back-button">
          ← Back to Matches
        </button>
      </div>
      <div className="fun-header">
        <h1>🎯 Fun Finder</h1>
        {funStats && (
          <div className="fun-stats-summary">
            <div className="stat-item">
              <span className="stat-label">Fun Score</span>
              <span className="stat-value">{funStats.funScore}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Level</span>
              <span className="stat-value">{funStats.level}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Activities</span>
              <span className="stat-value">{funStats.completedActivities}</span>
            </div>
          </div>
        )}
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'activities' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('activities');
            if (!currentActivity) getRandomActivity();
          }}
        >
          🎮 Activities
        </button>
        <button 
          className={`tab ${activeTab === 'date-ideas' ? 'active' : ''}`}
          onClick={() => setActiveTab('date-ideas')}
        >
          💝 Date Ideas
        </button>
        <button 
          className={`tab ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('leaderboard');
            fetchLeaderboard();
          }}
        >
          🏆 Leaderboard
        </button>
      </div>

      {activeTab === 'activities' && (
        <div className="activities-section">
          <div className="activity-controls">
            <select onChange={(e) => getRandomActivity(e.target.value, undefined)}>
              <option value="">All Categories</option>
              <option value="icebreaker">Icebreakers</option>
              <option value="game">Games</option>
              <option value="challenge">Challenges</option>
              <option value="question">Questions</option>
              <option value="creative">Creative</option>
            </select>
            
            <select onChange={(e) => getRandomActivity(undefined, e.target.value)}>
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="spicy">Spicy 🌶️</option>
            </select>
            
            <button 
              className="shuffle-btn"
              onClick={() => getRandomActivity()}
              disabled={loading}
            >
              🎲 New Activity
            </button>
          </div>

          {currentActivity ? (
            <div className="activity-card">
              <div className="activity-header">
                <h2>{currentActivity.title}</h2>
                <span 
                  className="difficulty-badge"
                  style={{ backgroundColor: getDifficultyColor(currentActivity.difficulty) }}
                >
                  {currentActivity.difficulty}
                </span>
              </div>
              
              <p className="activity-description">{currentActivity.description}</p>
              
              <div className="activity-meta">
                <span>⏱️ {currentActivity.timeEstimate} mins</span>
                <span>👥 {currentActivity.requiredPeople} people</span>
              </div>
              
              {currentActivity.prompts && currentActivity.prompts.length > 0 && (
                <div className="prompts">
                  <h3>Try these prompts:</h3>
                  {currentActivity.prompts.map((prompt, idx) => (
                    <div key={idx} className="prompt">{prompt}</div>
                  ))}
                </div>
              )}
              
              {currentActivity.rewards && (
                <div className="rewards">
                  <h3>Rewards:</h3>
                  <div className="reward-items">
                    {currentActivity.rewards.coins > 0 && (
                      <span>🪙 {currentActivity.rewards.coins} coins</span>
                    )}
                    {currentActivity.rewards.badges?.map((badge, idx) => (
                      <span key={idx}>🏅 {badge}</span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="activity-actions">
                <select 
                  value={selectedMatch} 
                  onChange={(e) => setSelectedMatch(e.target.value)}
                  className="match-select"
                >
                  <option value="">Select a match</option>
                  {matches.map(match => (
                    <option key={match.matchId} value={match.matchId}>
                      {match.user.name}
                    </option>
                  ))}
                </select>
                
                <button 
                  className="complete-btn"
                  onClick={() => setShowCompletionModal(true)}
                  disabled={!selectedMatch}
                >
                  ✅ Complete Activity
                </button>
              </div>
            </div>
          ) : (
            <div className="activity-placeholder">
              <p>Click "New Activity" to get started!</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'date-ideas' && (
        <div className="date-ideas-section">
          <div className="match-selector">
            <h3>Select a match to get personalized date ideas:</h3>
            <select 
              value={selectedMatch} 
              onChange={(e) => fetchDateIdeas(e.target.value)}
              className="match-select-large"
            >
              <option value="">Choose a match...</option>
              {matches.map(match => (
                <option key={match.matchId} value={match.matchId}>
                  {match.user.name}
                </option>
              ))}
            </select>
          </div>
          
          {loading ? (
            <div className="loading">Loading date ideas...</div>
          ) : dateIdeas.length > 0 ? (
            <div className="date-ideas-grid">
              {dateIdeas.map((idea, idx) => (
                <div key={idx} className="date-idea-card">
                  <div className="idea-header">
                    <h3>{idea.title}</h3>
                    <span className="vibe-emoji">{getVibeEmoji(idea.vibe)}</span>
                  </div>
                  <p>{idea.description}</p>
                  <div className="idea-meta">
                    <span className="effort-level">Effort: {idea.effort}</span>
                    <span className="vibe-type">Vibe: {idea.vibe}</span>
                  </div>
                  <div className="idea-tags">
                    {idea.tags.map((tag, tagIdx) => (
                      <span key={tagIdx} className="tag">#{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : selectedMatch ? (
            <div className="no-ideas">
              <p>No date ideas found. Try selecting a different match!</p>
            </div>
          ) : null}
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div className="leaderboard-section">
          <h2>🏆 Fun Champions</h2>
          {loading ? (
            <div className="loading">Loading leaderboard...</div>
          ) : (
            <div className="leaderboard-list">
              {leaderboard.map((entry) => (
                <div key={entry.user.id} className="leaderboard-entry">
                  <div className="rank">#{entry.rank}</div>
                  <div className="user-info">
                    <img 
                      src={entry.user.photo ? `http://localhost:5000${entry.user.photo}` : '/default-avatar.png'} 
                      alt={entry.user.name}
                    />
                    <span className="name">{entry.user.name}</span>
                  </div>
                  <div className="score">{entry.user.funScore} pts</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showCompletionModal && (
        <div className="completion-modal">
          <div className="modal-content">
            <h3>Complete Activity</h3>
            <p>Share how you completed this activity!</p>
            <textarea
              placeholder="Describe your experience or paste a photo link..."
              value={activityProof}
              onChange={(e) => setActivityProof(e.target.value)}
            />
            <div className="modal-actions">
              <button onClick={() => setShowCompletionModal(false)}>Cancel</button>
              <button onClick={completeActivity} className="submit-btn">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FunFinder;