'use client';

import { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

interface BarProps {
  position: [number, number, number];
  height: number;
  color: string;
  value: number;
  date: string;
  maxHeight: number;
}

const Bar = ({ position, height, color, value, date, maxHeight }: BarProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const normalizedHeight = (height / maxHeight) * 3;

  // Pre-compute geometry and material
  const geometry = useMemo(() => {
    return new THREE.BoxGeometry(0.5, normalizedHeight, 0.5);
  }, [normalizedHeight]);

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color,
      metalness: 0.5,
      roughness: 0.5,
      transparent: true,
      opacity: hovered ? 1 : 0.8,
    });
  }, [color, hovered]);

  useFrame(() => {
    if (meshRef.current) {
      const targetScale = hovered ? 1.1 : 1;
      meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, targetScale, 0.1);
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        position={[0, normalizedHeight / 2, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      />
      {hovered && (
        <>
          <Text
            position={[0, normalizedHeight + 0.5, 0]}
            fontSize={0.2}
            color="white"
            anchorX="center"
            anchorY="middle"
            renderOrder={1}
          >
            {`${value}`}
          </Text>
          <Text
            position={[0, normalizedHeight + 0.2, 0]}
            fontSize={0.15}
            color="gray"
            anchorX="center"
            anchorY="middle"
            renderOrder={1}
          >
            {date}
          </Text>
        </>
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

export function ThreeBarChart({ data }: ThreeBarChartProps) {
  // Pre-compute chart layout data
  const { maxValue, spacing, totalWidth, startX, bars } = useMemo(() => {
    const maxVal = Math.max(...data.map(item => item.value));
    const sp = 0.8;
    const totWidth = (data.length - 1) * sp;
    const sX = -totWidth / 2;

    const barData = data.map((item, index) => ({
      position: [sX + index * sp, 0, 0] as [number, number, number],
      height: item.value,
      color: `hsl(${(index * 30) % 360}, 80%, 60%)`,
      value: item.value,
      date: item.date,
    }));

    return {
      maxValue: maxVal,
      spacing: sp,
      totalWidth: totWidth,
      startX: sX,
      bars: barData,
    };
  }, [data]);

  // Pre-compute grid helper material
  const gridMaterial = useMemo(() => {
    return new THREE.LineBasicMaterial({
      color: '#666666',
      transparent: true,
      opacity: 0.4,
    });
  }, []);

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <Canvas
        camera={{ position: [0, 3, 8], fov: 75 }}
        style={{ background: 'transparent' }}
        dpr={[1, 2]}
        performance={{ min: 0.5 }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <group rotation={[0, 0, 0]}>
          {bars.map((bar, index) => (
            <Bar
              key={bar.date}
              {...bar}
              maxHeight={maxValue}
            />
          ))}
          
          {/* Base grid */}
          <gridHelper
            args={[10, 10]}
            position={[0, -0.01, 0]}
            material={gridMaterial}
          />
        </group>
        <OrbitControls
          enableZoom={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2}
          enableDamping={false}
          rotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
} 