'use client';

import { useMemo, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { Mesh } from 'three';

interface SegmentData {
    category: string;
    percentage: number;
    color: string;
}

interface PieSegmentProps {
    segment: SegmentData & { startAngle: number; endAngle: number; };
    radius: number;
    startAngle: number;
    endAngle: number;
    isHighlighted: boolean;
    onHover: (category: string | null) => void;
}

const PieSegment = ({ segment, radius, startAngle, endAngle, isHighlighted, onHover }: PieSegmentProps) => {
  const meshRef = useRef<Mesh>(null!);
  const textRef = useRef<any>(null!);

  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.arc(0, 0, radius, startAngle, endAngle, false);
    s.lineTo(0, 0);
    return s;
  }, [radius, startAngle, endAngle]);

  const extrudeSettings = {
    steps: 2,
    depth: isHighlighted ? 0.3 : 0.2,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 2,
  };

  useFrame(() => {
    const targetColor = new THREE.Color(isHighlighted ? segment.color : segment.color);
    const emissiveColor = new THREE.Color(isHighlighted ? segment.color : '#000000');
    
    (meshRef.current.material as THREE.MeshStandardMaterial).color.lerp(targetColor, 0.1);
    (meshRef.current.material as THREE.MeshStandardMaterial).emissive.lerp(emissiveColor, 0.1);

    if (textRef.current) {
        textRef.current.fillOpacity = THREE.MathUtils.lerp(
            textRef.current.fillOpacity,
            isHighlighted ? 1 : 0,
            0.1
        );
    }
  });

  const midAngle = startAngle + (endAngle - startAngle) / 2;
  const textPosition: [number, number, number] = [
    Math.cos(midAngle) * (radius * 0.7),
    Math.sin(midAngle) * (radius * 0.7),
    extrudeSettings.depth + 0.1,
  ];

  return (
    <group
      onPointerOver={() => onHover(segment.category)}
      onPointerOut={() => onHover(null)}
    >
      <mesh ref={meshRef}>
        <extrudeGeometry args={[shape, extrudeSettings]} />
        <meshStandardMaterial
          color={segment.color}
          metalness={0.6}
          roughness={0.4}
          emissive={'#000000'}
          emissiveIntensity={2}
        />
      </mesh>
      <Text
        ref={textRef}
        position={textPosition}
        fontSize={0.25}
        color="white"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0}
      >
        {`${segment.percentage}%`}
      </Text>
    </group>
  );
};

interface ThreePieChartProps {
    data: SegmentData[];
}

export function ThreePieChart({ data }: ThreePieChartProps) {
  const [highlightedCategory, setHighlightedCategory] = useState<string | null>(null);

  const segments = useMemo(() => {
    let cumulativePercentage = 0;
    return data.map((item) => {
      const startAngle = (cumulativePercentage / 100) * 2 * Math.PI - Math.PI / 2;
      cumulativePercentage += item.percentage;
      const endAngle = (cumulativePercentage / 100) * 2 * Math.PI - Math.PI / 2;
      return { ...item, startAngle, endAngle };
    });
  }, [data]);

  return (
    <div className="w-full h-full relative">
      <Canvas camera={{ position: [0, 0, 4], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade />

        <group rotation={[Math.PI / 6, 0, 0]}>
          {segments.map((segment) => (
            <PieSegment
              key={segment.category}
              segment={segment}
              radius={1.5}
              startAngle={segment.startAngle}
              endAngle={segment.endAngle}
              isHighlighted={highlightedCategory === segment.category || highlightedCategory === null}
              onHover={setHighlightedCategory}
            />
          ))}
        </group>
      </Canvas>
      <div className="absolute bottom-4 left-4 flex flex-col gap-2 pointer-events-none">
        {data.map((item) => (
          <div key={item.category} className="flex items-center gap-2">
            <div style={{ backgroundColor: item.color }} className="w-3 h-3 rounded-sm" />
            <span className="text-white text-xs">{item.category}</span>
          </div>
        ))}
      </div>
    </div>
  );
} 