import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)('playwright');
const base=(process.argv[2]||'http://127.0.0.1:5192').replace(/\/$/,''),runId=process.argv[3]||'audio-end-local';
const baseline=process.argv.includes('--baseline'),fullDemo=process.argv.includes('--demo'),out=path.resolve('artifacts',runId);
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),context=await browser.newContext({viewport:{width:960,height:640},deviceScaleFactor:1});
// Observe native contexts independently of the game's own diagnostics.
await context.addInitScript(()=>{
 const Native=window.AudioContext||window.webkitAudioContext;window.__qaContexts=[];
 if(Native){class ObservedContext extends Native{constructor(...args){super(...args);window.__qaContexts.push(this);}}window.AudioContext=ObservedContext;}
});
let page=await context.newPage();const checks=[],errors=[],failedRequests=[];
function track(p){p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)failedRequests.push({url:r.url(),status:r.status()});});}
track(page);
const state=()=>page.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__.state);
const engines=()=>page.evaluate(()=>window.__qaContexts.map(c=>c.state));
const pass=(name,data={})=>{checks.push({name,pass:true,...data});console.log('PASS '+name);};
async function ready(){await page.goto(base+'/night/?debug',{timeout:90000});await page.waitForFunction(()=>window.__THREE_GAME_DIAGNOSTICS__?.state.ready,{},{timeout:90000});}
async function playing(){await page.waitForFunction(()=>{const a=window.__THREE_GAME_DIAGNOSTICS__.state.audio;return a.ambientSources===3&&a.outputRms>0;},{},{timeout:15000});const contexts=await engines();assert.equal(contexts.filter(s=>s==='running').length,1);}
async function silent(name,expected='closed'){
 await page.waitForFunction(want=>{const a=window.__THREE_GAME_DIAGNOSTICS__.state.audio;return a.activeSources===0&&a.masterGain===0&&a.outputRms===0&&a.contextState===want;},expected,{timeout:7000});
 const s=await state(),contexts=await engines();assert(contexts.every(c=>c===expected||c==='closed'),JSON.stringify(contexts));
 if(expected==='closed')assert(!s.audio.sessionActive);pass(name,{mode:s.mode,audio:s.audio,nativeContexts:contexts});
}
async function start(){await page.locator('#start-button').click();await playing();}
try{
 await ready();
 if(baseline){
  await start();await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__.setState('won'));await page.waitForTimeout(300);
  const audio=(await state()).audio,nativeContexts=await engines();
  await writeFile(path.join(out,'baseline.json'),JSON.stringify({base,audio,nativeContexts,engineStillRunning:nativeContexts.includes('running')},null,2));
  console.log(JSON.stringify({baseline:true,audio,nativeContexts}));
 }else if(process.argv.includes('--smoke')){
  await start();pass('public start gesture produces audio through one engine');
  await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__.combatFixture('bleedout'));await page.waitForFunction(()=>window.__THREE_GAME_DIAGNOSTICS__.state.mode==='lost',{},{timeout:15000});await silent('public fatal bite closes every native audio context');
  await page.locator('#retry-button').click();await playing();pass('public retry restores sound');
  await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__.setState('won'));await silent('public victory closes all output');await page.waitForTimeout(1800);await silent('public ending stays silent after queued sound tails');
  assert.deepEqual(errors,[]);assert.deepEqual(failedRequests,[]);pass('no public runtime or asset errors');
  await writeFile(path.join(out,'results.json'),JSON.stringify({base,runId,verifiedAt:new Date().toISOString(),checks,errors,failedRequests,fullDemo:false,nativeContextObservation:true,physicalSpeakerListening:false},null,2));
 }else{
  await page.locator('#sound-button').click();await page.locator('#sound-button').click();assert.deepEqual(await engines(),[]);pass('title sound controls do not open an audio engine');
  await start();pass('a real start gesture produces audio through one native context');
  await page.locator('#scene canvas').focus();await page.keyboard.press('q');await page.keyboard.press('Escape');await silent('pause cancels scheduled bell tails and suspends output','suspended');
  await page.locator('#resume-button').click();await playing();pass('resume restores exactly one ambience layer');
  await page.locator('#sound-button').click();await silent('mute suspends output and stops all sources','suspended');await page.locator('#sound-button').click();await playing();pass('unmute restores active-game audio');
  await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__.setState('won'));await silent('victory closes every audio context');
  // The ending dialog intentionally covers this control; inject the event only
  // to exercise the audio guard against stale UI callbacks after game over.
  await page.waitForTimeout(1800);await page.evaluate(()=>{document.querySelector('#sound-button').click();document.querySelector('#sound-button').click();});await silent('ending stays closed after scheduled tails and stale sound-toggle callbacks');
  await page.locator('#retry-button').click();await playing();pass('retry opens a fresh working audio context');
  await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__.combatFixture('bleedout'));await page.waitForFunction(()=>window.__THREE_GAME_DIAGNOSTICS__.state.mode==='lost',{},{timeout:15000});await silent('actual bite-induced game over closes output');
  await page.locator('#end-home-button').click();await start();await page.locator('#pause-button').click();await page.locator('#pause-home-button').click();await silent('quit to the title closes output');
  await page.evaluate(()=>{document.querySelector('#start-button').click();document.querySelector('#pause-button').click();document.querySelector('#pause-home-button').click();});await silent('immediate start and quit cannot revive audio through a late resume');
  await page.locator('#demo-button').click();await playing();await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await silent('losing window focus also pauses demo audio','suspended');await page.locator('#resume-button').click();await playing();
  await page.evaluate(()=>window.dispatchEvent(new Event('beforeunload')));await silent('an exit attempt closes audio immediately');await page.locator('#resume-button').click();await playing();pass('Continue recovers from a cancelled exit without duplicate audio');
  const storageKey='campus-audio-exit-proof';
  async function exitProbe(){await page.evaluate(k=>{localStorage.removeItem(k);window.addEventListener('pagehide',()=>localStorage.setItem(k,JSON.stringify({audio:window.__THREE_GAME_DIAGNOSTICS__.state.audio,contexts:window.__qaContexts.map(c=>c.state)})));},storageKey);}
  await exitProbe();await page.locator('.campus-modes a[href="/"]').click();await page.waitForFunction(()=>document.querySelector('#start-walk')?.disabled===false,{},{timeout:90000});let exit=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),storageKey);assert.equal(exit.audio.activeSources,0);assert.equal(exit.audio.masterGain,0);assert(exit.contexts.every(s=>s==='closed'));pass('switching to day tour closes native night contexts',{exit});
  await ready();await start();await exitProbe();const closed=page.waitForEvent('close');await page.close({runBeforeUnload:true});await closed;page=await context.newPage();track(page);await ready();exit=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),storageKey);assert.equal(exit.audio.activeSources,0);assert(exit.contexts.every(s=>s==='closed'));pass('closing the tab closes native audio output',{exit});
  if(fullDemo){
   await page.locator('#demo-button').click();await playing();const deadline=Date.now()+300000;let nextReport=0;
   while((await state()).mode==='playing'&&Date.now()<deadline){await page.waitForTimeout(1000);const s=await state();if(s.time>nextReport){console.log(`DEMO ${Math.floor(s.time)}s, ${s.memories.length}/4 memories`);nextReport=s.time+25;}}
   const s=await state();assert.equal(s.mode,'won');assert.equal(s.memories.length,4);assert(s.combat.bites>0&&s.combat.knockdowns>0);await silent('the complete unassisted demo finishes with all audio engines closed');await page.waitForTimeout(2000);await silent('demo ending remains silent');await page.screenshot({path:path.join(out,'demo-ended.png')});pass('full demo retains bites, kicks and all four objectives',{time:s.time,combat:s.combat});
  }
  assert.deepEqual(errors,[]);assert.deepEqual(failedRequests,[]);pass('no runtime or asset errors');
  await writeFile(path.join(out,'results.json'),JSON.stringify({base,runId,verifiedAt:new Date().toISOString(),checks,errors,failedRequests,fullDemo,nativeContextObservation:true,physicalSpeakerListening:false},null,2));
 }
}catch(error){await writeFile(path.join(out,'failure.json'),JSON.stringify({error:error.stack,checks,errors,failedRequests,state:await state().catch(()=>null),nativeContexts:await engines().catch(()=>[])},null,2));console.error(error);process.exitCode=1;}
finally{await browser.close();}
