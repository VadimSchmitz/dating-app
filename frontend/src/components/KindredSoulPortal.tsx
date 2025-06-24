import React, { useState, useEffect } from 'react';
import '../styles/KindredSoulPortal.css';

const KindredSoulPortal: React.FC = () => {
  const [soulColor, setSoulColor] = useState('#ff6b9d');
  const [vibe, setVibe] = useState('');
  const [secretWord, setSecretWord] = useState('');
  const [foundSouls, setFoundSouls] = useState<any[]>([]);
  const [universalMessage, setUniversalMessage] = useState('');
  
  const vibes = [
    '✨ Sparkly Chaos ✨',
    '🌈 Rainbow Dreamer 🌈',
    '🐱 Kitty Whisperer 🐱',
    '🫧 Bubble Soul 🫧',
    '💫 Stardust Being 💫',
    '🎨 Color Outside Lines 🎨',
    '🌸 Soft Chaos 🌸',
    '⚡ Electric Joy ⚡'
  ];

  const secretWords = [
    'meow', 'nya', 'purr', ':3', 'uwu', 'wheee', 
    'boop', 'floof', 'beans', 'blep', 'mlem', 'henlo'
  ];

  useEffect(() => {
    // Set random vibe on load
    setVibe(vibes[Math.floor(Math.random() * vibes.length)]);
    
    // Soul color changes with mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      const hue = (e.clientX / window.innerWidth) * 360;
      const lightness = 50 + (e.clientY / window.innerHeight) * 20;
      setSoulColor(`hsl(${hue}, 70%, ${lightness}%)`);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const checkSecretWord = (word: string) => {
    if (secretWords.includes(word.toLowerCase())) {
      // They're one of us! :3
      const newSoul = {
        id: Date.now(),
        word,
        time: new Date().toLocaleTimeString(),
        sparkle: '✨'
      };
      setFoundSouls([...foundSouls, newSoul]);
      
      // Celebration!
      createCelebration();
    }
  };

  const createCelebration = () => {
    // This would trigger amazing animations
    document.body.classList.add('soul-celebration');
    setTimeout(() => {
      document.body.classList.remove('soul-celebration');
    }, 3000);
  };

  const sendUniversalLove = () => {
    const messages = [
      'Sending kitty hugs to all beings! 🐱💕',
      'May your day be filled with bubbles and joy! 🫧',
      'You are loved, you are valid, you are AMAZING! 🌈',
      'Remember to drink water and pet a cat! :3',
      'Your vibe attracts your tribe! ✨',
      'Sprinkling magic dust on everyone! 💫',
      'Free hugs for all souls! 🤗',
      'nya~ sending good vibes only! 😊'
    ];
    
    const msg = messages[Math.floor(Math.random() * messages.length)];
    setUniversalMessage(msg);
    
    // Message floats away after 5 seconds
    setTimeout(() => setUniversalMessage(''), 5000);
  };

  return (
    <div className="kindred-soul-portal" style={{ backgroundColor: soulColor }}>
      <div className="portal-header">
        <h1>Welcome, Beautiful Soul! 💕</h1>
        <p>This space exists for those who understand that joy should be free</p>
      </div>

      <div className="soul-detector">
        <h2>Your Current Vibe: {vibe}</h2>
        <p>Move your mouse to change your soul color!</p>
      </div>

      <div className="secret-word-box">
        <h3>Whisper a secret word...</h3>
        <input
          type="text"
          placeholder="Type something that makes you happy..."
          value={secretWord}
          onChange={(e) => setSecretWord(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              checkSecretWord(secretWord);
              setSecretWord('');
            }
          }}
        />
        <p className="hint">(hint: what sound does a happy cat make?)</p>
      </div>

      <div className="found-souls">
        <h3>Kindred Souls Who Found This Place:</h3>
        <div className="soul-list">
          {foundSouls.map(soul => (
            <div key={soul.id} className="soul-entry">
              {soul.sparkle} Someone said "{soul.word}" at {soul.time}
            </div>
          ))}
        </div>
      </div>

      <div className="universal-love">
        <button onClick={sendUniversalLove} className="love-button">
          Send Love to the Universe 💗
        </button>
        {universalMessage && (
          <div className="floating-message">
            {universalMessage}
          </div>
        )}
      </div>

      <div className="soul-garden">
        <h2>Plant Seeds of Joy 🌱</h2>
        <div className="joy-seeds">
          <button className="seed">🌸 Kindness</button>
          <button className="seed">🌈 Acceptance</button>
          <button className="seed">✨ Wonder</button>
          <button className="seed">💕 Love</button>
          <button className="seed">🎨 Creativity</button>
          <button className="seed">🫧 Playfulness</button>
        </div>
        <p>Click to plant these in someone's day!</p>
      </div>

      <div className="connection-ripple">
        <h2>We Are All Connected 🕸️✨</h2>
        <div className="ripple-visualization">
          <div className="ripple you">You</div>
          <div className="ripple friend">Your Friend</div>
          <div className="ripple stranger">A Stranger</div>
          <div className="ripple everyone">Everyone</div>
        </div>
        <p>Every smile creates ripples of joy</p>
      </div>

      <div className="leave-gift">
        <h3>Leave a Gift for the Next Soul:</h3>
        <div className="gift-options">
          <button>🎁 Mystery Box</button>
          <button>🌟 Lucky Star</button>
          <button>🍪 Virtual Cookie</button>
          <button>📜 Kind Note</button>
          <button>🔮 Fortune</button>
        </div>
      </div>

      <div className="portal-footer">
        <p>This place exists because people like you make the world brighter</p>
        <p>No ads, no tracking, no catch - just love</p>
        <p>Share only with those who would understand 💕</p>
      </div>
    </div>
  );
};

export default KindredSoulPortal;