import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface PlanetConfig {
  orbitRadius: number;
  size: number;
  speed: number;
  color: string;
  emissive: string;
  tilt: number;
  phase: number;
  hasRing: boolean;
}

const PALETTE = [
  { color: "#ff8a5c", emissive: "#7a2f10" },
  { color: "#5cc8ff", emissive: "#0f3a5a" },
  { color: "#c78bff", emissive: "#3a1a5a" },
  { color: "#ffd15c", emissive: "#5a4210" },
  { color: "#7dffb0", emissive: "#0f5a35" },
  { color: "#ff6ec7", emissive: "#5a103f" },
  { color: "#9fb4ff", emissive: "#1a2a5a" },
  { color: "#ffffff", emissive: "#333355" },
];

function usePlanets(count: number): PlanetConfig[] {
  return useMemo(() => {
    const arr: PlanetConfig[] = [];
    for (let i = 0; i < count; i++) {
      const p = PALETTE[i % PALETTE.length];
      const orbitRadius = 1.2 + i * 0.55 + Math.random() * 0.3;
      arr.push({
        orbitRadius,
        size: 0.08 + Math.random() * 0.22,
        speed: (0.15 + Math.random() * 0.35) * (Math.random() < 0.15 ? -1 : 1),
        color: p.color,
        emissive: p.emissive,
        tilt: (Math.random() - 0.5) * 0.5,
        phase: Math.random() * Math.PI * 2,
        hasRing: Math.random() < 0.25,
      });
    }
    return arr;
  }, [count]);
}

function Planet({ config }: { config: PlanetConfig }) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const a = config.phase + t * config.speed;
    if (groupRef.current) {
      groupRef.current.position.x = Math.cos(a) * config.orbitRadius;
      groupRef.current.position.z = Math.sin(a) * config.orbitRadius;
      groupRef.current.position.y =
        Math.sin(a * 1.3) * config.orbitRadius * config.tilt;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[config.size, 24, 24]} />
        <meshStandardMaterial
          color={config.color}
          emissive={config.emissive}
          emissiveIntensity={0.6}
          roughness={0.55}
          metalness={0.2}
        />
      </mesh>
      {config.hasRing && (
        <mesh rotation={[Math.PI / 2.2, 0, 0]}>
          <ringGeometry args={[config.size * 1.4, config.size * 2.1, 48]} />
          <meshBasicMaterial
            color={config.color}
            side={THREE.DoubleSide}
            transparent
            opacity={0.35}
          />
        </mesh>
      )}
    </group>
  );
}

export default function Planets({ count = 8 }: { count?: number }) {
  const planets = usePlanets(count);
  const groupRef = useRef<THREE.Group>(null);

  return (
    <group ref={groupRef}>
      {planets.map((p, i) => (
        <Planet key={i} config={p} />
      ))}
    </group>
  );
}
