import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PROBLEMS = [
  { icon: '🏖️', text: 'Takes vacations & leaves' },
  { icon: '🌙', text: 'Not available after 6 PM' },
  { icon: '⏰', text: 'Can be late to work' },
  { icon: '🏠', text: 'Has home emergencies' },
  { icon: '📞', text: 'Misses calls, makes errors' },
];

const SOLUTIONS = [
  { icon: '✅', text: 'Available 24 / 7, 365 days' },
  { icon: '✅', text: 'Replies instantly, any hour' },
  { icon: '✅', text: 'Never late, never absent' },
  { icon: '✅', text: 'Zero emergencies, zero excuses' },
  { icon: '✅', text: 'Zero errors, books in seconds' },
];

export function ScenePain() {
  const [phase, setPhase] = useState(0);
  const [visibleProblems, setVisibleProblems] = useState(0);
  const [visibleSolutions, setVisibleSolutions] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1),  400),
      setTimeout(() => setVisibleProblems(1), 1400),
      setTimeout(() => setVisibleProblems(2), 2700),
      setTimeout(() => setVisibleProblems(3), 4000),
      setTimeout(() => setVisibleProblems(4), 5300),
      setTimeout(() => setVisibleProblems(5), 6600),
      setTimeout(() => setPhase(2),  8200),
      setTimeout(() => setVisibleSolutions(1), 9000),
      setTimeout(() => setVisibleSolutions(2), 10300),
      setTimeout(() => setVisibleSolutions(3), 11600),
      setTimeout(() => setVisibleSolutions(4), 12900),
      setTimeout(() => setVisibleSolutions(5), 14200),
      setTimeout(() => setPhase(3), 15800),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center px-[6vw]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Phase 1 — Problem */}
      <AnimatePresence mode="wait">
        {phase === 1 && (
          <motion.div
            key="problem"
            className="w-full flex flex-col items-center gap-[3vw]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
          >
            {/* Question */}
            <motion.p
              className="text-[3.5vw] font-semibold text-center text-[#8696A0] leading-snug"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Still relying on a human receptionist...
            </motion.p>
            <motion.h2
              className="text-[5vw] font-bold text-center text-white leading-tight"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              in the AI era?
            </motion.h2>

            {/* Pain points */}
            <div className="flex flex-col gap-[1.8vw] mt-[1vw] w-full max-w-[55vw]">
              {PROBLEMS.map((p, i) => (
                <AnimatePresence key={i}>
                  {visibleProblems > i && (
                    <motion.div
                      className="flex items-center gap-[2vw] bg-red-950/30 border border-red-900/40 rounded-[1.2vw] px-[2.5vw] py-[1.2vw]"
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                    >
                      <span className="text-[3vw]">{p.icon}</span>
                      <span className="text-[2.6vw] text-red-300 font-medium">{p.text}</span>
                      <span className="ml-auto text-[2.4vw] text-red-500 font-bold">✗</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              ))}
            </div>
          </motion.div>
        )}

        {/* Phase 2 — Solution */}
        {phase === 2 && (
          <motion.div
            key="solution"
            className="w-full flex flex-col items-center gap-[3vw]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Pivot heading */}
            <motion.p
              className="text-[3.5vw] font-semibold text-center text-[#8696A0] leading-snug"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Your AI receptionist is —
            </motion.p>
            <motion.h2
              className="text-[5vw] font-bold text-center text-[#25D366] leading-tight"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              everything a human isn't.
            </motion.h2>

            {/* Solutions */}
            <div className="flex flex-col gap-[1.8vw] mt-[1vw] w-full max-w-[55vw]">
              {SOLUTIONS.map((s, i) => (
                <AnimatePresence key={i}>
                  {visibleSolutions > i && (
                    <motion.div
                      className="flex items-center gap-[2vw] bg-[#25D366]/10 border border-[#25D366]/30 rounded-[1.2vw] px-[2.5vw] py-[1.2vw]"
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                    >
                      <span className="text-[3vw]">{s.icon}</span>
                      <span className="text-[2.6vw] text-[#25D366] font-medium">{s.text}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              ))}
            </div>
          </motion.div>
        )}

        {/* Phase 3 — Tagline close */}
        {phase === 3 && (
          <motion.div
            key="tagline"
            className="flex flex-col items-center gap-[2.5vw] text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="w-[8vw] h-[8vw] rounded-[2vw] bg-[#25D366] flex items-center justify-center shadow-[0_0_40px_rgba(37,211,102,0.4)]">
              <span className="text-[4.5vw]">🤖</span>
            </div>
            <h2 className="text-[5.5vw] font-bold text-white leading-tight">
              Meet <span className="text-[#25D366]">Priya</span>
            </h2>
            <p className="text-[3vw] text-[#8696A0]">
              Your AI WhatsApp receptionist — always on, never wrong.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
