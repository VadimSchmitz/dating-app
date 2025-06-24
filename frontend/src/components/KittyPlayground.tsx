import React, { useState, useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import '../styles/KittyPlayground.css';

interface PlaygroundKitty {
  id: string;
  userId: string;
  userName: string;
  name: string;
  face: string;
  color: string;
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  message?: string;
  isPlaying?: boolean;
}

interface Toy {
  id: string;
  type: string;
  x: number;
  y: number;
  inUse?: boolean;
}

const KittyPlayground: React.FC = () => {
  const [kitties, setKitties] = useState<Map<string, PlaygroundKitty>>(new Map());
  const [myKitty, setMyKitty] = useState<PlaygroundKitty | null>(null);
  const [toys, setToys] = useState<Toy[]>([]);
  const [messages, setMessages] = useState<{ text: string; from: string }[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const playgroundRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to playground server
    socketRef.current = io('/playground');
    
    // Initialize toys
    const initialToys: Toy[] = [
      { id: 'ball1', type: '⚽', x: 20, y: 30 },
      { id: 'yarn1', type: '🧶', x: 70, y: 50 },
      { id: 'mouse1', type: '🐭', x: 40, y: 70 },
      { id: 'feather1', type: '🪶', x: 60, y: 20 }
    ];
    setToys(initialToys);
    
    // Socket events
    socketRef.current.on('kitty-joined', (kitty: PlaygroundKitty) => {
      setKitties(prev => new Map(prev).set(kitty.id, kitty));
      addMessage(`${kitty.name} joined the playground!`);
    });
    
    socketRef.current.on('kitty-moved', ({ id, x, y }: { id: string; x: number; y: number }) => {
      setKitties(prev => {
        const updated = new Map(prev);
        const kitty = updated.get(id);
        if (kitty) {
          kitty.x = x;
          kitty.y = y;
          updated.set(id, kitty);
        }
        return updated;
      });
    });
    
    socketRef.current.on('kitty-left', (id: string) => {
      setKitties(prev => {
        const updated = new Map(prev);
        const kitty = updated.get(id);
        if (kitty) {
          addMessage(`${kitty.name} left the playground`);
          updated.delete(id);
        }
        return updated;
      });
    });
    
    socketRef.current.on('kitty-message', ({ id, message }: { id: string; message: string }) => {
      setKitties(prev => {
        const updated = new Map(prev);
        const kitty = updated.get(id);
        if (kitty) {
          kitty.message = message;
          updated.set(id, kitty);
          setTimeout(() => {
            kitty.message = undefined;
            setKitties(new Map(updated));
          }, 3000);
        }
        return updated;
      });
    });
    
    // Join playground
    joinPlayground();
    
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);
  
  const joinPlayground = () => {
    const kittyData: PlaygroundKitty = {
      id: `kitty-${Date.now()}`,
      userId: 'user123', // From auth
      userName: 'Player',
      name: 'My Kitty',
      face: '^w^',
      color: '#FFA500',
      x: 50,
      y: 50
    };
    
    setMyKitty(kittyData);
    socketRef.current?.emit('join-playground', kittyData);
  };
  
  const handlePlaygroundClick = (e: React.MouseEvent) => {
    if (!myKitty || !playgroundRef.current) return;
    
    const rect = playgroundRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setMyKitty(prev => prev ? { ...prev, x, y } : null);
    socketRef.current?.emit('move-kitty', { x, y });
  };
  
  const sendKittyMessage = (message: string) => {
    if (!myKitty || !message.trim()) return;
    
    socketRef.current?.emit('kitty-speak', message);
    setMyKitty(prev => prev ? { ...prev, message } : null);
    setTimeout(() => {
      setMyKitty(prev => prev ? { ...prev, message: undefined } : null);
    }, 3000);
  };
  
  const playWithToy = (toyId: string) => {
    if (!myKitty) return;
    
    const toy = toys.find(t => t.id === toyId);
    if (toy && !toy.inUse) {
      toy.inUse = true;
      setToys([...toys]);
      
      // Move kitty to toy
      setMyKitty(prev => prev ? { ...prev, x: toy.x, y: toy.y, isPlaying: true } : null);
      socketRef.current?.emit('play-with-toy', toyId);
      
      // Stop playing after 3 seconds
      setTimeout(() => {
        toy.inUse = false;
        setToys(toys => [...toys]);
        setMyKitty(prev => prev ? { ...prev, isPlaying: false } : null);
      }, 3000);
    }
  };
  
  const addMessage = (text: string, from = 'System') => {
    setMessages(prev => [...prev, { text, from }].slice(-10));
  };
  
  return (
    <div className="kitty-playground-container">
      <h1>🎮 Kitty Playground! 🎮</h1>
      <p>Click anywhere to move your kitty! Play with toys and meet other kitties!</p>
      
      <div 
        ref={playgroundRef}
        className="playground-area"
        onClick={handlePlaygroundClick}
      >
        {/* Toys */}
        {toys.map(toy => (
          <div
            key={toy.id}
            className={`playground-toy ${toy.inUse ? 'in-use' : ''}`}
            style={{ left: `${toy.x}%`, top: `${toy.y}%` }}
            onClick={(e) => {
              e.stopPropagation();
              playWithToy(toy.id);
            }}
          >
            {toy.type}
          </div>
        ))}
        
        {/* Other kitties */}
        {Array.from(kitties.values()).map(kitty => (
          <div
            key={kitty.id}
            className={`playground-kitty ${kitty.isPlaying ? 'playing' : ''}`}
            style={{ 
              left: `${kitty.x}%`, 
              top: `${kitty.y}%`,
              color: kitty.color
            }}
          >
            <div className="kitty-name">{kitty.name}</div>
            <div className="kitty-body">{kitty.face}</div>
            {kitty.message && (
              <div className="kitty-bubble">{kitty.message}</div>
            )}
          </div>
        ))}
        
        {/* My kitty */}
        {myKitty && (
          <div
            className={`playground-kitty my-kitty ${myKitty.isPlaying ? 'playing' : ''}`}
            style={{ 
              left: `${myKitty.x}%`, 
              top: `${myKitty.y}%`,
              color: myKitty.color
            }}
          >
            <div className="kitty-name">{myKitty.name} (You)</div>
            <div className="kitty-body">{myKitty.face}</div>
            {myKitty.message && (
              <div className="kitty-bubble">{myKitty.message}</div>
            )}
          </div>
        )}
        
        {/* Fun decorations */}
        <div className="playground-tree">🌳</div>
        <div className="playground-fountain">⛲</div>
        <div className="playground-flowers">🌸🌼🌻</div>
      </div>
      
      <div className="playground-controls">
        <div className="kitty-chat">
          <input
            type="text"
            placeholder="Make your kitty speak..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                sendKittyMessage(inputMessage);
                setInputMessage('');
              }
            }}
          />
          <button onClick={() => {
            sendKittyMessage(inputMessage);
            setInputMessage('');
          }}>
            Meow!
          </button>
        </div>
        
        <div className="quick-actions">
          <button onClick={() => sendKittyMessage('Meow!')}>😺 Meow</button>
          <button onClick={() => sendKittyMessage('Purrrr~')}>😻 Purr</button>
          <button onClick={() => sendKittyMessage('*plays*')}>🎮 Play</button>
          <button onClick={() => sendKittyMessage('Nya~')}>✨ Nya</button>
        </div>
      </div>
      
      <div className="playground-chat">
        <h3>Playground Activity</h3>
        <div className="activity-log">
          {messages.map((msg, i) => (
            <div key={i} className="activity-message">
              <span className="activity-from">{msg.from}:</span> {msg.text}
            </div>
          ))}
        </div>
      </div>
      
      <div className="playground-stats">
        <div className="stat">🐱 Kitties Online: {kitties.size + 1}</div>
        <div className="stat">🎮 Total Playtime: ∞</div>
        <div className="stat">💕 Friendships Made: {Math.floor(Math.random() * 100)}</div>
      </div>
    </div>
  );
};

export default KittyPlayground;