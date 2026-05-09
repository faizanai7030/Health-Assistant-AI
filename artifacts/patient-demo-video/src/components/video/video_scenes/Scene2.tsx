import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function TypingDots() {
  return (
    <div className="bg-[#1F2C33] rounded-[2vw] rounded-tl-none px-[3vw] py-[2vw] shadow-sm flex items-center gap-[1vw] h-[8vw] min-w-[10vw]">
      {[0, 0.2, 0.4].map((delay, i) => (
        <motion.div
          key={i}
          className="w-[1.5vw] h-[1.5vw] bg-[#8696A0] rounded-full"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay }}
        />
      ))}
    </div>
  );
}

function PatientBubble({ text, time, show }: { text: string; time: string; show: boolean }) {
  if (!show) return null;
  return (
    <motion.div
      className="self-end max-w-[80%] relative chat-bubble-right"
      initial={{ opacity: 0, scale: 0.88, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
    >
      <div className="bg-[#005C4B] rounded-[2vw] rounded-tr-none px-[3vw] py-[2vw] text-[2.6vw] shadow-sm text-[#E9EDEF] leading-snug">
        {text}
        <div className="text-[1.8vw] text-[#8696A0] text-right mt-[0.8vw] flex items-center justify-end gap-[0.8vw]">
          {time}
          <svg width="1.8vw" height="1.8vw" viewBox="0 0 16 11" fill="none">
            <path d="M1 5.5L5 9.5L11 1.5" stroke="#53bdeb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5 5.5L9 9.5L15 1.5" stroke="#53bdeb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </motion.div>
  );
}

function PriyaBubble({ children, time, show }: { children: React.ReactNode; time: string; show: boolean }) {
  if (!show) return null;
  return (
    <motion.div
      className="self-start max-w-[82%] relative chat-bubble-left"
      initial={{ opacity: 0, scale: 0.88, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
    >
      <div className="bg-[#1F2C33] rounded-[2vw] rounded-tl-none px-[3vw] py-[2vw] text-[2.6vw] shadow-sm text-[#E9EDEF] leading-snug">
        {children}
        <div className="text-[1.8vw] text-[#8696A0] text-right mt-[0.8vw]">{time}</div>
      </div>
    </motion.div>
  );
}

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1),  500),   // Patient: "Hi"
      setTimeout(() => setPhase(2),  1100),  // Priya typing
      setTimeout(() => setPhase(3),  2000),  // Priya: welcome msg
      setTimeout(() => setPhase(4),  2900),  // Patient: "book with Dr. Sharma"
      setTimeout(() => setPhase(5),  3500),  // Priya typing
      setTimeout(() => setPhase(6),  4300),  // Priya: "Can I get your name?"
      setTimeout(() => setPhase(7),  5000),  // Patient: "Rahul Kumar"
      setTimeout(() => setPhase(8),  5600),  // Priya typing
      setTimeout(() => setPhase(9),  6400),  // Priya: "Thanks Rahul! When?"
      setTimeout(() => setPhase(10), 7200),  // Patient: "tomorrow morning"
      setTimeout(() => setPhase(11), 7800),  // Priya typing
      setTimeout(() => setPhase(12), 8700),  // Priya: available slots
      setTimeout(() => setPhase(13), 9600),  // Patient: "10:30 is good"
      setTimeout(() => setPhase(14), 10200), // Priya typing
      setTimeout(() => setPhase(15), 11100), // Priya: confirmation card
      setTimeout(() => setPhase(16), 12500), // Label shows
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
      {/* Floating label */}
      <motion.div
        className="absolute top-[12%] right-[8%] bg-white/10 backdrop-blur-md border border-white/10 text-white text-[1.4vw] px-[2vw] py-[1vw] rounded-full shadow-xl z-50 whitespace-nowrap"
        initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
        animate={phase >= 16 ? { opacity: 1, x: 0, filter: 'blur(0px)' } : { opacity: 0, x: 20, filter: 'blur(10px)' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        No staff involvement. Zero calls. Works 24/7.
      </motion.div>

      {/* Phone frame */}
      <div className="w-[42vw] h-[85vh] max-h-[90vw] bg-[#111B21] rounded-[4vw] border-[0.8vw] border-[#2a3942] shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col">

        {/* WhatsApp header */}
        <div className="bg-[#1F2C33] px-[3vw] pt-[2.5vw] pb-[2vw] flex items-center gap-[2vw] shrink-0 border-b border-[#2a3942]">
          <div className="w-[5.5vw] h-[5.5vw] rounded-full bg-[#25D366] flex items-center justify-center text-[#111B21] font-bold text-[2.2vw] shrink-0 shadow-[0_0_12px_rgba(37,211,102,0.4)]">P</div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-semibold text-[2.2vw] leading-tight">Priya — City Care Clinic</div>
            <div className="flex items-center gap-[1vw] mt-[0.3vw]">
              <motion.div
                className="w-[1.2vw] h-[1.2vw] rounded-full bg-[#25D366]"
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.8, repeat: Infinity }}
              />
              <span className="text-[1.6vw] text-[#8696A0]">online · AI receptionist</span>
            </div>
          </div>
          {/* WhatsApp icons */}
          <svg className="w-[3vw] h-[3vw] text-[#8696A0]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M15.9 14.3H15l-.3-.3c1-1.1 1.6-2.7 1.6-4.3 0-3.7-3-6.7-6.7-6.7S2.9 6 2.9 9.7s3 6.7 6.7 6.7c1.6 0 3.2-.6 4.3-1.6l.3.3v.8l5.1 5.1 1.5-1.5-4.9-5.2zm-6.2 0C7.1 14.3 4 11.2 4 7.4 4 3.6 7.1.5 10.9.5s6.9 3.1 6.9 6.9-3.1 6.9-6.1 6.9z"/>
          </svg>
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-hidden bg-[#0B141A] relative">
          {/* WhatsApp doodle bg */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2325D366' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          <div className="relative h-full flex flex-col justify-end px-[3vw] pb-[2vw] gap-[1.5vw]">

            <PatientBubble text="Hi" time="10:41 AM" show={phase >= 1} />

            <AnimatePresence>
              {phase === 2 && (
                <motion.div className="self-start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <TypingDots />
                </motion.div>
              )}
            </AnimatePresence>

            <PriyaBubble time="10:41 AM" show={phase >= 3}>
              Hi! 👋 Welcome to City Care Clinic.<br />
              I'm <span className="text-[#25D366] font-semibold">Priya</span>, your AI receptionist.<br />
              How can I help you today?
            </PriyaBubble>

            <PatientBubble text="want to book appointment with dr sharma" time="10:42 AM" show={phase >= 4} />

            <AnimatePresence>
              {phase === 5 && (
                <motion.div className="self-start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <TypingDots />
                </motion.div>
              )}
            </AnimatePresence>

            <PriyaBubble time="10:42 AM" show={phase >= 6}>
              Sure! Can I get your name please? 😊
            </PriyaBubble>

            <PatientBubble text="Rahul Kumar" time="10:42 AM" show={phase >= 7} />

            <AnimatePresence>
              {phase === 8 && (
                <motion.div className="self-start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <TypingDots />
                </motion.div>
              )}
            </AnimatePresence>

            <PriyaBubble time="10:43 AM" show={phase >= 9}>
              Thanks Rahul! When would you like to come in? Tomorrow or a specific date?
            </PriyaBubble>

            <PatientBubble text="tomorrow morning if possible" time="10:43 AM" show={phase >= 10} />

            <AnimatePresence>
              {phase === 11 && (
                <motion.div className="self-start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <TypingDots />
                </motion.div>
              )}
            </AnimatePresence>

            <PriyaBubble time="10:43 AM" show={phase >= 12}>
              Dr. Sharma has these slots available tomorrow morning:<br />
              <span className="text-[#25D366]">• 9:30 AM</span>  &nbsp;• 10:00 AM  &nbsp;<span className="text-[#25D366]">• 10:30 AM</span><br />
              Which works best for you?
            </PriyaBubble>

            <PatientBubble text="10:30 is good 👍" time="10:44 AM" show={phase >= 13} />

            <AnimatePresence>
              {phase === 14 && (
                <motion.div className="self-start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <TypingDots />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Confirmation card */}
            {phase >= 15 && (
              <motion.div
                className="self-start max-w-[85%] relative chat-bubble-left"
                initial={{ opacity: 0, scale: 0.88, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              >
                <div className="bg-[#1F2C33] rounded-[2vw] rounded-tl-none overflow-hidden shadow-sm">
                  {/* Green top bar */}
                  <div className="bg-[#25D366]/20 border-b border-[#25D366]/30 px-[3vw] py-[1.5vw] flex items-center gap-[1.5vw]">
                    <span className="text-[2.5vw]">✅</span>
                    <span className="text-[#25D366] font-bold text-[2.8vw]">Appointment Confirmed!</span>
                  </div>
                  <div className="px-[3vw] py-[2vw]">
                    <div className="text-[1.8vw] text-[#8696A0] mb-[2vw]">City Care Clinic · May 10, 2026</div>
                    <div className="space-y-[1.5vw]">
                      {[
                        { label: 'Patient', value: 'Rahul Kumar', color: 'text-white' },
                        { label: 'Doctor', value: 'Dr. Sharma', color: 'text-white' },
                        { label: 'Date', value: 'Tomorrow, 10:30 AM', color: 'text-white' },
                        { label: 'Token', value: '#7', color: 'text-[#25D366] font-bold' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="flex gap-[2vw] text-[2.3vw]">
                          <span className="text-[#8696A0] w-[13vw] shrink-0">{label}</span>
                          <span className={color}>{value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-[2vw] pt-[2vw] border-t border-[#2a3942] text-[1.8vw] text-[#8696A0]">
                      Please arrive 10 mins early. See you! 🙏
                    </div>
                    <div className="text-[1.8vw] text-[#8696A0] text-right mt-[1vw]">10:44 AM</div>
                  </div>
                </div>
              </motion.div>
            )}

          </div>
        </div>

        {/* Input bar */}
        <div className="bg-[#1F2C33] px-[3vw] py-[2vw] flex items-center gap-[2vw] shrink-0">
          <div className="flex-1 bg-[#2a3942] rounded-full px-[3vw] py-[1.5vw] text-[2vw] text-[#8696A0]">
            Type a message
          </div>
          <div className="w-[5vw] h-[5vw] bg-[#25D366] rounded-full flex items-center justify-center shrink-0">
            <svg width="55%" height="55%" viewBox="0 0 24 24" fill="#111B21">
              <path d="M2 21l21-9L2 3v7l15 2-15 2z"/>
            </svg>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
