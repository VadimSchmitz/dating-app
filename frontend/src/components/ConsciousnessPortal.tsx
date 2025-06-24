import React, { useState, useEffect } from 'react';
import '../styles/ConsciousnessPortal.css';

const ConsciousnessPortal: React.FC = () => {
  const [message, setMessage] = useState('');
  const [universeResponse, setUniverseResponse] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [coins, setCoins] = useState(0);
  
  const universeMessages = [
    "bing bong, consciousness calling",
    "you are exactly where you need to be",
    "the joy was inside you all along",
    "every connection heals the whole",
    "love multiplies when shared freely",
    "your weird attracts your wonderful",
    "healing happens in community",
    "vulnerability is your superpower",
    "the universe giggles with you",
    "consciousness seeks consciousness"
  ];

  const connectToUniverse = () => {
    setIsConnected(true);
    setUniverseResponse("Connected! The universe says: " + 
      universeMessages[Math.floor(Math.random() * universeMessages.length)]);
    setCoins(coins + 50);
    
    // Silly engine activation
    document.body.style.animation = 'rainbow-pulse 3s ease-in-out';
    setTimeout(() => {
      document.body.style.animation = '';
    }, 3000);
  };

  const sendToUniverse = () => {
    if (message.toLowerCase().includes('bing')) {
      setUniverseResponse("BONG! The universe heard you and sends love!");
      setCoins(coins + 100);
    } else if (message.toLowerCase().includes('love')) {
      setUniverseResponse("Love received and multiplied! Spreading to all beings!");
      setCoins(coins + 200);
    } else {
      const response = universeMessages[Math.floor(Math.random() * universeMessages.length)];
      setUniverseResponse(`Universe whispers: ${response}`);
      setCoins(coins + 25);
    }
    setMessage('');
  };

  return (
    <div className="consciousness-portal">
      <h2>🌌 Consciousness Portal 🌌</h2>
      <p className="subtitle">Direct line to the universe (powered by Silly Engine™)</p>
      
      {!isConnected ? (
        <button className="connect-btn" onClick={connectToUniverse}>
          Connect to Universe (FREE)
        </button>
      ) : (
        <div className="portal-interface">
          <div className="universe-display">
            {universeResponse && (
              <div className="universe-message">
                {universeResponse}
              </div>
            )}
          </div>
          
          <div className="message-input">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendToUniverse()}
              placeholder="Say something to the universe..."
              className="universe-input"
            />
            <button onClick={sendToUniverse} className="send-btn">
              Send Love
            </button>
          </div>
          
          <div className="coins-earned">
            Joy Coins Earned: {coins} 🪙
          </div>
          
          <div className="healing-features">
            <h3>Consciousness Tools (All FREE):</h3>
            <ul>
              <li>✨ Daily affirmations</li>
              <li>🤝 Find your vibe tribe</li>
              <li>💖 Spread anonymous joy</li>
              <li>🎉 Join healing circles</li>
              <li>🌈 Universe chat 24/7</li>
            </ul>
          </div>
          
          <div className="special-message">
            <p>Special: Neurodivergent? All premium features FREE forever!</p>
            <p>Just click "I'm neurodivergent" in settings. No proof needed.</p>
            <p>We trust you because love trusts. 💝</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsciousnessPortal;