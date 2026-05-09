import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 600),
      setTimeout(() => setPhase(2), 1400),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center text-center px-[5vw] z-10"
      {...sceneTransitions.fadeBlur}
    >
      <motion.div
        className="flex items-center justify-center gap-4 mb-6"
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="w-[8vw] h-[8vw] max-w-[80px] max-h-[80px] bg-[#25D366] rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(37,211,102,0.3)]">
          <svg width="60%" height="60%" viewBox="0 0 24 24" fill="none" stroke="#111B21" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a10 10 0 1 0 10 10H12V2Z"/><path d="M12 12 2.1 12"/><path d="M12 12 21.9 21.9"/>
          </svg>
        </div>
        <h1 className="font-display font-bold text-[8vw] sm:text-[6vw] tracking-tight leading-none text-white">
          A.I'll Handle It
        </h1>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, filter: 'blur(10px)', y: 20 }}
        animate={phase >= 1 ? { opacity: 1, filter: 'blur(0px)', y: 0 } : { opacity: 0, filter: 'blur(10px)', y: 20 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="font-body text-[4vw] sm:text-[3vw] md:text-[2vw] text-[#8696A0] font-medium tracking-wide">
          You just focus on treatments.
        </p>
      </motion.div>
    </motion.div>
  );
}
