import './style.css';
import { CAMPUS, MEMORY_TITLES } from '../../shared/campus-layout.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));
const clock = value => `${Math.floor((value || 0) / 60).toString().padStart(2, '0')}:${Math.floor((value || 0) % 60).toString().padStart(2, '0')}`;
const MAP_SCALE = 2;
const mapPoint = ({x,z}) => ({x:24+(x-CAMPUS.bounds.minX)*MAP_SCALE,y:42+(z-CAMPUS.bounds.minZ)*MAP_SCALE});
const memoryOrder = ['library','greenhouse','observatory','residence'];

function drawCampusMap() {
  const svg = document.querySelector('.campus-map');
  const layer = document.getElementById('map-layout');
  const point = (x,z) => {const p=mapPoint({x,z});return `${p.x},${p.y}`;};
  const footprints = CAMPUS.buildings.map(building => {
    const p=mapPoint(building),w=building.w*MAP_SCALE,d=building.d*MAP_SCALE;
    const shape=building.id==='crescent'
      ? `<path d="M${p.x-w/2},${p.y+d/2} Q${p.x-w*.63},${p.y-d*.60} ${p.x},${p.y-d/2} Q${p.x+w*.63},${p.y-d*.60} ${p.x+w/2},${p.y+d/2} L${p.x+w/2-12},${p.y+d/2-6} Q${p.x+w*.45},${p.y-d*.30} ${p.x},${p.y-d/2+19} Q${p.x-w*.45},${p.y-d*.30} ${p.x-w/2+12},${p.y+d/2-6} Z"/>`
      : `<rect x="${p.x-w/2}" y="${p.y-d/2}" width="${w}" height="${d}" rx="2"/>`;
    const labels={towers:'TOWERS',research:'STEPPED TOWER',arcade:'REAR ARCADE',academic:'EAST TEACHING',crescent:'CURVED BUILDING'};
    return `<g class="map-footprint" data-campus-building="${building.id}"><title>${building.label}</title>${shape}${labels[building.id]?`<text x="${p.x}" y="${p.y+(building.id==='crescent'?0:3)}">${labels[building.id]}</text>`:''}</g>`;
  }).join('');
  const paths=CAMPUS.paths.map(path=>`<polyline points="${path.map(([x,z])=>point(x,z)).join(' ')}"/>`).join('');
  const safe=CAMPUS.safeZones.map(zone=>{const p=mapPoint(zone);return `<circle cx="${p.x}" cy="${p.y}" r="4"/>`;}).join('');
  const stations=memoryOrder.map((id,index)=>{const station=CAMPUS.stations.find(s=>s.id===id),p=mapPoint(station.position);return `<g data-map-memory="${id}" class="map-building"><title>${station.title}: ${MEMORY_TITLES[id]}</title><circle cx="${p.x}" cy="${p.y}" r="10"/><text x="${p.x}" y="${p.y+3.5}">${index+1}</text></g>`;}).join('');
  const gate=mapPoint(CAMPUS.exit),track=mapPoint(CAMPUS.track),water=mapPoint(CAMPUS.stations.find(s=>s.id==='greenhouse').position);
  layer.innerHTML=`<g class="map-paths">${paths}</g>${footprints}<ellipse class="map-water" cx="${water.x}" cy="${water.y-7}" rx="24" ry="12"/><rect class="map-track" x="${track.x-CAMPUS.track.w}" y="${track.y-CAMPUS.track.d}" width="${CAMPUS.track.w*2}" height="${CAMPUS.track.d*2}" rx="22"/><g class="map-lanterns">${safe}</g>${stations}<g class="map-gate"><path d="M${gate.x-12},${gate.y-5}v10m24-10v10m-24-5h24"/><text x="${gate.x}" y="${gate.y+22}">PLAZA GATE / EXIT</text></g><text x="315" y="23" class="map-orientation">MODEL REAR</text><text x="145" y="325" class="map-orientation">MODEL FRONT</text>`;
  svg.setAttribute('viewBox','0 0 630 340');
  const list=document.getElementById('map-memory-list');
  list.innerHTML=memoryOrder.map((id,index)=>{const station=CAMPUS.stations.find(s=>s.id===id);return `<li data-map-entry="${id}"><b>${index+1}</b><span>${station.title}<small>${MEMORY_TITLES[id]}</small></span></li>`;}).join('');
}

export function createUI(actions) {
  drawCampusMap();
  const ids = ['ui','title-screen','start-button','demo-button','loading','loading-label','loading-progress','hud','objective','hint','navigation-label','track-status','track-progress','track-clock','memory-count','memory-list','safety-label','health-fill','health-value','bite-effect','chase-label','kick-label','composure-fill','composure-value','battery-fill','battery-value','torch-label','noise-label','noise-bars','bell-label','reticle','event-message','focus-prompt','focus-title','focus-instruction','ritual-progress','note-controls','demo-strip','demo-caption','map-panel','map-player','map-ghost','map-target','map-button','pause-screen','end-screen','end-eyebrow','end-title','end-description','end-memories','end-time','retry-button','sound-button','quality-label','touch-controls','touch-torch','touch-interact','touch-kick','touch-sprint','scene'];
  const el = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
  const cache = new WeakMap();
  let lastMode = null;
  let state = {};
  let heldInteract = false;
  let heldSprint = false;
  const directions = new Set();
  const coarse = matchMedia('(pointer: coarse)');
  const memoryNodes = Object.fromEntries([...el['memory-list'].children].map(node => [node.dataset.memory,node]));
  const mapNodes = Object.fromEntries([...document.querySelectorAll('[data-map-memory]')].map(node => [node.dataset.mapMemory,node]));
  const mapEntries = Object.fromEntries([...document.querySelectorAll('[data-map-entry]')].map(node => [node.dataset.mapEntry,node]));
  for(const [id,node] of Object.entries(memoryNodes)) text(node.querySelector('span'),MEMORY_TITLES[id]||id);

  function text(node, value) {
    value = String(value ?? '');
    if (cache.get(node) !== value) { node.textContent = value; cache.set(node, value); }
  }
  function show(node, visible) {
    if (node.hasAttribute('hidden') === visible) node.toggleAttribute('hidden', !visible);
    const aria = visible ? 'false' : 'true';
    if (node.getAttribute('aria-hidden') !== aria) node.setAttribute('aria-hidden', aria);
  }
  function attr(node, name, value) {
    value = String(value);
    if (node.getAttribute(name) !== value) node.setAttribute(name, value);
  }
  function width(node, value) {
    const next = `${Math.round(clamp(value, 0, 100))}%`;
    if (node.style.width !== next) node.style.width = next;
  }
  function invoke(name, ...args) { if (typeof actions[name] === 'function') actions[name](...args); }
  function bind(id, action) { document.getElementById(id).addEventListener('click', event => { event.preventDefault(); invoke(action); }); }
  const buttons = { 'start-button':'start','demo-button':'demo','resume-button':'resume','retry-button':'retry','pause-home-button':'home','end-home-button':'home','home-mark':'home','take-control-button':'takeControl','sound-button':'toggleSound','quality-button':'toggleQuality','map-button':'toggleMap','map-close':'toggleMap','pause-button':'pause','touch-torch':'toggleTorch','touch-bell':'decoy','touch-kick':'kick' };
  Object.entries(buttons).forEach(([id, action]) => bind(id, action));
  document.querySelectorAll('[data-note]').forEach(button => button.addEventListener('click', () => invoke('note', Number(button.dataset.note))));

  function updateMove() {
    const x = Number(directions.has('right')) - Number(directions.has('left'));
    const z = Number(directions.has('forward')) - Number(directions.has('back'));
    invoke('move', x, z);
  }
  function clearTouch() {
    if (directions.size) { directions.clear(); updateMove(); }
    if (heldInteract) { heldInteract = false; invoke('interact', false); }
    if (heldSprint) { heldSprint = false; invoke('sprint', false); }
    document.querySelectorAll('.touch-controls .held').forEach(button => button.classList.remove('held'));
  }
  document.querySelectorAll('[data-direction]').forEach(button => {
    const direction = button.dataset.direction;
    button.addEventListener('pointerdown', event => {
      if (state.mode !== 'playing' || state.demo) return;
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      directions.add(direction); button.classList.add('held'); updateMove();
    });
    for (const eventName of ['pointerup','pointercancel','lostpointercapture']) button.addEventListener(eventName, () => {
      if (directions.delete(direction)) updateMove();
      button.classList.remove('held');
    });
  });
  el['touch-interact'].addEventListener('pointerdown', event => {
    if (state.mode !== 'playing' || state.demo) return;
    event.preventDefault(); el['touch-interact'].setPointerCapture(event.pointerId);
    heldInteract = true; el['touch-interact'].classList.add('held'); invoke('interact', true);
  });
  for (const eventName of ['pointerup','pointercancel','lostpointercapture']) el['touch-interact'].addEventListener(eventName, () => {
    if (heldInteract) { heldInteract = false; invoke('interact', false); }
    el['touch-interact'].classList.remove('held');
  });
  el['touch-sprint'].addEventListener('pointerdown', event => {
    if (state.mode !== 'playing' || state.demo) return;
    event.preventDefault(); el['touch-sprint'].setPointerCapture(event.pointerId);
    heldSprint = true; el['touch-sprint'].classList.add('held'); invoke('sprint', true);
  });
  for (const eventName of ['pointerup','pointercancel','lostpointercapture']) el['touch-sprint'].addEventListener(eventName, () => {
    if (heldSprint) { heldSprint = false; invoke('sprint', false); }
    el['touch-sprint'].classList.remove('held');
  });
  window.addEventListener('blur', clearTouch);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearTouch(); });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const panel = state.mapOpen ? el['map-panel'] : state.mode === 'paused' ? el['pause-screen'] : ['won','lost'].includes(state.mode) ? el['end-screen'] : null;
    if (!panel) return;
    const controls = [...panel.querySelectorAll('button:not([disabled]),a[href]')];
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && (!panel.contains(document.activeElement) || document.activeElement === first)) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && (!panel.contains(document.activeElement) || document.activeElement === last)) { event.preventDefault(); first?.focus(); }
  });

  function update(next) {
    const mapChanged=Boolean(state.mapOpen)!==Boolean(next.mapOpen);
    state = next;
    const mode = next.mode || 'title';
    const playing = mode === 'playing';
    const ended = mode === 'won' || mode === 'lost';
    const memories = next.memories || [];
    const count = memories.filter(memory => memory.done).length;
    const focus = playing ? next.focus : null;
    attr(el.ui, 'data-mode', mode);
    el.ui.classList.toggle('demo-running', Boolean(next.demo && playing));
    show(el['title-screen'], mode === 'title');
    show(el.hud, playing);
    show(el.reticle, playing && !next.mapOpen);
    show(el['pause-screen'], mode === 'paused');
    show(el['end-screen'], ended);
    show(el['demo-strip'], playing && Boolean(next.demo));
    show(el['touch-controls'], playing && !next.mapOpen && !next.demo && coarse.matches);
    show(el['map-panel'], playing && Boolean(next.mapOpen));
    show(el['focus-prompt'], Boolean(focus) && !next.mapOpen);
    if(mapChanged){clearTouch();if(next.mapOpen)document.getElementById('map-close').focus({preventScroll:true});else if(playing)el.scene.focus({preventScroll:true});}
    show(el['loading'], mode === 'title' && !next.ready);
    if (el['start-button'].disabled === Boolean(next.ready)) el['start-button'].disabled = !next.ready;
    if (el['demo-button'].disabled === Boolean(next.ready)) el['demo-button'].disabled = !next.ready;

    text(el.objective, next.objective || 'Find the lost memories.');
    text(el.hint, next.hint || 'Follow the lantern-lit paths.');
    const navigation=next.navigation;
    show(el['navigation-label'],playing&&Boolean(navigation?.label));
    if(navigation?.label)text(el['navigation-label'],`${navigation.label}${Number.isFinite(navigation.distance)?` · ${Math.round(navigation.distance)} units`:''}`);
    const track=next.track;
    show(el['track-status'],playing&&Boolean(track?.active));
    el.ui.classList.toggle('track-running',playing&&Boolean(track?.active));
    if(track?.active){
      text(el['track-progress'],`TRACK · ${Math.min(track.total||4,(track.next||0)+1)} / ${track.total||4}`);
      text(el['track-clock'],`${Math.ceil(Math.max(0,track.timeLeft||0))}s`);
      el['track-status'].classList.toggle('urgent',(track.timeLeft||0)<=8);
    }
    text(el['memory-count'], `${count} / 4`);
    for (const memory of memories) {
      const node = memoryNodes[memory.id];
      if (node) { node.classList.toggle('done', Boolean(memory.done)); attr(node, 'aria-label', `${MEMORY_TITLES[memory.id] || memory.title || memory.id}: ${memory.done ? 'recovered' : 'missing'}`); }
      mapNodes[memory.id]?.classList.toggle('done', Boolean(memory.done));
      mapEntries[memory.id]?.classList.toggle('done', Boolean(memory.done));
    }
    const composure = Math.round(100 - clamp(next.fear, 0, 100));
    const battery = Math.round(clamp(next.battery, 0, 100));
    const health = Math.round(clamp(next.health ?? 100, 0, 100));
    text(el['health-value'], health); width(el['health-fill'], health);
    attr(el['health-fill'].parentElement, 'aria-label', `Blood ${health} percent`);
    el.ui.classList.toggle('low-blood', health <= 30 && playing);
    const biteOpacity = (playing ? clamp((next.biteFlash || 0) / .7, 0, 1) : 0).toFixed(2);
    if (el['bite-effect'].style.opacity !== biteOpacity) el['bite-effect'].style.opacity = biteOpacity;
    const chasers = Math.max(0, Number(next.chasers) || 0);
    text(el['chase-label'], chasers ? `${chasers} ${chasers === 1 ? 'student is' : 'students are'} chasing` : 'No footsteps behind you');
    el['chase-label'].classList.toggle('chasing', chasers > 0);
    const kickCooling = (next.kickCooldown || 0) > 0;
    text(el['kick-label'], kickCooling ? `Kick · ${(next.kickCooldown || 0).toFixed(1)}s` : 'Kick ready');
    text(el['touch-kick'], kickCooling ? '…' : 'Kick');
    attr(el['touch-kick'], 'aria-disabled', kickCooling);
    text(el['composure-value'], composure); width(el['composure-fill'], composure);
    const composureColor = composure < 30 ? 'var(--red)' : 'var(--safe)';
    if (el['composure-fill'].style.background !== composureColor) el['composure-fill'].style.background = composureColor;
    text(el['battery-value'], battery); width(el['battery-fill'], battery);
    text(el['torch-label'], next.torch ? 'Torch on' : 'Torch off');
    text(el['touch-torch'], next.torch ? 'Light on' : 'Light off');
    attr(el['touch-torch'], 'aria-pressed', Boolean(next.torch));
    el['safety-label'].classList.toggle('safe', Boolean(next.safe));
    text(el['safety-label'].querySelector('b'), next.safe ? 'Lantern refuge · recovering' : 'Beyond the lanterns');
    const noise = clamp(next.noise, 0, 1);
    text(el['noise-label'], noise > .6 ? 'The Listener can hear you' : noise > .15 ? 'Footsteps in the night' : 'Quiet footsteps');
    const activeBars = Math.ceil(noise * 5);
    [...el['noise-bars'].children].forEach((bar,index) => bar.classList.toggle('active', index < activeBars));
    el['noise-bars'].classList.toggle('noisy', noise > .6);
    attr(el['noise-bars'], 'aria-label', `Noise ${Math.round(noise * 100)} percent`);
    text(el['bell-label'], next.decoyCooldown > 0 ? `Bell returns in ${Math.ceil(next.decoyCooldown)}s` : 'Decoy bell ready');
    text(el['quality-label'], next.quality || 'Smooth');
    attr(document.getElementById('quality-button'), 'aria-label', `Rendering: ${next.quality || 'Smooth'}. Click to change.`);
    attr(el['sound-button'], 'aria-pressed', Boolean(next.sound));
    attr(el['sound-button'], 'aria-label', next.sound ? 'Mute sound' : 'Enable sound');
    attr(el['map-button'], 'aria-expanded', Boolean(next.mapOpen));
    attr(el['map-button'], 'aria-label', next.mapOpen ? 'Close campus map' : 'Open campus map');
    text(el['demo-caption'], next.caption || 'Walking the same paths you can explore.');
    const message = playing ? String(next.message || '') : '';
    show(el['event-message'], Boolean(message));
    text(el['event-message'], message);

    if (focus) {
      text(el['focus-title'], focus.title || 'A memory remains');
      text(el['focus-instruction'], focus.instruction || 'Hold E to listen.');
      width(el['ritual-progress'], clamp(focus.progress, 0, 1) * 100);
    }
    const residenceFocus = Boolean(focus && /residence|echo|melody|note|chime|music/i.test(`${focus.id || ''} ${focus.title || ''} ${focus.instruction || ''}`));
    const residenceDone = memories.some(memory => memory.id === 'residence' && memory.done);
    // The live demo supplies its own notes; manual keys appear after takeover.
    show(el['note-controls'], playing && residenceFocus && !residenceDone && !next.demo);
    el['note-controls'].querySelectorAll('button').forEach(button => {
      if (button.disabled !== Boolean(next.demo)) button.disabled = Boolean(next.demo);
    });
    if (next.mapOpen && next.player) {
      const p=mapPoint({x:clamp(next.player.x,CAMPUS.bounds.minX,CAMPUS.bounds.maxX),z:clamp(next.player.z,CAMPUS.bounds.minZ,CAMPUS.bounds.maxZ)});
      const angle = -(Number(next.player.yaw) || 0) * 180 / Math.PI;
      attr(el['map-player'], 'transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${angle.toFixed(1)})`);
      show(el['map-ghost'], Boolean(next.ghost?.visible));
      if (next.ghost?.visible) {const ghost=mapPoint(next.ghost);attr(el['map-ghost'], 'cx', ghost.x.toFixed(1));attr(el['map-ghost'], 'cy',ghost.y.toFixed(1));}
      show(el['map-target'],Boolean(navigation?.target));
      if(navigation?.target){const target=mapPoint(navigation.target);attr(el['map-target'],'cx',target.x.toFixed(1));attr(el['map-target'],'cy',target.y.toFixed(1));}
    }
    if (ended) {
      const won = mode === 'won';
      text(el['end-eyebrow'], won ? 'DAWN FINDS ITS WAY HOME' : health <= 0 ? 'THE NIGHT TOOK ITS TOLL' : 'THE LISTENER CAME TOO CLOSE');
      text(el['end-title'], won ? 'The night is complete.' : 'You are still here.');
      text(el['end-description'], won ? 'Four memories, returned. The last bell fades, the gate opens, and the campus can finally rest.' : next.message || 'Your recovered memories are safe. Outrun the students or face them and kick. Return to a lantern, take a breath, then try again.');
      text(el['end-memories'], `${count} / 4`);
      text(el['end-time'], clock(next.time));
      text(el['retry-button'], won ? 'Walk the night again ↗' : 'Try again ↗');
    }
    if (mode !== lastMode) {
      clearTouch();
      if (mode === 'paused') document.getElementById('resume-button').focus({preventScroll:true});
      if (ended) el['retry-button'].focus({preventScroll:true});
      if (playing) el.scene.focus({preventScroll:true});
      if (mode === 'title' && lastMode !== null && next.ready) el['start-button'].focus({preventScroll:true});
      lastMode = mode;
    }
  }

  function setLoading(label, progress) {
    text(el['loading-label'], label || 'Waking the campus…');
    width(el['loading-progress'], clamp(progress, 0, 1) * 100);
  }
  return {update,setLoading};
}
