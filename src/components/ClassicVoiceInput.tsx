'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface ClassicVoiceInputProps {
  onVoiceVolume: (volume: number) => void;
  onVoiceCadence: (cadence: 'slow' | 'medium' | 'fast') => void;
  onKeywordTrigger: (keyword: string | null) => void;
}

export function ClassicVoiceInput({
  onVoiceVolume,
  onVoiceCadence
}: ClassicVoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [volume, setVolume] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState('');
  const [showManualControls, setShowManualControls] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const volumeHistoryRef = useRef<number[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Debug logging function
  const addDebug = (message: string) => {
    console.log('[MIC DEBUG]', message);
    setDebugInfo(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Manual trigger functions
  const triggerManualVolume = (vol: number) => {
    setVolume(vol);
    onVoiceVolume(vol);
    addDebug(`Manual trigger: ${vol}`);
    // Auto-fade volume after 1 second
    setTimeout(() => {
      setVolume(0);
      onVoiceVolume(0);
    }, 1000);
  };

  // Test microphone sensitivity
  const testMicrophone = () => {
    if (!analyserRef.current) {
      addDebug('No analyser for test');
      return;
    }
    
    addDebug('🧪 Testing microphone sensitivity...');
    
    // Force a single analysis frame to check raw values
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const waveformArray = new Uint8Array(analyserRef.current.fftSize);
    
    analyserRef.current.getByteFrequencyData(dataArray);
    analyserRef.current.getByteTimeDomainData(waveformArray);
    
    // Check raw values
    const freqValues = Array.from(dataArray).slice(0, 10);
    const waveValues = Array.from(waveformArray).slice(0, 10);
    
    addDebug(`Freq data sample: [${freqValues.join(', ')}]`);
    addDebug(`Wave data sample: [${waveValues.join(', ')}]`);
    
    // Calculate current levels
    const freqSum = dataArray.reduce((a, b) => a + b, 0);
    const waveVariance = waveformArray.reduce((sum, val) => sum + Math.abs(val - 128), 0);
    
    addDebug(`Freq sum: ${freqSum}, Wave variance: ${waveVariance}`);
    
    if (freqSum === 0 && waveVariance === 0) {
      addDebug('❌ No audio signal detected - check microphone permissions or hardware');
    } else {
      addDebug('✅ Audio signal present - adjusting sensitivity...');
    }
  };

  const startListening = async () => {
    try {
      setPermissionStatus('🎤 Requesting microphone access...');
      addDebug('Starting microphone access request...');
      
      // Check browser support
      if (!navigator.mediaDevices) {
        throw new Error('navigator.mediaDevices not supported');
      }
      
      if (!navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported');
      }

      addDebug('MediaDevices API available');

      // Check for existing permissions
      if (navigator.permissions) {
        try {
          const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          addDebug(`Current permission state: ${permission.state}`);
        } catch {
          addDebug('Could not query permissions');
        }
      }

      // List available audio devices
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        addDebug(`Found ${audioInputs.length} audio input devices`);
        audioInputs.forEach((device, i) => {
          addDebug(`Device ${i}: ${device.label || 'Unknown'}`);
        });
      } catch {
        addDebug('Could not enumerate devices');
      }

      // Try multiple constraint configurations
      const constraintOptions = [
        // Most permissive first
        { audio: true },
        // Specific settings
        { 
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          }
        },
        // With sample rate
        { 
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            sampleRate: 44100
          }
        }
      ];

      let stream: MediaStream | null = null;
      
      for (let i = 0; i < constraintOptions.length; i++) {
        try {
          addDebug(`Trying constraint option ${i + 1}...`);
          stream = await navigator.mediaDevices.getUserMedia(constraintOptions[i]);
          addDebug(`Success with constraint option ${i + 1}`);
          break;
        } catch (error: unknown) {
          addDebug(`Constraint option ${i + 1} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          if (i === constraintOptions.length - 1) {
            throw error; // Re-throw the last error
          }
        }
      }

      if (!stream) {
        throw new Error('Failed to get media stream with all constraint options');
      }

      streamRef.current = stream;
      addDebug(`Stream obtained: ${stream.getAudioTracks().length} audio tracks`);
      
      // Log track settings
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        const settings = audioTrack.getSettings();
        addDebug(`Track settings: sampleRate=${settings.sampleRate}, channelCount=${settings.channelCount}`);
      }

      setPermissionStatus('✅ Microphone access granted');

      // Create audio context with user interaction
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume context if suspended
      if (audioContextRef.current.state === 'suspended') {
        addDebug('Resuming suspended audio context...');
        await audioContextRef.current.resume();
      }
      
      addDebug(`Audio context state: ${audioContextRef.current.state}`);
      addDebug(`Audio context sample rate: ${audioContextRef.current.sampleRate}`);

      // Create analyser
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      analyserRef.current.minDecibels = -90;
      analyserRef.current.maxDecibels = -10;
      analyserRef.current.smoothingTimeConstant = 0.3; // Less smoothing for more responsive

      // Create source and connect
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      addDebug('Audio graph connected');

      setIsListening(true);
      setPermissionStatus('🎧 Listening for audio...');
      analyzeAudio();
      
    } catch (error: unknown) {
      console.error('Microphone error:', error);
      addDebug(`ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Microphone permission denied. Check browser settings.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No microphone found. Check system audio settings.';
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Microphone not supported in this browser.';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Microphone in use by another application.';
        } else if (error.name === 'OverconstrainedError') {
          errorMessage = 'Microphone constraints not supported.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setPermissionStatus(`❌ ${errorMessage}`);
      setShowManualControls(true);
    }
  };

  const stopListening = () => {
    addDebug('Stopping microphone...');
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        addDebug(`Stopped track: ${track.kind}`);
      });
      streamRef.current = null;
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
      addDebug('Audio context closed');
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    setIsListening(false);
    setVolume(0);
    setPermissionStatus('');
    onVoiceVolume(0);
  };

  const analyzeAudio = () => {
    if (!analyserRef.current) {
      addDebug('No analyser available');
      return;
    }

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const waveformArray = new Uint8Array(analyserRef.current.fftSize);
    
    let frameCount = 0;
    let lastVolumeUpdate = 0;
    
    const analyze = () => {
      if (!analyserRef.current || !isListening) return;
      
      frameCount++;
      
      // Get frequency data for volume calculation
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Get time domain data for waveform
      analyserRef.current.getByteTimeDomainData(waveformArray);
      
      // FORCE volume calculation from frequency data (more reliable)
      let freqSum = 0;
      let freqMax = 0;
      for (let i = 0; i < Math.min(bufferLength, 512); i++) { // Focus on lower frequencies
        freqSum += dataArray[i];
        freqMax = Math.max(freqMax, dataArray[i]);
      }
      
      // Calculate volume from frequency data (this is working based on your test)
      const freqVolume = freqSum / (Math.min(bufferLength, 512) * 255);
      const peakVolume = freqMax / 255;
      
      // Use frequency-based volume (since that's what's working in your test)
      const calculatedVolume = Math.max(freqVolume, peakVolume) * 5; // 5x amplification
      
      // FORCE update volume regardless of value
      setVolume(calculatedVolume);
      onVoiceVolume(calculatedVolume);
      
      const now = Date.now();
      
      // Debug more frequently and show all values
      if (frameCount % 20 === 0 || (now - lastVolumeUpdate) > 500) {
        lastVolumeUpdate = now;
        addDebug(`🎤 LIVE: freq=${freqSum}, peak=${freqMax}, vol=${calculatedVolume.toFixed(4)}`);
        
        // Force debug if any audio detected
        if (freqSum > 100) {
          addDebug(`🔊 STRONG SIGNAL: ${freqSum} (vol: ${calculatedVolume.toFixed(4)})`);
        }
      }
      
      // Draw waveform (use frequency data if wave data is flat)
      drawWaveform(waveformArray, dataArray);
      
      // Track volume history for cadence detection
      volumeHistoryRef.current.push(calculatedVolume);
      if (volumeHistoryRef.current.length > 20) {
        volumeHistoryRef.current.shift();
      }
      
      // Simple cadence detection with lower threshold
      if (volumeHistoryRef.current.length >= 10) {
        const recentVolumes = volumeHistoryRef.current.slice(-10);
        const peaks = recentVolumes.filter(v => v > 0.005).length; // Very low threshold
        
        if (peaks > 7) {
          onVoiceCadence('fast');
        } else if (peaks > 3) {
          onVoiceCadence('medium');
        } else {
          onVoiceCadence('slow');
        }
      }
      
      animationFrameRef.current = requestAnimationFrame(analyze);
    };
    
    analyze();
  };

  const drawWaveform = (waveformArray: Uint8Array, freqArray?: Uint8Array) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas with slight fade effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, width, height);

    // Draw center line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Check if waveform data is meaningful (not all 127s/128s)
    const waveVariance = waveformArray.reduce((sum, val) => sum + Math.abs(val - 128), 0);
    const useFreqData = waveVariance < 100 && freqArray; // If wave data is flat, use frequency data
    
    const dataToUse = useFreqData ? freqArray : waveformArray;
    const dataLength = dataToUse.length;

    // Draw waveform
    ctx.lineWidth = 2;
    ctx.strokeStyle = volume > 0.005 ? '#10b981' : '#6b7280';
    ctx.beginPath();

    const sliceWidth = width / Math.min(dataLength, 512); // Limit for performance
    let x = 0;

    for (let i = 0; i < Math.min(dataLength, 512); i++) {
      let y;
      if (useFreqData && freqArray) {
        // For frequency data, draw from bottom up
        y = height - (freqArray[i] / 255) * height;
      } else {
        // For time domain data, center around middle
        const v = waveformArray[i] / 128.0;
        y = (v * height) / 2;
      }

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.stroke();

    // Draw volume indicator
    if (volume > 0.001) {
      ctx.fillStyle = `rgba(16, 185, 129, ${Math.min(volume * 2, 1)})`;
      ctx.fillRect(0, 0, width * Math.min(volume * 50, 1), 4);
    }
  };

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return (
    <div className="space-y-3">
      <button
        onClick={isListening ? stopListening : startListening}
        className={`w-full p-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        {isListening ? <MicOff size={16} /> : <Mic size={16} />}
        {isListening ? 'STOP MIC' : 'START MIC'}
      </button>

      {/* Permission Status */}
      {permissionStatus && (
        <div className="text-xs text-center text-white/70 p-2 bg-black/20 rounded">
          {permissionStatus}
        </div>
      )}

      {/* Microphone Test Button */}
      {isListening && (
        <button
          onClick={testMicrophone}
          className="w-full p-2 bg-orange-500 hover:bg-orange-600 rounded-lg font-medium text-white text-sm"
        >
          🧪 TEST MIC LEVELS
        </button>
      )}

      {/* Debug Info */}
      {debugInfo.length > 0 && (
        <div className="text-xs text-yellow-300 p-2 bg-black/30 rounded max-h-32 overflow-y-auto">
          {debugInfo.map((info, i) => (
            <div key={i}>{info}</div>
          ))}
        </div>
      )}

      {/* Manual Controls (when mic not available) */}
      {showManualControls && (
        <div className="space-y-2">
          <div className="text-xs text-white/70 text-center">MANUAL TRIGGERS</div>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => triggerManualVolume(0.2)}
              className="p-2 bg-green-500 hover:bg-green-600 rounded text-xs font-medium"
            >
              SOFT
            </button>
            <button
              onClick={() => triggerManualVolume(0.5)}
              className="p-2 bg-yellow-500 hover:bg-yellow-600 rounded text-xs font-medium"
            >
              MED
            </button>
            <button
              onClick={() => triggerManualVolume(0.8)}
              className="p-2 bg-red-500 hover:bg-red-600 rounded text-xs font-medium"
            >
              LOUD
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => onVoiceCadence('slow')}
              className="p-1 bg-blue-500 hover:bg-blue-600 rounded text-xs"
            >
              SLOW
            </button>
            <button
              onClick={() => onVoiceCadence('medium')}
              className="p-1 bg-blue-500 hover:bg-blue-600 rounded text-xs"
            >
              MED
            </button>
            <button
              onClick={() => onVoiceCadence('fast')}
              className="p-1 bg-blue-500 hover:bg-blue-600 rounded text-xs"
            >
              FAST
            </button>
          </div>
        </div>
      )}

      {/* Input Waveform Visualizer */}
      {isListening && (
        <div className="space-y-2">
          <div className="text-xs text-white/70 text-center">MIC INPUT WAVEFORM</div>
          <canvas
            ref={canvasRef}
            width={280}
            height={80}
            className="w-full bg-black/50 rounded border border-white/20"
          />
        </div>
      )}

      {/* Volume indicator */}
      {(isListening || showManualControls) && (
        <div className="space-y-1">
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-red-400 transition-all duration-100"
              style={{ width: `${Math.min(volume * 1000, 100)}%` }} // Even more amplification
            />
          </div>
          <div className="text-xs text-white/60 text-center">
            VOL: {Math.round(volume * 100)}% | RAW: {volume.toFixed(5)} | AMP: {Math.round(volume * 1000)}%
          </div>
        </div>
      )}
    </div>
  );
} 