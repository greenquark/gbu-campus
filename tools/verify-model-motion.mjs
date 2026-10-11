import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
const {chromium}=createRequire(import.meta.url)('playwright');
const base=(process.argv[2]||'http://127.0.0.1:5190').replace(/\/$/,''),out=path.resolve('artifacts/model-motion-final');await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1}),page=await context.newPage();
const errors=[],missing=[],samples=[],frames=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)missing.push(r.url())});
try{
 await page.goto(base+'/night/?debug');await page.waitForFunction(()=>window.__THREE_GAME_DIAGNOSTICS__?.state.ready,{},{timeout:90000});
 await page.locator('#demo-button').click();await page.waitForFunction(()=>window.__THREE_GAME_DIAGNOSTICS__.state.combat.bites>0,{},{timeout:15000});
 const start=Date.now();let i=0,lastBucket=-1;
 while(Date.now()-start<18000){
  const state=await page.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__);samples.push(state);
  const t=Date.now()-start;
  if(t<2600||Math.floor(t/1800)!==lastBucket){const filename=`frame-${String(i++).padStart(3,'0')}.jpg`;await page.screenshot({path:path.join(out,filename),type:'jpeg',quality:80});frames.push({file:filename,time:state.state.time,kickTime:state.state.kickTime,studentMode:state.state.zombies[0].mode,extension:state.state.visuals.kick.extension});lastBucket=Math.floor(t/1800);}
  await page.waitForTimeout(t<2600?70:700);
 }
 assert(samples.some(s=>s.state.combat.knockdowns>0));assert(samples.some(s=>s.state.visuals.kick.visible&&s.state.visuals.kick.assetLoaded));
 console.log('PASS unpaused kick, impact, reassembly and movement sequence');
 let end;
 for(let block=0;block<7;block++){
  await page.waitForTimeout(20000);end=await page.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__);samples.push(end);console.log(`LIVE ${end.state.time.toFixed(1)}s ${end.state.mode} ${end.state.memories.length}/4 memories ${end.state.performance?.fps||end.performance?.fps}fps`);
  if(end.state.mode!=='playing')break;
 }
 assert.equal(end.state.mode,'won');await page.waitForTimeout(2000);end=await page.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__);assert.equal(end.state.audio.activeSources,0);assert.equal(end.state.audio.contextState,'closed');
 await page.screenshot({path:path.join(out,'completed.png')});console.log('PASS live demo victory and silent ending');
 // Check the two cosmetic fixes made after the broad capture run.
 await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__.setState('observatory'));await page.screenshot({path:path.join(out,'gym-plaque-final.png')});
 await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__.setState('active-play'));await page.keyboard.press('m');await page.screenshot({path:path.join(out,'map-final-desktop.png')});
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
 await writeFile(path.join(out,'motion.json'),JSON.stringify({frames,samples,ending:end,errors,missing,unpaused:true},null,2));
}catch(e){await page.screenshot({path:path.join(out,'failure.png')});await writeFile(path.join(out,'failure.json'),JSON.stringify({error:e.stack,frames,samples,errors,missing},null,2));console.error(e);process.exitCode=1;}
finally{await context.close();await browser.close();}
