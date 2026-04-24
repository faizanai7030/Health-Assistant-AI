import { useState } from "react";
import { useParams } from "wouter";
import {
  useGetDoctorPortal,
  useSetDoctorEmergencyViaPortal,
  useClearDoctorEmergencyViaPortal,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle, XCircle, User, CalendarDays } from "lucide-react";

export default function DoctorPortal() {
  const params = useParams<{ token: string }>();
  const token = params.token ?? "";
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [confirming, setConfirming] = useState<"late" | "absent" | null>(null);

  const { data, isLoading, isError } = useGetDoctorPortal(
    token,
    { query: { enabled: !!token, queryKey: ["portal", token] } }
  );

  const setEmergency = useSetDoctorEmergencyViaPortal();
  const clearEmergency = useClearDoctorEmergencyViaPortal();

  const handleEmergency = (type: "late" | "absent") => {
    if (confirming !== type) {
      setConfirming(type);
      return;
    }
    setConfirming(null);
    setEmergency.mutate({ token, data: { type } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["portal", token] });
        toast({
          title: type === "absent" ? "Marked as not coming today" : "Marked as running late",
          description: "Patients will not be booked for you today. Clinic staff has been notified.",
        });
      },
      onError: () => toast({ title: "Something went wrong", variant: "destructive" }),
    });
  };

  const handleClear = () => {
    setConfirming(null);
    clearEmergency.mutate({ token }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["portal", token] });
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
          <div className={`rounded-2xl p-5 mb-5 border-2 ${
            emergencyToday.type === "absent"
              ? "bg-red-50 border-red-200"
              : "bg-amber-50 border-amber-200"
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className={`h-6 w-6 ${
                emergencyToday.type === "absent" ? "text-red-500" : "text-amber-500"
              }`} />
              <div>
                <p className={`font-bold ${emergencyToday.type === "absent" ? "text-red-700" : "text-amber-700"}`}>
                  {emergencyToday.type === "absent" ? "Marked: Not Coming Today" : "Marked: Running Late Today"}
                </p>
                <p className={`text-sm ${emergencyToday.type === "absent" ? "text-red-600" : "text-amber-600"}`}>
                  Patients are not being booked for you today.
                </p>
              </div>
            </div>
            <button
              onClick={handleClear}
              className="w-full py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              ✓ I'm available now — Clear Status
            </button>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Emergency Controls</p>

            <button
              onClick={() => handleEmergency("late")}
              className={`w-full py-4 rounded-2xl border-2 font-bold text-lg transition-all active:scale-95 ${
                confirming === "late"
                  ? "bg-amber-500 text-white border-amber-500 shadow-lg"
                  : "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100"
              }`}
              disabled={setEmergency.isPending}
            >
              {confirming === "late" ? "⚠️ Tap again to confirm — Running Late" : "⏱ I Will Be Late Today"}
            </button>

            <button
              onClick={() => handleEmergency("absent")}
              className={`w-full py-4 rounded-2xl border-2 font-bold text-lg transition-all active:scale-95 ${
                confirming === "absent"
                  ? "bg-red-600 text-white border-red-600 shadow-lg"
                  : "bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
              }`}
              disabled={setEmergency.isPending}
            >
              {confirming === "absent" ? "🚨 Tap again to confirm — Not Coming" : "🚫 I Cannot Come Today"}
            </button>

            {confirming && (
              <button
                onClick={() => setConfirming(null)}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            )}
          </div>
        )}

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
          <p className="text-xs text-gray-300">Doctor Portal • I'll Handle It</p>
        </div>
      </div>
    </div>
  );
}
