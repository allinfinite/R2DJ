'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Mic, MicOff, Play, Square } from 'lucide-react';
import * as Tone from 'tone';

interface VoiceLoopTestProps {
  chaosX?: number;
  chaosY?: number;
  reverbAmount?: number;
  delayAmount?: number;
}

export function VoiceLoopTest({ 
  chaosX = 0.5, 
  chaosY = 0.5, 
  reverbAmount = 0.5, 
  delayAmount = 0.3 
}: VoiceLoopTestProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [recordedBuffer, setRecordedBuffer] = useState<Tone.ToneAudioBuffer | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [bpm, setBpm] = useState(120);
  const [loopLength, setLoopLength] = useState(4); // bars

  // Audio references
  const recorderRef = useRef<Tone.Recorder | null>(null);
  const playerRef = useRef<Tone.Player | null>(null);
  const loopRef = useRef<Tone.Loop | null>(null);
  const micRef = useRef<Tone.UserMedia | null>(null);
  
  // Effects references
  const effectsRef = useRef<{ [key: string]: any }>({});

  const addDebug = useCallback((message: string) => {
    console.log('[VOICE LOOP TEST]', message);
    setDebugInfo(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`]);
  }, []);

  const initializeAudio = useCallback(async () => {
    try {
      addDebug('🎵 Initializing audio for voice loop test...');
      
      // Start Tone.js
      await Tone.start();
      addDebug('Tone.js started successfully');
      
      // Set transport BPM
      Tone.Transport.bpm.value = bpm;
      addDebug(`Transport BPM set to ${bpm}`);
      
      // Initialize microphone
      micRef.current = new Tone.UserMedia();
      addDebug('Microphone initialized');
      
      // Initialize recorder
      recorderRef.current = new Tone.Recorder();
      addDebug('Recorder initialized');
      
      // Initialize effects chain
      effectsRef.current = {
        // Filter controlled by chaos X (200Hz - 2200Hz)
        filter: new Tone.Filter(800, 'lowpass'),
        
        // Distortion controlled by chaos Y (0 - 0.8)
        distortion: new Tone.Distortion(0.2),
        
        // Reverb controlled by knob
        reverb: new Tone.Reverb(2),
        
        // Delay controlled by knob
        delay: new Tone.PingPongDelay(0.25, 0.3),
        
        // Bitcrusher for extra chaos
        bitcrusher: new Tone.BitCrusher(8),
        
        // Master volume
        volume: new Tone.Volume(0)
      };
      
      // Connect effects chain: filter -> distortion -> bitcrusher -> reverb -> delay -> volume -> destination
      effectsRef.current.filter
        .chain(
          effectsRef.current.distortion,
          effectsRef.current.bitcrusher,
          effectsRef.current.reverb,
          effectsRef.current.delay,
          effectsRef.current.volume,
          Tone.Destination
        );
      
      addDebug('Effects chain initialized');
      
      setIsInitialized(true);
      addDebug('✅ Audio system ready for voice loop test');
      
    } catch (error) {
      addDebug(`❌ Audio initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Audio initialization error:', error);
    }
  }, [bpm, addDebug]);

  const startRecording = useCallback(async () => {
    if (!micRef.current || !recorderRef.current) {
      addDebug('❌ Audio not initialized');
      return;
    }

    try {
      addDebug('🎤 Starting recording...');
      
      // Open microphone
      await micRef.current.open();
      addDebug('Microphone opened');
      
      // Connect mic to recorder
      micRef.current.connect(recorderRef.current);
      
      // Start recording
      recorderRef.current.start();
      setIsRecording(true);
      addDebug('🔴 Recording started - speak now!');
      
    } catch (error) {
      addDebug(`❌ Recording failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [addDebug]);

  const stopRecording = useCallback(async () => {
    if (!recorderRef.current || !micRef.current) return;

    try {
      addDebug('⏹️ Stopping recording...');
      
      // Stop recording and get the buffer
      const recording = await recorderRef.current.stop();
      setIsRecording(false);
      
      // Close microphone
      micRef.current.close();
      
      // Convert Blob to URL and then to ToneAudioBuffer
      const url = URL.createObjectURL(recording);
      const buffer = new Tone.ToneAudioBuffer(url);
      setRecordedBuffer(buffer);
      
      addDebug(`✅ Recording complete! Duration: ${buffer.duration.toFixed(2)}s`);
      
    } catch (error) {
      addDebug(`❌ Stop recording failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [addDebug]);

  const startLoop = useCallback(async () => {
    if (!recordedBuffer) {
      addDebug('❌ No recording to loop');
      return;
    }

    try {
      addDebug('🔄 Setting up loop...');
      
      // Create player with the recorded buffer
      if (playerRef.current) {
        playerRef.current.dispose();
      }
      
      // Connect player through effects chain
      playerRef.current = new Tone.Player(recordedBuffer).connect(effectsRef.current.filter);
      addDebug('Player created with recorded buffer and connected to effects');
      
      // Create loop
      if (loopRef.current) {
        loopRef.current.dispose();
      }
      
      const loopTime = `${loopLength}m`; // bars in Tone.js notation
      
      loopRef.current = new Tone.Loop((time) => {
        if (playerRef.current) {
          playerRef.current.start(time);
          addDebug('🎵 Loop triggered');
        }
      }, loopTime);
      
      // Start transport and loop
      loopRef.current.start(0);
      Tone.Transport.start();
      
      setIsPlaying(true);
      addDebug(`✅ Loop started! Playing every ${loopLength} bars at ${bpm} BPM`);
      
    } catch (error) {
      addDebug(`❌ Loop start failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [recordedBuffer, loopLength, bpm, addDebug]);

  const stopLoop = useCallback(() => {
    try {
      addDebug('⏹️ Stopping loop...');
      
      if (loopRef.current) {
        loopRef.current.stop();
        loopRef.current.dispose();
        loopRef.current = null;
      }
      
      Tone.Transport.stop();
      Tone.Transport.cancel();
      
      setIsPlaying(false);
      addDebug('✅ Loop stopped');
      
    } catch (error) {
      addDebug(`❌ Stop loop failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [addDebug]);

  const clearRecording = useCallback(() => {
    if (isPlaying) {
      stopLoop();
    }
    
    setRecordedBuffer(null);
    addDebug('🗑️ Recording cleared');
  }, [isPlaying, stopLoop, addDebug]);

  // Update effects based on chaos pad and knobs
  const updateEffects = useCallback(() => {
    if (!effectsRef.current || !isInitialized) return;

    try {
      // Chaos X controls filter frequency (200Hz - 2200Hz)
      const filterFreq = 200 + (chaosX * 2000);
      effectsRef.current.filter.frequency.value = filterFreq;

      // Chaos Y controls distortion amount (0 - 0.8)
      const distortionAmount = chaosY * 0.8;
      effectsRef.current.distortion.wet.value = distortionAmount;

      // Chaos Y also controls bitcrusher intensity
      const bitDepth = Math.max(1, Math.floor(16 - (chaosY * 12))); // 16 bits down to 4 bits
      effectsRef.current.bitcrusher.bits = bitDepth;

      // Knob controls
      effectsRef.current.reverb.wet.value = reverbAmount;
      effectsRef.current.delay.wet.value = delayAmount;

      // Debug effects values occasionally
      if (Math.random() < 0.1) { // 10% chance to log
        addDebug(`🎛️ FX: filter=${Math.round(filterFreq)}Hz, dist=${(distortionAmount*100).toFixed(0)}%, bits=${bitDepth}, rev=${(reverbAmount*100).toFixed(0)}%, del=${(delayAmount*100).toFixed(0)}%`);
      }

    } catch (error) {
      console.warn('Effects update error:', error);
    }
  }, [chaosX, chaosY, reverbAmount, delayAmount, isInitialized, addDebug]);

  // Update BPM when changed
  useEffect(() => {
    if (isInitialized) {
      Tone.Transport.bpm.value = bpm;
      addDebug(`BPM updated to ${bpm}`);
    }
  }, [bpm, isInitialized, addDebug]);

  // Update effects when chaos pad or knobs change
  useEffect(() => {
    updateEffects();
  }, [updateEffects]);

  // Continuous effects update when playing
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    if (isPlaying && isInitialized) {
      intervalId = setInterval(updateEffects, 100); // Update effects 10 times per second
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isPlaying, isInitialized, updateEffects]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (loopRef.current) {
        loopRef.current.dispose();
      }
      if (playerRef.current) {
        playerRef.current.dispose();
      }
      if (recorderRef.current) {
        recorderRef.current.dispose();
      }
      if (micRef.current) {
        micRef.current.close();
      }
      
      // Dispose effects
      Object.values(effectsRef.current).forEach(effect => {
        if (effect?.dispose) {
          effect.dispose();
        }
      });
      
      Tone.Transport.stop();
    };
  }, []);

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
      <h3 className="text-xl font-bold text-white mb-4 text-center">🎤 Voice Loop Test</h3>
      
      <div className="space-y-4">
        {/* Initialize */}
        {!isInitialized && (
          <button
            onClick={initializeAudio}
            className="w-full p-4 bg-blue-500 hover:bg-blue-600 rounded-lg font-bold text-white text-lg"
          >
            🎵 INITIALIZE AUDIO
          </button>
        )}

        {isInitialized && (
          <>
            {/* Controls */}
            <div className="grid grid-cols-2 gap-3">
              {/* Record Button */}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isPlaying}
                className={`p-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                    : recordedBuffer
                    ? 'bg-orange-500 hover:bg-orange-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                } ${isPlaying ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                {isRecording ? 'STOP REC' : recordedBuffer ? 'RE-RECORD' : 'RECORD'}
              </button>

              {/* Play/Stop Loop Button */}
              <button
                onClick={isPlaying ? stopLoop : startLoop}
                disabled={!recordedBuffer}
                className={`p-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  isPlaying
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-purple-500 hover:bg-purple-600 text-white'
                } ${!recordedBuffer ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isPlaying ? <Square size={16} /> : <Play size={16} />}
                {isPlaying ? 'STOP LOOP' : 'START LOOP'}
              </button>
            </div>

            {/* Settings */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-white text-sm mb-1">BPM: {bpm}</label>
                <input
                  type="range"
                  min="60"
                  max="180"
                  value={bpm}
                  onChange={(e) => setBpm(parseInt(e.target.value))}
                  disabled={isRecording || isPlaying}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-white text-sm mb-1">Loop: {loopLength} bars</label>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={loopLength}
                  onChange={(e) => setLoopLength(parseInt(e.target.value))}
                  disabled={isRecording || isPlaying}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Clear Recording */}
            {recordedBuffer && !isPlaying && (
              <button
                onClick={clearRecording}
                className="w-full p-2 bg-gray-500 hover:bg-gray-600 rounded-lg font-medium text-white text-sm"
              >
                🗑️ CLEAR RECORDING
              </button>
            )}

            {/* Effects Display */}
            {isInitialized && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-purple-500/20 p-2 rounded text-center text-white">
                  FILTER: {Math.round(200 + (chaosX * 2000))}Hz
                </div>
                <div className="bg-red-500/20 p-2 rounded text-center text-white">
                  DIST: {Math.round(chaosY * 100)}%
                </div>
                <div className="bg-blue-500/20 p-2 rounded text-center text-white">
                  REVERB: {Math.round(reverbAmount * 100)}%
                </div>
                <div className="bg-green-500/20 p-2 rounded text-center text-white">
                  DELAY: {Math.round(delayAmount * 100)}%
                </div>
              </div>
            )}

            {/* Status */}
            <div className="text-center space-y-2">
              <div className="text-white font-medium">
                {isRecording && '🔴 RECORDING...'}
                {isPlaying && '🔄 LOOPING WITH EFFECTS...'}
                {!isRecording && !isPlaying && recordedBuffer && '✅ READY TO LOOP'}
                {!isRecording && !isPlaying && !recordedBuffer && '🎤 READY TO RECORD'}
              </div>
              
              {recordedBuffer && (
                <div className="text-white/70 text-sm">
                  Recording: {recordedBuffer.duration.toFixed(2)}s
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="text-white/60 text-xs text-center space-y-1">
              <p>1. Click RECORD and speak/sing</p>
              <p>2. Click STOP REC when done</p>
              <p>3. Click START LOOP to hear it repeat in rhythm</p>
              <p>4. Adjust BPM and loop length as needed</p>
            </div>
          </>
        )}

        {/* Debug Info */}
        {debugInfo.length > 0 && (
          <div className="bg-black/30 rounded-lg p-3">
            <div className="text-yellow-400 text-xs font-mono space-y-1">
              {debugInfo.map((info, i) => (
                <div key={i}>{info}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 