import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {inspectPage} from './inspect-canvas.mjs';
const {chromium}=createRequire(import.meta.url)('playwright');
const base=(process.argv[2]||'http://127.0.0.1:5190').replace(/\/$/,''),runId=process.argv[3]||'reassembly-final-1';
const out=path.resolve('artifacts',runId);await mkdir(out,{recursive:true});
const states=['zombie-portrait','zombie-scattered','zombie-gripping','zombie-crawling','zombie-docking','zombie-rejoined'];
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
   assert.equal(s.visuals.reassemblyStyle,'grounded grip-pull with organic docking');
   if(['zombie-gripping','zombie-crawling'].includes(p.state)){for(const c of Object.values(s.visuals.reassembly[0].contacts))assert(c.minY>=.054&&c.minY<=.099,JSON.stringify(c));}
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  }
  pass(`${mobile?'phone':'desktop'} standing hands, scatter, grip, crawl, docking and joined captures`);
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
   for(let i=0;i<24;i++){
    const d=await page.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__);
    motion.push({index:i,time:d.state.time,zombies:d.state.zombies,visuals:d.state.visuals,combat:d.state.combat,renderer:d.renderer,performance:d.performance});
    if(i%2===0||i>=17)await page.screenshot({path:path.join(out,`motion-${String(i).padStart(2,'0')}.jpg`),type:'jpeg',quality:90});
    await page.waitForTimeout(240);
   }
   assert(motion.some(s=>s.visuals.reassembly[0].maxDistance>.7));
   assert(motion.some(s=>s.zombies[0].mode==='rising'||s.visuals.reassembly[0].returnProgress>.95));
   const grounded=motion.filter(s=>s.visuals.reassembly[0].mode==='down'&&s.visuals.reassembly[0].elapsed>1.8&&s.visuals.reassembly[0].elapsed<6);
   assert(grounded.length>2);for(const s of grounded)for(const c of Object.values(s.visuals.reassembly[0].contacts))assert(c.minY>=.054&&c.minY<=.099,JSON.stringify(c));
   pass('live crawling surfaces stay at pavement contact or within the recovery lift');
   pass('unpaused scatter, crawling return, reassembly and rising sequence captured');
   // Test controls in a fresh run; recording deliberately leaves the player exposed.
   if((await state()).mode==='lost')await page.locator('#retry-button').click();
   else {await page.locator('#pause-button').click();await page.locator('#pause-home-button').click();await page.locator('#start-button').click();}
   pass('real menu controls start a fresh run after the motion recording');
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
