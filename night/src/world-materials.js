import * as THREE from 'three';

export function seeded(seed=2106){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

function texture(size,paint,renderer){
  const c=document.createElement('canvas');c.width=c.height=size;paint(c.getContext('2d'),size);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());return t;
}

export function createMaterials(renderer){
  const rng=seeded(781);
  const stone=texture(256,(c,s)=>{c.fillStyle='#b8bcba';c.fillRect(0,0,s,s);for(let i=0;i<8000;i++){const v=85+rng()*145;c.fillStyle=`rgba(${v},${v},${v},.12)`;c.fillRect(rng()*s,rng()*s,1+rng()*2,1+rng()*2);}c.strokeStyle='#8f9692';c.lineWidth=2;c.strokeRect(0,0,s,s);c.strokeStyle='#ced1c9';c.lineWidth=1;c.strokeRect(3,3,s-6,s-6);},renderer);
  const brick=texture(256,(c,s)=>{c.fillStyle='#829092';c.fillRect(0,0,s,s);for(let r=0;r<8;r++)for(let col=-1;col<5;col++){const x=col*64+(r%2)*32,y=r*32;const v=110+rng()*40;c.fillStyle=`rgb(${v},${v*.93},${v*.82})`;c.fillRect(x+2,y+2,60,28);c.fillStyle='rgba(238,230,207,.11)';c.fillRect(x+2,y+2,60,2);}},renderer);
  const wood=texture(256,(c,s)=>{c.fillStyle='#aa9779';c.fillRect(0,0,s,s);for(let i=0;i<250;i++){c.strokeStyle=`rgba(44,26,15,${rng()*.20})`;c.lineWidth=.3+rng()*1.5;c.beginPath();const x=rng()*s;c.moveTo(x,0);c.bezierCurveTo(x+10,70,x-8,180,x,s);c.stroke();}for(let x=0;x<s;x+=64){c.fillStyle='#6c6555';c.fillRect(x,0,1,s);}},renderer);
  const lawn=texture(256,(c,s)=>{c.fillStyle='#57695e';c.fillRect(0,0,s,s);for(let i=0;i<13000;i++){c.fillStyle=rng()>.5?'rgba(160,168,122,.20)':'rgba(17,42,34,.25)';c.fillRect(rng()*s,rng()*s,1,2+rng()*5);}},renderer);
  const glow=texture(128,(c,s)=>{c.clearRect(0,0,s,s);const g=c.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);g.addColorStop(0,'rgba(239,195,115,.38)');g.addColorStop(.32,'rgba(210,156,72,.20)');g.addColorStop(1,'rgba(210,156,72,0)');c.fillStyle=g;c.fillRect(0,0,s,s);},renderer);
  const shadow=texture(64,(c,s)=>{c.clearRect(0,0,s,s);const g=c.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);g.addColorStop(0,'rgba(1,8,12,.62)');g.addColorStop(.4,'rgba(1,8,12,.36)');g.addColorStop(1,'rgba(1,8,12,0)');c.fillStyle=g;c.fillRect(0,0,s,s);},renderer);
  const standard=(name,color,roughness=.85,extra={})=>new THREE.MeshStandardMaterial({name,color,roughness,...extra});
  return {
    stone:standard('Weathered limestone','#abc2c4',.9,{map:stone}),
    brick:standard('Old collegiate masonry','#a2b5b2',.94,{map:brick}),
    pearl:standard('Pale ribbon facade','#c9d9d7',.6),
    floor:standard('Slate walkway','#a2b9b7',.92,{map:stone}),
    wood:standard('Waxed old oak','#907459',.82,{map:wood}),
    dark:standard('Recess and painted iron','#1c343c',.78),
    roof:standard('Oxidised standing seam roof','#315b65',.66,{metalness:.18,side:THREE.DoubleSide}),
    brass:standard('Aged brass instruments','#b7a475',.43,{metalness:.35}),
    glass:standard('Opaque blue landmark glazing','#406572',.3,{metalness:.2}),
    greenhouse:standard('Conservatory glazing','#7cbbba',.2,{transparent:true,opacity:.13,depthWrite:false,side:THREE.DoubleSide}),
    lawn:standard('Groundcover','#78988a',1,{map:lawn}),
    leaf:standard('Waxed botanical leaves','#3d7764',.82,{side:THREE.DoubleSide}),
    bark:standard('Pale winter bark','#6a7777',.96),
    soil:standard('Potting soil','#233a3b',1),
    paper:standard('Ivory pages','#dfd5b2',.92),
    bookRed:standard('Oxblood bookcloth','#8d5555',.9),
    bookBlue:standard('Petrol bookcloth','#4f7a87',.9),
    bookGreen:standard('Moss bookcloth','#6e8464',.9),
    fabric:standard('Faded residence linen','#7b9b9a',1),
    amber:new THREE.MeshBasicMaterial({name:'Amber safety diffuser',color:'#f4ca83'}),
    cyan:new THREE.MeshBasicMaterial({name:'Memory pale signal',color:'#92dfde'}),
    lightPool:new THREE.MeshBasicMaterial({name:'Baked lantern light pool',map:glow,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}),
    contact:new THREE.MeshBasicMaterial({name:'Soft contact shading',map:shadow,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1})
  };
}

export function createSignAtlas(){
  const labels=[
    ['THE STILL LIBRARY','KEEP YOUR VOICE LOW'],['GLASSHOUSE','SOME THINGS ONLY BLOOM AT NIGHT'],
    ['THE OBSERVATORY','LET THE DARK SHOW YOU'],['NORTH RESIDENCE','EVERY ROOM REMEMBERS'],
    ['FOUNDERS HALL','CLOSED AFTER THE LAST BELL'],['SOUTH GATE','RETURN WHAT THE CAMPUS LOST'],
    ['LIBRARY  ←     →  GLASSHOUSE','RESIDENCE  ←     →  OBSERVATORY'],['SAFE LIGHT','REST HERE · RECOVER YOUR LIGHT'],
    ['A VOICE BETWEEN PAGES','PUT OUT YOUR LIGHT. BE STILL. LISTEN.'],['THE NIGHT BLOOM','GIVE THE FLOWER YOUR LIGHT.'],
    ['A STAR UNSEEN','LISTEN IN DARKNESS. THEN LOOK AWAY.'],['THREE NOTES HOME','LISTEN. REMEMBER. ANSWER.'],
    ['1        2        3','THE RESIDENCE BELLS'],['AFTER THE LAST BELL','A FICTIONAL CAMPUS · FOUR LOST MEMORIES'],
    ['STILL LIBRARY','WEST WALK'],['GLASSHOUSE','EAST WALK']
  ];
  const c=document.createElement('canvas');c.width=c.height=1024;const ctx=c.getContext('2d');
  labels.forEach(([title,sub],i)=>{const x=(i%2)*512,y=Math.floor(i/2)*128;ctx.fillStyle='#152d35';ctx.fillRect(x,y,512,128);ctx.strokeStyle='#a99c73';ctx.lineWidth=1;ctx.strokeRect(x+8,y+8,496,112);ctx.fillStyle='#ded6b7';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='600 24px "DM Sans", Arial';ctx.fillText(title,x+256,y+45,470);ctx.font='13px "DM Sans", Arial';ctx.fillStyle='#a7c1bf';ctx.fillText(sub,x+256,y+86,470);});
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;
  return {material:new THREE.MeshBasicMaterial({name:'Campus enamel wayfinding',map:tex}),geometry(index,width=7,height=1.75){const g=new THREE.PlaneGeometry(width,height),uv=g.attributes.uv;const col=index%2,row=Math.floor(index/2);for(let i=0;i<uv.count;i++)uv.setXY(i,(col+uv.getX(i))*.5,1-(row+1-uv.getY(i))*.125);return g;}};
}
