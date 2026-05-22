import { useState } from "react";
import { useParams } from "wouter";
import {
  useGetDoctorPortal,
  useSetDoctorEmergencyViaPortal,
  useClearDoctorEmergencyViaPortal,
  getGetDoctorPortalQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle, XCircle, User, CalendarDays, PauseCircle } from "lucide-react";

const LATE_OPTIONS = [
  { label: "15 min", minutes: 15 },
  { label: "30 min", minutes: 30 },
  { label: "1 hour", minutes: 60 },
  { label: "2 hours", minutes: 120 },
];

type ConfirmingType = "late" | "absent" | "paused" | null;

export default function DoctorPortal() {
  const params = useParams<{ token: string }>();
  const token = params.token ?? "";
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [confirming, setConfirming] = useState<ConfirmingType>(null);
  const [selectedMinutes, setSelectedMinutes] = useState<number | null>(null);

  const { data, isLoading, isError } = useGetDoctorPortal(
    token,
    { query: { enabled: !!token } }
  );

  const setEmergency = useSetDoctorEmergencyViaPortal();
  const clearEmergency = useClearDoctorEmergencyViaPortal();

  const handleLateButtonTap = () => {
    if (confirming !== "late") {
      setConfirming("late");
      setSelectedMinutes(null);
      return;
    }
    if (!selectedMinutes) return;
    setConfirming(null);
    setSelectedMinutes(null);
    setEmergency.mutate({ token, data: { type: "late", lateByMinutes: selectedMinutes } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDoctorPortalQueryKey(token) });
        const label = LATE_OPTIONS.find((o) => o.minutes === selectedMinutes)?.label ?? "";
        toast({
          title: `Marked as running ${label} late`,
          description: "Patients have been notified automatically.",
        });
      },
      onError: () => toast({ title: "Something went wrong", variant: "destructive" }),
    });
  };

  const handleAbsent = () => {
    if (confirming !== "absent") {
      setConfirming("absent");
      setSelectedMinutes(null);
      return;
    }
    setConfirming(null);
    setEmergency.mutate({ token, data: { type: "absent" } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDoctorPortalQueryKey(token) });
        toast({
          title: "Marked as not coming today",
          description: "Patients have been notified automatically.",
        });
      },
      onError: () => toast({ title: "Something went wrong", variant: "destructive" }),
    });
  };

  const handlePause = () => {
    if (confirming !== "paused") {
      setConfirming("paused");
      setSelectedMinutes(null);
      return;
    }
    setConfirming(null);
    setEmergency.mutate({ token, data: { type: "paused" } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDoctorPortalQueryKey(token) });
        toast({
          title: "AI bookings paused for today",
          description: "Priya will not accept new appointment requests for you today.",
        });
      },
      onError: () => toast({ title: "Something went wrong", variant: "destructive" }),
    });
  };

  const handleClear = () => {
    setConfirming(null);
    setSelectedMinutes(null);
    clearEmergency.mutate({ token }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDoctorPortalQueryKey(token) });
        toast({ title: "Status cleared — you're available again" });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 max-w-md mx-auto pt-10">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-32 mb-8" />
        <Skeleton className="h-40 w-full rounded-2xl mb-4" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Invalid Link</h2>
          <p className="text-gray-500">This portal link is not valid. Please contact the clinic administrator.</p>
        </div>
      </div>
    );
  }

  const { doctor, todayAppointments, emergencyToday } = data;
  const today = new Date();
  const todayLabel = today.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const lateDelayLabel = emergencyToday?.lateByMinutes === 15 ? "15 minutes"
    : emergencyToday?.lateByMinutes === 30 ? "30 minutes"
    : emergencyToday?.lateByMinutes === 60 ? "1 hour"
    : emergencyToday?.lateByMinutes === 120 ? "2 hours"
    : null;

  const emergencyBg =
    emergencyToday?.type === "absent" ? "bg-red-50 border-red-200" :
    emergencyToday?.type === "paused" ? "bg-indigo-50 border-indigo-200" :
    "bg-amber-50 border-amber-200";

  const emergencyIcon =
    emergencyToday?.type === "absent" ? "text-red-500" :
    emergencyToday?.type === "paused" ? "text-indigo-500" :
    "text-amber-500";

  const emergencyTextColor =
    emergencyToday?.type === "absent" ? "text-red-700" :
    emergencyToday?.type === "paused" ? "text-indigo-700" :
    "text-amber-700";

  const emergencySubColor =
    emergencyToday?.type === "absent" ? "text-red-600" :
    emergencyToday?.type === "paused" ? "text-indigo-600" :
    "text-amber-600";

  const emergencyTitle =
    emergencyToday?.type === "absent" ? "Marked: Not Coming Today" :
    emergencyToday?.type === "paused" ? "AI Bookings Paused Today" :
    "Marked: Running Late Today";

  const emergencyDesc =
    emergencyToday?.type === "absent" ? "All patients have been notified via WhatsApp." :
    emergencyToday?.type === "paused" ? "Priya will not accept new appointment requests for you today." :
    "All patients have been notified via WhatsApp.";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-md mx-auto px-4 pb-12 pt-6">

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{doctor.name}</h1>
              <p className="text-sm text-gray-500">{doctor.specialization}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">{todayLabel}</p>
        </div>

        {emergencyToday ? (
          <div className={`rounded-2xl p-5 mb-5 border-2 ${emergencyBg}`}>
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className={`h-6 w-6 ${emergencyIcon}`} />
              <div>
                <p className={`font-bold ${emergencyTextColor}`}>{emergencyTitle}</p>
                {emergencyToday.type === "late" && lateDelayLabel && (
                  <p className="text-sm text-amber-600 font-semibold">Delay: ~{lateDelayLabel}</p>
                )}
                <p className={`text-sm ${emergencySubColor}`}>{emergencyDesc}</p>
              </div>
            </div>
            <button
              onClick={handleClear}
              className="w-full py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              ✓ Clear Status — I'm Available Now
            </button>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Controls</p>

            {/* LATE button with time picker */}
            {confirming === "late" ? (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 space-y-3">
                <p className="text-amber-800 font-bold text-center">⏱ How late will you be?</p>
                <div className="grid grid-cols-2 gap-2">
                  {LATE_OPTIONS.map((opt) => (
                    <button
                      key={opt.minutes}
                      onClick={() => setSelectedMinutes(opt.minutes)}
                      className={`py-3 rounded-xl border-2 font-bold text-base transition-all active:scale-95 ${
                        selectedMinutes === opt.minutes
                          ? "bg-amber-500 text-white border-amber-500 shadow-lg"
                          : "bg-white text-amber-700 border-amber-300 hover:bg-amber-100"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {selectedMinutes && (
                  <button
                    onClick={handleLateButtonTap}
                    disabled={setEmergency.isPending}
                    className="w-full py-3 rounded-xl bg-amber-500 text-white font-bold text-base shadow-lg active:scale-95 transition-all"
                  >
                    ⚠️ Confirm — I'll be {LATE_OPTIONS.find((o) => o.minutes === selectedMinutes)?.label} late
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={handleLateButtonTap}
                className="w-full py-4 rounded-2xl border-2 font-bold text-lg transition-all active:scale-95 bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100"
                disabled={setEmergency.isPending}
              >
                ⏱ I Will Be Late Today
              </button>
            )}

            {/* ABSENT button */}
            <button
              onClick={handleAbsent}
              className={`w-full py-4 rounded-2xl border-2 font-bold text-lg transition-all active:scale-95 ${
                confirming === "absent"
                  ? "bg-red-600 text-white border-red-600 shadow-lg"
                  : "bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
              }`}
              disabled={setEmergency.isPending}
            >
              {confirming === "absent" ? "🚨 Tap again to confirm — Not Coming" : "🚫 I Cannot Come Today"}
            </button>

            {/* PAUSE AI BOOKINGS button */}
            <button
              onClick={handlePause}
              className={`w-full py-4 rounded-2xl border-2 font-bold text-lg transition-all active:scale-95 ${
                confirming === "paused"
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-lg"
                  : "bg-indigo-50 text-indigo-700 border-indigo-300 hover:bg-indigo-100"
              }`}
              disabled={setEmergency.isPending}
            >
              {confirming === "paused"
                ? "⏸ Tap again to confirm — Pause Bookings"
                : <span className="flex items-center justify-center gap-2"><PauseCircle className="h-5 w-5" /> Pause AI Bookings Today</span>
              }
            </button>

            {confirming && (
              <button
                onClick={() => { setConfirming(null); setSelectedMinutes(null); }}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            )}
          </div>
        )}

        {/* TODAY'S APPOINTMENTS */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="h-4 w-4 text-gray-500" />
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              Today's Schedule ({todayAppointments.length} patients)
            </p>
          </div>

          {todayAppointments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <CheckCircle className="h-10 w-10 text-green-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No appointments today</p>
              <p className="text-sm text-gray-400 mt-1">Your schedule is clear.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayAppointments.map((appt) => (
                <div
                  key={appt.id}
                  className={`bg-white rounded-2xl border p-4 flex items-center gap-3 ${
                    appt.status === "cancelled" ? "opacity-50" : ""
                  }`}
                >
                  <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 shadow">
                    <span className="text-white font-bold text-sm">
                      {appt.tokenNumber != null ? appt.tokenNumber : "—"}
                    </span>
                  </div>
                  <div className="h-10 w-14 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-blue-700 font-bold text-xs">{appt.timeSlot}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{appt.patientName}</p>
                    <p className="text-sm text-gray-500">{appt.patientPhone}</p>
                    {appt.notes && <p className="text-xs text-gray-400 mt-0.5 truncate">{appt.notes}</p>}
                  </div>
                  <div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      appt.status === "completed" ? "bg-green-100 text-green-700" :
                      appt.status === "cancelled" ? "bg-red-100 text-red-700" :
                      appt.status === "confirmed" ? "bg-blue-100 text-blue-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {appt.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-300">Doctor Portal • A.I'll Handle It</p>
        </div>
      </div>
    </div>
  );
}
