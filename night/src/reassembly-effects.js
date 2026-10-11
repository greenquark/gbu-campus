import * as THREE from 'three';
const clamp=n=>Math.max(0,Math.min(1,n));
const smooth=n=>{n=clamp(n);return n*n*(3-2*n);};

// Shared, pooled organic detail. No textures, network assets, or frame allocations.
export function createReassemblyEffects({part,joint,geometries,materials}){
 const tissue=new THREE.SphereGeometry(1,14,8),p=tissue.attributes.position;
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i),a=Math.atan2(z,x);
  const lobe=1+.11*Math.sin(a*5+y*3)+.045*Math.sin(a*11-y*7);
  p.setXYZ(i,x*lobe,y*(.85+.1*Math.cos(a*3)),z*lobe);
 }
 tissue.computeVertexNormals();
 const smear=new THREE.CircleGeometry(1,18),sp=smear.attributes.position;
 for(let i=1;i<sp.count;i++){const a=Math.atan2(sp.getY(i),sp.getX(i)),k=.78+.13*Math.sin(a*5)+.09*Math.cos(a*9);sp.setXY(i,sp.getX(i)*k,sp.getY(i)*k);}
 Object.assign(geometries,{reassemblyTissue:tissue,reassemblyRim:new THREE.TorusGeometry(.8,.18,5,16),reassemblyStrand:new THREE.CylinderGeometry(1,1,1,5,1),reassemblySmear:smear});
 Object.assign(materials,{
  reassemblyTissue:new THREE.MeshPhysicalMaterial({color:0x66323a,roughness:.34,metalness:0,clearcoat:.45,clearcoatRoughness:.22}),
  reassemblyFiber:new THREE.MeshStandardMaterial({color:0xa67772,roughness:.39,metalness:0}),
  reassemblySmear:new THREE.MeshBasicMaterial({color:0x421b22,transparent:true,opacity:.48,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}),
 });
 const a=new THREE.Vector3(),b=new THREE.Vector3(),v=new THREE.Vector3(),last=new THREE.Vector3(),next=new THREE.Vector3(),axis=new THREE.Vector3(0,1,0);
 function wound(parent,pos,radius,flip=false){
  const root=joint(parent,'soft exposed tissue',...pos),nodes=[];root.scale.setScalar(0);
  nodes.push(part(root,'reassemblyTissue','reassemblyTissue','irregular moist tissue',[0,0,0],[radius,.015,radius],0xc99a97));
  nodes.push(part(root,'reassemblyRim','reassemblyTissue','ragged folded wound edge',[0,flip?-.009:.009,0],[radius,radius,.047],0x825359,[Math.PI/2,0,0]));
  for(let k=0;k<3;k++){
   const angle=k*2.2+.4;
   nodes.push(part(root,'reassemblyTissue','reassemblyFiber','exposed connective fibers',[Math.cos(angle)*radius*.48,flip?-.014:.014,Math.sin(angle)*radius*.42],[radius*.09,.010,radius*.32],0x8c635c,[0,angle,0]));
  }
  return root;
 }
 function build(student,pieces){
  const {torso,hips}=student,root=new THREE.Object3D();root.name='pooled organic reassembly';
  const socketPositions=[[0,.329,0],[-.188,.231,-.001],[.188,.231,-.001],[-.091,0,0],[.091,0,0]];
  pieces.forEach((piece,i)=>{
   const parent=i<3?torso:hips,position=socketPositions[i],radius=i===0?.052:i<3?.063:.073;
   piece.socket=joint(parent,'return socket '+piece.name,...position);
   piece.hostWound=wound(piece.socket,[0,0,0],radius,true);
   piece.limbWound=wound(piece.node,[0,i===0?-.015:.007,0],radius);
   piece.strands=Array.from({length:9},()=>part(root,'reassemblyStrand','reassemblyFiber','contracting connective strand',[0,0,0],[0,0,0],0x93625e));
   piece.smears=Array.from({length:5},(_,k)=>part(root,'reassemblySmear','reassemblySmear','drag contact stain',[0,0,0],[0,0,0],k%2?0xcaa6aa:0xffffff,[-Math.PI/2,0,0]));
  });
  return {root};
 }
 function hide(r){
  r.bio.root.scale.setScalar(0);r.bio.root.updateMatrixWorld(true);
  for(const piece of r.pieces){piece.hostWound.scale.setScalar(0);piece.limbWound.scale.setScalar(0);piece.hostWound.updateMatrixWorld(true);piece.limbWound.updateMatrixWorld(true);}
 }
 function update(r,z){
  r.bio.root.scale.setScalar(1);
  const cy=Math.cos(z.yaw||0),sy=Math.sin(z.yaw||0),time=r.report.elapsed;
  for(const piece of r.pieces){
   const m=piece.motion,open=m.launch*(1-m.docking),pulse=1+Math.sin(time*11+piece.index*2)*.045*open;
   piece.hostWound.scale.set(pulse*open,open*(1+m.plant*.24),pulse*open);
   piece.limbWound.scale.set(pulse*open,open*(1-m.plant*.18),pulse*open);
   piece.hostWound.updateMatrixWorld(true);piece.limbWound.updateMatrixWorld(true);
   a.setFromMatrixPosition(piece.limbWound.matrixWorld);b.setFromMatrixPosition(piece.socket.matrixWorld);
   const distance=a.distanceTo(b),taut=smooth((time-5.35)/.7)*smooth((.65-distance)/.22)*(1-m.docking);
   for(let k=0;k<3;k++){
    const angle=k*2.094+piece.index,ox=Math.cos(angle)*.023,oz=Math.sin(angle)*.023;
    last.copy(a);last.x+=ox;last.z+=oz;
    for(let j=0;j<3;j++){
     const f=(j+1)/3,w=Math.sin(f*Math.PI),strand=piece.strands[k*3+j];
     next.copy(a).lerp(b,f);next.x+=ox+w*Math.sin(time*7+k+f*4)*.015*open;
     next.z+=oz+w*Math.cos(time*6+k+f*5)*.018*open;
     next.y+=w*(.035+Math.sin(time*10+k)*.013)*open;
     v.copy(next).sub(last);const length=v.length();
     strand.position.copy(last).add(next).multiplyScalar(.5);
     if(length>.0001)strand.quaternion.setFromUnitVectors(axis,v.multiplyScalar(1/length));
     strand.scale.set((.0025+k*.0005)*taut,length*taut,(.0025+k*.0005)*taut);
     last.copy(next);
    }
   }
   for(let k=0;k<5;k++){
    const s=piece.smears[k],u=(k+.28)/5,visible=smooth((m.progress-u)*9)*m.ground;
    const spread=1-u*.91,ox=piece.offsetX*spread,oz=piece.offsetZ*spread;
    s.position.set(piece.joinedCenter.x+ox*cy+oz*sy,.059+k*.0004,piece.joinedCenter.z-ox*sy+oz*cy);
    s.rotation.set(-Math.PI/2,0,Math.atan2(piece.offsetX,piece.offsetZ));
    const width=piece.index===0?.055:piece.index<3?.034:.047;
    s.scale.set(width*visible,(.10+k*.018)*visible,1);
   }
  }
  r.bio.root.updateMatrixWorld(true);
 }
 return {build,hide,update};
}
