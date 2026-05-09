import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';
import { Scene6 } from './video_scenes/Scene6';
import { Scene7 } from './video_scenes/Scene7';

export const SCENE_DURATIONS = {
  hook: 6000,
  whatsapp: 26000,
  dashboard: 9000,
  doctors: 9000,
  portal: 15000,
  reminders: 9000,
  outro: 8000,
};

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  hook: Scene1,
  whatsapp: Scene2,
  dashboard: Scene3,
  doctors: Scene4,
  portal: Scene5,
  reminders: Scene6,
  outro: Scene7,
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
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey] || Scene1;

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-[#050a08] flex items-center justify-center font-body text-white">
      {/* Background layer */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div className="absolute w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #25D366, transparent)' }}
          animate={{
            x: ['-20%', '40%', '10%'],
            y: ['0%', '30%', '-10%'],
            scale: [1, 1.2, 0.8],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div className="absolute w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] rounded-full opacity-[0.07] blur-3xl right-0 bottom-0"
          style={{ background: 'radial-gradient(circle, #8696A0, transparent)' }}
          animate={{
            x: ['10%', '-20%', '5%'],
            y: ['-10%', '-30%', '0%'],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      <AnimatePresence mode="popLayout">
        <SceneComponent key={currentSceneKey} />
      </AnimatePresence>
    </div>
  );
}