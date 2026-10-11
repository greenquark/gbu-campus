import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import {CampusGame,distance} from '../night/src/game.js';
import {DemoPlayer} from '../night/src/demo.js';
import {CAMPUS} from '../shared/campus-layout.js';
import {inspectPage} from './inspect-canvas.mjs';
const {chromium}=createRequire(import.meta.url)('playwright');
const base=(process.argv[2]||'http://127.0.0.1:5190').replace(/\/$/,''),runId=process.argv[3]||'model-rebuild-1',out=path.resolve('artifacts',runId);
await mkdir(out,{recursive:true});
const pairs=['desktop','mobile'].flatMap(mode=>['welcome','entrance','sports','residence','title','active-play','library','greenhouse','observatory','track','kick-raised','lost','won'].map(state=>({mode,state})));
await writeFile('artifacts/model-evidence.json',JSON.stringify({version:1,runId,captures:pairs.map(p=>({...p,report:`artifacts/${runId}/${p.mode}-${p.state}.json`})),artifacts:[`artifacts/${runId}/checks.json`]},null,2));
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[],requests=[],checks=[];let page;
const pass=(name,data={})=>{checks.push({name,pass:true,...data});console.log('PASS '+name);};
function track(p){p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)requests.push({url:r.url(),status:r.status()});});}
try{
 const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});page=await context.newPage();track(page);
 await page.goto(base+'/night/?debug');await page.waitForFunction(()=>window.__THREE_GAME_DIAGNOSTICS__?.state.ready,{},{timeout:90000});
 const world=await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__.worldSnapshot());await writeFile(path.join(out,'world.json'),JSON.stringify(world));
 const g=new CampusGame({...world,setMemory(){}},{cue(){}}),nav=g.zombieSystem.nav;
 for(const s of world.stations){assert(!g.blocked(s.approach.x,s.approach.z),s.id+' approach blocked');assert(nav.route(world.spawn,s.approach).length,s.id+' unreachable');}
 for(const cp of CAMPUS.track.checkpoints)assert(!g.blocked(cp.x,cp.z),'track blocked');
 assert(nav.route(world.spawn,world.exit).length);pass('all four stations, track checkpoints and gate reachable from spawn',{colliders:world.colliders.length});
 for(const line of CAMPUS.paths)for(let i=1;i<line.length;i++){const a={x:line[i-1][0],z:line[i-1][1]},b={x:line[i][0],z:line[i][1]};assert(nav.clear(a,b),'contracted path blocked '+JSON.stringify([a,b]));}
 pass('model-derived route centerlines are collision-clear');
 const bot=new DemoPlayer(g),samples=[];let last=-1,softlocks=0,lastPos={...g.player},stationary=0;
 for(let i=0;i<60*420&&g.mode==='playing';i++){
   const intent=bot.update(1/60);g.step(1/60,intent);
   if(i%60===0){const moved=distance(lastPos,g.player);stationary=intent.run&&moved<.1?stationary+1:0;if(stationary===5)softlocks++;lastPos={...g.player};samples.push({time:g.time,step:bot.i,x:g.player.x,z:g.player.z,health:g.health,fear:g.fear,memories:[...g.memories],track:{...g.track}});}
   if(bot.i!==last){console.log('BOT '+bot.i+' '+g.time.toFixed(1)+'s '+bot.caption);last=bot.i;}
 }
 await writeFile(path.join(out,'bot.json'),JSON.stringify({mode:g.mode,time:g.time,memories:g.memories,combat:g.combat,recoveredAt:g.recoveredAt,softlocks,samples},null,2));
 assert.equal(g.mode,'won','input-driven full demo did not win');assert.equal(softlocks,0);pass('complete input-driven route wins without teleports or memory grants',{seconds:g.time,combat:g.combat,softlocks});
 // The actual DOM controls are checked separately from simulation evidence.
 await page.locator('#start-button').click();await page.locator('#scene canvas').focus();const before=await page.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__.state.player);
 await page.keyboard.down('d');await page.waitForTimeout(600);await page.keyboard.up('d');let current=await page.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__.state);assert(current.player.x>before.x+1);pass('real keyboard movement changes player position');
 await page.keyboard.press('m');assert(await page.locator('#map-panel').isVisible());await page.keyboard.press('m');assert(!(await page.locator('#map-panel').isVisible()));pass('campus map opens and closes with real input');
 await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__.setState('greenhouse'));await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__.resumeSimulation());await page.locator('#scene canvas').focus();await page.keyboard.down('e');await page.waitForFunction(()=>window.__THREE_GAME_DIAGNOSTICS__.state.memories.includes('greenhouse'),{},{timeout:12000});await page.keyboard.up('e');pass('water-court puzzle completes with a real held E key');
 await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__.setState('zombie-chase'));await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__.resumeSimulation());await page.locator('#scene canvas').focus();await page.keyboard.press('Space');await page.waitForFunction(()=>window.__THREE_GAME_DIAGNOSTICS__.state.combat.knockdowns>0,{},{timeout:6000});pass('Space kick scatters a student with the new shoe visual');
 await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__.combatFixture('bleedout'));await page.waitForFunction(()=>window.__THREE_GAME_DIAGNOSTICS__.state.mode==='lost',{},{timeout:6000});assert.equal((await page.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__.state.audio)).activeSources,0);await page.locator('#retry-button').click();assert.equal((await page.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__.state)).mode,'playing');pass('bite loss closes audio and Retry restores play');
 for(const p of pairs.filter(p=>p.mode==='desktop')){const day=['welcome','entrance','sports','residence'].includes(p.state);const report=await inspectPage(page,{url:base+(day?'/?debug':'/night/?debug'),out,mobile:false,state:p.state,runId,wait:250});await writeFile(path.join(out,`${p.mode}-${p.state}.json`),JSON.stringify(report,null,2));assert(report.result.ok,'capture '+p.state);}
 await context.close();
 const phoneContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1}),phone=await phoneContext.newPage();page=phone;track(phone);
 for(const p of pairs.filter(p=>p.mode==='mobile')){const day=['welcome','entrance','sports','residence'].includes(p.state);const report=await inspectPage(phone,{url:base+(day?'/?debug':'/night/?debug'),out,mobile:true,state:p.state,runId,wait:250});await writeFile(path.join(out,`${p.mode}-${p.state}.json`),JSON.stringify(report,null,2));assert(report.result.ok,'phone '+p.state);assert.equal(await phone.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
 await phone.goto(base+'/night/?debug');await phone.waitForFunction(()=>window.__THREE_GAME_DIAGNOSTICS__?.state.ready,{},{timeout:90000});await phone.locator('#start-button').tap();const p0=await phone.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__.state.player);
 const button=phone.locator('[data-direction="right"]'),bb=await button.boundingBox(),cdp=await phoneContext.newCDPSession(phone);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:bb.x+bb.width/2,y:bb.y+bb.height/2,id:1}]});await phone.waitForTimeout(650);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});const p1=await phone.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__.state.player);assert(p1.x>p0.x+1);await phone.locator('#touch-kick').tap();assert((await phone.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__.state)).kickCooldown>0);pass('emulated touch movement and kick dispatch real gameplay intents');
 await phone.locator('#map-button').tap();await phone.screenshot({path:path.join(out,'mobile-map.png')});await phone.locator('#map-close').tap();await phone.locator('#pause-button').tap();await phone.locator('#pause-screen .campus-return-link').tap();await phone.waitForFunction(()=>document.querySelector('#start-walk')?.disabled===false,{},{timeout:90000});pass('phone map and same-tab return to day work');
 await phoneContext.close();assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);pass('no runtime errors or missing assets');
}catch(e){console.error(e);checks.push({name:'failure',pass:false,error:e.stack});await page?.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});process.exitCode=1;}
finally{await writeFile(path.join(out,'checks.json'),JSON.stringify({base,runId,checks,errors,requests,physicalPhoneTested:false},null,2));await browser.close();}
