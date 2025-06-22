'use client';

import { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface NetworkNodeProps {
  position: [number, number, number];
  icon: string;
  label: string;
  color: string;
}

const NetworkNode = ({ position, icon, label, color }: NetworkNodeProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const texture = useTexture(icon);

  // Pre-compute geometry and material
  const geometry = useMemo(() => new THREE.SphereGeometry(1, 16, 16), []);
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: texture,
      color,
      transparent: true,
      opacity: 0.9,
      metalness: 0.5,
      roughness: 0.5,
    });
  }, [texture, color]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.2;
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        scale={hovered ? 0.7 : 0.6}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      />
      <Text
        position={[0, 1.5, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
        renderOrder={1}
      >
        {label}
      </Text>
    </group>
  );
};

interface FlowParticleProps {
  start: [number, number, number];
  end: [number, number, number];
  color: string;
  speed?: number;
}

const FlowParticle = ({ start, end, color, speed = 1 }: FlowParticleProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const startVec = useMemo(() => new THREE.Vector3(...start), [start]);
  const endVec = useMemo(() => new THREE.Vector3(...end), [end]);
  const direction = useMemo(() => endVec.clone().sub(startVec).normalize(), [startVec, endVec]);
  const length = useMemo(() => endVec.distanceTo(startVec), [startVec, endVec]);

  // Pre-compute geometry and material
  const geometry = useMemo(() => new THREE.SphereGeometry(0.1, 8, 8), []);
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.8,
    });
  }, [color]);
  
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime() * speed;
      const position = startVec.clone().add(
        direction.clone().multiplyScalar((time % length))
      );
      meshRef.current.position.copy(position);
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
    />
  );
};

interface ThreeNetworkGraphProps {
  nodes: Array<{
    id: string;
    icon: string;
    label: string;
    color: string;
    position: [number, number, number];
  }>;
  flows: Array<{
    from: string;
    to: string;
    color: string;
  }>;
  height?: number;
}

export function ThreeNetworkGraph({ nodes, flows, height = 400 }: ThreeNetworkGraphProps) {
  // Pre-compute node positions and flow data
  const { nodePositions, flowData } = useMemo(() => {
    const positions: { [key: string]: [number, number, number] } = {};
    nodes.forEach(node => {
      positions[node.id] = node.position;
    });

    const flowInfo = flows.map(flow => ({
      start: positions[flow.from],
      end: positions[flow.to],
      color: flow.color,
    }));

    return { nodePositions: positions, flowData: flowInfo };
  }, [nodes, flows]);

  return (
    <div style={{ width: '100%', height: `${height}px` }}>
      <Canvas
        camera={{ position: [0, 4, 8], fov: 75 }}
        dpr={[1, 2]}
        performance={{ min: 0.5 }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        
        {/* Nodes */}
        {nodes.map((node) => (
          <NetworkNode
            key={node.id}
            position={node.position}
            icon={node.icon}
            label={node.label}
            color={node.color}
          />
        ))}

        {/* Flow Particles */}
        {flowData.map((flow, index) => (
          <group key={`flow-${index}`}>
            <FlowParticle
              start={flow.start}
              end={flow.end}
              color={flow.color}
              speed={1 + Math.random() * 0.5}
            />
            <primitive object={new THREE.Line3(
              new THREE.Vector3(...flow.start),
              new THREE.Vector3(...flow.end)
            )}>
              <lineBasicMaterial
                color={flow.color}
                transparent
                opacity={0.2}
                linewidth={1}
              />
            </primitive>
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