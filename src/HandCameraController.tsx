import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { handState } from "./useHandTracking";

/**
 * Drives the camera using hand gestures:
 *  - Move your open hand left/right  -> orbit azimuth
 *  - Move your hand up/down          -> orbit elevation
 *  - Pinch (thumb + index)           -> zoom in (closer = more pinched)
 */
export default function HandCameraController({
  enabled,
}: {
  enabled: boolean;
}) {
  const { camera } = useThree();
  const azimuth = useRef(0.6);
  const elevation = useRef(0.35);
  const radius = useRef(9);
  const target = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((_, delta) => {
    if (!enabled) return;

    const k = 1 - Math.pow(0.0001, delta); // smoothing factor

    if (handState.present) {
      // Map hand x (0..1) -> azimuth around galaxy (about ±PI)
      const targetAz = (handState.x - 0.5) * Math.PI * 2.2;
      // Map hand y (0..1) -> elevation, clamp so we don't flip
      const targetEl = THREE.MathUtils.clamp(
        (0.5 - handState.y) * Math.PI * 1.1,
        -1.2,
        1.2
      );
      // Pinch -> zoom. pinch 0 => far (14), pinch 1 => close (3.5)
      const targetRadius = THREE.MathUtils.lerp(14, 3.5, handState.pinch);

      azimuth.current += (targetAz - azimuth.current) * k;
      elevation.current += (targetEl - elevation.current) * k;
      radius.current += (targetRadius - radius.current) * k;
    } else {
      // No hand: gently drift for a cinematic idle
      azimuth.current += delta * 0.05;
    }

    const r = radius.current;
    const el = elevation.current;
    const az = azimuth.current;

    const pos = new THREE.Vector3(
      Math.cos(az) * Math.cos(el) * r,
      Math.sin(el) * r,
      Math.sin(az) * Math.cos(el) * r
    );
    camera.position.lerp(pos, k);
    camera.lookAt(target.current);
  });

  return null;
}
