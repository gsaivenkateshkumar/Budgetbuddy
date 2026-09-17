"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { type Group, MathUtils } from "three";

function BotModel({ onFailure }: { onFailure: () => void }) {
  const head = useRef<Group>(null);
  const leftEye = useRef<Group>(null);
  const rightEye = useRef<Group>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const elapsed = useRef(0);
  const nextBlink = useRef(5.2);
  const blinkUntil = useRef(0);
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
      pointer.current.y = -((event.clientY / Math.max(window.innerHeight, 1)) * 2 - 1);
    };
    const canvas = gl.domElement;
    const onContextLost = (event: Event) => {
      event.preventDefault();
      onFailure();
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    canvas.addEventListener("webglcontextlost", onContextLost);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("webglcontextlost", onContextLost);
    };
  }, [gl, onFailure]);

  useFrame((_, delta) => {
    elapsed.current += Math.min(delta, 0.05);
    const { x, y } = pointer.current;
    const blink = elapsed.current >= nextBlink.current;
    if (blink) {
      blinkUntil.current = elapsed.current + 0.14;
      nextBlink.current = elapsed.current + 5.2;
    }
    const isBlinking = elapsed.current < blinkUntil.current;
    const drift = Math.sin(elapsed.current * 0.55) * 0.012;
    if (head.current) {
      head.current.rotation.y = MathUtils.lerp(head.current.rotation.y, x * 0.14 + drift, 0.08);
      head.current.rotation.x = MathUtils.lerp(head.current.rotation.x, -y * 0.085, 0.08);
      head.current.position.y = Math.sin(elapsed.current * 0.8) * 0.018;
    }
    const eyeYaw = x * 0.26;
    const eyePitch = -y * 0.15;
    for (const eye of [leftEye.current, rightEye.current]) {
      if (!eye) continue;
      eye.rotation.y = MathUtils.lerp(eye.rotation.y, eyeYaw, 0.16);
      eye.rotation.x = MathUtils.lerp(eye.rotation.x, eyePitch, 0.16);
      eye.scale.y = MathUtils.lerp(eye.scale.y, isBlinking ? 0.12 : 1, 0.34);
    }
  });

  return (
    <group ref={head}>
      <mesh position={[0, -0.12, 0]}>
        <boxGeometry args={[1.25, 0.9, 0.72]} />
        <meshStandardMaterial color="#11131A" roughness={0.48} metalness={0.28} />
      </mesh>
      <mesh position={[0, -0.62, 0]}>
        <boxGeometry args={[0.9, 0.22, 0.56]} />
        <meshStandardMaterial color="#07080A" roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.12, 0.38]}>
        <boxGeometry args={[0.88, 0.5, 0.035]} />
        <meshStandardMaterial color="#07080A" roughness={0.3} metalness={0.15} />
      </mesh>
      <group ref={leftEye} position={[-0.22, 0.12, 0.42]}>
        <mesh>
          <sphereGeometry args={[0.085, 12, 8]} />
          <meshStandardMaterial color="#E4E0FE" emissive="#6D5DFB" emissiveIntensity={0.55} roughness={0.3} />
        </mesh>
      </group>
      <group ref={rightEye} position={[0.22, 0.12, 0.42]}>
        <mesh>
          <sphereGeometry args={[0.085, 12, 8]} />
          <meshStandardMaterial color="#E4E0FE" emissive="#6D5DFB" emissiveIntensity={0.55} roughness={0.3} />
        </mesh>
      </group>
      <mesh position={[0, -0.4, 0.38]}>
        <sphereGeometry args={[0.11, 16, 10]} />
        <meshStandardMaterial color="#6D5DFB" emissive="#6D5DFB" emissiveIntensity={0.24} roughness={0.38} metalness={0.25} />
      </mesh>
      <mesh position={[-0.48, -0.08, 0]}>
        <sphereGeometry args={[0.07, 12, 8]} />
        <meshStandardMaterial color="#0F9F8F" roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.18, 8]} />
        <meshStandardMaterial color="#6D5DFB" roughness={0.45} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.73, 0]}>
        <sphereGeometry args={[0.055, 12, 8]} />
        <meshStandardMaterial color="#0F9F8F" emissive="#0F9F8F" emissiveIntensity={0.2} roughness={0.45} />
      </mesh>
    </group>
  );
}

export default function StartBotCanvas({ onFailure }: { onFailure: () => void }) {
  return (
    <Canvas
      aria-hidden="true"
      dpr={1}
      camera={{ position: [0, 0, 3.2], fov: 34 }}
      gl={{ alpha: true, antialias: false, powerPreference: "low-power", failIfMajorPerformanceCaveat: true }}
      frameloop="always"
      fallback={null}
    >
      <ambientLight intensity={1.35} />
      <directionalLight position={[2, 3, 4]} intensity={2.1} />
      <BotModel onFailure={onFailure} />
    </Canvas>
  );
}
