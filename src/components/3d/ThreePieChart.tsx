'use client';

import { useMemo, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { Mesh } from 'three';

function getContrastYIQ(hexcolor: string){
    if (!hexcolor) return 'white';
    hexcolor = hexcolor.replace("#", "");
	var r = parseInt(hexcolor.substr(0,2),16);
	var g = parseInt(hexcolor.substr(2,2),16);
	var b = parseInt(hexcolor.substr(4,2),16);
	var yiq = ((r*299)+(g*587)+(b*114))/1000;
	return (yiq >= 128) ? 'black' : 'white';
}

interface SegmentData {
    category: string;
    percentage: number;
    color: string;
}

interface PieSegmentProps {
    segment: SegmentData & { startAngle: number; endAngle: number; };
    radius: number;
    startAngle: number;
    endAngle: number;
    isHighlighted: boolean;
    onHover: (category: string | null) => void;
}

const PieSegment = ({ segment, radius, startAngle, endAngle, isHighlighted, onHover }: PieSegmentProps) => {
  const meshRef = useRef<Mesh>(null!);
  const textRef = useRef<any>(null!);
  const textColor = useMemo(() => getContrastYIQ(segment.color), [segment.color]);

  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.arc(0, 0, radius, startAngle, endAngle, false);
    s.lineTo(0, 0);
    return s;
  }, [radius, startAngle, endAngle]);

  const extrudeSettings = {
    steps: 1,
    depth: isHighlighted ? 0.3 : 0.2,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 2,
  };

  useFrame(() => {
    const targetEmissiveIntensity = isHighlighted ? 0.5 : 0;
    if (meshRef.current) {
        (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = THREE.MathUtils.lerp(
            (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity,
            targetEmissiveIntensity,
            0.1
        );
    }

    if (textRef.current) {
        const targetOpacity = isHighlighted ? 1 : 0;
        textRef.current.fillOpacity = THREE.MathUtils.lerp(
            textRef.current.fillOpacity,
            targetOpacity,
            0.2
        );
    }
  });

  const midAngle = startAngle + (endAngle - startAngle) / 2;
  const textPosition: [number, number, number] = [
    Math.cos(midAngle) * (radius * 0.7),
    Math.sin(midAngle) * (radius * 0.7),
    extrudeSettings.depth + 0.1,
  ];

  return (
    <group
      onPointerOver={() => onHover(segment.category)}
      onPointerOut={() => onHover(null)}
    >
      <mesh ref={meshRef}>
        <extrudeGeometry args={[shape, extrudeSettings]} />
        <meshStandardMaterial
          color={segment.color}
          emissive={segment.color}
          emissiveIntensity={0}
          metalness={0.1}
          roughness={0.9}
        />
      </mesh>
      <Text
        ref={textRef}
        position={textPosition}
        fontSize={0.35}
        color={textColor}
        anchorX="center"
        anchorY="middle"
        fillOpacity={0}
      >
        {`${segment.percentage.toFixed(1)}%`}
      </Text>
    </group>
  );
};

interface SceneProps {
  data: SegmentData[];
  highlightedCategory: string | null;
  setHighlightedCategory: (category: string | null) => void;
}

function Scene({ data, highlightedCategory, setHighlightedCategory }: SceneProps) {
  const segments = useMemo(() => {
    let cumulativePercentage = 0;
    return data.map((item) => {
      const startAngle = (cumulativePercentage / 100) * 2 * Math.PI - Math.PI / 2;
      cumulativePercentage += item.percentage;
      const endAngle = (cumulativePercentage / 100) * 2 * Math.PI - Math.PI / 2;
      return { ...item, startAngle, endAngle };
    });
  }, [data]);

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <directionalLight position={[-5, -5, -5]} intensity={0.5} />
      
      <group position={[-0.75, 0, 0]} rotation-x={Math.PI / 4}>
        {segments.map((segment) => (
          <PieSegment
            key={segment.category}
            segment={segment}
            radius={2}
            startAngle={segment.startAngle}
            endAngle={segment.endAngle}
            isHighlighted={highlightedCategory === segment.category || highlightedCategory === null}
            onHover={setHighlightedCategory}
          />
        ))}
      </group>
    </>
  );
}

interface ThreePieChartProps {
    data: SegmentData[];
}

export function ThreePieChart({ data }: ThreePieChartProps) {
  const [highlightedCategory, setHighlightedCategory] = useState<string | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-900/50 rounded-lg">
        <p className="text-white/70">No allocation data available.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-transparent">
        <Canvas camera={{ position: [0, 0, 5.5], fov: 50 }}>
            <Scene 
                data={data} 
                highlightedCategory={highlightedCategory} 
                setHighlightedCategory={setHighlightedCategory}
            />
        </Canvas>
      <div className="absolute top-1/2 right-4 transform -translate-y-1/2 flex flex-col justify-center gap-2">
        {data.map((item) => (
          <div 
            key={item.category}
            className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-200 cursor-pointer ${
                highlightedCategory === item.category ? 'bg-white/10' : 'bg-transparent'
            }`}
            onMouseEnter={() => setHighlightedCategory(item.category)}
            onMouseLeave={() => setHighlightedCategory(null)}
          >
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }}/>
            <p className="text-md font-medium text-white/90">{item.category}</p>
            <p className="text-md font-bold text-white/90">{item.percentage.toFixed(1)}%</p>
          </div>
        ))}
      </div>
    </div>
  );
} 