import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import '../styles/BubbleBackground.css';

interface Bubble {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
}

const BubbleBackground: React.FC = () => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [intensity, setIntensity] = useState('normal');
  const [kittyPosition, setKittyPosition] = useState({ x: 20, y: 80 });
  const animationRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Get bubble intensity from settings
    const settings = localStorage.getItem('accessibilitySettings');
    if (settings) {
      const parsed = JSON.parse(settings);
      setIntensity(parsed.bubbleIntensity || 'normal');
    }
    console.log('BubbleBackground mounted! Intensity:', intensity);

    // Watch for changes
    const observer = new MutationObserver(() => {
      const newIntensity = document.documentElement.getAttribute('data-bubble-intensity') || 'normal';
      setIntensity(newIntensity);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-bubble-intensity']
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const bubbleCount = {
      none: 0,
      minimal: 5,
      normal: 15,
      party: 30
    }[intensity] || 15;

    // Create bubbles with physics properties - ensure they're spread out
    const newBubbles: Bubble[] = Array.from({ length: bubbleCount }, (_, i) => {
      // Ensure bubbles start at different positions
      const angle = (i / bubbleCount) * Math.PI * 2;
      const radius = Math.min(window.innerWidth, window.innerHeight) * 0.3;
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      return {
        id: i,
        x: centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * 100,
        y: centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        size: Math.random() * 60 + 30,
        color: `hsla(${(i * 360 / bubbleCount) + Math.random() * 60}, 70%, 60%, 0.8)`
      };
    });

    setBubbles(newBubbles);
  }, [intensity]);

  useEffect(() => {
    if (intensity === 'none' || bubbles.length === 0) return;

    let frameCount = 0;
    const animate = () => {
      frameCount++;
      if (frameCount % 60 === 0) {
        console.log('Bubbles animating!', frameCount / 60, 'seconds');
      }
      
      setBubbles(prevBubbles => {
        const newBubbles = [...prevBubbles];
        
        // Update each bubble
        newBubbles.forEach((bubble, i) => {
          // Update position
          bubble.x += bubble.vx;
          bubble.y += bubble.vy;
          
          // Add slight upward drift for floaty feeling
          bubble.vy -= 0.02;
          
          // Bounce off walls
          if (bubble.x - bubble.size / 2 <= 0 || bubble.x + bubble.size / 2 >= window.innerWidth) {
            bubble.vx = -bubble.vx * 0.9; // Slight energy loss
            bubble.x = Math.max(bubble.size / 2, Math.min(window.innerWidth - bubble.size / 2, bubble.x));
          }
          
          if (bubble.y - bubble.size / 2 <= 0 || bubble.y + bubble.size / 2 >= window.innerHeight) {
            bubble.vy = -bubble.vy * 0.9;
            bubble.y = Math.max(bubble.size / 2, Math.min(window.innerHeight - bubble.size / 2, bubble.y));
          }
          
          // Keep velocity in bounds
          bubble.vx = Math.max(-5, Math.min(5, bubble.vx));
          bubble.vy = Math.max(-5, Math.min(5, bubble.vy));
          
          // Check collision with other bubbles
          for (let j = i + 1; j < newBubbles.length; j++) {
            const other = newBubbles[j];
            const dx = bubble.x - other.x;
            const dy = bubble.y - other.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = (bubble.size + other.size) / 2;
            
            if (distance < minDistance) {
              // Bubbles are colliding
              const angle = Math.atan2(dy, dx);
              const targetX = bubble.x + Math.cos(angle) * minDistance;
              const targetY = bubble.y + Math.sin(angle) * minDistance;
              const ax = (targetX - other.x) * 0.05;
              const ay = (targetY - other.y) * 0.05;
              
              bubble.vx += ax;
              bubble.vy += ay;
              other.vx -= ax;
              other.vy -= ay;
            }
          }
        });
        
        return newBubbles;
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [bubbles.length, intensity]);

  useEffect(() => {
    // Random kitty movement
    const moveKitty = () => {
      setKittyPosition({
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10
      });
    };

    const interval = setInterval(moveKitty, 8000);
    return () => clearInterval(interval);
  }, []);

  if (intensity === 'none') return null;

  // Create a portal to render at body level
  const container = document.getElementById('bubble-root') || document.body;
  
  return ReactDOM.createPortal(
    <div className="bubble-background">
      {bubbles.map(bubble => (
        <div
          key={bubble.id}
          className="bubble"
          style={{
            left: `${bubble.x}px`,
            top: `${bubble.y}px`,
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            background: bubble.color,
            position: 'absolute',
            transform: 'translate(-50%, -50%)',
            zIndex: 999999
          }}
        />
      ))}
      
      {intensity === 'party' && (
        <>
          <div className="floating-emoji" style={{ left: '10%', animationDelay: '0s' }}>💕</div>
          <div className="floating-emoji" style={{ left: '30%', animationDelay: '3s' }}>✨</div>
          <div className="floating-emoji" style={{ left: '50%', animationDelay: '5s' }}>🎉</div>
          <div className="floating-emoji" style={{ left: '70%', animationDelay: '7s' }}>🫧</div>
          <div className="floating-emoji" style={{ left: '90%', animationDelay: '2s' }}>:3</div>
        </>
      )}
      
      {/* Kitty is always visible unless intensity is none! */}
      <div 
        className="floating-kitty"
        style={{
          left: `${kittyPosition.x}%`,
          top: `${kittyPosition.y}%`
        }}
      >
        <span className="kitty-body">^._.^</span>
        <span className="kitty-speech">nya~</span>
      </div>
    </div>,
    container
  );
};

export default BubbleBackground;