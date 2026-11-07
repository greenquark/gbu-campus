export function dormWindowLayout(floorHeight, orange = false) {
  if (!Number.isFinite(floorHeight) || floorHeight <= 1.7) throw new RangeError('Invalid dorm floor height');
  const bottom = 1.3, top = floorHeight - .2;
  return {size:Math.min(1,top-bottom), y:(bottom+top)/2, depth:orange ? -.35 : -1.25};
}

// Pure placement math shared by the facade builder and its tests.
export function squareWindowCenters(width, height, {size = 1.5, gap = .7, margin = .35} = {}) {
  if (![width,height,size,gap,margin].every(Number.isFinite) || width <= 0 || height <= 0 || size <= 0 || gap < 0 || margin < 0) throw new RangeError('Invalid window grid dimensions');
  const columns = Math.max(0, Math.floor((width - 2 * margin + gap) / (size + gap)));
  const rows = Math.max(0, Math.floor((height - 2 * margin + gap) / (size + gap)));
  const result = [];
  for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
    result.push({x:(column - (columns - 1) / 2) * (size + gap), y:(row - (rows - 1) / 2) * (size + gap), size});
  }
  return result;
}
