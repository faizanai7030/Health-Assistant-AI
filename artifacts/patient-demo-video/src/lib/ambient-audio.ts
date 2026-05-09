const TRACK_URL =
  'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Digital%20Lemonade.mp3';

let audio: HTMLAudioElement | null = null;

export function startAmbientMusic() {
  if (audio) return;
  audio = new Audio(TRACK_URL);
  audio.loop = true;
  audio.volume = 0.35;
  audio.play().catch(() => {
    // Browser blocked autoplay — will retry on next user gesture
  });
}

export function setMutedAudio(muted: boolean) {
  if (!audio) return;
  audio.volume = muted ? 0 : 0.35;
}

export function resumeCtx() {
  if (audio && audio.paused) {
    audio.play().catch(() => {});
  }
}

export function isAudioPlaying() {
  return !!audio && !audio.paused;
}
