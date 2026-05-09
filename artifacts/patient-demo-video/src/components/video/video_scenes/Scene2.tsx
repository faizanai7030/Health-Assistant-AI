import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function TypingDots() {
  return (
    <div className="bg-[#1F2C33] rounded-[12px] rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-[6px] min-w-[56px]">
      {[0, 0.18, 0.36].map((delay, i) => (
        <motion.div
          key={i}
          className="w-[7px] h-[7px] bg-[#8696A0] rounded-full"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.55, repeat: Infinity, delay }}
        />
      ))}
    </div>
  );
}

function PatientBubble({ text, time }: { text: string; time: string }) {
  return (
    <motion.div
      className="self-end max-w-[72%] relative chat-bubble-right"
      initial={{ opacity: 0, scale: 0.9, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 26 }}
    >
      <div className="bg-[#005C4B] rounded-[12px] rounded-tr-none px-4 py-2.5 text-[15px] shadow-sm text-[#E9EDEF] leading-snug">
        {text}
        <div className="text-[11px] text-[#8696A0] text-right mt-1 flex items-center justify-end gap-[5px]">
          {time}
          <svg width="14" height="10" viewBox="0 0 16 11" fill="none">
            <path d="M1 5.5L5 9.5L11 1.5" stroke="#53bdeb" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5 5.5L9 9.5L15 1.5" stroke="#53bdeb" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </motion.div>
  );
}

function PriyaBubble({ children, time }: { children: React.ReactNode; time: string }) {
  return (
    <motion.div
      className="self-start max-w-[74%] relative chat-bubble-left"
      initial={{ opacity: 0, scale: 0.9, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 26 }}
    >
      <div className="bg-[#1F2C33] rounded-[12px] rounded-tl-none px-4 py-2.5 text-[15px] shadow-sm text-[#E9EDEF] leading-snug">
        {children}
        <div className="text-[11px] text-[#8696A0] text-right mt-1">{time}</div>
      </div>
    </motion.div>
  );
}

export function Scene2() {
  const [phase, setPhase] = useState(0);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1),   500),
      setTimeout(() => { setTyping(true); },  1050),
      setTimeout(() => { setTyping(false); setPhase(2); },  1950),
      setTimeout(() => setPhase(3),   2800),
      setTimeout(() => { setTyping(true); },  3350),
      setTimeout(() => { setTyping(false); setPhase(4); },  4150),
      setTimeout(() => setPhase(5),   4900),
      setTimeout(() => { setTyping(true); },  5400),
      setTimeout(() => { setTyping(false); setPhase(6); },  6150),
      setTimeout(() => setPhase(7),   6850),
      setTimeout(() => { setTyping(true); },  7350),
      setTimeout(() => { setTyping(false); setPhase(8); },  8100),
      setTimeout(() => setPhase(9),   8900),
      setTimeout(() => { setTyping(true); },  9450),
      setTimeout(() => { setTyping(false); setPhase(10); }, 10300),
      setTimeout(() => setPhase(11),  11100),
      setTimeout(() => { setTyping(true); },  11650),
      setTimeout(() => { setTyping(false); setPhase(12); }, 12500),
      setTimeout(() => setPhase(13),  13350),
      setTimeout(() => { setTyping(true); },  13900),
      setTimeout(() => { setTyping(false); setPhase(14); }, 14800),
      setTimeout(() => setPhase(15),  16500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [phase, typing]);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col bg-[#0B141A] z-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Floating label */}
      <motion.div
        className="absolute top-[14%] right-[4%] bg-white/10 backdrop-blur-md border border-white/10 text-white text-[3.2vw] px-[3vw] py-[1.4vw] rounded-full shadow-xl z-50 whitespace-nowrap"
        initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
        animate={phase >= 15 ? { opacity: 1, x: 0, filter: 'blur(0px)' } : { opacity: 0, x: 20, filter: 'blur(10px)' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        No staff involved. Zero calls. Works 24/7.
      </motion.div>

      {/* WhatsApp top bar */}
      <div className="bg-[#1F2C33] px-5 pt-10 pb-3 flex items-center gap-4 shrink-0 shadow-md">
        {/* Back arrow */}
        <svg className="w-5 h-5 text-white shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
        <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-[#111B21] font-bold text-base shrink-0 shadow-[0_0_10px_rgba(37,211,102,0.4)]">P</div>
        <div className="flex-1 min-w-0">
          <div className="text-white font-semibold text-[15px] leading-tight">Priya — City Care Clinic</div>
          <div className="flex items-center gap-2 mt-0.5">
            <motion.div className="w-2 h-2 rounded-full bg-[#25D366]"
              animate={{ opacity: [1, 0.35, 1] }} transition={{ duration: 1.8, repeat: Infinity }} />
            <span className="text-[12px] text-[#8696A0]">online · AI receptionist</span>
          </div>
        </div>
        <svg className="w-5 h-5 text-[#8696A0] shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
        </svg>
      </div>

      {/* Chat scroll area */}
      <div className="flex-1 overflow-y-auto relative" style={{ scrollbarWidth: 'none' }}>
        {/* WhatsApp doodle bg */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2325D366' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
        />

        <div className="relative flex flex-col gap-2 px-4 pt-4 pb-3">

          {phase >= 1  && <PatientBubble text="Hi" time="10:41 AM" />}

          <AnimatePresence>
            {typing && phase < 2 && (
              <motion.div className="self-start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <TypingDots />
              </motion.div>
            )}
          </AnimatePresence>

          {phase >= 2 && (
            <PriyaBubble time="10:41 AM">
              Hi! 👋 Welcome to City Care Clinic.<br />
              I'm <span className="text-[#25D366] font-semibold">Priya</span>, your AI receptionist. How can I help you today?
            </PriyaBubble>
          )}

          {phase >= 3  && <PatientBubble text="want to book appointment with Dr. Sharma" time="10:42 AM" />}

          <AnimatePresence>
            {typing && phase >= 3 && phase < 4 && (
              <motion.div className="self-start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <TypingDots />
              </motion.div>
            )}
          </AnimatePresence>

          {phase >= 4 && (
            <PriyaBubble time="10:42 AM">
              Sure! Could I get your <span className="text-white font-semibold">full name</span> please? 😊
            </PriyaBubble>
          )}

          {phase >= 5  && <PatientBubble text="Rahul Kumar" time="10:42 AM" />}

          <AnimatePresence>
            {typing && phase >= 5 && phase < 6 && (
              <motion.div className="self-start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <TypingDots />
              </motion.div>
            )}
          </AnimatePresence>

          {phase >= 6 && (
            <PriyaBubble time="10:43 AM">
              Thanks Rahul! And your <span className="text-white font-semibold">age</span>?
            </PriyaBubble>
          )}

          {phase >= 7  && <PatientBubble text="28" time="10:43 AM" />}

          <AnimatePresence>
            {typing && phase >= 7 && phase < 8 && (
              <motion.div className="self-start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <TypingDots />
              </motion.div>
            )}
          </AnimatePresence>

          {phase >= 8 && (
            <PriyaBubble time="10:43 AM">
              Got it! Is this your <span className="text-white font-semibold">first visit</span> to City Care Clinic, or have you been here before?
            </PriyaBubble>
          )}

          {phase >= 9  && <PatientBubble text="First time 🙂" time="10:43 AM" />}

          <AnimatePresence>
            {typing && phase >= 9 && phase < 10 && (
              <motion.div className="self-start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <TypingDots />
              </motion.div>
            )}
          </AnimatePresence>

          {phase >= 10 && (
            <PriyaBubble time="10:44 AM">
              Welcome Rahul! 🎉 Happy to have you here.<br />
              When would you like to come in?
            </PriyaBubble>
          )}

          {phase >= 11 && <PatientBubble text="tomorrow morning if possible" time="10:44 AM" />}

          <AnimatePresence>
            {typing && phase >= 11 && phase < 12 && (
              <motion.div className="self-start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <TypingDots />
              </motion.div>
            )}
          </AnimatePresence>

          {phase >= 12 && (
            <PriyaBubble time="10:44 AM">
              Dr. Sharma has these slots tomorrow morning:<br />
              <span className="text-[#25D366]">• 9:30 AM</span> &nbsp;• 10:00 AM &nbsp;<span className="text-[#25D366]">• 10:30 AM</span><br />
              Which works best for you?
            </PriyaBubble>
          )}

          {phase >= 13 && <PatientBubble text="10:30 is good 👍" time="10:45 AM" />}

          <AnimatePresence>
            {typing && phase >= 13 && phase < 14 && (
              <motion.div className="self-start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <TypingDots />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Confirmation card */}
          {phase >= 14 && (
            <motion.div
              className="self-start max-w-[78%] relative chat-bubble-left"
              initial={{ opacity: 0, scale: 0.9, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 360, damping: 26 }}
            >
              <div className="bg-[#1F2C33] rounded-[12px] rounded-tl-none overflow-hidden shadow-sm">
                <div className="bg-[#25D366]/20 border-b border-[#25D366]/30 px-4 py-2.5 flex items-center gap-2">
                  <span className="text-[16px]">✅</span>
                  <span className="text-[#25D366] font-bold text-[15px]">Appointment Confirmed!</span>
                </div>
                <div className="px-4 py-3">
                  <div className="text-[11px] text-[#8696A0] mb-3">City Care Clinic · May 10, 2026</div>
                  <div className="space-y-2">
                    {[
                      { label: 'Patient', value: 'Rahul Kumar (28 yrs)' },
                      { label: 'Visit',   value: 'First Visit 🆕' },
                      { label: 'Doctor',  value: 'Dr. Sharma' },
                      { label: 'Time',    value: 'Tomorrow, 10:30 AM' },
                      { label: 'Token',   value: '#7', green: true },
                    ].map(({ label, value, green }) => (
                      <div key={label} className="flex gap-3 text-[13px]">
                        <span className="text-[#8696A0] w-14 shrink-0">{label}</span>
                        <span className={green ? 'text-[#25D366] font-bold text-[15px]' : 'text-white'}>{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-[#2a3942] text-[11px] text-[#8696A0]">
                    Please arrive 10 mins early. See you! 🙏
                  </div>
                  <div className="text-[11px] text-[#8696A0] text-right mt-1 flex items-center justify-end gap-1">
                    10:45 AM
                    <svg width="14" height="10" viewBox="0 0 16 11" fill="none">
                      <path d="M1 5.5L5 9.5L11 1.5" stroke="#53bdeb" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M5 5.5L9 9.5L15 1.5" stroke="#53bdeb" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="bg-[#1F2C33] px-4 py-3 flex items-center gap-3 shrink-0">
        <svg className="w-6 h-6 text-[#8696A0] shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.5 2C6.81 2 3 5.81 3 10.5S6.81 19 11.5 19h.5v3c4.86-2.34 8-7 8-11.5C20 5.81 16.19 2 11.5 2zm1 14.5h-2v-2h2v2zm0-4h-2c0-3.25 3-3 3-5 0-1.1-.9-2-2-2s-2 .9-2 2h-2c0-2.21 1.79-4 4-4s4 1.79 4 4c0 2.5-3 2.75-3 5z"/>
        </svg>
        <div className="flex-1 bg-[#2a3942] rounded-full px-4 py-2 text-[13px] text-[#8696A0]">
          Type a message
        </div>
        <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(37,211,102,0.3)]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#111B21">
            <path d="M2 21l21-9L2 3v7l15 2-15 2z"/>
          </svg>
        </div>
      </div>

    </motion.div>
  );
}
