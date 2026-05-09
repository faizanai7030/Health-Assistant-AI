import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1),  600),   // Schedule loads
      setTimeout(() => setPhase(2),  1800),  // Emergency buttons appear
      setTimeout(() => setPhase(3),  3000),  // "I'm Late Today" tap
      setTimeout(() => setPhase(4),  3700),  // Status badge turns orange
      setTimeout(() => setPhase(5),  4500),  // AI action #1: bookings paused
      setTimeout(() => setPhase(6),  5200),  // AI action #2: notifying patients
      setTimeout(() => setPhase(7),  5900),  // WhatsApp msg to patient
      setTimeout(() => setPhase(8),  7800),  // Floating label
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center gap-[4vw] z-20 px-[4vw]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Floating label */}
      <motion.div
        className="absolute top-[10%] right-[6%] bg-white/10 backdrop-blur-md border border-white/10 text-white text-[1.9vw] px-[2.5vw] py-[1.2vw] rounded-full shadow-xl z-50 whitespace-nowrap"
        initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
        animate={phase >= 8 ? { opacity: 1, x: 0, filter: 'blur(0px)' } : { opacity: 0, x: 20, filter: 'blur(10px)' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        One tap. AI notifies everyone. Instantly.
      </motion.div>

      {/* LEFT: Doctor's phone portal */}
      <motion.div
        className="w-[36vw] h-[76vh] max-h-[88vw] bg-[#0a1118] rounded-[3.5vw] border-[0.7vw] border-[#1e2a35] shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col shrink-0"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Status bar */}
        <div className="bg-[#0f1923] px-[3vw] pt-[2vw] pb-[1.5vw] shrink-0 border-b border-[#1e2a35]">
          <div className="flex items-center justify-between mb-[0.5vw]">
            <div>
              <div className="text-white font-bold text-[2.8vw]">Dr. Sharma</div>
              <div className="text-[#8696A0] text-[1.8vw]">General Physician · May 10, 2026</div>
            </div>
            {/* Status badge */}
            <motion.div
              className="px-[2.5vw] py-[1vw] rounded-full text-[1.8vw] font-bold border"
              animate={phase >= 4
                ? { backgroundColor: 'rgba(251,146,60,0.15)', borderColor: '#fb923c', color: '#fb923c' }
                : { backgroundColor: 'rgba(37,211,102,0.1)', borderColor: '#25D366', color: '#25D366' }
              }
              transition={{ duration: 0.4 }}
            >
              {phase >= 4 ? '⚠️ Late' : '● Available'}
            </motion.div>
          </div>
        </div>

        {/* Schedule */}
        <div className="flex-1 overflow-hidden px-[3vw] pt-[2.5vw] flex flex-col gap-[1.8vw]">
          <div className="text-[1.9vw] text-[#8696A0] font-medium mb-[0.5vw]">TODAY'S SCHEDULE</div>

          {[
            { token: '#3', time: '9:00 AM',  patient: 'Arvind Kapoor',  status: 'Completed', color: 'text-[#4ade80]' },
            { token: '#5', time: '9:30 AM',  patient: 'Meena Pillai',   status: 'Completed', color: 'text-[#4ade80]' },
            { token: '#6', time: '10:00 AM', patient: 'Sunita Mehta',   status: 'In Queue',  color: 'text-[#facc15]' },
            { token: '#7', time: '10:30 AM', patient: 'Rahul Kumar',    status: 'Upcoming',  color: 'text-[#8696A0]' },
            { token: '#8', time: '11:00 AM', patient: 'Priya Nair',     status: 'Upcoming',  color: 'text-[#8696A0]' },
          ].map(({ token, time, patient, status, color }, i) => (
            <motion.div
              key={token}
              className="bg-[#1e2a35]/50 border border-[#1e2a35] rounded-xl px-[2.5vw] py-[1.8vw] flex justify-between items-center"
              initial={{ opacity: 0, x: -10 }}
              animate={phase >= 1 ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: i * 0.07, duration: 0.4 }}
            >
              <div>
                <div className="text-white font-semibold text-[2.1vw] flex items-center gap-[1.5vw]">
                  <span className="text-[#8696A0] text-[1.7vw]">{token}</span>
                  {patient}
                </div>
                <div className="text-[#8696A0] text-[1.7vw] mt-[0.3vw]">{time}</div>
              </div>
              <div className={`text-[1.7vw] font-medium ${color}`}>{status}</div>
            </motion.div>
          ))}
        </div>

        {/* Emergency buttons */}
        <div className="px-[3vw] pb-[3vw] pt-[2vw] flex flex-col gap-[1.5vw] shrink-0 border-t border-[#1e2a35] mt-[1.5vw]">
          <AnimatePresence>
            {phase >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col gap-[1.5vw]"
              >
                <div className="text-[1.8vw] text-[#8696A0] text-center">Running late or can't make it?</div>

                <motion.button
                  className="w-full rounded-xl py-[2.5vw] text-center font-bold text-[2.2vw] border-2 relative overflow-hidden"
                  style={{ borderColor: '#fb923c' }}
                  animate={phase >= 3
                    ? { backgroundColor: 'rgba(251,146,60,0.25)', color: '#fb923c', scale: 0.97, boxShadow: '0 0 24px rgba(251,146,60,0.35)' }
                    : { backgroundColor: 'rgba(251,146,60,0.1)', color: '#fb923c', scale: 1, boxShadow: 'none' }
                  }
                  transition={{ duration: 0.3 }}
                >
                  {phase >= 3 ? '⚠️ Marked as Late' : "🕐 I'm Late Today"}
                </motion.button>

                <motion.button
                  className="w-full rounded-xl py-[2vw] text-center font-bold text-[2.2vw] border-2"
                  style={{ borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.08)', color: '#ef4444' }}
                >
                  ❌ Not Coming Today
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* RIGHT: AI action panel + WhatsApp preview */}
      <div className="flex flex-col gap-[2.5vw] w-[40vw]">

        {/* AI action log */}
        <motion.div
          className="bg-[#0f1923] border border-[#1e2a35] rounded-2xl overflow-hidden"
          initial={{ opacity: 0, x: 30 }}
          animate={phase >= 4 ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="px-[3vw] py-[2vw] border-b border-[#1e2a35] flex items-center gap-[1.5vw]">
            <div className="w-[3vw] h-[3vw] bg-[#25D366] rounded-lg flex items-center justify-center shrink-0">
              <svg width="65%" height="65%" viewBox="0 0 24 24" fill="#111B21">
                <path d="M12 2a10 10 0 1 0 10 10H12V2Z"/>
              </svg>
            </div>
            <div className="text-white font-semibold text-[2.2vw]">Priya — AI Receptionist</div>
            <motion.div
              className="ml-auto w-[1.5vw] h-[1.5vw] rounded-full bg-[#25D366]"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
          </div>

          <div className="px-[3vw] py-[2.5vw] flex flex-col gap-[2vw]">
            <motion.div
              className="flex items-start gap-[2vw]"
              initial={{ opacity: 0, x: -10 }}
              animate={phase >= 5 ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.4 }}
            >
              <motion.div
                className="w-[2.5vw] h-[2.5vw] rounded-full border-2 flex items-center justify-center shrink-0 mt-[0.3vw]"
                animate={phase >= 5 ? { borderColor: '#25D366', backgroundColor: 'rgba(37,211,102,0.15)' } : { borderColor: '#1e2a35' }}
              >
                {phase >= 5 && <span className="text-[#25D366] text-[1.4vw] font-bold">✓</span>}
              </motion.div>
              <div>
                <div className="text-white text-[2.1vw] font-medium">New bookings paused for Dr. Sharma</div>
                <div className="text-[#8696A0] text-[1.7vw] mt-[0.4vw]">Patients trying to book will be informed of the delay</div>
              </div>
            </motion.div>

            <motion.div
              className="flex items-start gap-[2vw]"
              initial={{ opacity: 0, x: -10 }}
              animate={phase >= 6 ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.4 }}
            >
              <motion.div
                className="w-[2.5vw] h-[2.5vw] rounded-full border-2 flex items-center justify-center shrink-0 mt-[0.3vw]"
                animate={phase >= 6 ? { borderColor: '#25D366', backgroundColor: 'rgba(37,211,102,0.15)' } : { borderColor: '#1e2a35' }}
              >
                {phase >= 6 && <span className="text-[#25D366] text-[1.7vw] font-bold">✓</span>}
              </motion.div>
              <div>
                <div className="text-white text-[2.1vw] font-medium">Sending WhatsApp updates to 3 upcoming patients</div>
                <div className="text-[#8696A0] text-[1.7vw] mt-[0.4vw]">Rahul Kumar, Priya Nair + 1 more notified</div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* WhatsApp message sent to patient */}
        <AnimatePresence>
          {phase >= 7 && (
            <motion.div
              className="bg-[#111B21] border border-[#2a3942] rounded-2xl overflow-hidden"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            >
              {/* mini chat header */}
              <div className="bg-[#1F2C33] px-[3vw] py-[1.8vw] flex items-center gap-[2vw]">
                <div className="w-[4vw] h-[4vw] rounded-full bg-[#25D366] flex items-center justify-center text-[#111B21] font-bold text-[1.6vw] shrink-0">P</div>
                <div>
                  <div className="text-white text-[2vw] font-semibold">Priya → Rahul Kumar</div>
                  <div className="text-[#8696A0] text-[1.6vw]">WhatsApp · just now</div>
                </div>
                <div className="ml-auto">
                  <svg width="2.5vw" height="2.5vw" viewBox="0 0 24 24" fill="#25D366">
                    <path d="M20.52 3.48A12 12 0 1 0 3.48 20.52 12 12 0 0 0 20.52 3.48zM12 2a10 10 0 1 1 0 20A10 10 0 0 1 12 2zM7 13l3 3 7-7-1.4-1.4L10 13.2l-1.6-1.6L7 13z"/>
                  </svg>
                </div>
              </div>
              {/* message bubble */}
              <div className="px-[3vw] py-[2.5vw]">
                <div className="bg-[#1F2C33] rounded-[1.5vw] rounded-tl-none px-[2.5vw] py-[2vw] text-[2vw] text-[#E9EDEF] leading-relaxed">
                  Hi Rahul! 🙏 Dr. Sharma is running a little late today.<br /><br />
                  Your <span className="text-[#25D366] font-semibold">10:30 AM appointment (Token #7)</span> may be
                  pushed by <span className="text-white font-semibold">~30–45 minutes</span>.<br /><br />
                  We'll send you an update once the doctor arrives. Really sorry for the inconvenience!<br /><br />
                  <span className="text-[#8696A0]">— Priya, City Care Clinic</span>
                  <div className="text-[1.3vw] text-[#8696A0] text-right mt-[1vw] flex items-center justify-end gap-[0.6vw]">
                    10:47 AM
                    <svg width="1.6vw" height="1.6vw" viewBox="0 0 16 11" fill="none">
                      <path d="M1 5.5L5 9.5L11 1.5" stroke="#53bdeb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M5 5.5L9 9.5L15 1.5" stroke="#53bdeb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  );
}
