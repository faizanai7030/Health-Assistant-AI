import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

function FloatingLabel({ text, show }: { text: string; show: boolean }) {
  return (
    <motion.div
      className="absolute top-[15%] right-[10%] bg-white/10 backdrop-blur-md border border-white/10 text-white text-[3.2vw] px-[3vw] py-[1.4vw] rounded-full shadow-xl z-50 whitespace-nowrap"
      initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
      animate={show ? { opacity: 1, x: 0, filter: 'blur(0px)' } : { opacity: 0, x: 20, filter: 'blur(10px)' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {text}
    </motion.div>
  );
}

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),  // Show initial doctors
      setTimeout(() => setPhase(2), 1200), // Slide in new doctor
      setTimeout(() => setPhase(3), 2200), // Show edit controls
      setTimeout(() => setPhase(4), 3000), // Show label
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <FloatingLabel text="Add doctors. Set schedules. Done." show={phase >= 4} />

      <div className="w-[80vw] h-[45vw] bg-[#0f1923] rounded-2xl border border-[#1e2a35] shadow-2xl overflow-hidden flex flex-col relative">
        <div className="h-[4vw] bg-[#0a1118] border-b border-[#1e2a35] flex items-center px-[2vw] justify-between">
          <div className="flex gap-[0.5vw]">
            <div className="w-[1vw] h-[1vw] rounded-full bg-[#ff5f57]" />
            <div className="w-[1vw] h-[1vw] rounded-full bg-[#febc2e]" />
            <div className="w-[1vw] h-[1vw] rounded-full bg-[#28c840]" />
          </div>
          <div className="text-[1.2vw] text-[#8696A0] font-medium">Doctors Management</div>
        </div>

        <div className="flex-1 p-[3vw] flex gap-[2vw]">
          {/* Doctor 1 */}
          <motion.div 
            className="flex-1 bg-[#1e2a35]/50 border border-[#1e2a35] rounded-xl p-[2vw] flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <div className="w-[4vw] h-[4vw] bg-[#2a3942] rounded-full mb-[1vw]" />
            <div className="text-[1.5vw] text-white font-bold mb-[0.5vw]">Dr. Sharma</div>
            <div className="text-[1.2vw] text-[#8696A0] mb-[2vw]">General Physician</div>
            <div className="text-[1vw] text-white bg-[#0a1118] p-[1vw] rounded-lg border border-[#1e2a35]">
              9:00 AM - 5:00 PM
            </div>
          </motion.div>

          {/* Doctor 2 */}
          <motion.div 
            className="flex-1 bg-[#1e2a35]/50 border border-[#1e2a35] rounded-xl p-[2vw] flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="w-[4vw] h-[4vw] bg-[#2a3942] rounded-full mb-[1vw]" />
            <div className="text-[1.5vw] text-white font-bold mb-[0.5vw]">Dr. Mehta</div>
            <div className="text-[1.2vw] text-[#8696A0] mb-[2vw]">Pediatrician</div>
            <div className="text-[1vw] text-white bg-[#0a1118] p-[1vw] rounded-lg border border-[#1e2a35]">
              10:00 AM - 4:00 PM
            </div>
          </motion.div>

          {/* New Doctor */}
          <motion.div 
            className="flex-1 bg-[#25D366]/10 border border-[#25D366]/30 rounded-xl p-[2vw] flex flex-col relative overflow-hidden"
            initial={{ opacity: 0, x: 50 }}
            animate={phase >= 2 ? { opacity: 1, x: 0 } : {}}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div className="w-[4vw] h-[4vw] bg-[#25D366]/20 rounded-full mb-[1vw]" />
            <div className="text-[1.5vw] text-white font-bold mb-[0.5vw]">Dr. Al-Hassan</div>
            <div className="text-[1.2vw] text-[#25D366] mb-[2vw]">Cardiologist</div>
            
            <motion.div 
              className="flex flex-col gap-[0.5vw]"
              initial={{ opacity: 0, height: 0 }}
              animate={phase >= 3 ? { opacity: 1, height: 'auto' } : {}}
            >
              <div className="flex justify-between text-[1vw] text-white bg-[#0a1118] p-[1vw] rounded-lg border border-[#25D366]/30">
                <span className="text-[#8696A0]">Hours</span>
                <span>9AM - 5PM</span>
              </div>
              <div className="flex justify-between text-[1vw] text-white bg-[#0a1118] p-[1vw] rounded-lg border border-[#25D366]/30">
                <span className="text-[#8696A0]">Slot Time</span>
                <span>15 min</span>
              </div>
              <div className="flex justify-between text-[1vw] text-white bg-[#0a1118] p-[1vw] rounded-lg border border-[#25D366]/30">
                <span className="text-[#8696A0]">Max Patients</span>
                <span>3 per slot</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}