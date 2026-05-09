import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { sceneTransitions } from '../../lib/video/animations';

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300), // Logo reveals
      setTimeout(() => setPhase(2), 1000), // Tagline
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div className="absolute inset-0 z-30 flex items-center justify-center bg-bg-dark" {...sceneTransitions.crossDissolve}>
      
      {/* Background Pulse */}
      <motion.div 
        className="absolute w-[60vw] h-[60vw] rounded-full blur-[120px] bg-primary/10"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
      />

      <div className="text-center relative z-10 flex flex-col items-center">
        {/* Brand Name */}
        <motion.div
          className="flex items-center gap-4 mb-4"
          initial={{ opacity: 0, y: 40 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-bg-dark)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2Z"/><path d="M12 12 2.1 12"/><path d="M12 12 21.9 21.9"/></svg>
          </div>
          <h1 className="text-6xl font-display font-black text-white tracking-tight">
            A.I'll Handle It
          </h1>
        </motion.div>

        {/* Tagline */}
        <motion.p
          className="text-2xl text-text-secondary font-medium tracking-wide mt-2"
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={phase >= 2 ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(10px)' }}
          transition={{ duration: 0.8 }}
        >
          Your clinic's <span className="text-white">WhatsApp AI receptionist</span>
        </motion.p>
      </div>

    </motion.div>
  );
}