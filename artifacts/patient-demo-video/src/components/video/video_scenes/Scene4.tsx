import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { sceneTransitions } from '../../lib/video/animations';

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500), // Card pops in
      setTimeout(() => setPhase(2), 2500), // Exit transition starts
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div className="absolute inset-0 z-20" {...sceneTransitions.crossDissolve}>
      
      {/* Right Side Graphics */}
      <div className="absolute right-0 w-[55vw] h-full flex flex-col justify-center px-12">
        <motion.h1 
          className="text-[5vw] font-display font-black text-white leading-tight tracking-tight"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          Booking<br/>
          <span className="text-primary relative inline-block">
            Confirmed.
            <motion.div 
              className="absolute -bottom-2 left-0 h-2 bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
            />
          </span>
        </motion.h1>
      </div>

      {/* Inside Phone Content */}
      <div className="absolute top-1/2 left-[15vw] -translate-y-1/2 w-[340px] h-[600px] mt-10 p-4 flex flex-col gap-4 overflow-hidden pointer-events-none justify-end pb-10">
        
        {/* Patient Reply (Persisted) */}
        <motion.div 
          className="bg-primary rounded-xl rounded-tr-none p-3 pb-4 self-end max-w-[85%] chat-bubble-right relative shadow-md opacity-50 blur-[1px]"
        >
          <p className="text-sm font-body text-bg-dark font-medium">Dr. Sharma at 5 PM please.</p>
        </motion.div>

        {/* Confirmation Card */}
        <motion.div 
          className="bg-white rounded-2xl p-4 self-start w-[95%] shadow-2xl relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.8, y: 40, rotateX: 20, transformPerspective: 800 }}
          animate={phase >= 1 ? { opacity: 1, scale: 1, y: 0, rotateX: 0 } : { opacity: 0, scale: 0.8, y: 40, rotateX: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
          
          <div className="flex items-center gap-3 mb-4 mt-2">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            </div>
            <div>
              <h3 className="font-display font-bold text-bg-dark text-lg">Confirmed</h3>
              <p className="text-text-muted text-xs">Token #A-42</p>
            </div>
          </div>

          <div className="space-y-3 border-t border-gray-100 pt-3">
            <div className="flex justify-between items-center">
              <span className="text-text-muted text-sm font-medium">Doctor</span>
              <span className="text-bg-dark font-semibold text-sm">Dr. Sharma</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-muted text-sm font-medium">Time</span>
              <span className="text-primary font-bold text-sm bg-primary/10 px-2 py-0.5 rounded">5:00 PM</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-muted text-sm font-medium">Date</span>
              <span className="text-bg-dark font-semibold text-sm">Today</span>
            </div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}