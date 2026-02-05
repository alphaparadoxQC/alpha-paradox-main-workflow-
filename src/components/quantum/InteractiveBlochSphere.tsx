 import { useRef } from 'react';
 import { Canvas, useFrame } from '@react-three/fiber';
 import { OrbitControls, Sphere, Line } from '@react-three/drei';
 import * as THREE from 'three';
 
 interface BlochSphereProps {
   vector: { x: number; y: number; z: number };
   qubitIndex: number;
 }
 
 const BlochSphereScene = ({ vector }: { vector: { x: number; y: number; z: number } }) => {
   const arrowRef = useRef<THREE.Group>(null);
   
   // Normalize vector for display
   const mag = Math.sqrt(vector.x ** 2 + vector.y ** 2 + vector.z ** 2);
   const normalizedVector = mag > 0.01 
     ? { x: vector.x / mag, y: vector.y / mag, z: vector.z / mag }
     : { x: 0, y: 0, z: 1 };
 
   return (
     <>
       {/* Ambient lighting */}
       <ambientLight intensity={0.5} />
       <pointLight position={[10, 10, 10]} intensity={1} />
       
       {/* Sphere wireframe */}
       <Sphere args={[1, 32, 32]}>
         <meshBasicMaterial 
           color="#0ea5e9" 
           wireframe 
           transparent 
           opacity={0.15}
         />
       </Sphere>
       
       {/* Equator circle */}
       <Line
         points={Array.from({ length: 65 }, (_, i) => {
           const angle = (i / 64) * Math.PI * 2;
           return [Math.cos(angle), 0, Math.sin(angle)] as [number, number, number];
         })}
         color="#0ea5e9"
         lineWidth={1}
         transparent
         opacity={0.3}
       />
       
       {/* Meridian circle (XZ plane) */}
       <Line
         points={Array.from({ length: 65 }, (_, i) => {
           const angle = (i / 64) * Math.PI * 2;
           return [Math.cos(angle), Math.sin(angle), 0] as [number, number, number];
         })}
         color="#0ea5e9"
         lineWidth={1}
         transparent
         opacity={0.3}
       />
       
       {/* Z axis */}
       <Line
         points={[[0, -1.2, 0], [0, 1.2, 0]]}
         color="#64748b"
         lineWidth={1}
         dashed
         dashSize={0.1}
         gapSize={0.05}
       />
       
       {/* |0⟩ and |1⟩ labels as points */}
       <mesh position={[0, 1.1, 0]}>
         <sphereGeometry args={[0.05, 16, 16]} />
         <meshBasicMaterial color="#22c55e" />
       </mesh>
       <mesh position={[0, -1.1, 0]}>
         <sphereGeometry args={[0.05, 16, 16]} />
         <meshBasicMaterial color="#ef4444" />
       </mesh>
       
       {/* State vector arrow */}
       <group ref={arrowRef}>
         <Line
           points={[[0, 0, 0], [normalizedVector.x, normalizedVector.z, normalizedVector.y]]}
           color="#a855f7"
           lineWidth={3}
         />
         <mesh position={[normalizedVector.x, normalizedVector.z, normalizedVector.y]}>
           <sphereGeometry args={[0.1, 16, 16]} />
           <meshStandardMaterial 
             color="#a855f7" 
             emissive="#a855f7"
             emissiveIntensity={0.5}
           />
         </mesh>
       </group>
       
       {/* Orbit controls for interaction */}
       <OrbitControls 
         enableZoom={false}
         enablePan={false}
         rotateSpeed={0.5}
         autoRotate={false}
       />
     </>
   );
 };
 
 export const InteractiveBlochSphere = ({ vector, qubitIndex }: BlochSphereProps) => {
   return (
     <div className="relative">
       <div className="w-24 h-24 rounded-lg overflow-hidden bg-black/20 border border-border">
         <Canvas camera={{ position: [2.5, 2, 2.5], fov: 40 }}>
           <BlochSphereScene vector={vector} />
         </Canvas>
       </div>
       <div className="text-center text-[10px] text-muted-foreground font-mono mt-1">
         q{qubitIndex}
       </div>
       <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-muted flex items-center justify-center">
         <span className="text-[8px] text-muted-foreground">↻</span>
       </div>
     </div>
   );
 };