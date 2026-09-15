"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { type Group } from "three";
import { SceneFallback } from "./SceneFallback";

const NODES: [number, number, number][] = [
  [-1.7, 1.1, 0], [1.75, 0.85, -0.25], [1.7, -1.2, 0.1], [-1.7, -1.15, -0.15],
];
const CONNECTIONS = new Float32Array(NODES.flatMap((node) => [0, 0, 0, ...node]));

function Core({ onFailure }: { onFailure: () => void }) {
  const group = useRef<Group>(null);
  const elapsed = useRef(0);
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    const canvas = gl.domElement;
    // Do not repeatedly recreate a failing context. Fall back for this visit.
    const lost = (event: Event) => {
      event.preventDefault();
      onFailure();
    };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl, onFailure]);

  useFrame((_, delta) => {
    // One loop, no React state or DOM writes. Bounded to two degrees.
    elapsed.current += Math.min(delta, 0.05);
    if (group.current) {
      group.current.rotation.y = Math.sin(elapsed.current * 0.3) * 0.035;
      group.current.rotation.x = Math.sin(elapsed.current * 0.2) * 0.025;
    }
  });

  return (
    <group ref={group}>
      <mesh>
        <icosahedronGeometry args={[0.74, 2]} />
        <meshStandardMaterial color="#6D5DFB" roughness={0.48} metalness={0.35} emissive="#6D5DFB" emissiveIntensity={0.18} />
      </mesh>
      <mesh rotation={[0.35, 0.2, 0]}>
        <torusGeometry args={[1.03, 0.018, 6, 64]} />
        <meshStandardMaterial color="#ada1fc" roughness={0.55} metalness={0.3} />
      </mesh>
      <mesh rotation={[0.55, -0.2, 0]}>
        <torusGeometry args={[2.15, 0.009, 4, 64]} />
        <meshBasicMaterial color="#293047" />
      </mesh>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[CONNECTIONS, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#526074" />
      </lineSegments>
      {NODES.map((position, i) => (
        <group position={position} key={i}>
          <mesh>
            <icosahedronGeometry args={[0.28, 1]} />
            <meshStandardMaterial color="#172033" roughness={0.55} metalness={0.35} />
          </mesh>
          <mesh position={[0, 0, 0.25]}>
            <sphereGeometry args={[0.085, 12, 8]} />
            <meshStandardMaterial color={i === 3 ? "#0F9F8F" : "#ada1fc"} roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function BusinessCore({ active, onFailure }: { active: boolean; onFailure: () => void }) {
  return (
    <Canvas
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
      dpr={1}
      frameloop={active ? "always" : "demand"}
      camera={{ position: [0, 0, 7], fov: 42 }}
      gl={{ alpha: false, antialias: false, powerPreference: "low-power", failIfMajorPerformanceCaveat: true }}
      events={() => ({ enabled: false, priority: 0 })}
      fallback={<SceneFallback />}
    >
      <color attach="background" args={["#07080A"]} />
      <ambientLight intensity={1.2} />
      <directionalLight position={[3, 4, 5]} intensity={3} />
      <Core onFailure={onFailure} />
    </Canvas>
  );
}
