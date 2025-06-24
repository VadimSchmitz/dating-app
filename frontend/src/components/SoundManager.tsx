import React, { useEffect, useState } from 'react';

class SoundManagerClass {
  private sounds: { [key: string]: HTMLAudioElement } = {};
  public enabled: boolean = true;
  public volume: number = 0.5;

  constructor() {
    // Load sound preference
    const settings = localStorage.getItem('accessibilitySettings');
    if (settings) {
      const parsed = JSON.parse(settings);
      this.enabled = parsed.soundsEnabled !== false;
      this.volume = parsed.soundVolume || 0.5;
    }

    // Initialize sounds with data URLs for cute sound effects
    this.sounds = {
      bubble: this.createSound('data:audio/wav;base64,UklGRigBAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQBAACfAJuAmYCegJqAmYCegJmAnYCfAJuAmYCegJqAmYCegJmAnYCfAJuAmYCegJqAmYCegJmAnYCfAJuAmYCegJqAmYCegJmAnYCfAJuAmYCegJqAmYCegJmAnYCfAJuAmYCegJqAmYCegJmAnYCfAJuAmYCegJqAmYCegJmAnYCfAJuAmYCegJqAmYCegJmAnYCfAJuAmYCegJqAmYCegJmAnYCfAJuAmYCegJqAmYCegJmAnYCfAJuAmYCegJqAmYCegJmAnYCfAJuAmYCegJqAmYCegJmAnYCfAJuAmYCegJqAmYCegJmAnYCfAJuAmYCegJqAmYCegJmAnYCfAJuAmYCegJqAmYCegJmAnYCfAJuAmYCegJqAmYCegJmAnYCfAJuAmYCegJqAmYCegJmAnYCfAJuAmYCegJqAmYCegJmAnYCfAJuAmYCegJqAmYCegJmAnYCfAJuAmYCegJqAmYCegJmAnYCfAJuAmYCegJqAmYCegJmAnYA='),
      pop: this.createSound('data:audio/wav;base64,UklGRigBAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQBAADpAO4A8gDnAOEA5ADtAPEA6wDjAOAA4wDrAPAA7gDnAOEA4QDnAO4A8ADrAOMA4ADjAOsA8ADuAOcA4QDhAOcA7gDwAOsA4wDgAOMA6wDwAO4A5wDhAOEA5wDuAPAA6wDjAOAA4wDrAPAA7gDnAOEA4QDnAO4A8ADrAOMA4ADjAOsA8ADuAOcA4QDhAOcA7gDwAOsA4wDgAOMA6wDwAO4A5wDhAOEA5wDuAA=='),
      match: this.createSound('data:audio/wav;base64,UklGRigBAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQBAAC0/5X/ov+6/8f/wP+w/6L/rf/K/9f/0P+6/6z/t//V/+L/2v/D/7X/wP/e/+z/4//M/77/yf/n//X/7P/V/8f/0v/w//7/9f/e/9D/2//5/wgA/v/n/9n/5P8CAPD/1v+w/5P+zP0a/QD8A/s3+pj5UPlo+ef5m/qh+/f8aP7j/1sBnwLaA/sEAAYABwAIAA=='),
      heart: this.createSound('data:audio/wav;base64,UklGRigBAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQBAAD8/vr+Av8R/x//Jf8p/yz/Lf8s/yf/H/8U/wf/+f7p/tf+xP6v/pj+gP5n/kz+L/4S/vP90/2x/Y79af1B/Rj97PzA/JL8Y/wz/AL80Pud+2n7NPv++sf6kPpY+h/65vnv+Xn5Qfko+Vj50PkU+jD6Pvpi+qD64voT+0z7lPvn+zr8i'),
      click: this.createSound('data:audio/wav;base64,UklGRigBAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQBAACWAJYAlgCWAJYAlgCWAJYAlgCWAJYAlgCWAJYAlgCWAJYAlgCWAJYAlgCWAJYAlgCWAJYAlgCWAJYAlgCWAJYAlgCWAJYAlgCWAJYAlgCWAJYAlgCWAJYAlgCWAJYAlgCWAJYAlgCWAJYAlgCWAJYAlgCWAJYAlgCWAJYAlgCWAJYAlgCWAJYAlgCWAJYAlgCWAJYAlgCWAJYAlgCWAJYAlgCWAJYAlgCWAJYAlgCWAJYAlgCWAJYAlgCWAJYAlgCWAJYAlgCWAJYAlgCWAJYAlgCWAJYAlgCWAJYAlgCWAJYAlgCWAJYAlgCWAJYA'),
      nya: this.createSound('data:audio/wav;base64,UklGRigBAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQBAADoAP8AFQEjAS4BNQE4ATgBNAEsASEBEgEAAewA1gC+AKQAiABrAEwALADK/1D/s/4G/lL9mvzm+z37qvoq+r35Yvkb+eb4xPi1+Lf4yPjp+Br5Wvmq+Qr6ePoA+4L7Efys/Dr9y/1g/vb+jf8kALwAVQHvAYgCIgO9A1gE8gSMBSYGvwZXB+8HhwgeCbUJTArjCnoLEAymDDwN0g1n'),
      rainbow: this.createSound('data:audio/wav;base64,UklGRigBAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQBAAD4/wAABQAIAAsADQAPABAAEQARABEAEAAPAA0ACwAIAAUAAAD4/+//5v/d/9P/yf++/7P/p/+b/47/gf9z/2X/Vv9H/zj/KP8Y/wj/9/7m/tT+wv6w/p3+iv52/mL+Tv45/iT+Dv74/eH9yv2y/Zr9gv1p/VD9Nv0c/QH95vzL/K/8k/x2/Fn8O/wd/P77/vve+777n/uA+2D7QPsf+/76/fr5+vn4+fj5+Pn4+fj5+Pn4+fj5AA==')
    };
  }

  private createSound(dataUrl: string): HTMLAudioElement {
    const audio = new Audio(dataUrl);
    audio.volume = this.volume;
    return audio;
  }

  play(soundName: string) {
    if (!this.enabled) return;
    
    const sound = this.sounds[soundName];
    if (sound) {
      sound.currentTime = 0;
      sound.volume = this.volume;
      sound.play().catch(() => {}); // Ignore autoplay errors
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    this.updateSettings();
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    Object.values(this.sounds).forEach(sound => {
      sound.volume = this.volume;
    });
    this.updateSettings();
  }

  private updateSettings() {
    const settings = JSON.parse(localStorage.getItem('accessibilitySettings') || '{}');
    settings.soundsEnabled = this.enabled;
    settings.soundVolume = this.volume;
    localStorage.setItem('accessibilitySettings', JSON.stringify(settings));
  }
}

// Singleton instance
export const soundManager = new SoundManagerClass();

// React component for sound settings
const SoundManager: React.FC = () => {
  return null; // This component doesn't render anything
};

export default SoundManager;