import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';

export const SCENE_DURATIONS = {
  msg1_2: 4500,
  msg3_4: 4500,
  msg5_6: 5000,
  outro: 4000
};

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  msg1_2: Scene1,
  msg3_4: Scene2,
  msg5_6: Scene3,
  outro: Scene4,
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
  const { currentSceneKey, currentScene } = useVideoPlayer({ durations, loop });

  useEffect(() => { onSceneChange?.(currentSceneKey); }, [currentSceneKey, onSceneChange]);

  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '') as keyof typeof SCENE_DURATIONS;
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#050a08] flex items-center justify-center">
      {/* Persistent Phone Mockup */}
      <motion.div 
        className="relative w-[400px] h-[800px] rounded-[45px] border-[12px] border-[#111] bg-bg-dark shadow-2xl overflow-hidden z-10 flex flex-col"
      >
        {/* Phone Header */}
        <div className="bg-[#1f2c27] h-16 w-full flex items-center px-4 gap-3 z-20 shrink-0 shadow-md">
          <div className="flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E9EDEF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            <div className="relative w-10 h-10 rounded-full bg-primary flex items-center justify-center text-bg-dark font-bold text-xl overflow-hidden">
              <img src="https://images.unsplash.com/photo-1594824436968-301481f13218?q=80&w=200&h=200&auto=format&fit=crop" alt="Priya" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <h2 className="font-body font-semibold text-text-primary text-base leading-tight">Clinic Assistant - Priya</h2>
            <p className="text-text-secondary text-xs">online</p>
          </div>
        </div>

        {/* Phone Background */}
        <div className="absolute inset-0 top-16 bg-whatsapp-doodle z-0" />

        {/* Scene Container */}
        <div className="relative flex-1 z-10 p-4 flex flex-col justify-end pb-8">
          <AnimatePresence mode="popLayout">
            {SceneComponent && <SceneComponent key={currentSceneKey} />}
          </AnimatePresence>
        </div>

        {/* Chat Input Area */}
        <div className="bg-[#1f2c27] h-16 w-full flex items-center px-2 gap-2 z-20 shrink-0">
          <div className="flex-1 bg-[#2a3942] rounded-full h-10 flex items-center px-4">
            <p className="text-text-secondary text-sm">Message</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111B21" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
