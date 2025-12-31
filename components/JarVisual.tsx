import React from 'react';
import { StarNote, JarShape } from '../types';
import { StarVisual } from './StarVisual';

interface JarVisualProps {
  stars: StarNote[];
  label: string;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  themeColor: string;
  shape?: JarShape;
}

export const JarVisual: React.FC<JarVisualProps> = ({ 
  stars, 
  label, 
  onClick, 
  size = 'md',
  themeColor,
  shape = 'mason'
}) => {
  
  const width = size === 'sm' ? 120 : size === 'md' ? 180 : 260;
  const height = size === 'sm' ? 160 : size === 'md' ? 240 : 340;
  const starSize = size === 'sm' ? 20 : size === 'md' ? 28 : 36;

  // Normalized path generators (assuming approx ~200x300 canvas, will scale via SVG viewBox)
  // W and H are the dynamic container dimensions
  const getShapePath = (w: number, h: number, type: JarShape) => {
    switch (type) {
      case 'cat':
        // Cat Head Shape
        return `M${w*0.2} ${h*0.3} L${w*0.1} ${h*0.1} L${w*0.35} ${h*0.15} Q${w*0.5} ${h*0.1} ${w*0.65} ${h*0.15} L${w*0.9} ${h*0.1} L${w*0.8} ${h*0.3} Q${w} ${h*0.5} ${w*0.9} ${h*0.8} Q${w*0.5} ${h} ${w*0.1} ${h*0.8} Q0 ${h*0.5} ${w*0.2} ${h*0.3} Z`;
      case 'cloud':
        return `M${w*0.2} ${h*0.5} Q0 ${h*0.5} 0 ${h*0.3} Q0 0 ${w*0.3} ${h*0.1} Q${w*0.5} 0 ${w*0.7} ${h*0.1} Q${w} 0 ${w} ${h*0.3} Q${w} ${h*0.5} ${w*0.8} ${h*0.5} Q${w} ${h} ${w*0.5} ${h*0.9} Q0 ${h} ${w*0.2} ${h*0.5} Z`;
      case 'moon':
        return `M${w*0.5} 0 C${w} 0 ${w} ${h} ${w*0.5} ${h} C${w*0.8} ${h*0.8} ${w*0.8} ${h*0.2} ${w*0.5} 0 Z`;
      case 'flower':
        // Simplified Tulip/Flower Pot
        return `M${w*0.2} ${h*0.2} Q${w*0.5} ${h*0.5} ${w*0.8} ${h*0.2} Q${w} ${h*0.1} ${w} ${h*0.4} Q${w} ${h*0.8} ${w*0.6} ${h} L${w*0.4} ${h} Q0 ${h*0.8} 0 ${h*0.4} Q0 ${h*0.1} ${w*0.2} ${h*0.2} Z`;
      case 'book':
        // Vertical book spine
        return `M${w*0.1} 0 L${w*0.8} 0 Q${w} 0 ${w} ${h*0.1} L${w} ${h*0.9} Q${w} ${h} ${w*0.8} ${h} L${w*0.1} ${h} Q0 ${h} 0 ${h*0.9} L0 ${h*0.1} Q0 0 ${w*0.1} 0 Z`; 
      case 'dumbbell':
        // Hexagonal weight plates
        return `M${w*0.3} ${h*0.3} L${w*0.7} ${h*0.3} L${w*0.7} ${h*0.7} L${w*0.3} ${h*0.7} Z M0 ${h*0.2} L${w} ${h*0.2} L${w} ${h*0.8} L0 ${h*0.8} Z`; // Fallback to a simple weight shape
      case 'bulb':
         return `M${w*0.3} ${h} L${w*0.7} ${h} L${w*0.7} ${h*0.7} Q${w} ${h*0.5} ${w} ${h*0.35} Q${w} 0 ${w*0.5} 0 Q0 0 0 ${h*0.35} Q0 ${h*0.5} ${w*0.3} ${h*0.7} Z`;
      case 'money':
         // Money Bag
         return `M${w*0.4} 0 L${w*0.6} 0 L${w*0.7} ${h*0.2} Q${w} ${h*0.3} ${w} ${h*0.6} Q${w} ${h} ${w*0.5} ${h} Q0 ${h} 0 ${h*0.6} Q0 ${h*0.3} ${w*0.3} ${h*0.2} Z`;
      case 'bottle':
        return `M${w*0.3} 0 L${w*0.7} 0 L${w*0.7} ${h*0.2} L${w} ${h*0.3} L${w} ${h-20} Q${w} ${h} ${w-20} ${h} L20 ${h} Q0 ${h} 0 ${h-20} L0 ${h*0.3} L${w*0.3} ${h*0.2} Z`;
      case 'heart':
        return `M${w/2} ${h*0.25} C${w} ${-h*0.1}, ${w} ${h*0.4}, ${w/2} ${h} C0 ${h*0.4}, 0 ${-h*0.1}, ${w/2} ${h*0.25} Z`;
      case 'bowl':
         return `M10 ${h*0.2} L${w-10} ${h*0.2} Q${w} ${h*0.2} ${w} ${h*0.4} C${w} ${h} 0 ${h} 0 ${h*0.4} Q0 ${h*0.2} 10 ${h*0.2} Z`;
      case 'star':
         return `M${w*0.5} 0 L${w*0.65} ${h*0.35} L${w} ${h*0.35} L${w*0.75} ${h*0.6} L${w*0.85} ${h} L${w*0.5} ${h*0.75} L${w*0.15} ${h} L${w*0.25} ${h*0.6} L0 ${h*0.35} L${w*0.35} ${h*0.35} Z`;
      case 'abstract-1': // Tall curvy
         return `M${w*0.2} 0 Q${w*0.8} ${h*0.2} ${w*0.6} ${h*0.5} Q${w*0.4} ${h*0.8} ${w*0.8} ${h} L${w*0.2} ${h} Q0 ${h*0.5} ${w*0.2} 0 Z`;
      case 'abstract-2': // Wide blob
         return `M${w*0.1} ${h*0.1} Q${w*0.5} 0 ${w*0.9} ${h*0.1} Q${w} ${h*0.5} ${w*0.8} ${h*0.9} Q${w*0.5} ${h} ${w*0.2} ${h*0.9} Q0 ${h*0.5} ${w*0.1} ${h*0.1} Z`;
      case 'abstract-3': // Asymmetric
         return `M${w*0.3} 0 L${w*0.8} ${h*0.1} Q${w} ${h*0.4} ${w*0.9} ${h*0.9} L${w*0.1} ${h} Q0 ${h*0.6} 0 ${h*0.3} Z`;
      case 'mason':
      default:
        return `M10 0 L${w-10} 0 L${w-10} 20 L${w} 30 L${w} ${h-20} Q${w} ${h} ${w-20} ${h} L20 ${h} Q0 ${h} 0 ${h-20} L0 30 L10 20 Z`;
    }
  };

  const clipPathId = `jar-clip-${shape}-${label.replace(/\s/g, '')}-${stars.length}`; // Unique ID

  // Adjust container aspect ratio based on shape
  let containerStyle: React.CSSProperties = {
     width: width,
     height: height,
  };

  // Fine tune bounding boxes for shapes
  if (shape === 'bowl' || shape === 'cloud') containerStyle = { width: width * 1.3, height: height * 0.8 };
  if (shape === 'bottle' || shape === 'cat') containerStyle = { width: width * 0.9, height: height * 1.1 };
  if (shape === 'star' || shape === 'flower' || shape === 'heart' || shape === 'abstract-2') containerStyle = { width: width * 1.1, height: width * 1.1 };
  if (shape === 'book') containerStyle = { width: width * 0.8, height: height };

  return (
    <div 
      className="relative flex flex-col items-center group cursor-pointer transition-transform duration-300 hover:scale-105 shrink-0 snap-center"
      onClick={onClick}
    >
      <div 
        className="relative"
        style={containerStyle}
      >
         <svg width="100%" height="100%" viewBox={`0 0 ${containerStyle.width} ${containerStyle.height}`} className="overflow-visible drop-shadow-xl">
            <defs>
              <clipPath id={clipPathId}>
                 <path d={getShapePath(Number(containerStyle.width), Number(containerStyle.height), shape as JarShape)} />
              </clipPath>
              {/* Tinted Glass Gradient */}
              <linearGradient id={`glassGradient-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={themeColor} stopOpacity="0.1" />
                  <stop offset="40%" stopColor={themeColor} stopOpacity="0.05" />
                  <stop offset="60%" stopColor="white" stopOpacity="0.2" />
                  <stop offset="100%" stopColor={themeColor} stopOpacity="0.2" />
              </linearGradient>
            </defs>

            {/* Background of Jar (Glass effect) - NOW TINTED and DARKER STROKE */}
            <path 
              d={getShapePath(Number(containerStyle.width), Number(containerStyle.height), shape as JarShape)} 
              fill={`url(#glassGradient-${label})`} 
              stroke={themeColor} // Colored border instead of white
              strokeWidth="3"
              strokeOpacity="0.6"
              className="backdrop-blur-sm"
            />

            {/* Stars Container (Clipped to Jar Shape) */}
            <foreignObject x="0" y="0" width="100%" height="100%" clipPath={`url(#${clipPathId})`}>
                <div className="w-full h-full relative">
                    {stars.map((star) => (
                        <div
                        key={star.id}
                        className="absolute transition-all duration-700 ease-out"
                        style={{
                            left: `${star.x}%`,
                            bottom: `${star.y}%`, 
                            zIndex: Math.floor(star.y),
                            // Small random rotation offset for natural look
                            transform: `rotate(${Math.sin(star.x) * 20}deg)` 
                        }}
                        >
                        <StarVisual 
                            color={star.color} 
                            size={starSize} 
                            rotation={star.rotation} 
                        />
                        </div>
                    ))}
                    {/* Empty state hint */}
                    {stars.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-morandi-charcoal/30 font-hand text-xl text-center p-4 pt-10">
                            Empty...
                        </div>
                    )}
                </div>
            </foreignObject>
            
            {/* Glass Highlights (Overlay) - Reflections */}
            <path 
              d={getShapePath(Number(containerStyle.width), Number(containerStyle.height), shape as JarShape)} 
              fill="none" 
              stroke="rgba(255,255,255,0.6)" 
              strokeWidth="2"
              className="pointer-events-none"
              strokeDasharray="20, 10, 5, 20" // Broken highlights
            />
            {/* Gloss Shine */}
            <ellipse cx="25%" cy="25%" rx="10%" ry="15%" fill="rgba(255,255,255,0.4)" className="pointer-events-none blur-sm"/>
         </svg>
      </div>

      {/* Label Tag - More organic visual */}
      <div 
        className="mt-6 px-4 py-1 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border border-morandi-charcoal/10 font-hand text-2xl text-morandi-charcoal text-center transform rotate-1 group-hover:rotate-0 transition-transform max-w-[200px] truncate"
      >
        {label}
        <span className="block text-sm font-sans text-morandi-slate font-bold">{stars.length}</span>
      </div>
    </div>
  );
};