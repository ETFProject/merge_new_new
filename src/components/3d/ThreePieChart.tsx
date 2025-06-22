'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import { BufferGeometry, Mesh } from 'three';

interface PieSegmentProps {
  radius: number;
  startAngle: number;
  endAngle: number;
  color: string;
  highlighted: boolean;
  onHover: (isHovered: boolean) => void;
  category: string;
  percentage: number;
}

const PieSegment = ({ radius, startAngle, endAngle, color, highlighted, onHover, category, percentage }: PieSegmentProps) => {
  const segmentRef = useRef<Mesh>(null!);
  const textRef = useRef<any>(null!);

  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.arc(0, 0, radius, startAngle, endAngle, false);
    s.lineTo(0, 0);
    return s;
  }, [radius, startAngle, endAngle]);

  const extrudeSettings = {
    steps: 1,
    depth: highlighted ? 0.3 : 0.2,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 2,
  };

  const textPosition = useMemo(() => {
    const midAngle = startAngle + (endAngle - startAngle) / 2;
    const r = radius * 1.3;
    return new THREE.Vector3(Math.cos(midAngle) * r, Math.sin(midAngle) * r, 0.2);
  }, [radius, startAngle, endAngle]);
  
  const leaderLinePoints = useMemo(() => {
    const midAngle = startAngle + (endAngle - startAngle) / 2;
    const p1 = new THREE.Vector3(
      Math.cos(midAngle) * radius * 0.9, 
      Math.sin(midAngle) * radius * 0.9, 
      extrudeSettings.depth / 2
    );
    const p2 = new THREE.Vector3(
      Math.cos(midAngle) * radius * 1.1, 
      Math.sin(midAngle) * radius * 1.1, 
      extrudeSettings.depth / 2
    );
    const p3 = new THREE.Vector3(
      textPosition.x, 
      textPosition.y, 
      textPosition.z
    );
    return [p1,p2,p3];
  }, [radius, startAngle, endAngle, textPosition, extrudeSettings.depth]);

  useFrame(() => {
    segmentRef.current.scale.z = THREE.MathUtils.lerp(segmentRef.current.scale.z, highlighted ? 1.5 : 1, 0.1);
  });
  
  return (
    <group onPointerOver={() => onHover(true)} onPointerOut={() => onHover(false)}>
      <mesh ref={segmentRef}>
        <extrudeGeometry args={[shape, extrudeSettings]} />
        <meshStandardMaterial
          color={color}
          metalness={0.7}
          roughness={0.3}
          emissive={highlighted ? color : '#000000'}
          emissiveIntensity={0.5}
        />
      </mesh>
      
      {highlighted && (
        <>
          <Text ref={textRef} position={textPosition} fontSize={0.2} color="white" anchorX="center">
            {`${category}: ${percentage.toFixed(1)}%`}
          </Text>
          <Line
            points={leaderLinePoints}
            color="white"
            lineWidth={1}
            transparent
            opacity={0.7}
          />
        </>
      )}
    </group>
  );
};

interface ThreePieChartProps {
  data: Array<{
    category: string;
    percentage: number;
    color: string;
    icon?: string;
  }>;
}

export function ThreePieChart({ data }: ThreePieChartProps) {
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);

  const segments = useMemo(() => {
    let currentAngle = 0;
    return data.map((item, index) => {
      const angle = (item.percentage / 100) * 2 * Math.PI;
      const segmentData = {
        ...item,
        startAngle: currentAngle,
        endAngle: currentAngle + angle,
        index,
      };
      currentAngle += angle;
      return segmentData;
    });
  }, [data]);

  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade />
      
      <group rotation={[Math.PI / 6, 0, 0]}>
        {segments.map((seg) => (
          <PieSegment
            key={seg.category}
            radius={1.5}
            startAngle={seg.startAngle}
            endAngle={seg.endAngle}
            color={seg.color}
            category={seg.category}
            percentage={seg.percentage}
            highlighted={highlightedIndex === seg.index}
            onHover={(isHovered) => setHighlightedIndex(isHovered ? seg.index : null)}
          />
        ))}
      </group>
    </Canvas>
  );
} 