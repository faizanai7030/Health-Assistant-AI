import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Mail, Lock, CheckCircle2, MessageSquare, Copy, Check, ExternalLink, Wifi, WifiOff, MapPin, Key, ShieldCheck } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

const emailSchema = z.object({
  newEmail: z.string().email("Enter a valid email address"),
  currentPassword: z.string().min(1, "Current password is required"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const whatsappSchema = z.object({
  whatsappNumber: z.string().min(1, "Enter the WhatsApp number"),
});

const clinicInfoSchema = z.object({
  address: z.string().optional(),
  timings: z.string().optional(),
  fees: z.string().optional(),
  parking: z.string().optional(),
  other: z.string().optional(),
});

const metaSchema = z.object({
  metaPhoneNumberId: z.string().min(1, "Phone Number ID is required"),
  metaAccessToken: z.string().optional(),
});

type EmailForm = z.infer<typeof emailSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;
type WhatsappForm = z.infer<typeof whatsappSchema>;
type ClinicInfoForm = z.infer<typeof clinicInfoSchema>;
type MetaForm = z.infer<typeof metaSchema>;

interface WhatsappSettings {
  whatsappNumber: string | null;
  webhookUrl: string;
}

export default function Settings() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const [emailSaved, setEmailSaved] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [whatsappSettings, setWhatsappSettings] = useState<WhatsappSettings | null>(null);
  const [webhookCopied, setWebhookCopied] = useState(false);
  const [whatsappSaving, setWhatsappSaving] = useState(false);
  const [clinicInfoSaved, setClinicInfoSaved] = useState(false);
  const [clinicInfoSaving, setClinicInfoSaving] = useState(false);
  const [metaSaved, setMetaSaved] = useState(false);
  const [metaSaving, setMetaSaving] = useState(false);
  const [hasMetaToken, setHasMetaToken] = useState(false);

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { newEmail: user?.adminEmail ?? "", currentPassword: "" },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const whatsappForm = useForm<WhatsappForm>({
    resolver: zodResolver(whatsappSchema),
    defaultValues: { whatsappNumber: "" },
  });

  const clinicInfoForm = useForm<ClinicInfoForm>({
    resolver: zodResolver(clinicInfoSchema),
    defaultValues: { address: "", timings: "", fees: "", parking: "", other: "" },
  });

  const metaForm = useForm<MetaForm>({
    resolver: zodResolver(metaSchema),
    defaultValues: { metaPhoneNumberId: "", metaAccessToken: "" },
  });

  useEffect(() => {
    fetch(`${API_BASE}/settings/whatsapp`, { credentials: "include" })
      .then((r) => r.json())
      .then((data: WhatsappSettings) => {
        setWhatsappSettings(data);
        whatsappForm.setValue("whatsappNumber", data.whatsappNumber ?? "");
      })
      .catch(() => {});

    fetch(`${API_BASE}/settings/clinic-info`, { credentials: "include" })
      .then((r) => r.json())
      .then((data: { clinicFaq: ClinicInfoForm | null }) => {
        if (data.clinicFaq) {
          clinicInfoForm.reset({
            address: data.clinicFaq.address ?? "",
            timings: data.clinicFaq.timings ?? "",
            fees: data.clinicFaq.fees ?? "",
            parking: data.clinicFaq.parking ?? "",
            other: data.clinicFaq.other ?? "",
          });
        }
      })
      .catch(() => {});

    fetch(`${API_BASE}/settings/meta`, { credentials: "include" })
      .then((r) => r.json())
      .then((data: { metaPhoneNumberId: string | null; hasAccessToken: boolean }) => {
        if (data.metaPhoneNumberId) metaForm.setValue("metaPhoneNumberId", data.metaPhoneNumberId);
        setHasMetaToken(data.hasAccessToken);
      })
      .catch(() => {});
  }, []);

  async function onClinicInfoSubmit(values: ClinicInfoForm) {
    setClinicInfoSaving(true);
    try {
      const res = await fetch(`${API_BASE}/settings/clinic-info`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(values),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      setClinicInfoSaved(true);
      setTimeout(() => setClinicInfoSaved(false), 3000);
      toast({ title: "Clinic info saved", description: "Priya will now answer patient questions using this info." });
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Something went wrong", variant: "destructive" });
    } finally {
      setClinicInfoSaving(false);
    }
  }

  async function onEmailSubmit(values: EmailForm) {
    try {
      const res = await fetch(`${API_BASE}/auth/account`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newEmail: values.newEmail, currentPassword: values.currentPassword }),
      });
      const data = await res.json() as { ok?: boolean; adminEmail?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      setUser((prev) => prev ? { ...prev, adminEmail: data.adminEmail! } : prev);
      emailForm.setValue("currentPassword", "");
      setEmailSaved(true);
      setTimeout(() => setEmailSaved(false), 3000);
      toast({ title: "Email updated", description: "Your login email has been changed." });
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Something went wrong", variant: "destructive" });
    }
  }

  async function onPasswordSubmit(values: PasswordForm) {
    try {
      const res = await fetch(`${API_BASE}/auth/account`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword: values.currentPassword, newPassword: values.newPassword }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      passwordForm.reset();
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 3000);
      toast({ title: "Password updated", description: "Your new password is active." });
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Something went wrong", variant: "destructive" });
    }
  }

  async function onWhatsappSubmit(values: WhatsappForm) {
    setWhatsappSaving(true);
    try {
      const res = await fetch(`${API_BASE}/settings/whatsapp`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ whatsappNumber: values.whatsappNumber }),
      });
      const data = await res.json() as { ok?: boolean; whatsappNumber?: string | null; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      setWhatsappSettings((prev) => prev ? { ...prev, whatsappNumber: data.whatsappNumber ?? null } : null);
      toast({ title: "WhatsApp number saved", description: "Your clinic is now linked to this number." });
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Something went wrong", variant: "destructive" });
    } finally {
      setWhatsappSaving(false);
    }
  }

  async function onMetaSubmit(values: MetaForm) {
    setMetaSaving(true);
    try {
      const body: Record<string, string> = { metaPhoneNumberId: values.metaPhoneNumberId };
      if (values.metaAccessToken && values.metaAccessToken.trim()) {
        body["metaAccessToken"] = values.metaAccessToken.trim();
      }
      const res = await fetch(`${API_BASE}/settings/meta`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      setMetaSaved(true);
      if (values.metaAccessToken?.trim()) setHasMetaToken(true);
      metaForm.setValue("metaAccessToken", "");
      setTimeout(() => setMetaSaved(false), 3000);
      toast({ title: "Meta credentials saved", description: "Priya will now reply to patients via WhatsApp." });
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Something went wrong", variant: "destructive" });
    } finally {
      setMetaSaving(false);
    }
  }

  function copyWebhook() {
    if (!whatsappSettings?.webhookUrl) return;
    navigator.clipboard.writeText(whatsappSettings.webhookUrl);
    setWebhookCopied(true);
    setTimeout(() => setWebhookCopied(false), 2500);
  }

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Account Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your WhatsApp connection and account details.</p>
      </div>

      {/* WhatsApp Setup */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">WhatsApp Number</CardTitle>
            </div>
            {whatsappSettings && (
              whatsappSettings.whatsappNumber ? (
                <Badge variant="outline" className="text-primary border-primary/40 gap-1.5">
                  <Wifi className="w-3 h-3" /> Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground gap-1.5">
                  <WifiOff className="w-3 h-3" /> Not connected
                </Badge>
              )
            )}
          </div>
          <CardDescription>
            The phone number patients will WhatsApp. Enter it exactly as it appears in Meta dashboard (with country code, no spaces).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Form {...whatsappForm}>
            <form onSubmit={whatsappForm.handleSubmit(onWhatsappSubmit)} className="space-y-4">
              <FormField
                control={whatsappForm.control}
                name="whatsappNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clinic WhatsApp Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+919876543210" {...field} />
                    </FormControl>
                    <FormDescription>
                      Use the international format: +91XXXXXXXXXX (no spaces or dashes).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={whatsappSaving} className="w-full">
                {whatsappSaving ? "Saving..." : "Save WhatsApp Number"}
              </Button>
            </form>
          </Form>

          {/* Webhook URL section */}
          <div className="pt-2 border-t space-y-2">
            <p className="text-sm font-medium text-foreground">Meta Webhook URL</p>
            <p className="text-xs text-muted-foreground">
              Paste this URL in your Meta Developer Console → WhatsApp → Configuration → Webhook.
            </p>
            <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-2">
              <code className="text-xs flex-1 break-all text-foreground/80 select-all">
                {whatsappSettings?.webhookUrl ?? "Loading..."}
              </code>
              <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={copyWebhook}>
                {webhookCopied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
            <a
              href="https://developers.facebook.com/apps"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              Open Meta Developer Console <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Meta Cloud API Credentials */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Meta API Credentials</CardTitle>
            </div>
            {hasMetaToken ? (
              <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 gap-1.5">
                <ShieldCheck className="w-3 h-3" /> Live — Priya is sending replies
              </Badge>
            ) : (
              <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 gap-1.5">
                Not configured
              </Badge>
            )}
          </div>
          <CardDescription>
            These credentials allow Priya to actually send WhatsApp replies back to patients. Without them, Priya receives messages but cannot respond.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...metaForm}>
            <form onSubmit={metaForm.handleSubmit(onMetaSubmit)} className="space-y-4">
              <FormField
                control={metaForm.control}
                name="metaPhoneNumberId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number ID</FormLabel>
                    <FormControl>
                      <Input placeholder="123456789012345" {...field} />
                    </FormControl>
                    <FormDescription>
                      Found in Meta Developer Console → WhatsApp → API Setup → Phone Number ID.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={metaForm.control}
                name="metaAccessToken"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Permanent Access Token
                      {hasMetaToken && (
                        <span className="ml-2 text-xs font-normal text-green-600">✓ Saved — enter a new one to replace</span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={hasMetaToken ? "••••••••••••• (leave blank to keep current)" : "EAAG..."}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Create this in Meta Business → System Users → Generate Token. Never expires.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={metaSaving} className="w-full">
                {metaSaved ? (
                  <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Saved</span>
                ) : metaSaving ? "Saving..." : "Save Meta Credentials"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Clinic Info Section */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">Clinic Information for Priya</CardTitle>
          </div>
          <CardDescription>
            Fill in your clinic details. Priya will use this to answer patient questions like "What are your timings?", "How much are the fees?", "Where are you located?" — without needing to call the clinic.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...clinicInfoForm}>
            <form onSubmit={clinicInfoForm.handleSubmit(onClinicInfoSubmit)} className="space-y-4">
              <FormField
                control={clinicInfoForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clinic Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main Road, Sector 5, Delhi — near Metro Station" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={clinicInfoForm.control}
                name="timings"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clinic Timings</FormLabel>
                    <FormControl>
                      <Input placeholder="Mon–Sat: 9am–7pm, Sunday: Closed" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={clinicInfoForm.control}
                name="fees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Consultation Fees</FormLabel>
                    <FormControl>
                      <Input placeholder="₹300 for General Physician, ₹500 for Specialist" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={clinicInfoForm.control}
                name="parking"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parking</FormLabel>
                    <FormControl>
                      <Input placeholder="Free parking available in basement" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={clinicInfoForm.control}
                name="other"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Other Info (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g. Lab reports available same day. Cash and UPI accepted. Bring Aadhaar card for first visit."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Any other info patients commonly ask about.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={clinicInfoSaving} className="w-full">
                {clinicInfoSaved ? (
                  <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Saved</span>
                ) : clinicInfoSaving ? "Saving..." : "Save Clinic Info"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Email Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">Login Email</CardTitle>
          </div>
          <CardDescription>Change the email address you use to log in.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
              <FormField
                control={emailForm.control}
                name="newEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@gmail.com" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={emailForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password (to confirm)</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter your current password" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={emailForm.formState.isSubmitting} className="w-full">
                {emailSaved ? (
                  <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Saved</span>
                ) : emailForm.formState.isSubmitting ? "Saving..." : "Update Email"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Password Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">Password</CardTitle>
          </div>
          <CardDescription>Choose a strong private password.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter your current password" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="At least 8 characters" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Repeat new password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={passwordForm.formState.isSubmitting} className="w-full">
                {passwordSaved ? (
                  <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Saved</span>
                ) : passwordForm.formState.isSubmitting ? "Saving..." : "Update Password"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
