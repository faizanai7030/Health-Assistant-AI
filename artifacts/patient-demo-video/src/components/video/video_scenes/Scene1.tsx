import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),  // Patient msg
      setTimeout(() => setPhase(2), 1500), // Priya typing
      setTimeout(() => setPhase(3), 3000), // Priya msg
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="flex flex-col gap-3 w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 1 }}
    >
      {/* Patient Msg 1 */}
      {phase >= 1 && (
        <motion.div 
          className="self-end max-w-[85%] relative chat-bubble-right"
          initial={{ opacity: 0, scale: 0.9, y: 10, transformOrigin: 'top right' }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <div className="bg-msg-out rounded-lg rounded-tr-none px-3 py-2 text-[15px] shadow-sm">
            Hi, I need to book an appointment with Dr. Sharma
            <div className="text-[10px] text-text-secondary text-right mt-1 -mb-1">10:42 AM</div>
          </div>
        </motion.div>
      )}

      {/* Priya Typing */}
      {phase === 2 && (
        <motion.div 
          className="self-start max-w-[85%] relative chat-bubble-left"
          initial={{ opacity: 0, scale: 0.9, transformOrigin: 'top left' }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
        >
          <div className="bg-msg-in rounded-lg rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1.5 h-10">
            <motion.div className="w-1.5 h-1.5 bg-text-secondary rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
            <motion.div className="w-1.5 h-1.5 bg-text-secondary rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
            <motion.div className="w-1.5 h-1.5 bg-text-secondary rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
          </div>
        </motion.div>
      )}

      {/* Priya Msg 1 */}
      {phase >= 3 && (
        <motion.div 
          className="self-start max-w-[85%] relative chat-bubble-left"
          initial={{ opacity: 0, scale: 0.9, y: 10, transformOrigin: 'top left' }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <div className="bg-msg-in rounded-lg rounded-tl-none px-3 py-2 text-[15px] shadow-sm text-text-primary leading-snug">
            Hello! I'd be happy to help you book an appointment with Dr. Sharma. Which date works for you?
            <div className="text-[10px] text-text-secondary text-right mt-1 -mb-1">10:42 AM</div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
