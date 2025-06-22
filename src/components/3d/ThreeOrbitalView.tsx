'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sparkles, Stars, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import { Group, Mesh } from 'three';

interface ChainNodeProps {
  position: [number, number, number];
  color: string;
  label: string;
  size: number;
}

const ChainNode = ({ position, color, label, size }: ChainNodeProps) => {
  const meshRef = useRef<Mesh>(null!);

  useFrame((state, delta) => {
    if(meshRef.current){
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial
          color={color}
          metalness={0.8}
          roughness={0.2}
          emissive={color}
          emissiveIntensity={0.6}
        />
      </mesh>
      <Text
        position={[0, size * 1.5, 0]}
        fontSize={0.25}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
};

interface OrbitLineProps {
    radius: number;
    color: string;
}

const OrbitLine = ({ radius, color }: OrbitLineProps) => {
  const points = useMemo(() => {
    const p = [];
    for (let i = 0; i <= 360; i++) {
      const rad = THREE.MathUtils.degToRad(i);
      p.push(new THREE.Vector3(Math.cos(rad) * radius, 0, Math.sin(rad) * radius));
    }
    return p;
  }, [radius]);
  
  return (
    <Line
        points={points}
        color={color}
        lineWidth={1}
        transparent
        opacity={0.2}
    />
  );
};

interface ThreeOrbitalViewProps {
    data: Array<{
        category: string;
        percentage: number;
        color: string;
    }>;
}

export function ThreeOrbitalView({ data }: ThreeOrbitalViewProps) {
  const groupRef = useRef<Group>(null!);

  useFrame((state, delta) => {
    if(groupRef.current) {
        groupRef.current.rotation.y += delta * 0.1;
    }
  });

  const nodes = useMemo(() => {
    return data.map((item, index) => {
      const angle = (index / data.length) * 2 * Math.PI;
      const radius = 2 + (index * 0.8);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      return { ...item, position: [x, 0, z] as [number, number, number], radius };
    });
  }, [data]);

  return (
    <Canvas camera={{ position: [0, 5, 8], fov: 60 }}>
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 0, 0]} intensity={2} color="#4a90e2" />
      <Stars radius={200} depth={50} count={5000} factor={7} saturation={0} fade />

      <group ref={groupRef} rotation={[Math.PI / 8, 0, 0]}>
        {/* Central star */}
        <mesh>
          <sphereGeometry args={[0.8, 32, 32]} />
          <meshStandardMaterial color="#4a90e2" emissive="#4a90e2" emissiveIntensity={1} />
        </mesh>
        <Sparkles count={50} scale={2} size={6} speed={0.4} color="#fff" />
        <Text
            position={[0, -1.2, 0]}
            fontSize={0.3}
            color="#4a90e2"
            anchorX="center"
            anchorY="middle"
          >
            ITF Core
        </Text>

        {/* Orbiting chain nodes */}
        {nodes.map((node, i) => (
          <group key={i}>
             <ChainNode
                position={node.position}
                color={node.color}
                label={`${node.category}: ${node.percentage}%`}
                size={0.3 + (node.percentage / 100) * 0.5}
            />
            <OrbitLine radius={node.radius} color={node.color} />
          </group>
        ))}
      </group>
    </Canvas>
  );
} 