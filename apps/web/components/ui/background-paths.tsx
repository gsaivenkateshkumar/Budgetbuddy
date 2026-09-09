"use client";

import { motion, useReducedMotion } from "framer-motion";

/* Adapted from the 21st.dev "Background Paths" reference component for the
 * homepage hero (see components/home/Hero.tsx). Kept dependency-light:
 * framer-motion drives the entrance/loop, everything else is plain SVG.
 * Deliberately reduced from the reference's 36 paths to 28 — a two-layer
 * 56-path scene is still smooth, and only `pathLength`/`pathOffset`/`opacity`
 * are animated (no width/height/position), so there's no layout cost. */
const PATH_COUNT = 28;

/* Every 7th path (deterministic on `i`, never Math.random — this renders
 * identically on server and client) gets a faint violet tint instead of
 * white, per the brand's "don't make every path bright violet" guidance. */
function buildPaths(position: number) {
  return Array.from({ length: PATH_COUNT }, (_, i) => {
    const isAccent = i % 7 === 3;
    return {
      id: i,
      d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${380 - i * 5 * position} -${189 + i * 6} -${
        312 - i * 5 * position
      } ${216 - i * 6} ${152 - i * 5 * position} ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
        684 - i * 5 * position
      } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
      width: 0.5 + i * 0.03,
      color: isAccent ? `rgba(109, 93, 251, ${0.14 + i * 0.008})` : `rgba(255, 255, 255, ${0.08 + i * 0.01})`,
    };
  });
}

export function FloatingPaths({ position }: { position: number }) {
  const paths = buildPaths(position);
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0">
      <svg
        className="h-full w-full"
        viewBox="0 0 696 316"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke={path.color}
            strokeWidth={path.width}
            initial={{ pathLength: 0.3, opacity: 0.35 }}
            animate={
              shouldReduceMotion
                ? { pathLength: 1, opacity: 0.3 }
                : { pathLength: 1, opacity: [0.2, 0.5, 0.2], pathOffset: [0, 1, 0] }
            }
            transition={
              shouldReduceMotion ? { duration: 0 } : { duration: 20 + path.id * 0.25, repeat: Infinity, ease: "linear" }
            }
          />
        ))}
      </svg>
    </div>
  );
}
