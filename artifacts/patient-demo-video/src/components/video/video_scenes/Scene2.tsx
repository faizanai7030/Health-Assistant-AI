import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

function FloatingLabel({ text, show }: { text: string; show: boolean }) {
  return (
    <motion.div
      className="absolute top-[15%] right-[10%] bg-white/10 backdrop-blur-md border border-white/10 text-white text-[1.5vw] md:text-[1vw] px-[2vw] py-[1vw] rounded-full shadow-xl z-50 whitespace-nowrap"
      initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
      animate={show ? { opacity: 1, x: 0, filter: 'blur(0px)' } : { opacity: 0, x: 20, filter: 'blur(10px)' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {text}
    </motion.div>
  );
}

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),  // Patient msg 1
      setTimeout(() => setPhase(2), 1000), // Priya typing
      setTimeout(() => setPhase(3), 1800), // Priya msg 1
      setTimeout(() => setPhase(4), 2600), // Patient msg 2
      setTimeout(() => setPhase(5), 3200), // Priya typing 2
      setTimeout(() => setPhase(6), 4000), // Priya msg 2
      setTimeout(() => setPhase(7), 4800), // Label shows
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="flex flex-col gap-3 w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <FloatingLabel text="Replies in seconds. 24/7." show={phase >= 7} />

      {/* Patient Msg 1 */}
      {phase >= 1 && (
        <motion.div 
          className="self-end max-w-[85%] relative chat-bubble-right"
          initial={{ opacity: 0, scale: 0.9, y: 10, transformOrigin: 'top right' }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <div className="bg-[#005C4B] rounded-[2vw] rounded-tr-none px-[3vw] py-[2vw] text-[3vw] shadow-sm text-[#E9EDEF]">
            Hi, I need to book an appointment with Dr. Sharma
            <div className="text-[2vw] text-[#8696A0] text-right mt-1 -mb-1">10:42 AM</div>
          </div>
        </motion.div>
      )}

      {/* Priya Typing 1 */}
      {phase === 2 && (
        <motion.div 
          className="self-start max-w-[85%] relative chat-bubble-left"
          initial={{ opacity: 0, scale: 0.9, transformOrigin: 'top left' }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
        >
          <div className="bg-[#1F2C33] rounded-[2vw] rounded-tl-none px-[3vw] py-[2vw] shadow-sm flex items-center gap-[1vw] h-[8vw]">
            <motion.div className="w-[1.5vw] h-[1.5vw] bg-[#8696A0] rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
            <motion.div className="w-[1.5vw] h-[1.5vw] bg-[#8696A0] rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
            <motion.div className="w-[1.5vw] h-[1.5vw] bg-[#8696A0] rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
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
          <div className="bg-[#1F2C33] rounded-[2vw] rounded-tl-none px-[3vw] py-[2vw] text-[3vw] shadow-sm text-[#E9EDEF] leading-snug">
            Hello! Which date and time works for you?
            <div className="text-[2vw] text-[#8696A0] text-right mt-1 -mb-1">10:42 AM</div>
          </div>
        </motion.div>
      )}

      {/* Patient Msg 2 */}
      {phase >= 4 && (
        <motion.div 
          className="self-end max-w-[85%] relative chat-bubble-right"
          initial={{ opacity: 0, scale: 0.9, y: 10, transformOrigin: 'top right' }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <div className="bg-[#005C4B] rounded-[2vw] rounded-tr-none px-[3vw] py-[2vw] text-[3vw] shadow-sm text-[#E9EDEF]">
            Tomorrow morning
            <div className="text-[2vw] text-[#8696A0] text-right mt-1 -mb-1">10:43 AM</div>
          </div>
        </motion.div>
      )}

      {/* Priya Typing 2 */}
      {phase === 5 && (
        <motion.div 
          className="self-start max-w-[85%] relative chat-bubble-left"
          initial={{ opacity: 0, scale: 0.9, transformOrigin: 'top left' }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
        >
          <div className="bg-[#1F2C33] rounded-[2vw] rounded-tl-none px-[3vw] py-[2vw] shadow-sm flex items-center gap-[1vw] h-[8vw]">
            <motion.div className="w-[1.5vw] h-[1.5vw] bg-[#8696A0] rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
            <motion.div className="w-[1.5vw] h-[1.5vw] bg-[#8696A0] rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
            <motion.div className="w-[1.5vw] h-[1.5vw] bg-[#8696A0] rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
          </div>
        </motion.div>
      )}

      {/* Priya Msg 2 */}
      {phase >= 6 && (
        <motion.div 
          className="self-start max-w-[90%] relative chat-bubble-left"
          initial={{ opacity: 0, scale: 0.9, y: 10, transformOrigin: 'top left' }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <div className="bg-[#1F2C33] rounded-[2vw] rounded-tl-none p-[1vw] shadow-sm text-[#E9EDEF] leading-snug w-[60vw]">
            <div className="bg-[#182229] rounded-[1vw] p-[3vw] mb-[1vw]">
              <h3 className="font-bold text-white text-[3vw] mb-[1vw] flex items-center gap-[1.5vw]">
                <span className="text-[#25D366]">✅</span> Confirmed!
              </h3>
              <p className="text-[2vw] text-[#8696A0] mb-[2vw]">City Care Clinic</p>
              <div className="space-y-[1.5vw] mt-[2vw]">
                <div className="flex gap-[2vw] text-[2.5vw]">
                  <span className="text-[#8696A0] w-[12vw] shrink-0">Doctor</span>
                  <span className="text-white font-medium">Dr. Sharma</span>
                </div>
                <div className="flex gap-[2vw] text-[2.5vw]">
                  <span className="text-[#8696A0] w-[12vw] shrink-0">Time</span>
                  <span className="text-white">Tomorrow, 10:30 AM</span>
                </div>
                <div className="flex gap-[2vw] text-[2.5vw]">
                  <span className="text-[#8696A0] w-[12vw] shrink-0">Token</span>
                  <span className="text-[#25D366] font-bold text-[3vw]">#7</span>
                </div>
              </div>
            </div>
            <div className="text-[2vw] text-[#8696A0] text-right px-[2vw] pb-[1vw]">10:44 AM</div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}