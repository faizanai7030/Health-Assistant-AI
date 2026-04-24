import { useState } from "react";
import {
  useListAppointments,
  getListAppointmentsQueryKey,
  useUpdateAppointment,
  useCreateAppointment,
  useDeleteAppointment,
  useListDoctors,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Clock, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

function generateTimeSlots(start: string, end: string, duration: number): string[] {
  const slots: string[] = [];
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let cur = sh * 60 + sm;
  const endTotal = eh * 60 + em;
  while (cur < endTotal) {
    slots.push(`${String(Math.floor(cur / 60)).padStart(2, "0")}:${String(cur % 60).padStart(2, "0")}`);
    cur += duration;
  }
  return slots;
}

const walkinSchema = z.object({
  patientName: z.string().min(1, "Patient name is required"),
  patientPhone: z.string().min(5, "Phone number is required"),
  doctorId: z.coerce.number().min(1, "Select a doctor"),
  appointmentDate: z.string().min(1, "Select a date"),
  timeSlot: z.string().min(1, "Select a time slot"),
  notes: z.string().optional(),
});
type WalkinForm = z.infer<typeof walkinSchema>;

export default function Appointments() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedDoctor, setSelectedDoctor] = useState<string>("all");
  const [showWalkin, setShowWalkin] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data: appointments, isLoading } = useListAppointments(
    undefined,
    { query: { queryKey: getListAppointmentsQueryKey(), refetchInterval: 15000 } }
  );
  const { data: doctors } = useListDoctors();
  const updateApt = useUpdateAppointment();
  const createApt = useCreateAppointment();
  const deleteApt = useDeleteAppointment();

  const form = useForm<WalkinForm>({
    resolver: zodResolver(walkinSchema),
    defaultValues: {
      patientName: "",
      patientPhone: "",
      doctorId: 0,
      appointmentDate: new Date().toISOString().split("T")[0],
      timeSlot: "",
      notes: "",
    },
  });

  const watchDoctorId = form.watch("doctorId");
  const selectedDoctorObj = doctors?.find((d) => d.id === Number(watchDoctorId));
  const timeSlots = selectedDoctorObj
    ? generateTimeSlots(selectedDoctorObj.workingHoursStart, selectedDoctorObj.workingHoursEnd, selectedDoctorObj.slotDurationMinutes)
    : [];

  const handleStatusChange = (id: number, newStatus: string) => {
    updateApt.mutate({ id, data: { status: newStatus } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
        toast({ title: "Appointment status updated" });
      }
    });
  };

  const handleDelete = (id: number) => {
    setDeletingId(id);
    deleteApt.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
        toast({ title: "Appointment removed" });
        setDeletingId(null);
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to remove appointment", variant: "destructive" });
        setDeletingId(null);
      },
    });
  };

  const onWalkinSubmit = (values: WalkinForm) => {
    createApt.mutate({
      data: {
        patientName: values.patientName,
        patientPhone: values.patientPhone,
        doctorId: values.doctorId,
        appointmentDate: values.appointmentDate,
        timeSlot: values.timeSlot,
        notes: values.notes ?? null,
        status: "scheduled",
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
        toast({ title: "Walk-in appointment booked", description: `${values.patientName} has been added.` });
        setShowWalkin(false);
        form.reset();
      },
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : "Could not book appointment";
        toast({ title: "Error", description: msg, variant: "destructive" });
      },
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

  const doctorFilters = appointments
    ? Array.from(new Map(appointments.map((a) => [a.doctorName, a.doctorSpecialization])).entries())
    : [];

  const filtered = selectedDoctor === "all"
    ? appointments
    : appointments?.filter((a) => a.doctorName === selectedDoctor);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Appointments</h1>
          <p className="text-muted-foreground mt-1">Manage all appointments. Walk-ins can be added manually.</p>
        </div>
        <Button onClick={() => setShowWalkin(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Book Walk-in
        </Button>
      </div>

      {/* Walk-in Dialog */}
      <Dialog open={showWalkin} onOpenChange={(o) => { setShowWalkin(o); if (!o) form.reset(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Book Walk-in Appointment</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onWalkinSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="patientName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient Name</FormLabel>
                    <FormControl><Input placeholder="Full name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="patientPhone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl><Input placeholder="+91..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="doctorId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Doctor</FormLabel>
                  <Select onValueChange={(v) => { field.onChange(Number(v)); form.setValue("timeSlot", ""); }} value={field.value ? String(field.value) : ""}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {doctors?.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>{d.name} — {d.specialization}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="appointmentDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="timeSlot" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Slot</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={timeSlots.length === 0}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder={timeSlots.length === 0 ? "Select doctor first" : "Pick time"} /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeSlots.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl><Input placeholder="Reason for visit, symptoms..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => { setShowWalkin(false); form.reset(); }}>Cancel</Button>
                <Button type="submit" disabled={createApt.isPending}>
                  {createApt.isPending ? "Booking..." : "Book Appointment"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Doctor filter tabs */}
      {!isLoading && doctorFilters.length > 0 && (
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
          {doctorFilters.map(([name, spec]) => {
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
              <Button variant="outline" className="mt-4" onClick={() => setShowWalkin(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Walk-in
              </Button>
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
                        <div className="flex items-center gap-2">
                          <Select
                            value={apt.status}
                            onValueChange={(val) => handleStatusChange(apt.id, val)}
                          >
                            <SelectTrigger className="w-[120px] h-8 text-xs">
                              <SelectValue placeholder="Update Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="scheduled">Scheduled</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            disabled={deletingId === apt.id}
                            onClick={() => {
                              if (confirm(`Remove ${apt.patientName}'s appointment?`)) {
                                handleDelete(apt.id);
                              }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
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
