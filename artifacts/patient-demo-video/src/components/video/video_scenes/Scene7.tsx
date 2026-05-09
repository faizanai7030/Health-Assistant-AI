import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene7() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 2500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center text-center px-[5vw] z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div
        className="flex items-center justify-center gap-4 mb-6"
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={phase >= 1 ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.9 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="w-[6vw] h-[6vw] max-w-[60px] max-h-[60px] bg-[#25D366] rounded-xl flex items-center justify-center shadow-[0_0_30px_rgba(37,211,102,0.4)]">
          <svg width="60%" height="60%" viewBox="0 0 24 24" fill="none" stroke="#111B21" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a10 10 0 1 0 10 10H12V2Z"/><path d="M12 12 2.1 12"/><path d="M12 12 21.9 21.9"/>
          </svg>
        </div>
        <h2 className="font-display font-bold text-[5vw] sm:text-[4vw] tracking-tight leading-none text-white">
          A.I'll Handle It
        </h2>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="font-display font-bold text-[6vw] sm:text-[5vw] text-white leading-tight mb-[2vh]">
          You just focus on treatments.
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, filter: 'blur(10px)' }}
        animate={phase >= 3 ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(10px)' }}
        transition={{ duration: 0.8 }}
      >
        <p className="font-body text-[3vw] sm:text-[2vw] text-[#25D366] font-medium tracking-wide">
          WhatsApp AI Receptionist for clinics & hospitals.
        </p>
      </motion.div>
    </motion.div>
  );
}