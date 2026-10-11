import {angleTo,wrap,distance} from './game.js';
import {CAMPUS} from '../../shared/campus-layout.js';
// Ordinary input driver over the actual collision map. No teleports or objective grants.
export class DemoPlayer{
  constructor(game,{portrait=false}={}){
    this.g=game;this.portrait=portrait;this.i=0;this.clock=0;this.started=false;this.noteIndex=0;this.caption='';this.path=[];
    const move=(x,z,text)=>({kind:'move',x,z,text});
    const ritual=(id,text)=>({kind:'ritual',id,text});
    const rest=(x,z)=>[move(x,z,'Amber lanterns restore blood, battery and composure.'),{kind:'wait',seconds:3,text:'A short rest before the next crossing.'}];
    this.route=[
      {kind:'bite',text:'Missing students patrol the campus. A bite costs blood.'},
      {kind:'kick',text:'Space: push them away with your running shoe. Their limbs slowly reassemble.'},
      ...rest(38,39),move(-20,28,'The water court sits inside the curved building. Follow the front promenade.'),
      move(-20,20,'The curved ribbons embrace the garden. The first memory waits by the water.'),ritual('greenhouse','Face the marker with your light on. Stand still and hold E.'),
      ...rest(-20,28),...rest(-77,23),move(-77,6,'Further west, the teaching block opens beneath horizontal louvers.'),ritual('library','Light off. Stand still and hold E to hear the corridor whisper.'),
      ...rest(-77,23),...rest(38,39),...rest(92,26),move(107,11,'The sports hall is east of the plaza, beside the blue track.'),
      ritual('observatory','Hold E to start the final lap, then run its four blue checkpoints.'),
      ...rest(92,26),move(90,-18,'Use the side lane behind the sports hall to reach the orange dormitory blocks.'),move(103,-19.5,'The dormitory arcade holds a three-note room call.'),
      ritual('residence','Hold E to hear the call. Repeat it with 1, 2 and 3.'),
      ...rest(42,-25),...rest(38,39),move(38,54.5,'Four memories recovered. Return along the flag plaza to the entry gate.'),ritual('gate','Hold E to return the memories and end the night.')
    ];
  }
  next(){this.i++;this.clock=0;this.started=false;this.noteIndex=0;this.path=[];this.pathTarget=null;}
  travel(target,dt,input){
    const g=this.g,key=target.x+','+target.z;
    if(key!==this.pathTarget){this.path=g.zombieSystem.nav.route(g.player,target);this.pathTarget=key;}
    while(this.path.length>1&&distance(g.player,this.path[0])<.65)this.path.shift();
    const waypoint=this.path[0]||target;
    if(distance(g.player,target)<.65)return true;
    const desired=angleTo(g.player,waypoint);g.player.yaw+=wrap(desired-g.player.yaw)*Math.min(1,dt*12);
    g.player.pitch+=(0-g.player.pitch)*Math.min(1,dt*6);
    const dx=waypoint.x-g.player.x,dz=waypoint.z-g.player.z,len=Math.hypot(dx,dz)||1;
    input.x=(Math.cos(g.player.yaw)*dx-Math.sin(g.player.yaw)*dz)/len;
    input.z=(-Math.sin(g.player.yaw)*dx-Math.cos(g.player.yaw)*dz)/len;input.run=true;
    const threat=distance(g.player,g.ghost)<16;
    if(g.torch!==threat&&g.battery>5)g.toggleTorch();
    if(threat&&g.decoyCooldown<=0)g.ringBell();return false;
  }
  update(dt){
    const g=this.g,s=this.route[this.i],input={x:0,z:0,run:false,interact:false};if(!s)return input;
    this.clock+=dt;this.caption=s.text;
    const nearest=g.zombies.filter(z=>z.mode!=='down'&&z.mode!=='rising').sort((a,b)=>distance(g.player,a)-distance(g.player,b))[0];
    if(s.kind==='bite'){
      if(nearest){g.player.yaw+=wrap(angleTo(g.player,nearest)-g.player.yaw)*Math.min(1,dt*7);g.player.pitch=-.08;}
      if(g.combat.bites&&g.time-g.lastBite>.55)this.next();return input;
    }
    if(s.kind==='kick'){
      if(!this.started){
        if(nearest)g.player.yaw+=wrap(angleTo(g.player,nearest)-g.player.yaw)*Math.min(1,dt*12);
        if(nearest&&distance(g.player,nearest)<2.4)g.pressKick();
        if(g.combat.knockdowns){this.started=true;this.clock=0;}
      }else{g.player.pitch+=(-.4-g.player.pitch)*Math.min(1,dt*4);if(this.clock>6.5)this.next();}
      return input;
    }
    if(s.kind==='move'){if(this.travel(s,dt,input))this.next();}
    else if(s.kind==='wait'){if(g.torch)g.toggleTorch();if(this.clock>s.seconds)this.next();}
    else if(s.kind==='ritual'){
      if(s.id==='gate'){input.interact=true;return input;}
      if(g.memories.includes(s.id)){g.ringBell();this.next();return input;}
      const station=g.world.stations.find(v=>v.id===s.id);
      if(s.id==='observatory'&&g.track.active){this.travel(CAMPUS.track.checkpoints[g.track.next],dt,input);this.caption='Final lap: blue beacon '+(g.track.next+1)+' of 4. Sprint to beat the clock.';return input;}
      if(s.id==='observatory'&&distance(g.player,station.approach)>1){this.travel(station.approach,dt,input);return input;}
      const desired=angleTo(g.player,station.position),light=s.id==='greenhouse';
      if(g.torch!==light)g.toggleTorch();g.player.yaw+=wrap(desired-g.player.yaw)*Math.min(1,dt*7);
      if(s.id==='residence'){
        input.interact=g.noteClock<0;
        if(g.noteClock>2.3+this.noteIndex*.7&&this.noteIndex<3){g.note(g.sequence[this.noteIndex]);this.noteIndex++;}
      }else input.interact=true;
      if(distance(g.player,g.ghost)<16&&g.decoyCooldown<=0)g.ringBell();
    }
    if(nearest&&distance(g.player,nearest)<2.15&&g.kickCooldown<=0&&Math.cos(wrap(angleTo(g.player,nearest)-g.player.yaw))>.48)g.pressKick();
    return input;
  }
}
