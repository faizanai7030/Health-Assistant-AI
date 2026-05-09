import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { sceneTransitions } from '../../lib/video/animations';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300), // First message appears
      setTimeout(() => setPhase(2), 1000), // Second message appears
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
          Never miss<br/>another booking.
        </motion.h1>
      </div>

      {/* Inside Phone Content */}
      <div className="absolute top-1/2 left-[15vw] -translate-y-1/2 w-[340px] h-[600px] mt-10 p-4 flex flex-col gap-4 overflow-hidden pointer-events-none">
        <motion.div 
          className="bg-primary rounded-xl rounded-tr-none p-3 self-end max-w-[85%] chat-bubble-right relative shadow-md"
          initial={{ opacity: 0, scale: 0.8, y: 20, transformOrigin: 'top right' }}
          animate={phase >= 1 ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.8, y: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <p className="text-sm font-body text-bg-dark font-medium">Hi, I want to book an appointment.</p>
          <span className="text-[10px] text-bg-dark/60 absolute bottom-1 right-2">10:00 AM</span>
        </motion.div>
      </div>
    </motion.div>
  );
}