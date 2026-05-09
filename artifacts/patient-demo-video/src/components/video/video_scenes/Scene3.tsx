import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { sceneTransitions } from '../../lib/video/animations';

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300), // Patient reply
      setTimeout(() => setPhase(2), 1200), // AI processing / Calendar
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div className="absolute inset-0 z-20" {...sceneTransitions.crossDissolve}>
      
      {/* Right Side Graphics */}
      <div className="absolute right-0 w-[55vw] h-full flex flex-col justify-center px-12">
        <motion.h1 
          className="text-[4vw] font-display font-bold text-white leading-tight relative"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          Checks availability<br/>
          <span className="text-primary">in seconds.</span>
          
          {/* Calendar Animation Graphic */}
          <motion.div 
            className="absolute top-0 right-[10%] w-32 h-32"
            initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
            animate={phase >= 2 ? { opacity: 1, scale: 1, rotate: 0 } : { opacity: 0, scale: 0.5, rotate: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <div className="w-full h-full bg-[#16241e] border-2 border-primary/30 rounded-2xl p-3 flex flex-col gap-2 shadow-2xl">
              <div className="flex justify-between items-center px-1">
                <div className="w-8 h-2 bg-primary/50 rounded-full" />
                <div className="w-4 h-4 bg-primary rounded-sm" />
              </div>
              <div className="grid grid-cols-4 gap-1.5 mt-2">
                {[...Array(12)].map((_, i) => (
                  <motion.div 
                    key={i} 
                    className={`h-4 rounded-sm ${i === 6 ? 'bg-primary' : 'bg-white/5'}`}
                    initial={{ scale: 0 }}
                    animate={phase >= 2 ? { scale: 1 } : { scale: 0 }}
                    transition={{ delay: 0.2 + (i * 0.05) }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </motion.h1>
      </div>

      {/* Inside Phone Content - Shifted up */}
      <div className="absolute top-1/2 left-[15vw] -translate-y-1/2 w-[340px] h-[600px] mt-10 p-4 flex flex-col gap-4 overflow-hidden pointer-events-none justify-end pb-20">
        
        {/* AI Reply (Persisted but shifted) */}
        <motion.div 
          className="bg-[#1f2c27] rounded-xl rounded-tl-none p-3 pb-5 self-start max-w-[85%] chat-bubble-left relative shadow-md border border-white/5"
          initial={{ y: 50 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-sm font-body text-white/90 leading-relaxed">Hello! I'm Priya. I'd be happy to help you book an appointment. Which doctor would you like to see, and what time works best for you today?</p>
          <span className="text-[10px] text-text-secondary absolute bottom-1 right-2">10:00 AM</span>
        </motion.div>

        {/* Patient Reply */}
        <motion.div 
          className="bg-primary rounded-xl rounded-tr-none p-3 pb-4 self-end max-w-[85%] chat-bubble-right relative shadow-md"
          initial={{ opacity: 0, scale: 0.8, y: 20, transformOrigin: 'top right' }}
          animate={phase >= 1 ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.8, y: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <p className="text-sm font-body text-bg-dark font-medium">Dr. Sharma at 5 PM please.</p>
          <span className="text-[10px] text-bg-dark/60 absolute bottom-1 right-2">10:01 AM</span>
        </motion.div>

      </div>
    </motion.div>
  );
}