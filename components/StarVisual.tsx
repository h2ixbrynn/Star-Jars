import React from 'react';

interface StarVisualProps {
  color: string;
  size?: number;
  rotation?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const StarVisual: React.FC<StarVisualProps> = ({ 
  color, 
  size = 24, 
  rotation = 0,
  className = '',
  style = {}
}) => {
  // A lucky star is roughly a pentagon with inflated sides.
  // We can simulate the "folded" look with a few gradients and a polygon clip path.
  
  return (
    <div
      className={`relative inline-block ${className}`}
      style={{
        width: size,
        height: size,
        transform: `rotate(${rotation}deg)`,
        filter: 'drop-shadow(1px 2px 2px rgba(0,0,0,0.15))',
        ...style
      }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
        {/* Main Star Body - 3D effect using shades */}
        <defs>
            <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: color, stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: color, stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: 'rgba(0,0,0,0.2)', stopOpacity: 1 }} />
            </linearGradient>
             <filter id="inset-shadow">
                <feOffset dx="0" dy="2"/>
                <feGaussianBlur stdDeviation="2" result="offset-blur"/>
                <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse"/>
                <feFlood floodColor="black" floodOpacity="0.2" result="color"/>
                <feComposite operator="in" in="color" in2="inverse" result="shadow"/>
                <feComposite operator="over" in="shadow" in2="SourceGraphic"/> 
            </filter>
        </defs>
        
        {/* The Lucky Star Shape */}
        <path 
            d="M50 0 L63 35 L100 38 L72 65 L80 100 L50 82 L20 100 L28 65 L0 38 L37 35 Z" 
            fill={color}
            stroke={`rgba(0,0,0,0.05)`}
            strokeWidth="1"
            style={{
                filter: 'brightness(1.1)',
            }}
        />
        
        {/* Crease lines to simulate folding */}
        <path d="M50 50 L50 0" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
        <path d="M50 50 L100 38" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
        <path d="M50 50 L80 100" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
        <path d="M50 50 L20 100" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        <path d="M50 50 L0 38" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      </svg>
    </div>
  );
};