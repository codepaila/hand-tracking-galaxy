import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export interface GalaxyParams {
  count: number;
  size: number;
  radius: number;
  branches: number;
  spin: number;
  randomness: number;
  randomnessPower: number;
  insideColor: string;
  outsideColor: string;
}

export const defaultParams: GalaxyParams = {
  count: 90000,
  size: 0.018,
  radius: 6,
  branches: 5,
  spin: 1.1,
  randomness: 0.45,
  randomnessPower: 3.2,
  insideColor: "#ffb347",
  outsideColor: "#4b6cff",
};

function useGalaxyGeometry(params: GalaxyParams) {
  return useMemo(() => {
    const {
      count,
      radius,
      branches,
      spin,
      randomness,
      randomnessPower,
      insideColor,
      outsideColor,
    } = params;

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    const colorInside = new THREE.Color(insideColor);
    const colorOutside = new THREE.Color(outsideColor);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      const r = Math.pow(Math.random(), 0.6) * radius;
      const branchAngle = ((i % branches) / branches) * Math.PI * 2;
      const spinAngle = r * spin;

      const randX =
        Math.pow(Math.random(), randomnessPower) *
        (Math.random() < 0.5 ? 1 : -1) *
        randomness *
        r;
      const randY =
        Math.pow(Math.random(), randomnessPower) *
        (Math.random() < 0.5 ? 1 : -1) *
        randomness *
        r *
        0.5;
      const randZ =
        Math.pow(Math.random(), randomnessPower) *
        (Math.random() < 0.5 ? 1 : -1) *
        randomness *
        r;

      positions[i3] = Math.cos(branchAngle + spinAngle) * r + randX;
      positions[i3 + 1] = randY;
      positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r + randZ;

      const mixed = colorInside.clone();
      mixed.lerp(colorOutside, r / radius);

      colors[i3] = mixed.r;
      colors[i3 + 1] = mixed.g;
      colors[i3 + 2] = mixed.b;

      scales[i] = Math.random();
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
    return geometry;
  }, [params]);
}

export default function Galaxy({
  params,
  tumble = true,
}: {
  params: GalaxyParams;
  tumble?: boolean;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const geometry = useGalaxyGeometry(params);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      const t = state.clock.elapsedTime;
      // Keep other axes flat — only rotate on X
      pointsRef.current.rotation.y = 0;
      pointsRef.current.rotation.z = 0;
      if (tumble) {
        // Rock on the X axis: swings to + and - so you can see
        // both faces (top and bottom) of the galaxy disc
        pointsRef.current.rotation.x = Math.sin(t * 0.5) * (Math.PI / 2.2);
      } else {
        pointsRef.current.rotation.x = THREE.MathUtils.lerp(
          pointsRef.current.rotation.x,
          0.35,
          delta * 2
        );
      }
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={params.size}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexColors
        transparent
      />
    </points>
  );
}
