import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';

export const SCENE_DURATIONS = {
  hook: 2000,
  reply: 3000,
  booking: 3000,
  confirmation: 4000,
  outro: 3000
};

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  hook: Scene1,
  reply: Scene2,
  booking: Scene3,
  confirmation: Scene4,
  outro: Scene5,
};

export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  onSceneChange,
}: {
  durations?: Record<string, number>;
  loop?: boolean;
  onSceneChange?: (sceneKey: string) => void;
} = {}) {
  const { currentSceneKey } = useVideoPlayer({ durations, loop });

  useEffect(() => { onSceneChange?.(currentSceneKey); }, [currentSceneKey, onSceneChange]);

  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '') as keyof typeof SCENE_DURATIONS;
  const sceneIndex = Object.keys(SCENE_DURATIONS).indexOf(baseSceneKey);
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-bg-dark">
      {/* Persistent Background */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute w-[800px] h-[800px] rounded-full blur-[100px] opacity-20"
          style={{ background: 'radial-gradient(circle, var(--color-secondary), transparent)' }}
          animate={{ x: ['-20%', '20%', '-10%'], y: ['-10%', '30%', '10%'], scale: [1, 1.2, 0.9] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full blur-[80px] opacity-10 right-0 bottom-0"
          style={{ background: 'radial-gradient(circle, var(--color-primary), transparent)' }}
          animate={{ x: ['10%', '-20%', '0%'], y: ['10%', '-30%', '20%'] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />
      </div>

      {/* Persistent Phone Mockup (Scenes 0-3) */}
      <motion.div
        className="absolute top-1/2 -translate-y-1/2 w-[340px] h-[680px] rounded-[40px] border-[8px] border-bg-muted bg-[#0c1411] shadow-2xl overflow-hidden z-10 flex flex-col"
        animate={{
          left: sceneIndex < 4 ? '15vw' : '50vw',
          x: sceneIndex < 4 ? 0 : '-50%',
          opacity: sceneIndex < 4 ? 1 : 0,
          scale: sceneIndex < 4 ? 1 : 0.8
        }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Phone Header */}
        <div className="bg-[#1f2c27] h-20 w-full flex items-center px-4 gap-3 z-20 shrink-0">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-bg-dark font-bold text-xl">
            P
          </div>
          <div>
            <h2 className="font-display font-semibold text-white text-lg leading-tight">Priya (AI)</h2>
            <p className="text-primary text-xs font-medium">online</p>
          </div>
        </div>

        {/* Phone Background */}
        <div className="absolute inset-0 top-20 bg-[#0c1411] z-0 opacity-50" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23128C7E\' fill-opacity=\'0.1\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")' }} />
      </motion.div>

      {/* Persistent Foreground Content for Right Side (Scenes 0-3) */}
      <motion.div
        className="absolute right-0 w-[55vw] h-full flex flex-col justify-center px-12 z-10"
        animate={{
          opacity: sceneIndex < 4 ? 1 : 0,
          x: sceneIndex < 4 ? 0 : 100
        }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
      </motion.div>

      <AnimatePresence mode="popLayout">
        {SceneComponent && <SceneComponent key={currentSceneKey} />}
      </AnimatePresence>
    </div>
  );
}
