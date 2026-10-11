import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const {chromium}=createRequire(import.meta.url)('playwright');
const out=path.resolve('artifacts',process.argv[2]||'students-preview-1');await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5190/night/?debug');await page.waitForFunction(()=>window.__THREE_GAME_DIAGNOSTICS__?.state.ready,{},{timeout:90000});
 const diagnostics=[];
 for(const state of ['zombie-portrait','zombie-profile','zombie-rear','zombie-lineup']){
  await page.evaluate(s=>window.__THREE_GAME_TEST_HOOKS__.setState(s),state);await page.waitForTimeout(500);
  await page.screenshot({path:path.join(out,state+'.png')});diagnostics.push({state,diagnostics:await page.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__)});
 }
 await writeFile(path.join(out,'diagnostics.json'),JSON.stringify({errors,diagnostics},null,2));console.log(JSON.stringify({errors,renderer:diagnostics[0].diagnostics.renderer,characters:diagnostics[0].diagnostics.state.visuals}));
}finally{await browser.close();}
