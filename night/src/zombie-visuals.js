import * as THREE from 'three';
import {createStudentKit,buildStudent} from './student-anatomy.js';
import {reassemblyMotion} from './reassembly-motion.js';
import {createReassemblyEffects} from './reassembly-effects.js';

// Six articulated students share one instance batch per geometry/material role.
// Their collision and combat decisions belong to the simulation, never this rig.
const MAX_STUDENTS = 6;
const sat = n => Math.max(0, Math.min(1, n));
const smooth = n => { n = sat(n); return n * n * (3 - 2 * n); };

export function createZombieVisuals(scene, camera) {
  const root = new THREE.Group(); root.name = 'GBU zombie students'; scene.add(root);
  let disposed = false;
  const kit=createStudentKit({baseUrl:import.meta.env.BASE_URL,onAsset:()=>{},isDisposed:()=>disposed});
  const geometries = {
    ...kit.geometries,
    box:new THREE.BoxGeometry(1,1,1),
    decal:new THREE.PlaneGeometry(1,1),
    shadow:new THREE.CircleGeometry(1,20),
  };
  const materials = {
    ...kit.materials,
    decal:new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,alphaTest:.15,polygonOffset:true,polygonOffsetFactor:-1}),
    shadow:new THREE.MeshBasicMaterial({color:0x061516,transparent:true,opacity:.25,depthWrite:false}),
    mouth:new THREE.MeshStandardMaterial({color:0x252a27,roughness:1}),
    seam:new THREE.MeshStandardMaterial({color:0x3e2027,roughness:.5,side:THREE.DoubleSide}),
  };
  const batches=new Map(),rigs=[],tmpColor=new THREE.Color(),kickResources=[];
  const visualDiagnostics={students:MAX_STUDENTS,drawCalls:0,kickDrawCalls:1,style:'textured anatomical adult students',reassemblyStyle:'grounded grip-pull with organic docking',assets:kit.assetStatus,kick:{visible:false,extension:0,screenX:0,screenY:0,widthFraction:0,asset:'player-kick.png',assetLoaded:false},reassembly:[],animation:[]};
  const bootCenter=new THREE.Vector3(),bootEdge=new THREE.Vector3();
  // Keep the source mark intact. A small upload is sufficient for a 22cm shirt patch.
  const source = new Image(); source.decoding = 'async';
  source.onload = async () => {
    let image = source;
    if (typeof createImageBitmap === 'function') {
      try { image = await createImageBitmap(source, {resizeWidth:1024, resizeHeight:724, resizeQuality:'high', imageOrientation:'flipY'}); }
      catch { image = source; }
    }
    if (disposed) { if (image !== source) image.close?.(); return; }
    const texture = new THREE.Texture(image);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.flipY = image === source;
    texture.repeat.set(.22, .30); texture.offset.set(.39, .38);
    texture.generateMipmaps = true; texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter; texture.needsUpdate = true;
    materials.decal.map = texture; materials.decal.needsUpdate = true;
  };
  source.src = `${import.meta.env.BASE_URL}gbu-shirt-logo.png`;

  function part(parent, geometry, material, name, pos, scale, color, rotation) {
    const node = new THREE.Object3D(); node.name = name;
    node.position.set(...pos); node.scale.set(...scale); if (rotation) node.rotation.set(...rotation);
    parent.add(node);
    const g=geometries[geometry];if(!g.boundingBox)g.computeBoundingBox();node.userData.surfaceBounds=g.boundingBox;node.userData.surfaceVertices=g.attributes.position.array;
    const key = `${geometry}/${material}`;
    if (!batches.has(key)) batches.set(key, {geometry, material, parts:[]});
    batches.get(key).parts.push({node, color:color ?? 0xffffff});
    return node;
  }
  function joint(parent, name, x, y, z) {
    const node = new THREE.Object3D(); node.name=name; node.position.set(x,y,z); parent.add(node); return node;
  }
  function seam(parent,y,radius,bottom=false) {
    part(parent,'shadow','mouth','closed shadow seam',[0,y,0],[radius,radius,1],undefined,[bottom?Math.PI/2:-Math.PI/2,0,0]);
    part(parent,'shadow','seam','dark tissue socket',[0,y+(bottom?-.001:.001),0],[radius*.63,radius*.63,1],undefined,[bottom?Math.PI/2:-Math.PI/2,0,0]);
  }
  function detachedPiece(node,name,center,x,z,angle,ground,index) {
    const contact=new THREE.Object3D();contact.name=`${name} ground contact`;contact.scale.setScalar(0);
    part(contact,'shadow','shadow','detached piece contact',[0,0,0],
      index===0?[.20,.20,1]:index<3?[.125,.39,1]:[.15,.46,1],undefined,[-Math.PI/2,0,0]);
    const surfaces=[];node.traverse(n=>{if(n.userData.surfaceBounds)surfaces.push(n);});
    return {node,name,center:new THREE.Vector3(...center),offsetX:x,offsetZ:z,angle,ground,index,contact,surfaces,contactDirection:new THREE.Vector3(),
      joinedCenter:new THREE.Vector3(),targetCenter:new THREE.Vector3(),position:new THREE.Vector3(),scale:new THREE.Vector3(),
      joinedRotation:new THREE.Quaternion(),rotation:new THREE.Quaternion(),landingRotation:new THREE.Quaternion(),tumble:new THREE.Quaternion(),pivotRotation:new THREE.Quaternion(),
      pivotOffset:new THREE.Vector3(),euler:new THREE.Euler(0,0,0,'YXZ')};
  }
  const organic=createReassemblyEffects({part,joint,geometries,materials});
  for (let i=0; i<MAX_STUDENTS; i++) {
    const student=buildStudent({index:i,part,joint});
    const {rig,hips,torso,head,arms,legs,height}=student;
    const buildWidth=[1,.94,1.08,.98,.91,1.04][i],buildDepth=[1,.96,1.045,1.015,.95,1.025][i];
    part(torso,'decal','decal','authentic GBU crest',[0,.085,.142],[.155,.151,1]);
    // Closed base sockets support the soft-tissue overlay while pieces separate.
    seam(head,-.016,.062,true);seam(torso,.329,.065);
    part(torso,'shadow','mouth','closed fabric hem',[0,-.324,.020],[.195,.146,1],undefined,[Math.PI/2,0,0]);
    part(hips,'shadow','mouth','closed trouser seat',[0,-.157,0],[.130,.086,1],undefined,[Math.PI/2,0,0]);
    for(const arm of arms)seam(arm.shoulder,.005,.07);
    for(const leg of legs)seam(leg.thigh,.005,.081);
    const shadow=new THREE.Object3D(); shadow.name='student contact';
    part(shadow,'shadow','shadow','contact shadow',[0,.026,0],[.39,.31,1],undefined,[-Math.PI/2,0,0]);
    const pieces=[
      detachedPiece(head,'head',[0,.165,.02],.48,-1.1,.64,.152,0),
      detachedPiece(arms[0].shoulder,'leftArm',[0,-.30,.03],-1.20,-.26,-.95,.10,1),
      detachedPiece(arms[1].shoulder,'rightArm',[0,-.30,.03],1.28,.06,1.10,.10,2),
      detachedPiece(legs[0].thigh,'leftLeg',[0,-.40,.025],-.91,.71,-.72,.12,3),
      detachedPiece(legs[1].thigh,'rightLeg',[0,-.40,.025],.94,.89,.94,.12,4),
    ];
    const coreSurfaces=[...hips.children,...torso.children].filter(n=>n.userData.surfaceVertices);
    const sparks=new THREE.Object3D(),sparkNodes=[];
    const bio=organic.build(student,pieces);
    const report={id:i,mode:'idle',elapsed:0,scatter:0,returnProgress:0,maxDistance:0,pieces:{head:0,leftArm:0,rightArm:0,leftLeg:0,rightLeg:0},contacts:{}};
    visualDiagnostics.reassembly.push(report);
    const animation={id:i,mode:'idle',speed:0,gait:0,blend:0};visualDiagnostics.animation.push(animation);
    rigs.push({...student,buildWidth,buildDepth,shadow,pieces,coreSurfaces,sparks,sparkNodes,bio,report,animation,fall:0,moveBlend:0,walkBlend:0,gaitPhase:i*1.9,previousX:null,previousZ:null});
  }
  for(const [name,batch] of batches) {
    const mesh=new THREE.InstancedMesh(geometries[batch.geometry],materials[batch.material],batch.parts.length);
    mesh.name=`students ${name}`; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.frustumCulled=false;
    batch.parts.forEach((part,i)=>mesh.setColorAt(i,tmpColor.setHex(part.color)));
    mesh.instanceColor.needsUpdate=true; batch.mesh=mesh; root.add(mesh);
  }
  visualDiagnostics.drawCalls=batches.size;
  visualDiagnostics.triangles=[...batches.values()].reduce((sum,b)=>sum+(geometries[b.geometry].index?.count??geometries[b.geometry].attributes.position.count)/3*b.parts.length,0);

  // Photographic cutout in camera space; combat timing and hitboxes stay in game.js.
  const boot=new THREE.Group(); boot.name='first-person kick'; camera.add(boot); boot.visible=false;
  const kickTexture=new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}player-kick.png`,texture=>{
    if(disposed){texture.dispose();return;}
    visualDiagnostics.kick.assetLoaded=true;
  },undefined,()=>{visualDiagnostics.kick.assetLoaded=false;});
  kickTexture.colorSpace=THREE.SRGBColorSpace;
  const kickGeometry=new THREE.PlaneGeometry(1,1);
  const kickMaterial=new THREE.MeshBasicMaterial({map:kickTexture,transparent:true,alphaTest:.03,depthTest:false,depthWrite:false,toneMapped:false});
  const kickPlane=new THREE.Mesh(kickGeometry,kickMaterial);
  kickPlane.name='photographic right shoe and trouser leg';kickPlane.renderOrder=1000;kickPlane.frustumCulled=false;boot.add(kickPlane);
  kickResources.push(kickTexture,kickGeometry,kickMaterial);

  function surfaceFloor(surfaces){
    let min=Infinity;
    // Detached pieces only: exact visible vertices avoid conservative-box hovering.
    for(const node of surfaces){const e=node.matrixWorld.elements,p=node.userData.surfaceVertices;
      for(let i=0;i<p.length;i+=3)min=Math.min(min,e[1]*p[i]+e[5]*p[i+1]+e[9]*p[i+2]+e[13]);
    }
    return min;
  }
  function scatterPieces(r,z) {
    const elapsed=Math.max(0,Math.min(8,z.clock??8-(z.downTime??8)));
    const cy=Math.cos(z.yaw||0),sy=Math.sin(z.yaw||0),report=r.report;
    report.elapsed=elapsed;report.scatter=0;report.maxDistance=0;report.returnProgress=0;
    for(const piece of r.pieces) {
      const m=reassemblyMotion(elapsed,piece.index);piece.motion=m;
      const settle=1-smooth((elapsed-.28)/.72),spread=m.separation;
      const wiggle=piece.index===0?(Math.sin(m.phase*Math.PI*2)*.042+m.twitch*.009)*m.working*(1-m.progress):0;
      const ox=piece.offsetX*spread+piece.offsetZ*wiggle,oz=piece.offsetZ*spread-piece.offsetX*wiggle;
      piece.node.matrixWorld.decompose(piece.position,piece.joinedRotation,piece.scale);
      piece.joinedCenter.copy(piece.center).applyMatrix4(piece.node.matrixWorld);
      // Two-link contact poses: the stump advances while the planted end retracts.
      let contactTilt=0;
      if(piece.index===1||piece.index===2){
        const arm=r.arms[piece.index-1];
        const recovery=1-smooth((m.phase-.70)/.30),stride=Math.hypot(piece.offsetX,piece.offsetZ)*.91/5;
        const reach=.581-stride*m.pull*recovery;
        const bend=Math.acos(THREE.MathUtils.clamp((reach*reach-.327**2-.267**2)/(2*.327*.267),-1,1))*m.working;
        const beta=Math.atan2(.267*Math.sin(bend),.327+.267*Math.cos(bend));
        contactTilt=beta;
        arm.elbow.rotation.set(THREE.MathUtils.lerp(arm.elbow.rotation.x,-bend,m.working),0,THREE.MathUtils.lerp(arm.elbow.rotation.z,arm.side*m.twitch*.018,m.working));
        arm.hand.rotation.set(THREE.MathUtils.lerp(arm.hand.rotation.x,bend-beta,m.working),THREE.MathUtils.lerp(arm.hand.rotation.y,arm.side<0?Math.PI:0,m.working),arm.hand.rotation.z*(1-m.working));
        for(const f of arm.fingers||[]){
          const stagger=smooth((m.phase-.025*f.index)/.18)*(1-smooth((m.phase-.68-.015*f.index)/.23));
          f.root.rotation.x=(-.12-stagger*(f.isThumb?.48:.78))*m.working;
          f.tip.rotation.x=(-.16-stagger*(f.isThumb?.63:1.08))*m.working;
        }
      }else if(piece.index>=3){
        const leg=r.legs[piece.index-3];
        const bend=(.25+1.1*Math.sin(m.phase*Math.PI)**2)*m.working;
        const beta=Math.atan2(.425*Math.sin(bend),.435+.425*Math.cos(bend));
        contactTilt=-beta;
        leg.knee.rotation.x=THREE.MathUtils.lerp(leg.knee.rotation.x,bend,m.working);
        leg.ankle.rotation.x=THREE.MathUtils.lerp(leg.ankle.rotation.x,beta-bend+.24*m.plant,m.working);
        leg.ankle.rotation.z=Math.sin(m.phase*Math.PI*2+piece.index)*.10*m.working;
      }
      const hop=Math.sin(Math.min(1,elapsed/.78)*Math.PI)*(.24+piece.index*.031);
      piece.targetCenter.set(piece.joinedCenter.x+ox*cy+oz*sy,
        piece.joinedCenter.y*(1-m.launch)+piece.ground*r.height*m.launch+hop+m.lift,
        piece.joinedCenter.z-ox*sy+oz*cy);
      const crawlYaw=(z.yaw||0)+Math.atan2(piece.offsetX,piece.offsetZ);
      // Arms land palm-down and reach inward. Legs lever the toe; the head rolls.
      const tilt=piece.index===0?-Math.PI/2+Math.sin(m.phase*Math.PI*2)*.30*m.working:Math.PI/2+contactTilt;
      const yaw=piece.index===0?(z.yaw||0)+piece.angle+m.progress*2.4:crawlYaw;
      piece.euler.set(tilt,yaw,m.recoil*2,'YXZ');piece.landingRotation.setFromEuler(piece.euler);
      piece.rotation.copy(piece.joinedRotation).slerp(piece.landingRotation,m.launch*(1-m.docking));
      piece.euler.set(Math.sin(elapsed*10+piece.index)*.49*settle*spread,
        Math.sin(elapsed*7+piece.index)*.24*settle*spread,m.twitch*.024+Math.sin(elapsed*12+piece.index*.7)*.43*settle*spread,'YXZ');
      piece.tumble.setFromEuler(piece.euler);piece.rotation.multiply(piece.tumble);
      piece.targetCenter.y=THREE.MathUtils.lerp(piece.targetCenter.y,piece.joinedCenter.y,m.docking);
      piece.pivotOffset.copy(piece.center).multiply(piece.scale).applyQuaternion(piece.rotation);
      if(piece.index>0){
        // Keep the stump trajectory independent of the changing elbow/knee angle.
        piece.euler.set(Math.PI/2,yaw,0,'YXZ');piece.tumble.setFromEuler(piece.euler);
        piece.pivotRotation.copy(piece.joinedRotation).slerp(piece.tumble,m.launch*(1-m.docking));
        piece.pivotOffset.copy(piece.center).multiply(piece.scale).applyQuaternion(piece.pivotRotation);
      }
      piece.position.copy(piece.targetCenter).sub(piece.pivotOffset);
      piece.node.matrixWorld.compose(piece.position,piece.rotation,piece.scale);
      for(const child of piece.node.children)child.updateMatrixWorld(true);
      // Ground contact uses the articulated surfaces, including the curled digits.
      // It moves the complete piece, avoiding stretched bones and buried hands.
      const minY=surfaceFloor(piece.surfaces);
      const correction=(.056+m.lift-minY)*m.ground;
      piece.position.y+=correction;piece.targetCenter.y+=correction;
      piece.node.matrixWorld.compose(piece.position,piece.rotation,piece.scale);
      for(const child of piece.node.children)child.updateMatrixWorld(true);
      piece.contactDirection.set(0,1,0).applyQuaternion(piece.rotation);
      piece.contact.position.set(piece.targetCenter.x,.062,piece.targetCenter.z);
      piece.contact.rotation.y=Math.atan2(piece.contactDirection.x,piece.contactDirection.z);
      piece.contact.scale.setScalar(Math.sqrt(smooth(m.launch*(1-m.docking)))*r.height);
      piece.contact.updateMatrixWorld(true);
      const separation=Math.hypot(ox,oz);report.pieces[piece.name]=separation;
      report.scatter=Math.max(report.scatter,spread);report.maxDistance=Math.max(report.maxDistance,separation);
      report.returnProgress+=m.progress/5;
      report.contacts[piece.name]={stage:m.stage,phase:m.phase,plant:m.plant,step:m.step,docking:m.docking,minY:minY+correction,x:piece.position.x,y:piece.position.y,z:piece.position.z};
    }
    organic.update(r,z);
  }

  function update(dt,time,game) {
    const active=game&&game.mode!=='title'; root.visible=!!active;
    const zombies=game?.zombies||[];
    for(let i=0;i<MAX_STUDENTS;i++) {
      const r=rigs[i],z=zombies[i];
      if(!z||!active){r.rig.scale.setScalar(0);r.shadow.scale.setScalar(0);r.sparks.scale.setScalar(0);r.rig.updateMatrixWorld(true);r.shadow.updateMatrixWorld(true);r.sparks.updateMatrixWorld(true);organic.hide(r);for(const piece of r.pieces){piece.contact.scale.setScalar(0);piece.contact.updateMatrixWorld(true);}continue;}
      const down=z.mode==='down',rising=z.mode==='rising',windup=z.mode==='windup';
      r.fall=down?smooth(z.phase??0):rising?1-smooth(z.phase??0):0;
      const travel=r.previousX===null?0:Math.hypot(z.x-r.previousX,z.z-r.previousZ);
      const speed=travel>1?0:travel/Math.max(.001,dt);
      r.previousX=z.x;r.previousZ=z.z;
      const targetMotion=down||rising?0:sat(speed/3.3);
      r.moveBlend+=(targetMotion-r.moveBlend)*(1-Math.exp(-Math.max(0,dt)*12));
      r.walkBlend+=((down||rising?0:sat(speed/.35))-r.walkBlend)*(1-Math.exp(-Math.max(0,dt)*12));
      const motion=r.moveBlend;
      const strideAmplitude=.24+.11*motion;
      if(travel<1&&!down&&!rising)r.gaitPhase+=travel*Math.PI*.56/strideAmplitude;
      const gait=r.gaitPhase;
      const sway=Math.sin(gait),tilt=windup?smooth(z.phase??0):z.mode==='cooldown'?1-smooth(z.phase??0):0;
      const flash=Math.min(1,(z.hitFlash||0)/.25);
      const crawl=down?smooth(((z.clock||0)-1.2)/.4)*(1-smooth(((z.clock||0)-6.8)/.65)):0;
      r.rig.scale.set(r.height*r.buildWidth,r.height,r.height*r.buildDepth);
      const hipHeight=r.proportions?.hipHeight??.93;
      const crouch=(.024+.065*motion+.015*tilt)*(1-r.fall);
      const bob=Math.cos(gait*2)*.009*motion*(1-r.fall);
      r.rig.position.set(z.x,.006-crouch+bob+r.fall*.27,z.z);
      r.rig.rotation.set(-r.fall*Math.PI*.49,z.yaw||0,0,'YXZ');
      if(down)r.rig.rotation.z=Math.sin((z.clock||0)*17)*.022*smooth(((z.clock||0)-5.8)/.5)*(1-smooth(((z.clock||0)-7.8)/.2));
      r.hips.rotation.set(0,sway*.025*motion,sway*.012*motion);
      r.torso.rotation.set((.09+.09*motion+tilt*.19)*(1-r.fall),Math.sin(gait+.8)*.045*motion,(-.018+(i%3)*.015+Math.sin(time*1.4+i)*.008)*(1-r.fall));
      // Bend around the waist, so the shirt follows the pelvis during a lunge.
      r.torso.position.set(0,.255*Math.cos(r.torso.rotation.x),.255*Math.sin(r.torso.rotation.x));
      r.torso.scale.y=1+Math.sin(time*2.5+i)*.004*(1-r.fall);
      const neckTremor=Math.sin(time*6.2+i*1.8)*Math.sin(time*.73+i)*.013;
      // A one-sided preparatory head tilt precedes the reach, then settles back.
      const headLead=windup?Math.sin(sat(z.phase??0)*Math.PI):z.mode==='cooldown'?-(1-smooth(z.phase??0))*.32:0;
      r.head.rotation.set((-.06-tilt*.13+headLead*.055+neckTremor)*(1-r.fall),(Math.sin(time*.63+i)*.035+headLead*.035)*(1-r.fall),(-.045+(i%3)*.045+neckTremor+headLead*(i%2?-.085:.085))*(1-r.fall));
      for(const arm of r.arms) {
        const leading=arm.side===(i%2?1:-1),swing=Math.sin(gait+(arm.side<0?0:Math.PI));
        const reach=leading?-.40:-.16,elbow=leading?-.46:-.67;
        arm.shoulder.rotation.set((reach-tilt*(leading?.82:.61)+swing*.24*motion)*(1-r.fall),arm.side*.04,arm.side*(.075+r.fall*.12));
        arm.elbow.rotation.set((elbow+tilt*.15+Math.sin(gait+arm.side)*.09*motion)*(1-r.fall)-r.fall*.10-crawl*(.5+.5*Math.sin((z.clock||0)*7+arm.side))*.18,0,-arm.side*.035);
        arm.hand.rotation.set((.19+Math.sin(gait+arm.side)*.045)*(1-r.fall),arm.side*.06,arm.side*.045);
        for(const finger of arm.fingers||[]){finger.root.rotation.x=0;finger.tip.rotation.x=0;}
      }
      for(const leg of r.legs) {
        // A stance foot sweeps back as the body advances; swing lifts it clear.
        // Solving the thigh and shin together avoids the old straight tube march.
        const phase=((gait+(leg.side<0?Math.PI:0))%(Math.PI*2)+Math.PI*2)%(Math.PI*2)/(Math.PI*2);
        const stance=.56,stepLength=strideAmplitude*r.walkBlend;
        const swing=sat((phase-stance)/(1-stance));
        const footZ=phase<stance?stepLength*(1-2*phase/stance):stepLength*(-1+2*smooth(swing));
        const lift=Math.sin(swing*Math.PI)*(.065+.07*motion)*r.walkBlend;
        const upper=r.proportions?.thighLength??.43,lower=r.proportions?.shinLength??.40;
        const floor=r.proportions?.ankleFloorHeight??.09;
        const vertical=hipHeight-crouch+bob-floor-lift;
        const length=Math.min(upper+lower-.001,Math.max(Math.abs(upper-lower)+.001,Math.hypot(vertical,footZ)));
        const bend=Math.PI-Math.acos(THREE.MathUtils.clamp((upper*upper+lower*lower-length*length)/(2*upper*lower),-1,1));
        const hip=Math.atan2(-footZ,vertical)-Math.acos(THREE.MathUtils.clamp((upper*upper+length*length-lower*lower)/(2*upper*length),-1,1));
        leg.thigh.rotation.set(hip*(1-r.fall),0,leg.side*.009*(1-r.fall));
        leg.knee.rotation.x=bend*(1-r.fall)-r.fall*.07-crawl*(.5+.5*Math.sin((z.clock||0)*6+leg.side))*.11;
        leg.ankle.rotation.set(-(hip+bend)*(1-r.fall)+Math.sin(swing*Math.PI)*.13*motion,0,0);
      }
      Object.assign(r.animation,{mode:z.mode,speed:Number(speed.toFixed(3)),gait:Number(gait.toFixed(3)),blend:Number(motion.toFixed(3)),windup:Number(tilt.toFixed(3))});
      if(flash>0)r.torso.rotation.z+=Math.sin(time*44)*flash*.075;
      r.rig.updateMatrixWorld(true);
      if(r.fall>0){r.rig.position.y+=(.055-surfaceFloor(r.coreSurfaces))*r.fall;r.rig.updateMatrixWorld(true);}
      r.report.mode=z.mode;
      if(down){r.sparks.scale.setScalar(1);scatterPieces(r,z);}
      else {r.sparks.scale.setScalar(0);r.sparks.updateMatrixWorld(true);organic.hide(r);r.report.scatter=0;r.report.maxDistance=0;r.report.elapsed=0;r.report.returnProgress=rising?1:0;for(const piece of r.pieces){r.report.pieces[piece.name]=0;piece.contact.scale.setScalar(0);piece.contact.updateMatrixWorld(true);}}
      const scatter=r.report.scatter,contactOffset=r.fall*(.67+scatter*.42);
      r.shadow.scale.set(1,1,1+r.fall*2.6*(1-scatter));r.shadow.position.set(z.x-Math.sin(z.yaw||0)*contactOffset,0,z.z-Math.cos(z.yaw||0)*contactOffset);
      r.shadow.rotation.y=z.yaw||0;r.shadow.updateMatrixWorld(true);
    }
    for(const batch of batches.values()) {
      for(let i=0;i<batch.parts.length;i++)batch.mesh.setMatrixAt(i,batch.parts[i].node.matrixWorld);
      batch.mesh.instanceMatrix.needsUpdate=true;
    }
    const kick=game?.kickTime||0; boot.visible=!!active&&kick>0&&visualDiagnostics.kick.assetLoaded;
    visualDiagnostics.kick.visible=boot.visible;visualDiagnostics.kick.extension=0;
    if(boot.visible) {
      const t=Math.max(0,.78-kick),extension=t<.28?smooth(t/.28):t<.40?1:1-smooth((t-.40)/.38);
      const impact=Math.max(0,game.kickImpact||0),recoil=Math.sin(impact*24)*impact*.028;
      const depth=.65,viewHeight=2*Math.tan(THREE.MathUtils.degToRad(camera.fov)/2)*depth;
      const screenHeight=THREE.MathUtils.clamp(camera.aspect*.62,.64,.88)*(.88+extension*.12);
      const screenWidth=screenHeight/camera.aspect;
      const screenX=.5+screenWidth*.06+(1-extension)*.18;
      const screenY=.65+screenHeight*.20+(1-extension)*.62+recoil;
      boot.position.set((screenX-.5)*viewHeight*camera.aspect,(.5-screenY)*viewHeight,-depth);
      boot.scale.setScalar(viewHeight*screenHeight);
      boot.rotation.set(0,0,(1-extension)*-.14);
      boot.updateMatrixWorld(true);camera.updateMatrixWorld(true);
      bootCenter.set(-.06,.20,0).applyMatrix4(boot.matrixWorld).project(camera);
      bootEdge.set(.06,.20,0).applyMatrix4(boot.matrixWorld).project(camera);
      visualDiagnostics.kick.extension=extension;visualDiagnostics.kick.screenX=(bootCenter.x+1)/2;
      visualDiagnostics.kick.screenY=(1-bootCenter.y)/2;visualDiagnostics.kick.widthFraction=Math.abs(bootEdge.x-bootCenter.x);
    }
  }
  return {
    update,
    ready:kit.ready,
    diagnostics:visualDiagnostics,
    dispose(){disposed=true;scene.remove(root);camera.remove(boot);Object.values(geometries).forEach(g=>g.dispose());const textures=new Set();Object.values(materials).forEach(m=>{for(const key of ['map','normalMap','roughnessMap','bumpMap','alphaMap'])if(m[key])textures.add(m[key]);m.dispose();});textures.forEach(t=>t.dispose());kickResources.forEach(r=>r.dispose());},
  };
}
