import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const APPOINTMENTS_BEFORE = [
  { token: '#3', patient: 'Sunita Mehta',    time: '9:00 AM',  status: 'Completed' },
  { token: '#4', patient: 'Arvind Kapoor',   time: '9:30 AM',  status: 'Completed' },
  { token: '#5', patient: 'Priya Nair',      time: '10:00 AM', status: 'In Queue'  },
];

const NEW_APPOINTMENT = {
  token: '#7', patient: 'Rahul Kumar', time: '10:30 AM', status: 'Confirmed', source: 'WhatsApp AI',
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Completed:  'bg-[#1a3a2a] text-[#4ade80]',
    'In Queue': 'bg-[#2a2a1a] text-[#facc15]',
    Confirmed:  'bg-[#1a3a2a] text-[#25D366]',
  };
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${styles[status] ?? 'bg-white/10 text-white/60'}`}>
      {status}
    </span>
  );
}

export function ScenePortal() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),   // table rows fade in
      setTimeout(() => setPhase(2), 1400),  // new row slides in with glow
      setTimeout(() => setPhase(3), 2200),  // badge + source tag highlight
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center bg-[#050a08]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Laptop shell */}
      <motion.div
        className="relative"
        initial={{ scale: 0.94, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Screen bezel */}
        <div className="w-[860px] bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] shadow-2xl overflow-hidden">
          {/* Screen chrome bar */}
          <div className="h-7 bg-[#111] flex items-center px-3 gap-1.5 border-b border-[#222]">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
            <div className="mx-auto bg-[#1e1e1e] rounded px-16 py-0.5 text-[10px] text-[#555]">
              health-assistant-ai.replit.app/appointments
            </div>
          </div>

          {/* App layout */}
          <div className="flex h-[520px]">
            {/* Sidebar */}
            <div className="w-[200px] bg-[#0f1923] border-r border-[#1e2a35] flex flex-col shrink-0">
              <div className="px-4 py-5">
                <div className="text-[#25D366] font-display font-bold text-sm leading-tight">A.I'll Handle It</div>
                <div className="text-[#4a6070] text-[10px] mt-0.5">City Care Clinic</div>
              </div>
              <nav className="flex-1 px-2 space-y-0.5">
                {[
                  { label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
                  { label: 'Appointments', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', active: true },
                  { label: 'Doctors', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
                  { label: 'Conversations', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
                ].map(({ label, icon, active }) => (
                  <div key={label} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs cursor-default ${active ? 'bg-[#25D366]/10 text-[#25D366]' : 'text-[#4a6070] hover:text-white'}`}>
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={icon} /></svg>
                    {label}
                  </div>
                ))}
              </nav>
            </div>

            {/* Main content */}
            <div className="flex-1 bg-[#0d1820] p-5 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-white font-display font-semibold text-base">Today's Appointments</h1>
                  <p className="text-[#4a6070] text-xs mt-0.5">Dr. Sharma — May 10, 2026</p>
                </div>
                <div className="flex items-center gap-2">
                  <motion.div
                    className="bg-[#25D366]/10 border border-[#25D366]/20 rounded-lg px-3 py-1.5 flex items-center gap-1.5"
                    animate={phase >= 2 ? { borderColor: 'rgba(37,211,102,0.5)', backgroundColor: 'rgba(37,211,102,0.15)' } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    <motion.div
                      className="w-1.5 h-1.5 rounded-full bg-[#25D366]"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    />
                    <span className="text-[#25D366] text-xs font-medium">WhatsApp AI Active</span>
                  </motion.div>
                </div>
              </div>

              {/* Table */}
              <div className="flex-1 rounded-xl border border-[#1e2a35] overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-[48px_1fr_120px_100px_110px_90px] bg-[#0f1923] border-b border-[#1e2a35] px-4 py-2.5 text-[10px] text-[#4a6070] font-medium uppercase tracking-wider">
                  <span>Token</span>
                  <span>Patient</span>
                  <span>Time</span>
                  <span>Doctor</span>
                  <span>Status</span>
                  <span>Source</span>
                </div>

                {/* Existing rows */}
                <div className="divide-y divide-[#1e2a35]">
                  {APPOINTMENTS_BEFORE.map((appt, i) => (
                    <motion.div
                      key={appt.token}
                      className="grid grid-cols-[48px_1fr_120px_100px_110px_90px] px-4 py-3 text-xs text-[#8696A0] items-center"
                      initial={{ opacity: 0, x: -10 }}
                      animate={phase >= 1 ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                      transition={{ delay: i * 0.08, duration: 0.3 }}
                    >
                      <span className="text-white/40 font-mono">{appt.token}</span>
                      <span className="text-[#8696A0]">{appt.patient}</span>
                      <span>{appt.time}</span>
                      <span>Dr. Sharma</span>
                      <span><StatusBadge status={appt.status} /></span>
                      <span className="text-[#4a6070] text-[10px]">Walk-in</span>
                    </motion.div>
                  ))}

                  {/* New appointment row */}
                  <motion.div
                    className="grid grid-cols-[48px_1fr_120px_100px_110px_90px] px-4 py-3 text-xs items-center relative"
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={phase >= 2 ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 12, scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                  >
                    {/* Glow highlight */}
                    <motion.div
                      className="absolute inset-0 bg-[#25D366]/5 rounded pointer-events-none"
                      initial={{ opacity: 0 }}
                      animate={phase >= 2 ? { opacity: [0, 1, 0.6] } : { opacity: 0 }}
                      transition={{ duration: 0.8 }}
                    />
                    <motion.div
                      className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#25D366] rounded-l"
                      initial={{ scaleY: 0 }}
                      animate={phase >= 2 ? { scaleY: 1 } : { scaleY: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      style={{ transformOrigin: 'top' }}
                    />
                    <span className="text-[#25D366] font-mono font-bold relative z-10">{NEW_APPOINTMENT.token}</span>
                    <span className="text-white font-medium relative z-10">{NEW_APPOINTMENT.patient}</span>
                    <span className="text-[#8696A0] relative z-10">{NEW_APPOINTMENT.time}</span>
                    <span className="text-[#8696A0] relative z-10">Dr. Sharma</span>
                    <span className="relative z-10">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={phase >= 3 ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      >
                        <StatusBadge status={NEW_APPOINTMENT.status} />
                      </motion.div>
                    </span>
                    <motion.span
                      className="text-[#25D366]/80 text-[10px] font-medium relative z-10"
                      initial={{ opacity: 0 }}
                      animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      WhatsApp AI
                    </motion.span>
                  </motion.div>
                </div>
              </div>

              {/* Footer note */}
              <motion.p
                className="text-[#4a6070] text-[10px] mt-3 text-center"
                initial={{ opacity: 0 }}
                animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                Booked automatically by Priya · No staff involvement
              </motion.p>
            </div>
          </div>
        </div>

        {/* Laptop base */}
        <div className="w-[900px] h-4 bg-[#1a1a1a] rounded-b-xl mx-auto -mt-px shadow-xl border-t border-[#2a2a2a]" />
        <div className="w-[500px] h-2.5 bg-[#111] rounded-b-lg mx-auto" />
      </motion.div>
    </motion.div>
  );
}
