import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),  // Patient msg
      setTimeout(() => setPhase(2), 1500), // Priya typing
      setTimeout(() => setPhase(3), 3000), // Priya card
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="flex flex-col gap-3 w-full"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Persisted earlier messages */}
      <motion.div className="self-end max-w-[85%] relative chat-bubble-right">
        <div className="bg-msg-out rounded-lg rounded-tr-none px-3 py-2 text-[15px] shadow-sm">
          Tomorrow morning if possible
          <div className="text-[10px] text-text-secondary text-right mt-1 -mb-1">10:43 AM</div>
        </div>
      </motion.div>
      <motion.div className="self-start max-w-[85%] relative chat-bubble-left">
        <div className="bg-msg-in rounded-lg rounded-tl-none px-3 py-2 text-[15px] shadow-sm text-text-primary leading-snug">
          Great! Dr. Sharma has a slot available tomorrow at 10:30 AM. Shall I confirm the booking?
          <div className="text-[10px] text-text-secondary text-right mt-1 -mb-1">10:43 AM</div>
        </div>
      </motion.div>

      {/* Patient Msg — Yes please */}
      <motion.div
        className="self-end max-w-[85%] relative chat-bubble-right"
        initial={{ opacity: 0, scale: 0.9, y: 10, transformOrigin: 'top right' }}
        animate={phase >= 1 ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.9, y: 10 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        <div className="bg-msg-out rounded-lg rounded-tr-none px-3 py-2 text-[15px] shadow-sm">
          Yes please
          <div className="text-[10px] text-text-secondary text-right mt-1 -mb-1">10:44 AM</div>
        </div>
      </motion.div>

      {/* Priya Typing */}
      <motion.div
        className="self-start max-w-[85%] relative chat-bubble-left"
        initial={{ opacity: 0, scale: 0.9, transformOrigin: 'top left' }}
        animate={phase === 2 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
      >
        <div className="bg-msg-in rounded-lg rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1.5 h-10">
          <motion.div className="w-1.5 h-1.5 bg-text-secondary rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
          <motion.div className="w-1.5 h-1.5 bg-text-secondary rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
          <motion.div className="w-1.5 h-1.5 bg-text-secondary rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
        </div>
      </motion.div>

      {/* Booking Confirmation Card */}
      <motion.div
        className="self-start max-w-[90%] relative chat-bubble-left"
        initial={{ opacity: 0, scale: 0.9, y: 10, transformOrigin: 'top left' }}
        animate={phase >= 3 ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.9, y: 10 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        <div className="bg-msg-in rounded-lg rounded-tl-none p-1 shadow-sm text-text-primary leading-snug w-64">
          <div className="bg-[#182229] rounded p-3 mb-1">
            <h3 className="font-bold text-white text-[15px] mb-1 flex items-center gap-1.5">
              <span className="text-[#25D366]">✅</span> Appointment Confirmed!
            </h3>
            <p className="text-xs text-text-secondary mb-2">City Care Clinic</p>
            <div className="space-y-1.5 mt-2">
              <div className="flex gap-2 text-sm">
                <span className="text-text-secondary w-14 shrink-0">Doctor</span>
                <span className="text-white font-medium">Dr. Sharma</span>
              </div>
              <div className="flex gap-2 text-sm">
                <span className="text-text-secondary w-14 shrink-0">Time</span>
                <span className="text-white">Tomorrow, 10:30 AM</span>
              </div>
              <div className="flex gap-2 text-sm">
                <span className="text-text-secondary w-14 shrink-0">Token</span>
                <span className="text-[#25D366] font-bold text-base">#7</span>
              </div>
            </div>
          </div>
          <div className="text-[10px] text-text-secondary text-right px-2 pb-1">10:44 AM</div>
        </div>
      </motion.div>
    </motion.div>
  );
}
