import React, { useState, useEffect } from 'react';
import '../styles/AccessibilitySettings.css';

interface AccessibilitySettingsProps {
  onComplete?: () => void;
  isFirstTime?: boolean;
}

const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({ 
  onComplete, 
  isFirstTime = false 
}) => {
  const [settings, setSettings] = useState({
    reduceMotion: false,
    highContrast: false,
    largeText: false,
    simpleMode: false,
    reduceEmojis: false,
    screenReaderMode: false,
    colorBlindMode: 'none',
    bubbleIntensity: 'normal',
    soundsEnabled: true,
    soundVolume: 0.5,
    rainbowMode: false
  });

  useEffect(() => {
    // Load saved settings
    const savedSettings = localStorage.getItem('accessibilitySettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const applySettings = () => {
    // Save settings
    localStorage.setItem('accessibilitySettings', JSON.stringify(settings));
    
    // Apply CSS classes to root
    const root = document.documentElement;
    root.classList.toggle('reduce-motion', settings.reduceMotion);
    root.classList.toggle('high-contrast', settings.highContrast);
    root.classList.toggle('large-text', settings.largeText);
    root.classList.toggle('simple-mode', settings.simpleMode);
    root.classList.toggle('reduce-emojis', settings.reduceEmojis);
    root.classList.toggle('screen-reader', settings.screenReaderMode);
    
    // Color blind modes
    root.classList.remove('protanopia', 'deuteranopia', 'tritanopia');
    if (settings.colorBlindMode !== 'none') {
      root.classList.add(settings.colorBlindMode);
    }
    
    // Bubble intensity
    root.setAttribute('data-bubble-intensity', settings.bubbleIntensity);
    
    // Rainbow mode
    root.classList.toggle('rainbow-mode', settings.rainbowMode);
    
    if (onComplete) {
      onComplete();
    }
  };

  const handleSettingChange = (setting: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  return (
    <div className={`accessibility-container ${isFirstTime ? 'first-time' : ''}`}>
      {isFirstTime && (
        <div className="welcome-header">
          <h1>Welcome to Co-Creation Dating! :3</h1>
          <p>Let's make sure the app works perfectly for you 💕</p>
        </div>
      )}
      
      <div className="accessibility-content">
        <h2>Accessibility Options</h2>
        
        <div className="settings-section">
          <h3>Visual Comfort</h3>
          
          <label className="setting-item">
            <input
              type="checkbox"
              checked={settings.reduceMotion}
              onChange={(e) => handleSettingChange('reduceMotion', e.target.checked)}
            />
            <div className="setting-info">
              <span className="setting-name">Reduce Motion</span>
              <span className="setting-desc">Less animations and movements</span>
            </div>
          </label>
          
          <label className="setting-item">
            <input
              type="checkbox"
              checked={settings.highContrast}
              onChange={(e) => handleSettingChange('highContrast', e.target.checked)}
            />
            <div className="setting-info">
              <span className="setting-name">High Contrast</span>
              <span className="setting-desc">Stronger colors for better visibility</span>
            </div>
          </label>
          
          <label className="setting-item">
            <input
              type="checkbox"
              checked={settings.largeText}
              onChange={(e) => handleSettingChange('largeText', e.target.checked)}
            />
            <div className="setting-info">
              <span className="setting-name">Large Text</span>
              <span className="setting-desc">Bigger, easier to read text</span>
            </div>
          </label>
        </div>
        
        <div className="settings-section">
          <h3>Sensory Preferences</h3>
          
          <label className="setting-item">
            <input
              type="checkbox"
              checked={settings.simpleMode}
              onChange={(e) => handleSettingChange('simpleMode', e.target.checked)}
            />
            <div className="setting-info">
              <span className="setting-name">Simple Mode</span>
              <span className="setting-desc">Less visual clutter, cleaner interface</span>
            </div>
          </label>
          
          <label className="setting-item">
            <input
              type="checkbox"
              checked={settings.reduceEmojis}
              onChange={(e) => handleSettingChange('reduceEmojis', e.target.checked)}
            />
            <div className="setting-info">
              <span className="setting-name">Reduce Emojis</span>
              <span className="setting-desc">Show fewer decorative emojis</span>
            </div>
          </label>
          
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-name">Bubble Intensity</span>
              <span className="setting-desc">How many bubbles do you want? :3</span>
            </div>
            <div className="bubble-options">
              <button 
                className={settings.bubbleIntensity === 'none' ? 'active' : ''}
                onClick={() => handleSettingChange('bubbleIntensity', 'none')}
              >
                None
              </button>
              <button 
                className={settings.bubbleIntensity === 'minimal' ? 'active' : ''}
                onClick={() => handleSettingChange('bubbleIntensity', 'minimal')}
              >
                Minimal
              </button>
              <button 
                className={settings.bubbleIntensity === 'normal' ? 'active' : ''}
                onClick={() => handleSettingChange('bubbleIntensity', 'normal')}
              >
                Normal 🫧
              </button>
              <button 
                className={settings.bubbleIntensity === 'party' ? 'active' : ''}
                onClick={() => handleSettingChange('bubbleIntensity', 'party')}
              >
                Party! 🎉
              </button>
            </div>
          </div>
        </div>
        
        <div className="settings-section">
          <h3>Fun Features</h3>
          
          <label className="setting-item">
            <input
              type="checkbox"
              checked={settings.rainbowMode}
              onChange={(e) => handleSettingChange('rainbowMode', e.target.checked)}
            />
            <div className="setting-info">
              <span className="setting-name">Rainbow Mode 🌈</span>
              <span className="setting-desc">Extra colorful fun!</span>
            </div>
          </label>
          
          <label className="setting-item">
            <input
              type="checkbox"
              checked={settings.soundsEnabled}
              onChange={(e) => handleSettingChange('soundsEnabled', e.target.checked)}
            />
            <div className="setting-info">
              <span className="setting-name">Cute Sounds 🎵</span>
              <span className="setting-desc">Enable sound effects</span>
            </div>
          </label>
          
          {settings.soundsEnabled && (
            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-name">Volume</span>
                <span className="setting-desc">Adjust sound volume</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.soundVolume}
                onChange={(e) => handleSettingChange('soundVolume', parseFloat(e.target.value))}
                style={{ width: '100%', marginTop: '10px' }}
              />
              <span style={{ display: 'block', textAlign: 'center', marginTop: '5px' }}>
                {Math.round(settings.soundVolume * 100)}%
              </span>
            </div>
          )}
        </div>
        
        <div className="settings-section">
          <h3>Color Vision</h3>
          
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-name">Color Blind Mode</span>
              <span className="setting-desc">Adjust colors for better distinction</span>
            </div>
            <select 
              value={settings.colorBlindMode}
              onChange={(e) => handleSettingChange('colorBlindMode', e.target.value)}
              className="color-select"
            >
              <option value="none">None</option>
              <option value="protanopia">Protanopia (Red-Green)</option>
              <option value="deuteranopia">Deuteranopia (Red-Green)</option>
              <option value="tritanopia">Tritanopia (Blue-Yellow)</option>
            </select>
          </div>
          
          <label className="setting-item">
            <input
              type="checkbox"
              checked={settings.screenReaderMode}
              onChange={(e) => handleSettingChange('screenReaderMode', e.target.checked)}
            />
            <div className="setting-info">
              <span className="setting-name">Screen Reader Optimized</span>
              <span className="setting-desc">Better compatibility with screen readers</span>
            </div>
          </label>
        </div>
        
        <div className="preview-section">
          <h3>Preview</h3>
          <div className="preview-box">
            <div className="preview-text">This is how text will look</div>
            <div className="preview-bubbles">
              {settings.bubbleIntensity !== 'none' && !settings.reduceMotion && (
                <>
                  <span className="bubble small"></span>
                  <span className="bubble medium"></span>
                  <span className="bubble large"></span>
                </>
              )}
            </div>
            {!settings.reduceEmojis && (
              <div className="preview-emojis">😊 💕 🫧 :3</div>
            )}
          </div>
        </div>
        
        <div className="action-buttons">
          <button onClick={applySettings} className="apply-btn">
            {isFirstTime ? "Let's Go! 🚀" : "Apply Settings"}
          </button>
          {!isFirstTime && (
            <button onClick={() => window.history.back()} className="cancel-btn">
              Cancel
            </button>
          )}
        </div>
        
        <div className="kitty-helper">
          <span className="kitty">^._.^</span>
          <p>Don't worry, you can change these anytime in settings!</p>
        </div>
      </div>
    </div>
  );
};

export default AccessibilitySettings;