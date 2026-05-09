let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let isPlaying = false;
const nodes: AudioNode[] = [];

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function makePad(freq: number, gain: number, detune = 0) {
  const c = getCtx();
  const osc = c.createOscillator();
  const g = c.createGain();
  const filter = c.createBiquadFilter();

  osc.type = 'sine';
  osc.frequency.value = freq;
  osc.detune.value = detune;

  filter.type = 'lowpass';
  filter.frequency.value = freq * 3.5;
  filter.Q.value = 0.8;

  g.gain.setValueAtTime(0, c.currentTime);
  g.gain.linearRampToValueAtTime(gain, c.currentTime + 3.5);

  osc.connect(filter);
  filter.connect(g);
  g.connect(masterGain!);
  osc.start();

  nodes.push(osc, g, filter);
  return osc;
}

function makeLFO(target: AudioParam, rate: number, depth: number, center: number) {
  const c = getCtx();
  const lfo = c.createOscillator();
  const lfoGain = c.createGain();
  lfo.type = 'sine';
  lfo.frequency.value = rate;
  lfoGain.gain.value = depth;
  target.value = center;
  lfo.connect(lfoGain);
  lfoGain.connect(target);
  lfo.start();
  nodes.push(lfo, lfoGain);
}

export function startAmbientMusic(muted = false) {
  if (isPlaying) return;
  const c = getCtx();
  if (c.state === 'suspended') c.resume();

  masterGain = c.createGain();
  masterGain.gain.value = muted ? 0 : 0.18;
  masterGain.connect(c.destination);

  // Bass drone — A2
  const bass = makePad(110, 0.45);
  makeLFO(bass.frequency, 0.07, 1.2, 110);

  // Mid pad — A3
  const mid = makePad(220, 0.22, -8);
  makeLFO(mid.frequency, 0.11, 0.8, 220);

  // Mid pad — E3 (fifth)
  const fifth = makePad(165, 0.18, 5);
  makeLFO(fifth.frequency, 0.09, 0.6, 165);

  // High shimmer — A4
  const high = makePad(440, 0.07, 3);
  makeLFO(high.frequency, 0.13, 1.5, 440);

  // Very subtle high overtone
  makePad(660, 0.04, -4);

  isPlaying = true;
}

export function stopAmbientMusic() {
  if (!isPlaying || !masterGain || !ctx) return;
  const c = ctx;
  masterGain.gain.linearRampToValueAtTime(0, c.currentTime + 1.5);
  setTimeout(() => {
    nodes.forEach(n => { try { n.disconnect(); } catch { /* ignore */ } });
    nodes.length = 0;
    masterGain = null;
    isPlaying = false;
  }, 1600);
}

export function setMuted(muted: boolean) {
  if (!masterGain || !ctx) return;
  const c = ctx;
  masterGain.gain.cancelScheduledValues(c.currentTime);
  masterGain.gain.setValueAtTime(masterGain.gain.value, c.currentTime);
  masterGain.gain.linearRampToValueAtTime(muted ? 0 : 0.18, c.currentTime + 0.4);
}

export function resumeCtx() {
  if (ctx?.state === 'suspended') ctx.resume();
}
