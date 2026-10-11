import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {inspectPage} from './inspect-canvas.mjs';
const {chromium}=createRequire(import.meta.url)('playwright');
const base=(process.argv[2]||'http://127.0.0.1:5190').replace(/\/$/,''),runId=process.argv[3]||'students-local-1';
const out=path.resolve('artifacts',runId);await mkdir(out,{recursive:true});
const states=['zombie-portrait','zombie-profile','zombie-rear','zombie-lineup','zombie-chase','zombie-scattered','zombie-crawling','zombie-rejoined'];
const pairs=['desktop','mobile'].flatMap(mode=>states.map(state=>({mode,state})));
const manifest={version:1,runId,captures:pairs.map(p=>({...p,report:`artifacts/${runId}/${p.mode}-${p.state}.json`})),artifacts:[`artifacts/${runId}/checks.json`,`artifacts/${runId}/motion.json`]};
await writeFile(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));
const checks=[],errors=[],missing=[],motion=[];let page;
const pass=(name,data={})=>{checks.push({name,pass:true,...data});console.log('PASS '+name);};
const browser=await chromium.launch({channel:'chrome',headless:true});
const track=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)missing.push({url:r.url(),status:r.status()});});};
const state=()=>page.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__.state);
try{
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},deviceScaleFactor:1,isMobile:mobile,hasTouch:mobile,...(!mobile?{recordVideo:{dir:path.join(out,'video'),size:{width:1440,height:900}}}:{})});
  page=await context.newPage();track(page);
  for(const p of pairs.filter(p=>p.mode===(mobile?'mobile':'desktop'))){
   const report=await inspectPage(page,{url:base+'/night/?debug',out,mobile,state:p.state,runId,wait:350});
   await writeFile(path.join(out,`${p.mode}-${p.state}.json`),JSON.stringify(report,null,2));assert(report.result.ok,p.state);assert.deepEqual(report.consoleErrors||[],[]);
   const s=await state();assert.equal(s.visuals.style,'textured anatomical adult students');assert.equal(s.visuals.students,6);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  }
  pass(`${mobile?'phone':'desktop'} character front, profile, rear, six-student lineup, chase and reassembly captures`);
  await page.goto(base+'/night/?debug');await page.waitForFunction(()=>window.__THREE_GAME_DIAGNOSTICS__?.state.ready,{},{timeout:90000});
  await page.locator('#start-button')[mobile?'tap':'click']();
  await page.waitForFunction(()=>window.__THREE_GAME_DIAGNOSTICS__.state.combat.bites>0,{},{timeout:20000});
  const before=await state();
  if(mobile)await page.locator('#touch-kick').tap();else{await page.locator('#scene canvas').focus();await page.keyboard.press('Space');}
  await page.waitForFunction(()=>window.__THREE_GAME_DIAGNOSTICS__.state.combat.knockdowns>0,{},{timeout:5000});
  assert((await state()).health<=before.health);pass(`${mobile?'touch':'keyboard'} kick still scatters the pursuing student after contact`);
  if(!mobile){
   // Real mouse input looks down at the fallen body; simulation stays unpaused.
   await page.mouse.move(850,360);await page.mouse.down();await page.mouse.move(850,535,{steps:12});await page.mouse.up();
   for(let i=0;i<32;i++){
    const d=await page.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__);
    motion.push({index:i,time:d.state.time,zombies:d.state.zombies,visuals:d.state.visuals,combat:d.state.combat,renderer:d.renderer,performance:d.performance});
    if(i%2===0||i>=27)await page.screenshot({path:path.join(out,`motion-${String(i).padStart(2,'0')}.jpg`),type:'jpeg',quality:90});
    await page.waitForTimeout(240);
   }
   assert(motion.some(s=>s.visuals.reassembly[0].maxDistance>.7));
   assert(motion.some(s=>s.zombies[0].mode==='rising'||s.visuals.reassembly[0].returnProgress>.95));
   pass('unpaused scatter, crawling return, reassembly and rising sequence captured');
   await page.locator('#scene canvas').focus();const moveFrom=await state();
   await page.keyboard.down('d');await page.waitForTimeout(900);await page.keyboard.up('d');
   const after=await state();const moved=Math.hypot(after.player.x-moveFrom.player.x,after.player.z-moveFrom.player.z);
   assert(moved>1,JSON.stringify({moveFrom:moveFrom.player,after:after.player,mode:after.mode,moved}));pass('real walking input still moves the player away from the students',{moved});
  }
  await page.locator('#pause-button')[mobile?'tap':'click']();await page.waitForTimeout(250);const paused=await state();assert.equal(paused.audio.activeSources,0);assert.equal(paused.audio.contextState,'suspended');
  await page.locator('#resume-button')[mobile?'tap':'click']();
  // AudioContext.resume is asynchronous; wait for the reported browser state.
  await page.waitForFunction(()=>window.__THREE_GAME_DIAGNOSTICS__.state.audio.contextState==='running',{},{timeout:5000});
  assert.equal((await state()).mode,'playing');
  pass(`${mobile?'phone':'desktop'} pause and resume preserve audio cleanup`);
  await context.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);pass('no uncaught errors or missing character assets');
}catch(error){console.error(error);checks.push({name:'failure',pass:false,error:error.stack});await page?.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});process.exitCode=1;}
finally{
 await writeFile(path.join(out,'motion.json'),JSON.stringify(motion,null,2));
 await writeFile(path.join(out,'checks.json'),JSON.stringify({base,runId,checks,errors,missing,physicalPhoneTested:false},null,2));
 await browser.close();
}
