import * as THREE from 'three';
import { createWorld } from './world.js';
import './style.css';

const $=id=>document.getElementById(id), canvas=$('world');
const small=()=>innerWidth<700;
const places={
  plaza:{position:[38,1.72,39],target:[-21,8,-9],title:'The flag plaza',description:'The curved building opens to your left; the sports complex lies to your right.'},
  entrance:{position:[-20,1.72,20],target:[-25,8,-17],title:'The water court',description:'White ribbons curve around a garden hill, terraces and still water.'},
  lobby:{position:[-77,1.72,6],target:[-77,4,-5],title:'The west teaching block',description:'Horizontal louvers, deep overhangs and a sheltered ground-floor passage.'},
  sports:{position:[107,1.72,11],target:[107,5,-1],title:'The sports hall',description:'Tall structural fins frame the courts. The blue track lies just outside.'},
  residence:{position:[90,1.72,-12],target:[104,13,-34],title:'The dormitory arcade',description:'White grids and orange recesses rise behind the sports complex.'},
  towers:{position:[-99,1.72,-6],target:[-122,23,-29],title:'The balcony towers',description:'Slender towers anchor the far end of the campus beside a stepped high-rise.'}
};
const placeOrder=Object.keys(places);
let renderer,world,ready=false,mode='welcome',paused=false,shotPaused=false;
let reduced=matchMedia('(prefers-reduced-motion: reduce)').matches, sensitivity=1,quality='balanced';
let tourTime=0,tourDone=false,elapsed=0,lastTime=performance.now(),activePlace='plaza',transitionId=0;
let yaw=0,pitch=0,targetYaw=0,targetPitch=0,drag=null,toastTimer;
const keys=new Set(),touchMove=new Set(),velocity=new THREE.Vector2();
const scene=new THREE.Scene();
scene.background=new THREE.Color('#cbdce2');scene.fog=new THREE.Fog('#cbdce2',180,490);
const camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.1,700);
camera.rotation.order='YXZ';
const tmpLook=new THREE.Vector3(),previousPos=new THREE.Vector3();
const sun=new THREE.DirectionalLight(0xffefd9,3.1);sun.position.set(-22,34,25);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-52,right:52,top:48,bottom:-40,near:1,far:120});
sun.shadow.bias=-.00015;sun.shadow.normalBias=.045;sun.shadow.camera.updateProjectionMatrix();
scene.add(sun,new THREE.HemisphereLight(0xe5f0ff,0x8c8c69,1.4));

function lookAt(target){camera.lookAt(...target);yaw=targetYaw=camera.rotation.y;pitch=targetPitch=camera.rotation.x;}
function setView(position,target){camera.position.set(...position);lookAt(target);velocity.set(0,0);}
function overview(){setView(small()?[100,170,330]:[104,85,175],[0,4,-2]);}
overview();
function clearInput(){keys.clear();touchMove.clear();velocity.set(0,0);drag=null;}
function announce(message,persist=false){clearTimeout(toastTimer);$('visit-status').textContent=message;$('visit-status').hidden=false;if(!persist)toastTimer=setTimeout(()=>$('visit-status').hidden=true,4300);}
function locationUI(place){if(activePlace===place)return;activePlace=place;const p=places[place];$('place-title').textContent=p.title;$('place-description').textContent=p.description;document.querySelectorAll('[data-place]').forEach(b=>b.toggleAttribute('aria-current',b.dataset.place===place));}
function syncUI(){
  const entered=mode!=='welcome';$('welcome').hidden=entered;
  for(const id of ['location-note','places','visit-controls','gesture-hint'])$(id).hidden=!entered;
  $('touch-controls').hidden=!entered||!(small()||matchMedia('(pointer:coarse)').matches);
  const b=$('tour-toggle');b.textContent=paused?'Resume visit':mode==='tour'?'Pause visit':reduced?'Visit next landmark':'Guided visit';
  b.setAttribute('aria-pressed',String(mode==='tour'&&!paused));
}
async function transitionTo(position,target){
  const token=++transitionId;clearInput();
  if(reduced){setView(position,target);return true;}
  $('scene-fade').classList.add('active');
  await new Promise(r=>setTimeout(r,220));if(token!==transitionId)return false;
  setView(position,target);$('scene-fade').classList.remove('active');return true;
}
async function visit(place,{instant=false}={}){
  if(!ready)return;mode='walk';paused=false;tourDone=false;clearInput();locationUI(place);syncUI();
  const view=places[place];
  if(instant){transitionId++;$('scene-fade').classList.remove('active');setView(view.position,view.target);}
  else await transitionTo(view.position,view.target);
  canvas.focus({preventScroll:true});
}
async function beginTour(){
  if(!ready)return;if(reduced){await visit(mode==='welcome'?'plaza':placeOrder[(placeOrder.indexOf(activePlace)+1)%placeOrder.length]);announce('Camera motion is reduced. Choose a place to continue.');return;}
  mode='walk';paused=false;tourTime=0;tourDone=false;locationUI('plaza');syncUI();
  if(!await transitionTo(places.plaza.position,places.plaza.target))return;mode='tour';syncUI();canvas.focus({preventScroll:true});announce('A walk through the model-based campus. Move or drag to take over.');
}
function takeOver(){if(mode==='tour'){mode='walk';paused=false;syncUI();announce('You’re in control. Explore at your own pace.');}if(paused){paused=false;syncUI();$('visit-status').hidden=true;}}
function togglePause(){if(mode==='welcome'||!ready)return;paused=!paused;clearInput();syncUI();if(paused)announce('Visit paused. Press Esc or Resume visit to continue.',true);else $('visit-status').hidden=true;}

const audio={context:null,master:null,wind:null,on:false,distance:0,sources:new Set(),generation:0,
  async toggle(){
    if(!this.context){const AC=window.AudioContext||window.webkitAudioContext;if(!AC){announce('Ambience is unavailable in this browser.');return;}this.context=new AC();this.master=this.context.createGain();this.master.gain.value=0;this.master.connect(this.context.destination);const buffer=this.context.createBuffer(1,this.context.sampleRate*4,this.context.sampleRate);const data=buffer.getChannelData(0);let n=19;for(let i=0;i<data.length;i++){n=(n*16807)%2147483647;data[i]=(n/1073741824-1)*.5;}const s=this.context.createBufferSource();s.buffer=buffer;s.loop=true;const filter=this.context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=180;s.connect(filter).connect(this.master);s.start();this.wind=s;}
    const ctx=this.context,stamp=++this.generation;
    try{await ctx.resume();}catch{if(this.context===ctx)announce('Ambience could not start. Try the sound button again.');return;}
    if(this.context!==ctx||this.generation!==stamp)return;
    this.on=!this.on;this.master.gain.setTargetAtTime(this.on&&!this.pauseState?.055:0,ctx.currentTime,.4);$('sound').setAttribute('aria-pressed',String(this.on));$('sound').setAttribute('aria-label',this.on?'Turn ambience off':'Turn ambience on');announce(this.on?'Quiet ambience on.':'Ambience off.');
  },
  step(distance){if(!this.on||!this.context||paused)return;this.distance+=distance;if(this.distance<1.5)return;this.distance=0;const now=this.context.currentTime;const osc=this.context.createOscillator(),gain=this.context.createGain();osc.type='sine';osc.frequency.setValueAtTime(activePlace==='lobby'?105:150,now);osc.frequency.exponentialRampToValueAtTime(45,now+.085);gain.gain.setValueAtTime(.045,now);gain.gain.exponentialRampToValueAtTime(.0001,now+.1);osc.connect(gain).connect(this.context.destination);this.sources.add(osc);osc.onended=()=>{this.sources.delete(osc);osc.disconnect();gain.disconnect();};osc.start(now);osc.stop(now+.11);},
  pause(value){if(this.pauseState===value)return;this.pauseState=value;if(this.context)this.master.gain.setTargetAtTime(this.on&&!value?.055:0,this.context.currentTime,.2);},
  dispose(){this.generation++;this.on=false;this.pauseState=null;this.distance=0;const ctx=this.context;if(this.master&&ctx){this.master.gain.cancelScheduledValues(ctx.currentTime);this.master.gain.setValueAtTime(0,ctx.currentTime);}for(const node of [this.wind,...this.sources]){try{node?.stop();node?.disconnect();}catch{}}this.sources.clear();this.master?.disconnect();this.wind=null;this.master=null;this.context=null;if(ctx&&ctx.state!=='closed')void ctx.close().catch(()=>{});$('sound').setAttribute('aria-pressed','false');$('sound').setAttribute('aria-label','Turn ambience on');}
};
addEventListener('pagehide',()=>{clearInput();paused=true;audio.dispose();});
addEventListener('beforeunload',()=>{clearInput();paused=true;audio.dispose();if(ready)syncUI();});
addEventListener('pageshow',event=>{if(event.persisted){lastTime=performance.now();syncUI();}});
if(import.meta.hot)import.meta.hot.dispose(()=>audio.dispose());

$('start-tour').addEventListener('click',beginTour);$('start-walk').addEventListener('click',()=>visit('plaza'));
$('tour-toggle').addEventListener('click',()=>{if(paused||mode==='tour')togglePause();else beginTour();});
$('reset').addEventListener('click',()=>{visit('plaza');announce('Back at the arrival plaza.');});
$('retry').addEventListener('click',()=>location.reload());
document.querySelectorAll('[data-place]').forEach(b=>b.addEventListener('click',()=>visit(b.dataset.place)));
const dialogs=[$('help-dialog'),$('settings-dialog')];
const dialogReturn=new WeakMap();
function openDialog(id){const dialog=$(id);dialogReturn.set(dialog,{paused,focus:document.activeElement});clearInput();if(mode!=='welcome')paused=true;syncUI();audio.pause(true);dialog.showModal();}
$('help').addEventListener('click',()=>openDialog('help-dialog'));$('settings').addEventListener('click',()=>openDialog('settings-dialog'));
document.querySelectorAll('.close-dialog').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
dialogs.forEach(d=>d.addEventListener('close',()=>{const previous=dialogReturn.get(d);if(!previous)return;dialogReturn.delete(d);clearInput();paused=previous.paused;syncUI();audio.pause(paused);if(previous.focus?.isConnected)previous.focus.focus({preventScroll:true});}));
$('quality').value=quality;$('quality').addEventListener('change',e=>{quality=e.target.value;applyQuality();});
$('reduced-motion').checked=reduced;$('reduced-motion').addEventListener('change',e=>{reduced=e.target.checked;if(reduced&&mode==='tour'){mode='walk';tourDone=false;}syncUI();});
$('sensitivity').addEventListener('input',e=>sensitivity=Number(e.target.value));
$('sound').addEventListener('click',()=>audio.toggle().catch(()=>announce('Ambience could not start. Try the sound button again.')));
$('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('experience').requestFullscreen();}catch{announce('Fullscreen is unavailable. You can still explore here.');}});
document.addEventListener('fullscreenchange',()=>$('fullscreen').setAttribute('aria-label',document.fullscreenElement?'Exit fullscreen':'Enter fullscreen'));

addEventListener('keydown',e=>{
  if(dialogs.some(d=>d.open))return;if(e.target instanceof HTMLInputElement||e.target instanceof HTMLSelectElement)return;
  const k=e.key.toLowerCase();if(k==='escape'){e.preventDefault();togglePause();return;}if(k==='h'){openDialog('help-dialog');return;}
  if(!ready||mode==='welcome')return;
  if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','q','e','shift'].includes(k)){e.preventDefault();takeOver();keys.add(k);}
});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
addEventListener('blur',clearInput);
document.addEventListener('visibilitychange',()=>{clearInput();if(document.hidden&&mode!=='welcome'){paused=true;syncUI();}audio.pause(document.hidden||paused);});
canvas.addEventListener('pointerdown',e=>{if(mode==='welcome'||!ready||e.button!==0)return;takeOver();drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);canvas.focus({preventScroll:true});});
canvas.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;targetYaw-=(e.clientX-drag.x)*.003*sensitivity;targetPitch-=(e.clientY-drag.y)*.0025*sensitivity;targetPitch=THREE.MathUtils.clamp(targetPitch,-.65,.9);drag.x=e.clientX;drag.y=e.clientY;});
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>drag=null);
for(const b of document.querySelectorAll('[data-move]')){
  b.addEventListener('pointerdown',e=>{e.preventDefault();takeOver();b.setPointerCapture(e.pointerId);touchMove.add(b.dataset.move);});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>touchMove.delete(b.dataset.move));
}

function applyQuality(){if(!renderer)return;renderer.setPixelRatio(Math.min(devicePixelRatio,quality==='high'?1.5:1));renderer.setSize(innerWidth,innerHeight);sun.shadow.mapSize.setScalar(quality==='high'?2048:1024);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}renderer.shadowMap.needsUpdate=true;}
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();if(renderer)renderer.setSize(innerWidth,innerHeight);if(mode==='welcome')overview();syncUI();});
function canMove(x,z){const b=world.bounds;return x>b.minX+.4&&x<b.maxX-.4&&z>b.minZ+.4&&z<b.maxZ-.4&&!world.colliders.some(c=>x>c.minX-.34&&x<c.maxX+.34&&z>c.minZ-.34&&z<c.maxZ+.34);}
function walk(dt){
  const forward=Number(keys.has('w')||keys.has('arrowup')||touchMove.has('forward'))-Number(keys.has('s')||keys.has('arrowdown')||touchMove.has('back'));
  const side=Number(keys.has('d')||keys.has('arrowright')||touchMove.has('right'))-Number(keys.has('a')||keys.has('arrowleft')||touchMove.has('left'));
  targetYaw+=(Number(keys.has('q'))-Number(keys.has('e')))*dt*1.25;
  const length=Math.hypot(forward,side)||1,speed=keys.has('shift')?7.1:4.25;
  const vx=(-Math.sin(yaw)*forward+Math.cos(yaw)*side)/length*speed,vz=(-Math.cos(yaw)*forward-Math.sin(yaw)*side)/length*speed;
  velocity.x=THREE.MathUtils.damp(velocity.x,vx,12,dt);velocity.y=THREE.MathUtils.damp(velocity.y,vz,12,dt);
  const steps=Math.max(1,Math.ceil(dt/.016));for(let i=0;i<steps;i++){const x=camera.position.x+velocity.x*dt/steps,z=camera.position.z+velocity.y*dt/steps;if(canMove(x,camera.position.z))camera.position.x=x;else velocity.x=0;if(canMove(camera.position.x,z))camera.position.z=z;else velocity.y=0;}
  camera.position.y=1.72;
  yaw=THREE.MathUtils.damp(yaw,targetYaw,22,dt);pitch=THREE.MathUtils.damp(pitch,targetPitch,22,dt);camera.rotation.set(pitch,yaw,0,'YXZ');
}
// Authored stop-to-stop route follows the same promenade and open entrances as walking.
const route=[];
for(const [x,z,look] of [[38,39,[-21,8,-9]],[38,26,[-21,8,-9]],[-20,28,[-25,8,-17]],[-20,20,[-25,8,-17]],[-20,28,[-77,6,0]],[-77,23,[-77,8,0]],[-77,6,[-77,4,-5]],[-77,23,[-120,22,-15]],[38,26,[70,9,0]],[92,26,[107,6,0]],[107,26,[107,6,0]],[107,11,[107,5,-1]],[107,26,[126,1,42]],[90,26,[104,18,-34]],[90,-12,[104,13,-34]]]){
 const prev=route.at(-1);route.push({x,z,look,t:prev?prev.t+Math.hypot(x-prev.x,z-prev.z)/5.5+2:0});
}
function guided(dt){
  tourTime=Math.min(route.at(-1).t,tourTime+dt);let i=0;while(i<route.length-2&&tourTime>route[i+1].t)i++;
  const a=route[i],b=route[i+1],u=THREE.MathUtils.smoothstep(tourTime,a.t,b.t);
  camera.position.set(THREE.MathUtils.lerp(a.x,b.x,u),1.72,THREE.MathUtils.lerp(a.z,b.z,u));
  tmpLook.fromArray(a.look).lerp(new THREE.Vector3(...b.look),u);camera.lookAt(tmpLook);yaw=targetYaw=camera.rotation.y;pitch=targetPitch=camera.rotation.x;
  if(tourTime>=route.at(-1).t&&!tourDone){tourDone=true;mode='walk';syncUI();announce('You have reached the dormitory arcade. Keep exploring or choose another landmark.',true);}
}
function updatePlace(){const p=camera.position;let nearest=activePlace,best=Infinity;for(const [id,s]of Object.entries(places)){const d=Math.hypot(p.x-s.position[0],p.z-s.position[2]);if(d<best){nearest=id;best=d;}}locationUI(nearest);}

let frameCount=0,frameMs=[];
function render(now){
  const rawMs=now-lastTime,dt=Math.min(rawMs/1000,.05);lastTime=now;if(!renderer)return;
  if(!ready){renderer.clear();requestAnimationFrame(render);return;}
  if(ready&&!shotPaused){elapsed+=dt;previousPos.copy(camera.position);if(!paused&&mode!=='welcome'){if(mode==='tour')guided(dt);else walk(dt);audio.step(camera.position.distanceTo(previousPos));updatePlace();}world.update(paused?0:dt,elapsed,camera.position);audio.pause(paused);}
  renderer.info.reset();renderer.render(scene,camera);if(frameCount++%2===0){frameMs.push(rawMs);if(frameMs.length>240)frameMs.shift();}requestAnimationFrame(render);
}
async function init(){
  try{
    renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;applyQuality();requestAnimationFrame(render);
    world=await createWorld(scene,renderer,(message,progress)=>{if(typeof message==='string')$('loading-text').textContent=message;const fraction=typeof progress==='number'?progress:typeof message==='number'?message:.1;$('loading-bar').style.transform=`scaleX(${THREE.MathUtils.clamp(fraction,.08,1)})`;});
    $('loading-text').textContent='Finishing the daylight and materials';await renderer.compileAsync(scene,camera);renderer.render(scene,camera);
    renderer.info.autoReset=false;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;ready=true;$('loading-bar').style.transform='scaleX(1)';$('loading').hidden=true;$('start-tour').disabled=false;$('start-walk').disabled=false;$('start-tour').textContent=reduced?'Begin your visit':'Take the guided visit';syncUI();
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();paused=true;announce('The graphics connection was interrupted. Reload the visit to recover.',true);$('load-error').hidden=false;$('welcome').hidden=false;});
    if(new URLSearchParams(location.search).has('debug'))installDiagnostics();
  }catch(error){console.error('Campus visit could not initialize',error);$('loading').hidden=true;$('load-error').hidden=false;$('start-tour').hidden=true;$('start-walk').hidden=true;}
}
function installDiagnostics(){
  window.__THREE_GAME_DIAGNOSTICS__={renderer:renderer.info,get state(){return{ready,mode,paused,activePlace,audio:{on:audio.on,contextState:audio.context?.state??"closed",sources:audio.sources.size+(audio.wind?1:0),gain:audio.master?.gain.value??0},position:camera.position.toArray(),tourTime,quality,world:world.diagnostics||null,frameTimeMs:frameMs.length?frameMs.reduce((a,b)=>a+b,0)/frameMs.length:null,physics:{engine:'custom bounded walk',timestep:'substeps <= 16ms',ccdBodies:0}};}};
  window.__THREE_GAME_TEST_HOOKS__={
    async setState(name){if(!['welcome',...placeOrder,'settings'].includes(name))throw new Error(`Unknown state: ${name}`);dialogs.forEach(d=>d.close());clearInput();shotPaused=false;paused=false;elapsed=0;if(name==='welcome'){mode='welcome';overview();syncUI();}else{await visit(name==='settings'?'plaza':name,{instant:true});if(name==='settings')openDialog('settings-dialog');}$('visit-status').hidden=true;world.update(.1,0,camera.position);renderer.info.reset();renderer.render(scene,camera);return{state:name};},
    setPausedForScreenshot(value){shotPaused=Boolean(value);clearInput();},setReducedMotion(value){reduced=Boolean(value);$('reduced-motion').checked=reduced;syncUI();}
  };
}
init();


