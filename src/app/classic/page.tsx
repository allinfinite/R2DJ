'use client';

import { useState } from 'react';
import { ClassicAudioEngine } from '@/components/ClassicAudioEngine';
import { ClassicVoiceInput } from '@/components/ClassicVoiceInput';
import { Visualizer } from '@/components/Visualizer';
import { Play, Pause, Home } from 'lucide-react';
import Link from 'next/link';

export default function ClassicPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceVolume, setVoiceVolume] = useState(0);
  const [voiceCadence, setVoiceCadence] = useState<'slow' | 'medium' | 'fast'>('medium');
  const [keywordTrigger, setKeywordTrigger] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<number[]>([]);
  
  // Simple controls
  const [mood, setMood] = useState<'calm' | 'playful' | 'trippy' | 'intense'>('calm');
  const [chaos, setChaos] = useState({ x: 0.5, y: 0.5 }); // Chaos pad values
  const [reverb, setReverb] = useState(0.5);
  const [delay, setDelay] = useState(0.3);

  const handleChaosTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.touches[0].clientX - rect.left) / rect.width;
    const y = (e.touches[0].clientY - rect.top) / rect.height;
    setChaos({ x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) });
  };

  const handleChaosClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setChaos({ x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">R2DJ</h1>
          <Link href="/" className="text-white/70 hover:text-white transition-colors">
            <Home size={20} />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Left - Controls */}
          <div className="space-y-4">
            
            {/* Play/Stop */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`w-full p-6 rounded-xl font-bold text-xl transition-all flex items-center justify-center gap-3 ${
                isPlaying
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isPlaying ? <Pause size={32} /> : <Play size={32} />}
              {isPlaying ? 'STOP' : 'START'}
            </button>

            {/* Mood Buttons */}
            <div className="grid grid-cols-2 gap-2">
              {(['calm', 'trippy', 'playful', 'intense'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMood(m)}
                  className={`p-3 rounded-lg font-medium transition-all ${
                    mood === m
                      ? 'bg-white text-black'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {m.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Knobs */}
            <div className="space-y-3">
              <div>
                <label className="block text-white text-sm mb-1">REVERB</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={reverb}
                  onChange={(e) => setReverb(parseFloat(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-white text-sm mb-1">DELAY</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={delay}
                  onChange={(e) => setDelay(parseFloat(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Simple Voice Input */}
            <ClassicVoiceInput
              onVoiceVolume={setVoiceVolume}
              onVoiceCadence={setVoiceCadence}
              onKeywordTrigger={setKeywordTrigger}
            />
          </div>

          {/* Center - Chaos Pad */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4">
            <h3 className="text-white text-lg font-semibold mb-2 text-center">CHAOS PAD</h3>
            <div
              className="relative w-full aspect-square bg-gradient-to-br from-purple-600 via-pink-500 to-blue-500 rounded-lg cursor-crosshair overflow-hidden"
              onMouseDown={handleChaosClick}
              onMouseMove={(e) => {
                if (e.buttons === 1) { // Only if mouse is pressed
                  handleChaosClick(e);
                }
              }}
              onTouchStart={handleChaosTouch}
              onTouchMove={handleChaosTouch}
            >
              {/* Grid lines */}
              <div className="absolute inset-0">
                {[...Array(5)].map((_, i) => (
                  <div key={`h${i}`} className="absolute w-full h-px bg-white/20" style={{ top: `${i * 25}%` }} />
                ))}
                {[...Array(5)].map((_, i) => (
                  <div key={`v${i}`} className="absolute h-full w-px bg-white/20" style={{ left: `${i * 25}%` }} />
                ))}
              </div>
              
              {/* Chaos point */}
              <div
                className="absolute w-6 h-6 bg-white rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 border-2 border-black/20"
                style={{
                  left: `${chaos.x * 100}%`,
                  top: `${chaos.y * 100}%`,
                }}
              />
              
              {/* Labels */}
              <div className="absolute top-2 left-2 text-white text-xs font-medium">FILTER</div>
              <div className="absolute bottom-2 right-2 text-white text-xs font-medium">DISTORTION</div>
            </div>
            
            {/* Chaos values */}
            <div className="mt-2 text-center text-white/70 text-xs">
              X: {Math.round(chaos.x * 100)} | Y: {Math.round(chaos.y * 100)}
            </div>

            {/* Visualizer */}
            <div className="mt-4">
              <Visualizer
                audioData={audioData}
                isPlaying={isPlaying}
                emotion={{ valence: chaos.x, arousal: chaos.y }}
              />
            </div>
          </div>

          {/* Right - Audio Engine */}
          <div>
            <ClassicAudioEngine
              selectedMood={mood}
              voiceVolume={voiceVolume}
              voiceCadence={voiceCadence}
              keywordTrigger={keywordTrigger}
              isPlaying={isPlaying}
              masterVolume={0.7}
              onAudioData={setAudioData}
              chaosX={chaos.x}
              chaosY={chaos.y}
              reverbAmount={reverb}
              delayAmount={delay}
            />
          </div>

        </div>
      </div>
    </div>
  );
} 