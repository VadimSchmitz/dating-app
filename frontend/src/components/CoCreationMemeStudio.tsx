import React, { useState, useEffect, useRef } from 'react';
import '../styles/CoCreationMemeStudio.css';

interface MemeLayer {
  id: string;
  type: 'text' | 'image' | 'emoji' | 'drawing';
  content: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color?: string;
  fontSize?: number;
  addedBy: string;
}

const CoCreationMemeStudio: React.FC = () => {
  const [memeTemplate, setMemeTemplate] = useState('');
  const [layers, setLayers] = useState<MemeLayer[]>([]);
  const [selectedTool, setSelectedTool] = useState<'text' | 'emoji' | 'draw'>('text');
  const [isDeepFrying, setIsDeepFrying] = useState(false);
  const [distortionLevel, setDistortionLevel] = useState(0);
  const [collaborators, setCollaborators] = useState(['You']);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const memeTemplates = [
    { id: 'drake', name: 'Drake', emoji: '🤚😏👉😎' },
    { id: 'distracted', name: 'Distracted BF', emoji: '😍👀😱' },
    { id: 'brain', name: 'Expanding Brain', emoji: '🧠💡🌌🎆' },
    { id: 'fine', name: 'This is Fine', emoji: '🔥🐕☕🔥' },
    { id: 'stonks', name: 'Stonks', emoji: '📈' },
    { id: 'wojak', name: 'Wojak', emoji: '😔' },
    { id: 'custom', name: 'Blank Canvas', emoji: '🎨' }
  ];

  const chaosEmojis = [
    '😂', '💀', '🗿', '🅱️', 'ඞ', '📮', '🤡', '👁️', '🦀', '🅿️',
    '💯', '🔥', '😳', '🥶', '🤯', '👽', '🗣️', '❗', '‼️', '⁉️'
  ];

  const addTextLayer = (text: string) => {
    const newLayer: MemeLayer = {
      id: `layer-${Date.now()}`,
      type: 'text',
      content: text,
      x: Math.random() * 300 + 50,
      y: Math.random() * 300 + 50,
      rotation: (Math.random() - 0.5) * 30,
      scale: 1,
      color: '#FFFFFF',
      fontSize: 32,
      addedBy: collaborators[Math.floor(Math.random() * collaborators.length)]
    };
    setLayers([...layers, newLayer]);
  };

  const addEmoji = (emoji: string) => {
    const newLayer: MemeLayer = {
      id: `emoji-${Date.now()}`,
      type: 'emoji',
      content: emoji,
      x: Math.random() * 300 + 50,
      y: Math.random() * 300 + 50,
      rotation: Math.random() * 360,
      scale: 0.5 + Math.random() * 2,
      addedBy: 'Chaos itself'
    };
    setLayers([...layers, newLayer]);
  };

  const deepFryMeme = () => {
    setIsDeepFrying(true);
    setDistortionLevel(prev => Math.min(prev + 1, 10));
    
    // Add random emojis
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        addEmoji(chaosEmojis[Math.floor(Math.random() * chaosEmojis.length)]);
      }, i * 100);
    }
    
    // Add lens flares (as emojis lol)
    addEmoji('✨');
    addEmoji('💥');
    
    setTimeout(() => setIsDeepFrying(false), 1000);
  };

  const addRandomReaction = () => {
    const reactions = [
      'BRUH', 'NO CAP', 'FR FR', 'SHEEEESH', 'SUS', 'BASED',
      'POG', 'KEKW', 'OMEGALUL', 'MONKAS', 'PEPEGA', 'YEP',
      'WHO DID THIS 😂😂😂', 'IM CRYING', 'HELP-', 'PLS-',
      'BOTTOM TEXT', 'SOCIETY', 'E', 'AMOGUS'
    ];
    
    addTextLayer(reactions[Math.floor(Math.random() * reactions.length)]);
  };

  const makeSurreal = () => {
    // Duplicate and distort existing layers
    const newLayers = layers.map(layer => ({
      ...layer,
      id: `surreal-${layer.id}`,
      x: layer.x + (Math.random() - 0.5) * 100,
      y: layer.y + (Math.random() - 0.5) * 100,
      rotation: layer.rotation + Math.random() * 180,
      scale: layer.scale * (0.5 + Math.random()),
      color: `hsl(${Math.random() * 360}, 100%, 50%)`
    }));
    
    setLayers([...layers, ...newLayers]);
  };

  const saveAsMasterpiece = () => {
    console.log('Saving meme to the hall of fame...');
    // This would save and share the meme
    alert('MEME SAVED! It\'s beautiful... *chef\'s kiss*');
  };

  return (
    <div className={`meme-studio ${isDeepFrying ? 'deep-frying' : ''}`}>
      <h1>🎨 Co-Creation Meme Studio 🎨</h1>
      <p>Make cursed content with friends!</p>

      <div className="template-selector">
        <h3>Choose Your Fighter:</h3>
        <div className="template-grid">
          {memeTemplates.map(template => (
            <button
              key={template.id}
              onClick={() => setMemeTemplate(template.id)}
              className={`template-btn ${memeTemplate === template.id ? 'selected' : ''}`}
            >
              <span className="template-emoji">{template.emoji}</span>
              <span className="template-name">{template.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="meme-canvas-container">
        <div 
          className={`meme-canvas distortion-${distortionLevel}`}
          style={{
            filter: `contrast(${100 + distortionLevel * 20}%) 
                     saturate(${100 + distortionLevel * 50}%) 
                     hue-rotate(${distortionLevel * 36}deg)`
          }}
        >
          {memeTemplate && (
            <div className={`template-bg template-${memeTemplate}`} />
          )}
          
          {layers.map(layer => (
            <div
              key={layer.id}
              className={`meme-layer ${layer.type}`}
              style={{
                left: `${layer.x}px`,
                top: `${layer.y}px`,
                transform: `rotate(${layer.rotation}deg) scale(${layer.scale})`,
                color: layer.color,
                fontSize: layer.type === 'text' ? `${layer.fontSize}px` : `${layer.scale * 40}px`
              }}
            >
              {layer.content}
              <span className="added-by">by {layer.addedBy}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="meme-tools">
        <div className="quick-add">
          <h3>Quick Add:</h3>
          <button onClick={() => addTextLayer('TOP TEXT')} className="tool-btn">
            Add Top Text
          </button>
          <button onClick={() => addTextLayer('BOTTOM TEXT')} className="tool-btn">
            Add Bottom Text
          </button>
          <button onClick={addRandomReaction} className="tool-btn">
            Random Reaction
          </button>
        </div>

        <div className="emoji-bomb">
          <h3>Emoji Chaos:</h3>
          <div className="emoji-grid">
            {chaosEmojis.map(emoji => (
              <button
                key={emoji}
                onClick={() => addEmoji(emoji)}
                className="emoji-btn"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="chaos-controls">
          <h3>Chaos Level:</h3>
          <button onClick={deepFryMeme} className="chaos-btn deep-fry">
            🔥 DEEP FRY IT 🔥
          </button>
          <button onClick={makeSurreal} className="chaos-btn surreal">
            🌀 Make it SURREAL 🌀
          </button>
          <button onClick={() => setDistortionLevel(0)} className="chaos-btn reset">
            😇 Un-curse it 😇
          </button>
        </div>
      </div>

      <div className="collaboration-panel">
        <h3>Creating with:</h3>
        <div className="collaborator-list">
          {collaborators.map(collab => (
            <span key={collab} className="collaborator">{collab}</span>
          ))}
          <button 
            onClick={() => setCollaborators([...collaborators, `Anon${Math.floor(Math.random() * 9999)}`])}
            className="add-collab"
          >
            + Summon Friend
          </button>
        </div>
      </div>

      <div className="meme-actions">
        <button onClick={saveAsMasterpiece} className="save-btn">
          💾 Save this Masterpiece
        </button>
        <button onClick={() => setLayers([])} className="clear-btn">
          🗑️ Start Over
        </button>
        <button className="share-btn">
          📤 Inflict Upon Others
        </button>
      </div>

      <div className="meme-philosophy">
        <p>"Art is dead, dude" - Some philosopher, probably</p>
        <p>Current vibe: {distortionLevel > 5 ? 'ABSOLUTELY CURSED' : 
                         distortionLevel > 2 ? 'Mildly Concerning' : 
                         'Almost Normal'}</p>
      </div>
    </div>
  );
};

export default CoCreationMemeStudio;