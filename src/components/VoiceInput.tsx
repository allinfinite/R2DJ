'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, WifiOff, AlertCircle } from 'lucide-react';

interface VoiceInputProps {
  onEmotionDetected: (emotion: { valence: number; arousal: number }) => void;
}

export function VoiceInput({ onEmotionDetected }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();

  // Check network connectivity
  useEffect(() => {
    const checkConnection = () => {
      setConnectionStatus(navigator.onLine ? 'online' : 'offline');
    };

    checkConnection();
    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);

    return () => {
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
    };
  }, []);

  useEffect(() => {
    // Check if Speech Recognition is supported
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        setIsSupported(false);
        setError('Speech recognition not supported in this browser');
        return;
      }

      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          }
        }
        if (finalTranscript) {
          setTranscript(finalTranscript);
          setError(null); // Clear any previous errors
          analyzeEmotion(finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        
        // Handle different types of errors
        switch (event.error) {
          case 'network':
            setError('Network connection required for speech recognition. Please check your internet connection.');
            break;
          case 'not-allowed':
            setError('Microphone access denied. Please allow microphone permissions.');
            break;
          case 'no-speech':
            setError('No speech detected. Try speaking closer to the microphone.');
            break;
          case 'audio-capture':
            setError('Microphone not found or not working.');
            break;
          case 'service-not-allowed':
            setError('Speech recognition service not available.');
            break;
          default:
            setError(`Speech recognition error: ${event.error}`);
        }
        
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        if (isListening) {
          // Automatically restart if it was supposed to be listening
          try {
            recognitionRef.current?.start();
          } catch (e) {
            console.warn('Could not restart speech recognition:', e);
            setIsListening(false);
          }
        }
      };
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isListening]);

  const startListening = async () => {
    if (!isSupported) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    if (connectionStatus === 'offline') {
      setError('Internet connection required for speech recognition');
      return;
    }

    try {
      setError(null);
      
      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }

      // Start audio level monitoring
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateAudioLevel = () => {
        if (analyserRef.current && isListening) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          setAudioLevel(average / 255);
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };

      updateAudioLevel();
      setIsListening(true);
    } catch (error: any) {
      console.error('Error accessing microphone:', error);
      if (error.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone permissions and try again.');
      } else if (error.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone and try again.');
      } else {
        setError('Error accessing microphone: ' + error.message);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsListening(false);
    setAudioLevel(0);
    setError(null);
  };

  const analyzeEmotion = (text: string) => {
    // Simple emotion analysis based on keywords
    // In production, this would use a proper sentiment analysis API
    const positiveWords = ['happy', 'joy', 'love', 'amazing', 'wonderful', 'great', 'fantastic', 'excellent', 'beautiful', 'awesome'];
    const negativeWords = ['sad', 'angry', 'hate', 'terrible', 'awful', 'bad', 'horrible', 'frustrated', 'depressed', 'annoyed'];
    const energeticWords = ['excited', 'energetic', 'pumped', 'hyper', 'intense', 'wild', 'crazy', 'active', 'dynamic'];
    const calmWords = ['calm', 'peaceful', 'relaxed', 'serene', 'quiet', 'gentle', 'soft', 'tranquil', 'zen'];

    const words = text.toLowerCase().split(' ');
    
    let valence = 0.5; // neutral
    let arousal = 0.5; // neutral

    words.forEach(word => {
      if (positiveWords.includes(word)) valence += 0.15;
      if (negativeWords.includes(word)) valence -= 0.15;
      if (energeticWords.includes(word)) arousal += 0.15;
      if (calmWords.includes(word)) arousal -= 0.15;
    });

    // Also factor in audio level for arousal
    arousal += audioLevel * 0.2;

    // Clamp values between 0 and 1
    valence = Math.max(0, Math.min(1, valence));
    arousal = Math.max(0, Math.min(1, arousal));

    onEmotionDetected({ valence, arousal });
  };

  // Manual emotion input as fallback
  const handleManualInput = (emotionText: string) => {
    if (emotionText.trim()) {
      setTranscript(emotionText);
      analyzeEmotion(emotionText);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Volume2 size={20} />
        Voice Input
        {connectionStatus === 'offline' && <WifiOff size={16} className="text-red-400" />}
      </h2>
      
      <div className="space-y-4">
        {/* Connection Status */}
        {connectionStatus === 'offline' && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm">
            <div className="flex items-center gap-2">
              <WifiOff size={16} />
              <span>Offline - Speech recognition requires internet connection</span>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 text-yellow-300 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Voice Control Button */}
        <button
          onClick={isListening ? stopListening : startListening}
          disabled={!isSupported || connectionStatus === 'offline'}
          className={`w-full p-4 rounded-lg font-medium transition-all ${
            !isSupported || connectionStatus === 'offline'
              ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
              : isListening
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            {!isSupported 
              ? 'Speech Recognition Not Supported'
              : connectionStatus === 'offline'
              ? 'Offline - Connect to Internet'
              : isListening 
              ? 'Stop Listening' 
              : 'Start Listening'
            }
          </div>
        </button>

        {/* Manual Text Input as Fallback */}
        {(!isSupported || connectionStatus === 'offline' || error) && (
          <div className="space-y-2">
            <label className="text-sm text-gray-300">Manual Emotion Input (Fallback)</label>
            <input
              type="text"
              placeholder="Type how you're feeling... (e.g., 'happy and excited' or 'calm and peaceful')"
              className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-pink-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleManualInput((e.target as HTMLInputElement).value);
                  (e.target as HTMLInputElement).value = '';
                }
              }}
            />
            <div className="text-xs text-gray-400">
              Press Enter to analyze your emotion
            </div>
          </div>
        )}

        {/* Audio Level Indicator */}
        {isListening && (
          <div className="space-y-2">
            <div className="text-sm text-gray-300">Audio Level</div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-100"
                style={{ width: `${audioLevel * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Transcript Display */}
        {transcript && (
          <div className="space-y-2">
            <div className="text-sm text-gray-300">Last Detected:</div>
            <div className="bg-white/5 rounded-lg p-3 text-sm">
              "{transcript}"
            </div>
          </div>
        )}

        <div className="text-xs text-gray-400">
          {isSupported 
            ? "Speak naturally to influence the music. Try words like 'happy', 'calm', 'energetic', or 'peaceful'."
            : "Use the manual input above to describe your emotions."
          }
        </div>
      </div>
    </div>
  );
}

// Extend the Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
} 