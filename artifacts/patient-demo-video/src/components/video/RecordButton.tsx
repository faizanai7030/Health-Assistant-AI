import { useState, useRef, useCallback } from 'react';
import { Download, Circle, Square } from 'lucide-react';

const TOTAL_DURATION_MS = 106_000; // hook+pain+whatsapp+dashboard+doctors+portal+reminders+outro

type State = 'idle' | 'waiting' | 'recording' | 'done' | 'error';

interface Props {
  onRequestReset: () => void;
}

export function RecordButton({ onRequestReset }: Props) {
  const [state, setState] = useState<State>('idle');
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timerRef.current = null;
    intervalRef.current = null;
  }, []);

  const startRecording = useCallback(async () => {
    setState('waiting');
    chunksRef.current = [];
    setProgress(0);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: 1280, height: 720, frameRate: 30 },
        audio: false,
        // @ts-expect-error — Chrome-only option to pre-select current tab
        preferCurrentTab: true,
      });
    } catch {
      setState('error');
      return;
    }

    // User granted — reset video to scene 1 then start recording
    onRequestReset();
    setState('recording');
    setProgress(0);

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';

    const recorder = new MediaRecorder(stream, { mimeType });
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      stream.getTracks().forEach(t => t.stop());
      cleanup();
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setState('done');
    };

    recorder.start(500);

    const start = performance.now();
    intervalRef.current = setInterval(() => {
      setProgress(Math.min(1, (performance.now() - start) / TOTAL_DURATION_MS));
    }, 200);

    timerRef.current = setTimeout(() => {
      if (recorder.state !== 'inactive') recorder.stop();
    }, TOTAL_DURATION_MS + 1000);
  }, [onRequestReset, cleanup]);

  const stopEarly = useCallback(() => {
    cleanup();
    if (recorderRef.current?.state !== 'inactive') recorderRef.current?.stop();
  }, [cleanup]);

  const triggerDownload = useCallback(() => {
    if (!downloadUrl) return;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = 'clinic-ai-demo.webm';
    a.click();
  }, [downloadUrl]);

  if (state === 'idle') {
    return (
      <button
        onClick={startRecording}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 text-sm font-medium hover:bg-white/20 hover:text-white transition-all"
        title="Record this video and download it as a file"
      >
        <Download className="w-4 h-4" />
        Download Video
      </button>
    );
  }

  if (state === 'waiting') {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/60 text-sm">
        <Circle className="w-4 h-4 animate-pulse text-red-400" />
        Share this tab when prompted…
      </div>
    );
  }

  if (state === 'recording') {
    const pct = Math.round(progress * 100);
    return (
      <button
        onClick={stopEarly}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 border border-red-400/40 text-red-300 text-sm font-medium hover:bg-red-500/30 transition-all"
        title="Stop recording early"
      >
        <Square className="w-4 h-4 fill-red-400" />
        Recording… {pct}%
      </button>
    );
  }

  if (state === 'done' && downloadUrl) {
    return (
      <button
        onClick={triggerDownload}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-400/40 text-green-300 text-sm font-medium hover:bg-green-500/30 transition-all animate-pulse"
        title="Click to download your video"
      >
        <Download className="w-4 h-4" />
        Save Video
      </button>
    );
  }

  if (state === 'error') {
    return (
      <button
        onClick={() => setState('idle')}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 border border-orange-400/40 text-orange-300 text-sm font-medium hover:bg-orange-500/30 transition-all"
      >
        Screen share cancelled — try again
      </button>
    );
  }

  return null;
}
