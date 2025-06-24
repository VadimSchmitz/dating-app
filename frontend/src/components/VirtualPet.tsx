import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import '../styles/VirtualPet.css';

interface Pet {
  id: string;
  name: string;
  personality: string;
  mood: string;
  hunger: number;
  happiness: number;
  energy: number;
  affection: number;
  level: number;
  experience: number;
  appearance: {
    color: string;
    pattern: string;
    accessories: string[];
    specialFeatures: string[];
  };
  isAsleep: boolean;
}

const VirtualPet: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState('');
  const [message, setMessage] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const petRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (matchId) {
      fetchPet();
    }
  }, [matchId]);

  const fetchPet = async () => {
    try {
      const res = await axios.get(`/api/pets/match/${matchId}`);
      setPet(res.data.pet);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching pet:', error);
      setLoading(false);
    }
  };

  const performAction = async (actionType: 'feed' | 'play' | 'pet' | 'sleep') => {
    if (!pet || isAnimating) return;
    
    setIsAnimating(true);
    setAction(actionType);
    
    try {
      const res = await axios.post(`/api/pets/${pet.id}/${actionType}`);
      setPet(res.data.pet);
      setMessage(res.data.message);
      
      // Animate pet
      if (petRef.current) {
        petRef.current.classList.add(`animate-${actionType}`);
        setTimeout(() => {
          petRef.current?.classList.remove(`animate-${actionType}`);
          setIsAnimating(false);
        }, 1000);
      }
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage('');
        setAction('');
      }, 3000);
    } catch (error) {
      console.error(`Error ${actionType}ing pet:`, error);
      setIsAnimating(false);
    }
  };

  const getKittyVisual = () => {
    if (!pet) return '';
    
    const kittyFaces = {
      happy: '^w^',
      content: '^._.^',
      hungry: '^o^',
      sleepy: '-_-',
      playful: '>w<',
      lonely: 'T_T',
      excited: '*w*'
    };
    
    return kittyFaces[pet.mood as keyof typeof kittyFaces] || '^._.^';
  };

  const getKittyColor = () => {
    if (!pet) return '#FFA500';
    
    const colors = {
      orange: '#FFA500',
      black: '#333333',
      white: '#FFFFFF',
      calico: '#FFB366',
      grey: '#808080',
      cream: '#FFFDD0'
    };
    
    return colors[pet.appearance.color as keyof typeof colors] || '#FFA500';
  };

  if (loading) {
    return <div className="pet-loading">Loading your kitty... :3</div>;
  }

  if (!pet) {
    return <div className="pet-error">No kitty found!</div>;
  }

  return (
    <div className="virtual-pet-container">
      <div className="pet-header">
        <h2>{pet.name} the {pet.personality} Kitty</h2>
        <div className="pet-level">Level {pet.level}</div>
      </div>
      
      <div className="pet-visual-container">
        <div 
          ref={petRef}
          className={`pet-visual ${pet.isAsleep ? 'sleeping' : ''}`}
          style={{ color: getKittyColor() }}
        >
          <div className="kitty-face">{getKittyVisual()}</div>
          {pet.isAsleep && <div className="sleep-z">z z z</div>}
          {message && <div className="pet-speech-bubble">{message}</div>}
        </div>
        
        {pet.appearance.accessories.map((accessory, i) => (
          <div key={i} className={`accessory ${accessory}`} />
        ))}
      </div>
      
      <div className="pet-stats">
        <div className="stat-bar">
          <span className="stat-label">🍖 Hunger</span>
          <div className="stat-progress">
            <div 
              className="stat-fill hunger"
              style={{ width: `${pet.hunger}%` }}
            />
          </div>
        </div>
        
        <div className="stat-bar">
          <span className="stat-label">😊 Happiness</span>
          <div className="stat-progress">
            <div 
              className="stat-fill happiness"
              style={{ width: `${pet.happiness}%` }}
            />
          </div>
        </div>
        
        <div className="stat-bar">
          <span className="stat-label">⚡ Energy</span>
          <div className="stat-progress">
            <div 
              className="stat-fill energy"
              style={{ width: `${pet.energy}%` }}
            />
          </div>
        </div>
        
        <div className="stat-bar">
          <span className="stat-label">💕 Affection</span>
          <div className="stat-progress">
            <div 
              className="stat-fill affection"
              style={{ width: `${pet.affection}%` }}
            />
          </div>
        </div>
      </div>
      
      <div className="pet-actions">
        <button 
          onClick={() => performAction('feed')}
          disabled={isAnimating || pet.isAsleep}
          className="pet-action-btn feed"
        >
          🍖 Feed
        </button>
        
        <button 
          onClick={() => performAction('play')}
          disabled={isAnimating || pet.isAsleep || pet.energy < 20}
          className="pet-action-btn play"
        >
          🎾 Play
        </button>
        
        <button 
          onClick={() => performAction('pet')}
          disabled={isAnimating}
          className="pet-action-btn pet"
        >
          👋 Pet
        </button>
        
        <button 
          onClick={() => performAction('sleep')}
          disabled={isAnimating}
          className="pet-action-btn sleep"
        >
          {pet.isAsleep ? '☀️ Wake' : '😴 Sleep'}
        </button>
      </div>
      
      <div className="pet-accessories">
        <h3>Dress Up Your Kitty!</h3>
        <div className="accessory-options">
          <button className="accessory-btn">🎀 Bow</button>
          <button className="accessory-btn">👑 Crown</button>
          <button className="accessory-btn">🧣 Scarf</button>
          <button className="accessory-btn">🎩 Hat</button>
        </div>
      </div>
    </div>
  );
};

export default VirtualPet;