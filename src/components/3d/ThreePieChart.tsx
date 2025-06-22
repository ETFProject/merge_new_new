'use client';

import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { Mesh } from 'three';

const ACCENT_COLOR = '#00ff00'; // Tactical Green

interface TacticalSegmentProps {
  radius: number;
  startAngle: number;
  endAngle: number;
  highlighted: boolean;
  onHover: (isHovered: boolean) => void;
  category: string;
  percentage: number;
}

const TacticalSegment = ({ radius, startAngle, endAngle, highlighted, onHover, category, percentage }: TacticalSegmentProps) => {
  const segmentRef = useRef<Mesh>(null!);
  const midAngle = startAngle + (endAngle - startAngle) / 2;

  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(radius * 0.4 * Math.cos(startAngle), radius * 0.4 * Math.sin(startAngle));
    s.arc(0, 0, radius * 0.4, startAngle, endAngle, false);
    s.arc(0, 0, radius, startAngle, endAngle, false);
    s.lineTo(radius * 0.4 * Math.cos(startAngle), radius * 0.4 * Math.sin(startAngle));
    return s;
  }, [radius, startAngle, endAngle]);

  const extrudeSettings = {
    steps: 1,
    depth: highlighted ? 0.2 : 0.1,
    bevelEnabled: false,
  };

  useFrame(() => {
    if (segmentRef.current) {
      const material = segmentRef.current.material as THREE.MeshStandardMaterial;
      const targetEmissive = highlighted ? ACCENT_COLOR : '#000000';
      if(material.emissive.getHexString() !== targetEmissive.replace('#', '')){
          material.emissive.lerp(new THREE.Color(targetEmissive), 0.1);
      }
    }
  });

  return (
    <group onPointerOver={() => onHover(true)} onPointerOut={() => onHover(false)}>
      <mesh ref={segmentRef}>
        <extrudeGeometry args={[shape, extrudeSettings]} />
        <meshStandardMaterial
          color={highlighted ? '#ffffff' : '#aaaaaa'}
          metalness={0.8}
          roughness={0.4}
          emissive={'#000000'}
          emissiveIntensity={1.5}
          transparent
          opacity={highlighted ? 0.9 : 0.6}
        />
      </mesh>
      <Text
        position={[Math.cos(midAngle) * (radius * 1.2), Math.sin(midAngle) * (radius * 1.2), 0]}
        fontSize={0.15}
        color={highlighted ? ACCENT_COLOR : 'white'}
        anchorX="center"
        rotation={[Math.PI / 2, 0, 0]}
      >
        {`${category.toUpperCase()}`}
      </Text>
      <Text
        position={[Math.cos(midAngle) * (radius * 0.7), Math.sin(midAngle) * (radius * 0.7), 0.15]}
        fontSize={0.2}
        color={highlighted ? '#000000' : ACCENT_COLOR}
        anchorX="center"
        rotation={[Math.PI / 2, 0, 0]}
      >
        {`${percentage.toFixed(1)}%`}
      </Text>
    </group>
  );
};

interface ThreePieChartProps {
  data: Array<{
    category: string;
    percentage: number;
  }>;
}

export function ThreePieChart({ data }: ThreePieChartProps) {
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);

  const segments = useMemo(() => {
    let currentAngle = Math.PI * 0.5; // Start from top
    const gap = 0.03;
    return data.map((item, index) => {
      const angle = (item.percentage / 100) * (2 * Math.PI - data.length * gap);
      const segmentData = {
        ...item,
        startAngle: currentAngle,
        endAngle: currentAngle + angle,
        index,
      };
      currentAngle += angle + gap;
      return segmentData;
    });
  }, [data]);

  return (
    <Canvas camera={{ position: [0, 4, 0], fov: 50 }} style={{ background: 'transparent' }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[0, 5, 5]} intensity={1.5} />
      <Grid
        rotation={[Math.PI / 2, 0, 0]}
        infiniteGrid
        sectionColor={ACCENT_COLOR}
        sectionThickness={0.5}
        cellColor={'#444444'}
        cellThickness={0.5}
        fadeDistance={25}
      />
      
      <group rotation={[-Math.PI / 2, 0, 0]}>
        {segments.map((seg, i) => (
          <TacticalSegment
            key={seg.category}
            radius={1.8}
            startAngle={seg.startAngle}
            endAngle={seg.endAngle}
            category={seg.category}
            percentage={seg.percentage}
            highlighted={highlightedIndex === i}
            onHover={(isHovered) => setHighlightedIndex(isHovered ? i : null)}
          />
        ))}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.02, 0.03, 64]} />
            <meshBasicMaterial color={ACCENT_COLOR} toneMapped={false} />
        </mesh>
         <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.8, 1.81, 128]} />
            <meshBasicMaterial color={ACCENT_COLOR} toneMapped={false} />
        </mesh>
      </group>
    </Canvas>
  );
} 