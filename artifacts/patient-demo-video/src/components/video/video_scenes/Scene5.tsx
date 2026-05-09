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

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),  // Show schedule
      setTimeout(() => setPhase(2), 1500), // Tap button
      setTimeout(() => setPhase(3), 2200), // Show AI banner
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
      <FloatingLabel text="Doctor runs late? One tap. AI handles it." show={phase >= 4} />

      <div className="w-[35vw] h-[70vw] max-w-[400px] max-h-[800px] bg-[#0a1118] rounded-[3vw] border-[0.8vw] border-[#1e2a35] shadow-2xl overflow-hidden flex flex-col relative">
        <div className="p-[3vw] bg-[#0f1923] border-b border-[#1e2a35]">
          <h2 className="text-[2.5vw] md:text-[20px] text-white font-bold">Dr. Sharma</h2>
          <p className="text-[1.5vw] md:text-[12px] text-[#8696A0]">Today's Schedule</p>
        </div>

        <div className="flex-1 p-[3vw] flex flex-col gap-[2vw]">
          <motion.div 
            className="bg-[#1e2a35]/50 border border-[#1e2a35] rounded-xl p-[2vw] flex justify-between items-center"
            initial={{ opacity: 0, y: 10 }}
            animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
          >
            <div>
              <div className="text-[2vw] md:text-[16px] text-white font-medium">Token #3</div>
              <div className="text-[1.5vw] md:text-[12px] text-[#8696A0]">10:00 AM</div>
            </div>
            <div className="text-[#4ade80] text-[1.5vw] md:text-[12px]">Completed</div>
          </motion.div>

          <motion.div 
            className="bg-[#1e2a35]/50 border border-[#1e2a35] rounded-xl p-[2vw] flex justify-between items-center"
            initial={{ opacity: 0, y: 10 }}
            animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
          >
            <div>
              <div className="text-[2vw] md:text-[16px] text-white font-medium">Token #5</div>
              <div className="text-[1.5vw] md:text-[12px] text-[#8696A0]">10:15 AM</div>
            </div>
            <div className="text-[#facc15] text-[1.5vw] md:text-[12px]">Waiting</div>
          </motion.div>
          
          <motion.div 
            className="bg-[#1e2a35]/50 border border-[#1e2a35] rounded-xl p-[2vw] flex justify-between items-center"
            initial={{ opacity: 0, y: 10 }}
            animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
          >
            <div>
              <div className="text-[2vw] md:text-[16px] text-white font-medium">Token #7</div>
              <div className="text-[1.5vw] md:text-[12px] text-[#8696A0]">10:30 AM</div>
            </div>
            <div className="text-[#25D366] text-[1.5vw] md:text-[12px]">Confirmed</div>
          </motion.div>
        </div>

        <div className="p-[3vw] mt-auto flex flex-col gap-[2vw]">
          <motion.div
            className="w-full bg-[#ef4444] text-white rounded-xl p-[3vw] text-center font-bold text-[2vw] md:text-[16px] shadow-[0_0_20px_rgba(239,68,68,0.3)]"
            whileTap={{ scale: 0.95 }}
            animate={phase >= 2 ? { backgroundColor: '#7f1d1d', scale: 0.98 } : {}}
          >
            {phase >= 2 ? "⚠️ Late Status Active" : "I'm Late Today"}
          </motion.div>

          <motion.div
            className="bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] rounded-xl p-[2vw] text-[1.5vw] md:text-[12px] leading-tight"
            initial={{ opacity: 0, height: 0 }}
            animate={phase >= 3 ? { opacity: 1, height: 'auto' } : {}}
          >
            <span className="font-bold">AI Assistant:</span> Priya has stopped accepting new bookings and is notifying upcoming patients.
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}