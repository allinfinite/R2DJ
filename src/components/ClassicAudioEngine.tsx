'use client';

import { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import { Mic } from 'lucide-react';

interface ClassicAudioEngineProps {
  selectedMood: 'calm' | 'playful' | 'trippy' | 'intense';
  voiceVolume: number;
  voiceCadence: 'slow' | 'medium' | 'fast';
  keywordTrigger: string | null;
  isPlaying: boolean;
  masterVolume: number;
  onAudioData: (data: number[]) => void;
  chaosX: number; // Filter control (0-1)
  chaosY: number; // Distortion control (0-1)
  reverbAmount: number; // Reverb knob (0-1)
  delayAmount: number; // Delay knob (0-1)
}

export function ClassicAudioEngine({
  selectedMood,
  voiceVolume,
  isPlaying,
  onAudioData,
  chaosX,
  chaosY,
  reverbAmount,
  delayAmount
}: ClassicAudioEngineProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isVoiceProcessingEnabled, setIsVoiceProcessingEnabled] = useState(false);
  const [detectedPitch, setDetectedPitch] = useState(0);
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  // Audio references
  const voiceInputRef = useRef<Tone.UserMedia | null>(null);
  const analyserRef = useRef<Tone.Analyser | null>(null);
  const pitchAnalyserRef = useRef<Tone.Analyser | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Voice-driven synthesizers
  const synthsRef = useRef<{ [key: string]: any }>({});
  const effectsRef = useRef<{ [key: string]: any }>({});
  
  // Pitch tracking
  const pitchHistoryRef = useRef<number[]>([]);

  const initializeAudio = async () => {
    try {
      await Tone.start();
      setDebugInfo('Tone.js started');
      
      // Create master output
      const masterVolNode = new Tone.Volume(-6).toDestination();
      
      // Create analyzer for visualization
      analyserRef.current = new Tone.Analyser('fft', 512);
      analyserRef.current.connect(masterVolNode);

      // Create pitch analyzer
      pitchAnalyserRef.current = new Tone.Analyser('fft', 2048);

      // Initialize effects
      effectsRef.current = {
        delay: new Tone.PingPongDelay(0.25, 0.3).connect(analyserRef.current),
        reverb: new Tone.Reverb(2).connect(analyserRef.current),
        filter: new Tone.Filter(800, 'lowpass').connect(analyserRef.current),
        distortion: new Tone.Distortion(0.2).connect(analyserRef.current)
      };

      // Initialize voice-driven synthesizers
      synthsRef.current = {
        bass: new Tone.Synth({
          oscillator: { type: 'sine' },
          envelope: { attack: 0.1, decay: 0.3, sustain: 0.8, release: 1 }
        }).chain(effectsRef.current.filter, effectsRef.current.distortion),
        
        harmony: new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.5, decay: 0.5, sustain: 0.6, release: 2 }
        }).chain(effectsRef.current.reverb, effectsRef.current.delay),
        
        lead: new Tone.Synth({
          oscillator: { type: 'square' },
          envelope: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.3 }
        }).connect(effectsRef.current.delay)
      };

      setIsInitialized(true);
      setDebugInfo('Audio engine initialized');
    } catch (error: unknown) {
      console.error('Failed to initialize audio:', error);
      setDebugInfo(`Init error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Simple pitch detection
  const detectPitch = (audioData: Float32Array, sampleRate: number): number => {
    const bufferSize = audioData.length;
    const autocorrelation = new Array(bufferSize).fill(0);
    
    for (let lag = 0; lag < bufferSize; lag++) {
      for (let i = 0; i < bufferSize - lag; i++) {
        autocorrelation[lag] += audioData[i] * audioData[i + lag];
      }
    }
    
    let maxCorrelation = 0;
    let bestLag = 0;
    
    for (let lag = Math.floor(sampleRate / 800); lag < Math.floor(sampleRate / 80); lag++) {
      if (autocorrelation[lag] > maxCorrelation) {
        maxCorrelation = autocorrelation[lag];
        bestLag = lag;
      }
    }
    
    return bestLag > 0 ? sampleRate / bestLag : 0;
  };

  // Convert frequency to note
  const frequencyToNote = (frequency: number): string => {
    if (frequency < 80) return 'C2';
    
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const A4 = 440;
    const C0 = A4 * Math.pow(2, -4.75);
    
    const noteNumber = Math.round(12 * Math.log2(frequency / C0));
    const octave = Math.floor(noteNumber / 12);
    const noteIndex = noteNumber % 12;
    
    return noteNames[noteIndex] + Math.max(0, Math.min(8, octave));
  };

  const startVoiceProcessing = async () => {
    try {
      voiceInputRef.current = new Tone.UserMedia();
      await voiceInputRef.current.open();
      voiceInputRef.current.connect(pitchAnalyserRef.current!);
      setIsVoiceProcessingEnabled(true);
      startVoiceAnalysis();
    } catch (error: unknown) {
      console.error('Failed to start voice processing:', error);
    }
  };

  const stopVoiceProcessing = () => {
    if (voiceInputRef.current) {
      voiceInputRef.current.close();
      voiceInputRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsVoiceProcessingEnabled(false);
    
    // Stop all playing notes
    Object.values(synthsRef.current).forEach(synth => {
      if (synth?.releaseAll) {
        synth.releaseAll();
      }
    });
  };

  const startVoiceAnalysis = () => {
    if (!pitchAnalyserRef.current || !isVoiceProcessingEnabled) return;

    const bufferLength = pitchAnalyserRef.current.size;
    const dataArray = new Float32Array(bufferLength);
    const freqDataArray = new Uint8Array(pitchAnalyserRef.current.size);

    const analyze = () => {
      if (!pitchAnalyserRef.current || !isVoiceProcessingEnabled) return;

      // Get audio data
      pitchAnalyserRef.current.getValue().forEach((value, index) => {
        dataArray[index] = typeof value === 'number' ? value : 0;
      });

      // Get frequency data for visualization
      if (analyserRef.current) {
        const freqValues = analyserRef.current.getValue();
        freqValues.forEach((value, index) => {
          freqDataArray[index] = typeof value === 'number' ? (value + 140) * 255 / 280 : 0;
        });
        onAudioData(Array.from(freqDataArray));
      }

      // Detect pitch
      const pitch = detectPitch(dataArray, 44100);
      
      if (pitch > 80 && pitch < 2000) {
        setDetectedPitch(pitch);
        pitchHistoryRef.current.push(pitch);
        
        if (pitchHistoryRef.current.length > 5) {
          pitchHistoryRef.current.shift();
        }
        
        const avgPitch = pitchHistoryRef.current.reduce((a, b) => a + b, 0) / pitchHistoryRef.current.length;
        const rootNote = frequencyToNote(avgPitch);
        
        // Generate music
        generateMusicFromVoice(rootNote, voiceVolume);
      }

      // Update effects from chaos pad and knobs
      updateEffects();

      animationFrameRef.current = requestAnimationFrame(analyze);
    };

    analyze();
  };

  const generateMusicFromVoice = (rootNote: string, volume: number) => {
    if (!synthsRef.current || !isPlaying || volume < 0.05) {
      setDebugInfo(`Not generating: playing=${isPlaying}, volume=${volume.toFixed(3)}`);
      return;
    }

    const now = Tone.now();
    setDebugInfo(`Generating music: ${rootNote}, vol=${volume.toFixed(3)}`);
    
    try {
      // Bass follows voice
      const bassNote = rootNote.slice(0, -1) + Math.max(1, parseInt(rootNote.slice(-1)) - 1);
      synthsRef.current.bass.triggerAttackRelease(bassNote, '4n', now);

      // Harmony
      if (volume > 0.1) {
        const harmonyNote = rootNote.slice(0, -1) + Math.min(6, parseInt(rootNote.slice(-1)) + 1);
        synthsRef.current.harmony.triggerAttackRelease(harmonyNote, '2n', now);
      }

      // Lead
      if (volume > 0.2) {
        synthsRef.current.lead.triggerAttackRelease(rootNote, '8n', now);
      }

      setDebugInfo(`Music triggered: ${bassNote} (bass)`);

    } catch (error) {
      console.warn('Error generating music:', error);
      setDebugInfo(`Music error: ${error}`);
    }
  };

  const updateEffects = () => {
    if (!effectsRef.current) return;

    // Chaos pad controls
    const filterFreq = 200 + (chaosX * 2000); // X axis controls filter
    const distortionAmount = chaosY * 0.8; // Y axis controls distortion

    effectsRef.current.filter.frequency.value = filterFreq;
    effectsRef.current.distortion.wet.value = distortionAmount;

    // Knob controls
    effectsRef.current.reverb.wet.value = reverbAmount;
    effectsRef.current.delay.wet.value = delayAmount;
  };

  const generateTestTone = () => {
    if (!synthsRef.current || !isInitialized) return;
    
    const now = Tone.now();
    setDebugInfo('Playing test tone...');
    
    try {
      // Play a simple test sequence
      synthsRef.current.bass.triggerAttackRelease('C2', '4n', now);
      synthsRef.current.harmony.triggerAttackRelease(['C4', 'E4', 'G4'], '2n', now + 0.5);
      synthsRef.current.lead.triggerAttackRelease('C5', '8n', now + 1);
      
      setDebugInfo('Test tone played successfully!');
      
      // Clear debug message after 2 seconds
      setTimeout(() => {
        setDebugInfo('Audio engine initialized');
      }, 2000);
      
    } catch (error) {
      console.error('Error playing test tone:', error);
      setDebugInfo(`Test tone error: ${error}`);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      Object.values(synthsRef.current).forEach(synth => {
        synth?.dispose();
      });
      Object.values(effectsRef.current).forEach(effect => {
        effect?.dispose();
      });
      if (voiceInputRef.current) {
        voiceInputRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4">
      <h3 className="text-lg font-semibold text-white mb-4">ENGINE</h3>

      <div className="space-y-4">
        {/* Initialize */}
        {!isInitialized && (
          <button
            onClick={initializeAudio}
            className="w-full p-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium text-white"
          >
            INIT
          </button>
        )}

        {/* Test Audio Button */}
        {isInitialized && (
          <button
            onClick={generateTestTone}
            className="w-full p-2 bg-purple-500 hover:bg-purple-600 rounded-lg font-medium text-white text-sm"
          >
            🔊 TEST AUDIO
          </button>
        )}

        {/* Voice Processing */}
        {isInitialized && (
          <button
            onClick={isVoiceProcessingEnabled ? stopVoiceProcessing : startVoiceProcessing}
            className={`w-full p-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              isVoiceProcessingEnabled
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            <Mic size={16} />
            {isVoiceProcessingEnabled ? 'STOP' : 'START'} VOICE
          </button>
        )}

        {/* Status */}
        {(isVoiceProcessingEnabled || isInitialized) && (
          <div className="space-y-2">
            <div className="text-center text-white font-medium">
              {selectedMood.toUpperCase()}
            </div>
            
            {isVoiceProcessingEnabled && (
              <>
                <div className="text-xs text-white/60 text-center">
                  PITCH: {detectedPitch > 0 ? `${Math.round(detectedPitch)}Hz` : 'NONE'}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/10 p-2 rounded text-center">
                    FILTER: {Math.round(chaosX * 100)}%
                  </div>
                  <div className="bg-white/10 p-2 rounded text-center">
                    DIST: {Math.round(chaosY * 100)}%
                  </div>
                </div>
              </>
            )}

            {/* Debug Info */}
            <div className="text-xs text-yellow-400 text-center p-2 bg-black/20 rounded">
              DEBUG: {debugInfo}
            </div>
            
            <div className="text-xs text-white/40 text-center">
              Voice Vol: {voiceVolume.toFixed(3)} | Playing: {isPlaying ? 'YES' : 'NO'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 