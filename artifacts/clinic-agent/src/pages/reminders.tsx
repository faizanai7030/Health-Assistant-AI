import { useState } from "react";
import {
  useListReminders,
  getListRemindersQueryKey,
  useUpdateReminder,
  useGenerateTodayReminders,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Bell, CheckCircle, Clock, RefreshCw, Send, User, Stethoscope } from "lucide-react";

const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  sent: "bg-green-100 text-green-800 border-green-200",
  failed: "bg-red-100 text-red-800 border-red-200",
};

export default function Reminders() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [filter, setFilter] = useState<string>("all");

  const { data: reminders, isLoading } = useListReminders(
    { status: filter === "all" ? undefined : filter },
    { query: { queryKey: getListRemindersQueryKey({ status: filter === "all" ? undefined : filter }) } }
  );

  const updateReminder = useUpdateReminder();
  const generateToday = useGenerateTodayReminders();

  const handleGenerate = () => {
    generateToday.mutate(undefined, {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListRemindersQueryKey() });
        toast({
          title: `Done! ${data.created} reminders created`,
          description: data.skipped > 0 ? `${data.skipped} already had reminders.` : undefined,
        });
      },
      onError: () => toast({ title: "Failed to generate reminders", variant: "destructive" }),
    });
  };

  const markSent = (id: number) => {
    updateReminder.mutate({ id, data: { status: "sent" } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRemindersQueryKey() });
        toast({ title: "Marked as sent" });
      },
    });
  };

  const pending = reminders?.filter((r) => r.status === "pending").length ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Patient Reminders</h1>
          <p className="text-muted-foreground mt-1">
            Send WhatsApp reminders to patients before their appointments.
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={generateToday.isPending}>
          <RefreshCw className={`mr-2 h-4 w-4 ${generateToday.isPending ? "animate-spin" : ""}`} />
          Generate Today's Reminders
        </Button>
      </div>

      {pending > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <Bell className="h-5 w-5 text-amber-600 shrink-0" />
          <div>
            <p className="font-medium text-amber-800">{pending} reminder{pending > 1 ? "s" : ""} pending</p>
            <p className="text-sm text-amber-700">Mark them as sent once WhatsApp messages are delivered.</p>
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {["all", "pending", "sent", "failed"].map((s) => (
          <Button
            key={s}
            variant={filter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(s)}
            className="capitalize"
          >
            {s}
          </Button>
        ))}
      </div>

      <div className="space-y-4">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="py-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))
        ) : !reminders?.length ? (
          <div className="text-center py-16 bg-card rounded-xl border border-dashed">
            <Bell className="mx-auto h-12 w-12 text-muted-foreground opacity-20 mb-4" />
            <h3 className="text-lg font-medium text-foreground">No reminders yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Click "Generate Today's Reminders" to create reminders for all today's appointments.
            </p>
          </div>
        ) : (
          reminders.map((reminder) => (
            <Card key={reminder.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold text-foreground">{reminder.patientName}</span>
                      </div>
                      <span className="text-muted-foreground text-sm">{reminder.patientPhone}</span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${statusColor[reminder.status] ?? ""}`}
                      >
                        {reminder.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Stethoscope className="h-3.5 w-3.5" />
                        {reminder.doctorName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {reminder.appointmentDate} at {reminder.timeSlot}
                      </span>
                    </div>

                    <div className="text-sm bg-muted/50 rounded-lg p-3 mt-2 text-foreground">
                      <p className="font-medium text-xs text-muted-foreground mb-1">Message to send:</p>
                      {reminder.reminderMessage}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    {reminder.status === "pending" && (
                      <Button size="sm" onClick={() => markSent(reminder.id)} disabled={updateReminder.isPending}>
                        <Send className="h-4 w-4 mr-2" />
                        Mark Sent
                      </Button>
                    )}
                    {reminder.status === "sent" && (
                      <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                        <CheckCircle className="h-4 w-4" />
                        Sent
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
