'use client';

import { useState } from 'react';
import { LiveAmbientSlicer } from '@/components/LiveAmbientSlicer';
import { Home, Github } from 'lucide-react';
import Link from 'next/link';

export default function ClassicPage() {
  // Simple controls for LiveAmbientSlicer
  const [chaos] = useState({ x: 0.5, y: 0.5 });
  const [reverb] = useState(0.5);
  const [delay] = useState(0.3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">R2DJ</h1>
          <div className="flex items-center gap-4">
            <a 
              href="https://github.com/allinfinite/R2DJ" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white/70 hover:text-white transition-colors"
              title="View on GitHub"
            >
              <Github size={20} />
            </a>
            <Link href="/" className="text-white/70 hover:text-white transition-colors" title="Home">
              <Home size={20} />
            </Link>
          </div>
        </div>

        {/* Live Ambient Instructions */}
        <div className="mb-4 p-4 bg-green-500/20 border border-green-400/30 rounded-lg">
          <h3 className="text-white font-semibold mb-2">🌊 R2DJ Live Ambient Mode</h3>
          <p className="text-white/80 text-sm">
            Click &quot;START LIVE&quot; to begin continuous listening! R2DJ will automatically slice sounds from your environment and create ambient feedback loops in real-time.
          </p>
        </div>

        {/* Live Ambient Slicer - Full Width */}
        <div className="max-w-4xl mx-auto">
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
  );
} 