import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { sceneTransitions } from '../../lib/video/animations';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400), // typing indicator
      setTimeout(() => setPhase(2), 1200), // AI reply
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div className="absolute inset-0 z-20" {...sceneTransitions.crossDissolve}>
      
      {/* Right Side Graphics */}
      <div className="absolute right-0 w-[55vw] h-full flex flex-col justify-center px-12">
        <motion.h1 
          className="text-[4.5vw] font-display font-bold text-white leading-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          Instant, human-like<br/>
          <span className="text-primary">responses.</span>
        </motion.h1>
      </div>

      {/* Inside Phone Content */}
      <div className="absolute top-1/2 left-[15vw] -translate-y-1/2 w-[340px] h-[600px] mt-10 p-4 flex flex-col gap-4 overflow-hidden pointer-events-none">
        
        {/* Previous Message (Persisted) */}
        <motion.div 
          className="bg-primary rounded-xl rounded-tr-none p-3 self-end max-w-[85%] chat-bubble-right relative shadow-md"
        >
          <p className="text-sm font-body text-bg-dark font-medium">Hi, I want to book an appointment.</p>
          <span className="text-[10px] text-bg-dark/60 absolute bottom-1 right-2">10:00 AM</span>
        </motion.div>

        {/* AI Typing Indicator */}
        <motion.div 
          className="bg-[#1f2c27] rounded-xl rounded-tl-none p-3 self-start w-16 h-10 chat-bubble-left relative shadow-md flex items-center justify-center gap-1"
          initial={{ opacity: 0, scale: 0.8, transformOrigin: 'top left' }}
          animate={phase === 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8, display: 'none' }}
          transition={{ duration: 0.2 }}
        >
          <motion.div className="w-1.5 h-1.5 bg-text-secondary rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
          <motion.div className="w-1.5 h-1.5 bg-text-secondary rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
          <motion.div className="w-1.5 h-1.5 bg-text-secondary rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
        </motion.div>

        {/* AI Reply */}
        <motion.div 
          className="bg-[#1f2c27] rounded-xl rounded-tl-none p-3 pb-5 self-start max-w-[85%] chat-bubble-left relative shadow-md border border-white/5"
          initial={{ opacity: 0, scale: 0.8, y: 20, transformOrigin: 'top left' }}
          animate={phase >= 2 ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.8, y: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <p className="text-sm font-body text-white/90 leading-relaxed">Hello! I'm Priya. I'd be happy to help you book an appointment. Which doctor would you like to see, and what time works best for you today?</p>
          <span className="text-[10px] text-text-secondary absolute bottom-1 right-2">10:00 AM</span>
        </motion.div>

      </div>
    </motion.div>
  );
}