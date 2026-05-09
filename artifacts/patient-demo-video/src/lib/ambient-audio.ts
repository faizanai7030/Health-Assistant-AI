let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let isPlaying = false;
const nodes: AudioNode[] = [];

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function addOsc(freq: number, type: OscillatorType, gain: number, detune = 0) {
  const c = getCtx();
  const osc = c.createOscillator();
  const g = c.createGain();

  osc.type = type;
  osc.frequency.value = freq;
  osc.detune.value = detune;

  g.gain.setValueAtTime(0, c.currentTime);
  g.gain.linearRampToValueAtTime(gain, c.currentTime + 0.8);

  osc.connect(g);
  g.connect(masterGain!);
  osc.start();

  nodes.push(osc, g);
}

function addLFO(target: AudioParam, rate: number, depth: number) {
  const c = getCtx();
  const lfo = c.createOscillator();
  const lfoG = c.createGain();
  lfo.type = 'sine';
  lfo.frequency.value = rate;
  lfoG.gain.value = depth;
  lfo.connect(lfoG);
  lfoG.connect(target);
  lfo.start();
  nodes.push(lfo, lfoG);
}

export function startAmbientMusic() {
  if (isPlaying) return;
  const c = getCtx();
  if (c.state === 'suspended') c.resume();

  masterGain = c.createGain();
  masterGain.gain.value = 0;
  masterGain.gain.linearRampToValueAtTime(0.35, c.currentTime + 1.0);
  masterGain.connect(c.destination);

  // Deep bass root — A1
  addOsc(55,  'triangle', 0.55);
  addOsc(55,  'sine',     0.30, 7);

  // Mid harmony — A2
  addOsc(110, 'triangle', 0.30);
  addOsc(110, 'sine',     0.20, -6);

  // Fifth above — E3
  addOsc(165, 'triangle', 0.18);

  // Octave — A3
  addOsc(220, 'sine',     0.12, 4);

  // High shimmer — A4
  addOsc(440, 'sine',     0.06, -3);

  // Slow LFO on master gain for breathing effect
  addLFO(masterGain.gain, 0.08, 0.04);

  isPlaying = true;
}

export function stopAmbientMusic() {
  if (!isPlaying || !masterGain || !ctx) return;
  masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2);
  setTimeout(() => {
    nodes.forEach(n => { try { n.disconnect(); } catch { /**/ } });
    nodes.length = 0;
    masterGain = null;
    isPlaying = false;
  }, 1300);
}

export function setMutedAudio(muted: boolean) {
  if (!masterGain || !ctx) return;
  masterGain.gain.cancelScheduledValues(ctx.currentTime);
  masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
  masterGain.gain.linearRampToValueAtTime(muted ? 0 : 0.35, ctx.currentTime + 0.3);
}

export function resumeCtx() {
  if (ctx?.state === 'suspended') ctx.resume();
}

export function isAudioPlaying() {
  return isPlaying;
}
