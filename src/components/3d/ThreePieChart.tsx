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
  const glowRef = useRef<THREE.Mesh>(null);
  
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
  const highlightColor = new THREE.Color(color).multiplyScalar(1.5);

  useFrame((state) => {
    if (meshRef.current) {
      // Add subtle floating animation
      meshRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 2 + startAngle) * 0.02;
      
      // Add rotation animation when highlighted
      if (isHighlighted) {
        meshRef.current.rotation.z = Math.sin(state.clock.getElapsedTime() * 3) * 0.1;
      }
    }
    
    if (glowRef.current) {
      glowRef.current.position.y = meshRef.current?.position.y || 0;
      glowRef.current.rotation.z = meshRef.current?.rotation.z || 0;
    }
  });

  return (
    <group>
      {/* Glow effect */}
      <mesh
        ref={glowRef}
        onPointerOver={() => onHover(category)}
        onPointerOut={() => onHover(null)}
      >
        <shapeGeometry args={[shape]} />
        <meshBasicMaterial 
          color={color}
          transparent
          opacity={isHighlighted ? 0.8 : 0.3}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Main segment */}
      <mesh
        ref={meshRef}
        onPointerOver={() => onHover(category)}
        onPointerOut={() => onHover(null)}
      >
        <shapeGeometry args={[shape]} />
        <meshStandardMaterial 
          color={isHighlighted ? highlightColor : baseColor} 
          side={THREE.DoubleSide}
          transparent
          opacity={isHighlighted ? 1 : 0.9}
          metalness={0.8}
          roughness={0.2}
          emissive={new THREE.Color(color).multiplyScalar(isHighlighted ? 0.5 : 0.1)}
        />
      </mesh>
      
      {/* Holographic edge */}
      <mesh
        onPointerOver={() => onHover(category)}
        onPointerOut={() => onHover(null)}
      >
        <shapeGeometry args={[shape]} />
        <meshBasicMaterial 
          color="#00ffff"
          transparent
          opacity={isHighlighted ? 0.6 : 0.2}
          side={THREE.FrontSide}
          wireframe={true}
        />
      </mesh>
      
      {/* Percentage text */}
      {isHighlighted && (
        <Text
          position={[
            Math.cos((startAngle + endAngle) / 2) * (radius * 0.7),
            Math.sin((startAngle + endAngle) / 2) * (radius * 0.7),
            0.1
          ]}
          fontSize={0.3}
          color="#00ffff"
          anchorX="center"
          anchorY="middle"
          renderOrder={1}
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {`${percentage}%`}
        </Text>
      )}
    </group>
  );
};

// Holographic Center Ring
const HolographicCenter = () => {
  const ringRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (ringRef.current && ringRef.current.material) {
      const material = ringRef.current.material as THREE.MeshBasicMaterial;
      ringRef.current.rotation.z = state.clock.getElapsedTime() * 0.5;
      material.opacity = 0.4 + Math.sin(state.clock.getElapsedTime() * 3) * 0.2;
    }
  });

  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.3, 0.5, 32]} />
      <meshBasicMaterial 
        color="#00ffff" 
        transparent 
        opacity={0.4}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

// Floating Data Particles
const DataParticles = () => {
  const particlesRef = useRef<THREE.Points>(null);
  
  const particlesGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const particleCount = 50;
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 2 + Math.random() * 2;
      positions[i] = Math.cos(angle) * radius;
      positions[i + 1] = (Math.random() - 0.5) * 2;
      positions[i + 2] = Math.sin(angle) * radius;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, []);

  const particlesMaterial = useMemo(() => {
    return new THREE.PointsMaterial({
      color: '#00ffff',
      size: 0.03,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.getElapsedTime() * 0.2;
    }
  });

  return (
    <points ref={particlesRef} geometry={particlesGeometry} material={particlesMaterial} />
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
    const radius = 1.8;

    return data.map((item) => {
      const endAngle = startAngle + (item.percentage / 100) * Math.PI * 2;
      const segment = {
        startAngle,
        endAngle,
        color: item.color,
        radius,
        category: item.category,
        percentage: item.percentage
      };
      startAngle = endAngle;
      return segment;
    });
  }, [data]);

  return (
    <div className={`flex flex-col items-center gap-8 w-full ${className}`}>
      <div ref={containerRef} className="w-full h-[400px] relative">
        {/* Background gradient */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(ellipse at center, rgba(0,255,255,0.1) 0%, rgba(0,0,0,0.8) 70%)',
            borderRadius: '12px',
            zIndex: -1,
          }}
        />
        
        <Canvas
          camera={{ position: [0, 0, 5], fov: 45 }}
          style={{ background: 'transparent' }}
          dpr={[1, 2]}
        >
          {/* Enhanced lighting */}
          <ambientLight intensity={0.4} color="#001122" />
          <pointLight position={[5, 5, 5]} intensity={1.2} color="#00ffff" />
          <pointLight position={[-5, -5, 5]} intensity={0.8} color="#0088ff" />
          
          {/* Stars background */}
          <Stars 
            radius={50} 
            depth={30} 
            count={2000} 
            factor={3} 
            saturation={0} 
            fade 
            speed={0.5}
          />
          
          <group>
            {segments.map((segment, index) => (
              <PieChartSegment 
                key={index} 
                {...segment} 
                isHighlighted={highlightedCategory === segment.category}
                onHover={setHighlightedCategory}
              />
            ))}
            
            {/* Holographic center */}
            <HolographicCenter />
            
            {/* Data particles */}
            <DataParticles />
          </group>
        </Canvas>
      </div>
      
      {/* Enhanced Legend */}
      <div className="flex flex-col gap-4 w-full max-w-[350px] px-4">
        {data.map((item, index) => (
          <div 
            key={index} 
            className={`flex items-center gap-3 text-sm cursor-pointer transition-all duration-300 p-3 rounded-lg ${
              highlightedCategory === item.category 
                ? 'opacity-100 scale-105 bg-cyan-500/10 border border-cyan-500/30' 
                : 'opacity-80 hover:opacity-90 hover:bg-cyan-500/5'
            }`}
            onMouseEnter={() => setHighlightedCategory(item.category)}
            onMouseLeave={() => setHighlightedCategory(null)}
          >
            {item.icon ? (
              <div className="relative">
                <img 
                  src={item.icon} 
                  alt={item.category}
                  className="w-8 h-8 rounded-full object-cover"
                />
                {highlightedCategory === item.category && (
                  <div className="absolute inset-0 rounded-full bg-cyan-500/30 animate-pulse" />
                )}
              </div>
            ) : (
              <div className="relative">
                <div 
                  className="w-8 h-8 rounded-full" 
                  style={{ backgroundColor: item.color }} 
                />
                {highlightedCategory === item.category && (
                  <div className="absolute inset-0 rounded-full bg-cyan-500/30 animate-pulse" />
                )}
              </div>
            )}
            <span className="flex-1 text-foreground font-medium">{item.category}</span>
            <span className="font-bold text-cyan-400">{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
} 