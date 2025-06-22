'use client';

import { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, useTexture, Stars } from '@react-three/drei';
import * as THREE from 'three';

interface OrbitalNodeProps {
  position: [number, number, number];
  icon: string;
  label: string;
  percentage: string;
  color: string;
  isCenter?: boolean;
  size?: number;
}

const OrbitalNode = ({ position, icon, label, percentage, color, isCenter = false, size = 0.6 }: OrbitalNodeProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const texture = useTexture(icon);

  // Pre-compute geometry and material
  const geometry = useMemo(() => new THREE.SphereGeometry(1, 32, 32), []);
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: texture,
      color,
      transparent: true,
      opacity: 1.0,
      metalness: 0.95,
      roughness: 0.05,
      emissive: new THREE.Color(color).multiplyScalar(hovered ? 1.0 : 0.4),
      emissiveIntensity: hovered ? 1.5 : 1.0,
    });
  }, [texture, color, hovered]);

  const glowMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: hovered ? 0.8 : 0.3,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
  }, [color, hovered]);

  useFrame((state) => {
    if (!isCenter && meshRef.current) {
      // Enhanced orbital animation with more complex movement
      const time = state.clock.getElapsedTime();
      meshRef.current.rotation.y = time * 0.4;
      meshRef.current.rotation.x = Math.sin(time * 0.6) * 0.15;
      meshRef.current.rotation.z = Math.cos(time * 0.3) * 0.1;
      
      // Enhanced floating animation
      meshRef.current.position.y = Math.sin(time * 2.5) * 0.15;
      
      // Add subtle scale animation
      const scale = 1 + Math.sin(time * 3) * 0.05;
      meshRef.current.scale.setScalar(scale);
    }
    
    if (glowRef.current) {
      glowRef.current.scale.setScalar(hovered ? 1.6 : 1.3);
      glowRef.current.rotation.copy(meshRef.current?.rotation || new THREE.Euler());
      glowRef.current.position.y = meshRef.current?.position.y || 0;
    }
    
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.getElapsedTime() * 0.8;
      const material = ringRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = hovered ? 1.0 : 0.4;
    }
  });

  const baseSize = isCenter ? 1.4 : size;
  const scale = hovered ? baseSize * 1.4 : baseSize;

  return (
    <group position={position}>
      {/* Enhanced glow effect */}
      <mesh
        ref={glowRef}
        geometry={geometry}
        material={glowMaterial}
        scale={baseSize * 1.5}
      />
      
      {/* Main sphere with enhanced material */}
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        scale={scale}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      />
      
      {/* Enhanced holographic ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[baseSize * 0.7, baseSize * 1.2, 32]} />
        <meshBasicMaterial 
          color="#00ffff" 
          transparent 
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Secondary ring for enhanced effect */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[baseSize * 0.9, baseSize * 1.0, 16]} />
        <meshBasicMaterial 
          color="#ffffff" 
          transparent 
          opacity={hovered ? 0.3 : 0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {!isCenter && (
        <>
          <Text
            position={[0, baseSize + 0.8, 0]}
            fontSize={0.28}
            color="#00ffff"
            anchorX="center"
            anchorY="middle"
            renderOrder={1}
            outlineWidth={0.03}
            outlineColor="#000000"
          >
            {label}
          </Text>
          <Text
            position={[0, baseSize + 0.3, 0]}
            fontSize={0.2}
            color="#FFD700"
            anchorX="center"
            anchorY="middle"
            renderOrder={1}
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            {percentage}
          </Text>
          
          {/* Enhanced energy beam effect when hovered */}
          {hovered && (
            <>
              <mesh position={[0, baseSize + 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 1.0, 8]} />
                <meshBasicMaterial 
                  color="#00ffff" 
                  transparent 
                  opacity={0.9}
                  side={THREE.DoubleSide}
                />
              </mesh>
              
              {/* Holographic data ring */}
              <mesh position={[0, baseSize + 0.7, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.8, 1.2, 32]} />
                <meshBasicMaterial 
                  color="#00ffff" 
                  transparent 
                  opacity={0.7}
                  side={THREE.DoubleSide}
                />
              </mesh>
            </>
          )}
        </>
      )}
    </group>
  );
};

interface ConnectionLineProps {
  start: [number, number, number];
  end: [number, number, number];
  color: string;
}

const ConnectionLine = ({ start, end, color }: ConnectionLineProps) => {
  const lineRef = useRef<THREE.Line>(null);
  
  const geometry = useMemo(() => {
    const points = [new THREE.Vector3(...start), new THREE.Vector3(...end)];
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [start, end]);

  const material = useMemo(() => {
    return new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.6,
      linewidth: 2,
    });
  }, [color]);

  useFrame((state) => {
    if (lineRef.current) {
      const material = lineRef.current.material as THREE.LineBasicMaterial;
      material.opacity = 0.4 + Math.sin(state.clock.getElapsedTime() * 3) * 0.2;
    }
  });

  return (
    <primitive ref={lineRef} object={new THREE.Line(geometry, material)} />
  );
};

// Energy Field Component
const EnergyField = () => {
  const fieldRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (fieldRef.current) {
      fieldRef.current.rotation.y = state.clock.getElapsedTime() * 0.2;
      const material = fieldRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.1 + Math.sin(state.clock.getElapsedTime() * 2) * 0.05;
    }
  });

  return (
    <mesh ref={fieldRef} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[3, 6, 64]} />
      <meshBasicMaterial 
        color="#00ffff" 
        transparent 
        opacity={0.1}
        side={THREE.DoubleSide}
        wireframe={true}
      />
    </mesh>
  );
};

// Particle Trails Component
const ParticleTrails = () => {
  const trailsRef = useRef<THREE.Points>(null);
  
  const trailsGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const particleCount = 200;
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 3 + Math.random() * 3;
      positions[i] = Math.cos(angle) * radius;
      positions[i + 1] = (Math.random() - 0.5) * 2;
      positions[i + 2] = Math.sin(angle) * radius;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, []);

  const trailsMaterial = useMemo(() => {
    return new THREE.PointsMaterial({
      color: '#00ffff',
      size: 0.02,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  useFrame((state) => {
    if (trailsRef.current) {
      trailsRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
    }
  });

  return (
    <points ref={trailsRef} geometry={trailsGeometry} material={trailsMaterial} />
  );
};

interface ThreeOrbitalViewProps {
  data: Array<{
    chain: string;
    percentage: number;
    color: string;
    icon: string;
  }>;
  centerIcon: string;
  height?: number;
}

export function ThreeOrbitalView({ data, centerIcon, height = 400 }: ThreeOrbitalViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 400, height: height });

  // Responsive sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({
          width: rect.width,
          height: rect.height
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [height]);

  // Adjust radius based on container size
  const radius = useMemo(() => {
    const minDimension = Math.min(containerSize.width, containerSize.height);
    return Math.max(2.5, minDimension / 100); // Responsive radius, smaller for dialogs
  }, [containerSize]);

  // Pre-compute node positions and connections
  const { nodes, connections } = useMemo(() => {
    const nodeData = data.map((item, index) => {
      const angle = (index / data.length) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const position: [number, number, number] = [x, 0, z];

      // Calculate size based on percentage (min 0.3, max 0.8 for dialogs)
      const size = Math.max(0.3, Math.min(0.8, (item.percentage / 100) * 1.2 + 0.2));

      return {
        position,
        icon: item.icon,
        label: item.chain,
        percentage: `${item.percentage}%`,
        color: item.color,
        size,
      };
    });

    const connectionData = nodeData.map((node) => ({
      start: [0, 0, 0] as [number, number, number],
      end: node.position,
      color: node.color,
    }));

    return { nodes: nodeData, connections: connectionData };
  }, [data, radius]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: `${height}px`, position: 'relative' }}>
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
        camera={{ position: [0, 5, 10], fov: 75 }}
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
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#00ffff" />
        <pointLight position={[-10, 5, -10]} intensity={0.8} color="#0088ff" />
        <pointLight position={[0, 15, 0]} intensity={0.5} color="#ffffff" />
        
        {/* Stars background */}
        <Stars 
          radius={100} 
          depth={50} 
          count={2000} 
          factor={4} 
          saturation={0} 
          fade 
          speed={0.8}
        />
        
        {/* Energy field */}
        <EnergyField />
        
        {/* Particle trails */}
        <ParticleTrails />
        
        {/* Center Node - USDC */}
        <OrbitalNode
          position={[0, 0, 0]}
          icon={centerIcon}
          label="USDC"
          percentage=""
          color="#2775CA"
          isCenter
        />
        
        {/* Orbital nodes */}
        {nodes.map((node, index) => (
          <OrbitalNode
            key={index}
            {...node}
          />
        ))}
        
        {/* Connection lines */}
        {connections.map((connection, index) => (
          <ConnectionLine
            key={index}
            {...connection}
          />
        ))}
        
        <OrbitControls
          enableZoom={true}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2}
          enableDamping={true}
          dampingFactor={0.05}
          rotateSpeed={0.5}
          autoRotate={true}
          autoRotateSpeed={0.3}
        />
      </Canvas>
    </div>
  );
} 