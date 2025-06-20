'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface VisualizerProps {
  audioData: number[];
  emotion: { valence: number; arousal: number };
  isPlaying: boolean;
}

export function Visualizer({ audioData, emotion, isPlaying }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [visualMode, setVisualMode] = useState<'waveform' | 'particles' | 'mandala'>('waveform');
  const [showVisual, setShowVisual] = useState(true);



  const drawWaveform = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, `hsla(${280 + emotion.valence * 80}, 70%, 20%, 0.3)`);
    gradient.addColorStop(1, `hsla(${240 + emotion.valence * 120}, 80%, 10%, 0.8)`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Show debug info if no audio data
    if (audioData.length === 0) {
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      if (isPlaying) {
        ctx.fillText('Waiting for audio data...', 10, 20);
      } else {
        ctx.fillText('Click START to begin visualization', 10, 20);
      }
      
      // Show a simple static pattern when not playing
      if (!isPlaying) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const centerY = height / 2;
        ctx.moveTo(0, centerY);
        for (let x = 0; x < width; x += 10) {
          ctx.lineTo(x, centerY + Math.sin(x * 0.1) * 20);
        }
        ctx.stroke();
      }
      return;
    }

    // Debug: show audio data info
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '10px Arial';
    ctx.fillText(`Audio: ${audioData.length} samples, max: ${Math.max(...audioData).toFixed(1)}`, 5, height - 5);

    // Draw waveform
    ctx.strokeStyle = `hsla(${300 + emotion.valence * 60}, 80%, ${50 + emotion.arousal * 30}%, 0.8)`;
    ctx.lineWidth = 2 + emotion.arousal * 3;
    ctx.beginPath();

    const sliceWidth = width / audioData.length;
    let x = 0;

    for (let i = 0; i < audioData.length; i++) {
      const v = (audioData[i] + 140) / 280; // Normalize audio data
      const y = v * height;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.stroke();

    // Add glow effect
    ctx.shadowColor = `hsla(${300 + emotion.valence * 60}, 80%, 70%, 0.5)`;
    ctx.shadowBlur = 10 + emotion.arousal * 20;
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  const drawParticles = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear with dark background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, width, height);

    const numParticles = Math.floor(10 + emotion.arousal * 40);
    
    for (let i = 0; i < numParticles; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = 1 + emotion.arousal * 5;
      
      // Color based on emotion
      const hue = 280 + emotion.valence * 80;
      const saturation = 70 + emotion.arousal * 30;
      const lightness = 40 + emotion.valence * 40;
      
      ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.6)`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
      
      // Add glow
      ctx.shadowColor = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.8)`;
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  };

  const drawMandala = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Clear with gradient
    const radialGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.min(width, height) / 2);
    radialGradient.addColorStop(0, `hsla(${240 + emotion.valence * 120}, 60%, 10%, 0.8)`);
    radialGradient.addColorStop(1, `hsla(${300 + emotion.valence * 60}, 80%, 5%, 0.9)`);
    
    ctx.fillStyle = radialGradient;
    ctx.fillRect(0, 0, width, height);

    const rings = 3 + Math.floor(emotion.arousal * 5);
    const petals = 6 + Math.floor(emotion.valence * 6);
    
    for (let ring = 1; ring <= rings; ring++) {
      const radius = (ring / rings) * Math.min(width, height) / 3;
      
      ctx.strokeStyle = `hsla(${280 + emotion.valence * 80}, 70%, ${30 + ring * 10}%, 0.6)`;
      ctx.lineWidth = 1 + emotion.arousal * 2;
      
      for (let petal = 0; petal < petals; petal++) {
        const angle = (petal / petals) * Math.PI * 2;
        const x1 = centerX + Math.cos(angle) * radius * 0.5;
        const y1 = centerY + Math.sin(angle) * radius * 0.5;
        const x2 = centerX + Math.cos(angle) * radius;
        const y2 = centerY + Math.sin(angle) * radius;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x1, y1);
        ctx.quadraticCurveTo(x2, y2, centerX, centerY);
        ctx.stroke();
      }
    }
  };

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !showVisual) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    switch (visualMode) {
      case 'waveform':
        drawWaveform(ctx, canvas);
        break;
      case 'particles':
        drawParticles(ctx, canvas);
        break;
      case 'mandala':
        drawMandala(ctx, canvas);
        break;
    }

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [showVisual, visualMode, isPlaying, audioData, emotion]);

  useEffect(() => {
    if (isPlaying && showVisual) {
      animate();
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, animate]);

  const visualModes = [
    { key: 'waveform', label: 'Waveform' },
    { key: 'particles', label: 'Particles' },
    { key: 'mandala', label: 'Mandala' }
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Controls */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex gap-1">
          {visualModes.map((mode) => (
            <button
              key={mode.key}
              onClick={() => setVisualMode(mode.key as typeof visualMode)}
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                visualMode === mode.key
                  ? 'bg-pink-500 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
        
        <button
          onClick={() => setShowVisual(!showVisual)}
          className="p-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
        >
          {showVisual ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 rounded-lg overflow-hidden bg-black/20">
        {showVisual ? (
          <canvas
            ref={canvasRef}
            width={400}
            height={180}
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <EyeOff size={32} className="mx-auto mb-2 opacity-50" />
              <div className="text-sm">Visualizer Disabled</div>
            </div>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="mt-3 text-xs text-gray-400 flex justify-between">
        <span>Mode: {visualMode}</span>
        <span>
          {isPlaying ? 
            `${audioData.length} samples` : 
            'Not playing'
          }
        </span>
      </div>
    </div>
  );
} 