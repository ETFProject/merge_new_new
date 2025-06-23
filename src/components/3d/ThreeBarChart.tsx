'use client';

import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Grid } from '@react-three/drei';
import * as THREE from 'three';

const ACCENT_COLOR = '#00ff00'; // Tactical Green

interface HolographicBarProps {
  position: [number, number, number];
  height: number;
  value: number;
  date: string;
  highlighted: boolean;
}

const HolographicBar = ({ position, height, value, date, highlighted }: HolographicBarProps) => {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame(() => {
    if (groupRef.current) {
        const targetScale = highlighted ? 1.1 : 1.0;
        groupRef.current.scale.lerp(new THREE.Vector3(1, targetScale, 1), 0.1);
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[0.4, height, 0.4]} />
        <meshStandardMaterial
          color={ACCENT_COLOR}
          emissive={ACCENT_COLOR}
          emissiveIntensity={0.5}
          transparent
          opacity={highlighted ? 0.9 : 0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
       <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[0.4, height, 0.4]} />
        <meshBasicMaterial wireframe color={ACCENT_COLOR} toneMapped={false} />
      </mesh>
      {highlighted && (
        <Text position={[0, height + 0.3, 0]} fontSize={0.2} color="white" anchorX="center">
          {value}
        </Text>
      )}
    </group>
  );
};

interface ThreeBarChartProps {
    data: Array<{
        date: string;
        value: number;
    }>;
}

function Scene({ data }: ThreeBarChartProps) {
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);

  const bars = useMemo(() => {
    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    return data.map((item, index) => {
      const height = ((item.value - min) / (max - min)) * 2 + 0.1;
      return {
        ...item,
        position: [index * 0.8 - (data.length * 0.4), 0, 0],
        height,
      };
    });
  }, [data]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[0, 5, 5]} intensity={1.5} color={ACCENT_COLOR} />
      <Grid
        infiniteGrid
        sectionColor={ACCENT_COLOR}
        sectionThickness={0.5}
        cellColor={'#444444'}
        cellThickness={0.5}
        fadeDistance={40}
      />
      
      <group>
        {bars.map((bar, i) => (
          <group 
            key={i}
            onPointerOver={() => setHighlightedIndex(i)}
            onPointerOut={() => setHighlightedIndex(null)}
          >
            <HolographicBar
              position={bar.position as [number, number, number]}
              height={bar.height}
              value={bar.value}
              date={bar.date}
              highlighted={highlightedIndex === i}
            />
          </group>
        ))}
      </group>
       <Text position={[0, -0.5, 0]} fontSize={0.2} color="white" anchorX="center">
        30-Day Performance
      </Text>
    </>
  );
}

export function ThreeBarChart({ data }: ThreeBarChartProps) {
  return (
    <Canvas camera={{ position: [0, 2, 8], fov: 50 }} style={{ background: 'transparent' }}>
      <Scene data={data} />
    </Canvas>
  );
} 