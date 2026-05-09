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

export function Scene6() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),  // Show dashboard
      setTimeout(() => setPhase(2), 1200), // Click send
      setTimeout(() => setPhase(3), 2000), // WhatsApp message appears
      setTimeout(() => setPhase(4), 3000), // Show label
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center gap-[4vw] z-20 px-[5vw]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <FloatingLabel text="Auto-reminders. 1 hour before. Every patient." show={phase >= 4} />

      {/* Admin Dashboard Side */}
      <motion.div 
        className="w-[40vw] h-[30vw] bg-[#0f1923] rounded-2xl border border-[#1e2a35] shadow-2xl p-[2vw] flex flex-col"
        initial={{ x: -30, opacity: 0 }}
        animate={phase >= 1 ? { x: 0, opacity: 1 } : {}}
      >
        <h2 className="text-[2vw] text-white font-semibold mb-[2vw]">Reminders</h2>
        
        <div className="flex-1 bg-[#1e2a35]/30 rounded-xl p-[2vw] flex flex-col items-center justify-center gap-[2vw]">
          <div className="text-[4vw] text-white font-bold">12</div>
          <div className="text-[1.5vw] text-[#8696A0]">Patients scheduled next hour</div>
          
          <motion.div
            className="mt-[2vw] bg-[#25D366] text-[#0a1118] px-[3vw] py-[1vw] rounded-lg font-bold text-[1.5vw] shadow-[0_0_20px_rgba(37,211,102,0.2)]"
            animate={phase >= 2 ? { backgroundColor: '#1a1a1a', color: '#25D366', border: '1px solid #25D366' } : {}}
          >
            {phase >= 2 ? "✅ 12 Reminders Sent" : "Send Reminders"}
          </motion.div>
        </div>
      </motion.div>

      {/* Patient Phone Side */}
      <motion.div 
        className="w-[30vw] h-[55vw] bg-[#111B21] rounded-[3vw] border-[0.8vw] border-[#1e2a35] shadow-2xl flex flex-col overflow-hidden"
        initial={{ x: 30, opacity: 0 }}
        animate={phase >= 1 ? { x: 0, opacity: 1 } : {}}
      >
        <div className="bg-[#1f2c27] h-[6vw] w-full flex items-center px-[2vw] gap-[1vw] shrink-0 shadow-md">
           <div className="w-[3vw] h-[3vw] rounded-full bg-[#25D366] flex items-center justify-center text-[#111B21] font-bold text-[1.5vw]">P</div>
           <div className="text-white text-[1.5vw] font-semibold">Priya</div>
        </div>

        <div className="flex-1 p-[2vw] flex flex-col justify-end bg-[#0a1118]/50 pb-[4vw]">
          <motion.div 
            className="self-start max-w-[90%] relative chat-bubble-left"
            initial={{ opacity: 0, scale: 0.9, x: -20 }}
            animate={phase >= 3 ? { opacity: 1, scale: 1, x: 0 } : {}}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <div className="bg-[#1F2C33] rounded-[1.5vw] rounded-tl-none p-[1.5vw] text-[1.8vw] shadow-sm text-[#E9EDEF] leading-snug">
              Hi Rahul! Reminder: Your appointment with Dr. Sharma is in 1 hour — today at 10:30 AM. Token #7. City Care Clinic.
              <div className="text-[1.2vw] text-[#8696A0] text-right mt-1 -mb-1">09:30 AM</div>
            </div>
          </motion.div>
        </div>
      </motion.div>

    </motion.div>
  );
}