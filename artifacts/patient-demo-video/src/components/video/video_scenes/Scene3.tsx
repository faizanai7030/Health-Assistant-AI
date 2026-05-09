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

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),  // Morph to laptop
      setTimeout(() => setPhase(2), 1200), // Show rows
      setTimeout(() => setPhase(3), 2000), // Show new row
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
      <FloatingLabel text="Zero phone calls. Zero manual entry." show={phase >= 4} />

      <motion.div
        className="w-[80vw] h-[45vw] bg-[#0f1923] rounded-2xl border border-[#1e2a35] shadow-2xl overflow-hidden flex flex-col relative"
        initial={{ scale: 0.8, borderRadius: '45px', width: '30vw', height: '60vw', y: 30 }}
        animate={phase >= 1 ? { scale: 1, borderRadius: '16px', width: '80vw', height: '45vw', y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="h-[4vw] bg-[#0a1118] border-b border-[#1e2a35] flex items-center px-[2vw] justify-between">
          <div className="flex gap-[0.5vw]">
            <div className="w-[1vw] h-[1vw] rounded-full bg-[#ff5f57]" />
            <div className="w-[1vw] h-[1vw] rounded-full bg-[#febc2e]" />
            <div className="w-[1vw] h-[1vw] rounded-full bg-[#28c840]" />
          </div>
          <div className="text-[1.2vw] text-[#25D366] font-bold">Admin Portal</div>
        </div>

        <div className="flex-1 p-[2vw] flex flex-col">
          <div className="flex justify-between items-center mb-[2vw]">
            <h2 className="text-[2vw] text-white font-semibold">Appointments</h2>
            <motion.div 
              className="bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] px-[1.5vw] py-[0.5vw] rounded-lg text-[1.2vw] font-medium"
              initial={{ opacity: 0, y: -10 }}
              animate={phase >= 2 ? { opacity: 1, y: 0 } : {}}
            >
              3 bookings today via AI
            </motion.div>
          </div>

          <div className="flex-1 border border-[#1e2a35] rounded-xl overflow-hidden bg-[#0a1118]">
            <div className="grid grid-cols-5 bg-[#1e2a35]/50 px-[2vw] py-[1vw] text-[1.2vw] text-[#8696A0] font-medium">
              <div>Time</div>
              <div>Patient</div>
              <div>Doctor</div>
              <div>Status</div>
              <div>Source</div>
            </div>

            <div className="flex flex-col">
              <motion.div 
                className="grid grid-cols-5 px-[2vw] py-[1.5vw] text-[1.2vw] text-white border-b border-[#1e2a35]"
                initial={{ opacity: 0 }}
                animate={phase >= 2 ? { opacity: 1 } : {}}
              >
                <div>09:00 AM</div>
                <div>Arvind Kapoor</div>
                <div>Dr. Sharma</div>
                <div className="text-[#4ade80]">Completed</div>
                <div className="text-[#8696A0]">Walk-in</div>
              </motion.div>
              
              <motion.div 
                className="grid grid-cols-5 px-[2vw] py-[1.5vw] text-[1.2vw] text-white border-b border-[#1e2a35]"
                initial={{ opacity: 0 }}
                animate={phase >= 2 ? { opacity: 1 } : {}}
              >
                <div>09:30 AM</div>
                <div>Priya Nair</div>
                <div>Dr. Mehta</div>
                <div className="text-[#facc15]">In Queue</div>
                <div className="text-[#8696A0]">Phone</div>
              </motion.div>

              <motion.div 
                className="grid grid-cols-5 px-[2vw] py-[1.5vw] text-[1.2vw] text-white relative bg-[#25D366]/5"
                initial={{ opacity: 0, x: -20 }}
                animate={phase >= 3 ? { opacity: 1, x: 0 } : {}}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              >
                <div className="absolute left-0 top-0 bottom-0 w-[0.3vw] bg-[#25D366]" />
                <div>10:30 AM</div>
                <div>Rahul Kumar</div>
                <div>Dr. Sharma</div>
                <div className="text-[#25D366]">Confirmed</div>
                <div className="text-[#25D366] font-medium">WhatsApp AI</div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}