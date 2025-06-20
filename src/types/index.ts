// Core emotion types
export interface Emotion {
  valence: number; // 0-1, negative to positive
  arousal: number; // 0-1, calm to excited
}

// Audio engine types
export interface AudioConfig {
  masterVolume: number;
  emotionSensitivity: number;
  isInitialized: boolean;
  isMuted: boolean;
}

export interface MoodPack {
  id: string;
  name: string;
  description: string;
  baseFreq: number;
  waveform: 'sine' | 'square' | 'sawtooth' | 'triangle';
  reverb: number; // 0-1
  color: string;
  bgColor: string;
  textColor: string;
  tags: string[];
}

// Voice input types
export interface VoiceConfig {
  isListening: boolean;
  transcript: string;
  audioLevel: number;
  language: string;
}

// Visualizer types
export type VisualizerMode = 'waveform' | 'particles' | 'mandala';

export interface VisualizationData {
  audioData: number[];
  emotion: Emotion;
  isPlaying: boolean;
  mode: VisualizerMode;
}

// App state types
export interface AppState {
  isPlaying: boolean;
  currentEmotion: Emotion;
  selectedMoodPack: string;
  audioData: number[];
  voiceConfig: VoiceConfig;
  audioConfig: AudioConfig;
}

// Event types for component communication
export interface EmotionChangeEvent {
  emotion: Emotion;
  source: 'voice' | 'manual' | 'auto';
  timestamp: number;
}

export interface PlaybackEvent {
  isPlaying: boolean;
  timestamp: number;
}

// API types for future backend integration
export interface EmotionAnalysisRequest {
  text?: string;
  audioData?: ArrayBuffer;
  config?: {
    sensitivity: number;
    language: string;
  };
}

export interface EmotionAnalysisResponse {
  emotion: Emotion;
  confidence: number;
  processingTime: number;
}

// Settings types
export interface UserSettings {
  masterVolume: number;
  emotionSensitivity: number;
  preferredMoodPack: string;
  visualizerMode: VisualizerMode;
  autoDetectEmotion: boolean;
  voiceLanguage: string;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  timestamp: number;
  component: string;
} 