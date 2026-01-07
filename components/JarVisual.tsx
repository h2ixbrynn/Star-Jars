import React from 'react';
import { StarNote, JarShape } from '../types';
import { StarVisual } from './StarVisual';

interface JarVisualProps {
  stars: StarNote[];
  label: string;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  themeColor: string;
  shape?: JarShape; // This now acts as the Sticker Type
}

export const JarVisual: React.FC<JarVisualProps> = ({ 
  stars, 
  label, 
  onClick, 
  size = 'md',
  themeColor,
  shape = 'mason'
}) => {
  
  // Standard Mason Jar Dimensions
  const width = size === 'sm' ? 120 : size === 'md' ? 180 : 260;
  const height = size === 'sm' ? 160 : size === 'md' ? 240 : 340;
  const starSize = size === 'sm' ? 20 : size === 'md' ? 28 : 36;
  
  // Standard Jar Path (Mason Jar style)
  const jarPath = `M${width*0.15} 0 L${width*0.85} 0 L${width*0.85} ${height*0.08} L${width} ${height*0.12} L${width} ${height-height*0.08} Q${width} ${height} ${width-width*0.15} ${height} L${width*0.15} ${height} Q0 ${height} 0 ${height-height*0.08} L0 ${height*0.12} L${width*0.15} ${height*0.08} Z`;

  // Sticker Paths - Normalized to a 100x100 box
  const getStickerPath = (type: JarShape | string) => {
    switch (type) {
      // --- Animals & Nature ---
      case 'cat': 
        // Simple Cat Head
        return "M20 35 Q10 10 35 25 Q50 20 65 25 Q90 10 80 35 Q95 60 80 85 Q50 100 20 85 Q5 60 20 35 Z";
      case 'cloud': 
        // Fluffy Cloud
        return "M25 60 Q25 80 50 80 Q75 80 75 60 Q95 60 95 45 Q95 30 75 30 Q75 10 50 10 Q25 10 25 30 Q5 30 5 45 Q5 60 25 60 Z";
      case 'moon': 
        // Crescent Moon
        return "M65 15 A 35 35 0 1 1 65 85 A 25 25 0 1 0 65 15 Z";
      case 'flower': 
        // Rosette / Flower
        return "M50 20 Q60 5 75 20 Q90 35 75 50 Q90 65 75 80 Q60 95 50 80 Q40 95 25 80 Q10 65 25 50 Q10 35 25 20 Q40 5 50 20 Z";
      case 'abstract-1': // Leaf (Plant)
        return "M50 90 Q20 60 20 30 Q20 0 50 10 Q80 0 80 30 Q80 60 50 90 Z M50 10 L50 90";
      case 'abstract-2': // Sun (Nature)
        return "M50 15 L58 30 L75 25 L70 42 L85 50 L70 58 L75 75 L58 70 L50 85 L42 70 L25 75 L30 58 L15 50 L30 42 L25 25 L42 30 Z";
      case 'abstract-3': // Tree (Pine)
        return "M50 10 L85 70 H60 V95 H40 V70 H15 Z";

      // --- Daily Life / Objects ---
      case 'book': 
        // Open Book
        return "M10 40 Q25 55 50 40 Q75 55 90 40 L90 80 Q75 90 50 80 Q25 90 10 80 Z M50 40 L50 80";
      case 'dumbbell': 
        // Dumbbell / Weights
        return "M20 25 H30 V75 H20 Z M70 25 H80 V75 H70 Z M30 45 H70 V55 H30 Z";
      case 'bulb': 
        // Lightbulb
        return "M35 55 Q35 15 50 15 Q65 15 65 55 L58 75 L42 75 Z M45 75 L45 85 L55 85 L55 75";
      case 'money': 
        // Coin Stack
        return "M50 20 A30 15 0 1 1 50 50 A30 15 0 1 1 50 20 Z M20 35 V65 A30 15 0 0 0 80 65 V35";
      case 'bottle': 
        // Water Bottle / Flask
        return "M35 30 L35 80 Q35 90 50 90 Q65 90 65 80 L65 30 L60 30 L60 15 L40 15 L40 30 Z";
      case 'bowl': 
        // Simple Bowl
        return "M15 40 L85 40 Q85 85 50 85 Q15 85 15 40 Z";
      
      // --- Shapes ---
      case 'heart': 
        return "M50 30 C20 0, 0 40, 50 90 C100 40, 80 0, 50 30 Z";
      case 'star': 
        return "M50 10 L61 38 L90 38 L68 58 L78 88 L50 70 L22 88 L32 58 L10 38 L39 38 Z";

      // --- Default ---
      case 'mason':
      default:
         // Simple Round Label/Tag
         return "M50 10 A40 40 0 1 1 50 90 A40 40 0 1 1 50 10 Z";
    }
  };

  const clipPathId = `jar-clip-${label.replace(/\s/g, '')}-${stars.length}-${Math.random()}`; 

  return (
    <div 
      className="relative flex flex-col items-center group cursor-pointer transition-transform duration-300 hover:scale-105 shrink-0 snap-center"
      onClick={onClick}
    >
      <div 
        className="relative"
        style={{ width, height }}
      >
         <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible drop-shadow-2xl">
            <defs>
              <clipPath id={clipPathId}>
                 <path d={jarPath} />
              </clipPath>
              {/* Glass Gradient - Transparent */}
              <linearGradient id={`glassGradient`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.3" />
              </linearGradient>
            </defs>

            {/* Back of Jar Glass */}
            <path 
              d={jarPath} 
              fill="url(#glassGradient)" 
              stroke="rgba(255,255,255,0.5)" 
              strokeWidth="1"
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
                        <div className="absolute inset-0 flex items-center justify-center text-morandi-charcoal/30 font-hand text-xl text-center p-4 pt-10 pointer-events-none">
                            Empty...
                        </div>
                    )}
                </div>
            </foreignObject>
            
            {/* Front Glass Highlights & Rim */}
            <path 
              d={jarPath} 
              fill="none" 
              stroke={themeColor} // Subtle colored rim
              strokeWidth="4"
              strokeOpacity="0.3"
              className="pointer-events-none"
            />
            {/* Gloss Shine */}
            <path d={`M${width*0.8} ${height*0.2} Q${width*0.8} ${height*0.8} ${width*0.9} ${height*0.5}`} stroke="white" strokeWidth="4" strokeOpacity="0.4" fill="none" />
            <ellipse cx="25%" cy="25%" rx="10%" ry="15%" fill="rgba(255,255,255,0.3)" className="pointer-events-none blur-sm"/>

             {/* THE STICKER */}
             <g transform={`translate(${width * 0.3}, ${height * 0.4})`}>
                <svg width={width * 0.4} height={width * 0.4} viewBox="0 0 100 100" className="overflow-visible">
                    {/* Sticker Shadow */}
                    <path d={getStickerPath(shape)} fill="rgba(0,0,0,0.2)" transform="translate(2, 2)" />
                    {/* Sticker Body */}
                    <path d={getStickerPath(shape)} fill="#FFFFFF" stroke={themeColor} strokeWidth="3" />
                    {/* Sticker Texture / Icon hint - simplified */}
                    <path d={getStickerPath(shape)} fill={themeColor} fillOpacity="0.1" transform="scale(0.8) translate(10,10)" />
                </svg>
             </g>

         </svg>
      </div>

      {/* Label Tag - Only Text now, shape is standard */}
      <div 
        className="mt-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-md shadow-sm border border-morandi-charcoal/10 font-sans text-sm font-bold text-morandi-charcoal text-center max-w-[180px] truncate"
      >
        {label}
      </div>
    </div>
  );
};