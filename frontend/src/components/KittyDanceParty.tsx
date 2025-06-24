import React, { useState, useEffect } from 'react';
import '../styles/KittyDanceParty.css';

interface DancingKitty {
  id: string;
  face: string;
  color: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  danceMove: string;
}

const KittyDanceParty: React.FC<{ isActive: boolean; kittyColors: string[] }> = ({ isActive, kittyColors }) => {
  const [kitties, setKitties] = useState<DancingKitty[]>([]);
  const [beat, setBeat] = useState(0);
  const [confetti, setConfetti] = useState<any[]>([]);

  const danceMoves = ['bounce', 'spin', 'wiggle', 'hop', 'sway', 'moonwalk'];
  const kittyFaces = ['^w^', '>w<', '*w*', '^o^', 'owo', 'uwu'];
  
  useEffect(() => {
    if (!isActive) return;
    
    // Create dancing kitties
    const newKitties = kittyColors.map((color, i) => ({
      id: `kitty-${i}`,
      face: kittyFaces[Math.floor(Math.random() * kittyFaces.length)],
      color,
      x: 20 + (i * 30),
      y: 50,
      rotation: 0,
      scale: 1,
      danceMove: danceMoves[Math.floor(Math.random() * danceMoves.length)]
    }));
    
    setKitties(newKitties);
    
    // Create confetti
    const newConfetti = Array.from({ length: 50 }, (_, i) => ({
      id: `confetti-${i}`,
      x: Math.random() * 100,
      y: -10,
      rotation: Math.random() * 360,
      color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57'][Math.floor(Math.random() * 5)]
    }));
    
    setConfetti(newConfetti);
    
    // Beat animation
    const beatInterval = setInterval(() => {
      setBeat(b => b + 1);
    }, 500);
    
    return () => clearInterval(beatInterval);
  }, [isActive, kittyColors]);
  
  useEffect(() => {
    if (!isActive) return;
    
    // Update kitty positions on beat
    setKitties(prev => prev.map(kitty => {
      const move = {
        bounce: { y: 50 + Math.sin(beat * 0.5) * 20 },
        spin: { rotation: (beat * 45) % 360 },
        wiggle: { x: kitty.x + Math.sin(beat) * 5 },
        hop: { y: 50 + (beat % 2 === 0 ? -20 : 0) },
        sway: { rotation: Math.sin(beat * 0.3) * 15 },
        moonwalk: { x: (kitty.x - 0.5 + 100) % 100 }
      };
      
      return {
        ...kitty,
        ...move[kitty.danceMove as keyof typeof move],
        scale: 1 + Math.sin(beat * 0.8) * 0.1
      };
    }));
    
    // Update confetti
    setConfetti(prev => prev.map(c => ({
      ...c,
      y: (c.y + 2) % 110,
      rotation: (c.rotation + 5) % 360
    })));
  }, [beat, isActive]);
  
  if (!isActive) return null;
  
  return (
    <div className="kitty-dance-party">
      <div className="disco-ball" />
      
      <div className="dance-floor">
        {kitties.map(kitty => (
          <div
            key={kitty.id}
            className={`dancing-kitty ${kitty.danceMove}`}
            style={{
              left: `${kitty.x}%`,
              top: `${kitty.y}%`,
              transform: `rotate(${kitty.rotation}deg) scale(${kitty.scale})`,
              color: kitty.color
            }}
          >
            <div className="kitty-body">{kitty.face}</div>
            <div className="music-notes">♪ ♫</div>
          </div>
        ))}
      </div>
      
      {confetti.map(c => (
        <div
          key={c.id}
          className="confetti"
          style={{
            left: `${c.x}%`,
            top: `${c.y}%`,
            transform: `rotate(${c.rotation}deg)`,
            backgroundColor: c.color
          }}
        />
      ))}
      
      <div className="party-text">
        <h2>🎉 KITTY DANCE PARTY! 🎉</h2>
        <p>Your kitties are having so much fun together!</p>
      </div>
      
      <div className="dance-controls">
        <button className="dance-btn">🎵 Change Song</button>
        <button className="dance-btn">✨ More Effects</button>
        <button className="dance-btn">📸 Take Photo</button>
      </div>
    </div>
  );
};

export default KittyDanceParty;