import { build } from '../../shared/campus-world.js';
export async function createWorld(scene, renderer, onProgress = () => {}) {
  return build(scene, renderer, { night: true, onProgress });
}
