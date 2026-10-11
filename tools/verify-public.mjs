import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

const base=(process.argv[2]||'https://campus-production-ce74.up.railway.app').replace(/\/$/,'');
const output=process.argv[3]||'artifacts/public-http.json';
await mkdir(path.dirname(output),{recursive:true});
const manifest=JSON.parse((await readFile('artifacts/release-files.json','utf8')).replace(/^\uFEFF/,''));
const checks=[];
async function request(route,options={}){
 const response=await fetch(base+route,{signal:AbortSignal.timeout(30000),...options});
 return {response,body:Buffer.from(await response.arrayBuffer())};
}
try{
 const health=await request('/healthz');assert.equal(health.response.status,200);assert.equal(JSON.parse(health.body).ok,true);
 checks.push({route:'/healthz',status:200,pass:true});
 // Every browser-consumed release asset must match the locally verified build.
 const assets=manifest.files.filter(f=>f.path.startsWith('dist/')&&!/\.(md|txt)$/i.test(f.path));
 for(let i=0;i<assets.length;i+=4){
  await Promise.all(assets.slice(i,i+4).map(async asset=>{
   const route='/'+asset.path.slice(5),{response,body}=await request(route);
   assert.equal(response.status,200,route);
   const sha256=createHash('sha256').update(body).digest('hex');assert.equal(sha256,asset.sha256,route);
   checks.push({route,status:response.status,bytes:body.length,sha256,contentType:response.headers.get('content-type'),pass:true});
  }));
 }
 for(const route of ['/','/night/']){const {response,body}=await request(route);assert.equal(response.status,200);assert.match(body.toString(),/GBU Campus/);checks.push({route,status:response.status,pass:true});}
 const redirect=await request('/night?arrival=test',{redirect:'manual'});assert.equal(redirect.response.status,308);assert.equal(redirect.response.headers.get('location'),'/night/?arrival=test');checks.push({route:'/night?arrival=test',status:308,pass:true});
 for(const route of ['/missing-asset.js','/server.mjs','/.env','/src/main.js']){const {response}=await request(route);assert.equal(response.status,404,route);checks.push({route,status:404,pass:true});}
 console.log(`PASS public release: ${checks.length} HTTP and asset-integrity checks`);
 await writeFile(output,JSON.stringify({base,verifiedAt:new Date().toISOString(),ok:true,checks},null,2));
}catch(error){
 await writeFile(output,JSON.stringify({base,verifiedAt:new Date().toISOString(),ok:false,error:error.stack,checks},null,2));
 throw error;
}
