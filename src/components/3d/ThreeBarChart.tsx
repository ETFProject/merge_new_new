'use client';

import { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Stars } from '@react-three/drei';
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
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const normalizedHeight = (height / maxHeight) * 3;

  // Pre-compute geometry and material
  const geometry = useMemo(() => {
    return new THREE.BoxGeometry(0.5, normalizedHeight, 0.5);
  }, [normalizedHeight]);

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: hovered ? 1 : 0.9,
      emissive: new THREE.Color(color).multiplyScalar(hovered ? 0.5 : 0.2),
    });
  }, [color, hovered]);

  const glowMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: hovered ? 0.6 : 0.2,
      side: THREE.BackSide,
    });
  }, [color, hovered]);

  useFrame((state) => {
    if (meshRef.current) {
      const targetScale = hovered ? 1.15 : 1;
      meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, targetScale, 0.1);
      
      // Add subtle rotation animation
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.5;
    }
    
    if (glowRef.current) {
      glowRef.current.scale.y = meshRef.current?.scale.y || 1;
      glowRef.current.rotation.y = meshRef.current?.rotation.y || 0;
    }
  });

  return (
    <group position={position}>
      {/* Glow effect */}
      <mesh
        ref={glowRef}
        geometry={geometry}
        material={glowMaterial}
        position={[0, normalizedHeight / 2, 0]}
        scale={[1.2, 1, 1.2]}
      />
      
      {/* Main bar */}
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        position={[0, normalizedHeight / 2, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      />
      
      {/* Holographic data display */}
      {hovered && (
        <>
          <Text
            position={[0, normalizedHeight + 0.8, 0]}
            fontSize={0.25}
            color="#00ffff"
            anchorX="center"
            anchorY="middle"
            renderOrder={1}
            outlineWidth={0.02}
            outlineColor="#000000"
            font="/fonts/Orbitron-Bold.ttf"
          >
            {`${value}`}
          </Text>
          <Text
            position={[0, normalizedHeight + 0.4, 0]}
            fontSize={0.15}
            color="#888888"
            anchorX="center"
            anchorY="middle"
            renderOrder={1}
            outlineWidth={0.01}
            outlineColor="#000000"
          >
            {date}
          </Text>
          
          {/* Holographic ring */}
          <mesh position={[0, normalizedHeight + 0.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.8, 1, 32]} />
            <meshBasicMaterial 
              color="#00ffff" 
              transparent 
              opacity={0.6}
              side={THREE.DoubleSide}
            />
          </mesh>
        </>
      )}
    </group>
  );
};

// Holographic Grid Component
const HolographicGrid = () => {
  const gridRef = useRef<THREE.GridHelper>(null);
  
  useFrame((state) => {
    if (gridRef.current) {
      gridRef.current.material.opacity = 0.3 + Math.sin(state.clock.getElapsedTime() * 2) * 0.1;
    }
  });

  return (
    <gridHelper
      ref={gridRef}
      args={[15, 15, '#00ffff', '#0088ff']}
      position={[0, -0.01, 0]}
      material={new THREE.LineBasicMaterial({
        color: '#00ffff',
        transparent: true,
        opacity: 0.3,
      })}
    />
  );
};

// Floating Particles Component
const FloatingParticles = () => {
  const particlesRef = useRef<THREE.Points>(null);
  
  const particlesGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const particleCount = 100;
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 20;
      positions[i + 1] = Math.random() * 10;
      positions[i + 2] = (Math.random() - 0.5) * 20;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, []);

  const particlesMaterial = useMemo(() => {
    return new THREE.PointsMaterial({
      color: '#00ffff',
      size: 0.05,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
      particlesRef.current.rotation.x = state.clock.getElapsedTime() * 0.05;
    }
  });

  return (
    <points ref={particlesRef} geometry={particlesGeometry} material={particlesMaterial} />
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
      color: `hsl(${(index * 45 + 180) % 360}, 100%, 70%)`, // More vibrant colors
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

  return (
    <div style={{ width: '100%', height: '400px', position: 'relative' }}>
      {/* Background gradient */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(ellipse at center, rgba(0,255,255,0.1) 0%, rgba(0,0,0,0.8) 70%)',
          zIndex: -1,
        }}
      />
      
      <Canvas
        camera={{ position: [0, 4, 10], fov: 75 }}
        style={{ background: 'transparent' }}
        dpr={[1, 2]}
        performance={{ min: 0.5 }}
      >
        {/* Enhanced lighting */}
        <ambientLight intensity={0.3} color="#001122" />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#00ffff" />
        <pointLight position={[-10, 5, -10]} intensity={0.8} color="#0088ff" />
        <pointLight position={[0, 15, 0]} intensity={0.5} color="#ffffff" />
        
        {/* Stars background */}
        <Stars 
          radius={100} 
          depth={50} 
          count={5000} 
          factor={4} 
          saturation={0} 
          fade 
          speed={1}
        />
        
        <group rotation={[0, 0, 0]}>
          {bars.map((bar, index) => (
            <Bar
              key={bar.date}
              {...bar}
              maxHeight={maxValue}
            />
          ))}
          
          {/* Holographic grid */}
          <HolographicGrid />
          
          {/* Floating particles */}
          <FloatingParticles />
        </group>
        
        <OrbitControls
          enableZoom={true}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2}
          enableDamping={true}
          dampingFactor={0.05}
          rotateSpeed={0.5}
          autoRotate={true}
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
} 