'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as Tone from 'tone';
import { Play, Square, Shuffle, Grid, Mic, Circle } from 'lucide-react';
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
}

interface VoiceSlicerProps {
  chaosX?: number;
  chaosY?: number;
  reverbAmount?: number;
  delayAmount?: number;
  bpm?: number;
}

export function VoiceSlicer({ 
  chaosX = 0.5, 
  chaosY = 0.5, 
  reverbAmount = 0.5, 
  delayAmount = 0.3,
  bpm = 120
}: VoiceSlicerProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioSlices, setAudioSlices] = useState<AudioSlice[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedSlices, setSelectedSlices] = useState<Set<string>>(new Set());
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [keyboardMap, setKeyboardMap] = useState<Map<string, string>>(new Map());
  const [currentBpm, setCurrentBpm] = useState(bpm);
  const [viewMode, setViewMode] = useState<'grid' | 'circular'>('circular');

  // Audio references
  const micRef = useRef<Tone.UserMedia | null>(null);
  const recorderRef = useRef<Tone.Recorder | null>(null);
  const playersRef = useRef<Map<string, Tone.Player>>(new Map());
  const loopRef = useRef<Tone.Loop | null>(null);
  const effectsRef = useRef<{ [key: string]: any }>({});

  const addDebug = useCallback((message: string) => {
    console.log('[VOICE SLICER]', message);
    setDebugInfo(prev => [...prev.slice(-3), `${new Date().toLocaleTimeString()}: ${message}`]);
  }, []);

  // Initialize audio system
  const initializeAudio = useCallback(async () => {
    try {
      await Tone.start();
      Tone.Transport.bpm.value = bpm;
      
      // Initialize microphone and recorder
      micRef.current = new Tone.UserMedia();
      recorderRef.current = new Tone.Recorder();
      
      // Initialize effects
      effectsRef.current = {
        filter: new Tone.Filter(800, 'lowpass'),
        distortion: new Tone.Distortion(0.2),
        reverb: new Tone.Reverb(2),
        delay: new Tone.PingPongDelay(0.25, 0.3),
        volume: new Tone.Volume(-6).toDestination()
      };
      
      // Chain effects
      effectsRef.current.filter
        .chain(
          effectsRef.current.distortion,
          effectsRef.current.reverb,
          effectsRef.current.delay,
          effectsRef.current.volume
        );
      
      setIsInitialized(true);
      addDebug('Audio system initialized for voice slicing');
    } catch (error) {
      addDebug(`Initialization failed: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }, [bpm, addDebug]);

  // Analyze audio buffer for slicing
  const analyzeAndSliceAudio = useCallback(async (audioBuffer: Tone.ToneAudioBuffer) => {
    addDebug('🔪 Analyzing and slicing audio...');
    
    const buffer = audioBuffer.get();
    if (!buffer) return [];
    
    const channelData = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    const threshold = 0.01; // Amplitude threshold for slice detection
    const minSliceLength = 0.1; // Minimum 100ms slice
    const maxSliceLength = 2.0; // Maximum 2s slice
    
    const slices: AudioSlice[] = [];
    let sliceStart = 0;
    let inSlice = false;
    
    // Find slice boundaries based on amplitude
    for (let i = 0; i < channelData.length; i++) {
      const amplitude = Math.abs(channelData[i]);
      const timeInSeconds = i / sampleRate;
      
      if (!inSlice && amplitude > threshold) {
        // Start of a slice
        sliceStart = i;
        inSlice = true;
      } else if (inSlice && (amplitude < threshold || timeInSeconds - (sliceStart / sampleRate) > maxSliceLength)) {
        // End of a slice
        const sliceDuration = (i - sliceStart) / sampleRate;
        
        if (sliceDuration >= minSliceLength) {
          // Create slice buffer
          const sliceBuffer = Tone.getContext().createBuffer(
            1,
            i - sliceStart,
            sampleRate
          );
          
          const sliceData = sliceBuffer.getChannelData(0);
          for (let j = 0; j < i - sliceStart; j++) {
            sliceData[j] = channelData[sliceStart + j];
          }
          
          // Analyze slice characteristics
          const avgAmplitude = sliceData.reduce((sum, val) => sum + Math.abs(val), 0) / sliceData.length;
          const pitch = detectPitch(sliceData, sampleRate);
          const category = categorizeSlice(avgAmplitude, pitch, sliceDuration);
          const color = getCategoryColor(category);
          
          const slice: AudioSlice = {
            id: `slice_${slices.length}`,
            buffer: new Tone.ToneAudioBuffer(sliceBuffer),
            startTime: sliceStart / sampleRate,
            duration: sliceDuration,
            amplitude: avgAmplitude,
            pitch,
            category,
            color
          };
          
          slices.push(slice);
        }
        
        inSlice = false;
      }
    }
    
    addDebug(`Created ${slices.length} slices`);
    return slices;
  }, [addDebug]);

  // Simple pitch detection using autocorrelation
  const detectPitch = (audioData: Float32Array, sampleRate: number): number => {
    const bufferSize = audioData.length;
    const autocorrelation = new Array(bufferSize).fill(0);
    
    // Calculate autocorrelation
    for (let lag = 0; lag < bufferSize / 2; lag++) {
      for (let i = 0; i < bufferSize - lag; i++) {
        autocorrelation[lag] += audioData[i] * audioData[i + lag];
      }
    }
    
    // Find peak in expected pitch range (80-800 Hz)
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

  // Categorize slice based on characteristics
  const categorizeSlice = (amplitude: number, pitch: number, duration: number): AudioSlice['category'] => {
    // Percussive: Short, high amplitude, low pitch
    if (duration < 0.3 && amplitude > 0.1 && pitch < 200) {
      return 'percussive';
    }
    // Tonal: Clear pitch, longer duration
    if (pitch > 80 && pitch < 800 && duration > 0.2) {
      return 'tonal';
    }
    // Voice: Medium pitch range, varied duration
    if (pitch > 100 && pitch < 500 && duration > 0.1) {
      return 'voice';
    }
    // Everything else is noise
    return 'noise';
  };

  // Get color based on category
  const getCategoryColor = (category: AudioSlice['category']): string => {
    const colors = {
      percussive: '#ef4444', // Red
      tonal: '#3b82f6',      // Blue
      voice: '#10b981',      // Green
      noise: '#8b5cf6'       // Purple
    };
    return colors[category];
  };

  // Start recording
  const startRecording = useCallback(async () => {
    if (!micRef.current || !recorderRef.current) return;
    
    try {
      await micRef.current.open();
      micRef.current.connect(recorderRef.current);
      recorderRef.current.start();
      setIsRecording(true);
      addDebug('🔴 Recording started');
    } catch (error) {
      addDebug(`Recording failed: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }, [addDebug]);

  // Stop recording and slice
  const stopRecording = useCallback(async () => {
    if (!recorderRef.current || !micRef.current) return;
    
    try {
      const recording = await recorderRef.current.stop();
      setIsRecording(false);
      micRef.current.close();
      
      // Convert to audio buffer and slice
      const url = URL.createObjectURL(recording);
      const buffer = new Tone.ToneAudioBuffer(url);
      
      addDebug('🔄 Processing recording...');
      const slices = await analyzeAndSliceAudio(buffer);
      setAudioSlices(slices);
      
             // Create players for each slice
       playersRef.current.clear();
       slices.forEach(slice => {
         const player = new Tone.Player(slice.buffer).connect(effectsRef.current.filter);
         playersRef.current.set(slice.id, player);
       });
       
       // Assign keyboard keys to slices
       assignKeyboardKeys(slices);
      
    } catch (error) {
      addDebug(`Processing failed: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }, [addDebug, analyzeAndSliceAudio]);

  // Play a slice
  const playSlice = useCallback((sliceId: string) => {
    const player = playersRef.current.get(sliceId);
    if (player) {
      player.start();
      addDebug(`Playing slice ${sliceId}`);
    }
  }, [addDebug]);

  // Start/stop sequence playback
  const toggleSequence = useCallback(() => {
    if (isPlaying) {
      loopRef.current?.stop();
      Tone.Transport.stop();
      setIsPlaying(false);
      addDebug('Sequence stopped');
    } else {
      if (selectedSlices.size === 0) {
        addDebug('No slices selected for sequence');
        return;
      }
      
      // Create sequence from selected slices
      const sliceIds = Array.from(selectedSlices);
      let currentIndex = 0;
      
      loopRef.current = new Tone.Loop((time) => {
        const sliceId = sliceIds[currentIndex];
        const player = playersRef.current.get(sliceId);
        if (player) {
          player.start(time);
        }
        currentIndex = (currentIndex + 1) % sliceIds.length;
      }, '8n'); // Play every 8th note
      
      loopRef.current.start(0);
      Tone.Transport.start();
      setIsPlaying(true);
      addDebug('Sequence started');
    }
  }, [isPlaying, selectedSlices, addDebug]);

  // Randomize selected slices with different patterns
  const randomizeSequence = useCallback(() => {
    if (audioSlices.length === 0) return;
    
    const patterns = [
      // Percussive-heavy pattern
      () => {
        const percussive = audioSlices.filter(s => s.category === 'percussive');
        const others = audioSlices.filter(s => s.category !== 'percussive');
        const selection = [...percussive.slice(0, 3), ...others.slice(0, 2)];
        return new Set(selection.map(s => s.id));
      },
      // Voice-focused pattern
      () => {
        const voice = audioSlices.filter(s => s.category === 'voice');
        const tonal = audioSlices.filter(s => s.category === 'tonal');
        const selection = [...voice.slice(0, 4), ...tonal.slice(0, 2)];
        return new Set(selection.map(s => s.id));
      },
      // Random mix
      () => {
        const numSlices = Math.floor(Math.random() * 5) + 4;
        const shuffled = [...audioSlices].sort(() => Math.random() - 0.5);
        return new Set(shuffled.slice(0, numSlices).map(s => s.id));
      },
      // Short and snappy
      () => {
        const short = audioSlices.filter(s => s.duration < 0.5);
        const selection = short.slice(0, 6);
        return new Set(selection.map(s => s.id));
      }
    ];
    
    const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
    const randomSelection = randomPattern();
    
    setSelectedSlices(randomSelection);
    addDebug(`Randomized selection: ${randomSelection.size} slices`);
  }, [audioSlices, addDebug]);

  // Update BPM
  const updateBpm = useCallback((newBpm: number) => {
    setCurrentBpm(newBpm);
    if (Tone.Transport) {
      Tone.Transport.bpm.value = newBpm;
      addDebug(`BPM updated to ${newBpm}`);
    }
  }, [addDebug]);

  // Update effects based on chaos pad
  useEffect(() => {
    if (!effectsRef.current || !isInitialized) return;
    
    // Check if individual effects exist before updating
    if (effectsRef.current.filter?.frequency) {
      const filterFreq = 200 + (chaosX * 1800);
      effectsRef.current.filter.frequency.value = filterFreq;
    }
    
    if (effectsRef.current.distortion) {
      const distortionAmount = chaosY * 0.8;
      effectsRef.current.distortion.distortion = distortionAmount;
    }
    
    if (effectsRef.current.reverb?.wet) {
      effectsRef.current.reverb.wet.value = reverbAmount;
    }
    
    if (effectsRef.current.delay?.wet) {
      effectsRef.current.delay.wet.value = delayAmount;
    }
  }, [chaosX, chaosY, reverbAmount, delayAmount, isInitialized]);

  // Keyboard triggering
  useEffect(() => {
    if (!isInitialized) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const sliceId = keyboardMap.get(event.key.toLowerCase());
      if (sliceId && !event.repeat) {
        playSlice(sliceId);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      // Optional: could add key release handling for sustained sounds
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isInitialized, keyboardMap, playSlice]);

  // Map slices to keyboard keys
  const assignKeyboardKeys = useCallback((slices: AudioSlice[]) => {
    const keys = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'z', 'x', 'c', 'v', 'b', 'n', 'm'];
    const newMap = new Map<string, string>();
    
    slices.slice(0, keys.length).forEach((slice, index) => {
      newMap.set(keys[index], slice.id);
    });
    
    setKeyboardMap(newMap);
    addDebug(`Mapped ${newMap.size} slices to keyboard`);
  }, [addDebug]);

  // Initialize on mount
  useEffect(() => {
    initializeAudio();
    return () => {
      // Cleanup
      if (loopRef.current) loopRef.current.dispose();
      playersRef.current.forEach(player => player.dispose());
      Object.values(effectsRef.current).forEach(effect => effect?.dispose?.());
    };
  }, [initializeAudio]);

  if (!isInitialized) {
    return (
      <div className="p-4 bg-white/10 backdrop-blur-md rounded-xl">
        <p className="text-white">Initializing Voice Slicer...</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white/10 backdrop-blur-md rounded-xl space-y-4">
      <h3 className="text-white text-lg font-semibold">🔪 Voice Slicer</h3>
      
      {/* Recording Controls */}
      <div className="flex gap-2">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`flex-1 p-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          <Mic size={16} />
          {isRecording ? 'STOP REC' : 'RECORD'}
        </button>
        
        <button
          onClick={randomizeSequence}
          disabled={audioSlices.length === 0}
          className="px-4 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-500 text-white rounded-lg transition-all"
          title="Smart randomize - picks different patterns"
        >
          <Shuffle size={16} />
        </button>
        
        <button
          onClick={toggleSequence}
          disabled={selectedSlices.size === 0}
          className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
            isPlaying
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-500'
          }`}
        >
          {isPlaying ? <Square size={16} /> : <Play size={16} />}
        </button>
        
        <button
          onClick={() => setViewMode(viewMode === 'grid' ? 'circular' : 'grid')}
          className="px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all"
          title={`Switch to ${viewMode === 'grid' ? 'circular' : 'grid'} view`}
        >
          {viewMode === 'grid' ? <Circle size={16} /> : <Grid size={16} />}
        </button>
      </div>

      {/* BPM Control */}
      <div className="flex items-center gap-3 text-white text-sm">
        <label>BPM:</label>
        <input
          type="range"
          min="60"
          max="180"
          step="5"
          value={currentBpm}
          onChange={(e) => updateBpm(parseInt(e.target.value))}
          className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
        />
        <span className="font-mono w-8 text-center">{currentBpm}</span>
      </div>

      {/* Keyboard Help */}
      {audioSlices.length > 0 && (
        <div className="text-xs text-white/60 bg-black/20 p-2 rounded">
          💡 Use keyboard QWERTY keys to trigger slices! Click slices to select for sequence.
        </div>
      )}
      
            {/* Slice Interface */}
      {audioSlices.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-white text-sm">
            {viewMode === 'grid' ? <Grid size={16} /> : <Circle size={16} />}
            <span>{audioSlices.length} slices | {selectedSlices.size} selected</span>
          </div>
          
          {viewMode === 'circular' ? (
            <div className="flex justify-center pb-8">
              <CircularSlicer
                audioSlices={audioSlices}
                selectedSlices={selectedSlices}
                onSliceClick={(sliceId) => {
                  const newSelected = new Set(selectedSlices);
                  if (newSelected.has(sliceId)) {
                    newSelected.delete(sliceId);
                  } else {
                    newSelected.add(sliceId);
                  }
                  setSelectedSlices(newSelected);
                }}
                onSlicePlay={playSlice}
                keyboardMap={keyboardMap}
              />
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
              {audioSlices.map((slice, index) => {
                const keyboardKey = Array.from(keyboardMap.entries()).find(([key, id]) => id === slice.id)?.[0];
                return (
                  <button
                    key={slice.id}
                    onClick={() => {
                      playSlice(slice.id);
                      const newSelected = new Set(selectedSlices);
                      if (newSelected.has(slice.id)) {
                        newSelected.delete(slice.id);
                      } else {
                        newSelected.add(slice.id);
                      }
                      setSelectedSlices(newSelected);
                    }}
                    className={`p-2 rounded-lg text-xs font-medium transition-all ${
                      selectedSlices.has(slice.id)
                        ? 'bg-white/30 text-white'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                    style={{ 
                      borderLeft: `4px solid ${slice.color}`,
                    }}
                  >
                    {keyboardKey && (
                      <div className="text-xs font-mono bg-black/20 px-1 rounded mb-1">
                        {keyboardKey.toUpperCase()}
                      </div>
                    )}
                    <div>{slice.category.toUpperCase()}</div>
                    <div className="text-xs opacity-70">
                      {slice.duration.toFixed(1)}s
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
      
      {/* Debug Info */}
      {debugInfo.length > 0 && (
        <div className="text-xs text-white/60 space-y-1 max-h-20 overflow-y-auto">
          {debugInfo.map((info, i) => (
            <div key={i}>{info}</div>
          ))}
        </div>
      )}
    </div>
  );
} 