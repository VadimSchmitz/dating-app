import React, { useEffect, useState } from 'react';
import '../styles/RainbowMode.css';

const RainbowMode: React.FC = () => {
  const [isRainbowMode, setIsRainbowMode] = useState(false);
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    // Check if rainbow mode is enabled
    const settings = JSON.parse(localStorage.getItem('accessibilitySettings') || '{}');
    setIsRainbowMode(settings.rainbowMode || false);

    // Watch for changes
    const observer = new MutationObserver(() => {
      const root = document.documentElement;
      const hasRainbow = root.classList.contains('rainbow-mode');
      setIsRainbowMode(hasRainbow);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isRainbowMode) {
      // Create sparkles
      const newSparkles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 5
      }));
      setSparkles(newSparkles);
    } else {
      setSparkles([]);
    }
  }, [isRainbowMode]);

  if (!isRainbowMode) return null;

  return (
    <div className="rainbow-overlay">
      <div className="rainbow-gradient"></div>
      {sparkles.map(sparkle => (
        <div
          key={sparkle.id}
          className="rainbow-sparkle"
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
            animationDelay: `${sparkle.delay}s`
          }}
        >
          ✨
        </div>
      ))}
    </div>
  );
};

export default RainbowMode;