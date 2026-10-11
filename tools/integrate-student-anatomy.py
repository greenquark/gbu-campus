from pathlib import Path
root = Path(__file__).resolve().parent.parent
p = root / 'night/src/zombie-visuals.js'
s = p.read_text(encoding='utf-8')
assert "const skins =" in s and "function createZombieVisuals" in s
s = s.replace("import * as THREE from 'three';", "import * as THREE from 'three';\nimport {createStudentKit,buildStudent} from './student-anatomy.js';", 1)
start = s.index('  const geometries = {')
end = s.index('  const bootCenter=', start)
s = s[:start] + '''  let disposed = false;
  const kit=createStudentKit({baseUrl:import.meta.env.BASE_URL,onAsset:()=>{},isDisposed:()=>disposed});
  const geometries = {
    ...kit.geometries,
    box:new THREE.BoxGeometry(1,1,1),
    decal:new THREE.PlaneGeometry(1,1),
    shadow:new THREE.CircleGeometry(1,20),
  };
  const materials = {
    ...kit.materials,
    decal:new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,alphaTest:.15,polygonOffset:true,polygonOffsetFactor:-1}),
    shadow:new THREE.MeshBasicMaterial({color:0x061516,transparent:true,opacity:.25,depthWrite:false}),
    mouth:new THREE.MeshStandardMaterial({color:0x252a27,roughness:1}),
    seam:new THREE.MeshBasicMaterial({color:0x49777a,side:THREE.DoubleSide}),
  };
  const batches=new Map(),rigs=[],tmpColor=new THREE.Color(),kickResources=[];
  const visualDiagnostics={students:MAX_STUDENTS,drawCalls:0,kickDrawCalls:1,style:'textured anatomical adult students',assets:kit.assetStatus,kick:{visible:false,extension:0,screenX:0,screenY:0,widthFraction:0,asset:'player-kick.png',assetLoaded:false},reassembly:[],animation:[]};
''' + s[end:]
s = s.replace('  let disposed = false;\n\n  // Keep the source', '  // Keep the source', 1)
start = s.index('  const skins =')
end = s.index('  function part(',start)
s = s[:start] + s[end:]
start = s.index('    const rig = new THREE.Object3D(); rig.name=`student-${i+1}`;')
end = s.index('    const shadow=new THREE.Object3D();',start)
s = s[:start] + '''    const student=buildStudent({index:i,part,joint});
    const {rig,hips,torso,head,arms,legs,height}=student;
    part(torso,'decal','decal','authentic GBU crest',[0,.085,.142],[.155,.151,1]);
    // Closed fabric/skin sockets keep the existing supernatural scatter non-graphic.
    seam(head,-.016,.062,true);seam(torso,.329,.065);
    for(const arm of arms)seam(arm.shoulder,.005,.07);
    for(const leg of legs)seam(leg.thigh,.005,.081);
''' + s[end:]
s = s.replace(".48,-1.1,.64,.226,0", ".48,-1.1,.64,.152,0")
s = s.replace("[0,-.29,.03],-1.20,-.26,-.95,.167,1", "[0,-.30,.03],-1.20,-.26,-.95,.10,1")
s = s.replace("[0,-.29,.03],1.28,.06,1.10,.167,2", "[0,-.30,.03],1.28,.06,1.10,.10,2")
s = s.replace("[0,-.36,.025],-.91,.71,-.72,.145,3", "[0,-.40,.025],-.91,.71,-.72,.12,3")
s = s.replace("[0,-.36,.025],.94,.89,.94,.145,4", "[0,-.40,.025],.94,.89,.94,.12,4")
s = s.replace("    rigs.push({rig,hips,torso,head,arms,legs,shadow,height,pieces,sparks,sparkNodes,report,fall:0});", "    const animation={id:i,mode:'idle',speed:0,gait:0,blend:0};visualDiagnostics.animation.push(animation);\n    rigs.push({...student,shadow,pieces,sparks,sparkNodes,report,animation,fall:0,moveBlend:0,previousX:null,previousZ:null});")
s = s.replace('    update,\n    diagnostics:', '    update,\n    ready:kit.ready,\n    diagnostics:', 1)
p.write_text(s,encoding='utf-8')
print('Integrated anatomical model contract; gameplay and kick retained.')
