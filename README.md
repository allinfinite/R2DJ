# R2DJ 2.0: Emotion-to-Sound AI Music Companion

> An AI-powered, emotion-responsive music generator that enhances psychedelic and meditative experiences by dynamically generating or remixing sound based on real-time emotional cues.

![R2DJ Interface](./docs/screenshot.png)

## 🎯 Overview

R2DJ 2.0 is designed for trippers, meditators, and immersive artists who want to create a feedback loop between emotion, environment, and music. The app listens to your voice, analyzes your emotional state, and generates adaptive music in real-time.

## ✨ Features

### 🔊 Real-Time Emotion Detection
- **Voice Analysis**: Analyze tone, speed, and volume
- **Text Sentiment**: Process emotional cues from typed or spoken phrases
- **Audio Level Monitoring**: Visual feedback of microphone input

### 🎼 Adaptive Music Engine
- **Multiple Synthesis Layers**: Bass, pads, and lead melodies
- **Emotion Mapping**: Valence controls harmony, arousal controls tempo
- **Real-time Generation**: Music adapts every 2 seconds based on emotional input

### 🌌 Interactive Visualizer
- **Three Visual Modes**: Waveform, Particles, and Mandala
- **Emotion-Responsive**: Colors and patterns change with your emotional state
- **Real-time Animation**: Synced to audio output

### 🎛️ Mood Pack System
- **Mushroom Forest**: Earthy, organic, grounding rhythms
- **Cosmic Temple**: Ethereal ambient drones and crystalline tones
- **Alien Cathedral**: Futuristic glitch-techno with synthetic chimes
- **Womb Cave**: Primal deep pulses with cave-like reverb
- **Lucid Playground**: Bright, playful melodies with jazzy elements

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Modern web browser with microphone access
- HTTPS connection (required for microphone access)

### Installation

1. **Clone and Setup**
   ```bash
   git clone <your-repo-url>
   cd R2DJ
   npm install
   ```

2. **Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

3. **Enable Microphone**
   - Click "Start Listening" to enable voice emotion detection
   - Grant microphone permissions when prompted
   - For HTTPS in development, use `npm run dev -- --ssl`

### First Use

1. **Initialize Audio**: Click "Initialize Audio Engine" to set up Tone.js
2. **Select Mood Pack**: Choose your preferred sonic environment
3. **Start Listening**: Enable voice emotion detection
4. **Press Play**: Begin your emotion-responsive musical journey
5. **Interact**: Use the emotion wheel for manual control or speak naturally

## 🎵 How It Works

### Emotion Detection
The app analyzes your voice input in real-time:
- **Valence** (positive/negative): Detected from word sentiment and vocal tone
- **Arousal** (calm/excited): Detected from vocal energy and volume
- **Real-time Updates**: Emotion state updates continuously while listening

### Music Generation
Your emotions control various musical parameters:
- **Valence → Harmony**: Positive emotions create major chords, negative create minor
- **Arousal → Tempo**: Higher arousal increases BPM (60-120 range)
- **Arousal → Complexity**: More excited states trigger additional melodic elements
- **Mood Pack → Timbre**: Base frequency and waveform characteristics

### Visualization
Three visual modes respond to your emotional state:
- **Waveform**: Classic audio visualization with emotion-based colors
- **Particles**: Generative particle system influenced by arousal levels
- **Mandala**: Sacred geometry patterns that shift with emotional changes

## 🔧 Technical Architecture

### Frontend Stack
- **Next.js 14+**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Smooth animations

### Audio Engine
- **Tone.js**: Web Audio API wrapper for synthesis
- **Multiple Synthesizers**: Bass, pad, and lead sound layers
- **Effects Processing**: Reverb, delay, and filtering
- **Real-time Analysis**: FFT analysis for visualization

### Voice Processing
- **Web Speech API**: Browser-native speech recognition
- **Audio Context**: Real-time audio level monitoring
- **Sentiment Analysis**: Keyword-based emotion detection
- **Continuous Processing**: Non-blocking voice analysis

## 🛠️ Development

### Project Structure
```
src/
├── app/                 # Next.js app router
├── components/          # React components
│   ├── AudioEngine.tsx  # Music generation
│   ├── EmotionWheel.tsx # Manual emotion control
│   ├── MoodPacks.tsx    # Theme selection
│   ├── Visualizer.tsx   # Audio visualization
│   └── VoiceInput.tsx   # Speech recognition
├── types/               # TypeScript definitions
└── utils/               # Helper functions
```

### Available Scripts
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint

### Key Components

#### AudioEngine
Manages Tone.js synthesis and audio processing:
- Initialize audio context and synthesizers
- Map emotions to musical parameters
- Generate continuous audio output
- Provide visualization data

#### EmotionWheel
Interactive 2D emotion selection:
- Canvas-based circular interface
- Valence (X-axis) and Arousal (Y-axis)
- Visual feedback and real-time updates

#### VoiceInput
Speech recognition and emotion analysis:
- Web Speech API integration
- Real-time audio level monitoring
- Simple keyword-based sentiment analysis
- Microphone permission handling

## 🌟 Future Enhancements

### Phase 2 Features
- **Advanced AI**: Integration with OpenAI or local models for better emotion detection
- **Wearable Integration**: Heart rate, EEG, and breath sensors
- **Multi-user Sessions**: Collaborative emotional journeys
- **Mobile App**: Native iOS/Android versions
- **MIDI Integration**: Connect external instruments
- **Cloud Saves**: Store and share emotional music sessions

### Technical Improvements
- **WebRTC**: Peer-to-peer audio streaming
- **WebAssembly**: High-performance audio processing
- **Progressive Web App**: Offline functionality
- **Spatial Audio**: 3D positional sound
- **Machine Learning**: On-device emotion recognition

## 🧪 Testing & Feedback

### Local Testing
- Test with different voice inputs and emotional states
- Try all mood packs and visualizer modes
- Monitor browser console for errors
- Test microphone permissions across browsers

### Community Testing
- Share with psychonaut and meditation communities
- Gather feedback on emotion-music mapping accuracy
- A/B test different visual modes and mood packs
- Document edge cases and improvement suggestions

## 🙏 Philosophy

R2DJ is designed to create a safe, beautiful, and intuitive space for self-discovery and healing through the ritual of sound and emotion. The app respects the sacred nature of consciousness exploration while providing modern tools for enhanced experiences.

## 📄 License

MIT License - feel free to fork, modify, and share!

## 🤝 Contributing

Contributions welcome! Please read the contributing guidelines and submit pull requests for any improvements.

---

*"Where emotion meets sound, consciousness expands."*
