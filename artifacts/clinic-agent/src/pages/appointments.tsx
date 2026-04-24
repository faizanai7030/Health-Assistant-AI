import { useState } from "react";
import { useListAppointments, getListAppointmentsQueryKey, useUpdateAppointment } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";

export default function Appointments() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedDoctor, setSelectedDoctor] = useState<string>("all");

  const { data: appointments, isLoading } = useListAppointments({
    query: { queryKey: getListAppointmentsQueryKey(), refetchInterval: 30000 }
  });

  const updateApt = useUpdateAppointment();

  const handleStatusChange = (id: number, newStatus: string) => {
    updateApt.mutate({ id, data: { status: newStatus } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
        toast({ title: "Appointment status updated" });
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-blue-100 text-blue-800 border-blue-200";
      case "confirmed": return "bg-primary/20 text-primary border-primary/30";
      case "cancelled": return "bg-destructive/20 text-destructive border-destructive/30";
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      default: return "";
    }
  };

  const doctors = appointments
    ? Array.from(new Map(appointments.map((a) => [a.doctorName, a.doctorSpecialization])).entries())
    : [];

  const filtered = selectedDoctor === "all"
    ? appointments
    : appointments?.filter((a) => a.doctorName === selectedDoctor);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Appointments</h1>
        <p className="text-muted-foreground mt-1">Filter by doctor to see their individual appointment list.</p>
      </div>

      {!isLoading && doctors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedDoctor("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
              selectedDoctor === "all"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-white text-muted-foreground border-border hover:border-primary hover:text-primary"
            }`}
          >
            All Doctors
            <span className="ml-2 text-xs opacity-70">({appointments?.length ?? 0})</span>
          </button>
          {doctors.map(([name, spec]) => {
            const count = appointments?.filter((a) => a.doctorName === name).length ?? 0;
            return (
              <button
                key={name}
                onClick={() => setSelectedDoctor(name)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                  selectedDoctor === name
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-white text-muted-foreground border-border hover:border-primary hover:text-primary"
                }`}
              >
                {name}
                <span className="ml-1 text-xs opacity-70">· {spec}</span>
                <span className="ml-2 text-xs opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedDoctor === "all" ? "All Appointments" : `${selectedDoctor}'s Appointments`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : filtered?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="mx-auto h-12 w-12 opacity-20 mb-4" />
              <p>No appointments found.</p>
            </div>
          ) : (
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors">
                    <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground w-16">Token</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date & Time</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Patient</th>
                    {selectedDoctor === "all" && (
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Doctor</th>
                    )}
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {filtered?.map((apt) => (
                    <tr key={apt.id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle text-center">
                        {apt.tokenNumber != null ? (
                          <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                            {apt.tokenNumber}
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-muted text-muted-foreground text-xs">
                            —
                          </div>
                        )}
                      </td>
                      <td className="p-4 align-middle">
                        <div className="font-medium">{format(parseISO(apt.appointmentDate), "MMM d, yyyy")}</div>
                        <div className="text-xs text-muted-foreground flex items-center mt-1">
                          <Clock className="w-3 h-3 mr-1" /> {apt.timeSlot}
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="font-medium">{apt.patientName}</div>
                        <div className="text-xs text-muted-foreground">{apt.patientPhone}</div>
                      </td>
                      {selectedDoctor === "all" && (
                        <td className="p-4 align-middle">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                              {apt.doctorName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium">{apt.doctorName}</div>
                              <div className="text-[10px] text-muted-foreground">{apt.doctorSpecialization}</div>
                            </div>
                          </div>
                        </td>
                      )}
                      <td className="p-4 align-middle">
                        <Badge variant="outline" className={getStatusColor(apt.status)}>
                          {apt.status}
                        </Badge>
                      </td>
                      <td className="p-4 align-middle">
                        <Select
                          value={apt.status}
                          onValueChange={(val) => handleStatusChange(apt.id, val)}
                        >
                          <SelectTrigger className="w-[130px] h-8 text-xs">
                            <SelectValue placeholder="Update Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
