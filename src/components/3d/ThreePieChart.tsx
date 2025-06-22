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
  const ringRef = useRef<THREE.Mesh>(null);
  
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
  const highlightColor = new THREE.Color(color).multiplyScalar(1.3);

  useFrame((state) => {
    if (meshRef.current) {
      // Enhanced floating animation with subtle rotation
      meshRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 1.5 + startAngle) * 0.03;
      meshRef.current.rotation.z = Math.sin(state.clock.getElapsedTime() * 0.8) * 0.05;
      
      // Add rotation animation when highlighted
      if (isHighlighted) {
        meshRef.current.rotation.z += Math.sin(state.clock.getElapsedTime() * 4) * 0.1;
        meshRef.current.scale.setScalar(1.05);
      } else {
        meshRef.current.scale.setScalar(1);
      }
    }
    
    if (glowRef.current) {
      glowRef.current.position.y = meshRef.current?.position.y || 0;
      glowRef.current.rotation.z = meshRef.current?.rotation.z || 0;
      glowRef.current.scale.setScalar(meshRef.current?.scale.x || 1);
    }
    
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.getElapsedTime() * 0.8;
      const material = ringRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = isHighlighted ? 0.9 : 0.4;
    }
  });

  return (
    <group>
      {/* Enhanced glow effect */}
      <mesh
        ref={glowRef}
        onPointerOver={() => onHover(category)}
        onPointerOut={() => onHover(null)}
      >
        <shapeGeometry args={[shape]} />
        <meshBasicMaterial 
          color={color}
          transparent
          opacity={isHighlighted ? 0.9 : 0.4}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Main segment with enhanced material */}
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
          opacity={isHighlighted ? 1 : 0.95}
          metalness={0.9}
          roughness={0.1}
          emissive={new THREE.Color(color).multiplyScalar(isHighlighted ? 0.6 : 0.15)}
          emissiveIntensity={isHighlighted ? 1.2 : 0.8}
        />
      </mesh>
      
      {/* Enhanced holographic edge */}
      <mesh
        ref={ringRef}
        onPointerOver={() => onHover(category)}
        onPointerOut={() => onHover(null)}
      >
        <shapeGeometry args={[shape]} />
        <meshBasicMaterial 
          color="#00ffff"
          transparent
          opacity={isHighlighted ? 0.8 : 0.3}
          side={THREE.FrontSide}
          wireframe={true}
        />
      </mesh>
      
      {/* Enhanced percentage text with better positioning */}
      {isHighlighted && (
        <>
          <Text
            position={[
              Math.cos((startAngle + endAngle) / 2) * (radius * 0.6),
              Math.sin((startAngle + endAngle) / 2) * (radius * 0.6),
              0.1
            ]}
            fontSize={0.35}
            color="#00ffff"
            anchorX="center"
            anchorY="middle"
            renderOrder={1}
            outlineWidth={0.03}
            outlineColor="#000000"
          >
            {`${percentage}%`}
          </Text>
          
          {/* Category label */}
          <Text
            position={[
              Math.cos((startAngle + endAngle) / 2) * (radius * 0.8),
              Math.sin((startAngle + endAngle) / 2) * (radius * 0.8),
              0.1
            ]}
            fontSize={0.2}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            renderOrder={1}
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            {category}
          </Text>
          
          {/* Holographic ring effect */}
          <mesh position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[radius * 0.9, radius * 1.1, 32]} />
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
  height?: number;
}

export function ThreePieChart({ data, className = '', height = 400 }: ThreePieChartProps) {
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
    <div className={`flex flex-col items-center gap-4 w-full ${className}`}>
      <div ref={containerRef} style={{ width: '100%', height: `${height}px` }} className="relative">
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
          dpr={[1, 1.5]}
          performance={{ min: 0.8 }}
          gl={{ 
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            failIfMajorPerformanceCaveat: false
          }}
        >
          {/* Enhanced lighting */}
          <ambientLight intensity={0.4} color="#001122" />
          <pointLight position={[5, 5, 5]} intensity={1.2} color="#00ffff" />
          <pointLight position={[-5, -5, 5]} intensity={0.8} color="#0088ff" />
          
          {/* Stars background */}
          <Stars 
            radius={50} 
            depth={30} 
            count={1500} 
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
      
      {/* Enhanced Legend - Only show if there's enough space */}
      {height > 300 && (
        <div className="flex flex-col gap-2 w-full max-w-[300px] px-2">
          {data.map((item, index) => (
            <div 
              key={index} 
              className={`flex items-center gap-2 text-xs cursor-pointer transition-all duration-300 p-2 rounded-lg ${
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
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  {highlightedCategory === item.category && (
                    <div className="absolute inset-0 rounded-full bg-cyan-500/30 animate-pulse" />
                  )}
                </div>
              ) : (
                <div className="relative">
                  <div 
                    className="w-6 h-6 rounded-full" 
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
      )}
    </div>
  );
} 