import React, { useState, useRef } from 'react';
import '../styles/DragDropMemeCreator.css';

const DragDropMemeCreator: React.FC = () => {
  const [elements, setElements] = useState<any[]>([]);
  const [dragging, setDragging] = useState<any>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Pre-made meme elements you can just DRAG IN
  const memeLibrary = {
    faces: ['😂', '💀', '🤡', '😳', '🗿', '👁️', '😔', '🥺'],
    text: ['BOTTOM TEXT', 'BRUH', 'NO CAP', 'FR FR', 'SUS', 'E'],
    images: ['drake1', 'drake2', 'doge', 'pepe', 'wojak', 'chad'],
    effects: ['lens-flare', 'deep-fry', 'rainbow', 'glitch']
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('text');
    const rect = canvasRef.current?.getBoundingClientRect();
    
    if (rect) {
      const newElement = {
        id: Date.now(),
        content: data,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        scale: 1,
        rotation: 0
      };
      setElements([...elements, newElement]);
    }
  };

  const quickActions = {
    'NUKE IT': () => {
      // Add 20 random emojis instantly
      const emojis = ['💥', '🔥', '💀', '😂', '🅱️'];
      for (let i = 0; i < 20; i++) {
        setTimeout(() => {
          setElements(prev => [...prev, {
            id: Date.now() + i,
            content: emojis[Math.floor(Math.random() * emojis.length)],
            x: Math.random() * 400,
            y: Math.random() * 400,
            scale: Math.random() * 2 + 0.5,
            rotation: Math.random() * 360
          }]);
        }, i * 50);
      }
    },
    'BASS BOOST': () => {
      // Make everything BIGGER and SHAKE
      setElements(prev => prev.map(el => ({
        ...el,
        scale: el.scale * 1.5,
        rotation: el.rotation + (Math.random() - 0.5) * 45
      })));
    },
    'TIME WARP': () => {
      // Duplicate everything with offset
      setElements(prev => [
        ...prev,
        ...prev.map(el => ({
          ...el,
          id: el.id + 1000,
          x: el.x + 20,
          y: el.y + 20,
          opacity: 0.5
        }))
      ]);
    }
  };

  return (
    <div className="drag-drop-creator">
      <h2>JUST DRAG STUFF! NO THINK! ONLY MEME!</h2>
      
      <div className="meme-parts">
        {Object.entries(memeLibrary).map(([category, items]) => (
          <div key={category} className="part-category">
            <h3>{category.toUpperCase()}</h3>
            <div className="draggable-items">
              {items.map(item => (
                <div
                  key={item}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text', item)}
                  className="drag-item"
                >
                  {category === 'faces' ? item : 
                   category === 'text' ? <span className="meme-text">{item}</span> :
                   <div className={`meme-img ${item}`} />}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div 
        ref={canvasRef}
        className="meme-drop-zone"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {elements.length === 0 && (
          <p className="drop-hint">DRAG STUFF HERE!</p>
        )}
        
        {elements.map(el => (
          <div
            key={el.id}
            className="dropped-element"
            style={{
              left: el.x,
              top: el.y,
              transform: `scale(${el.scale}) rotate(${el.rotation}deg)`,
              opacity: el.opacity || 1
            }}
          >
            {el.content}
          </div>
        ))}
      </div>

      <div className="instant-chaos">
        <h3>ONE-CLICK CHAOS:</h3>
        {Object.entries(quickActions).map(([name, action]) => (
          <button key={name} onClick={action} className="chaos-button">
            {name}
          </button>
        ))}
      </div>

      <div className="share-section">
        <button className="rainbow-button">
          SHIP IT! 🚀
        </button>
      </div>
    </div>
  );
};

export default DragDropMemeCreator;