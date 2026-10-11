// Local synthesis only: no downloaded audio, account, or network dependency.
export function createAudio() {
  let randomSeed=715;const random=()=>{randomSeed=(Math.imul(randomSeed,1664525)+1013904223)>>>0;return randomSeed/4294967296;};
  let context = null, master = null, wind = null, dread = null, analyser = null;
  let enabled = true, disposed = false, warningAt = -100;
  let sessionActive = false, paused = false, generation = 0;
  let recorder = null, captureDestination = null;
  const cueCounts = Object.create(null);
  const sources = new Map(), ambientSources = new Set();
  const closingContexts = new Set();
  let contextWasCreated = false;
  const meterSamples = new Float32Array(1024);
  const notes = [0, 293.665, 349.228, 440];

  const canPlay = () => Boolean(context && master && !disposed && sessionActive && !paused && enabled && context.state === 'running');

  function releaseSource(source) {
    const nodes = sources.get(source);
    if (!nodes) return;
    sources.delete(source); ambientSources.delete(source);
    source.onended = null;
    for (const node of [source,...nodes]) { try { node.disconnect(); } catch {} }
  }

  function trackSource(source, nodes = [], ambient = false) {
    sources.set(source, nodes);
    if (ambient) ambientSources.add(source);
    source.onended = () => releaseSource(source);
  }

  function silence() {
    if (context && master) {
      // Cancel ramps as well as setting the current value, so no delayed fade can restore sound.
      master.gain.cancelScheduledValues(0);
      master.gain.value = 0;
    }
    for (const source of [...sources.keys()]) {
      try { source.stop(0); } catch {}
      releaseSource(source);
    }
    wind = null; dread = null;
  }

  function suspendContext() {
    const current = context;
    return current && current.state !== 'closed' ? current.suspend().catch(() => {}) : Promise.resolve();
  }

  function closeContext() {
    const ended = context;
    // End the browser's audio output itself, including any recording route.
    // Retrying creates a fresh context from the player's next explicit gesture.
    void stopRecording();
    captureDestination?.stream.getTracks().forEach(track => track.stop());
    for (const node of [master,analyser,captureDestination]) { try { node?.disconnect(); } catch {} }
    context = null; master = null; analyser = null; captureDestination = null;
    if (ended && ended.state !== 'closed') {
      closingContexts.add(ended);
      void ended.close().catch(() => {}).finally(() => closingContexts.delete(ended));
    }
  }

  function tone(frequency, start, duration, volume, type = 'sine', endFrequency = frequency) {
    if (!canPlay()) return;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(1, frequency), start);
    if (endFrequency !== frequency) oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), start + duration);
    envelope.gain.setValueAtTime(.0001, start);
    envelope.gain.exponentialRampToValueAtTime(Math.max(.0002, volume), start + .014);
    envelope.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(envelope); envelope.connect(master);
    trackSource(oscillator, [envelope]);
    oscillator.start(start); oscillator.stop(start + duration + .03);
  }

  function chime(frequency, at, level = .08) {
    tone(frequency, at, 1.55, level);
    tone(frequency * 2.005, at, .9, level * .26);
    tone(frequency * 3, at, .45, level * .08);
  }

  function noiseBurst(at, duration, level, cutoff = 700, type = 'lowpass') {
    if (!canPlay()) return;
    const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = random() * 2 - 1;
    const source = context.createBufferSource(); source.buffer = buffer;
    const filter = context.createBiquadFilter(); filter.type = type; filter.frequency.value = cutoff; filter.Q.value = .65;
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(.0001, at);
    envelope.gain.exponentialRampToValueAtTime(level, at + Math.min(.012, duration * .15));
    envelope.gain.exponentialRampToValueAtTime(.0001, at + duration);
    source.connect(filter); filter.connect(envelope); envelope.connect(master);
    trackSource(source, [filter,envelope]);
    source.start(at); source.stop(at + duration + .02);
  }

  function heartbeat(at, level = .08) {
    tone(72, at, .12, level, 'sine', 40);
    tone(65, at + .18, .11, level * .7, 'sine', 37);
  }

  function startAtmosphere() {
    if (!canPlay() || ambientSources.size) return;
    const length = context.sampleRate * 3;
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const channel = buffer.getChannelData(0);
    let brown = 0;
    for (let i = 0; i < length; i++) {
      brown = (brown + (random() * 2 - 1) * .018) / 1.018;
      channel[i] = brown * 4;
    }
    const source = context.createBufferSource(); source.buffer = buffer; source.loop = true;
    const filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 480; filter.Q.value = .35;
    wind = context.createGain(); wind.gain.value = .085;
    source.connect(filter); filter.connect(wind); wind.connect(master);
    trackSource(source, [filter,wind], true); source.start();
    dread = context.createGain(); dread.gain.value = .002;
    for (const frequency of [47,70.7]) {
      const oscillator = context.createOscillator(); oscillator.frequency.value = frequency;
      oscillator.connect(dread); trackSource(oscillator, [dread], true); oscillator.start();
    }
    dread.connect(master);
  }

  async function unlock() {
    if (disposed || !sessionActive || paused || !enabled) return false;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return false;
    const token = generation;
    try {
      if (!context) {
        context = new AudioContext({latencyHint:'interactive'}); contextWasCreated = true;
        master = context.createGain(); master.gain.value = 0;
        analyser = context.createAnalyser(); analyser.fftSize = meterSamples.length; analyser.smoothingTimeConstant = 0;
        master.connect(analyser); analyser.connect(context.destination);
      }
      const openingContext = context;
      if (openingContext.state === 'suspended') await openingContext.resume();
      // A late browser resume must neither restart a session nor keep muted output open.
      if (context === openingContext && (!sessionActive || paused || !enabled)) await suspendContext();
      return !disposed && sessionActive && !paused && enabled && token === generation && context === openingContext && openingContext.state === 'running';
    } catch { return false; }
  }

  async function resumePlayback(token = generation) {
    if (token !== generation || !sessionActive || paused || !enabled || disposed) return false;
    if (!await unlock() || token !== generation || !canPlay()) return false;
    startAtmosphere();
    master.gain.cancelScheduledValues(0);
    master.gain.value = .65;
    return true;
  }

  async function beginSession() {
    if (disposed) return false;
    if (!sessionActive) {
      generation++; silence(); sessionActive = true; paused = false; warningAt = -100;
    }
    // Retry/resume callers may invoke this twice; only one atmosphere is ever connected.
    if (paused) return true;
    if (!enabled) return false;
    return resumePlayback(generation);
  }

  function stopSession() {
    generation++; sessionActive = false; paused = false;
    silence(); closeContext();
  }

  function setPaused(value) {
    if (!sessionActive || disposed) return Promise.resolve(false);
    const next = Boolean(value);
    if (paused === next) return Promise.resolve(!paused);
    paused = next; generation++; silence();
    return paused ? suspendContext().then(() => true) : resumePlayback(generation);
  }

  function setEnabled(value) {
    const next = Boolean(value);
    if (enabled === next) return;
    enabled = next; generation++; silence();
    if (enabled && sessionActive && !paused) void resumePlayback(generation);
    else void suspendContext();
  }

  function cue(name, value) {
    if (!canPlay()) return;
    const now = context.currentTime;
    cueCounts[name] = (cueCounts[name] || 0) + 1;
    if (name === 'note') chime(notes[Number(value)] || notes[1], now, .13);
    else if (name === 'bell') { chime(523.251, now, .11); chime(783.991, now + .16, .075); }
    else if (name === 'collect') { [349.228,440,587.33].forEach((frequency,index) => chime(frequency, now + index * .17, .055)); }
    else if (name === 'win') { [293.665,349.228,440,587.33].forEach((frequency,index) => chime(frequency, now + index * .3, .065)); }
    else if (name === 'fail') { tone(156,now,1.1,.11,'sine',48); tone(78,now+.12,1.7,.1,'sine',33); }
    else if (name === 'bite') {
      // A close cloth impact and voiced grunt; the heartbeat makes blood loss legible.
      noiseBurst(now, .095, .20, 1100, 'bandpass');
      tone(128, now, .14, .14, 'triangle', 44);
      tone(94, now + .045, .3, .045, 'sawtooth', 53);
      heartbeat(now + .26, .095); heartbeat(now + .93, .065);
    }
    else if (name === 'kick') {
      noiseBurst(now, .18, .14, 850, 'highpass');
      tone(156, now + .015, .13, .04, 'triangle', 62);
    }
    else if (name === 'zombie-down') {
      noiseBurst(now, .11, .22, 540);
      tone(115, now, .27, .17, 'triangle', 28);
      noiseBurst(now + .025, .055, .07, 1600, 'bandpass');
      noiseBurst(now + .14, .18, .09, 700);
      tone(65, now + .12, .2, .075, 'sine', 26);
    }
    else if (name === 'zombie-reform') {
      noiseBurst(now, .5, .065, 640, 'bandpass');
      tone(42, now, .65, .045, 'triangle', 112);
      for (let i = 0; i < 3; i++) noiseBurst(now + .11 + i * .13, .065, .035, 1200 + i * 200, 'bandpass');
    }
    else if (name === 'zombie-alert') {
      tone(104, now, .72, .025, 'sawtooth', 58);
      tone(80, now + .08, .82, .045, 'triangle', 47);
      noiseBurst(now + .08, .65, .025, 380, 'bandpass');
    }
    else if (name === 'escape') { chime(293.665, now, .04); chime(440, now + .2, .027); }
    else if (name === 'warning') {
      if (now - warningAt < 3.8) return;
      warningAt = now; tone(95,now,.65,.075,'sine',77); tone(93.6,now+.09,.76,.055,'sine',74);
    } else if (name === 'step') { tone(95 + random() * 12,now,.055,.026,'triangle',42); }
    else if (name === 'switch') tone(640,now,.028,.011,'triangle',390);
  }

  function update(state = {}, dt = 0) {
    if (!canPlay() || !wind || !dread) return;
    const danger = Math.max(0, Math.min(1, Number(state.danger) || 0));
    dread.gain.setTargetAtTime(state.safe ? .002 : .003 + danger * .038, context.currentTime, .9);
    wind.gain.setTargetAtTime(state.safe ? .055 : .085, context.currentTime, 1.2);
    // Footsteps are emitted by gameplay distance, so collisions cannot play phantom steps.
  }

  async function startRecording() {
    if (disposed || typeof MediaRecorder === 'undefined') return null;
    const token = generation;
    try {
      if (!await unlock() || disposed || token !== generation) return null;
      if (recorder?.state === 'recording') return {recording:true,mimeType:recorder.mimeType};
      if (recorder) await recorder.finished;
      if (disposed || token !== generation || !context || !master) return null;
      if (!captureDestination) {
        captureDestination = context.createMediaStreamDestination();
        master.connect(captureDestination);
      }
      const mimeType = ['audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus'].find(type => MediaRecorder.isTypeSupported(type));
      recorder = new MediaRecorder(captureDestination.stream, mimeType ? {mimeType} : undefined);
      const active = recorder;
      active.chunks = [];
      active.addEventListener('dataavailable', event => { if (event.data.size) active.chunks.push(event.data); });
      // Install finalization before recording so dispose/page exit can stop it safely, too.
      active.finished = new Promise(resolve => {
        active.addEventListener('error', () => { if (recorder === active) recorder = null; resolve(null); }, {once:true});
        active.addEventListener('stop', () => {
          try {
            const blob = new Blob(active.chunks, {type:active.mimeType});
            const reader = new FileReader();
            reader.onload = () => resolve({base64:String(reader.result).split(',')[1],mimeType:blob.type,bytes:blob.size});
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
          } catch { resolve(null); }
        }, {once:true});
      });
      recorder.start(500);
      return {recording:true,mimeType:recorder.mimeType};
    } catch { recorder = null; return null; }
  }

  async function stopRecording() {
    if (!recorder) return null;
    const active = recorder;
    if (active.state !== 'inactive') {
      try { active.stop(); } catch { if (recorder === active) recorder = null; return null; }
    }
    const result = await active.finished;
    if (recorder === active) recorder = null;
    return result;
  }

  function diagnostics() {
    let outputRms = 0;
    if (analyser && context?.state === 'running') {
      analyser.getFloatTimeDomainData(meterSamples);
      for (const sample of meterSamples) outputRms += sample * sample;
      outputRms = Math.sqrt(outputRms / meterSamples.length);
    }
    return {sessionActive,paused,activeSources:sources.size,ambientSources:ambientSources.size,masterGain:master?.gain.value || 0,contextState:disposed ? 'disposed' : context?.state || (closingContexts.size ? 'closing' : contextWasCreated ? 'closed' : 'not-started'),closingContexts:closingContexts.size,enabled,cues:{...cueCounts},recording:recorder?.state === 'recording',outputRms};
  }

  function dispose() {
    if (disposed) return;
    stopSession();
    disposed = true;
  }
  return {unlock,beginSession,stopSession,setPaused,setEnabled,update,cue,dispose,startRecording,stopRecording,diagnostics};
}
