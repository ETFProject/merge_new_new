'use client';

import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Text } from '@react-three/drei';
import * as THREE from 'three';

interface PieChartSegmentProps {
  startAngle: number;
  endAngle: number;
  color: string;
  radius: number;
  isHighlighted: boolean;
  onHover: (category: string | null) => void;
  category: string;
  percentage: number;
}

const PieChartSegment = ({ startAngle, endAngle, color, radius, isHighlighted, onHover, category, percentage }: PieChartSegmentProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.arc(0, 0, radius, startAngle, endAngle, false);
    s.lineTo(0, 0);
    return s;
  }, [startAngle, endAngle, radius]);

  const baseColor = useMemo(() => new THREE.Color(color), [color]);
  const highlightColor = useMemo(() => new THREE.Color(color).multiplyScalar(1.2), [color]);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(isHighlighted ? 1.05 : 1);
    }
  });

  return (
    <mesh
      ref={meshRef}
      onPointerOver={() => onHover(category)}
      onPointerOut={() => onHover(null)}
      geometry={new THREE.ExtrudeGeometry(shape, { depth: 0.2, bevelEnabled: false })}
    >
      <meshStandardMaterial 
        color={isHighlighted ? highlightColor : baseColor} 
        side={THREE.DoubleSide}
        metalness={0.6}
        roughness={0.4}
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
  height?: number;
}

export function ThreePieChart({ data, height = 400 }: ThreePieChartProps) {
  const [highlightedCategory, setHighlightedCategory] = useState<string | null>(null);

  const segments = useMemo(() => {
    let currentAngle = 0;
    const radius = 1.5;

    return data.map((item) => {
      const angle = (item.percentage / 100) * Math.PI * 2;
      const segment = {
        startAngle: currentAngle,
        endAngle: currentAngle + angle,
        color: item.color,
        radius,
        category: item.category,
        percentage: item.percentage,
      };
      currentAngle += angle;
      return segment;
    });
  }, [data]);

  return (
    <div style={{ width: '100%', height: `${height}px`, position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 0, 4], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, 5]} intensity={1} />
        
        <Stars radius={50} depth={20} count={1000} factor={2} saturation={0} fade speed={0.5} />
        
        <group rotation={[Math.PI / 6, Math.PI / 9, 0]}>
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
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        {data.map((item, index) => (
          <div 
            key={index} 
            className={`flex items-center gap-2 text-xs p-2 rounded-md transition-all ${highlightedCategory === item.category ? 'bg-slate-700/80' : 'bg-slate-800/50'}`}
            onMouseEnter={() => setHighlightedCategory(item.category)}
            onMouseLeave={() => setHighlightedCategory(null)}
          >
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-white font-medium">{item.category}</span>
            <span className="text-cyan-400 font-bold">{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
} 