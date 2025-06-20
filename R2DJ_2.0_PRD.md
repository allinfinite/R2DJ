# R2DJ 2.0: Emotion-to-Sound AI Music Companion

**Version:** 1.0  
**Date:** 2025-06-20  
**Author:** Daniel & ChatGPT  

---

## 🧠 Overview

R2DJ 2.0 is an AI-powered, emotion-responsive music generator that enhances psychedelic and meditative experiences by dynamically generating or remixing sound based on real-time emotional cues. Designed for trippers, meditators, and immersive artists, it creates a feedback loop between emotion, environment, and music.

---

## 🎯 Goals

- Create a web-based tool that listens, senses, or receives emotional input.
- Use AI models to generate or remix music based on that input in real-time.
- Offer custom "Set & Setting Packs" for varied psychedelic themes.
- Optionally sync visuals with sound for multi-sensory experiences.

---

## 🧩 Key Features

### 🔊 Real-Time Emotion Detection
- **Voice Input (Mic):** Analyze tone, speed, and volume.
- **Text Sentiment (Optional):** Process emotional cues from typed or spoken phrases.
- **Wearable Inputs (Phase 2):** Optional heart rate, breath rate, EEG via APIs.

### 🎼 Adaptive Music Engine
- **Tech Stack:** Tone.js, Magenta.js, or Ableton+Max
- **Music Modes:**
  - Ambient
  - Downtempo / Chillhop
  - Tribal / Organic
  - Glitch / Psy-tech
- **Affect Mapping:**
  - Calm → Harmonic drones
  - Anxious → Grounding rhythms
  - Joyful → Melodic sparkle
  - Sad → Spacious melancholy

### 🎛️ Interactive Interface
- Emotion wheel to adjust mood manually
- Voice command override: "More dreamy", "Drop the beat", etc.
- Real-time waveform + generative visuals

### 🌌 Visual Sync (Optional)
- Fractal or fluid-reactive visuals using p5.js or shaders
- Optional projection mapping mode

---

## 🚧 Technical Requirements

### Frontend
- Framework: Next.js or plain HTML5/JS
- Audio: Tone.js, Web Audio API
- Voice: Web Speech API / Whisper (Cloud or Local)

### Backend
- Python (for sentiment analysis & TTS)
- Whisper for speech-to-text
- GPT or open-source sentiment models

---

## 🗃️ MVP Deliverables

- [ ] Web UI with mic input
- [ ] Emotion classifier (voice or text)
- [ ] Music generator connected to emotion output
- [ ] Basic UI controls (mood slider, pause/play)
- [ ] Visualizer synced to sound
- [ ] Three preset “Set & Setting” themes

---

## 🌱 Future Features

- Live jam integration (MIDI or OSC)
- Multi-user collaborative journeys
- Mobile app version
- AI-generated affirmations synced to music

---

## 🎨 Mood Packs

| Name                | Description                                |
|---------------------|--------------------------------------------|
| Mushroom Forest     | Earthy, mycelial, rhythmic heartbeats      |
| Cosmic Temple       | Ambient drones, reverb-heavy crystalline   |
| Alien Cathedral     | Synthetic chimes, glitch-techno echoes     |
| Womb Cave           | Deep pulses, cave echoes, low sub bass     |
| Lucid Playground    | Bright plucks, jazzy swing, warm pads      |

---

## 🧪 Testing & Feedback Plan

- Closed testing with psychonaut community
- Integration with Muse or breath sensors
- A/B feedback sessions for music-emotion matching

---

## 🙏 Intent

To create a safe, beautiful, and intuitive space for self-discovery and healing through the ritual of sound and emotion.

---


---

## 🛠️ R2DJ Classic Mode (No AI)

For a non-AI version inspired by the original R2DJ, emotion-driven music can be achieved using rule-based logic and sensor inputs. This mode focuses on handcrafted audio scenes and real-time input mapping.

### 🎛️ Predefined Moods
Manually created audio packs linked to moods:
- Calm: Soft pads, slow BPM, reverb
- Playful: Bright melodies, mid-tempo beats
- Trippy: Reversed loops, delay FX
- Intense: Driving drums, distorted synths

### 🎤 Input Types & Logic
| Input Type     | Logic                            | Triggered Mood      |
|----------------|----------------------------------|---------------------|
| Voice Volume   | Loud & fast → Hype               | Intense             |
| Voice Cadence  | Slow & soft → Meditative         | Calm                |
| Keywords       | "Love", "Safe" → Calm            | Calm                |
| MIDI Buttons   | Manual control of scenes         | Any                 |
| Breath Sensor  | Faster = higher BPM              | Adaptive            |

### 🔧 Tech Stack (No AI)
- **Audio Engine:** Tone.js or Ableton Live
- **Input Detection:** Web Audio API for mic analysis
- **Logic Engine:** JavaScript rule-based triggers
- **Visuals (Optional):** p5.js or shaders
- **Controls:** Mood wheel, sliders, keyword triggers

### 🎚️ Mood Packs (Sample)
| Name            | BPM  | FX                | Instruments         |
|-----------------|------|------------------|---------------------|
| Mushroom Forest | 60   | Reverb, delay     | Flutes, pads        |
| Cosmic Temple   | 72   | Reverb, phaser    | Synths, bells       |
| Lucid Playground| 90   | Ping-pong delay   | Xylo, plucks        |
| Womb Cave       | 45   | Low-pass, sub-bass| Drones, pulses      |

### 🎯 Ideal Use
- Users who prefer no AI intervention
- Environments with latency-sensitive setups
- Modular synth or analog purists

---
