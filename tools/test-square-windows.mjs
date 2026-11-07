import assert from 'node:assert/strict';
import {squareWindowCenters,dormWindowLayout} from '../shared/window-layout.js';
import * as THREE from 'three';
import {build} from '../shared/campus-world.js';
import {build as originalBuild} from '../shared/campus-world.original.js';

for (const [w,h] of [[37,7.3],[33,9.3],[24,7.3],[29,9.3],[1,1],[2.2,2.2]]) {
  const panes=squareWindowCenters(w,h);
  for(const p of panes){assert(Math.abs(p.x)+p.size/2<=w/2-.35+1e-8);assert(Math.abs(p.y)+p.size/2<=h/2-.35+1e-8);assert.equal(p.size,1.5);}
  for(let i=0;i<panes.length;i++)for(let j=i+1;j<panes.length;j++)assert(Math.abs(panes[i].x-panes[j].x)>=1.5 || Math.abs(panes[i].y-panes[j].y)>=1.5);
}
assert.throws(()=>squareWindowCenters(5,5,{size:0}),RangeError);
assert.throws(()=>squareWindowCenters(NaN,5),RangeError);
assert.equal(squareWindowCenters(37,7.3).length,48);
for(const height of [28,31,28.5])for(const orange of [false,true]){
 const fh=(height-3.8)/10,p=dormWindowLayout(fh,orange);
 assert(p.size>0 && p.size<=1);
 assert(p.y-p.size/2>1.22,'window bottom clears balcony rail in frontal projection');
 assert(p.y+p.size/2<fh-.1,'window top clears next floor');
 if(orange)assert(p.depth-.05>-.49,'window is forward of orange panel');
}
for(const night of [false,true]){
 const before=originalBuild(new THREE.Scene(),null,{night});
 const after=build(new THREE.Scene(),null,{night});
 assert.deepEqual(after.colliders,before.colliders,'collision data unchanged');
 for(const key of ['bounds','stations','safeZones','spawn','exit'])assert.deepEqual(after[key],before[key],key+' unchanged');
 for(const key of ['routeConflicts','stationConflicts','trackConflicts','colliderCount','routeSamples','staticDrawCalls'])assert.deepEqual(after.diagnostics[key],before.diagnostics[key],key+' unchanged');
 after.root.traverse(o=>{if(o.isMesh)assert(Array.from(o.geometry.attributes.position.array).every(Number.isFinite),'finite vertex coordinates');});
 console.log(JSON.stringify({mode:night?'night':'day',before:before.diagnostics,after:after.diagnostics}));
}
console.log('PASS: square layout boundaries, spacing, invalid inputs, both scene builds, finite geometry, unchanged collisions/routes/spawn and static draw calls.');
