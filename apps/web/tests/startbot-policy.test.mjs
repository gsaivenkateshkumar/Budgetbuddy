import assert from "node:assert/strict";
import test from "node:test";
import { canUseStartBot } from "../components/three/startbot-policy.mjs";

test("StartBot only runs on capable desktop pointer devices", () => {
  assert.equal(canUseStartBot({ desktopMotion: true, cores: 8, memory: 8 }), true);
  assert.equal(canUseStartBot({ desktopMotion: false, cores: 8, memory: 8 }), false);
  assert.equal(canUseStartBot({ desktopMotion: true, saveData: true, cores: 8, memory: 8 }), false);
  assert.equal(canUseStartBot({ desktopMotion: true, cores: 2, memory: 8 }), false);
  assert.equal(canUseStartBot({ desktopMotion: true, cores: 8, memory: 4 }), false);
});
