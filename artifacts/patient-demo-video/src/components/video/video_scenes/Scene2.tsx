import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function TypingDots() {
  return (
    <div className="bg-[#1F2C33] rounded-[2vw] rounded-tl-none px-[3vw] py-[2.5vw] shadow-sm flex items-center gap-[1.2vw] min-w-[12vw]">
      {[0, 0.18, 0.36].map((delay, i) => (
        <motion.div
          key={i}
          className="w-[1.8vw] h-[1.8vw] bg-[#8696A0] rounded-full"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.55, repeat: Infinity, delay }}
        />
      ))}
    </div>
  );
}

function PatientBubble({ text, time }: { text: string; time: string }) {
  return (
    <motion.div
      className="self-end max-w-[80%] relative chat-bubble-right"
      initial={{ opacity: 0, scale: 0.88, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 26 }}
    >
      <div className="bg-[#005C4B] rounded-[2.2vw] rounded-tr-none px-[3.5vw] py-[2.2vw] text-[3vw] shadow-sm text-[#E9EDEF] leading-snug">
        {text}
        <div className="text-[2vw] text-[#8696A0] text-right mt-[1vw] flex items-center justify-end gap-[0.8vw]">
          {time}
          <svg width="2vw" height="2vw" viewBox="0 0 16 11" fill="none">
            <path d="M1 5.5L5 9.5L11 1.5" stroke="#53bdeb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5 5.5L9 9.5L15 1.5" stroke="#53bdeb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </motion.div>
  );
}

function PriyaBubble({ children, time }: { children: React.ReactNode; time: string }) {
  return (
    <motion.div
      className="self-start max-w-[83%] relative chat-bubble-left"
      initial={{ opacity: 0, scale: 0.88, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 26 }}
    >
      <div className="bg-[#1F2C33] rounded-[2.2vw] rounded-tl-none px-[3.5vw] py-[2.2vw] text-[3vw] shadow-sm text-[#E9EDEF] leading-snug">
        {children}
        <div className="text-[2vw] text-[#8696A0] text-right mt-[1vw]">{time}</div>
      </div>
    </motion.div>
  );
}

type Msg =
  | { from: 'patient'; text: string; time: string }
  | { from: 'priya'; content: React.ReactNode; time: string }
  | { from: 'card' };

export function Scene2() {
  const [phase, setPhase] = useState(0);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1),   500),   // Patient: "Hi"
      setTimeout(() => { setTyping(true);  }, 1050),
      setTimeout(() => { setTyping(false); setPhase(2);  }, 1950),  // Priya: welcome
      setTimeout(() => setPhase(3),   2800),  // Patient: "book with Dr. Sharma"
      setTimeout(() => { setTyping(true);  }, 3350),
      setTimeout(() => { setTyping(false); setPhase(4);  }, 4150),  // Priya: "your name?"
      setTimeout(() => setPhase(5),   4900),  // Patient: "Rahul Kumar"
      setTimeout(() => { setTyping(true);  }, 5400),
      setTimeout(() => { setTyping(false); setPhase(6);  }, 6150),  // Priya: "age?"
      setTimeout(() => setPhase(7),   6850),  // Patient: "28"
      setTimeout(() => { setTyping(true);  }, 7350),
      setTimeout(() => { setTyping(false); setPhase(8);  }, 8100),  // Priya: "first visit?"
      setTimeout(() => setPhase(9),   8900),  // Patient: "Yes, first time"
      setTimeout(() => { setTyping(true);  }, 9450),
      setTimeout(() => { setTyping(false); setPhase(10); }, 10300), // Priya: "when?"
      setTimeout(() => setPhase(11),  11100), // Patient: "tomorrow morning"
      setTimeout(() => { setTyping(true);  }, 11650),
      setTimeout(() => { setTyping(false); setPhase(12); }, 12500), // Priya: slot options
      setTimeout(() => setPhase(13),  13350), // Patient: "10:30 is good"
      setTimeout(() => { setTyping(true);  }, 13900),
      setTimeout(() => { setTyping(false); setPhase(14); }, 14800), // Priya: confirmation card
      setTimeout(() => setPhase(15),  16500), // Label
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  // Auto-scroll to bottom whenever phase or typing changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [phase, typing]);

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
        className="absolute top-[8%] right-[6%] bg-white/10 backdrop-blur-md border border-white/10 text-white text-[1.9vw] px-[2.5vw] py-[1.2vw] rounded-full shadow-xl z-50 whitespace-nowrap"
        initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
        animate={phase >= 15 ? { opacity: 1, x: 0, filter: 'blur(0px)' } : { opacity: 0, x: 20, filter: 'blur(10px)' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        No staff involved. Zero calls. Works 24/7.
      </motion.div>

      {/* Phone frame — tall portrait */}
      <div className="w-[44vw] h-[88vh] bg-[#111B21] rounded-[4vw] border-[0.7vw] border-[#2a3942] shadow-[0_24px_70px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col">

        {/* WhatsApp header */}
        <div className="bg-[#1F2C33] px-[3.5vw] pt-[3vw] pb-[2.5vw] flex items-center gap-[2.5vw] shrink-0">
          <div className="w-[6vw] h-[6vw] rounded-full bg-[#25D366] flex items-center justify-center text-[#111B21] font-bold text-[2.5vw] shrink-0 shadow-[0_0_14px_rgba(37,211,102,0.45)]">P</div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-semibold text-[2.4vw] leading-tight">Priya — City Care Clinic</div>
            <div className="flex items-center gap-[1vw] mt-[0.5vw]">
              <motion.div className="w-[1.4vw] h-[1.4vw] rounded-full bg-[#25D366]"
                animate={{ opacity: [1, 0.35, 1] }} transition={{ duration: 1.8, repeat: Infinity }} />
              <span className="text-[1.8vw] text-[#8696A0]">online · AI receptionist</span>
            </div>
          </div>
          <svg className="w-[3.5vw] h-[3.5vw] text-[#8696A0] shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
          </svg>
        </div>

        {/* Scrollable chat area */}
        <div className="flex-1 overflow-y-auto bg-[#0B141A] relative" style={{ scrollbarWidth: 'none' }}>
          {/* Doodle bg */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2325D366' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
          />

          <div className="relative flex flex-col gap-[2vw] px-[3.5vw] pt-[3vw] pb-[2vw]">

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
                Is this your <span className="text-white font-semibold">first visit</span> to City Care Clinic, or have you been here before?
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
                className="self-start max-w-[88%] relative chat-bubble-left"
                initial={{ opacity: 0, scale: 0.88, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 360, damping: 26 }}
              >
                <div className="bg-[#1F2C33] rounded-[2.2vw] rounded-tl-none overflow-hidden shadow-sm">
                  <div className="bg-[#25D366]/20 border-b border-[#25D366]/30 px-[3.5vw] py-[2vw] flex items-center gap-[1.5vw]">
                    <span className="text-[3vw]">✅</span>
                    <span className="text-[#25D366] font-bold text-[3.2vw]">Appointment Confirmed!</span>
                  </div>
                  <div className="px-[3.5vw] py-[2.5vw]">
                    <div className="text-[2vw] text-[#8696A0] mb-[2.5vw]">City Care Clinic · May 10, 2026</div>
                    <div className="space-y-[2vw]">
                      {[
                        { label: 'Patient', value: 'Rahul Kumar (28 yrs)' },
                        { label: 'Visit',   value: 'First Visit 🆕' },
                        { label: 'Doctor',  value: 'Dr. Sharma' },
                        { label: 'Time',    value: 'Tomorrow, 10:30 AM' },
                        { label: 'Token',   value: '#7', green: true },
                      ].map(({ label, value, green }) => (
                        <div key={label} className="flex gap-[2vw] text-[2.5vw]">
                          <span className="text-[#8696A0] w-[15vw] shrink-0">{label}</span>
                          <span className={green ? 'text-[#25D366] font-bold text-[2.8vw]' : 'text-white'}>{value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-[2.5vw] pt-[2vw] border-t border-[#2a3942] text-[2vw] text-[#8696A0]">
                      Please arrive 10 mins early. See you! 🙏
                    </div>
                    <div className="text-[2vw] text-[#8696A0] text-right mt-[1vw] flex items-center justify-end gap-[0.8vw]">
                      10:45 AM
                      <svg width="2vw" height="2vw" viewBox="0 0 16 11" fill="none">
                        <path d="M1 5.5L5 9.5L11 1.5" stroke="#53bdeb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M5 5.5L9 9.5L15 1.5" stroke="#53bdeb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Sentinel — always scrolled into view */}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input bar */}
        <div className="bg-[#1F2C33] px-[3.5vw] py-[2.5vw] flex items-center gap-[2.5vw] shrink-0">
          <svg className="w-[4vw] h-[4vw] text-[#8696A0] shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
          </svg>
          <div className="flex-1 bg-[#2a3942] rounded-full px-[3.5vw] py-[2vw] text-[2.2vw] text-[#8696A0]">
            Type a message
          </div>
          <div className="w-[5.5vw] h-[5.5vw] bg-[#25D366] rounded-full flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(37,211,102,0.3)]">
            <svg width="52%" height="52%" viewBox="0 0 24 24" fill="#111B21">
              <path d="M2 21l21-9L2 3v7l15 2-15 2z"/>
            </svg>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
