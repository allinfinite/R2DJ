'use client';

import { useCallback, useRef } from 'react';

interface AudioSlice {
  id: string;
  category: 'percussive' | 'tonal' | 'noise' | 'voice';
  color: string;
  duration: number;
}

interface CircularSlicerProps {
  audioSlices: AudioSlice[];
  selectedSlices: Set<string>;
  onSliceClick: (sliceId: string) => void;
  onSlicePlay: (sliceId: string) => void;
  keyboardMap: Map<string, string>;
}

export function CircularSlicer({
  audioSlices,
  selectedSlices,
  onSliceClick,
  onSlicePlay,
  keyboardMap
}: CircularSlicerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  
  const centerX = 120;
  const centerY = 120;
  const radius = 80;
  
  // Calculate positions for slices around the circle
  const getSlicePosition = useCallback((index: number, total: number) => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2; // Start from top
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    return { x, y, angle };
  }, []);

  if (audioSlices.length === 0) {
    return (
      <div className="w-60 h-60 flex items-center justify-center bg-white/5 rounded-full border border-white/20">
        <div className="text-white/60 text-sm text-center">
          Record audio<br />to see slices
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-60 h-60">
      <svg
        ref={svgRef}
        width="240"
        height="240"
        className="absolute inset-0 cursor-pointer"
        style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.1))' }}
      >
        {/* Background circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius + 10}
          fill="rgba(255,255,255,0.05)"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1"
        />
        
        {/* Inner circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={30}
          fill="rgba(255,255,255,0.1)"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="2"
        />
        
        {/* Center text */}
        <text
          x={centerX}
          y={centerY - 5}
          textAnchor="middle"
          fill="white"
          fontSize="10"
          fontWeight="bold"
        >
          R2DJ
        </text>
        <text
          x={centerX}
          y={centerY + 8}
          textAnchor="middle"
          fill="rgba(255,255,255,0.7)"
          fontSize="8"
        >
          CLASSIC
        </text>
        
        {/* Grid lines */}
        {[0, 1, 2, 3].map(i => {
          const angle = (i / 4) * 2 * Math.PI - Math.PI / 2;
          const startX = centerX + Math.cos(angle) * 30;
          const startY = centerY + Math.sin(angle) * 30;
          const endX = centerX + Math.cos(angle) * (radius + 10);
          const endY = centerY + Math.sin(angle) * (radius + 10);
          
          return (
            <line
              key={i}
              x1={startX}
              y1={startY}
              x2={endX}
              y2={endY}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
          );
        })}
        
        {/* Audio slices */}
        {audioSlices.map((slice, index) => {
          const { x, y } = getSlicePosition(index, audioSlices.length);
          const isSelected = selectedSlices.has(slice.id);
          const keyboardKey = Array.from(keyboardMap.entries()).find(([, id]) => id === slice.id)?.[0];
          
          return (
            <g key={slice.id}>
              {/* Slice circle */}
              <circle
                cx={x}
                cy={y}
                r={isSelected ? 12 : 8}
                fill={slice.color}
                stroke={isSelected ? 'white' : 'rgba(255,255,255,0.3)'}
                strokeWidth={isSelected ? 2 : 1}
                className="transition-all duration-200 cursor-pointer hover:r-10"
                onClick={() => {
                  onSlicePlay(slice.id);
                  onSliceClick(slice.id);
                }}
                style={{
                  filter: isSelected ? 'drop-shadow(0 0 8px rgba(255,255,255,0.5))' : 'none'
                }}
              />
              
              {/* Keyboard key label */}
              {keyboardKey && (
                <text
                  x={x}
                  y={y + 2}
                  textAnchor="middle"
                  fill="white"
                  fontSize="6"
                  fontWeight="bold"
                  pointerEvents="none"
                >
                  {keyboardKey.toUpperCase()}
                </text>
              )}
              
              {/* Category indicator */}
              <text
                x={x}
                y={y - 18}
                textAnchor="middle"
                fill="rgba(255,255,255,0.8)"
                fontSize="6"
                pointerEvents="none"
              >
                {slice.category.substring(0, 4).toUpperCase()}
              </text>
              
              {/* Duration indicator */}
              <text
                x={x}
                y={y + 22}
                textAnchor="middle"
                fill="rgba(255,255,255,0.6)"
                fontSize="5"
                pointerEvents="none"
              >
                {slice.duration.toFixed(1)}s
              </text>
            </g>
          );
        })}
        
        {/* Selection lines connecting to center */}
        {audioSlices.map((slice, index) => {
          if (!selectedSlices.has(slice.id)) return null;
          
          const { x, y } = getSlicePosition(index, audioSlices.length);
          
          return (
            <line
              key={`line-${slice.id}`}
              x1={centerX}
              y1={centerY}
              x2={x}
              y2={y}
              stroke={slice.color}
              strokeWidth="1"
              strokeOpacity="0.6"
              strokeDasharray="2,2"
            />
          );
        })}
      </svg>
      
      {/* Legend */}
      <div className="absolute -bottom-8 left-0 right-0 flex justify-center gap-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span className="text-white/60">PERC</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-white/60">TONE</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-white/60">VOICE</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
          <span className="text-white/60">NOISE</span>
        </div>
      </div>
    </div>
  );
} 