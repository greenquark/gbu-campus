import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import {CampusGame,distance} from '../night/src/game.js';
import {DemoPlayer} from '../night/src/demo.js';
const {chromium}=createRequire(import.meta.url)('playwright');
const base=(process.argv[2]||'http://127.0.0.1:5190').replace(/\/$/,''),out=path.resolve('artifacts/model-review-final');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),checks=[],errors=[],missing=[],motion=[];
const pass=(name,data={})=>{checks.push({name,pass:true,...data});console.log('PASS '+name);};
let page;
try{
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},deviceScaleFactor:1,isMobile:mobile,hasTouch:mobile});
  page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)missing.push(r.url())});
  await page.goto(base+'/?debug');await page.waitForFunction(()=>window.__THREE_GAME_DIAGNOSTICS__?.state.ready,{},{timeout:90000});
  await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__.setState('residence'));await page.waitForTimeout(300);
  await page.screenshot({path:path.join(out,`${mobile?'mobile':'desktop'}-residence.png`)});
  await page.goto(base+'/night/?debug');await page.waitForFunction(()=>window.__THREE_GAME_DIAGNOSTICS__?.state.ready,{},{timeout:90000});
  if(!mobile){
   const world=await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__.worldSnapshot());
   const g=new CampusGame({...world,setMemory(){}},{cue(){}}),bot=new DemoPlayer(g);let minContact=Infinity;
   assert(!g.blocked(90,-12));assert(g.zombieSystem.nav.clear({x:90,z:26},{x:90,z:-12}));pass('dormitory viewpoint and final guided approach are clear');
   for(let i=0;i<60*420&&g.mode==='playing';i++){g.step(1/60,bot.update(1/60));if(g.time<4&&g.zombies[0].mode!=='down')minContact=Math.min(minContact,distance(g.player,g.zombies[0]));}
   assert.equal(g.mode,'won');assert.equal(g.memories.length,4);assert(minContact>=1.159);pass('full input-driven demo still wins; pursuing student retains contact spacing',{seconds:g.time,combat:g.combat,minContact});
  }
  await page.locator('#start-button').click();await page.waitForTimeout(500);await page.locator('#map-button').click();
  const before=await page.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__.state);
  await page.keyboard.press('f');await page.keyboard.press('e');await page.keyboard.down('w');await page.waitForTimeout(1200);await page.keyboard.up('w');
  const during=await page.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__.state);
  assert.equal(during.time,before.time);assert.equal(during.health,before.health);assert.deepEqual(during.player,before.player);assert.equal(during.combat.kicks,before.combat.kicks);assert.equal(during.torch,before.torch);assert.equal(during.audio.contextState,'suspended');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:path.join(out,`${mobile?'mobile':'desktop'}-map-paused.png`)});
  await page.keyboard.press('Escape');await page.waitForTimeout(400);assert(!(await page.locator('#map-panel').isVisible()));const after=await page.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__.state);assert(after.time>before.time);assert.equal(after.audio.contextState,'running');
  pass(`${mobile?'phone':'desktop'} map freezes time, blood, controls and audio; Escape resumes`);
  if(!mobile){
   await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__.setState('demo'));
   await page.waitForFunction(()=>window.__THREE_GAME_DIAGNOSTICS__.state.combat.bites>0,{},{timeout:15000});
   for(let i=0;i<17;i++){
    const state=await page.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__.state);motion.push({time:state.time,zombie:state.zombies[0],player:state.player,kickTime:state.kickTime,visual:state.visuals.kick,combat:state.combat});
    await page.screenshot({path:path.join(out,`contact-${String(i).padStart(2,'0')}.jpg`),type:'jpeg',quality:84});await page.waitForTimeout(i<9?80:350);
   }
   assert(motion.some(s=>s.visual.visible&&s.visual.assetLoaded));assert(motion.some(s=>s.combat.knockdowns>0));
   assert(motion.filter(s=>s.zombie.mode!=='down').every(s=>distance(s.player,s.zombie)>=1.15));pass('unpaused bite-to-kick sequence retains spacing and scatters the student');
  }
  await context.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);pass('no runtime errors or missing assets after review fixes');
}catch(e){console.error(e);checks.push({name:'failure',pass:false,error:e.stack});await page?.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});process.exitCode=1;}
finally{await writeFile(path.join(out,'checks.json'),JSON.stringify({checks,errors,missing,motion,physicalPhoneTested:false},null,2));await browser.close();}
