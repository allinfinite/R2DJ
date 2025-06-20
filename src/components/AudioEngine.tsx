'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as Tone from 'tone';
import { Music, Volume2, VolumeX } from 'lucide-react';

interface AudioEngineProps {
  emotion: { valence: number; arousal: number };
  moodPack: string;
  isPlaying: boolean;
  onAudioData: (data: number[]) => void;
}

export function AudioEngine({ emotion, moodPack, isPlaying, onAudioData }: AudioEngineProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const synthsRef = useRef<{ [key: string]: Tone.Synth | Tone.PolySynth }>({});
  const analyserRef = useRef<Tone.Analyser | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Mood pack configurations
  const moodPacks = {
    'mushroom-forest': {
      name: 'Mushroom Forest',
      baseFreq: 60,
      waveform: 'sawtooth' as const,
      reverb: 0.8,
      color: 'from-green-500 to-brown-500'
    },
    'cosmic-temple': {
      name: 'Cosmic Temple',
      baseFreq: 80,
      waveform: 'sine' as const,
      reverb: 0.9,
      color: 'from-purple-500 to-blue-500'
    },
    'alien-cathedral': {
      name: 'Alien Cathedral',
      baseFreq: 100,
      waveform: 'triangle' as const,
      reverb: 0.7,
      color: 'from-cyan-500 to-pink-500'
    },
    'womb-cave': {
      name: 'Womb Cave',
      baseFreq: 40,
      waveform: 'sine' as const,
      reverb: 0.95,
      color: 'from-red-900 to-orange-800'
    },
    'lucid-playground': {
      name: 'Lucid Playground',
      baseFreq: 120,
      waveform: 'square' as const,
      reverb: 0.5,
      color: 'from-yellow-400 to-pink-400'
    }
  };

  const initializeAudio = async () => {
    try {
      await Tone.start();
      
      // Create reverb effect
      const reverb = new Tone.Reverb(4).toDestination();
      
      // Create analyzer for visualization
      analyserRef.current = new Tone.Analyser('fft', 256);
      analyserRef.current.connect(reverb);

      // Initialize synthesizers for different layers
      synthsRef.current = {
        bass: new Tone.Synth({
          oscillator: { type: 'sine' },
          envelope: { attack: 0.5, decay: 0.3, sustain: 0.8, release: 2 }
        }).connect(analyserRef.current),
        
        pad: new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'sawtooth' },
          envelope: { attack: 2, decay: 1, sustain: 0.6, release: 3 }
        }).connect(analyserRef.current),
        
        lead: new Tone.Synth({
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.1, decay: 0.2, sustain: 0.4, release: 1 }
        }).connect(analyserRef.current)
      };

      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  };

  const generateMusic = useCallback(() => {
    if (!isInitialized || !synthsRef.current) return;

    const pack = moodPacks[moodPack as keyof typeof moodPacks] || moodPacks['cosmic-temple'];
    
    // Map emotion to musical parameters
    const bassFreq = pack.baseFreq * (0.5 + emotion.valence * 0.5);

    // Set transport BPM based on arousal
    Tone.Transport.bpm.value = 60 + emotion.arousal * 60;

    // Bass line
    if (synthsRef.current.bass) {
      const bassNote = Tone.Frequency(bassFreq, 'hz').toNote();
      synthsRef.current.bass.triggerAttackRelease(bassNote, '2n');
    }

    // Pad chords based on valence
    if (synthsRef.current.pad) {
      const chordRoot = Tone.Frequency(bassFreq * 1.5, 'hz').toNote();
      synthsRef.current.pad.triggerAttackRelease(chordRoot, '1n');
    }

    // Lead melody based on arousal
    if (emotion.arousal > 0.7 && synthsRef.current.lead) {
      const leadFreq = bassFreq * (2 + Math.random());
      const leadNote = Tone.Frequency(leadFreq, 'hz').toNote();
      synthsRef.current.lead.triggerAttackRelease(leadNote, '8n');
    }
  }, [isInitialized, moodPack, emotion]);

  const updateVisualizer = useCallback(() => {
    if (analyserRef.current && isPlaying) {
      const values = analyserRef.current.getValue();
      if (Array.isArray(values)) {
        onAudioData(values.map(v => typeof v === 'number' ? v : 0));
      }
    }
    animationFrameRef.current = requestAnimationFrame(updateVisualizer);
  }, [isPlaying, onAudioData]);

  useEffect(() => {
    if (isPlaying && isInitialized) {
      const interval = setInterval(generateMusic, 2000); // Generate new sounds every 2 seconds
      updateVisualizer();
      
      return () => {
        clearInterval(interval);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [isPlaying, isInitialized, generateMusic, updateVisualizer]);

  useEffect(() => {
    return () => {
      // Cleanup
      Object.values(synthsRef.current).forEach(synth => {
        synth?.dispose();
      });
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const currentPack = moodPacks[moodPack as keyof typeof moodPacks] || moodPacks['cosmic-temple'];

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Music size={20} />
          Audio Engine
        </h2>
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>

      <div className="space-y-4">
        {/* Current Mood Pack */}
        <div className="space-y-2">
          <div className="text-sm text-gray-300">Active Mood Pack</div>
          <div className={`p-3 rounded-lg bg-gradient-to-r ${currentPack.color} text-white font-medium`}>
            {currentPack.name}
          </div>
        </div>

        {/* Audio Initialization */}
        {!isInitialized && (
          <button
            onClick={initializeAudio}
            className="w-full p-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg font-medium hover:scale-105 transition-transform"
          >
            Initialize Audio Engine
          </button>
        )}

        {/* Engine Status */}
        <div className="space-y-2">
          <div className="text-sm text-gray-300">Engine Status</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className={`p-2 rounded ${isInitialized ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-400'}`}>
              Audio: {isInitialized ? 'Ready' : 'Not Ready'}
            </div>
            <div className={`p-2 rounded ${isPlaying ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-500/20 text-gray-400'}`}>
              Playing: {isPlaying ? 'Yes' : 'No'}
            </div>
          </div>
        </div>

        {/* Emotion Mapping */}
        <div className="space-y-2">
          <div className="text-sm text-gray-300">Emotion → Sound Mapping</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Bass Frequency:</span>
              <span>{Math.round(currentPack.baseFreq * (0.5 + emotion.valence * 0.5))} Hz</span>
            </div>
            <div className="flex justify-between">
              <span>Tempo:</span>
              <span>{Math.round(60 + emotion.arousal * 60)} BPM</span>
            </div>
            <div className="flex justify-between">
              <span>Harmony:</span>
              <span>{emotion.valence > 0.6 ? 'Major' : emotion.valence < 0.4 ? 'Minor' : 'Neutral'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 