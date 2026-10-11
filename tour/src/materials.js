import * as THREE from 'three';

export function seeded(seed = 721) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

function canvasTexture(size, painter, renderer, color = true) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
  painter(canvas.getContext('2d'), size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return texture;
}

export async function createMaterials(renderer) {
  const rng = seeded(58);
  const stoneMap = canvasTexture(512, (c, n) => {
    c.fillStyle = '#bcb8aa'; c.fillRect(0, 0, n, n);
    for (let i = 0; i < 28000; i++) {
      const v = 110 + rng() * 100; c.fillStyle = `rgba(${v},${v},${v-6},${.03+rng()*.14})`;
      const s = .3 + rng() * 2; c.fillRect(rng()*n,rng()*n,s,s);
    }
    c.strokeStyle = '#8c8b7f'; c.lineWidth = 2; c.strokeRect(0,0,n,n);
    c.strokeStyle = 'rgba(248,243,224,.35)'; c.lineWidth = 1; c.strokeRect(3,3,n-6,n-6);
  }, renderer);
  const floorMap = canvasTexture(512, (c,n) => {
    c.fillStyle = '#d2cbbb'; c.fillRect(0,0,n,n);
    for (let i=0;i<18000;i++) { const v=110+rng()*100; c.fillStyle=`rgba(${v},${v-2},${v-6},.075)`; c.fillRect(rng()*n,rng()*n,rng()*2+1,rng()*2+1); }
    c.strokeStyle='#a29d91';c.lineWidth=1.5;c.strokeRect(0,0,n,n);
    c.lineWidth=.7;c.strokeStyle='rgba(248,244,232,.5)';c.strokeRect(2,2,n-4,n-4);
  },renderer);
  const woodMap=canvasTexture(512,(c,n)=>{
    c.fillStyle='#a77d52';c.fillRect(0,0,n,n);
    for(let i=0;i<750;i++){ const x=rng()*n;c.beginPath();c.moveTo(x,0);c.bezierCurveTo(x+12*rng(),n*.3,x-15*rng(),n*.7,x,n);c.lineWidth=.2+rng()*1.8;c.strokeStyle=`rgba(${rng()>.5?'46,26,10':'244,217,166'},${.04+rng()*.12})`;c.stroke(); }
  },renderer);
  const grassMap=canvasTexture(512,(c,n)=>{
    c.fillStyle='#4e6534';c.fillRect(0,0,n,n);
    for(let i=0;i<40000;i++){const v=rng();c.fillStyle=`rgba(${50+v*48},${66+v*54},${24+v*28},.45)`;c.fillRect(rng()*n,rng()*n,1,2+rng()*5);}
  },renderer);
  const leafMap=canvasTexture(256,(c,n)=>{
    c.clearRect(0,0,n,n);
    c.strokeStyle='#48602d';c.lineWidth=3;c.beginPath();c.moveTo(128,256);c.bezierCurveTo(130,180,112,110,132,20);c.stroke();
    for(let i=0;i<24;i++){const y=25+i*8.5;const side=i%2?-1:1;const x=128+side*(22+rng()*40);c.save();c.translate(x,y);c.rotate(side*(.6+rng()*.5));const grad=c.createLinearGradient(-20,0,20,0);grad.addColorStop(0,'#364824');grad.addColorStop(.5,'#70834b');grad.addColorStop(1,'#455d2d');c.fillStyle=grad;c.beginPath();c.ellipse(0,0,10+rng()*8,4+rng()*3,0,0,Math.PI*2);c.fill();c.strokeStyle='rgba(167,180,108,.5)';c.lineWidth=.65;c.beginPath();c.moveTo(-14,0);c.lineTo(14,0);c.stroke();c.restore();c.beginPath();c.strokeStyle='#62713b';c.lineWidth=1;c.moveTo(126,y+10);c.lineTo(x,y);c.stroke();}
  },renderer);
  const bladesMap=canvasTexture(256,(c,n)=>{
    c.clearRect(0,0,n,n);
    for(let i=0;i<26;i++){const x=34+rng()*188;const endX=x+(rng()-.5)*100;const height=60+rng()*174;c.beginPath();c.moveTo(x,256);c.quadraticCurveTo(x-12,256-height*.55,endX,256-height);c.quadraticCurveTo(x+6,256-height*.35,x+4,256);c.fillStyle=['#738147','#405a32','#829351','#536c38'][i%4];c.fill();}
  },renderer);
  const noiseBump=canvasTexture(256,(c,n)=>{
    c.fillStyle='#808080';c.fillRect(0,0,n,n);for(let i=0;i<20000;i++){const v=80+rng()*90;c.fillStyle=`rgb(${v},${v},${v})`;c.fillRect(rng()*n,rng()*n,1,1);}
  },renderer,false);
  const textureLoader=new THREE.TextureLoader();
  const [pavingColor,pavingNormal,pavingRoughness]=await Promise.all(['diff','nor_gl','rough'].map(name=>textureLoader.loadAsync(`${import.meta.env.BASE_URL}environment/paving-${name}.jpg`)));
  for(const texture of [pavingColor,pavingNormal,pavingRoughness]){texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());}
  pavingColor.colorSpace=THREE.SRGBColorSpace;
  const contactMap=canvasTexture(128,(c,n)=>{
    c.clearRect(0,0,n,n);const g=c.createRadialGradient(n/2,n/2,n*.03,n/2,n/2,n*.50);g.addColorStop(0,'rgba(23,29,24,.32)');g.addColorStop(.35,'rgba(23,29,24,.23)');g.addColorStop(.7,'rgba(23,29,24,.065)');g.addColorStop(1,'rgba(23,29,24,0)');c.fillStyle=g;c.fillRect(0,0,n,n);
  },renderer);

  const m={
    pearl:new THREE.MeshStandardMaterial({name:'Soft pearl aluminium',color:'#e1e3dc',roughness:.38,metalness:.34}),
    edge:new THREE.MeshStandardMaterial({name:'Satin white edge',color:'#f2f0e5',roughness:.32,metalness:.25}),
    roof:new THREE.MeshStandardMaterial({name:'Roof satin aluminium',color:'#c3c8c4',roughness:.52,metalness:.25}),
    bronze:new THREE.MeshStandardMaterial({name:'Graphite bronze frames',color:'#3b413d',roughness:.35,metalness:.72}),
    seam:new THREE.MeshStandardMaterial({name:'Panel shadow joints',color:'#6d756c',roughness:.7}),
    glass:new THREE.MeshStandardMaterial({name:'Exterior solar-control glazing',color:'#6f888a',roughness:.14,metalness:.5,envMapIntensity:1.2,side:THREE.DoubleSide}),
    groundGlass:new THREE.MeshPhysicalMaterial({name:'Ground floor clear glazing',color:'#b2cac2',roughness:.12,metalness:.1,transparent:true,opacity:.25,depthWrite:false,clearcoat:1,envMapIntensity:.75,side:THREE.DoubleSide}),
    stone:new THREE.MeshStandardMaterial({name:'Granite paving',color:'#edeee6',map:stoneMap,roughness:.82,bumpMap:noiseBump,bumpScale:.035}),
    paving:new THREE.MeshStandardMaterial({name:'Natural beige stone paving',map:pavingColor,normalMap:pavingNormal,normalScale:new THREE.Vector2(.20,.20),roughnessMap:pavingRoughness,roughness:.85,color:'#ffefcf'}),
    contact:new THREE.MeshBasicMaterial({name:'Soft contact occlusion',map:contactMap,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}),
    floor:new THREE.MeshStandardMaterial({name:'Honed limestone',map:floorMap,color:'#f4efdf',roughness:.36,bumpMap:noiseBump,bumpScale:.015}),
    wood:new THREE.MeshStandardMaterial({name:'Oiled oak',color:'#e4c79f',map:woodMap,roughness:.58,bumpMap:noiseBump,bumpScale:.015}),
    plaster:new THREE.MeshStandardMaterial({name:'Warm lime plaster',color:'#d8d2bf',roughness:.92,bumpMap:noiseBump,bumpScale:.025}),
    dark:new THREE.MeshStandardMaterial({name:'Dark recesses',color:'#202a28',roughness:.65}),
    soil:new THREE.MeshStandardMaterial({name:'Planting soil',color:'#343a24',roughness:1}),
    lawn:new THREE.MeshStandardMaterial({name:'Lawn',map:grassMap,color:'#a8b97d',roughness:1}),
    bark:new THREE.MeshStandardMaterial({name:'Bark',color:'#655949',roughness:1,bumpMap:noiseBump,bumpScale:.06}),
    leaf:new THREE.MeshStandardMaterial({name:'Leaf sprays',map:leafMap,color:'#e3e4b3',alphaTest:.38,side:THREE.DoubleSide,roughness:.96}),
    grass:new THREE.MeshStandardMaterial({name:'Ornamental grass',map:bladesMap,alphaTest:.35,side:THREE.DoubleSide,roughness:1}),
    fabric:new THREE.MeshStandardMaterial({name:'Sage woven upholstery',color:'#778c80',roughness:1,bumpMap:noiseBump,bumpScale:.045}),
    fabricLight:new THREE.MeshStandardMaterial({name:'Sand woven upholstery',color:'#c2b394',roughness:1,bumpMap:noiseBump,bumpScale:.04}),
    brass:new THREE.MeshStandardMaterial({name:'Warm brushed brass',color:'#a78a5a',metalness:.8,roughness:.4}),
    light:new THREE.MeshBasicMaterial({name:'Warm lighting diffuser',color:'#fff0c9'}),
    water:new THREE.MeshPhysicalMaterial({name:'Still reflecting pool',color:'#354b4b',roughness:.12,metalness:.62,clearcoat:1,clearcoatRoughness:.08,envMapIntensity:1.3}),
  };
  return m;
}

export function labelTexture(lines,{width=1024,height=384,bg='#ded8c6',fg='#32413c',font='Arial',smallColor='#6f7970'}={}) {
  const c=document.createElement('canvas');c.width=width;c.height=height;const ctx=c.getContext('2d');
  ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);ctx.textAlign='center';ctx.textBaseline='middle';
  lines.forEach((line,i)=>{ctx.font=`${i===0?'500':'400'} ${i===0?height*.29:height*.095}px ${font}`;ctx.fillStyle=i===0?fg:smallColor;ctx.fillText(line,width/2,height*(i===0?.40:.78));});
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return tex;
}
