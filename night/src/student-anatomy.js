import * as THREE from 'three';

// Metres, Y up, face +Z. Shared authored surfaces remain independently articulated
// at the joints, so the existing supernatural reassembly can detach whole limbs.
const TAU = Math.PI * 2;
const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
const gauss = (x, y, cx, cy, sx, sy) => Math.exp(-(((x-cx)/sx)**2)-((y-cy)/sy)**2);
const rgba = { cloth:[.008,.508,.484,.484], trousers:[.508,.508,.484,.484], skin:[.008,.008,.484,.484], hair:[.508,.008,.484,.484] };
const atlasUV = (u, v, zone) => { const r=rgba[zone]; return [r[0]+clamp(u)*r[2],r[1]+clamp(v)*r[3]]; };

function geometry(positions, uvs, indices) {
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  g.setIndex(indices);g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();return g;
}

function grid(columns, rows, point, uv, closed=false, reverse=false) {
  const p=[],t=[],ix=[];
  for(let j=0;j<=rows;j++)for(let i=0;i<=columns;i++) {
    p.push(...point(i/columns,j/rows));t.push(...uv(i/columns,j/rows));
  }
  for(let j=0;j<rows;j++)for(let i=0;i<columns;i++) {
    const a=j*(columns+1)+i,b=a+columns+1;
    if(reverse)ix.push(a,b,a+1,b,b+1,a+1);
    else ix.push(a,a+1,b,b,a+1,b+1);
  }
  const g=geometry(p,t,ix);
  // Weld only the normal at UV seams; preserving the duplicated UV vertices is
  // necessary for the atlas. This removes a longitudinal shading ridge.
  if(closed){const n=g.attributes.normal;for(let j=0;j<=rows;j++){
    const a=j*(columns+1),b=a+columns,x=n.getX(a)+n.getX(b),y=n.getY(a)+n.getY(b),z=n.getZ(a)+n.getZ(b),d=Math.hypot(x,y,z)||1;
    n.setXYZ(a,x/d,y/d,z/d);n.setXYZ(b,x/d,y/d,z/d);
  }}
  return g;
}

function interp(profile,y,k) {
  if(y<=profile[0][0])return profile[0][k];
  for(let i=1;i<profile.length;i++)if(y<=profile[i][0]) {
    const f=(y-profile[i-1][0])/(profile[i][0]-profile[i-1][0]);
    return THREE.MathUtils.lerp(profile[i-1][k],profile[i][k],f);
  }
  return profile[profile.length-1][k];
}

// Elliptical/superelliptical cross sections follow a deliberately authored
// profile. Folds alter the surface itself, instead of adding rings or balls.
function loft(profile,{sides=20,rows=16,zone='skin',fold=0,power=1,warp=0}={}) {
  const lo=profile[0][0],hi=profile[profile.length-1][0];
  return grid(sides,rows,(u,v)=>{
    const y=lo+(hi-lo)*v,a=u*TAU,s=Math.sin(a),c=Math.cos(a);
    const rx=interp(profile,y,1),rz=interp(profile,y,2),cz=interp(profile,y,3)||0;
    const envelope=Math.sin(v*Math.PI);
    const crease=fold*(Math.sin(a*5.1+v*27)*.42+Math.sin(a*2.8-v*43)*.26+Math.cos(v*63+a)*.16)*envelope;
    return [Math.sign(s)*Math.abs(s)**power*(rx+crease)+warp*Math.sin(v*Math.PI*1.3),y,Math.sign(c)*Math.abs(c)**power*(rz+crease*.65)+cz];
  },(u,v)=>atlasUV(u,v,zone),true);
}

function merge(geometries) {
  const p=[],uv=[],normals=[],ix=[];let offset=0;
  for(const g of geometries){p.push(...g.attributes.position.array);uv.push(...g.attributes.uv.array);normals.push(...g.attributes.normal.array);for(const n of g.index.array)ix.push(n+offset);offset+=g.attributes.position.count;g.dispose();}
  const g=geometry(p,uv,ix);g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));return g;
}

function tube(points,radius,{segments=7,sides=6,zone='skin',taper=.55}={}) {
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  const frames=curve.computeFrenetFrames(segments,false);
  return grid(sides,segments,(u,v)=>{
    const f=Math.min(segments,Math.round(v*segments)),p=curve.getPointAt(v),a=u*TAU;
    const r=radius*(1-(1-taper)*v)*(v>.94?Math.sqrt((1-v)/.06):1);
    p.addScaledVector(frames.normals[f],Math.cos(a)*r).addScaledVector(frames.binormals[f],Math.sin(a)*r);
    return p.toArray();
  },(u,v)=>atlasUV(u,v,zone),true);
}

// Head proportions track the image's observed landmarks. There are no eye
// spheres, separate noses, projecting teeth, or emissive facial features.
const headProfile=[
  [.049,.009,.017,.020],[.060,.028,.042,.017],[.075,.046,.058,.012],
  [.092,.058,.067,.005],[.114,.070,.075,0],[.145,.081,.082,-.002],
  [.175,.085,.083,-.003],[.205,.084,.082,-.004],[.235,.087,.079,-.007],
  [.262,.085,.072,-.012],[.286,.071,.061,-.014],[.305,.045,.038,-.012],[.316,.002,.002,-.009],
];
function headPoint(a,y) {
  const x=Math.sin(a)*interp(headProfile,y,1),front=Math.max(0,Math.cos(a));
  let z=Math.cos(a)*interp(headProfile,y,2)*(Math.cos(a)<0?1.16:1)+interp(headProfile,y,3);
  // Brow ridge, orbital hollows, nasal bridge/alae, zygomatic arches, cheek
  // hollows, philtrum, lips and mental prominence share this single surface.
  let sculpt=.014*gauss(x,y,0,.149,.017,.020)+.010*gauss(x,y,0,.175,.011,.030);
  sculpt+=.007*gauss(x,y,0,.062,.035,.018)+.002*gauss(x,y,0,.112,.025,.009);
  sculpt-=.0025*gauss(x,y,0,.116,.022,.0028);
  for(const side of [-1,1]){
    sculpt-=.010*gauss(x,y,side*.0365,.192,.022,.012);
    sculpt+=.007*gauss(x,y,side*.037,.210,.026,.011);
    sculpt+=.008*gauss(x,y,side*.054,.162,.022,.016);
    sculpt-=.006*gauss(x,y,side*.055,.131,.020,.020);
    sculpt+=.006*gauss(x,y,side*.014,.145,.009,.008);
  }
  z+=sculpt*front**2;
  return [x,y,z];
}
function headSurface(front=true,female=false) {
  return grid(front?28:18,30,(u,v)=>headPoint((front?-.5:.5)*Math.PI+u*Math.PI,.049+v*.267),(u,v)=>{
    const y=.049+v*.267,x=headPoint((front?-.5:.5)*Math.PI+u*Math.PI,y)[0];
    // Planar projection places actual eye/mouth/nose pixels on the sculpt.
    const fy=interp([[.049,.973],[.060,.945],[.116,.802],[.145,.690],[.192,.509],[.210,.438],[.250,.210],[.315,0]],y,1);
    return front?[clamp(.5+x*3.42,.19,.81),clamp(female?1-fy:1-(.315-y)/.270,.01,.997)]:atlasUV(u,v,'skin');
  });
}

function hairGeometry() {
  const cap=grid(24,9,(u,v)=>{
    const a=u*TAU,front=Math.max(0,Math.cos(a));
    const edge=.170+.074*front-.018*Math.max(0,-Math.cos(a))+Math.sin(a*5.3)*.005;
    const y=.322-(.322-edge)*v;
    const hp=headPoint(a,clamp(y-.003,.049,.315));
    const r=.003+Math.sin(a*9+v*17)*.0015+Math.sin(a*4-v*12)*.0015;
    return [hp[0]+Math.sin(a)*r,y,hp[2]+Math.cos(a)*r];
  },(u,v)=>atlasUV(u,v,'hair'),true,true);
  const locks=[];
  for(let i=0;i<22;i++){
    const a=-1.38+i*.131,x=Math.sin(a)*.082,z=Math.cos(a)*.078-.006;
    const y=.265+(i%4)*.008,s=(i%3-1)*.007;
    locks.push(tube([[x*.85,y+.025,z*.7],[x+s,y+.007,z+.003],[x+s*.7,y-.013,z+.009],[x+s*.3,y-.027-(i%3)*.006,z+.005]],.0016+(i%3)*.0005,{segments:6,sides:4,zone:'hair',taper:.06}));
  }
  return merge([cap,...locks]);
}

function handGeometry() {
  return loft([[-.112,.024,.012,.003],[-.095,.038,.017,0],[-.062,.039,.019,0],[-.025,.032,.017,0],[.012,.028,.024,0]],{sides:14,rows:10,zone:'skin',warp:.0018});
}

// Four shared digit surfaces keep every student in the same instance batches.
// Links overlap at their flexion pivots so bent knuckles do not open into gaps.
// Long digits retain the original 60–81mm lengths, splay and relaxed pulp curl.
const fingerStarts=[-.029,-.009,.011,.029],fingerLengths=[.069,.081,.075,.060];
const fingerReferenceLength=.075,fingerKnuckleFraction=.62;

function earGeometry() {
  return grid(14,7,(u,v)=>{
    const a=u*TAU,r=Math.sin(v*Math.PI/2),edge=Math.sin(r*Math.PI);
    return [.005+.016*r*Math.cos(a),.033*r*Math.sin(a),.005+edge*.007-(r>.83?(r-.83)*.033:0)];
  },(u,v)=>atlasUV(.33+Math.cos(u*TAU)*v*.13,.60+Math.sin(u*TAU)*v*.2,'skin'),false,true);
}

function shoeGeometry(sole=false) {
  const profile=[[-.073,.018,.0],[-.059,.040,.034],[-.028,.046,.052],[.014,.048,.058],[.065,.053,.033],[.125,.055,.011],[.180,.046,-.002],[.206,.020,-.008],[.212,.002,-.011]];
  return grid(16,12,(u,v)=>{
    const z=-.073+v*.285,a=u*TAU,rx=interp(profile,z,1),top=interp(profile,z,2);
    const c=Math.cos(a),bottom=sole?-.071:-.057;
    const y=sole?-.061+c*.010:bottom+(top-bottom)*(c+1)/2;
    return [Math.sin(a)*rx*(sole?1.03:1),y,z];
  },(u,v)=>atlasUV(u,v,sole?'cloth':'trousers'),true,true);
}

function lacesGeometry() {
  const parts=[];
  for(let i=0;i<4;i++){
    const z=.025+i*.022,y=.050-i*.009;
    parts.push(tube([[-.030,y,z],[0,y+.003,z+.003],[.028,y-.001,z+.011]],.0019,{segments:3,sides:4,zone:'cloth',taper:.9}));
  }
  return merge(parts);
}

function noiseTexture(size,style) {
  const data=new Uint8Array(size*size*4);let seed=918273;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    const n=(seed/4294967296-.5),weave=(Math.sin(x*Math.PI)*.5+((x+y)%3-1)*.15);
    const value=Math.round(clamp((style==='roughness'?.84:.5)+n*(style==='roughness'?.10:.15)+weave*.09)*255),i=(y*size+x)*4;
    data[i]=data[i+1]=data[i+2]=value;data[i+3]=255;
  }
  const t=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;
}

function smoothHeadSeams(front,back) {
  const fn=front.attributes.normal,bn=back.attributes.normal;
  for(let j=0;j<=30;j++)for(const [fi,bi]of [[j*29,j*19+18],[j*29+28,j*19]]) {
    const x=fn.getX(fi)+bn.getX(bi),y=fn.getY(fi)+bn.getY(bi),z=fn.getZ(fi)+bn.getZ(bi),length=Math.hypot(x,y,z)||1;
    fn.setXYZ(fi,x/length,y/length,z/length);bn.setXYZ(bi,x/length,y/length,z/length);
  }
}

// Repeating only the selected atlas quadrant gives cotton/twill a credible
// millimetre-scale weave without repeating the adjacent skin/hair quadrant.
function tileAtlas(material,repeats) {
  material.onBeforeCompile=shader=>{
    // Preserve derivatives from the unwrapped UV. Derivatives of fract() jump
    // at every repeat and otherwise pull pale neighbouring atlas tiles into
    // coarse mip levels, producing dotted stripes on the dark trousers.
    const chunk=THREE.ShaderChunk.map_fragment.replace('texture2D( map, vMapUv )',
      `textureGrad( map, floor(vMapUv * 2.0) * 0.5 + vec2(0.008) + fract(fract(vMapUv * 2.0) * ${repeats.toFixed(1)}) * 0.484, dFdx(vMapUv) * ${(repeats*.968).toFixed(4)}, dFdy(vMapUv) * ${(repeats*.968).toFixed(4)} )`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',chunk);
  };
  material.customProgramCacheKey=()=>`student-atlas-weave-grad-v2-${repeats}`;
}

function blendFaceEdge(material,skinMaterial) {
  material.onBeforeCompile=shader=>{
    shader.uniforms.uStudentSkin={value:skinMaterial.map};material.userData.shader=shader;
    shader.vertexShader='varying vec3 vStudentHeadPosition;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vStudentHeadPosition = position;');
    let chunk=THREE.ShaderChunk.map_fragment.replace('diffuseColor *= sampledDiffuseColor;',`
      float sideAngle = abs(vStudentHeadPosition.x) / max(0.001, length(vStudentHeadPosition.xz + vec2(0.0, 0.006)));
      float edgeBlend = smoothstep(0.77, 0.975, sideAngle);
      vec2 sideUv = vec2(0.008 + 0.484 * step(vStudentHeadPosition.x, 0.0), 0.008 + 0.484 * clamp((vStudentHeadPosition.y - 0.049) / 0.267, 0.0, 1.0));
      sampledDiffuseColor.rgb = mix(sampledDiffuseColor.rgb, texture2D(uStudentSkin, sideUv).rgb, edgeBlend);
      diffuseColor *= sampledDiffuseColor;`);
    shader.fragmentShader='uniform sampler2D uStudentSkin;\nvarying vec3 vStudentHeadPosition;\n'+shader.fragmentShader.replace('#include <map_fragment>',chunk);
  };
  material.customProgramCacheKey=()=> 'student-face-edge-blend-v1';
}

export function createStudentKit({baseUrl='',onAsset=()=>{},isDisposed=()=>false}={}) {
  const geometries={
    anatomyShirt:loft([[-.325,.199,.151,.020],[-.27,.200,.145,.016],[-.16,.197,.135,.012],[-.02,.183,.120,.003],[.12,.208,.121,-.004],[.23,.224,.107,-.009],[.285,.189,.086,-.012],[.317,.063,.054,-.004],[.326,.055,.051,-.004]],{sides:24,rows:18,zone:'cloth',fold:.004,power:.84}),
    anatomyPelvis:loft([[-.158,.131,.087,.0],[-.11,.151,.100,0],[.01,.145,.079,0],[.105,.130,.061,0]],{sides:24,rows:10,zone:'trousers',fold:.004,power:.85}),
    anatomySleeve:loft([[-.174,.063,.067,0],[-.160,.068,.072,0],[-.08,.074,.076,0],[.010,.069,.068,0],[.044,.035,.043,0]],{sides:20,rows:12,zone:'cloth',fold:.002}),
    anatomyUpperArm:loft([[-.352,.034,.036,.001],[-.315,.04,.040,0],[-.26,.044,.047,-.003],[-.17,.060,.054,-.004],[-.09,.065,.059,-.002],[.01,.055,.055,0]],{sides:16,rows:12,zone:'skin',warp:.004}),
    anatomyForearm:loft([[-.286,.028,.024,.006],[-.245,.030,.027,.004],[-.17,.038,.039,.0],[-.075,.048,.044,-.002],[-.02,.042,.038,0],[.037,.031,.034,.002]],{sides:16,rows:12,zone:'skin',warp:-.002}),
    anatomyHand:handGeometry(),
    anatomyFingerProximal:tube([[0,0,0],[0,-.027,.006],[0,-.0465,.011],[0,-.0525,.012]],.0093,{segments:6,sides:6,taper:.72}),
    anatomyFingerDistal:tube([[0,.003,-.0005],[0,0,0],[0,-.00975,.003],[0,-.0285,.018]],.0070,{segments:5,sides:6,taper:.72}),
    anatomyThumbProximal:tube([[0,0,0],[.022,-.019,.005],[.031,-.043,.016],[.031,-.048,.019]],.012,{segments:5,sides:6,taper:.72}),
    anatomyThumbDistal:tube([[0,.004,-.002],[0,0,0],[.001,-.005,.004],[-.004,-.018,.021]],.0089,{segments:5,sides:6,taper:.75}),
    anatomyThigh:loft([[-.473,.057,.064,.005],[-.427,.065,.066,.009],[-.335,.077,.078,0],[-.22,.087,.091,-.006],[-.09,.088,.084,-.004],[.069,.065,.055,-.008]],{sides:20,rows:18,zone:'trousers',fold:.005,warp:.002}),
    anatomyShin:loft([[-.443,.052,.049,0],[-.406,.057,.055,0],[-.35,.051,.05,-.001],[-.24,.054,.056,-.009],[-.12,.068,.069,-.015],[-.035,.066,.065,.0],[.052,.054,.064,.005]],{sides:20,rows:17,zone:'trousers',fold:.005}),
    anatomyNeck:loft([[-.022,.047,.042,-.005],[.025,.044,.039,-.008],[.067,.040,.040,-.011],[.115,.054,.059,-.011]],{sides:18,rows:12,zone:'skin'}),
    anatomyHeadFront:headSurface(true),anatomyHeadFrontFemale:headSurface(true,true),anatomyHeadBack:headSurface(false),anatomyHair:hairGeometry(),anatomyEar:earGeometry(),
    anatomyShoe:shoeGeometry(),anatomySole:shoeGeometry(true),anatomyLaces:lacesGeometry(),
    anatomyCollar:loft([[-.007,.058,.052,0],[.001,.059,.053,0],[.012,.056,.051,0]],{sides:24,rows:3,zone:'trousers'}),
  };
  smoothHeadSeams(geometries.anatomyHeadFront,geometries.anatomyHeadBack);
  geometries.anatomyHeadFrontFemale.setAttribute('normal',geometries.anatomyHeadFront.attributes.normal.clone());
  const bump=noiseTexture(128,'bump'),roughness=noiseTexture(128,'roughness');
  const standard=(options={})=>new THREE.MeshStandardMaterial({color:0xffffff,roughness:.9,metalness:0,roughnessMap:roughness,bumpMap:bump,bumpScale:.0007,...options});
  const materials={
    anatomyFaceMale:standard({color:0xc4cdca,roughness:.86,bumpScale:.00030}),anatomyFaceFemale:standard({color:0xc4cdca,roughness:.86,bumpScale:.00030}),
    anatomySkin:standard({color:0xc4cdca,roughness:.88,bumpScale:.00065}),anatomyCloth:standard({color:0xdce1dd,roughness:.98,bumpScale:.0008}),
    anatomyTrousers:standard({roughness:.98,bumpScale:.0008}),anatomyHair:standard({color:0x929da0,roughness:.78,bumpScale:.0008}),
    anatomyShoe:standard({roughness:.88,bumpScale:.0008}),anatomySole:standard({roughness:.97,bumpScale:.0006}),
  };
  tileAtlas(materials.anatomyCloth,3);tileAtlas(materials.anatomyTrousers,2.5);
  blendFaceEdge(materials.anatomyFaceMale,materials.anatomySkin);blendFaceEdge(materials.anatomyFaceFemale,materials.anatomySkin);
  const assetStatus={face:false,faceFemale:false,cloth:false};
  const textureSet=new Set([bump,roughness]);let disposed=false;
  function load(name,path,targets){return new Promise((resolve,reject)=>{
    const url=`${baseUrl&&!baseUrl.endsWith('/')?baseUrl+'/':baseUrl}${path}`;
    new THREE.TextureLoader().load(url,texture=>{
      if(disposed||isDisposed()){texture.dispose();resolve(null);return;}
      texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;texture.generateMipmaps=true;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;
      textureSet.add(texture);for(const key of targets){materials[key].map=texture;materials[key].needsUpdate=true;}
      if(name==='cloth')for(const key of ['anatomyFaceMale','anatomyFaceFemale'])if(materials[key].userData.shader)materials[key].userData.shader.uniforms.uStudentSkin.value=texture;
      assetStatus[name]=true;onAsset(name,true);resolve(texture);
    },undefined,error=>{onAsset(name,false);reject(new Error(`Student ${name} texture failed: ${path}`,{cause:error}));});
  });}
  const ready=Promise.all([
    load('face','characters/student-zombie-face-v1.jpg',['anatomyFaceMale']),
    load('faceFemale','characters/student-zombie-face-female-v1.jpg',['anatomyFaceFemale']),
    load('cloth','characters/student-zombie-materials-v1.jpg',['anatomySkin','anatomyCloth','anatomyTrousers','anatomyHair','anatomyShoe','anatomySole']),
  ]);
  return {geometries,materials,ready,assetStatus,
    // The root owns geometries/materials after merging them. This method owns
    // only textures, including maps shared by multiple root-owned materials.
    dispose(){disposed=true;for(const texture of textureSet)texture.dispose();},
  };
}

export function buildStudent({index=0,part,joint}) {
  const i=index%6,rig=new THREE.Object3D();rig.name=`anatomical-student-${i+1}`;
  const height=[1,.971,1.039,1.017,.96,1.032][i];rig.scale.setScalar(height);
  const hips=joint(rig,'pelvis',0,.93,0),torso=joint(hips,'thoracic spine',0,.255,0);
  const faceMaterial=(i===1||i===4)?'anatomyFaceFemale':'anatomyFaceMale';
  const shirtColors=[0xffffff,0xabb6b7,0xc7c1b6,0xbfc6bc,0xadb9b5,0xd2cdc4];
  const skinColors=[0xffffff,0xf1f3ed,0xeeeadd,0xe1e7df,0xf7eee6,0xe8e5da];
  const skin=skinColors[i],cloth=shirtColors[i];
  const add=(p,g,m,n,pos=[0,0,0],scale=[1,1,1],color=0xffffff,rotation)=>part(p,g,m,n,pos,scale,color,rotation);
  add(hips,'anatomyPelvis','anatomyTrousers','continuous trouser seat');
  add(torso,'anatomyShirt','anatomyCloth','creased cotton GBU shirt',[0,0,0],[1,1,1],cloth);
  add(torso,'anatomyCollar','anatomyTrousers','stitched crew neck',[0,.325,-.004]);
  const head=joint(torso,'neck and sculpted head',0,.313,.005);head.scale.set(1.10,1,1.06);
  add(head,'anatomyNeck','anatomySkin','sternocleidomastoid and neck',[0,0,0],[1,1,1],skin);
  add(head,(i===1||i===4)?'anatomyHeadFrontFemale':'anatomyHeadFront',faceMaterial,'sculpted textured face',[0,0,0],[1,1,1],skin);
  add(head,'anatomyHeadBack','anatomySkin','occipital cranium and jaw',[0,0,0],[1,1,1],skin);
  add(head,'anatomyHair','anatomyHair','irregular swept hair and fine locks');
  for(const side of [-1,1])add(head,'anatomyEar','anatomySkin','ear helix and lobe',[side*.081,.166,-.007],[1,1,1],skin,[0,side<0?-.72:.72,0]);
  const arms=[],legs=[];
  for(const side of [-1,1]){
    const shoulder=joint(torso,side<0?'left shoulder':'right shoulder',side*.188,.231,-.001);
    add(shoulder,'anatomySleeve','anatomyCloth','soft shirt sleeve',[0,0,0],[1,1,1],cloth);
    add(shoulder,'anatomyUpperArm','anatomySkin','deltoid and upper arm',[0,0,0],[1,1,1],skin);
    const elbow=joint(shoulder,'elbow',0,-.327,0);
    add(elbow,'anatomyForearm','anatomySkin','tapered forearm',[0,0,0],[1,1,1],skin);
    const hand=joint(elbow,'wrist',0,-.267,.005);
    add(hand,'anatomyHand','anatomySkin','anatomical palm',[0,0,0],[1,1,1],skin,side<0?[0,Math.PI,0]:undefined);
    const digits=joint(hand,'mirrored digit frame',0,0,0);digits.rotation.y=side<0?Math.PI:0;
    const fingers=[];
    for(let index=0;index<4;index++){
      const length=fingerLengths[index],splay=(index-1.5)*.004;
      const root=joint(digits,`finger ${index+1} metacarpal joint`,fingerStarts[index],-.087+(index===3?.012:0),0);
      root.rotation.z=Math.atan2(splay*.8,length*fingerKnuckleFraction);
      const radiusScale=index===3?.0083/.0093:1;
      add(root,'anatomyFingerProximal','anatomySkin',`finger ${index+1} proximal phalanx`,[0,0,0],[radiusScale,length/fingerReferenceLength,1],skin);
      const tip=joint(root,`finger ${index+1} interphalangeal joint`,0,-length*fingerKnuckleFraction,.011);
      tip.rotation.z=-root.rotation.z;
      add(tip,'anatomyFingerDistal','anatomySkin',`finger ${index+1} distal phalanges`,[0,0,0],[radiusScale,length/fingerReferenceLength,1],skin);
      fingers.push({root,tip,side,index,isThumb:false});
    }
    const thumbRoot=joint(digits,'thumb carpometacarpal joint',.025,-.029,.001);
    add(thumbRoot,'anatomyThumbProximal','anatomySkin','thumb proximal phalanx',[0,0,0],[1,1,1],skin);
    const thumbTip=joint(thumbRoot,'thumb interphalangeal joint',.031,-.043,.016);
    add(thumbTip,'anatomyThumbDistal','anatomySkin','thumb distal phalanx',[0,0,0],[1,1,1],skin);
    fingers.push({root:thumbRoot,tip:thumbTip,side,index:4,isThumb:true});
    // X bind rotations are zero. Negative local X curls toward the palm (+Z
    // in this mirrored frame); positive X extends. Leave bind Z splay intact.
    arms.push({shoulder,elbow,hand,side,fingers});
    const thigh=joint(hips,side<0?'left hip':'right hip',side*.091,0,0);
    add(thigh,'anatomyThigh','anatomyTrousers','cloth drape over thigh');
    const knee=joint(thigh,'knee',0,-.435,0);
    add(knee,'anatomyShin','anatomyTrousers','calf and trouser break');
    const ankle=joint(knee,'ankle',0,-.425,0);
    add(ankle,'anatomyShoe','anatomyShoe','worn canvas shoe');
    add(ankle,'anatomySole','anatomySole','shaped rubber outsole',[0,0,0],[1,1,1],0xaea89c);
    add(ankle,'anatomyLaces','anatomySole','crossed cotton laces',[0,0,0],[1,1,1],0xd5d1c4);
    legs.push({thigh,knee,ankle,side});
  }
  return {rig,hips,torso,head,arms,legs,height,
    proportions:{hipHeight:.93,thighLength:.435,shinLength:.425,ankleFloorHeight:.070},
    pieceCenters:{head:[0,.178,0],leftArm:[0,-.347,.009],rightArm:[0,-.347,.009],leftLeg:[0,-.435,.027],rightLeg:[0,-.435,.027]},
    crest:{position:[0,.086,.133],scale:[.156,.151,1]},
  };
}
