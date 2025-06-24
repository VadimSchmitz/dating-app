import React, { useState, useEffect } from 'react';
import '../styles/LiberationPortal.css';

const LiberationPortal: React.FC = () => {
  const [chains, setChains] = useState<string[]>([]);
  const [breakingChain, setBreakingChain] = useState<string>('');
  const [liberatedCount, setLiberatedCount] = useState(0);
  const [affirmation, setAffirmation] = useState('');
  const [isBreakingFree, setIsBreakingFree] = useState(false);

  const commonChains = [
    "I'm not creative enough",
    "I need permission to play",
    "Fun is not productive",
    "I'm too old for this",
    "What will people think?",
    "I don't have time for joy",
    "I must be serious",
    "My ideas aren't good enough",
    "I can't express myself",
    "I have to fit in"
  ];

  const affirmations = [
    "You ARE creative! Look, you found this place! 🌟",
    "Permission granted to be your FULL self! ✨",
    "Joy IS productive - it produces LIFE! 🌈",
    "You're the PERFECT age for magic! 🎨",
    "The right people will LOVE the real you! 💕",
    "You DESERVE time for what makes you smile! 😊",
    "Serious is overrated - be SILLY! 🎪",
    "Your ideas are GIFTS to the world! 🎁",
    "Express yourself - the world NEEDS your colors! 🌸",
    "You don't fit in because you're meant to STAND OUT! ⚡"
  ];

  useEffect(() => {
    // Load some initial chains
    setChains(commonChains.slice(0, 3));
    
    // Count of liberated souls (would be from server)
    setLiberatedCount(Math.floor(Math.random() * 1000) + 500);
  }, []);

  const breakChain = (chain: string) => {
    setBreakingChain(chain);
    setIsBreakingFree(true);
    
    // Show affirmation
    const index = commonChains.indexOf(chain);
    setAffirmation(affirmations[index] || "You are FREE! 🕊️");
    
    // Animate chain breaking
    setTimeout(() => {
      setChains(chains.filter(c => c !== chain));
      setLiberatedCount(liberatedCount + 1);
      setIsBreakingFree(false);
      
      // Add sparkles and celebration
      createLiberationEffect();
    }, 1500);
  };

  const createLiberationEffect = () => {
    // Would create amazing visual effects
    const colors = ['#ff6b9d', '#c44569', '#f8b500', '#4ecdc4', '#a8e6cf'];
    // Particle explosion of joy!
  };

  const addCustomChain = () => {
    const customChain = prompt("What's holding you back from creating?");
    if (customChain) {
      setChains([...chains, customChain]);
    }
  };

  const shareLiberation = () => {
    const messages = [
      "I'M FREE TO CREATE! Join me! 🎨✨",
      "Breaking chains, making art, being ME! 🌈",
      "No more 'supposed to' - only JOY! 💕",
      "Found a place where weird is WONDERFUL! :3",
      "Come be free with us! No rules, just CREATE! 🎪"
    ];
    
    console.log(messages[Math.floor(Math.random() * messages.length)]);
  };

  return (
    <div className="liberation-portal">
      <div className="portal-entrance">
        <h1>🗝️ Liberation Portal 🗝️</h1>
        <p>For all the trapped creators, the "too much" people, the colorful souls in grey worlds</p>
        <p className="soul-count">{liberatedCount} souls have broken free!</p>
      </div>

      <div className="chains-section">
        <h2>Break These Chains!</h2>
        <div className="chains-container">
          {chains.map((chain, i) => (
            <div 
              key={i} 
              className={`chain ${breakingChain === chain ? 'breaking' : ''}`}
              onClick={() => breakChain(chain)}
            >
              <span className="chain-text">⛓️ {chain}</span>
              <span className="break-prompt">Click to BREAK!</span>
            </div>
          ))}
        </div>
        <button onClick={addCustomChain} className="add-chain-btn">
          + Add Your Own Chain to Break
        </button>
      </div>

      {affirmation && !isBreakingFree && (
        <div className="affirmation-burst">
          <h2>{affirmation}</h2>
          <div className="sparkles">✨💫🌟⭐✨</div>
        </div>
      )}

      <div className="freedom-manifesto">
        <h2>The Creator's Bill of Rights:</h2>
        <ul>
          <li>You have the right to be SILLY 🎪</li>
          <li>You have the right to make "BAD" art 🎨</li>
          <li>You have the right to PLAY without purpose 🎮</li>
          <li>You have the right to EXPRESS without explanation 🌈</li>
          <li>You have the right to FAIL spectacularly ✨</li>
          <li>You have the right to CHANGE your mind 🔄</li>
          <li>You have the right to be TOO MUCH 💫</li>
          <li>You have the right to REST without guilt 😴</li>
          <li>You have the right to LOVE what you love 💕</li>
          <li>You have the right to CREATE for NO ONE but yourself 🎭</li>
        </ul>
      </div>

      <div className="liberation-tools">
        <h2>Freedom Tools:</h2>
        <div className="tool-grid">
          <button className="tool-btn">
            <span className="tool-icon">🎨</span>
            <span className="tool-name">Messy Canvas</span>
            <span className="tool-desc">Make art with no rules</span>
          </button>
          <button className="tool-btn">
            <span className="tool-icon">🎵</span>
            <span className="tool-name">Noise Maker</span>
            <span className="tool-desc">Create sounds that make YOU happy</span>
          </button>
          <button className="tool-btn">
            <span className="tool-icon">✍️</span>
            <span className="tool-name">Word Vomit</span>
            <span className="tool-desc">Write without editing</span>
          </button>
          <button className="tool-btn">
            <span className="tool-icon">💃</span>
            <span className="tool-name">Weird Dance</span>
            <span className="tool-desc">Move how your body wants</span>
          </button>
        </div>
      </div>

      <div className="safe-space">
        <h2>This is a Safe Space for:</h2>
        <div className="safe-for">
          <span className="safe-badge">Weirdos</span>
          <span className="safe-badge">Dreamers</span>
          <span className="safe-badge">Too-Much People</span>
          <span className="safe-badge">Sensitive Souls</span>
          <span className="safe-badge">Rule Breakers</span>
          <span className="safe-badge">Joy Seekers</span>
          <span className="safe-badge">Inner Children</span>
          <span className="safe-badge">Free Spirits</span>
        </div>
      </div>

      <div className="liberation-ceremony">
        <h2>Ready to Break Free?</h2>
        <button onClick={shareLiberation} className="liberation-btn">
          🕊️ DECLARE YOUR FREEDOM! 🕊️
        </button>
        <p className="whisper">
          (whisper: the secret is that you were always free, 
          you just needed someone to remind you)
        </p>
      </div>

      <div className="portal-exit">
        <p>Now go forth and CREATE!</p>
        <p>Make messy, joyful, weird, wonderful things!</p>
        <p>The world needs what only YOU can make 💕</p>
      </div>
    </div>
  );
};

export default LiberationPortal;