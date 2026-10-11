// Gameplay uses a bounded 60Hz step. All positions are metres on a flat walkable campus.
import {ZombieSystem} from './zombies.js';
import {CAMPUS,MEMORY_TITLES} from '../../shared/campus-layout.js';
export const TITLES = MEMORY_TITLES;
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function angleTo(a,b){return Math.atan2(a.x-b.x,a.z-b.z);}
export function wrap(a){return Math.atan2(Math.sin(a),Math.cos(a));}
export class CampusGame {
  constructor(world,audio){this.world=world;this.audio=audio;this.events=[];this.reset();}
  reset(keep=false){
    const saved=keep?this.memories:[];
    this.mode='playing';this.time=0;this.player={...this.world.spawn,pitch:0};this.velocity={x:0,z:0};
    this.memories=saved||[];this.battery=100;this.fear=0;this.noise=0;this.torch=true;this.safe=false;
    this.progress=0;this.focus=null;this.ritualId=null;this.starArmed=false;this.starCharge=0;this.interactQueued=false;
    this.notes=[];this.noteClock=-1;this.playedNote=-1;this.sequence=[3,1,2];this.exitProgress=0;
    this.track={active:false,next:0,timeLeft:0,total:CAMPUS.track.checkpoints.length,done:this.memories.includes('observatory')};
    this.decoyCooldown=0;this.decoy=null;this.message='Lanterns restore your light and composure.';this.messageUntil=8;
    this.ghost={x:15,z:26,yaw:0,mode:'dormant',target:{x:15,z:26},alert:0,visible:false,stun:0};
    this.patrol=0;this.nearMisses=0;this.wasDanger=false;this.stepClock=0;this.lastInteract=false;this.steps=0;
    this.recoveredAt=[];this.moving=false;this.running=false;this.events=[];
    this.health=100;this.biteFlash=0;this.biteCooldown=0;this.lastBite=-99;this.lastAlert=-99;
    this.kickTime=0;this.kickImpact=0;this.kickCooldown=0;this.kickQueued=false;this.chasers=0;this.combat={bites:0,kicks:0,knockdowns:0,escapes:0,chases:0};
    if(this.zombieSystem)this.zombieSystem.reset();else this.zombieSystem=new ZombieSystem(this);
    for(const s of this.world.stations)this.world.setMemory(s.id,this.memories.includes(s.id));
  }
  say(text,seconds=5){this.message=text;this.messageUntil=this.time+seconds;}
  emit(name,value){this.audio.cue(name,value);this.events.push({name,value,time:this.time});if(this.events.length>600)this.events.shift();}
  toggleTorch(){if(this.mode==='playing'){this.torch=!this.torch&&this.battery>0;this.emit('switch');}}
  pressInteract(){if(this.mode==='playing')this.interactQueued=true;}
  pressKick(){if(this.mode==='playing'&&this.kickCooldown<=0)this.kickQueued=true;}
  ringBell(){
    if(this.mode!=='playing'||this.decoyCooldown>0)return;
    // Toss it behind your shoulder. Its sound has a real world position.
    const b=this.world.bounds;
    this.decoy={x:clamp(this.player.x+Math.sin(this.player.yaw)*12,b.minX+2,b.maxX-2),z:clamp(this.player.z+Math.cos(this.player.yaw)*12,b.minZ+2,b.maxZ-2),life:8};
    this.decoyCooldown=13;this.emit('bell');this.say('A borrowed bell. Keep moving while it listens.',4);
  }
  note(n){
    if(this.mode!=='playing'||this.focus?.id!=='residence'||this.noteClock<1.9||this.memories.includes('residence'))return;
    this.emit('note',n);this.notes.push(n);
    if(this.sequence[this.notes.length-1]!==n){this.notes=[];this.noteClock=-1;this.say('The echo breaks. Hold E to hear the notes again.',4);return;}
    if(this.notes.length===3)this.collect('residence');
  }
  collect(id){
    if(this.memories.includes(id))return;
    this.memories.push(id);this.recoveredAt.push({id,time:this.time});this.world.setMemory(id,true);
    this.progress=0;this.fear=Math.max(0,this.fear-25);this.battery=Math.min(100,this.battery+20);
    this.emit('collect',this.memories.length);this.say(`${TITLES[id]} — remembered. ${4-this.memories.length?`${4-this.memories.length} remain.`:'Return to the plaza gate.'}`,6);
    this.ghost.target={x:this.player.x,z:this.player.z};this.ghost.alert=8;
  }
  blocked(x,z,r=.34){return this.world.colliders.some(c=>x>c.minX-r&&x<c.maxX+r&&z>c.minZ-r&&z<c.maxZ+r);}
  move(dx,dz){
    const b=this.world.bounds,p=this.player;
    const nx=clamp(p.x+dx,b.minX+.4,b.maxX-.4),nz=clamp(p.z+dz,b.minZ+.4,b.maxZ-.4);
    if(!this.blocked(nx,p.z))p.x=nx;if(!this.blocked(p.x,nz))p.z=nz;
  }
  step(dt,input){
    if(this.mode!=='playing')return;
    this.time+=dt;this.steps++;const p=this.player,g=this.ghost;
    const axis=Math.hypot(input.x,input.z),norm=Math.max(1,axis),speed=input.run?7.1:4.25;
    const vx=(Math.cos(p.yaw)*input.x-Math.sin(p.yaw)*input.z)/norm*speed;
    const vz=(-Math.sin(p.yaw)*input.x-Math.cos(p.yaw)*input.z)/norm*speed;
    const ease=1-Math.exp(-18*dt);this.velocity.x+=(vx-this.velocity.x)*ease;this.velocity.z+=(vz-this.velocity.z)*ease;
    const oldX=p.x,oldZ=p.z;this.move(this.velocity.x*dt,this.velocity.z*dt);
    const travelled=Math.hypot(p.x-oldX,p.z-oldZ);this.moving=travelled>dt*.5;this.running=this.moving&&input.run;
    this.noise+=( (this.running?1:this.moving?.22:.015)-this.noise)*(1-Math.exp(-7*dt));
    this.safe=this.world.safeZones.some(s=>distance(s,p)<s.r);
    this.biteFlash=Math.max(0,this.biteFlash-dt);this.biteCooldown=Math.max(0,this.biteCooldown-dt);this.kickImpact=Math.max(0,this.kickImpact-dt);
    this.kickCooldown=Math.max(0,this.kickCooldown-dt);const previousKick=this.kickTime;this.kickTime=Math.max(0,this.kickTime-dt);
    if(this.kickQueued&&this.kickCooldown<=0){this.kickTime=.78;this.kickCooldown=1.05;this.combat.kicks++;this.emit('kick');}
    this.kickQueued=false;
    if(previousKick>.50&&this.kickTime<=.50&&this.zombieSystem.kick())this.kickImpact=.32;
    if(this.safe&&this.time-this.lastBite>6)this.health=Math.min(100,this.health+4*dt);
    this.battery=clamp(this.battery+(this.safe?18:this.torch?-1.25:.16)*dt,0,100);
    if(this.battery===0)this.torch=false;
    this.decoyCooldown=Math.max(0,this.decoyCooldown-dt);if(this.decoy){this.decoy.life-=dt;if(this.decoy.life<=0)this.decoy=null;}
    this.stepClock+=travelled;if(this.stepClock>2.1){this.emit('step',this.running?1:.6);this.stepClock=0;}
    this.updateGhost(dt);
    this.zombieSystem.step(dt);
    this.updateTrack(dt);
    this.updateRitual(dt,input);
    this.interactQueued=false;
    if(this.health<=0||this.fear>=100){this.mode='lost';this.emit('fail');this.say(this.health<=0?'The students caught you. Your recovered memories are safe.':'The Listener found your footsteps. Your recovered memories are safe.',99);}
    if(this.messageUntil<this.time)this.message='';
    this.lastInteract=input.interact;
  }
  updateGhost(dt){
    const p=this.player,g=this.ghost,d=distance(p,g);
    if(this.time<12){g.visible=false;return;}g.visible=true;
    const patrolPoints=CAMPUS.ghostPatrol;
    g.alert=Math.max(0,g.alert-dt);
    const inBeam=this.torch&&this.battery>0&&d<14&&Math.cos(wrap(angleTo(p,g)-p.yaw))>.89;
    if(this.decoy){g.target=this.decoy;g.mode='listening';g.alert=3;}
    else if(!this.safe&&(d<6.5||this.noise>.65&&d<43||this.noise>.12&&d<14)){
      g.target={x:p.x,z:p.z};g.alert=6;g.mode='hunting';
    }else if(g.alert<=0){g.mode='wandering';if(distance(g,patrolPoints[this.patrol])<2)this.patrol=(this.patrol+1)%patrolPoints.length;g.target=patrolPoints[this.patrol];}
    let tx=g.target.x-g.x,tz=g.target.z-g.z,len=Math.hypot(tx,tz);
    if(this.safe&&d<10){tx=g.x-p.x;tz=g.z-p.z;len=Math.hypot(tx,tz);g.mode='repelled';}
    const speed=inBeam?.12:g.mode==='hunting'?3.35:2.05;
    if(inBeam){g.mode='held by light';g.stun=Math.min(1,g.stun+dt*3);}else g.stun=Math.max(0,g.stun-dt*2);
    if(len>.8){g.x+=tx/len*speed*dt;g.z+=tz/len*speed*dt;g.yaw=Math.atan2(tx,tz);}
    const danger=!this.safe&&d<9;
    if(danger&&!this.wasDanger){this.nearMisses++;this.emit('warning');this.say('The Listener is close. Face it with your light, or reach a lantern.',4);}
    this.wasDanger=danger;
    const gain=this.safe?-24:inBeam?-6:d<2.8?42:d<6?12:d<10?3:-4;
    this.fear=clamp(this.fear+gain*dt,0,100);
  }
  updateTrack(dt){
    const t=this.track;if(!t.active)return;
    t.timeLeft=Math.max(0,t.timeLeft-dt);
    if(t.timeLeft===0){t.active=false;t.next=0;this.say('The lap faded. Return to the sports hall and hold E to try again.',6);return;}
    if(distance(this.player,CAMPUS.track.checkpoints[t.next])<3){
      t.next++;this.emit('note',(t.next-1)%3+1);
      if(t.next===t.total){t.active=false;t.done=true;this.say('Lap complete. Return to the sports hall and hold E to recover its memory.',7);}
      else this.say(`Checkpoint ${t.next} / ${t.total}. Follow the next blue beacon.`,3);
    }
  }
  navigation(){
    if(this.track.active){const target=CAMPUS.track.checkpoints[this.track.next];return {label:`Track beacon ${this.track.next+1} / ${this.track.total}`,distance:Math.round(distance(this.player,target)),target};}
    const remaining=this.world.stations.filter(s=>!this.memories.includes(s.id));
    const target=remaining.sort((a,b)=>distance(this.player,a.position)-distance(this.player,b.position))[0];
    return target?{label:target.title,distance:Math.round(distance(this.player,target.position)),target:target.position}:{label:'Plaza gate',distance:Math.round(distance(this.player,this.world.exit)),target:this.world.exit};
  }
  updateRitual(dt,input){
    const s=this.world.stations.find(s=>distance(this.player,s.position)<3.9),held=input.interact,still=!this.moving;
    this.focus=null;
    if(distance(this.player,this.world.exit)<4){
      const done=this.memories.length===4;
      this.exitProgress=done&&held?Math.min(1,this.exitProgress+dt/2.5):Math.max(0,this.exitProgress-dt);
      this.focus={id:'gate',title:'The plaza gate',instruction:done?'Hold E · Return the four memories and leave.':`${4-this.memories.length} memories are still waiting. M shows the campus routes.`,progress:this.exitProgress};
      if(this.exitProgress>=1){this.mode='won';this.emit('win');}return;
    }
    if(!s){this.progress=Math.max(0,this.progress-dt*.8);this.ritualId=null;return;}
    if(this.ritualId!==s.id){this.progress=0;this.ritualId=s.id;this.starArmed=false;this.starCharge=0;this.notes=[];this.noteClock=-1;this.playedNote=-1;}
    if(this.memories.includes(s.id)){this.focus={id:s.id,title:TITLES[s.id],instruction:'This memory is safe. Follow the next thread.',progress:1};return;}
    let instruction='',valid=false,duration=3;
    const looking=Math.cos(wrap(angleTo(this.player,s.position)-this.player.yaw))>.7;
    if(s.id==='library'){instruction='F · Light off. Stand still and hold E to hear the corridor whisper.';valid=held&&!this.torch&&still;duration=3.2;}
    if(s.id==='greenhouse'){instruction='F · Light on. Face the water-court marker, stand still and hold E to restore its reflection.';valid=held&&this.torch&&looking&&still;duration=3.5;}
    if(s.id==='observatory'){
      if(this.track.done){instruction='Lap restored. Hold E to recover the final lap.';valid=held;duration=2;}
      else if(this.track.active)instruction=`Reach the blue track beacons in order. ${Math.ceil(this.track.timeLeft)} seconds remain.`;
      else {instruction='Hold E to start the final lap. Reach four blue track beacons in 30 seconds, then return here.';if(held){this.track.active=true;this.track.next=0;this.track.timeLeft=30;this.emit('bell');this.say('Final lap started. Follow the blue beacons. Shift to sprint; M shows your route.',7);}}
    }
    if(s.id==='residence'){
      instruction=this.noteClock<0?'Hold E to hear the room’s three-note memory. Then repeat it with 1 · 2 · 3.':this.noteClock<1.9?'Listen and watch…':'Repeat the three notes using 1 · 2 · 3. E plays them again.';
      if((held&&!this.lastInteract||this.interactQueued)&&(this.noteClock<0||this.noteClock>1.9)){this.noteClock=0;this.notes=[];this.playedNote=-1;}
      if(this.noteClock>=0){this.noteClock+=dt;const i=Math.floor(this.noteClock/.55);if(i<3&&i!==this.playedNote){this.emit('note',this.sequence[i]);this.playedNote=i;}if(this.noteClock<1.65)instruction=`The room sings: ${['','I','II','III'][this.sequence[Math.min(2,i)]]}`;}
      this.progress=this.notes.length/3;
    }else this.progress=valid?Math.min(1,this.progress+dt/duration):Math.max(0,this.progress-dt*.22);
    this.focus={id:s.id,title:TITLES[s.id],instruction,progress:this.progress};
    if(this.progress>=1)this.collect(s.id);
  }
}
