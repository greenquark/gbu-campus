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
 await page.evaluate(async()=>{await window.__THREE_GAME_TEST_HOOKS__.setState('zombie-scattered');window.__THREE_GAME_TEST_HOOKS__.resumeSimulation();});
 // Active recovery without video encoding or screenshots.
 for(let i=0;i<16;i++){
  await page.waitForTimeout(500);
  samples.push(await page.evaluate(()=>{const d=window.__THREE_GAME_DIAGNOSTICS__;return {time:d.state.time,mode:d.state.mode,renderer:d.renderer,performance:d.performance,reassembly:d.state.visuals.reassembly[0]};}));
 }
 const measured=samples.slice(4),result={errors,samples,summary:{fpsMin:Math.min(...measured.map(s=>s.performance.fps)),fpsMax:Math.max(...measured.map(s=>s.performance.fps)),maxTriangles:Math.max(...samples.map(s=>s.renderer.triangles)),maxCalls:Math.max(...samples.map(s=>s.renderer.calls)),last:samples.at(-1)}};
 await writeFile('artifacts/reassembly-live-performance.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result.summary));
}finally{await browser.close();}
