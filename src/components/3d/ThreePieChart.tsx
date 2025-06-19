'use client';

import { useRef, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';

interface PieChartSegmentProps {
  startAngle: number;
  endAngle: number;
  color: string;
  radius: number;
  isHighlighted: boolean;
  onHover: (category: string | null) => void;
  category: string;
}

const PieChartSegment = ({ startAngle, endAngle, color, radius, isHighlighted, onHover, category }: PieChartSegmentProps) => {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(radius * Math.cos(startAngle), radius * Math.sin(startAngle));
  
  const curve = new THREE.EllipseCurve(
    0, 0,
    radius, radius,
    startAngle, endAngle,
    false, 0
  );
  
  const points = curve.getPoints(64);
  points.forEach(point => shape.lineTo(point.x, point.y));
  shape.lineTo(0, 0);

  const baseColor = new THREE.Color(color);
  const highlightColor = new THREE.Color(color).multiplyScalar(1.35);

  return (
    <mesh
      onPointerOver={() => onHover(category)}
      onPointerOut={() => onHover(null)}
    >
      <shapeGeometry args={[shape]} />
      <meshBasicMaterial 
        color={isHighlighted ? highlightColor : baseColor} 
        side={THREE.DoubleSide}
        transparent
        opacity={isHighlighted ? 1 : 0.85}
      />
    </mesh>
  );
};

interface ThreePieChartProps {
  data: Array<{
    category: string;
    percentage: number;
    color: string;
    icon?: string;
  }>;
  className?: string;
}

export function ThreePieChart({ data, className = '' }: ThreePieChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [highlightedCategory, setHighlightedCategory] = useState<string | null>(null);

  // Calculate segments
  const segments = useMemo(() => {
    let startAngle = 0;
    const radius = 1.5;

    return data.map((item) => {
      const endAngle = startAngle + (item.percentage / 100) * Math.PI * 2;
      const segment = {
        startAngle,
        endAngle,
        color: item.color,
        radius,
        category: item.category
      };
      startAngle = endAngle;
      return segment;
    });
  }, [data]);

  return (
    <div className={`flex flex-col items-center gap-8 w-full ${className}`}>
      <div ref={containerRef} className="w-full h-[300px] relative">
        <Canvas
          camera={{ position: [0, 0, 4], fov: 45 }}
          style={{ background: 'transparent' }}
        >
          <group>
            {segments.map((segment, index) => (
              <PieChartSegment 
                key={index} 
                {...segment} 
                isHighlighted={highlightedCategory === segment.category}
                onHover={setHighlightedCategory}
              />
            ))}
          </group>
        </Canvas>
      </div>
      
      {/* Legend */}
      <div className="flex flex-col gap-4 w-full max-w-[300px] px-4">
        {data.map((item, index) => (
          <div 
            key={index} 
            className={`flex items-center gap-3 text-sm cursor-pointer transition-all duration-200 ${
              highlightedCategory === item.category ? 'opacity-100 scale-105' : 'opacity-80 hover:opacity-90'
            }`}
            onMouseEnter={() => setHighlightedCategory(item.category)}
            onMouseLeave={() => setHighlightedCategory(null)}
          >
            {item.icon ? (
              <img 
                src={item.icon} 
                alt={item.category}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div 
                className="w-6 h-6 rounded-full" 
                style={{ backgroundColor: item.color }} 
              />
            )}
            <span className="flex-1 text-foreground">{item.category}</span>
            <span className="font-medium text-foreground">{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
} 