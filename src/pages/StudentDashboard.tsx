/**
 * Student Dashboard - Comprehensive Student Portal
 * Features: Attendance, Notes, Assignments, Fees, Results, Queries, AI Mindmap
 */

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ChartCard } from "@/components/shared/ChartCard";
import { MindMapVisualization } from "@/components/shared/MindMapVisualization";
import { useState, useEffect, useRef, useCallback } from "react";
import { notesApi, Note, assignmentsApi, Assignment, AssignmentSubmission, queriesApi, StudentQuery, mindmapApi, MindMapData, MindMapNode, SeparateMindMapData, hallTicketsApi, HallTicketEligibility, HallTicket, studentApi, AttendanceRecord, FeeStructure, getUser } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  RadialBarChart, RadialBar, ResponsiveContainer, BarChart, Bar, 
  XAxis, YAxis, Tooltip, Cell 
} from "recharts";
import { 
  Download, QrCode, MapPin, BookOpen, ChevronRight, ChevronDown,
  FileText, Calendar, CreditCard, ClipboardCheck, Bell, Brain,
  Send, CheckCircle, XCircle, AlertTriangle, Clock, Upload,
  GraduationCap, Receipt, RefreshCw, Eye, FileQuestion, Newspaper
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// ==================== DATA ====================

const defaultAttendanceData: AttendanceRecord[] = [
  { subject: "CS301", attendance: 92, total: 45, present: 41, color: "hsl(168, 100%, 48%)" },
  { subject: "MA201", attendance: 85, total: 42, present: 36, color: "hsl(239, 84%, 67%)" },
  { subject: "EC202", attendance: 78, total: 40, present: 31, color: "hsl(48, 96%, 53%)" },
  { subject: "PH101", attendance: 88, total: 38, present: 33, color: "hsl(142, 76%, 36%)" },
];

const internalMarks = [
  { subject: "CS301 - Data Structures", ia1: 18, ia2: 16, ia3: 17, assignment: 9, total: 60, max: 60 },
  { subject: "MA201 - Linear Algebra", ia1: 15, ia2: 17, ia3: 16, assignment: 8, total: 56, max: 60 },
  { subject: "EC202 - Signals", ia1: 19, ia2: 18, ia3: 17, assignment: 10, total: 64, max: 60 },
  { subject: "PH101 - Physics", ia1: 14, ia2: 15, ia3: 16, assignment: 8, total: 53, max: 60 },
];

// Notes are now fetched from the API instead of static data

const assignments = [
  { id: 1, subject: "CS301", title: "Binary Tree Implementation", deadline: "Mar 5, 2026 11:59 PM", status: "pending", daysLeft: 2 },
  { id: 2, subject: "MA201", title: "Matrix Operations", deadline: "Mar 3, 2026 5:00 PM", status: "submitted", submittedAt: "Mar 2, 2026" },
  { id: 3, subject: "EC202", title: "Fourier Transform Analysis", deadline: "Mar 8, 2026 11:59 PM", status: "pending", daysLeft: 5 },
  { id: 4, subject: "PH101", title: "Lab Report - Optics", deadline: "Mar 1, 2026 11:59 PM", status: "late", submittedAt: null },
];

const defaultFees: FeeStructure = {
  tuition: { amount: 50000, paid: 50000, balance: 0 },
  exam: { amount: 5000, paid: 5000, balance: 0 },
  lab: { amount: 8000, paid: 8000, balance: 0 },
  library: { amount: 2000, paid: 2000, balance: 0 },
  fines: { amount: 500, paid: 0, balance: 500 },
  other: { amount: 1500, paid: 1500, balance: 0 },
  total: { amount: 67000, paid: 66500, balance: 500 },
};

const results = [
  { semester: "Sem 1", sgpa: 8.5, credits: 24, status: "Pass" },
  { semester: "Sem 2", sgpa: 8.2, credits: 24, status: "Pass" },
  { semester: "Sem 3", sgpa: 8.7, credits: 22, status: "Pass" },
  { semester: "Sem 4", sgpa: 0, credits: 0, status: "Current" },
];

const queries = [
  { id: 1, title: "Request for re-evaluation", status: "accepted", date: "Feb 28, 2026", response: "Approved. Please proceed with fee payment." },
  { id: 2, title: "Attendance shortage clarification", status: "pending", date: "Mar 1, 2026", response: null },
];

const events = [
  { id: 1, title: "Tech Fest 2026", date: "Mar 15, 2026", venue: "Main Auditorium", type: "Technical" },
  { id: 2, title: "Cultural Night", date: "Mar 20, 2026", venue: "Open Air Theatre", type: "Cultural" },
  { id: 3, title: "Sports Meet", date: "Mar 25, 2026", venue: "Sports Complex", type: "Sports" },
];

const syllabusTree = [
  {
    title: "Module 1: Fundamentals",
    children: [
      { title: "1.1 Arrays & Strings" },
      { title: "1.2 Linked Lists" },
      { title: "1.3 Stacks & Queues" },
    ],
  },
  {
    title: "Module 2: Trees & Graphs",
    children: [
      { title: "2.1 Binary Trees" },
      { title: "2.2 BST Operations" },
      { title: "2.3 Graph Traversal" },
    ],
  },
  {
    title: "Module 3: Advanced Topics",
    children: [
      { title: "3.1 Dynamic Programming" },
      { title: "3.2 Greedy Algorithms" },
      { title: "3.3 Complexity Analysis" },
    ],
  },
];

// ==================== COMPONENTS ====================

function TreeNode({ node }: { node: { title: string; children?: { title: string }[] } }) {
  const [open, setOpen] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <button
        onClick={() => hasChildren && setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted/30"
      >
        {hasChildren ? (
          open ? <ChevronDown className="h-3.5 w-3.5 text-primary" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <div className="ml-1 h-1.5 w-1.5 rounded-full bg-primary/50" />
        )}
        <span className={hasChildren ? "font-medium text-foreground" : "text-muted-foreground"}>{node.title}</span>
      </button>
      {open && node.children && (
        <div className="ml-4 border-l border-border/20 pl-2">
          {node.children.map((child, i) => (
            <TreeNode key={i} node={child} />
          ))}
        </div>
      )}
    </div>
  );
}

const UPI_ID = "nandhuraj205@oksbi";
const UPI_NAME = "Nandhini Devaraj";
const UPI_QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(
  `upi://pay?pa=${UPI_ID}&pn=${UPI_NAME}&cu=INR`
)}`;

function PayNowDialog({ amount, buttonLabel = "Pay Now" }: { amount: number; buttonLabel?: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full gap-2">
          <CreditCard className="h-4 w-4" />
          {buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pay Fees via UPI</DialogTitle>
          <DialogDescription>
            Scan this QR in any UPI app to pay {`INR ${amount.toLocaleString()}`}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-xl border border-border/30 p-3 bg-muted/20">
            <img src={UPI_QR_URL} alt="UPI QR" className="w-full rounded-lg" />
          </div>
          <div className="text-center text-sm text-muted-foreground">
            <p>UPI ID: {UPI_ID}</p>
            <p>Beneficiary: {UPI_NAME}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==================== TAB COMPONENTS ====================

function OverviewTab() {
  const [eligibility, setEligibility] = useState<HallTicketEligibility | null>(null);
  const [hallTickets, setHallTickets] = useState<HallTicket[]>([]);
  const [loadingEligibility, setLoadingEligibility] = useState(true);
  const [generatingTicket, setGeneratingTicket] = useState(false);
  const [downloadingTicket, setDownloadingTicket] = useState<number | null>(null);
  const { toast } = useToast();

  // Fetch eligibility and hall tickets on mount
  const fetchData = async () => {
    try {
      setLoadingEligibility(true);
      const [eligibilityData, ticketsData] = await Promise.all([
        hallTicketsApi.checkEligibility(),
        hallTicketsApi.getMyTickets()
      ]);
      console.log("Eligibility data received:", eligibilityData);
      setEligibility(eligibilityData);
      setHallTickets(ticketsData.hall_tickets);
    } catch (error) {
      console.error("Failed to fetch eligibility:", error);
      // Set default values if API fails (for demo)
      setEligibility({
        eligible: false,
        reasons: ["Unable to verify eligibility. Please login again."],
        attendance_percentage: 85,
        min_attendance_required: 80,
        fee_due: 0,
        attendance_ok: true,
        fees_ok: true
      });
    } finally {
      setLoadingEligibility(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateTicket = async () => {
    if (!eligibility?.eligible) {
      toast({
        title: "Cannot Generate Hall Ticket",
        description: eligibility?.reasons.join(". ") || "You are not eligible.",
        variant: "destructive"
      });
      return;
    }

    try {
      setGeneratingTicket(true);
      // Generate hall ticket for current exam (exam_id=1 for demo)
      // In production, user would select from available exams
      await hallTicketsApi.generateMyTicket(1);
      toast({
        title: "Hall Ticket Generated",
        description: "Your hall ticket has been generated successfully!",
      });
      // Refresh data to show the new ticket
      await fetchData();
    } catch (error: unknown) {
      console.error("Failed to generate ticket:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate hall ticket";
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setGeneratingTicket(false);
    }
  };

  const handleDownloadTicket = async (ticket?: HallTicket) => {
    if (!eligibility?.eligible) {
      toast({
        title: "Cannot Download Hall Ticket",
        description: eligibility?.reasons.join(". ") || "You are not eligible.",
        variant: "destructive"
      });
      return;
    }

    if (!ticket) {
      toast({
        title: "Error",
        description: "No ticket selected",
        variant: "destructive"
      });
      return;
    }

    try {
      setDownloadingTicket(ticket.id);
      await hallTicketsApi.downloadPdf(ticket.id);
      toast({
        title: "Hall Ticket Downloaded",
        description: `Your hall ticket ${ticket.ticket_number} has been downloaded as PDF.`,
      });
      // Refresh to update download count
      await fetchData();
    } catch (error) {
      console.error("Failed to download PDF:", error);
      toast({
        title: "Download Failed",
        description: "Failed to download hall ticket PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDownloadingTicket(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Overall Attendance Gauge */}
        <ChartCard title="Overall Attendance" subtitle="Your attendance percentage">
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={180}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" startAngle={180} endAngle={0} data={[{ name: "Attendance", value: eligibility?.attendance_percentage ?? 85, fill: eligibility?.attendance_ok !== false ? "hsl(168, 100%, 48%)" : "hsl(0, 84%, 60%)" }]} barSize={12}>
                <RadialBar background={{ fill: "hsl(222, 30%, 14%)" }} dataKey="value" cornerRadius={6} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="-mt-16 text-center">
              <p className={`text-3xl font-bold ${eligibility?.attendance_ok !== false ? 'text-primary' : 'text-destructive'}`}>
                {loadingEligibility ? '...' : `${(eligibility?.attendance_percentage ?? 85).toFixed(1)}%`}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {eligibility?.attendance_ok !== false ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-green-500 font-medium">Above {eligibility?.min_attendance_required ?? 80}% Required</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span className="text-xs text-destructive font-medium">Below {eligibility?.min_attendance_required || 80}% Minimum</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </ChartCard>

        {/* Quick Stats */}
        <ChartCard title="Quick Stats">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 rounded-lg bg-primary/10">
              <p className="text-2xl font-bold text-primary">8.47</p>
              <p className="text-xs text-muted-foreground">CGPA</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-green-500/10">
              <p className="text-2xl font-bold text-green-500">3/4</p>
              <p className="text-xs text-muted-foreground">Assignments</p>
            </div>
            <div className={`text-center p-3 rounded-lg ${eligibility?.fees_ok ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
              <p className={`text-2xl font-bold ${eligibility?.fees_ok ? 'text-green-500' : 'text-red-500'}`}>
                {loadingEligibility ? '...' : `₹${eligibility?.fee_due?.toLocaleString() || 0}`}
              </p>
              <p className="text-xs text-muted-foreground">Fee Due</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-purple-500/10">
              <p className="text-2xl font-bold text-purple-500">2</p>
              <p className="text-xs text-muted-foreground">New Notes</p>
            </div>
          </div>
        </ChartCard>

        {/* Upcoming Events */}
        <ChartCard title="Upcoming Events">
          <div className="space-y-3">
            {events.slice(0, 3).map((event, i) => (
              <div key={i} className="rounded-lg border border-border/20 p-3 transition-all hover:border-primary/20">
                <p className="text-xs font-semibold text-foreground">{event.title}</p>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{event.date}</span>
                  <Badge variant="outline" className="text-[10px]">{event.type}</Badge>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Hall Ticket Section */}
      <Card className={`border-2 ${eligibility?.eligible ? 'border-green-500/30 bg-gradient-to-r from-green-500/5 to-transparent' : 'border-destructive/30 bg-gradient-to-r from-destructive/5 to-transparent'}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            Hall Ticket Eligibility
            {loadingEligibility ? (
              <Badge variant="outline" className="ml-2">Checking...</Badge>
            ) : eligibility?.eligible ? (
              <Badge variant="default" className="ml-2 bg-green-500">Eligible</Badge>
            ) : (
              <Badge variant="destructive" className="ml-2">Not Eligible</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingEligibility ? (
            <div className="flex items-center justify-center py-4">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Checking eligibility...</span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                {/* Attendance Status */}
                <div className="flex items-center gap-2">
                  {eligibility?.attendance_ok ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                  <span className="text-sm">
                    Attendance: {(eligibility?.attendance_percentage ?? 85).toFixed(1)}%
                    {eligibility?.attendance_ok !== false ? (
                      <span className="text-green-500 ml-1">(Above {eligibility?.min_attendance_required ?? 80}% ✓)</span>
                    ) : (
                      <span className="text-destructive ml-1">(Minimum {eligibility?.min_attendance_required ?? 80}% required)</span>
                    )}
                  </span>
                </div>
                
                {/* Fee Status */}
                <div className="flex items-center gap-2">
                  {eligibility?.fees_ok ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                  <span className="text-sm">
                    Fee Status: {eligibility?.fees_ok ? (
                      <span className="text-green-500">All dues cleared ✓</span>
                    ) : (
                      <span className="text-destructive">₹{eligibility?.fee_due?.toFixed(2)} pending</span>
                    )}
                  </span>
                </div>
                
                {/* Reason if not eligible */}
                {!eligibility?.eligible && eligibility?.reasons && (
                  <Alert variant="destructive" className="mt-3">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {eligibility.reasons.map((reason, i) => (
                        <div key={i}>• {reason}</div>
                      ))}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              
              {/* Generate/Download Buttons */}
              <div className="flex flex-col items-end gap-2">
                {eligibility?.eligible && hallTickets.length === 0 ? (
                  /* Generate button for eligible students without tickets */
                  <Button 
                    onClick={handleGenerateTicket}
                    disabled={generatingTicket}
                    className="gap-2 bg-primary hover:bg-primary/90"
                  >
                    {generatingTicket ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <QrCode className="h-4 w-4" />
                    )}
                    {generatingTicket ? 'Generating...' : 'Generate Hall Ticket'}
                  </Button>
                ) : eligibility?.eligible && hallTickets.length > 0 ? (
                  /* Download button for eligible students with tickets */
                  <div className="space-y-2">
                    {hallTickets.map((ticket) => (
                      <Button 
                        key={ticket.id}
                        onClick={() => handleDownloadTicket(ticket)}
                        disabled={downloadingTicket === ticket.id}
                        className="gap-2 bg-green-600 hover:bg-green-700 w-full"
                      >
                        {downloadingTicket === ticket.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        {downloadingTicket === ticket.id ? 'Downloading...' : `Download PDF - ${ticket.ticket_number}`}
                      </Button>
                    ))}
                  </div>
                ) : (
                  /* Disabled button for ineligible students */
                  <Button 
                    disabled
                    className="gap-2"
                    variant="secondary"
                  >
                    <Download className="h-4 w-4" />
                    Download Hall Ticket
                  </Button>
                )}
                
                {!eligibility?.eligible && (
                  <p className="text-xs text-muted-foreground max-w-[200px] text-right">
                    Clear all dues and maintain {eligibility?.min_attendance_required || 80}%+ attendance to generate
                  </p>
                )}
                {eligibility?.eligible && hallTickets.length > 0 && (
                  <p className="text-xs text-green-600">
                    {hallTickets.length} ticket(s) ready
                  </p>
                )}
                {eligibility?.eligible && hallTickets.length === 0 && (
                  <p className="text-xs text-primary">
                    You're eligible! Generate your hall ticket now.
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AttendanceTab({ attendanceData }: { attendanceData: AttendanceRecord[] }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Subject-wise Attendance">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={attendanceData}>
              <XAxis dataKey="subject" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }} />
              <YAxis tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }} domain={[0, 100]} />
              <Tooltip 
                formatter={(value: number, _name: string, props: { payload: { present: number; total: number } }) => [
                  `${value}% (${props.payload.present}/${props.payload.total})`, 'Attendance'
                ]}
              />
              <Bar dataKey="attendance" radius={[4, 4, 0, 0]}>
                {attendanceData.map((e, i) => (
                  <Cell key={i} fill={e.attendance >= 75 ? e.color : "hsl(0, 84%, 60%)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Attendance Details">
          <div className="space-y-4">
            {attendanceData.map((subject, i) => (
              <div key={i} className="p-4 rounded-lg border border-border/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{subject.subject}</span>
                  <Badge variant={subject.attendance >= 75 ? "default" : "destructive"}>
                    {subject.attendance}%
                  </Badge>
                </div>
                <Progress value={subject.attendance} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  Classes: {subject.present}/{subject.total} | 
                  {subject.attendance >= 75 ? " ✓ Eligible" : ` Need ${Math.ceil(subject.total * 0.75) - subject.present} more`}
                </p>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

function InternalMarksTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Internal Assessment Marks</CardTitle>
          <CardDescription>Your performance in internal assessments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left py-3 px-4">Subject</th>
                  <th className="text-center py-3 px-4">IA-1 (20)</th>
                  <th className="text-center py-3 px-4">IA-2 (20)</th>
                  <th className="text-center py-3 px-4">IA-3 (20)</th>
                  <th className="text-center py-3 px-4">Assignment (10)</th>
                  <th className="text-center py-3 px-4">Total (60)</th>
                  <th className="text-center py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {internalMarks.map((mark, i) => (
                  <tr key={i} className="border-b border-border/20 hover:bg-muted/20">
                    <td className="py-3 px-4 font-medium">{mark.subject}</td>
                    <td className="text-center py-3 px-4">{mark.ia1}</td>
                    <td className="text-center py-3 px-4">{mark.ia2}</td>
                    <td className="text-center py-3 px-4">{mark.ia3}</td>
                    <td className="text-center py-3 px-4">{mark.assignment}</td>
                    <td className="text-center py-3 px-4 font-bold text-primary">{mark.total}</td>
                    <td className="text-center py-3 px-4">
                      <Badge variant={mark.total >= 30 ? "default" : "destructive"}>
                        {mark.total >= 30 ? "Pass" : "Fail"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function NotesTab() {
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [downloading, setDownloading] = useState<number | null>(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await notesApi.getAll();
      setNotes(response.notes);
    } catch (error) {
      console.error("Failed to fetch notes:", error);
      toast({
        title: "Error",
        description: "Failed to load notes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (note: Note) => {
    try {
      setDownloading(note.id);
      await notesApi.download(note.id, note.file_name);
      toast({
        title: "Download started",
        description: `Downloading ${note.file_name}`
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download the file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDownloading(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric"
    });
  };

  const filteredNotes = filter === "all" 
    ? notes 
    : notes.filter(n => n.note_type === filter);

  return (
    <div className="space-y-6">
      <div className="flex gap-4 flex-wrap">
        <Button 
          variant={filter === "all" ? "default" : "outline"} 
          className="gap-2"
          onClick={() => setFilter("all")}
        >
          <FileText className="h-4 w-4" /> All Notes
        </Button>
        <Button 
          variant={filter === "question_paper" ? "default" : "outline"} 
          className="gap-2"
          onClick={() => setFilter("question_paper")}
        >
          <FileQuestion className="h-4 w-4" /> Question Papers
        </Button>
        <Button 
          variant={filter === "important_questions" ? "default" : "outline"} 
          className="gap-2"
          onClick={() => setFilter("important_questions")}
        >
          <Newspaper className="h-4 w-4" /> Important Questions
        </Button>
        <Button 
          variant={filter === "notes" ? "default" : "outline"} 
          className="gap-2"
          onClick={() => setFilter("notes")}
        >
          <BookOpen className="h-4 w-4" /> Study Notes
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
          Loading notes...
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>{filter === "all" ? "No study materials available yet" : `No ${filter.replace(/_/g, " ")} available`}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotes.map((note) => (
            <Card key={note.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      note.note_type === "notes" ? "bg-blue-500/10 text-blue-500" :
                      note.note_type === "important_questions" ? "bg-yellow-500/10 text-yellow-500" :
                      "bg-purple-500/10 text-purple-500"
                    }`}>
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{note.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {note.subject} • {formatDate(note.created_at)}
                      </p>
                      {note.description && (
                        <p className="text-xs text-muted-foreground mt-1">{note.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {note.note_type.replace(/_/g, " ")}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {note.download_count} downloads
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="gap-1"
                    onClick={() => handleDownload(note)}
                    disabled={downloading === note.id}
                  >
                    {downloading === note.id ? (
                      <Clock className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    {formatFileSize(note.file_size)}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AssignmentsTab() {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assignmentsRes, submissionsRes] = await Promise.all([
        assignmentsApi.getAll({ status: "active" }),
        assignmentsApi.getMySubmissions()
      ]);
      setAssignments(assignmentsRes.assignments);
      setSubmissions(submissionsRes);
    } catch (error) {
      console.error("Failed to fetch assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSubmissionForAssignment = (assignmentId: number) => {
    return submissions.find(s => s.assignment_id === assignmentId);
  };

  const formatDeadline = (deadline: string) => {
    return new Date(deadline).toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit"
    });
  };

  const getDaysLeft = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const handleFileSelect = (assignmentId: number) => {
    setSelectedAssignmentId(assignmentId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedAssignmentId) return;

    try {
      setUploading(selectedAssignmentId);
      await assignmentsApi.submit(selectedAssignmentId, file);
      toast({
        title: "Assignment submitted!",
        description: "Your assignment has been submitted successfully."
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error.message || "Failed to submit assignment",
        variant: "destructive"
      });
    } finally {
      setUploading(null);
      setSelectedAssignmentId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownloadQuestion = async (assignment: Assignment) => {
    if (!assignment.file_name) return;
    try {
      await assignmentsApi.downloadQuestion(assignment.id, assignment.file_name);
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not download the assignment file",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
        Loading assignments...
      </div>
    );
  }

  const urgentAssignments = assignments.filter(a => {
    const daysLeft = getDaysLeft(a.deadline);
    return daysLeft <= 1 && daysLeft > 0 && !getSubmissionForAssignment(a.id);
  });
  
  return (
    <div className="space-y-6">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.zip,.rar"
      />

      {urgentAssignments.length > 0 && (
        <Alert className="border-yellow-500/50 bg-yellow-500/10">
          <Bell className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-yellow-500">
            You have {urgentAssignments.length} assignment(s) due within 24 hours! Submit them now.
          </AlertDescription>
        </Alert>
      )}

      {assignments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ClipboardCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No active assignments</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map((assignment) => {
            const submission = getSubmissionForAssignment(assignment.id);
            const daysLeft = getDaysLeft(assignment.deadline);
            const isOverdue = daysLeft < 0;
            const isUrgent = daysLeft <= 1 && daysLeft > 0;
            
            return (
              <Card key={assignment.id} className={`
                ${submission ? "border-green-500/30" : 
                  isOverdue ? "border-red-500/30" : 
                  isUrgent ? "border-yellow-500/30" : ""}
              `}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline">{assignment.subject}</Badge>
                        {submission ? (
                          <Badge className="bg-green-500">
                            {submission.marks !== null ? `Graded: ${submission.marks}/${assignment.max_marks}` : "Submitted"}
                          </Badge>
                        ) : isOverdue ? (
                          <Badge variant="destructive">Overdue</Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                        {submission?.is_late && <Badge variant="outline" className="text-yellow-500">Late</Badge>}
                      </div>
                      <p className="font-medium mt-2">{assignment.title}</p>
                      {assignment.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{assignment.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Deadline: {formatDeadline(assignment.deadline)}</span>
                        {!submission && !isOverdue && (
                          <span className={isUrgent ? "text-yellow-500" : ""}>
                            ({daysLeft} day{daysLeft !== 1 ? "s" : ""} left)
                          </span>
                        )}
                      </div>
                      {submission && (
                        <p className="text-xs text-green-500 mt-1">
                          Submitted: {new Date(submission.submitted_at).toLocaleString()}
                        </p>
                      )}
                      {submission?.feedback && (
                        <div className="mt-2 p-2 rounded bg-primary/10 text-xs">
                          <strong>Feedback:</strong> {submission.feedback}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {assignment.file_name && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDownloadQuestion(assignment)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      {!submission && (
                        <Button 
                          size="sm" 
                          className="gap-1"
                          onClick={() => handleFileSelect(assignment.id)}
                          disabled={uploading === assignment.id}
                        >
                          {uploading === assignment.id ? (
                            <Clock className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                          Submit
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FeesTab({ fees }: { fees: FeeStructure }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Fee Structure - Academic Year 2025-26
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left py-3">Fee Type</th>
                  <th className="text-right py-3">Amount</th>
                  <th className="text-right py-3">Paid</th>
                  <th className="text-right py-3">Balance</th>
                  <th className="text-center py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(fees).filter(([key]) => key !== 'total').map(([key, value]) => (
                  <tr key={key} className="border-b border-border/20">
                    <td className="py-3 capitalize">{key} Fee</td>
                    <td className="text-right py-3">₹{value.amount.toLocaleString()}</td>
                    <td className="text-right py-3 text-green-500">₹{value.paid.toLocaleString()}</td>
                    <td className="text-right py-3 text-red-500">₹{value.balance.toLocaleString()}</td>
                    <td className="text-center py-3">
                      {value.balance === 0 ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
                <tr className="font-bold bg-muted/20">
                  <td className="py-3">Total</td>
                  <td className="text-right py-3">₹{fees.total.amount.toLocaleString()}</td>
                  <td className="text-right py-3 text-green-500">₹{fees.total.paid.toLocaleString()}</td>
                  <td className="text-right py-3 text-red-500">₹{fees.total.balance.toLocaleString()}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-4 rounded-lg bg-primary/10">
              <p className="text-3xl font-bold text-primary">₹{fees.total.balance.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Balance Due</p>
            </div>
            <Progress value={(fees.total.paid / fees.total.amount) * 100} className="h-3" />
            <p className="text-xs text-center text-muted-foreground">
              {((fees.total.paid / fees.total.amount) * 100).toFixed(1)}% Paid
            </p>
            <PayNowDialog amount={fees.total.balance} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ResultsTab() {
  const [showDetailedMarks, setShowDetailedMarks] = useState(false);
  const user = getUser();
  const cgpa = results.filter(r => r.sgpa > 0).reduce((acc, r) => acc + r.sgpa, 0) / 
               results.filter(r => r.sgpa > 0).length;

  const handleDownloadReport = () => {
    const reportLines = [
      "EDUNEXUS - Consolidated Report Card",
      `Name: ${user?.name || "Student"}`,
      `Register Number: ${user?.register_number || "N/A"}`,
      `Department: ${user?.department || "N/A"}`,
      `CGPA: ${cgpa.toFixed(2)}`,
      "",
      "Semester Results",
      ...results.map((item) => `${item.semester}: SGPA ${item.sgpa > 0 ? item.sgpa.toFixed(2) : "-"}, Credits ${item.credits}, Status ${item.status}`),
      "",
      "Detailed Internal Marks",
      ...internalMarks.map((item) => `${item.subject} | IA1 ${item.ia1}, IA2 ${item.ia2}, IA3 ${item.ia3}, Assignment ${item.assignment}, Total ${item.total}/${item.max}`),
    ];
    const blob = new Blob([reportLines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${(user?.register_number || "student").toLowerCase()}-report-card.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="col-span-1 bg-gradient-to-br from-primary/20 to-transparent">
          <CardContent className="p-6 text-center">
            <GraduationCap className="h-10 w-10 mx-auto text-primary mb-2" />
            <p className="text-4xl font-bold text-primary">{cgpa.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">CGPA</p>
          </CardContent>
        </Card>

        {results.map((result, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{result.semester}</p>
                  <p className="text-xs text-muted-foreground">{result.credits} Credits</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    {result.sgpa > 0 ? result.sgpa.toFixed(1) : "-"}
                  </p>
                  <Badge variant={result.status === "Pass" ? "default" : "secondary"}>
                    {result.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Download Report Card</CardTitle>
          <CardDescription>
            Register No: {user?.register_number || "N/A"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button className="gap-2" onClick={handleDownloadReport}>
            <Download className="h-4 w-4" />
            Download Consolidated Report
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setShowDetailedMarks(true)}>
            <Eye className="h-4 w-4" />
            View Detailed Marks
          </Button>

          <Dialog open={showDetailedMarks} onOpenChange={setShowDetailedMarks}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Detailed Marks</DialogTitle>
                <DialogDescription>
                  {user?.name || "Student"} ({user?.register_number || "N/A"})
                </DialogDescription>
              </DialogHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30">
                      <th className="text-left py-2 px-2">Subject</th>
                      <th className="text-center py-2 px-2">IA-1</th>
                      <th className="text-center py-2 px-2">IA-2</th>
                      <th className="text-center py-2 px-2">IA-3</th>
                      <th className="text-center py-2 px-2">Assignment</th>
                      <th className="text-center py-2 px-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {internalMarks.map((row, idx) => (
                      <tr key={idx} className="border-b border-border/20">
                        <td className="py-2 px-2">{row.subject}</td>
                        <td className="text-center py-2 px-2">{row.ia1}</td>
                        <td className="text-center py-2 px-2">{row.ia2}</td>
                        <td className="text-center py-2 px-2">{row.ia3}</td>
                        <td className="text-center py-2 px-2">{row.assignment}</td>
                        <td className="text-center py-2 px-2 font-semibold text-primary">{row.total}/{row.max}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}

function RevaluationTab({ fees, attendanceData }: { fees: FeeStructure; attendanceData: AttendanceRecord[] }) {
  const [pendingAssignments, setPendingAssignments] = useState(0);

  useEffect(() => {
    const fetchAssignmentStatus = async () => {
      try {
        const [allAssignments, mySubmissions] = await Promise.all([
          assignmentsApi.getAll({ status: "active" }),
          assignmentsApi.getMySubmissions(),
        ]);
        const submittedIds = new Set(mySubmissions.map((entry) => entry.assignment_id));
        const pending = allAssignments.assignments.filter((assignment) => !submittedIds.has(assignment.id)).length;
        setPendingAssignments(pending);
      } catch (error) {
        console.error("Failed to fetch assignment status for revaluation:", error);
        setPendingAssignments(0);
      }
    };

    fetchAssignmentStatus();
  }, []);

  const canApply = fees.total.balance === 0 && 
                  attendanceData.every(a => a.attendance >= 75) &&
                  pendingAssignments === 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Revaluation Portal
          </CardTitle>
          <CardDescription>Apply for answer sheet revaluation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-lg border ${fees.total.balance === 0 ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
                <div className="flex items-center gap-2">
                  {fees.total.balance === 0 ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                  <span className="font-medium">Fee Status</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {fees.total.balance === 0 ? "All fees cleared" : `₹${fees.total.balance} pending`}
                </p>
              </div>

              <div className={`p-4 rounded-lg border ${attendanceData.every(a => a.attendance >= 75) ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
                <div className="flex items-center gap-2">
                  {attendanceData.every(a => a.attendance >= 75) ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                  <span className="font-medium">Attendance</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {attendanceData.every(a => a.attendance >= 75) ? "Above 75% in all subjects" : "Below 75% in some subjects"}
                </p>
              </div>

              <div className={`p-4 rounded-lg border ${pendingAssignments === 0 ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
                <div className="flex items-center gap-2">
                  {pendingAssignments === 0 ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                  <span className="font-medium">Assignments</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {pendingAssignments === 0 ? "All submitted" : `${pendingAssignments} pending`}
                </p>
              </div>
            </div>

            {fees.total.balance > 0 && (
              <div className="max-w-xs">
                <PayNowDialog amount={fees.total.balance} buttonLabel="Pay Due Fees" />
              </div>
            )}

            <Button disabled={!canApply} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              {canApply ? "Apply for Revaluation" : "Complete Requirements First"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function QueryTab() {
  const { toast } = useToast();
  const [queries, setQueries] = useState<StudentQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [priority, setPriority] = useState("medium");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const data = await queriesApi.getMyQueries();
      setQueries(data);
    } catch (error) {
      console.error("Failed to fetch queries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in title and description",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      await queriesApi.submit({
        title,
        description,
        category,
        priority,
        file: selectedFile || undefined
      });
      toast({
        title: "Query submitted!",
        description: "Your query has been submitted and will be reviewed soon."
      });
      setTitle("");
      setDescription("");
      setCategory("other");
      setPriority("medium");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchQueries();
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error.message || "Failed to submit query",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "accepted": return "bg-green-500";
      case "rejected": return "bg-red-500";
      case "resolved": return "bg-blue-500";
      case "in_review": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Submit a Query</CardTitle>
          <CardDescription>Your query will be reviewed by admin and handled by staff</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input 
            placeholder="Query Title" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="academic">Academic</SelectItem>
                <SelectItem value="attendance">Attendance</SelectItem>
                <SelectItem value="assignment">Assignment</SelectItem>
                <SelectItem value="exam">Exam</SelectItem>
                <SelectItem value="revaluation">Revaluation</SelectItem>
                <SelectItem value="fees">Fees</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Textarea 
            placeholder="Describe your query in detail..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
          <div className="flex items-center gap-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
            />
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              {selectedFile ? selectedFile.name : "Attach File (optional)"}
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={submitting}
              className="gap-2"
            >
              {submitting ? (
                <Clock className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Submit Query
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Queries</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-6 w-6 animate-spin mx-auto mb-2" />
              Loading...
            </div>
          ) : queries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Send className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No queries submitted yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {queries.map((query) => (
                <div key={query.id} className="p-4 rounded-lg border border-border/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{query.title}</p>
                      <Badge variant="outline" className="text-xs capitalize">{query.category}</Badge>
                    </div>
                    <Badge className={getStatusColor(query.status)}>
                      {query.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{query.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Submitted: {new Date(query.created_at).toLocaleString()}
                  </p>
                  {query.response && (
                    <div className="mt-2 p-2 rounded bg-primary/10 text-sm">
                      <strong>Response:</strong> {query.response}
                      {query.responded_by_name && (
                        <span className="text-xs text-muted-foreground ml-2">
                          - {query.responded_by_name}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MindmapTab() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [mindMapData, setMindMapData] = useState<SeparateMindMapData | MindMapData | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [activeInputTab, setActiveInputTab] = useState<'upload' | 'text'>('upload');
  const [hoveredNode, setHoveredNode] = useState<MindMapNode | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Helper to check if data is separate mindmap format
  const isSeparateData = (data: any): data is SeparateMindMapData => {
    return data && 'separate_mindmaps' in data;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Please upload a PDF file only.');
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Please upload a PDF file only.');
      }
    }
  };

  const handleGenerateFromPdf = async () => {
    if (!selectedFile) {
      setError('Please select a PDF file first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await mindmapApi.generateFromPdf(selectedFile);
      if (response.success) {
        setMindMapData(response.data);
        const stats = response.data.statistics;
        toast({
          title: 'Mind Maps Generated!',
          description: `Created ${stats.total_topics} separate topic mind maps covering all content.`,
        });
      } else {
        setError(response.message || 'Failed to generate mind map.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating the mind map.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateFromText = async () => {
    if (!textInput.trim()) {
      setError('Please enter some text to analyze.');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await mindmapApi.generateFromText(textInput, 'Study Notes');
      if (response.success) {
        setMindMapData(response.data);
        const stats = response.data.statistics;
        toast({
          title: 'Mind Maps Generated!',
          description: `Created ${stats.total_topics} separate topic mind maps from your text.`,
        });
      } else {
        setError(response.message || 'Failed to generate mind map.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating the mind map.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSample = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await mindmapApi.getSample();
      if (response.success) {
        setMindMapData(response.data);
        toast({
          title: 'Sample Loaded!',
          description: 'Explore the interactive mind map features.',
        });
      }
    } catch (err: any) {
      setError('Failed to load sample mind map.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              AI Mind Map Generator
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Transform your study materials into interactive visual mind maps powered by AI
          </p>
        </div>
        
        <Button variant="outline" onClick={handleLoadSample} disabled={isLoading}>
          <Eye className="h-4 w-4 mr-2" />
          Try Sample
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Input Source
              </CardTitle>
              <CardDescription>
                Upload a PDF or paste text to generate your mind map
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeInputTab} onValueChange={(v) => setActiveInputTab(v as 'upload' | 'text')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload" className="gap-1 text-xs">
                    <Upload className="h-3 w-3" />
                    Upload PDF
                  </TabsTrigger>
                  <TabsTrigger value="text" className="gap-1 text-xs">
                    <FileText className="h-3 w-3" />
                    Text Input
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="space-y-4 mt-4">
                  {/* Drag and Drop Zone */}
                  <div
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
                      ${dragActive 
                        ? 'border-primary bg-primary/10' 
                        : 'border-muted-foreground/25 hover:border-primary/50'
                      }
                      ${selectedFile ? 'bg-green-50 dark:bg-green-950/20 border-green-500' : ''}
                    `}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    
                    {selectedFile ? (
                      <div className="space-y-2">
                        <CheckCircle className="h-10 w-10 mx-auto text-green-500" />
                        <p className="font-medium text-green-700 dark:text-green-300">
                          {selectedFile.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                        <p className="font-medium">Drop your PDF here</p>
                        <p className="text-sm text-muted-foreground">
                          or click to browse
                        </p>
                      </div>
                    )}
                  </div>

                  <Button 
                    className="w-full gap-2" 
                    onClick={handleGenerateFromPdf}
                    disabled={!selectedFile || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Analyzing PDF...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4" />
                        Generate Mind Map
                      </>
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="text" className="space-y-4 mt-4">
                  <Textarea
                    placeholder="Paste your study notes, syllabus content, or any text you want to visualize as a mind map..."
                    className="min-h-[200px] resize-none"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                  />
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{textInput.length} characters</span>
                    <span>Min: 100 chars recommended</span>
                  </div>

                  <Button 
                    className="w-full gap-2" 
                    onClick={handleGenerateFromText}
                    disabled={textInput.length < 50 || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Analyzing Text...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4" />
                        Generate Mind Map
                      </>
                    )}
                  </Button>
                </TabsContent>
              </Tabs>

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Selected Node Details */}
          {hoveredNode && (
            <Card className="animate-in slide-in-from-left">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: hoveredNode.color }}
                  />
                  <CardTitle className="text-lg">{hoveredNode.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {hoveredNode.description && (
                  <p className="text-sm text-muted-foreground">
                    {hoveredNode.description}
                  </p>
                )}
                
                {hoveredNode.keywords?.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase text-muted-foreground">Keywords</p>
                    <div className="flex flex-wrap gap-1">
                      {hoveredNode.keywords.map((kw: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">{kw}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Mind Map Visualization */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Mind Map Visualization
                </CardTitle>
                
                {mindMapData && (
                  <div className="flex items-center gap-2">
                    {isSeparateData(mindMapData) ? (
                      <>
                        <Badge variant="outline">
                          {mindMapData.statistics.total_topics} topics
                        </Badge>
                        <Badge variant="outline">
                          {mindMapData.statistics.total_mindmaps} maps
                        </Badge>
                      </>
                    ) : (
                      <>
                        <Badge variant="outline">
                          {mindMapData.statistics.total_nodes} nodes
                        </Badge>
                        <Badge variant="outline">
                          {mindMapData.statistics.depth_levels} levels
                        </Badge>
                      </>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {isLoading ? (
                <div className="h-[500px] flex flex-col items-center justify-center space-y-4">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-primary/30 rounded-full" />
                    <div className="absolute inset-0 w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <Brain className="absolute inset-0 m-auto h-8 w-8 text-primary animate-pulse" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="font-medium">Analyzing content...</p>
                    <p className="text-sm text-muted-foreground">
                      AI is extracting topics and building separate mind maps
                    </p>
                  </div>
                </div>
              ) : mindMapData ? (
                <MindMapVisualization
                  data={mindMapData}
                  onNodeClick={(node) => setHoveredNode(node)}
                />
              ) : (
                <div className="h-[500px] flex flex-col items-center justify-center space-y-4 text-center">
                  <div className="p-6 rounded-full bg-muted/50">
                    <Brain className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">No Mind Map Yet</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Upload a PDF file or enter text to generate an AI-powered 
                      mind map visualization of your study materials.
                    </p>
                  </div>
                  <Button variant="secondary" onClick={handleLoadSample}>
                    <Eye className="h-4 w-4 mr-2" />
                    Load Sample Mind Map
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}

// ==================== MAIN COMPONENT ====================

export default function StudentDashboard() {
  const { toast } = useToast();
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>(defaultAttendanceData);
  const [fees, setFees] = useState<FeeStructure>(defaultFees);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await studentApi.getDashboardData();
        setAttendanceData(data.attendance);
        setFees(data.fee_structure);
      } catch (error) {
        console.error("Failed to fetch student dashboard data:", error);
        toast({
          title: "Using cached dashboard data",
          description: "Could not fetch latest attendance and fee structure.",
          variant: "destructive",
        });
      }
    };

    fetchDashboardData();
  }, [toast]);

  return (
    <DashboardLayout title="Student Portal">
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-5 lg:grid-cols-10 gap-2 h-auto p-1">
          <TabsTrigger value="overview" className="gap-1 text-xs">
            <GraduationCap className="h-3 w-3" /> Overview
          </TabsTrigger>
          <TabsTrigger value="attendance" className="gap-1 text-xs">
            <Calendar className="h-3 w-3" /> Attendance
          </TabsTrigger>
          <TabsTrigger value="marks" className="gap-1 text-xs">
            <ClipboardCheck className="h-3 w-3" /> Internal Marks
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-1 text-xs">
            <FileText className="h-3 w-3" /> Notes
          </TabsTrigger>
          <TabsTrigger value="assignments" className="gap-1 text-xs">
            <Upload className="h-3 w-3" /> Assignments
          </TabsTrigger>
          <TabsTrigger value="fees" className="gap-1 text-xs">
            <CreditCard className="h-3 w-3" /> Fees
          </TabsTrigger>
          <TabsTrigger value="results" className="gap-1 text-xs">
            <GraduationCap className="h-3 w-3" /> Results
          </TabsTrigger>
          <TabsTrigger value="revaluation" className="gap-1 text-xs">
            <RefreshCw className="h-3 w-3" /> Revaluation
          </TabsTrigger>
          <TabsTrigger value="queries" className="gap-1 text-xs">
            <Send className="h-3 w-3" /> Queries
          </TabsTrigger>
          <TabsTrigger value="mindmap" className="gap-1 text-xs">
            <Brain className="h-3 w-3" /> AI Mindmap
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><OverviewTab /></TabsContent>
        <TabsContent value="attendance"><AttendanceTab attendanceData={attendanceData} /></TabsContent>
        <TabsContent value="marks"><InternalMarksTab /></TabsContent>
        <TabsContent value="notes"><NotesTab /></TabsContent>
        <TabsContent value="assignments"><AssignmentsTab /></TabsContent>
        <TabsContent value="fees"><FeesTab fees={fees} /></TabsContent>
        <TabsContent value="results"><ResultsTab /></TabsContent>
        <TabsContent value="revaluation"><RevaluationTab fees={fees} attendanceData={attendanceData} /></TabsContent>
        <TabsContent value="queries"><QueryTab /></TabsContent>
        <TabsContent value="mindmap"><MindmapTab /></TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
