import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardList, Trash2, Plus, Clock, UserX } from "lucide-react";
import { format } from "date-fns";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

interface WaitlistEntry {
  id: number;
  patientName: string;
  patientPhone: string;
  doctorId: number;
  doctorName: string;
  requestedDate: string;
  notes: string | null;
  status: string;
  createdAt: string;
}

interface Doctor {
  id: number;
  name: string;
  specialization: string;
}

export default function Waitlist() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    patientName: "",
    patientPhone: "",
    doctorId: "",
    requestedDate: "",
    notes: "",
  });

  async function fetchEntries() {
    try {
      const r = await fetch(`${API_BASE}/waitlist`, { credentials: "include" });
      const data = await r.json() as WaitlistEntry[];
      setEntries(data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEntries();
    fetch(`${API_BASE}/doctors`, { credentials: "include" })
      .then(r => r.json())
      .then((data: Doctor[]) => setDoctors(data))
      .catch(() => {});
  }, []);

  async function addToWaitlist() {
    if (!form.patientName || !form.patientPhone || !form.doctorId || !form.requestedDate) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    setAdding(true);
    try {
      const res = await fetch(`${API_BASE}/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...form, doctorId: parseInt(form.doctorId) }),
      });
      if (!res.ok) throw new Error("Failed to add");
      toast({ title: "Added to waitlist", description: `${form.patientName} is now on the waitlist.` });
      setForm({ patientName: "", patientPhone: "", doctorId: "", requestedDate: "", notes: "" });
      setShowForm(false);
      fetchEntries();
    } catch {
      toast({ title: "Error", description: "Could not add to waitlist.", variant: "destructive" });
    } finally {
      setAdding(false);
    }
  }

  async function removeEntry(id: number, name: string) {
    try {
      await fetch(`${API_BASE}/waitlist/${id}`, { method: "DELETE", credentials: "include" });
      toast({ title: "Removed", description: `${name} removed from waitlist.` });
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch {
      toast({ title: "Error", description: "Could not remove.", variant: "destructive" });
    }
  }

  const waiting = entries.filter(e => e.status === "waiting");
  const notified = entries.filter(e => e.status === "notified");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Waitlist</h1>
          <p className="text-sm text-muted-foreground mt-1">
            When a slot opens up due to cancellation, the first patient on the waitlist gets automatically notified via WhatsApp.
          </p>
        </div>
        <Button onClick={() => setShowForm(v => !v)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Patient
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Add to Waitlist</CardTitle>
            <CardDescription>Patient will be notified via WhatsApp when a slot opens up.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Patient Name *</label>
                <Input placeholder="Rahul Sharma" value={form.patientName} onChange={e => setForm(p => ({ ...p, patientName: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">WhatsApp Number *</label>
                <Input placeholder="+91 98765 43210" value={form.patientPhone} onChange={e => setForm(p => ({ ...p, patientPhone: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Doctor *</label>
                <Select value={form.doctorId} onValueChange={v => setForm(p => ({ ...p, doctorId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map(d => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name} — {d.specialization}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Preferred Date *</label>
                <Input type="date" value={form.requestedDate} onChange={e => setForm(p => ({ ...p, requestedDate: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Notes (optional)</label>
              <Input placeholder="e.g. Urgent, morning slot preferred" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={addToWaitlist} disabled={adding} className="flex-1">
                {adding ? "Adding..." : "Add to Waitlist"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : (
        <div className="space-y-6">
          {/* Waiting */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <h2 className="font-semibold text-foreground">Waiting ({waiting.length})</h2>
            </div>
            {waiting.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground text-sm">
                  <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  No patients on the waitlist right now.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {waiting.map((entry, i) => (
                  <Card key={entry.id}>
                    <CardContent className="py-3 px-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0">
                          {i + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-sm">{entry.patientName}</div>
                          <div className="text-xs text-muted-foreground">{entry.patientPhone}</div>
                        </div>
                      </div>
                      <div className="hidden sm:flex flex-col items-end text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{entry.doctorName}</span>
                        <span>{entry.requestedDate}</span>
                      </div>
                      {entry.notes && (
                        <div className="hidden md:block text-xs text-muted-foreground max-w-[180px] truncate">
                          {entry.notes}
                        </div>
                      )}
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 text-xs">Waiting</Badge>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeEntry(entry.id, entry.patientName)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Notified */}
          {notified.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <UserX className="w-4 h-4 text-blue-500" />
                <h2 className="font-semibold text-foreground">Notified — Awaiting Confirmation ({notified.length})</h2>
              </div>
              <div className="space-y-2">
                {notified.map(entry => (
                  <Card key={entry.id} className="opacity-70">
                    <CardContent className="py-3 px-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="min-w-0">
                          <div className="font-medium text-sm">{entry.patientName}</div>
                          <div className="text-xs text-muted-foreground">{entry.patientPhone}</div>
                        </div>
                      </div>
                      <div className="hidden sm:flex flex-col items-end text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{entry.doctorName}</span>
                        <span>{entry.requestedDate}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 text-xs">Notified</Badge>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeEntry(entry.id, entry.patientName)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Card className="border-dashed border-muted-foreground/30 bg-muted/20">
        <CardContent className="py-4 px-5">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">How it works:</span> When a patient cancels an appointment, the system checks the waitlist for that doctor on that date. The first person waiting gets a WhatsApp message automatically: <em>"A slot has opened up with Dr. X — reply YES to confirm."</em> No manual effort needed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
