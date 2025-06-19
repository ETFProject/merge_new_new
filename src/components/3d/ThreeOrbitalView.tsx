'use client';

import { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, useTexture } from '@react-three/drei';
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
      metalness: 0.1,
      roughness: 0.2,
      emissive: new THREE.Color(color).multiplyScalar(0.3),
    });
  }, [texture, color]);

  useFrame((state) => {
    if (!isCenter && meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.2;
    }
  });

  const baseSize = isCenter ? 1.2 : size;
  const scale = hovered ? baseSize * 1.2 : baseSize;

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        scale={scale}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      />
      {!isCenter && (
        <>
          <Text
            position={[0, baseSize + 0.5, 0]}
            fontSize={0.25}
            color="white"
            anchorX="center"
            anchorY="middle"
            renderOrder={1}
            outlineWidth={0.02}
            outlineColor="black"
          >
            {label}
          </Text>
          <Text
            position={[0, baseSize + 0.2, 0]}
            fontSize={0.18}
            color="#FFD700"
            anchorX="center"
            anchorY="middle"
            renderOrder={1}
            outlineWidth={0.01}
            outlineColor="black"
          >
            {percentage}
          </Text>
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

  return (
    <primitive object={new THREE.Line(geometry, material)} />
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
}

export function ThreeOrbitalView({ data, centerIcon }: ThreeOrbitalViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 400, height: 400 });

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
  }, []);

  // Adjust radius based on container size
  const radius = useMemo(() => {
    const minDimension = Math.min(containerSize.width, containerSize.height);
    return Math.max(2.5, minDimension / 80); // Responsive radius
  }, [containerSize]);

  // Pre-compute node positions and connections
  const { nodes, connections } = useMemo(() => {
    const nodeData = data.map((item, index) => {
      const angle = (index / data.length) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const position: [number, number, number] = [x, 0, z];

      // Calculate size based on percentage (min 0.4, max 1.0)
      const size = Math.max(0.4, Math.min(1.0, (item.percentage / 100) * 1.5 + 0.3));

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
    <div ref={containerRef} style={{ width: '100%', height: '400px' }}>
      <Canvas
        camera={{ position: [0, 4, 8], fov: 75 }}
        dpr={[1, 2]}
        performance={{ min: 0.5 }}
      >
        <ambientLight intensity={0.8} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <pointLight position={[-10, -10, -10]} intensity={0.8} />
        
        {/* Center Node - USDC */}
        <OrbitalNode
          position={[0, 0, 0]}
          icon={centerIcon}
          label="USDC"
          percentage=""
          color="#2775CA"
          isCenter
        />

        {/* Orbital Nodes */}
        {nodes.map((node, index) => (
          <group key={index}>
            <OrbitalNode {...node} />
            <ConnectionLine
              start={[0, 0, 0]}
              end={node.position}
              color={node.color}
            />
          </group>
        ))}

        <OrbitControls
          enableZoom={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI * 0.65}
          enableDamping={false}
          rotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
} 