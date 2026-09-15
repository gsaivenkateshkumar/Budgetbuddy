/**
 * Conservative eligibility: unsupported/low-power clients keep the SVG.
 * @param {{desktopMotion: boolean, saveData?: boolean, cores?: number, memory?: number}} device
 */
export function canUseBusinessScene({ desktopMotion, saveData = false, cores, memory }) {
  return desktopMotion && !saveData && (cores === undefined || cores > 2) &&
    (memory === undefined || memory > 4);
}

/** @param {boolean} visible @param {boolean} inView @param {boolean} paused */
export function shouldAnimateScene(visible, inView, paused) {
  return visible && inView && !paused;
}
