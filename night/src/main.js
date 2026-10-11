import * as THREE from 'three';
import {createWorld} from './world.js';
import {createUI} from './ui.js';
import {createAudio} from './audio.js';
import {CampusGame,clamp,distance,TITLES} from './game.js';
import {DemoPlayer} from './demo.js';
import {createZombieVisuals} from './zombie-visuals.js';
import {CAMPUS} from '../../shared/campus-layout.js';
import './style.css';

const root=document.querySelector('#scene'),audio=createAudio();
let ready=false,game,world,demo=null,mode='title',quality='Smooth',sound=true,mapOpen=false,frame=0;
let renderScale=.8,last=0,accumulator=0,uiClock=0,adaptClock=0,elapsed=0,freeze=false,reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
let fps=60,frames=[],frameMetrics={mean:16.7,p95:16.7},drag=null,stepBob=0,qualityWarmup=8;
const key=new Set(),touch={x:0,z:0,interact:false,run:false},lookVector=new THREE.Vector3(),moonColor=new THREE.Color(0xa9cfdf);
const scene=new THREE.Scene();scene.background=new THREE.Color(0x172c3d);scene.fog=new THREE.Fog(0x243b47,80,355);
const camera=new THREE.PerspectiveCamera(67,innerWidth/innerHeight,.08,600);camera.rotation.order='YXZ';scene.add(camera);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',alpha:false});
renderer.setClearColor(0x172c3d);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
renderer.shadowMap.enabled=false;renderer.setPixelRatio(renderScale);renderer.setSize(innerWidth,innerHeight);root.appendChild(renderer.domElement);
renderer.domElement.setAttribute('aria-label','Three-dimensional haunted campus. Drag to look; WASD to walk, Shift to sprint, Space to kick.');renderer.domElement.tabIndex=0;
const hemi=new THREE.HemisphereLight(0xbadce8,0x41544a,2.15);scene.add(hemi);
const moon=new THREE.DirectionalLight(moonColor,2.0);moon.position.set(-38,58,-25);scene.add(moon);
const torch=new THREE.SpotLight(0xffe3ac,45,31,.52,.6,1.1);scene.add(torch,torch.target);
const moonMesh=new THREE.Mesh(new THREE.SphereGeometry(3.6,20,12),new THREE.MeshBasicMaterial({color:0xe4eee1,fog:false}));moonMesh.position.set(-78,95,-142);scene.add(moonMesh);
const ghostVisual=new THREE.Group();scene.add(ghostVisual);
const robeMat=new THREE.MeshStandardMaterial({color:0x82949a,emissive:0x1e4249,emissiveIntensity:.4,roughness:.95,side:THREE.DoubleSide});
const robe=new THREE.Mesh(new THREE.CylinderGeometry(.31,.84,2.65,24,9,true),robeMat);robe.position.y=1.8;ghostVisual.add(robe);
const robePositions=robe.geometry.attributes.position;
for(let i=0;i<robePositions.count;i++){const x=robePositions.getX(i),z=robePositions.getZ(i),y=robePositions.getY(i),a=Math.atan2(x,z),f=1+Math.cos(a*12)*.09;robePositions.setX(i,x*f);robePositions.setZ(i,z*f);if(y<-1.2)robePositions.setY(i,y+(.5+.5*Math.sin(a*7))*.32);}
robe.geometry.computeVertexNormals();const baseRobe=Float32Array.from(robePositions.array);
const hood=new THREE.Mesh(new THREE.SphereGeometry(.46,18,12,0,Math.PI*2,0,Math.PI*.79),robeMat);hood.scale.set(1,1.17,1);hood.rotation.x=-.23;hood.position.set(0,3.23,0);ghostVisual.add(hood);
const face=new THREE.Mesh(new THREE.CircleGeometry(.32,20),new THREE.MeshBasicMaterial({color:0x071720,side:THREE.DoubleSide}));face.scale.set(.86,1.17,1);face.position.set(0,3.23,.415);ghostVisual.add(face);
const eyeMat=new THREE.MeshBasicMaterial({color:0xf4bd7c});for(const x of [-.11,.11]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.031,6,4),eyeMat);eye.position.set(x,3.28,.442);ghostVisual.add(eye);}
// Long empty sleeves and a torn, folded hem give the Listener a readable silhouette.
for(const side of [-1,1]){
  const sleeve=new THREE.Mesh(new THREE.CylinderGeometry(.21,.30,1.35,10,3,true),robeMat);sleeve.position.set(side*.52,2.30,.06);sleeve.rotation.z=side*.35;ghostVisual.add(sleeve);
  const hand=new THREE.Mesh(new THREE.ConeGeometry(.085,.55,6),new THREE.MeshStandardMaterial({color:0x8ca6ab,roughness:1}));hand.rotation.z=side*.18;hand.rotation.x=Math.PI;hand.position.set(side*.75,1.47,.08);ghostVisual.add(hand);
}
const ring=new THREE.Mesh(new THREE.RingGeometry(.8,1.12,24),new THREE.MeshBasicMaterial({color:0x80babe,transparent:true,opacity:.26,depthWrite:false,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.045;ghostVisual.add(ring);
const bellVisual=new THREE.Mesh(new THREE.OctahedronGeometry(.22),new THREE.MeshBasicMaterial({color:0xffce87}));scene.add(bellVisual);bellVisual.visible=false;
const zombieVisuals=createZombieVisuals(scene,camera);

function clearInput(){key.clear();touch.x=0;touch.z=0;touch.interact=false;touch.run=false;drag=null;}
function begin(isDemo=false,keep=false){if(!ready)return;audio.stopSession();audio.beginSession();clearInput();game.reset(keep);demo=isDemo?new DemoPlayer(game,{portrait:innerWidth/innerHeight<.8}):null;mode='playing';mapOpen=false;freeze=false;qualityWarmup=4;hemi.intensity=2.15;scene.background.set(0x172c3d);scene.fog.color.set(0x243b47);updateUI();}
function pause(){if(mode==='playing'){mapOpen=false;mode='paused';game.mode='paused';audio.setPaused(true);clearInput();updateUI();}else if(mode==='paused')resume();}
function resume(){if(mode!=='paused')return;mode='playing';game.mode='playing';clearInput();updateUI();audio.beginSession();audio.setPaused(false);}
function toggleMap(){if(mode!=='playing')return;mapOpen=!mapOpen;clearInput();accumulator=0;audio.setPaused(mapOpen);updateUI();}
function takeover(){if(!demo)return;demo=null;clearInput();game.say('You are in control. M opens your campus map.',5);updateUI();}
const ui=createUI({start:()=>begin(false),demo:()=>begin(true),resume,retry:()=>begin(false,mode==='lost'),home:()=>{audio.stopSession();mode='title';if(game)game.mode='title';demo=null;clearInput();updateUI();},takeControl:takeover,
  toggleSound:()=>{sound=!sound;audio.setEnabled(sound);updateUI();},toggleQuality:()=>{quality=quality==='Smooth'?'Detail':'Smooth';renderScale=quality==='Smooth'?.8:1;resize();adaptClock=0;updateUI();},
  toggleMap,toggleTorch:()=>{if(!mapOpen)game?.toggleTorch();},decoy:()=>{if(!mapOpen)game?.ringBell();},kick:()=>{if(!mapOpen)game?.pressKick();},sprint:v=>{touch.run=!mapOpen&&v;},interact:(v)=>{if(v&&!touch.interact&&!mapOpen)game?.pressInteract();touch.interact=!mapOpen&&v;},note:n=>{if(!mapOpen)game?.note(n);},move:(x,z)=>{touch.x=mapOpen?0:x;touch.z=mapOpen?0:z;},look:(dx,dy)=>look(dx,dy),pause});
function look(dx,dy){if(mode!=='playing'||mapOpen||demo||freeze)return;game.player.yaw-=dx*.0028;game.player.pitch=clamp(game.player.pitch-dy*.0028,-1.12,1.12);}
const consumed=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyE','KeyF','KeyQ','KeyM','Escape','Digit1','Digit2','Digit3']);
addEventListener('keydown',e=>{
  if((e.code==='Space'||e.code==='Enter')&&e.target.closest?.('button,a,input,select,textarea'))return;
  if(consumed.has(e.code)&&mode!=='title')e.preventDefault();if(e.repeat){key.add(e.code);return;}
  if(e.code==='Escape'){if(mapOpen)toggleMap();else pause();return;}
  if(mode!=='playing')return;
  if(e.code==='KeyM'){toggleMap();return;}
  if(demo||mapOpen)return;
  key.add(e.code);if(e.code==='KeyF')game.toggleTorch();if(e.code==='KeyQ')game.ringBell();if(e.code==='KeyE')game.pressInteract();
  if(e.code==='Space')game.pressKick();
  if(/^Digit[123]$/.test(e.code))game.note(Number(e.code.slice(-1)));
});
addEventListener('keyup',e=>key.delete(e.code));
addEventListener('blur',()=>{clearInput();if(mode==='playing')pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='playing')pause();last=0;});
addEventListener('pagehide',event=>{
  if(mode==='playing'){mode='paused';if(game)game.mode='paused';clearInput();}
  audio.stopSession();if(!event.persisted)audio.dispose();
});
addEventListener('beforeunload',()=>{if(mode==='playing')pause();audio.stopSession();});
addEventListener('pageshow',event=>{if(event.persisted){last=0;updateUI();}});
if(import.meta.hot)import.meta.hot.dispose(()=>audio.dispose());
renderer.domElement.addEventListener('pointerdown',e=>{if(mode!=='playing'||mapOpen||demo)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY};renderer.domElement.setPointerCapture(e.pointerId);audio.unlock();});
renderer.domElement.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;look(e.clientX-drag.x,e.clientY-drag.y);drag.x=e.clientX;drag.y=e.clientY;});
for(const name of ['pointerup','pointercancel','lostpointercapture'])renderer.domElement.addEventListener(name,()=>drag=null);
function resize(){renderer.setPixelRatio(Math.min(devicePixelRatio,quality==='Detail'?1.25:renderScale));renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}addEventListener('resize',resize);
function input(){return {x:touch.x+(key.has('KeyD')||key.has('ArrowRight')?1:0)-(key.has('KeyA')||key.has('ArrowLeft')?1:0),z:touch.z+(key.has('KeyW')||key.has('ArrowUp')?1:0)-(key.has('KeyS')||key.has('ArrowDown')?1:0),run:touch.run||key.has('ShiftLeft')||key.has('ShiftRight'),interact:touch.interact||key.has('KeyE')};}
function updateUI(){
  const g=game;ui.update({ready,mode,demo:!!demo,title:'After the Last Bell',objective:g?.memories.length===4?'Return the memories to the plaza gate':'Recover four campus memories',hint:'M · Campus map. Follow the promenade, garden paths and rear arcade.',caption:demo?.caption||'',memories:CAMPUS.stations.map(s=>({id:s.id,title:s.title,done:g?.memories.includes(s.id)||false})),navigation:g?.navigation(),track:g?.track,focus:g?.focus||null,health:g?.health??100,biteFlash:g?.biteFlash??0,kickCooldown:g?.kickCooldown??0,chasers:g?.chasers??0,battery:g?.battery??100,fear:g?.fear??0,noise:g?.noise??0,torch:g?.torch??true,safe:g?.safe??false,time:g?.time??0,quality,sound,decoyCooldown:g?.decoyCooldown??0,mapOpen,player:g?.player||CAMPUS.spawn,ghost:{x:g?.ghost.x||0,z:g?.ghost.z||0,visible:g?.ghost.visible&&distance(g.player,g.ghost)<18},fps,message:g?.message||''});
}
function updateView(dt){
  if(mode==='title'){
    camera.position.set(...(innerWidth<700?[150,165,300]:[127,88,160]));camera.lookAt(0,4,0);torch.visible=false;ghostVisual.visible=false;
  }else if(game){
    const g=game,p=g.player;stepBob+=dt*(g.running?11:7);const bob=!reducedMotion&&g.moving&&mode==='playing'?Math.sin(stepBob)*.025:0;
    const recoil=!reducedMotion?g.biteFlash*g.biteFlash:0,impact=!reducedMotion?g.kickImpact/.32:0;
    camera.position.set(p.x,1.68+bob+Math.sin(g.time*47)*recoil*.023+impact*.035,p.z);camera.rotation.set(p.pitch+Math.sin(g.time*31)*recoil*.018+impact*.035,p.yaw,Math.sin(g.time*36)*recoil*.025,'YXZ');
    const targetFov=(g.running&&!reducedMotion?71:67)+impact*4;if(Math.abs(camera.fov-targetFov)>.015){camera.fov+=(targetFov-camera.fov)*(1-Math.exp(-10*dt));camera.updateProjectionMatrix();}
    camera.getWorldDirection(lookVector);torch.position.copy(camera.position);torch.position.y-=.15;torch.target.position.copy(camera.position).addScaledVector(lookVector,15);torch.visible=g.torch&&g.battery>0;
    let closestStudent=20;for(const student of g.zombies)closestStudent=Math.min(closestStudent,distance(p,student));
    torch.intensity=10+35*clamp((closestStudent-1.2)/5,0,1);
    ghostVisual.visible=g.ghost.visible;ghostVisual.position.set(g.ghost.x,Math.sin(elapsed*1.4)*.12,g.ghost.z);ghostVisual.rotation.y=g.ghost.yaw;
    for(let i=0;i<robePositions.count;i++){const h=baseRobe[i*3+1];robePositions.setX(i,baseRobe[i*3]+Math.sin(elapsed*2.1+h*2.2)*.055*(1.5-h));robePositions.setZ(i,baseRobe[i*3+2]+Math.cos(elapsed*1.7+h*2.7)*.06*(1.5-h));}robePositions.needsUpdate=true;
    robeMat.emissiveIntensity=.4+g.ghost.stun*.9;
    bellVisual.visible=!!g.decoy;if(g.decoy){bellVisual.position.set(g.decoy.x,.8+Math.sin(elapsed*6)*.15,g.decoy.z);bellVisual.rotation.y=elapsed*3;}
    if(mode==='won'){hemi.intensity+=(3.5-hemi.intensity)*Math.min(1,dt*.7);scene.background.lerp(new THREE.Color(0x758d93),dt*.3);scene.fog.color.lerp(new THREE.Color(0x718b8e),dt*.3);}
  }
}
const debug=new URLSearchParams(location.search).has('debug');
function diagnostics(){return {state:{ready,mode,demo:!!demo,memories:game?.memories||[],focus:game?.focus,player:game?{...game.player}:null,ghost:game?{...game.ghost}:null,health:game?.health,biteFlash:game?.biteFlash,kickTime:game?.kickTime,kickImpact:game?.kickImpact,kickCooldown:game?.kickCooldown,chasers:game?.chasers,combat:game?{...game.combat}:null,zombies:game?.zombies.map(({id,x,z,yaw,mode,phase,downTime,clock})=>({id,x,z,yaw,mode,phase,downTime,clock})),visuals:zombieVisuals.diagnostics,audio:audio.diagnostics?.(),battery:game?.battery,fear:game?.fear,time:game?.time,progress:game?.progress,track:game?.track,navigation:game?.navigation(),world:world?.diagnostics,starArmed:game?.starArmed,noteClock:game?.noteClock,sequence:game?.sequence,steps:game?.steps,demoStep:demo?.i},renderer:{calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,pixelRatio:renderer.getPixelRatio(),width:renderer.domElement.width,height:renderer.domElement.height},performance:{fps,meanFrameMs:frameMetrics.mean,p95FrameMs:frameMetrics.p95,samples:frames.length},physics:{engine:'custom AABB',step:1/60,colliders:world?.colliders.length||0,sensors:6,ccdBodies:0},frame};}
if(debug){
  Object.defineProperty(window,'__THREE_GAME_DIAGNOSTICS__',{get:diagnostics});
  window.__THREE_GAME_TEST_HOOKS__={seed:async()=>({seed:715}),getState:diagnostics,setReducedMotion:v=>{reducedMotion=v;},
    setState:async(name)=>{if(!ready)throw new Error('Scene is not ready');freeze=false;clearInput();
      if(name==='title'){mode='title';game.mode='title';demo=null;}
      else if(name==='active-play'){begin(false);}
      else if(name==='demo'){begin(true);}
      else if(['library','greenhouse','observatory','residence','demo-residence'].includes(name)){
        begin(false);const id=name==='demo-residence'?'residence':name,s=world.stations.find(s=>s.id===id);
        game.player={...s.approach,yaw:Math.atan2(s.approach.x-s.position.x,s.approach.z-s.position.z),pitch:0};game.time=18;game.torch=id==='greenhouse';game.step(1/60,input());freeze=true;
        if(name==='demo-residence'){demo=new DemoPlayer(game);demo.i=demo.route.findIndex(s=>s.kind==='ritual'&&s.id==='residence');demo.caption='Listen to the room call and repeat the notes.';}
      }
      else if(name==='track'){begin(false);game.player={x:126,z:57,yaw:0,pitch:-.1};game.track={active:true,next:0,timeLeft:28,total:4,done:false};freeze=true;}
      else if(name==='campus-overview'){begin(false);mode='title';game.mode='title';freeze=true;}
      else if(name==='threat'){begin(false);game.player={x:0,z:19,yaw:-Math.PI/2,pitch:.05};game.time=24;game.ghost.x=7;game.ghost.z=19;game.ghost.visible=true;game.fear=62;game.torch=false;freeze=true;}
      else if(['zombie-portrait','zombie-profile','zombie-rear','zombie-lineup'].includes(name)){
        begin(false);game.time=4;game.player={x:38,z:51,yaw:0,pitch:name==='zombie-lineup'?-.06:-.02};
        const lineup=name==='zombie-lineup';
        game.zombies.forEach((z,i)=>Object.assign(z,{x:lineup?34.75+i*1.3:i===0?38:65+i*3,z:lineup?45:49.1,yaw:name==='zombie-profile'?Math.PI*.5:name==='zombie-rear'?Math.PI:0,mode:'idle',walkPhase:i*.5}));
        game.say('GBU students · keep your distance.',3);freeze=true;
      }
      else if(['kick-raised','zombie-scattered','zombie-gripping','zombie-crawling','zombie-docking','zombie-rejoined'].includes(name)){
        begin(false);game.time=5;game.player={x:38,z:innerWidth/innerHeight<.8&&name!=='kick-raised'?54.1:51,yaw:0,pitch:name==='kick-raised'?-.1:innerWidth/innerHeight<.8?-.24:-.52};
        const age={'kick-raised':.04,'zombie-scattered':1.05,'zombie-gripping':2.15,'zombie-crawling':4.2,'zombie-docking':6.84,'zombie-rejoined':7.85}[name];
        Object.assign(game.zombies[0],{x:38,z:48.7,yaw:0,mode:'down',clock:age,phase:Math.min(1,age/.42),downTime:8-age});
        if(name==='kick-raised'){game.kickTime=.48;game.kickImpact=.29;}
        game.health=82;game.say(name==='kick-raised'?'Space · Push them back!':'The scattered limbs crawl back together. Make distance.',8);freeze=true;
      }
      else if(name==='zombie-chase'||name==='zombie-bite'||name==='zombie-kick'){
        begin(false);game.player={x:38,z:51,yaw:0,pitch:-.14};game.time=4;
        const z=game.zombies[0];Object.assign(z,{x:38,z:48.7,yaw:0,mode:'chasing'});
        Object.assign(game.zombies[1],{x:41,z:46.3,yaw:-.3,mode:'chasing'});game.chasers=2;
        if(name==='zombie-bite'){Object.assign(z,{z:49.9,mode:'cooldown',phase:.2});game.health=82;game.biteFlash=.73;game.combat.bites=1;game.say('Bitten · −18 blood. Space to kick. Shift to outrun.',3);}
        if(name==='zombie-kick'){Object.assign(z,{z:48.9,mode:'down',phase:.72,downTime:4.7});game.health=82;game.kickTime=.27;game.kickCooldown=.8;game.combat.knockdowns=1;game.player.pitch=-.32;game.say('Knocked down. Keep moving — they will get back up.',3);}
        freeze=true;
      }
      else if(name==='paused'){begin(false);pause();}
      else if(name==='lost'){begin(false);game.time=15;game.ghost.x=game.player.x;game.ghost.z=game.player.z;game.torch=false;game.fear=99.8;game.step(1/60,input());mode=game.mode;freeze=true;}
      else if(name==='won'){begin(false);for(const s of world.stations)game.collect(s.id);game.player.x=world.exit.x;game.player.z=world.exit.z-2;game.exitProgress=.999;game.step(1/60,{x:0,z:0,interact:true});mode=game.mode;freeze=true;}
      else throw new Error(`Unknown state: ${name}`);if(['title','won','lost'].includes(mode))audio.stopSession();updateView(.016);updateUI();return {state:name};},
    resumeSimulation:()=>{freeze=false;},snapshot:()=>({events:game.events,recoveredAt:game.recoveredAt,combat:game.combat}),startAudioRecording:()=>audio.startRecording?.(),stopAudioRecording:()=>audio.stopRecording?.(),
    worldSnapshot:()=>({bounds:world.bounds,colliders:world.colliders,stations:world.stations,safeZones:world.safeZones,exit:world.exit,spawn:world.spawn,track:CAMPUS.track,paths:CAMPUS.paths}),
    position:(x,z,yaw=0)=>{game.player={x,z,yaw,pitch:0};game.velocity={x:0,z:0};},danger:()=>{game.time=20;game.ghost.x=game.player.x+2;game.ghost.z=game.player.z;game.torch=false;game.fear=70;},
    combatFixture:(name)=>{begin(false);if(name==='wall'){game.player={x:-49,z:-8,yaw:Math.PI/2,pitch:0};Object.assign(game.zombies[0],{x:-52.7,z:-8,mode:'chasing'});}else if(name==='bleedout'){game.health=18;Object.assign(game.zombies[0],{x:world.spawn.x,z:world.spawn.z-1.15,mode:'windup',clock:0});}else throw new Error('Unknown combat fixture');},
    setPausedForScreenshot:v=>{freeze=v;},freeze:v=>{freeze=v;},resetMetrics:()=>{frames=[];qualityWarmup=0;},render:()=>{updateView(.016);renderer.render(scene,camera);return diagnostics();}};
}
function animate(now){requestAnimationFrame(animate);const raw=last?Math.min((now-last)/1000,.25):1/60;last=now;const dt=Math.min(raw,.07);elapsed+=dt;frame++;
  if(ready){
    if(mode==='playing'&&!mapOpen&&!freeze){accumulator+=dt;while(accumulator>=1/60){const intent=demo?demo.update(1/60):input();game.step(1/60,intent);accumulator-=1/60;if(game.mode!=='playing'){mode=game.mode;audio.stopSession();clearInput();break;}}}
    else accumulator=0;
    world.update(dt,elapsed,{...game,mode});updateView(mapOpen?0:dt);zombieVisuals.update(dt,game.time,{...game,mode});audio.update({mode:mapOpen?'paused':mode,danger:Math.max(game.fear/100,(100-game.health)/130),moving:mode==='playing'&&!mapOpen&&game.moving,running:game.running,safe:game.safe},dt);
    uiClock+=dt;if(uiClock>.12){uiClock=0;updateUI();}
    qualityWarmup-=dt;if(qualityWarmup<0&&mode==='playing'&&!document.hidden){frames.push(raw*1000);if(frames.length>360)frames.shift();}
    adaptClock+=dt;if(adaptClock>3&&frames.length>50){adaptClock=0;const sorted=[...frames].sort((a,b)=>a-b);frameMetrics={mean:frames.reduce((a,b)=>a+b,0)/frames.length,p95:sorted[Math.floor(sorted.length*.95)]};fps=Math.round(1000/frameMetrics.mean);
      if(quality==='Smooth'&&frameMetrics.mean>23&&renderScale>.55){renderScale=Math.max(.55,renderScale-.1);resize();frames=[];qualityWarmup=2;}
    }
  }else updateView(dt);
  renderer.render(scene,camera);
}
requestAnimationFrame(animate);
ui.setLoading('Opening the campus after dark',.05);updateUI();
try{
  world=await createWorld(scene,renderer,(text,value)=>ui.setLoading(text,value));game=new CampusGame(world,audio);mode='title';game.mode='title';
  ui.setLoading('Preparing the students and moonlight',.93);await zombieVisuals.ready;
  zombieVisuals.update(0,0,{...game,mode:'playing'});updateView(.016);await renderer.compileAsync(scene,camera);
  // Warm the torch-lit material variants too, before the first playable frame.
  torch.visible=true;await renderer.compileAsync(scene,camera);torch.visible=false;
  zombieVisuals.update(0,0,{...game,mode:'title'});
  ready=true;ui.setLoading('The campus is ready',1);updateUI();
}catch(error){console.error(error);ui.setLoading('The campus could not load. Reload this page to try again.',0);}



