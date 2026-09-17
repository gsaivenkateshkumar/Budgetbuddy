/**
 * StartBot uses the same conservative policy as the hero scene, with an
 * explicit reduced-motion/mobile fallback so the assistant never becomes a
 * reliability dependency.
 * @param {{desktopMotion: boolean, saveData?: boolean, cores?: number, memory?: number}} device
 */
export function canUseStartBot({ desktopMotion, saveData = false, cores, memory }) {
  return desktopMotion && !saveData && (cores === undefined || cores > 2) &&
    (memory === undefined || memory > 4);
}
