import React, { useEffect, useState } from 'react';
import '../styles/HeartExplosion.css';

interface HeartExplosionProps {
  trigger: boolean;
  onComplete?: () => void;
}

const HeartExplosion: React.FC<HeartExplosionProps> = ({ trigger, onComplete }) => {
  const [hearts, setHearts] = useState<Array<{ id: number; x: number; y: number; size: number; delay: number }>>([]);
  const [isExploding, setIsExploding] = useState(false);

  useEffect(() => {
    if (trigger && !isExploding) {
      setIsExploding(true);
      
      // Create hearts
      const newHearts = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: 50 + (Math.random() - 0.5) * 30,
        y: 50 + (Math.random() - 0.5) * 30,
        size: Math.random() * 30 + 20,
        delay: Math.random() * 0.3
      }));
      
      setHearts(newHearts);
      
      // Clean up after animation
      setTimeout(() => {
        setHearts([]);
        setIsExploding(false);
        if (onComplete) onComplete();
      }, 3000);
    }
  }, [trigger, isExploding, onComplete]);

  if (hearts.length === 0) return null;

  return (
    <div className="heart-explosion-container">
      {hearts.map(heart => (
        <div
          key={heart.id}
          className="explosion-heart"
          style={{
            left: `${heart.x}%`,
            top: `${heart.y}%`,
            width: `${heart.size}px`,
            height: `${heart.size}px`,
            animationDelay: `${heart.delay}s`
          }}
        >
          💕
        </div>
      ))}
      <div className="match-text">It's a Match! :3</div>
    </div>
  );
};

export default HeartExplosion;