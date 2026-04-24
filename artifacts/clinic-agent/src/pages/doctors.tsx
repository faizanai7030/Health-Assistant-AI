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
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, User, Stethoscope, Phone, Clock, Pencil, Trash2, Link2, AlertTriangle, XCircle } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

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
          <p className="text-muted-foreground mt-1">Manage medical staff and their schedules.</p>
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
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={() => copyPortalLink(doctor.portalToken)}
                      >
                        <Link2 className="w-4 h-4 mr-1" /> Portal Link
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
