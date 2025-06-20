'use client';

import { useState } from 'react';
import { ClassicAudioEngine } from '@/components/ClassicAudioEngine';
import { ClassicVoiceInput } from '@/components/ClassicVoiceInput';
import { Visualizer } from '@/components/Visualizer';
import { LiveAmbientSlicer } from '@/components/LiveAmbientSlicer';
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

        {/* Live Ambient Instructions */}
        <div className="mb-4 p-4 bg-green-500/20 border border-green-400/30 rounded-lg">
          <h3 className="text-white font-semibold mb-2">🌊 R2DJ Live Ambient Mode</h3>
          <p className="text-white/80 text-sm">
            Click "START LIVE" to begin continuous listening! R2DJ will automatically slice sounds from your environment and create ambient feedback loops in real-time.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left - Additional Controls & Visualizer */}
          <div className="space-y-4">
            
            {/* Simple Voice Input for other features */}
            <ClassicVoiceInput
              onVoiceVolume={setVoiceVolume}
              onVoiceCadence={setVoiceCadence}
              onKeywordTrigger={setKeywordTrigger}
            />

            {/* Visualizer */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4">
              <h3 className="text-white text-lg font-semibold mb-2 text-center">VISUALIZER</h3>
              <Visualizer
                audioData={audioData}
                isPlaying={isPlaying}
                emotion={{ valence: chaos.x, arousal: chaos.y }}
              />
            </div>
          </div>

          {/* Right - Live Ambient Slicer (now contains everything) */}
          <div>
            <LiveAmbientSlicer 
              chaosX={chaos.x}
              chaosY={chaos.y}
              reverbAmount={reverb}
              delayAmount={delay}
              bpm={120}
            />
          </div>

        </div>
      </div>
    </div>
  );
} 