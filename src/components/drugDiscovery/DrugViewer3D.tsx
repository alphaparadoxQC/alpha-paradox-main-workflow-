import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { DrugCandidate } from '@/lib/drugDiscovery/drugData';

interface DrugViewer3DProps {
  drug: DrugCandidate;
  showLabels?: boolean;
}

function DrugMolecule({ drug, showLabels = false }: DrugViewer3DProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.003;
    }
  });

  const bonds = useMemo(() => {
    return drug.bonds.map((bond, i) => {
      const atom1 = drug.atoms[bond.atom1];
      const atom2 = drug.atoms[bond.atom2];
      const start = new THREE.Vector3(...atom1.position);
      const end = new THREE.Vector3(...atom2.position);
      const mid = start.clone().add(end).multiplyScalar(0.5);
      const dir = end.clone().sub(start);
      const length = dir.length();
      
      return { start, end, mid, dir, length, order: bond.order, key: i };
    });
  }, [drug.bonds, drug.atoms]);

  return (
    <group ref={groupRef}>
      {/* Atoms */}
      {drug.atoms.map((atom, i) => (
        <group key={i} position={atom.position}>
          <mesh>
            <sphereGeometry args={[atom.radius * 0.4, 32, 32]} />
            <meshStandardMaterial
              color={atom.color}
              roughness={0.3}
              metalness={0.1}
              emissive={atom.color}
              emissiveIntensity={0.1}
            />
          </mesh>
          {showLabels && (
            <Text
              position={[0, atom.radius * 0.6, 0]}
              fontSize={0.25}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              {atom.symbol}
            </Text>
          )}
        </group>
      ))}

      {/* Bonds */}
      {bonds.map(({ mid, dir, length, order, key }) => {
        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());

        return (
          <group key={key} position={mid.toArray()} quaternion={quaternion}>
            {order === 1 && (
              <mesh>
                <cylinderGeometry args={[0.08, 0.08, length, 8]} />
                <meshStandardMaterial color="#666666" roughness={0.6} />
              </mesh>
            )}
            {order === 2 && (
              <>
                <mesh position={[-0.08, 0, 0]}>
                  <cylinderGeometry args={[0.05, 0.05, length, 8]} />
                  <meshStandardMaterial color="#666666" roughness={0.6} />
                </mesh>
                <mesh position={[0.08, 0, 0]}>
                  <cylinderGeometry args={[0.05, 0.05, length, 8]} />
                  <meshStandardMaterial color="#666666" roughness={0.6} />
                </mesh>
              </>
            )}
            {order === 3 && (
              <>
                <mesh>
                  <cylinderGeometry args={[0.04, 0.04, length, 8]} />
                  <meshStandardMaterial color="#666666" roughness={0.6} />
                </mesh>
                <mesh position={[-0.1, 0, 0]}>
                  <cylinderGeometry args={[0.04, 0.04, length, 8]} />
                  <meshStandardMaterial color="#666666" roughness={0.6} />
                </mesh>
                <mesh position={[0.1, 0, 0]}>
                  <cylinderGeometry args={[0.04, 0.04, length, 8]} />
                  <meshStandardMaterial color="#666666" roughness={0.6} />
                </mesh>
              </>
            )}
          </group>
        );
      })}
    </group>
  );
}

export function DrugViewer3D({ drug, showLabels = false }: DrugViewer3DProps) {
  return (
    <div className="w-full h-48 rounded-lg overflow-hidden bg-gradient-to-br from-background to-muted/30">
      <Canvas camera={{ position: [8, 4, 8], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.3} />
        <DrugMolecule drug={drug} showLabels={showLabels} />
        <OrbitControls enableZoom={true} enablePan={false} />
      </Canvas>
    </div>
  );
}
