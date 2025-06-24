import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import Matches from './components/Matches';
import Connections from './components/Connections';
import Messages from './components/Messages';
import Premium from './components/Premium';
import FoamParty from './components/FoamParty';
import FunFinder from './components/FunFinder';
import AccessibilitySettings from './components/AccessibilitySettings';
import BubbleBackground from './components/BubbleBackground';
import RainbowMode from './components/RainbowMode';
import SoundManager from './components/SoundManager';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

function PrivateRoute({ children }: { children: React.ReactElement }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" />;
}

function App() {
  const [showAccessibility, setShowAccessibility] = useState(false);

  useEffect(() => {
    // Check if this is the first visit
    const hasSeenAccessibility = localStorage.getItem('hasSeenAccessibility');
    if (!hasSeenAccessibility) {
      setShowAccessibility(true);
    }

    // Apply saved accessibility settings
    const savedSettings = localStorage.getItem('accessibilitySettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      const root = document.documentElement;
      
      root.classList.toggle('reduce-motion', settings.reduceMotion);
      root.classList.toggle('high-contrast', settings.highContrast);
      root.classList.toggle('large-text', settings.largeText);
      root.classList.toggle('simple-mode', settings.simpleMode);
      root.classList.toggle('reduce-emojis', settings.reduceEmojis);
      root.classList.toggle('screen-reader', settings.screenReaderMode);
      
      if (settings.colorBlindMode !== 'none') {
        root.classList.add(settings.colorBlindMode);
      }
      
      root.setAttribute('data-bubble-intensity', settings.bubbleIntensity || 'normal');
      root.classList.toggle('rainbow-mode', settings.rainbowMode || false);
    }
  }, []);

  const handleAccessibilityComplete = () => {
    localStorage.setItem('hasSeenAccessibility', 'true');
    setShowAccessibility(false);
  };

  if (showAccessibility) {
    return <AccessibilitySettings isFirstTime={true} onComplete={handleAccessibilityComplete} />;
  }

  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/matches" element={<PrivateRoute><Matches /></PrivateRoute>} />
            <Route path="/connections" element={<PrivateRoute><Connections /></PrivateRoute>} />
            <Route path="/messages/:matchId" element={<PrivateRoute><Messages /></PrivateRoute>} />
            <Route path="/premium" element={<PrivateRoute><Premium /></PrivateRoute>} />
            <Route path="/foam-party" element={<PrivateRoute><FoamParty /></PrivateRoute>} />
            <Route path="/fun-finder" element={<PrivateRoute><FunFinder /></PrivateRoute>} />
            <Route path="/accessibility" element={<AccessibilitySettings />} />
          </Routes>
        </div>
        <BubbleBackground />
        <RainbowMode />
        <SoundManager />
      </Router>
    </AuthProvider>
  );
}

export default App;
