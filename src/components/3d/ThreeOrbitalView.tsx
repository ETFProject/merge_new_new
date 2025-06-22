'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, useTexture, Stars } from '@react-three/drei';
import * as THREE from 'three';

interface OrbitalNodeProps {
  position: [number, number, number];
  icon: string;
  label: string;
  color: string;
  isCenter?: boolean;
}

const OrbitalNode = ({ position, icon, label, color, isCenter = false }: OrbitalNodeProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTexture(icon);

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: texture,
      color: isCenter ? '#ffffff' : color,
      metalness: 0.8,
      roughness: 0.2,
      emissive: isCenter ? '#ffffff' : color,
      emissiveIntensity: isCenter ? 0.5 : 0.2,
    });
  }, [texture, color, isCenter]);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
    }
  });

  const size = isCenter ? 1 : 0.5;

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        geometry={new THREE.SphereGeometry(size, 32, 32)}
        material={material}
      />
      {!isCenter && (
        <Text
          position={[0, size + 0.3, 0]}
          fontSize={0.2}
          color="white"
          anchorX="center"
        >
          {label}
        </Text>
      )}
    </group>
  );
};

interface ConnectionLineProps {
  start: THREE.Vector3;
  end: THREE.Vector3;
  color: string;
}

const ConnectionLine = ({ start, end, color }: ConnectionLineProps) => {
  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints([start, end]);
  }, [start, end]);

  return (
    <primitive object={new THREE.Line(geometry)}>
      <lineBasicMaterial color={color} transparent opacity={0.3} />
    </primitive>
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
  const { nodes, connections } = useMemo(() => {
    const radius = 2.5;
    const center = new THREE.Vector3(0, 0, 0);

    const nodeData = data.map((item, index) => {
      const angle = (index / data.length) * Math.PI * 2;
      const position = new THREE.Vector3(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      );
      return {
        ...item,
        position,
      };
    });

    const connectionData = nodeData.map(node => ({
      start: center,
      end: node.position,
      color: node.color,
    }));

    return { nodes: nodeData, connections: connectionData };
  }, [data]);

  return (
    <div style={{ width: '100%', height: `${height}px` }}>
      <Canvas
        camera={{ position: [0, 2, 6], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[0, 5, 5]} intensity={1} />
        <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />

        <OrbitalNode
          position={[0, 0, 0]}
          icon={centerIcon}
          label="Center"
          color="#ffffff"
          isCenter
        />
        
        {nodes.map((node, index) => (
          <OrbitalNode
            key={index}
            position={[node.position.x, node.position.y, node.position.z]}
            icon={node.icon}
            label={node.chain}
            color={node.color}
          />
        ))}

        {connections.map((connection, index) => (
          <ConnectionLine
            key={index}
            {...connection}
          />
        ))}
        
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI * (3/4)}
          autoRotate={true}
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
} 