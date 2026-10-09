import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// Slow, sweeping cinematic camera movement around the galaxy.
export default function CinematicCamera({ enabled }: { enabled: boolean }) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((state, delta) => {
    if (!enabled) return;
    const t = state.clock.elapsedTime;

    // Orbit angle slowly advances, radius and height breathe in and out
    const angle = t * 0.08;
    const radius = 7.5 + Math.sin(t * 0.15) * 2.5;
    const height = 2.2 + Math.sin(t * 0.11) * 3.2;

    const desired = new THREE.Vector3(
      Math.cos(angle) * radius,
      height,
      Math.sin(angle) * radius
    );

    // Smoothly ease the camera toward the desired position
    camera.position.lerp(desired, 1 - Math.pow(0.001, delta));

    // Subtle drifting look-at target for extra life
    target.current.set(
      Math.sin(t * 0.2) * 0.4,
      Math.cos(t * 0.13) * 0.3,
      0
    );
    camera.lookAt(target.current);
  });

  return null;
}
