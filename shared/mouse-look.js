// Shared Pointer Lock helper for the day tour and the night game.
// It only owns the pointer-lock lifecycle and the raw deltas; each scene decides
// what a mouse delta means for its camera and how the mode is presented.
const supported = typeof document !== 'undefined' && 'pointerLockElement' in document && typeof HTMLElement !== 'undefined' && 'requestPointerLock' in HTMLElement.prototype;

export const pointerLockSupported = supported;

export function createMouseLook({element, onDelta, onStatus} = {}) {
  if (!element) throw new Error('createMouseLook needs an element');
  let locked = false;
  let disposed = false;
  const report = (state, detail) => { try { onStatus?.(state, detail); } catch (error) { console.error('Mouse look status handler failed', error); } };
  const isLocked = () => document.pointerLockElement === element;

  // Must run inside a user gesture (a click on the scene); browsers reject it otherwise.
  function request() {
    if (!supported || typeof element.requestPointerLock !== 'function') { report('unavailable'); return false; }
    try {
      const result = element.requestPointerLock();
      // Chrome returns a promise; older engines report failures through pointerlockerror instead.
      if (result && typeof result.catch === 'function') result.catch(error => {
        console.warn('Pointer lock was refused', error);
        report('failed', error);
      });
      return true;
    } catch (error) {
      console.warn('Pointer lock could not be requested', error);
      report('failed', error);
      return false;
    }
  }

  function release() {
    if (isLocked()) { try { document.exitPointerLock(); } catch { /* exit is best effort */ } }
  }

  function onMove(event) {
    if (disposed || !isLocked()) return;
    const dx = Number(event.movementX) || 0;
    const dy = Number(event.movementY) || 0;
    if (!dx && !dy) return;
    event.preventDefault?.();
    try { onDelta?.(dx, dy); } catch (error) { console.error('Mouse look delta handler failed', error); }
  }

  function onChange() {
    const next = isLocked();
    if (next === locked) return;
    locked = next;
    report(locked ? 'locked' : 'unlocked');
  }

  function onError() { report('failed'); }

  document.addEventListener('pointerlockchange', onChange);
  document.addEventListener('pointerlockerror', onError);
  document.addEventListener('mousemove', onMove, { passive: false });

  return {
    request,
    release,
    isLocked,
    get locked() { return isLocked(); },
    get available() { return supported; },
    dispose() {
      disposed = true;
      release();
      document.removeEventListener('pointerlockchange', onChange);
      document.removeEventListener('pointerlockerror', onError);
      document.removeEventListener('mousemove', onMove);
    }
  };
}
