import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
const {chromium}=createRequire(import.meta.url)('playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
const samples=[],errors=[];
try{
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5190/night/?debug');
 await page.waitForFunction(()=>window.__THREE_GAME_DIAGNOSTICS__?.state.ready,{},{timeout:90000});
 await page.locator('#demo-button').click();
 // No screenshots or video encoding during this active-play sample.
 for(let i=0;i<15;i++){
  await page.waitForTimeout(1000);
  samples.push(await page.evaluate(()=>{const d=window.__THREE_GAME_DIAGNOSTICS__;return {time:d.state.time,mode:d.state.mode,demo:d.state.demo,renderer:d.renderer,performance:d.performance,animation:d.state.visuals.animation};}));
 }
 const result={errors,samples,summary:{fpsMin:Math.min(...samples.slice(3).map(s=>s.performance.fps)),fpsMax:Math.max(...samples.slice(3).map(s=>s.performance.fps)),last:samples.at(-1)}};
 await writeFile('artifacts/students-live-performance.json',JSON.stringify(result,null,2));
 console.log(JSON.stringify(result.summary));
}finally{await browser.close();}
