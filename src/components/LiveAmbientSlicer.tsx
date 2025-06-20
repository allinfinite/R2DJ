'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as Tone from 'tone';
import { Play, Pause, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { CircularSlicer } from './CircularSlicer';

interface AudioSlice {
  id: string;
  buffer: Tone.ToneAudioBuffer;
  startTime: number;
  duration: number;
  amplitude: number;
  pitch: number;
  category: 'percussive' | 'tonal' | 'noise' | 'voice';
  color: string;
  age: number;
}

interface LiveAmbientSlicerProps {
  chaosX?: number;
  chaosY?: number;
  reverbAmount?: number;
  delayAmount?: number;
  bpm?: number;
}

export function LiveAmbientSlicer({ 
  chaosX = 0.5, 
  chaosY = 0.5, 
  reverbAmount = 0.5, 
  delayAmount = 0.3,
  bpm = 120
}: LiveAmbientSlicerProps) {
  const [isLive, setIsLive] = useState(false);
  const [audioSlices, setAudioSlices] = useState<AudioSlice[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [ambientVolume, setAmbientVolume] = useState(0.3);
  const [feedbackIntensity, setFeedbackIntensity] = useState(0.5);
  const [chaos, setChaos] = useState({ x: chaosX, y: chaosY });
  const [reverb, setReverb] = useState(reverbAmount);
  const [delay, setDelay] = useState(delayAmount);
  const [currentPreset, setCurrentPreset] = useState<string>('balanced');

  // Audio references
  const micRef = useRef<Tone.UserMedia | null>(null);
  const playersRef = useRef<Map<string, Tone.Player>>(new Map());
  const effectsRef = useRef<{ [key: string]: any }>({});
  const loopsRef = useRef<Map<string, Tone.Loop>>(new Map());
  const keyboardMapRef = useRef<Map<string, string>>(new Map());
  
  // Live recording state
  const recordingBufferRef = useRef<Float32Array[]>([]);
  const lastSliceTimeRef = useRef(0);
  const isListeningRef = useRef(false);

  const addDebug = useCallback((message: string) => {
    console.log('[LIVE AMBIENT]', message);
    setDebugInfo(prev => [...prev.slice(-2), `${new Date().toLocaleTimeString().slice(-5)}: ${message}`]);
  }, []);

  // Initialize audio system
  const initializeAudio = useCallback(async () => {
    try {
      await Tone.start();
      Tone.Transport.bpm.value = bpm;
      
      micRef.current = new Tone.UserMedia();
      
      effectsRef.current = {
        filter: new Tone.Filter(800, 'lowpass'),
        distortion: new Tone.Distortion(0.1),
        reverb: new Tone.Reverb(3),
        delay: new Tone.PingPongDelay(0.25, 0.2),
        ambientGain: new Tone.Gain(ambientVolume).toDestination()
      };
      
      effectsRef.current.filter
        .chain(
          effectsRef.current.distortion,
          effectsRef.current.reverb,
          effectsRef.current.delay,
          effectsRef.current.ambientGain
        );
      
      setIsInitialized(true);
      addDebug('Live ambient system ready');
    } catch (error) {
      addDebug(`Init failed: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }, [bpm, ambientVolume, addDebug]);

  // Continuous audio analysis
  const startLiveAnalysis = useCallback(async () => {
    if (!micRef.current) return;
    
    try {
      await micRef.current.open();
      isListeningRef.current = true;
      
      // Connect microphone to a meter for live analysis
      const meter = new Tone.Meter();
      micRef.current.connect(meter);
      
      // Also create a recorder for capturing audio
      const recorder = new Tone.Recorder();
      micRef.current.connect(recorder);
      
      addDebug('🎤 Live listening started');
      
      // Start recording in chunks
      const recordChunk = async () => {
        if (!isListeningRef.current) return;
        
        // Record for 2 seconds
        recorder.start();
        
        setTimeout(async () => {
          if (!isListeningRef.current) return;
          
          try {
            const recording = await recorder.stop();
            
            // Convert blob to audio buffer for processing
            const arrayBuffer = await recording.arrayBuffer();
            const audioBuffer = await Tone.getContext().decodeAudioData(arrayBuffer);
            
                         // Process this chunk
             processLiveAudioBuffer(audioBuffer);
            
            // Schedule next chunk
            setTimeout(recordChunk, 100); // Small overlap
          } catch (error) {
            addDebug(`Chunk processing failed: ${error instanceof Error ? error.message : 'Unknown'}`);
            setTimeout(recordChunk, 1000); // Retry after delay
          }
        }, 2000);
      };
      
      recordChunk();
      
    } catch (error) {
      addDebug(`Live analysis failed: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }, []);

  // Process live audio buffer into slices
  const processLiveAudioBuffer = useCallback((audioBuffer: AudioBuffer) => {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const duration = audioBuffer.duration;
    
    if (duration < 0.1) return; // Skip very short audio
    
    // Check if there's significant audio content
    const avgAmplitude = channelData.reduce((sum, val) => sum + Math.abs(val), 0) / channelData.length;
    if (avgAmplitude < 0.005) return; // Skip very quiet audio
    
    // Analyze characteristics
    const pitch = detectPitch(channelData, sampleRate);
    const category = categorizeSlice(avgAmplitude, pitch, duration);
    const color = getCategoryColor(category);
    
    const slice: AudioSlice = {
      id: `live_${Date.now()}`,
      buffer: new Tone.ToneAudioBuffer(audioBuffer),
      startTime: Date.now() / 1000,
      duration,
      amplitude: avgAmplitude,
      pitch,
      category,
      color,
      age: 0
    };
    
    setAudioSlices(prev => {
      const newSlices = [...prev, slice];
      return newSlices.slice(-12); // Keep only last 12 slices
    });
    
    const player = new Tone.Player(slice.buffer).connect(effectsRef.current.filter);
    playersRef.current.set(slice.id, player);
    
    startAmbientLoop(slice);
    
    addDebug(`Live slice: ${category} ${duration.toFixed(1)}s`);
  }, []);



  // Start ambient loop for a slice
  const startAmbientLoop = useCallback((slice: AudioSlice) => {
    const player = playersRef.current.get(slice.id);
    if (!player) return;
    
    const baseInterval = slice.category === 'percussive' ? '4n' : '2m';
    
    const loop = new Tone.Loop((time) => {
      const shouldPlay = Math.random() < (feedbackIntensity * 0.3 + 0.1);
      
      if (shouldPlay) {
        const playbackRate = Math.random() * 0.4 + 0.8;
        player.playbackRate = playbackRate;
        
        const ageVolume = Math.max(0.1, 1 - (slice.age / 30));
        const categoryVolume = slice.category === 'voice' ? 0.3 : 0.2;
        player.volume.value = -20 + (ageVolume * categoryVolume * ambientVolume * 20);
        
        player.start(time);
      }
    }, baseInterval);
    
    loop.start(Math.random() * 2);
    loopsRef.current.set(slice.id, loop);
    
    setTimeout(() => {
      loop.stop();
      loop.dispose();
      loopsRef.current.delete(slice.id);
      playersRef.current.delete(slice.id);
      player.dispose();
    }, 30000);
    
  }, [feedbackIntensity, ambientVolume]);

  const detectPitch = (audioData: Float32Array, sampleRate: number): number => {
    const bufferSize = Math.min(audioData.length, 1024);
    const autocorrelation = new Array(bufferSize).fill(0);
    
    for (let lag = 0; lag < bufferSize / 2; lag++) {
      for (let i = 0; i < bufferSize - lag; i++) {
        autocorrelation[lag] += audioData[i] * audioData[i + lag];
      }
    }
    
    let maxCorrelation = 0;
    let bestLag = 0;
    const minLag = Math.floor(sampleRate / 800);
    const maxLag = Math.floor(sampleRate / 80);
    
    for (let lag = minLag; lag < maxLag && lag < autocorrelation.length; lag++) {
      if (autocorrelation[lag] > maxCorrelation) {
        maxCorrelation = autocorrelation[lag];
        bestLag = lag;
      }
    }
    
    return bestLag > 0 ? sampleRate / bestLag : 0;
  };

  const categorizeSlice = (amplitude: number, pitch: number, duration: number): AudioSlice['category'] => {
    if (duration < 0.3 && amplitude > 0.05 && pitch < 200) return 'percussive';
    if (pitch > 80 && pitch < 800 && duration > 0.2) return 'tonal';
    if (pitch > 100 && pitch < 500 && duration > 0.1) return 'voice';
    return 'noise';
  };

  const getCategoryColor = (category: AudioSlice['category']): string => {
    const colors = {
      percussive: '#ef4444',
      tonal: '#3b82f6',
      voice: '#10b981',
      noise: '#8b5cf6'
    };
    return colors[category];
  };

  const stopLiveSystem = useCallback(() => {
    isListeningRef.current = false;
    
    if (micRef.current) {
      micRef.current.close();
    }
    
    loopsRef.current.forEach(loop => {
      loop.stop();
      loop.dispose();
    });
    loopsRef.current.clear();
    
    Tone.Transport.stop();
    
    addDebug('Live system stopped');
  }, [addDebug]);

  const toggleLiveMode = useCallback(async () => {
    if (isLive) {
      stopLiveSystem();
      setIsLive(false);
    } else {
      await startLiveAnalysis();
      Tone.Transport.start();
      setIsLive(true);
    }
  }, [isLive, stopLiveSystem, startLiveAnalysis]);

  const clearAllSlices = useCallback(() => {
    stopLiveSystem();
    setAudioSlices([]);
    playersRef.current.clear();
    addDebug('All slices cleared');
  }, [stopLiveSystem, addDebug]);

  // Ambient presets
  const ambientPresets = {
    'minimal': {
      name: 'Minimal',
      ambientVolume: 0.1,
      feedbackIntensity: 0.2,
      chaos: { x: 0.3, y: 0.1 },
      reverb: 0.8,
      delay: 0.2,
      description: 'Sparse, clean ambient textures'
    },
    'balanced': {
      name: 'Balanced',
      ambientVolume: 0.3,
      feedbackIntensity: 0.5,
      chaos: { x: 0.5, y: 0.3 },
      reverb: 0.5,
      delay: 0.4,
      description: 'Perfect balance of feedback and space'
    },
    'dense': {
      name: 'Dense',
      ambientVolume: 0.5,
      feedbackIntensity: 0.8,
      chaos: { x: 0.7, y: 0.6 },
      reverb: 0.4,
      delay: 0.7,
      description: 'Rich, layered ambient soundscapes'
    },
    'ethereal': {
      name: 'Ethereal',
      ambientVolume: 0.4,
      feedbackIntensity: 0.3,
      chaos: { x: 0.2, y: 0.1 },
      reverb: 0.9,
      delay: 0.3,
      description: 'Dreamy, spacious atmospheres'
    },
    'glitchy': {
      name: 'Glitchy',
      ambientVolume: 0.6,
      feedbackIntensity: 0.7,
      chaos: { x: 0.8, y: 0.9 },
      reverb: 0.2,
      delay: 0.8,
      description: 'Chaotic, digital textures'
    }
  };

  // Apply preset
  const applyPreset = useCallback((presetName: string) => {
    const preset = ambientPresets[presetName as keyof typeof ambientPresets];
    if (!preset) return;
    
    setCurrentPreset(presetName);
    setAmbientVolume(preset.ambientVolume);
    setFeedbackIntensity(preset.feedbackIntensity);
    setChaos(preset.chaos);
    setReverb(preset.reverb);
    setDelay(preset.delay);
    
    addDebug(`Applied preset: ${preset.name}`);
  }, [addDebug]);

  // Handle chaos pad interaction
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

  // Update effects
  useEffect(() => {
    if (!effectsRef.current || !isInitialized) return;
    
    if (effectsRef.current.filter?.frequency) {
      effectsRef.current.filter.frequency.value = 200 + (chaos.x * 1800);
    }
    
    if (effectsRef.current.distortion) {
      effectsRef.current.distortion.distortion = chaos.y * 0.3;
    }
    
    if (effectsRef.current.reverb?.wet) {
      effectsRef.current.reverb.wet.value = reverb;
    }
    
    if (effectsRef.current.delay?.wet) {
      effectsRef.current.delay.wet.value = delay;
    }
    
    if (effectsRef.current.ambientGain?.gain) {
      effectsRef.current.ambientGain.gain.value = ambientVolume;
    }
  }, [chaos.x, chaos.y, reverb, delay, ambientVolume, isInitialized]);

  // Age slices over time
  useEffect(() => {
    if (!isLive) return;
    
    const ageInterval = setInterval(() => {
      setAudioSlices(prev => prev.map(slice => ({
        ...slice,
        age: slice.age + 1
      })));
    }, 1000);
    
    return () => clearInterval(ageInterval);
  }, [isLive]);

  useEffect(() => {
    initializeAudio();
    return () => {
      stopLiveSystem();
      Object.values(effectsRef.current).forEach(effect => effect?.dispose?.());
    };
  }, [initializeAudio, stopLiveSystem]);

  if (!isInitialized) {
    return (
      <div className="p-4 bg-white/10 backdrop-blur-md rounded-xl">
        <p className="text-white">Initializing Live Ambient System...</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white/10 backdrop-blur-md rounded-xl space-y-4">
      <h3 className="text-white text-lg font-semibold">🌊 Live Ambient R2DJ</h3>
      
      <div className="flex gap-2">
        <button
          onClick={toggleLiveMode}
          className={`flex-1 p-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
            isLive
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {isLive ? <Pause size={16} /> : <Play size={16} />}
          {isLive ? 'STOP LIVE' : 'START LIVE'}
        </button>
        
        <button
          onClick={clearAllSlices}
          className="px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Presets */}
      <div className="space-y-2">
        <h4 className="text-white text-sm font-medium">Ambient Presets:</h4>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(ambientPresets).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              className={`p-2 rounded-lg text-xs font-medium transition-all ${
                currentPreset === key
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
              title={preset.description}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Left - Chaos Pad */}
        <div className="space-y-2">
          <h4 className="text-white text-sm font-medium text-center">Chaos Pad</h4>
          <div
            className="relative w-full aspect-square bg-gradient-to-br from-purple-600 via-pink-500 to-blue-500 rounded-lg cursor-crosshair overflow-hidden max-w-[200px] mx-auto"
            onMouseDown={handleChaosClick}
            onMouseMove={(e) => {
              if (e.buttons === 1) {
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
              className="absolute w-4 h-4 bg-white rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 border border-black/20"
              style={{
                left: `${chaos.x * 100}%`,
                top: `${chaos.y * 100}%`,
              }}
            />
            
            {/* Labels */}
            <div className="absolute top-1 left-1 text-white text-xs font-medium">FILTER</div>
            <div className="absolute bottom-1 right-1 text-white text-xs font-medium">DISTORT</div>
          </div>
          
          <div className="text-center text-white/70 text-xs">
            Filter: {Math.round(chaos.x * 100)}% | Distort: {Math.round(chaos.y * 100)}%
          </div>
        </div>

        {/* Right - Sliders */}
        <div className="space-y-3 text-white text-sm">
          <div>
            <label className="block mb-1">Ambient Volume: {Math.round(ambientVolume * 100)}%</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={ambientVolume}
              onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <div>
            <label className="block mb-1">Feedback Intensity: {Math.round(feedbackIntensity * 100)}%</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={feedbackIntensity}
              onChange={(e) => setFeedbackIntensity(parseFloat(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <div>
            <label className="block mb-1">Reverb: {Math.round(reverb * 100)}%</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={reverb}
              onChange={(e) => setReverb(parseFloat(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <div>
            <label className="block mb-1">Delay: {Math.round(delay * 100)}%</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={delay}
              onChange={(e) => setDelay(parseFloat(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="text-center">
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
          isLive ? 'bg-red-500/20 text-red-300' : 'bg-gray-500/20 text-gray-300'
        }`}>
          {isLive ? <Volume2 size={14} /> : <VolumeX size={14} />}
          {isLive ? 'LIVE - Listening & Creating' : 'Idle - Click Start Live'}
        </div>
      </div>

      {audioSlices.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-white text-sm">
            <span>🎵 {audioSlices.length} live slices</span>
          </div>
          
          <div className="flex justify-center">
            <CircularSlicer
              audioSlices={audioSlices}
              selectedSlices={new Set()}
              onSliceClick={() => {}}
              onSlicePlay={() => {}}
              keyboardMap={keyboardMapRef.current}
            />
          </div>
        </div>
      )}
      
      {debugInfo.length > 0 && (
        <div className="text-xs text-white/60 space-y-1 max-h-16 overflow-y-auto">
          {debugInfo.map((info, i) => (
            <div key={i}>{info}</div>
          ))}
        </div>
      )}
    </div>
  );
} 