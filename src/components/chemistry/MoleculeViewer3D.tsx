import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import { MoleculeData } from '@/lib/chemistry/moleculeData';

interface MoleculeViewer3DProps {
  molecule: MoleculeData;
  showLabels?: boolean;
  showBondLengths?: boolean;
}

function Atom({ 
  position, 
  color, 
  radius, 
  symbol,
  showLabel 
}: { 
  position: [number, number, number]; 
  color: string; 
  radius: number;
  symbol: string;
  showLabel: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[radius * 0.5, 32, 32]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.3} 
          metalness={0.2}
          emissive={color}
          emissiveIntensity={0.1}
        />
      </mesh>
      {showLabel && (
        <Text
          position={[0, radius * 0.7, 0]}
          fontSize={0.25}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {symbol}
        </Text>
      )}
    </group>
  );
}

function Bond({ 
  start, 
  end, 
  order,
  length,
  showLength 
}: { 
  start: [number, number, number]; 
  end: [number, number, number];
  order: 1 | 2 | 3;
  length: number;
  showLength: boolean;
}) {
  const midpoint = useMemo(() => [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2,
    (start[2] + end[2]) / 2,
  ] as [number, number, number], [start, end]);

  const offsets = order === 1 ? [0] : order === 2 ? [-0.08, 0.08] : [-0.12, 0, 0.12];
  
  return (
    <group>
      {offsets.map((offset, i) => (
        <Line
          key={i}
          points={[
            [start[0], start[1] + offset, start[2]],
            [end[0], end[1] + offset, end[2]],
          ]}
          color="#888888"
          lineWidth={3}
        />
      ))}
      {showLength && (
        <Text
          position={[midpoint[0], midpoint[1] + 0.25, midpoint[2]]}
          fontSize={0.15}
          color="#22d3ee"
          anchorX="center"
          anchorY="middle"
        >
          {length.toFixed(2)} Å
        </Text>
      )}
    </group>
  );
}

function MoleculeScene({ molecule, showLabels, showBondLengths }: MoleculeViewer3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Render atoms */}
      {molecule.atoms.map((atom, index) => (
        <Atom
          key={`atom-${index}`}
          position={atom.position}
          color={atom.color}
          radius={atom.radius}
          symbol={atom.symbol}
          showLabel={showLabels ?? true}
        />
      ))}
      
      {/* Render bonds */}
      {molecule.bonds.map((bond, index) => (
        <Bond
          key={`bond-${index}`}
          start={molecule.atoms[bond.atom1Index].position}
          end={molecule.atoms[bond.atom2Index].position}
          order={bond.order}
          length={bond.length}
          showLength={showBondLengths ?? true}
        />
      ))}
    </group>
  );
}

export function MoleculeViewer3D({ molecule, showLabels = true, showBondLengths = true }: MoleculeViewer3DProps) {
  return (
    <div className="w-full h-[300px] bg-background/50 rounded-lg border border-border overflow-hidden">
      <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        <MoleculeScene 
          molecule={molecule} 
          showLabels={showLabels}
          showBondLengths={showBondLengths}
        />
        <OrbitControls 
          enablePan={false} 
          minDistance={2} 
          maxDistance={8}
          autoRotate={false}
        />
      </Canvas>
    </div>
  );
}
