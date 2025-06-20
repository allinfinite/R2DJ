'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface EmotionWheelProps {
  emotion: { valence: number; arousal: number };
  onChange: (emotion: { valence: number; arousal: number }) => void;
}

export function EmotionWheel({ emotion, onChange }: EmotionWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw gradient background
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();

    // Draw quadrant lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, canvas.height);
    ctx.stroke();

    // Draw emotion point
    const x = centerX + (emotion.valence - 0.5) * radius * 2;
    const y = centerY - (emotion.arousal - 0.5) * radius * 2;

    ctx.fillStyle = '#ff6b9d';
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, 2 * Math.PI);
    ctx.fill();

    // Draw emotion labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    
    // Top: High Arousal
    ctx.fillText('Excited', centerX, 15);
    // Bottom: Low Arousal
    ctx.fillText('Calm', centerX, canvas.height - 5);
    // Left: Negative Valence
    ctx.save();
    ctx.translate(15, centerY);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Negative', 0, 0);
    ctx.restore();
    // Right: Positive Valence
    ctx.save();
    ctx.translate(canvas.width - 15, centerY);
    ctx.rotate(Math.PI / 2);
    ctx.fillText('Positive', 0, 0);
    ctx.restore();
  }, [emotion]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updateEmotion(e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      updateEmotion(e);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updateEmotion = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    // Convert to emotion coordinates
    const valence = Math.max(0, Math.min(1, 0.5 + (x - centerX) / (radius * 2)));
    const arousal = Math.max(0, Math.min(1, 0.5 - (y - centerY) / (radius * 2)));

    onChange({ valence, arousal });
  };

  useEffect(() => {
    drawWheel();
  }, [drawWheel]);

  return (
    <div className="flex flex-col items-center">
      <canvas
        ref={canvasRef}
        width={200}
        height={200}
        className="border border-white/20 rounded-lg cursor-pointer"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <div className="mt-4 text-sm text-gray-300">
        <div>Valence: {(emotion.valence * 100).toFixed(0)}%</div>
        <div>Arousal: {(emotion.arousal * 100).toFixed(0)}%</div>
      </div>
    </div>
  );
} 