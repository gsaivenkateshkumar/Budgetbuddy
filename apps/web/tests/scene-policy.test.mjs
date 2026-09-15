import assert from "node:assert/strict";
import test from "node:test";
import { canUseBusinessScene, shouldAnimateScene } from "../components/three/scene-policy.mjs";

test("desktop may enhance; mobile, reduced motion and low-power conditions stay static", () => {
  assert.equal(canUseBusinessScene({ desktopMotion: true, cores: 8, memory: 8 }), true);
  assert.equal(canUseBusinessScene({ desktopMotion: true }), true);
  assert.equal(canUseBusinessScene({ desktopMotion: false }), false);
  assert.equal(canUseBusinessScene({ desktopMotion: true, saveData: true }), false);
  assert.equal(canUseBusinessScene({ desktopMotion: true, cores: 2 }), false);
  assert.equal(canUseBusinessScene({ desktopMotion: true, memory: 4 }), false);
});

test("render loop stops when hidden, offscreen, or user-paused", () => {
  for (const visible of [true, false]) {
    for (const inView of [true, false]) {
      for (const paused of [true, false]) {
        assert.equal(shouldAnimateScene(visible, inView, paused), visible && inView && !paused);
      }
    }
  }
});
