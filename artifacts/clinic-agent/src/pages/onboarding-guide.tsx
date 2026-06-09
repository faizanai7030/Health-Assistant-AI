import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, AlertTriangle, Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Step {
  number: number;
  title: string;
  who: "you" | "client" | "meta";
  time: string;
  waitTime?: string;
  content: React.ReactNode;
}

function CopyBox({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2 bg-gray-950 rounded-md px-3 py-2 mt-2">
      <code className="text-xs flex-1 break-all text-green-400 select-all">{text}</code>
      <button
        onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
        className="text-gray-400 hover:text-white transition-colors shrink-0"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

function WaitBadge({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
      <span className="text-xs text-amber-800 font-medium">⏳ Wait: {text}</span>
    </div>
  );
}

const steps: Step[] = [
  {
    number: 1,
    title: "Create a Meta Business Account for the client",
    who: "client",
    time: "10 min",
    content: (
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>Ask the client to do this themselves (they need their own FB account) or do it together on a call.</p>
        <ol className="list-decimal ml-5 space-y-1">
          <li>Go to <a href="https://business.facebook.com" target="_blank" rel="noreferrer" className="text-primary underline">business.facebook.com</a> → Create account</li>
          <li>Fill in: Business name (hospital name), their name, business email</li>
          <li>Verify email — they'll get an OTP</li>
          <li>Once inside Meta Business Suite, you're done with this step</li>
        </ol>
      </div>
    ),
  },
  {
    number: 2,
    title: "Create a Meta Developer App",
    who: "you",
    time: "10 min",
    content: (
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>You do this inside the client's Meta Business account (get access or do it together on a screen share).</p>
        <ol className="list-decimal ml-5 space-y-1">
          <li>Go to <a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer" className="text-primary underline">developers.facebook.com/apps</a> → Create App</li>
          <li>Select <strong>"Business"</strong> as the app type</li>
          <li>App name: <em>"[Hospital Name] WhatsApp Bot"</em></li>
          <li>Link it to their Meta Business Account</li>
          <li>From the App Dashboard → Add Product → Choose <strong>WhatsApp</strong> → Set up</li>
          <li>You'll land on the WhatsApp API Setup page — keep this open</li>
        </ol>
      </div>
    ),
  },
  {
    number: 3,
    title: "Add & verify the hospital's SIM number",
    who: "you",
    time: "5 min",
    waitTime: "2–5 min for OTP call",
    content: (
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>The client bought a new SIM for this. Make sure it's in a phone and can receive calls.</p>
        <ol className="list-decimal ml-5 space-y-1">
          <li>In WhatsApp API Setup → <strong>Phone Numbers</strong> → Add phone number</li>
          <li>Enter the number in +91XXXXXXXXXX format</li>
          <li>Choose <strong>"Call me"</strong> for verification (more reliable than SMS for new SIMs)</li>
          <li>Meta will call the SIM — answer and note the 6-digit code</li>
          <li>Enter the code → number is now verified</li>
        </ol>
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md mt-2">
          <p className="text-xs text-blue-800"><strong>Note:</strong> If the SIM was previously registered on WhatsApp (personal or business), Meta will reject it. The SIM must be fresh — never used on WhatsApp before. If blocked, you need a different SIM.</p>
        </div>
        <WaitBadge text="2–5 minutes for Meta to call the SIM with the OTP" />
      </div>
    ),
  },
  {
    number: 4,
    title: "Get the Phone Number ID & Access Token",
    who: "you",
    time: "5 min",
    content: (
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>You need two credentials to connect the hospital to the platform.</p>
        <p><strong>Phone Number ID:</strong></p>
        <ol className="list-decimal ml-5 space-y-1">
          <li>WhatsApp API Setup page → scroll down → you'll see <strong>Phone Number ID</strong> under the number (e.g. <code>123456789012345</code>)</li>
          <li>Copy and save it</li>
        </ol>
        <p className="mt-2"><strong>Permanent Access Token:</strong></p>
        <ol className="list-decimal ml-5 space-y-1">
          <li>Go to <strong>Meta Business Suite</strong> → Settings → System Users → Add System User</li>
          <li>Name: <em>"whatsapp-bot"</em>, Role: <strong>Admin</strong></li>
          <li>Click <strong>Add Assets</strong> → Apps → select the app you created → give Full Control</li>
          <li>Click <strong>Generate Token</strong> → select the app → check <code>whatsapp_business_messaging</code> and <code>whatsapp_business_management</code></li>
          <li>Set expiry to <strong>Never</strong> → Generate → Copy the token (it starts with EAAG…)</li>
          <li><strong>Save this immediately</strong> — it only shows once</li>
        </ol>
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md mt-2">
          <p className="text-xs text-amber-800"><strong>Important:</strong> The temporary token on the API Setup page expires in 24 hours. Always use the System User permanent token.</p>
        </div>
      </div>
    ),
  },
  {
    number: 5,
    title: "Create the clinic on your platform",
    who: "you",
    time: "2 min",
    content: (
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>Go to your Super Admin dashboard → <strong>Clinics → Add New Clinic</strong> and fill in:</p>
        <ul className="list-disc ml-5 space-y-1">
          <li>Clinic name: <em>Apollo Hospital Nagpur</em></li>
          <li>Slug: <em>apollo-nagpur</em> (lowercase, no spaces)</li>
          <li>Admin email: <em>admin@apollonagpur.com</em></li>
          <li>Password: choose a strong one and send it to the client securely</li>
          <li>WhatsApp number: <em>+91XXXXXXXXXX</em> (the SIM number)</li>
        </ul>
        <p className="mt-1">Or via API:</p>
        <CopyBox text={`curl -X POST https://health-assistant-ai.replit.app/api/super-admin/clinics \\
  -H "Content-Type: application/json" \\
  -H "Cookie: <your-super-admin-session>" \\
  -d '{"name":"Apollo Hospital","slug":"apollo","adminEmail":"admin@apollo.com","password":"StrongPass@123","whatsappNumber":"+919876543210"}'`} />
      </div>
    ),
  },
  {
    number: 6,
    title: "Set up webhook in Meta + save credentials in the dashboard",
    who: "you",
    time: "10 min",
    waitTime: "Instant — Meta verifies in seconds",
    content: (
      <div className="space-y-2 text-sm text-muted-foreground">
        <p><strong>Step A — Save credentials in the clinic dashboard:</strong></p>
        <ol className="list-decimal ml-5 space-y-1">
          <li>Log into the clinic's dashboard with the credentials from Step 5</li>
          <li>Go to <strong>Settings → Meta API Credentials</strong></li>
          <li>Enter the <strong>Phone Number ID</strong> from Step 4</li>
          <li>Enter the <strong>Permanent Access Token</strong> from Step 4</li>
          <li>Click Save — the badge will turn green: "Live — Priya is sending replies"</li>
        </ol>
        <p className="mt-3"><strong>Step B — Register the webhook in Meta:</strong></p>
        <ol className="list-decimal ml-5 space-y-1">
          <li>In Meta Developer Console → your app → WhatsApp → Configuration</li>
          <li>Click <strong>Edit</strong> next to Webhook</li>
          <li>Callback URL: copy from Settings → WhatsApp Number → "Meta Webhook URL" field</li>
          <li>Verify Token: ask me what it is — it's the <code>META_WEBHOOK_VERIFY_TOKEN</code> set in the platform</li>
          <li>Click <strong>Verify and Save</strong> — Meta will ping the URL and you'll see a green tick</li>
          <li>Then click <strong>Manage</strong> → subscribe to <strong>messages</strong></li>
        </ol>
        <div className="p-3 bg-green-50 border border-green-200 rounded-md mt-2">
          <p className="text-xs text-green-800"><strong>Test now:</strong> Send "hi" from any WhatsApp number to the hospital's SIM. Priya should reply within 3–5 seconds.</p>
        </div>
      </div>
    ),
  },
  {
    number: 7,
    title: "Configure doctors in the dashboard",
    who: "client",
    time: "15–30 min",
    content: (
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>The client (or you on their behalf) logs into their dashboard and sets up the doctors.</p>
        <ol className="list-decimal ml-5 space-y-1">
          <li>Go to <strong>Doctors</strong> → Add Doctor for each doctor in the hospital</li>
          <li>Fill in: Name, Specialization (e.g. "General Physician"), Phone</li>
          <li>Set <strong>Working Hours</strong> (e.g. 9:00 AM – 5:00 PM)</li>
          <li>Set <strong>Slot Duration</strong> (e.g. 15 minutes)</li>
          <li>Set <strong>Max Patients per Slot</strong> (e.g. 3 — Priya won't book more than 3 for any slot)</li>
          <li>Repeat for all doctors</li>
        </ol>
        <p className="mt-1 text-xs italic">Tip: Start with 2–3 doctors and add more once the system is running smoothly.</p>
      </div>
    ),
  },
  {
    number: 8,
    title: "Fill in clinic information for Priya",
    who: "client",
    time: "5 min",
    content: (
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>Go to <strong>Settings → Clinic Information for Priya</strong> and fill in:</p>
        <ul className="list-disc ml-5 space-y-1">
          <li>Full address (patients will ask "where are you?")</li>
          <li>OPD timings</li>
          <li>Consultation fees per doctor type</li>
          <li>Parking info</li>
          <li>Other: "Cash and UPI accepted", "Lab reports in 2 hours", etc.</li>
        </ul>
        <p className="mt-1">Priya will answer all these questions automatically without bothering the front desk.</p>
      </div>
    ),
  },
  {
    number: 9,
    title: "Share doctor portal links with doctors",
    who: "you",
    time: "5 min",
    content: (
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>Each doctor gets a unique private link to their portal — no password needed.</p>
        <ol className="list-decimal ml-5 space-y-1">
          <li>In the dashboard → <strong>Doctors</strong> → each doctor card has a <strong>"Portal Link"</strong> button</li>
          <li>Copy that link and send it to the doctor on WhatsApp</li>
          <li>Doctor can bookmark it on their phone — one tap to see today's schedule</li>
          <li>They can also tap <strong>"Mark Late"</strong> or <strong>"Mark Absent"</strong> — Priya will stop booking them immediately</li>
        </ol>
        <p className="mt-1 text-xs italic">Tip: Tell doctors they only need to use it if they're running late or won't come in. Otherwise Priya handles everything.</p>
      </div>
    ),
  },
  {
    number: 10,
    title: "Meta account review (for live traffic)",
    who: "meta",
    time: "Varies",
    waitTime: "1–7 business days for Meta approval",
    content: (
      <div className="space-y-2 text-sm text-muted-foreground">
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-xs text-amber-900"><strong>Important:</strong> By default, your Meta app is in <strong>Development Mode</strong>. In this mode, Priya can only reply to numbers that are added as test numbers in Meta Developer Console. Real patients cannot get replies yet.</p>
        </div>
        <p className="mt-2">To go live with real patients, you need Meta to review and approve your app:</p>
        <ol className="list-decimal ml-5 space-y-1">
          <li>Meta Developer Console → your app → <strong>App Review</strong></li>
          <li>Request permissions: <code>whatsapp_business_messaging</code>, <code>whatsapp_business_management</code></li>
          <li>Fill in the use case: <em>"Hospital appointment booking via WhatsApp AI assistant"</em></li>
          <li>Submit — Meta reviews within 1–7 business days</li>
          <li>Once approved, set the app to <strong>Live Mode</strong> (toggle at the top of the Developer Console)</li>
        </ol>
        <WaitBadge text="1–7 business days. You'll get an email from Meta when approved." />
        <p className="text-xs mt-2 text-muted-foreground">While waiting: add the client's personal number as a test number so they can test Priya themselves. Up to 5 test numbers allowed in dev mode.</p>
      </div>
    ),
  },
  {
    number: 11,
    title: "Final live test & handover",
    who: "you",
    time: "20 min",
    content: (
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>Do a full test before declaring it live:</p>
        <ol className="list-decimal ml-5 space-y-1">
          <li>Send "Hi" from a personal number → Priya should reply in seconds</li>
          <li>Book an appointment — check it appears in the <strong>Appointments</strong> log</li>
          <li>Test in Hindi or the local language — Priya should auto-switch</li>
          <li>Ask about timings, fees, location — Priya should answer from clinic info</li>
          <li>Mark a doctor as "Late" from the portal — try to book them, Priya should say not available</li>
          <li>Go to <strong>Simulator</strong> → run a few scenarios to double-check</li>
        </ol>
        <p className="mt-2"><strong>Handover checklist — share with the client:</strong></p>
        <ul className="list-disc ml-5 space-y-1">
          <li>Dashboard URL + login credentials</li>
          <li>Doctor portal links (already sent to doctors)</li>
          <li>How to use the Reminders page every morning</li>
          <li>What to do if Priya makes a mistake (can manually edit appointments)</li>
          <li>Your WhatsApp number for support</li>
        </ul>
        <div className="p-3 bg-green-50 border border-green-200 rounded-md mt-2">
          <p className="text-xs text-green-800">🎉 <strong>Client is live!</strong> Priya will now handle all appointment bookings automatically 24/7.</p>
        </div>
      </div>
    ),
  },
];

const whoColors: Record<Step["who"], string> = {
  you: "bg-blue-100 text-blue-800 border-blue-200",
  client: "bg-purple-100 text-purple-800 border-purple-200",
  meta: "bg-amber-100 text-amber-800 border-amber-200",
};

const whoLabel: Record<Step["who"], string> = {
  you: "You do this",
  client: "Client does this",
  meta: "Waiting on Meta",
};

export default function OnboardingGuide() {
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  function toggle(n: number) {
    setCompleted(prev => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n); else next.add(n);
      return next;
    });
  }

  const totalTime = "~1.5–2 hours of active work + 1–7 days waiting for Meta";

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Client Onboarding Guide</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Step-by-step process to onboard a new hospital onto the platform. Click steps to mark them done.
        </p>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span> You
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span> Client
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Meta wait
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-2 border-l pl-3">
            <Clock className="w-3 h-3" /> Total: {totalTime}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${(completed.size / steps.length) * 100}%` }}
          />
        </div>
        <span className="text-sm font-medium text-foreground">{completed.size}/{steps.length}</span>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step) => {
          const done = completed.has(step.number);
          return (
            <Card
              key={step.number}
              className={`transition-all cursor-pointer border ${done ? "border-green-200 bg-green-50/40" : "border-border hover:border-primary/30"}`}
              onClick={() => toggle(step.number)}
            >
              <CardHeader className="pb-2 pt-4 px-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${done ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}`}>
                      {done ? <CheckCircle2 className="w-4 h-4" /> : step.number}
                    </div>
                    <div>
                      <CardTitle className={`text-sm font-semibold ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {step.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="outline" className={`text-xs ${whoColors[step.who]}`}>
                          {whoLabel[step.who]}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {step.time}
                        </span>
                        {step.waitTime && (
                          <span className="text-xs text-amber-600 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> {step.waitTime}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              {!done && (
                <CardContent className="px-5 pb-4 pt-1 ml-10">
                  {step.content}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="border-dashed border-muted-foreground/30 bg-muted/20">
        <CardContent className="py-4 px-5">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">The biggest bottleneck</span> is always <strong>Meta's App Review</strong> (Step 10) — this is the 1–7 day wait. Start that process as early as possible. Everything else is same-day. Your client can start testing in dev mode immediately after Step 6.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
