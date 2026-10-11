import {build} from 'vite';
import {cp,mkdir,readFile,writeFile,stat,readdir,rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dist=path.join(root,'dist'),release=path.join(root,'release');
// Explicitly clean the bounded generated tree. Preserve all source and Old/ snapshots.
if(path.relative(root,dist)!=='dist')throw new Error('Unexpected build root');
await rm(dist,{recursive:true,force:true});
for(const [name,base,out] of [['tour','/',dist],['night','/night/',path.join(dist,'night')]]){
  if(!out.startsWith(root+path.sep)||!['dist','dist/night'].includes(path.relative(root,out).replaceAll(path.sep,'/')))throw new Error('Unexpected build destination');
  await build({root:path.join(root,name),configFile:false,publicDir:false,base,build:{outDir:out,emptyOutDir:true,sourcemap:false,rollupOptions:{output:{manualChunks:{three:['three']}}}}});
  // The old reference GLB/HDR textures remain in the protected source snapshot;
  // the rebuilt procedural campus only consumes these explicitly listed assets.
  for(const file of ['favicon.svg','fonts',...(name==='night'?['gbu-shirt-logo.png','player-kick.png','characters']:[])])
    await cp(path.join(root,name,'public',file),path.join(out,file),{recursive:true,force:true});
}
await mkdir(release,{recursive:true});
// Replace the generated site directory so old hashed bundles are not uploaded.
const releaseDist=path.resolve(release,'dist');
if(path.relative(root,releaseDist)!==path.join('release','dist'))throw new Error('Unexpected release destination');
await rm(releaseDist,{recursive:true,force:true});
// Only this small release directory is uploaded. No course material, Old,
// captures, node_modules, credentials, or development sources are copied.
for(const name of ['dist','server.mjs','Dockerfile','.dockerignore','package.json'])await cp(path.join(root,name),path.join(release,name),{recursive:true,force:true});
const pkg=JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
await writeFile(path.join(release,'package.json'),JSON.stringify({name:pkg.name,version:pkg.version,private:true,type:'module',scripts:{start:'node server.mjs'},engines:pkg.engines},null,2));
const entries=[];
async function scan(dir){for(const item of await readdir(dir,{withFileTypes:true})){const file=path.join(dir,item.name);if(item.isDirectory())await scan(file);else {const bytes=await readFile(file);entries.push({path:path.relative(release,file).replaceAll(path.sep,'/'),bytes:(await stat(file)).size,sha256:createHash('sha256').update(bytes).digest('hex')});}}}
await scan(release);await mkdir(path.join(root,'artifacts'),{recursive:true});
await writeFile(path.join(root,'artifacts','release-files.json'),JSON.stringify({created:new Date().toISOString(),files:entries,totalBytes:entries.reduce((n,f)=>n+f.bytes,0)},null,2));
console.log(`Ready: ${entries.length} deployment files, ${(entries.reduce((n,f)=>n+f.bytes,0)/1048576).toFixed(2)} MiB. Upload only release/.`);
