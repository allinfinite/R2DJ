'use client';

import { useState } from 'react';
import { TreePine, Sparkles, Zap, Waves, Sun, ChevronDown, ChevronUp } from 'lucide-react';

interface MoodPacksProps {
  selectedPack: string;
  onPackChange: (pack: string) => void;
}

export function MoodPacks({ selectedPack, onPackChange }: MoodPacksProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const moodPacks = [
    {
      id: 'mushroom-forest',
      name: 'Mushroom Forest',
      description: 'Earthy, mycelial, rhythmic heartbeats',
      icon: TreePine,
      color: 'from-green-600 to-brown-600',
      bgColor: 'bg-green-500/20',
      textColor: 'text-green-300',
      tags: ['Organic', 'Grounding', 'Natural']
    },
    {
      id: 'cosmic-temple',
      name: 'Cosmic Temple',
      description: 'Ambient drones, reverb-heavy crystalline',
      icon: Sparkles,
      color: 'from-purple-600 to-blue-600',
      bgColor: 'bg-purple-500/20',
      textColor: 'text-purple-300',
      tags: ['Ethereal', 'Spacious', 'Mystical']
    },
    {
      id: 'alien-cathedral',
      name: 'Alien Cathedral',
      description: 'Synthetic chimes, glitch-techno echoes',
      icon: Zap,
      color: 'from-cyan-600 to-pink-600',
      bgColor: 'bg-cyan-500/20',
      textColor: 'text-cyan-300',
      tags: ['Futuristic', 'Electronic', 'Experimental']
    },
    {
      id: 'womb-cave',
      name: 'Womb Cave',
      description: 'Deep pulses, cave echoes, low sub bass',
      icon: Waves,
      color: 'from-red-800 to-orange-700',
      bgColor: 'bg-red-500/20',
      textColor: 'text-red-300',
      tags: ['Primal', 'Deep', 'Resonant']
    },
    {
      id: 'lucid-playground',
      name: 'Lucid Playground',
      description: 'Bright plucks, jazzy swing, warm pads',
      icon: Sun,
      color: 'from-yellow-500 to-pink-500',
      bgColor: 'bg-yellow-500/20',
      textColor: 'text-yellow-300',
      tags: ['Playful', 'Bright', 'Joyful']
    }
  ];

  const selectedPackData = moodPacks.find(pack => pack.id === selectedPack) || moodPacks[1];

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Mood Packs</h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Currently Selected Pack */}
      <div className={`rounded-lg p-4 mb-4 bg-gradient-to-r ${selectedPackData.color} text-white`}>
        <div className="flex items-center gap-3 mb-2">
          <selectedPackData.icon size={24} />
          <div>
            <div className="font-semibold">{selectedPackData.name}</div>
            <div className="text-sm text-white/80">{selectedPackData.description}</div>
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          {selectedPackData.tags.map(tag => (
            <span
              key={tag}
              className="px-2 py-1 text-xs bg-white/20 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Pack Selection */}
      {isExpanded && (
        <div className="space-y-2">
          <div className="text-sm text-gray-300 mb-3">Choose Your Journey:</div>
          {moodPacks.map((pack) => (
            <button
              key={pack.id}
              onClick={() => onPackChange(pack.id)}
              className={`w-full p-3 rounded-lg transition-all text-left ${
                selectedPack === pack.id
                  ? pack.bgColor + ' ' + pack.textColor + ' ring-2 ring-current'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <pack.icon size={20} />
                <div className="flex-1">
                  <div className="font-medium">{pack.name}</div>
                  <div className="text-xs opacity-80">{pack.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Active Pack</div>
            <div className="font-medium">{selectedPackData.name}</div>
          </div>
          <div>
            <div className="text-gray-400">Total Packs</div>
            <div className="font-medium">{moodPacks.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
} 