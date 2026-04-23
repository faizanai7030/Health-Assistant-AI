import { useGetDashboardSummary, getGetDashboardSummaryQueryKey, useGetTodayAppointments, getGetTodayAppointmentsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Calendar, MessageSquare, Activity, Clock, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() }
  });

  const { data: todayAppointments, isLoading: isLoadingAppointments } = useGetTodayAppointments({
    query: { queryKey: getGetTodayAppointmentsQueryKey() }
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of today's clinical operations.</p>
      </div>

      {isLoadingSummary ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[60px]" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : summary ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Doctors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{summary.totalDoctors}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Appointments Today</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{summary.totalAppointmentsToday}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.pendingAppointments} pending, {summary.completedToday} completed
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{summary.totalAppointmentsThisWeek}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Conversations</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{summary.totalConversations}</div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-7">
          <CardHeader>
            <CardTitle>Today's Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAppointments ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : todayAppointments && todayAppointments.length > 0 ? (
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Time</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Patient</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Doctor</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {todayAppointments.map((apt) => (
                      <tr key={apt.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <td className="p-4 align-middle">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{apt.timeSlot}</span>
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="font-medium">{apt.patientName}</div>
                          <div className="text-xs text-muted-foreground">{apt.patientPhone}</div>
                        </td>
                        <td className="p-4 align-middle">
                          <div>{apt.doctorName}</div>
                          <div className="text-xs text-muted-foreground">{apt.doctorSpecialization}</div>
                        </td>
                        <td className="p-4 align-middle">
                          <Badge 
                            variant={
                              apt.status === "completed" ? "default" : 
                              apt.status === "confirmed" ? "secondary" : 
                              apt.status === "cancelled" ? "destructive" : 
                              "outline"
                            }
                            className={apt.status === "scheduled" ? "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200" : ""}
                          >
                            {apt.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                <h3 className="text-lg font-medium text-foreground">No appointments today</h3>
                <p className="text-sm text-muted-foreground">It's a quiet day at the clinic.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
