// Physical students share the campus collision map. The Listener alone can phase through walls.
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const wrap=n=>Math.atan2(Math.sin(n),Math.cos(n));
import {CAMPUS} from '../../shared/campus-layout.js';
const SPAWNS=CAMPUS.zombieSpawns;

export class Navigation {
  constructor(world){
    this.world=world;this.cell=1;this.x0=Math.ceil(world.bounds.minX+1);this.z0=Math.ceil(world.bounds.minZ+1);
    this.width=Math.floor(world.bounds.maxX-this.x0);this.height=Math.floor(world.bounds.maxZ-this.z0);
    this.walkable=new Uint8Array(this.width*this.height);
    for(let i=0;i<this.walkable.length;i++){const p=this.point(i);this.walkable[i]=!this.blocked(p.x,p.z);}
  }
  blocked(x,z){const b=this.world.bounds;return x<b.minX+.4||x>b.maxX-.4||z<b.minZ+.4||z>b.maxZ-.4||this.world.colliders.some(c=>x>c.minX-.34&&x<c.maxX+.34&&z>c.minZ-.34&&z<c.maxZ+.34);}
  point(i){return {x:this.x0+i%this.width,z:this.z0+Math.floor(i/this.width)};}
  index(p){return clamp(Math.round(p.z-this.z0),0,this.height-1)*this.width+clamp(Math.round(p.x-this.x0),0,this.width-1);}
  clear(a,b){const d=dist(a,b),n=Math.ceil(d/.3);for(let i=1;i<=n;i++)if(this.blocked(a.x+(b.x-a.x)*i/n,a.z+(b.z-a.z)*i/n))return false;return true;}
  nearest(p){let id=this.index(p);if(this.walkable[id])return id;let best=-1,score=Infinity;const center=this.point(id);for(let z=-3;z<=3;z++)for(let x=-3;x<=3;x++){const v={x:center.x+x,z:center.z+z},j=this.index(v),d=dist(p,v);if(this.walkable[j]&&d<score){score=d;best=j;}}return best;}
  route(a,b){
    if(this.clear(a,b))return [{x:b.x,z:b.z}];
    const start=this.nearest(a),goal=this.nearest(b);if(start<0||goal<0)return [];
    const costs=new Map([[start,0]]),parents=new Map(),closed=new Set(),heap=[];
    const push=(id,f)=>{let i=heap.length;heap.push({id,f});while(i){const p=(i-1)>>1;if(heap[p].f<=f)break;heap[i]=heap[p];i=p;}heap[i]={id,f};};
    const pop=()=>{const first=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let j=i*2+1;if(j+1<heap.length&&heap[j+1].f<heap[j].f)j++;if(heap[j].f>=last.f)break;heap[i]=heap[j];i=j;}heap[i]=last;}return first.id;};
    const end=this.point(goal);push(start,dist(a,end));let found=false;
    for(let budget=0;heap.length&&budget<18000;budget++){
      const id=pop();if(closed.has(id))continue;if(id===goal){found=true;break;}closed.add(id);
      const x=id%this.width,z=Math.floor(id/this.width);
      for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){
        if(x+dx<0||x+dx>=this.width||z+dz<0||z+dz>=this.height)continue;
        const j=id+dx+dz*this.width;if(!this.walkable[j]||closed.has(j))continue;
        if(dx&&dz&&(!this.walkable[id+dx]||!this.walkable[id+dz*this.width]))continue;
        const cost=costs.get(id)+(dx&&dz?1.4142:1);if(cost>=(costs.get(j)??Infinity))continue;
        costs.set(j,cost);parents.set(j,id);push(j,cost+dist(this.point(j),end));
      }
    }
    if(!found)return [];
    const points=[];let id=goal;while(id!==start){points.push(this.point(id));id=parents.get(id);if(id===undefined)return [];}
    points.reverse();if(points.length&&this.clear(points.at(-1),b))points.push({x:b.x,z:b.z});return points;
  }
}

export class ZombieSystem {
  constructor(game){this.g=game;this.nav=new Navigation(game.world);this.reset();}
  reset(){this.g.zombies=SPAWNS.map(([x,z],id)=>({id,x,z,yaw:Math.PI,home:{x,z},mode:'idle',phase:0,downTime:0,hitFlash:0,walkPhase:id,clock:0,cooldown:0,escapeClock:0,hiddenClock:0,repath:0,path:[],rest:0}));}
  shove(z,dx,dz){if(!this.nav.blocked(z.x+dx,z.z))z.x+=dx;if(!this.nav.blocked(z.x,z.z+dz))z.z+=dz;}
  kick(){
    const g=this.g,p=g.player;let hits=0;
    for(const z of g.zombies){
      if(z.mode==='down'||z.mode==='rising'||dist(p,z)>2.55)continue;
      const direction=Math.atan2(p.x-z.x,p.z-z.z);
      if(Math.cos(wrap(direction-p.yaw))<.45||!this.nav.clear(p,z))continue;
      z.mode='down';z.downTime=8;z.phase=0;z.clock=0;z.hitFlash=.32;z.path=[];
      const length=Math.max(.1,dist(p,z));this.shove(z,(z.x-p.x)/length*.55,(z.z-p.z)/length*.55);
      hits++;g.combat.knockdowns++;g.emit('zombie-down',z.id);
    }
    if(hits)g.say('Scattered. Their limbs are crawling back — make distance!',4);
    return hits;
  }
  step(dt){
    const g=this.g,p=g.player;
    for(const z of g.zombies){
      z.clock+=dt;z.cooldown=Math.max(0,z.cooldown-dt);z.rest=Math.max(0,z.rest-dt);z.hitFlash=Math.max(0,z.hitFlash-dt);z.repath-=dt;
      if(z.mode==='down'){
        z.downTime=Math.max(0,z.downTime-dt);z.phase=Math.min(1,z.clock/.42);
        if(z.clock>=1.4&&z.clock-dt<1.4)g.emit('zombie-reform',z.id);
        if(z.downTime<=0){z.mode='rising';z.clock=0;z.phase=0;}continue;
      }
      if(z.mode==='rising'){
        z.phase=Math.min(1,z.clock/1.4);if(z.phase>=1){z.mode='idle';z.rest=.6;z.clock=0;z.repath=0;}continue;
      }
      const d=dist(p,z),sight=d<24&&this.nav.clear(z,p);
      if(z.mode==='windup'){
        z.phase=Math.min(1,z.clock/.52);z.yaw=Math.atan2(p.x-z.x,p.z-z.z);
        if(g.safe||d>1.65||!sight){z.mode='chasing';z.cooldown=.65;z.clock=0;continue;}
        if(z.phase>=1){
          if(g.biteCooldown<=0){g.health=Math.max(0,g.health-18);g.biteCooldown=1.4;g.biteFlash=.9;g.lastBite=g.time;g.combat.bites++;g.emit('bite',18);g.say('Bitten · −18 blood. Space to kick. Shift to outrun.',3.3);}
          z.mode='cooldown';z.clock=0;z.phase=0;z.cooldown=1.8;
        }continue;
      }
      if(z.mode==='cooldown'){z.phase=Math.min(1,z.clock/.55);if(z.clock>.55){z.mode='chasing';z.clock=0;}continue;}
      if(z.mode==='idle'&&z.rest<=0&&!g.safe&&sight&&d<(g.running?22:14)){
        z.mode='chasing';z.clock=0;z.repath=0;z.escapeClock=0;z.hiddenClock=0;g.combat.chases++;
        if(g.time-g.lastAlert>2){g.emit('zombie-alert');g.lastAlert=g.time;g.say('Footsteps behind you. Space kicks; Shift makes distance.',3.2);}
      }
      if(z.mode==='chasing'){
        z.hiddenClock=sight?0:z.hiddenClock+dt;
        z.escapeClock=(d>19||g.safe)?z.escapeClock+dt:0;
        if(z.escapeClock>2.1||z.hiddenClock>7){
          z.mode='idle';z.rest=4;z.clock=0;z.path=[];z.repath=0;g.combat.escapes++;
          if(!g.zombies.some(v=>v!==z&&(v.mode==='chasing'||v.mode==='windup'))){g.emit('escape');g.say('You lost them. Stay quiet, or catch your breath by a lantern.',3);}
        }else if(d<1.22&&sight&&!g.safe&&z.cooldown<=0){z.mode='windup';z.clock=0;z.phase=0;continue;}
      }
      const chasing=z.mode==='chasing';
      // Keep contact spacing while a bite cools down instead of walking through the camera.
      if(chasing&&sight&&d<=1.16)continue;
      // Amber light is a sanctuary. Students linger at its edge before losing interest.
      if(chasing&&g.safe&&d<8)continue;
      const target=chasing?p:z.home;
      if(!chasing&&dist(z,target)<.6){z.walkPhase+=dt*.1;continue;}
      if(z.repath<=0){z.repath=.65+z.id*.06;z.path=this.nav.route(z,target);}
      while(z.path.length>1&&dist(z,z.path[0])<.45)z.path.shift();
      const waypoint=z.path[0];if(!waypoint)continue;
      const dx=waypoint.x-z.x,dz=waypoint.z-z.z,length=Math.hypot(dx,dz);
      if(length<.15){z.path.shift();continue;}
      const speed=chasing?3.3+(z.id%3)*.12:1.15,step=Math.min(length,speed*dt,chasing&&sight?Math.max(0,d-1.16):Infinity);
      this.shove(z,dx/length*step,dz/length*step);
      z.yaw+=wrap(Math.atan2(dx,dz)-z.yaw)*Math.min(1,dt*8);z.walkPhase+=step*(chasing?4.5:4);
    }
    g.chasers=g.zombies.filter(z=>['chasing','windup','cooldown'].includes(z.mode)).length;
  }
}
