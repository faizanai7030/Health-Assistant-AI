import { useState } from "react";
import {
  useListDoctors,
  getListDoctorsQueryKey,
  useCreateDoctor,
  useUpdateDoctor,
  useDeleteDoctor,
  useGetDoctorEmergenciesToday,
  useSetDoctorEmergency,
  useClearDoctorEmergency,
  useListAppointments,
  getListAppointmentsQueryKey,
  useCreateAppointment,
  useDeleteAppointment,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, User, Stethoscope, Phone, Clock, Pencil, Trash2, Link2, AlertTriangle, XCircle, CalendarDays } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { format, parseISO } from "date-fns";

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

const doctorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  specialization: z.string().min(1, "Specialization is required"),
  phone: z.string().min(1, "Phone is required"),
  maxPatientsPerSlot: z.coerce.number().min(1),
  workingHoursStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format HH:MM"),
  workingHoursEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format HH:MM"),
  slotDurationMinutes: z.coerce.number().min(5).max(120),
  workingDays: z.string().min(1, "Working days required (e.g. 1,2,3,4,5)")
});

const walkinSchema = z.object({
  patientName: z.string().min(1, "Patient name is required"),
  patientPhone: z.string().min(5, "Phone number is required"),
  appointmentDate: z.string().min(1, "Select a date"),
  timeSlot: z.string().min(1, "Select a time slot"),
  notes: z.string().optional(),
});
type WalkinForm = z.infer<typeof walkinSchema>;

function DoctorScheduleDialog({ doctor }: { doctor: { id: number; name: string; specialization: string; workingHoursStart: string; workingHoursEnd: string; slotDurationMinutes: number } }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [showWalkin, setShowWalkin] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: appointments, isLoading } = useListAppointments(
    { doctorId: doctor.id, date },
    { query: { queryKey: [...getListAppointmentsQueryKey(), doctor.id, date], enabled: open, refetchInterval: open ? 15000 : false } }
  );

  const createApt = useCreateAppointment();
  const deleteApt = useDeleteAppointment();

  const timeSlots = generateTimeSlots(doctor.workingHoursStart, doctor.workingHoursEnd, doctor.slotDurationMinutes);

  const form = useForm<WalkinForm>({
    resolver: zodResolver(walkinSchema),
    defaultValues: { patientName: "", patientPhone: "", appointmentDate: date, timeSlot: "", notes: "" },
  });

  const onWalkin = (values: WalkinForm) => {
    createApt.mutate({
      data: {
        patientName: values.patientName,
        patientPhone: values.patientPhone,
        doctorId: doctor.id,
        appointmentDate: values.appointmentDate,
        timeSlot: values.timeSlot,
        notes: values.notes ?? null,
        status: "scheduled",
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
        toast({ title: "Walk-in booked", description: `${values.patientName} added to Dr. ${doctor.name}'s schedule.` });
        setShowWalkin(false);
        form.reset({ patientName: "", patientPhone: "", appointmentDate: date, timeSlot: "", notes: "" });
      },
      onError: (err: unknown) => {
        toast({ title: "Error", description: err instanceof Error ? err.message : "Booking failed", variant: "destructive" });
      },
    });
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Remove ${name}'s appointment?`)) {
      deleteApt.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
          toast({ title: "Appointment removed" });
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex-1 text-primary border-primary/30 hover:bg-primary/5">
          <CalendarDays className="w-4 h-4 mr-1" /> Schedule
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dr. {doctor.name} — {doctor.specialization}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 mb-4">
          <Input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              form.setValue("appointmentDate", e.target.value);
            }}
            className="w-48"
          />
          <Button size="sm" onClick={() => { setShowWalkin(true); form.setValue("appointmentDate", date); }}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Book Walk-in
          </Button>
        </div>

        {showWalkin && (
          <div className="border rounded-lg p-4 mb-4 bg-muted/30">
            <div className="font-medium text-sm mb-3">New Walk-in for {format(parseISO(date), "MMM d, yyyy")}</div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onWalkin)} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="patientName" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Patient Name</FormLabel>
                      <FormControl><Input placeholder="Full name" className="h-8 text-sm" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="patientPhone" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Phone</FormLabel>
                      <FormControl><Input placeholder="+91..." className="h-8 text-sm" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="timeSlot" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Time Slot</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Pick time" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {timeSlots.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Notes (optional)</FormLabel>
                      <FormControl><Input placeholder="Reason..." className="h-8 text-sm" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={createApt.isPending}>
                    {createApt.isPending ? "Booking..." : "Confirm Walk-in"}
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => { setShowWalkin(false); form.reset(); }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : !appointments?.length ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No appointments for this date.
          </div>
        ) : (
          <div className="space-y-2">
            {appointments.map((apt) => (
              <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center">
                    {apt.tokenNumber ?? "—"}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{apt.patientName}</div>
                    <div className="text-xs text-muted-foreground">{apt.patientPhone} · {apt.timeSlot}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      apt.status === "scheduled" ? "bg-blue-100 text-blue-800 border-blue-200 text-xs" :
                      apt.status === "confirmed" ? "bg-green-100 text-green-800 border-green-200 text-xs" :
                      apt.status === "cancelled" ? "bg-red-100 text-red-800 border-red-200 text-xs" :
                      "bg-gray-100 text-gray-800 border-gray-200 text-xs"
                    }
                  >
                    {apt.status}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(apt.id, apt.patientName)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function Doctors() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: doctors, isLoading } = useListDoctors({
    query: { queryKey: getListDoctorsQueryKey(), refetchInterval: 30000 }
  });

  const { data: emergencies } = useGetDoctorEmergenciesToday({
    query: { refetchInterval: 15000 }
  });

  const createDoc = useCreateDoctor();
  const updateDoc = useUpdateDoctor();
  const deleteDoc = useDeleteDoctor();
  const setEmergency = useSetDoctorEmergency();
  const clearEmergency = useClearDoctorEmergency();

  const emergencyMap = new Map(emergencies?.map((e) => [e.doctorId, e]) ?? []);

  const form = useForm<z.infer<typeof doctorSchema>>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      name: "",
      specialization: "",
      phone: "",
      maxPatientsPerSlot: 1,
      workingHoursStart: "09:00",
      workingHoursEnd: "17:00",
      slotDurationMinutes: 30,
      workingDays: "1,2,3,4,5",
    }
  });

  const onSubmit = (values: z.infer<typeof doctorSchema>) => {
    if (editingId) {
      updateDoc.mutate({ id: editingId, data: values }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListDoctorsQueryKey() });
          toast({ title: "Doctor updated successfully" });
          setIsDialogOpen(false);
        }
      });
    } else {
      createDoc.mutate({ data: values }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListDoctorsQueryKey() });
          toast({ title: "Doctor added successfully" });
          setIsDialogOpen(false);
        }
      });
    }
  };

  const handleEdit = (doctor: any) => {
    setEditingId(doctor.id);
    form.reset({
      name: doctor.name,
      specialization: doctor.specialization,
      phone: doctor.phone,
      maxPatientsPerSlot: doctor.maxPatientsPerSlot,
      workingHoursStart: doctor.workingHoursStart,
      workingHoursEnd: doctor.workingHoursEnd,
      slotDurationMinutes: doctor.slotDurationMinutes,
      workingDays: doctor.workingDays,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this doctor?")) {
      deleteDoc.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListDoctorsQueryKey() });
          toast({ title: "Doctor deleted successfully" });
        }
      });
    }
  };

  const copyPortalLink = (token: string) => {
    const base = window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, "");
    const url = `${base}/doctor-portal/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      toast({ title: "Portal link copied!", description: "Share this with the doctor to open on their phone." });
    });
  };

  const handleSetEmergency = (doctorId: number, type: "late" | "absent") => {
    setEmergency.mutate({ id: doctorId, data: { type } }, {
      onSuccess: () => {
        queryClient.invalidateQueries();
        toast({ title: `Doctor marked as ${type === "absent" ? "not coming today" : "running late"}` });
      },
    });
  };

  const handleClearEmergency = (doctorId: number) => {
    clearEmergency.mutate({ id: doctorId }, {
      onSuccess: () => {
        queryClient.invalidateQueries();
        toast({ title: "Emergency status cleared" });
      },
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Doctors</h1>
          <p className="text-muted-foreground mt-1">Manage medical staff and their schedules. Click "Schedule" on any doctor to view or add walk-in appointments.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingId(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Doctor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Doctor' : 'Add New Doctor'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="specialization" render={({ field }) => (
                    <FormItem><FormLabel>Specialization</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="workingDays" render={({ field }) => (
                    <FormItem><FormLabel>Working Days (0-6)</FormLabel><FormControl><Input {...field} placeholder="1,2,3,4,5" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="workingHoursStart" render={({ field }) => (
                    <FormItem><FormLabel>Start Time</FormLabel><FormControl><Input {...field} placeholder="09:00" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="workingHoursEnd" render={({ field }) => (
                    <FormItem><FormLabel>End Time</FormLabel><FormControl><Input {...field} placeholder="17:00" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="slotDurationMinutes" render={({ field }) => (
                    <FormItem><FormLabel>Slot Duration (mins)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="maxPatientsPerSlot" render={({ field }) => (
                    <FormItem><FormLabel>Max Patients/Slot</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createDoc.isPending || updateDoc.isPending}>
                    {editingId ? 'Update Doctor' : 'Save Doctor'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {emergencies && emergencies.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <p className="font-semibold text-red-700">Today's Emergency Alerts</p>
          </div>
          <div className="space-y-1">
            {emergencies.map((e) => (
              <p key={e.id} className="text-sm text-red-600">
                {e.doctorName} — {e.type === "absent" ? "Not coming today" : "Running late"}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          [1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-2/3" /><Skeleton className="h-4 w-1/3" /></CardHeader>
              <CardContent><Skeleton className="h-20 w-full" /></CardContent>
            </Card>
          ))
        ) : doctors?.length === 0 ? (
          <div className="col-span-3 text-center py-12 bg-card rounded-lg border border-dashed">
            <User className="mx-auto h-12 w-12 text-muted-foreground opacity-20 mb-4" />
            <h3 className="text-lg font-medium text-foreground">No doctors added</h3>
            <p className="text-sm text-muted-foreground">Add your first doctor to start scheduling.</p>
          </div>
        ) : (
          doctors?.map(doctor => {
            const emergency = emergencyMap.get(doctor.id);
            return (
              <Card key={doctor.id} className={emergency ? "border-red-200" : ""}>
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{doctor.name}</CardTitle>
                      <CardDescription className="flex items-center mt-1 text-primary font-medium">
                        <Stethoscope className="w-3.5 h-3.5 mr-1" />
                        {doctor.specialization}
                      </CardDescription>
                    </div>
                    <Badge variant={doctor.isActive ? "default" : "secondary"}>
                      {doctor.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {emergency && (
                    <div className={`rounded-lg px-3 py-2 mb-3 text-sm font-medium flex items-center justify-between ${
                      emergency.type === "absent" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4" />
                        {emergency.type === "absent" ? "Not coming today" : "Running late today"}
                      </span>
                      <button
                        onClick={() => handleClearEmergency(doctor.id)}
                        className="ml-2 hover:opacity-70"
                        title="Clear emergency"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2" />
                      {doctor.phone}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      {doctor.workingHoursStart} - {doctor.workingHoursEnd} ({doctor.slotDurationMinutes}m slots)
                    </div>

                    {!emergency && (
                      <div className="flex gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-amber-600 border-amber-200 hover:bg-amber-50"
                          onClick={() => handleSetEmergency(doctor.id, "late")}
                        >
                          ⏱ Late
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleSetEmergency(doctor.id, "absent")}
                        >
                          🚫 Absent
                        </Button>
                      </div>
                    )}

                    <div className="pt-2 flex space-x-2 border-t mt-2">
                      <DoctorScheduleDialog doctor={doctor} />
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={() => copyPortalLink(doctor.portalToken)}
                      >
                        <Link2 className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(doctor)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(doctor.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
