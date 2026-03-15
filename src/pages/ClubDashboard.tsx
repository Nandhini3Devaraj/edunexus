import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ChartCard } from "@/components/shared/ChartCard";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { Upload, Sparkles, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { eventsApi, ClubEvent } from "@/lib/api";

const STATUS_ICONS: Record<string, { icon: typeof CheckCircle; color: string }> = {
  approved: { icon: CheckCircle, color: "text-risk-safe" },
  pending: { icon: Clock, color: "text-risk-low" },
  rejected: { icon: XCircle, color: "text-risk-high" },
};

const STATUS_RISK: Record<string, "safe" | "low" | "high"> = {
  approved: "safe",
  pending: "low",
  rejected: "high",
};

export default function ClubDashboard() {
  const [eventName, setEventName] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [attendees, setAttendees] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [lastSubmitted, setLastSubmitted] = useState<ClubEvent | null>(null);
  const [events, setEvents] = useState<ClubEvent[]>([]);

  useEffect(() => {
    eventsApi.getMy().then(setEvents);
  }, []);

  async function handleSubmit() {
    setSubmitError("");
    if (!eventName.trim()) { setSubmitError("Event name is required."); return; }
    if (!description.trim()) { setSubmitError("Description is required."); return; }
    if (!eventDate) { setSubmitError("Event date is required."); return; }
    setSubmitting(true);
    try {
      const result = await eventsApi.submit({
        event_name: eventName.trim(),
        description: description.trim(),
        event_date: eventDate,
        expected_attendees: parseInt(attendees) || 0,
        file: file ?? undefined,
      });
      setLastSubmitted(result);
      setEvents((prev) => [result, ...prev]);
      setEventName("");
      setDescription("");
      setEventDate("");
      setAttendees("");
      setFile(null);
      setFileName("");
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit event.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardLayout title="Club Coordinator">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Event Submission Form */}
        <ChartCard title="Submit New Event" subtitle="Fill in event details for AI classification">
          <div className="space-y-4">
            {submitError && (
              <div className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {submitError}
              </div>
            )}
            {lastSubmitted && !submitting && (
              <div className="rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-xs text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
                ✓ &ldquo;<strong>{lastSubmitted.event_name}</strong>&rdquo; submitted! AI classified as <strong>{lastSubmitted.category}</strong>.
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Event Name</label>
              <input
                value={eventName}
                onChange={(e) => { setEventName(e.target.value); setLastSubmitted(null); }}
                className="w-full rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                placeholder="Enter event name"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                rows={3}
                placeholder="Describe the event"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Date</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Expected Attendees</label>
                <input
                  type="number"
                  value={attendees}
                  onChange={(e) => setAttendees(e.target.value)}
                  className="w-full rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  placeholder="e.g. 200"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Attachments</label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border/50 bg-muted/20 p-4 transition-colors hover:border-primary/30 hover:bg-muted/30">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{fileName || "Click to upload files"}</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0] ?? null; setFile(f); setFileName(f?.name || ""); }}
                />
              </label>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting…" : "Submit Event"}
            </button>
          </div>
        </ChartCard>

        {/* AI Classification */}
        <div className="space-y-6">
          <ChartCard title="AI Classification Result" subtitle="Automatic event categorization">
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="rounded-full bg-primary/10 p-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              {lastSubmitted ? (
                <>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">{lastSubmitted.category} Event</p>
                    <p className="text-xs text-muted-foreground">Classification complete</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {[lastSubmitted.category, ...lastSubmitted.event_name.split(" ").slice(0, 2)].filter(Boolean).map((tag) => (
                      <span key={tag} className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[10px] font-medium text-primary">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="max-w-xs text-center text-[11px] text-muted-foreground">
                    Submitted on {new Date(lastSubmitted.created_at).toLocaleDateString()} · Pending admin approval.
                  </p>
                </>
              ) : (
                <>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">Awaiting Submission</p>
                    <p className="text-xs text-muted-foreground">Fill the form and submit to classify</p>
                  </div>
                  <p className="max-w-xs text-center text-[11px] text-muted-foreground">
                    AI will classify your event as Technical, Cultural, Sports, Academic, or General.
                  </p>
                </>
              )}
            </div>
          </ChartCard>

          {/* Event Status Tracker */}
          <ChartCard title="Event Status Tracker" subtitle="Recent submissions">
            <div className="space-y-2">
              {events.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">No events submitted yet.</p>
              ) : (
                events.map((event) => {
                  const s = STATUS_ICONS[event.status] ?? STATUS_ICONS["pending"];
                  return (
                    <div key={event.id} className="flex items-center justify-between rounded-lg border border-border/20 p-3 transition-colors hover:bg-muted/20">
                      <div className="flex items-center gap-3">
                        <s.icon className={`h-4 w-4 ${s.color}`} />
                        <div>
                          <p className="text-xs font-semibold text-foreground">{event.event_name}</p>
                          <p className="text-[10px] text-muted-foreground">{event.category} • {event.event_date}</p>
                        </div>
                      </div>
                      <RiskBadge level={STATUS_RISK[event.status] ?? "low"} />
                    </div>
                  );
                })
              )}
            </div>
          </ChartCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
