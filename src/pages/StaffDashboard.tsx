/**
 * Staff Dashboard - Comprehensive Staff Portal
 * Features: Notes Upload, Query Management, Assignment Creation, Student Performance
 */

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ChartCard } from "@/components/shared/ChartCard";
import { useState, useRef, useEffect } from "react";
import { notesApi, Note, assignmentsApi, Assignment, AssignmentSubmission, queriesApi, StudentQuery } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, PieChart, Pie
} from "recharts";
import {
  ChevronLeft, ChevronRight, Upload, FileText, Users, Calendar,
  ClipboardCheck, Send, CheckCircle, XCircle, Clock, AlertTriangle,
  Plus, Trash2, Eye, Download, Bell, BookOpen, GraduationCap,
  MessageSquare, Filter, Search, FileQuestion, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ==================== DATA ====================

const calendarEvents: Record<string, { title: string; type: string }[]> = {
  "2026-03-05": [{ title: "CS301 Lab", type: "lab" }],
  "2026-03-10": [{ title: "Faculty Meeting", type: "meeting" }],
  "2026-03-15": [{ title: "CS301 Exam", type: "exam" }],
  "2026-03-18": [{ title: "MA201 Exam", type: "exam" }],
  "2026-03-22": [{ title: "Workshop", type: "event" }],
};

const typeColors: Record<string, string> = {
  lab: "bg-primary/60",
  meeting: "bg-secondary/60",
  exam: "bg-yellow-500/60",
  event: "bg-green-500/60",
};

// Mock data removed - now fetched from API

const studentPerformance = [
  { name: "Module 1", average: 72, highest: 95, lowest: 45 },
  { name: "Module 2", average: 68, highest: 92, lowest: 38 },
  { name: "Module 3", average: 75, highest: 98, lowest: 52 },
];

const attendanceStats = [
  { subject: "CS301", attendance: 86 },
  { subject: "CS302", attendance: 78 },
  { subject: "CS303", attendance: 92 },
];

const classStudents = [
  { id: 1, name: "John Doe", regNo: "2024CS001", attendance: 92, ia: 52, status: "good" },
  { id: 2, name: "Jane Smith", regNo: "2024CS002", attendance: 74, ia: 48, status: "warning" },
  { id: 3, name: "Mike Wilson", regNo: "2024CS003", attendance: 88, ia: 45, status: "good" },
  { id: 4, name: "Emily Brown", regNo: "2024CS004", attendance: 68, ia: 38, status: "critical" },
  { id: 5, name: "Chris Lee", regNo: "2024CS005", attendance: 95, ia: 55, status: "good" },
];

// ==================== TAB COMPONENTS ====================

function OverviewTab() {
  const [month] = useState(2);
  const daysInMonth = 31;
  const firstDay = 6;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  const getEvents = (day: number) => {
    const key = `2026-03-${String(day).padStart(2, "0")}`;
    return calendarEvents[key] || [];
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/20 to-transparent">
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto text-primary mb-2" />
            <p className="text-3xl font-bold text-primary">156</p>
            <p className="text-sm text-muted-foreground">Total Students</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/20 to-transparent">
          <CardContent className="p-4 text-center">
            <FileText className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <p className="text-3xl font-bold text-green-500">12</p>
            <p className="text-sm text-muted-foreground">Notes Uploaded</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500/20 to-transparent">
          <CardContent className="p-4 text-center">
            <MessageSquare className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
            <p className="text-3xl font-bold text-yellow-500">5</p>
            <p className="text-sm text-muted-foreground">Pending Queries</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/20 to-transparent">
          <CardContent className="p-4 text-center">
            <ClipboardCheck className="h-8 w-8 mx-auto text-purple-500 mb-2" />
            <p className="text-3xl font-bold text-purple-500">3</p>
            <p className="text-sm text-muted-foreground">Active Assignments</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <ChartCard
        title="Academic Calendar"
        subtitle="March 2026"
        action={
          <div className="flex items-center gap-2">
            <button className="rounded-md p-1 text-muted-foreground hover:bg-muted"><ChevronLeft className="h-4 w-4" /></button>
            <span className="text-sm font-medium text-foreground">March 2026</span>
            <button className="rounded-md p-1 text-muted-foreground hover:bg-muted"><ChevronRight className="h-4 w-4" /></button>
          </div>
        }
      >
        <div className="grid grid-cols-7 gap-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {d}
            </div>
          ))}
          {blanks.map((b) => (
            <div key={`blank-${b}`} className="h-16 rounded-lg" />
          ))}
          {days.map((day) => {
            const events = getEvents(day);
            const isToday = day === 3;
            return (
              <div
                key={day}
                className={`h-16 rounded-lg border p-1.5 transition-colors hover:bg-muted/20 ${
                  isToday ? "border-primary/40 bg-primary/5" : "border-border/10"
                }`}
              >
                <span className={`text-xs ${isToday ? "font-bold text-primary" : "text-muted-foreground"}`}>{day}</span>
                <div className="mt-0.5 space-y-0.5">
                  {events.map((e, i) => (
                    <div key={i} className={`truncate rounded px-1 py-0.5 text-[8px] font-medium text-foreground ${typeColors[e.type]}`}>
                      {e.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-4">
          {Object.entries(typeColors).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className={`h-2 w-2 rounded-full ${color}`} />
              <span className="text-[10px] capitalize text-muted-foreground">{type}</span>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}

function NotesUploadTab() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedNotes, setUploadedNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  // Form state
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [noteType, setNoteType] = useState<"notes" | "important_questions" | "question_paper" | "">("");
  const [description, setDescription] = useState("");

  // Fetch uploaded notes on mount
  useEffect(() => {
    fetchMyNotes();
  }, []);

  const fetchMyNotes = async () => {
    try {
      setFetching(true);
      const notes = await notesApi.getMyUploads();
      setUploadedNotes(notes);
    } catch (error) {
      console.error("Failed to fetch notes:", error);
    } finally {
      setFetching(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 10MB",
          variant: "destructive"
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!selectedFile || !title || !subject || !noteType) {
      toast({
        title: "Missing fields",
        description: "Please fill all required fields and select a file",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      await notesApi.upload(selectedFile, {
        title,
        subject,
        note_type: noteType,
        description: description || undefined
      });
      toast({
        title: "Upload successful",
        description: "Your study material has been uploaded successfully"
      });
      
      // Reset form
      setSelectedFile(null);
      setTitle("");
      setSubject("");
      setNoteType("");
      setDescription("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      // Refresh notes list
      fetchMyNotes();
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (noteId: number) => {
    try {
      await notesApi.delete(noteId);
      toast({
        title: "Deleted",
        description: "Study material has been deleted"
      });
      fetchMyNotes();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete file",
        variant: "destructive"
      });
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

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Study Material
          </CardTitle>
          <CardDescription>Upload notes, question papers, or important questions for students</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Title *</label>
              <Input 
                placeholder="Enter title" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Subject *</label>
              <Input 
                placeholder="e.g., CS301 - Data Structures" 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Material Type *</label>
              <Select value={noteType} onValueChange={(v) => setNoteType(v as typeof noteType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="notes">Notes</SelectItem>
                  <SelectItem value="important_questions">Important Questions</SelectItem>
                  <SelectItem value="question_paper">Question Paper</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
              <Input 
                placeholder="Brief description" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
            className="hidden"
          />
          
          {/* File drop zone */}
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              selectedFile ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/50"
            }`}
            onClick={handleBrowseClick}
          >
            {selectedFile ? (
              <>
                <FileText className="h-10 w-10 mx-auto text-primary mb-2" />
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                <Button 
                  variant="link" 
                  className="mt-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  Remove and choose another
                </Button>
              </>
            ) : (
              <>
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Click to browse files from your computer</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, PPT, XLS, TXT (Max 10MB)</p>
                <Button className="mt-4 gap-2" variant="outline">
                  <Upload className="h-4 w-4" />
                  Browse Files
                </Button>
              </>
            )}
          </div>
          
          <Button 
            className="w-full gap-2" 
            onClick={handleUpload}
            disabled={loading || !selectedFile || !title || !subject || !noteType}
          >
            {loading ? (
              <>
                <Clock className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload Material
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Uploaded Notes List */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Materials</CardTitle>
          <CardDescription>Your uploaded study materials</CardDescription>
        </CardHeader>
        <CardContent>
          {fetching ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : uploadedNotes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No materials uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {uploadedNotes.map((note) => (
                <div key={note.id} className="flex items-center justify-between p-4 rounded-lg border border-border/20 hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      note.note_type === "notes" ? "bg-blue-500/10 text-blue-500" :
                      note.note_type === "important_questions" ? "bg-yellow-500/10 text-yellow-500" :
                      "bg-purple-500/10 text-purple-500"
                    }`}>
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{note.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {note.subject} • {formatDate(note.created_at)} • {formatFileSize(note.file_size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="capitalize">
                      {note.note_type.replace(/_/g, " ")}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      <Download className="h-3 w-3 inline mr-1" />
                      {note.download_count} downloads
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-destructive"
                      onClick={() => handleDelete(note.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function QueryManagementTab() {
  const { toast } = useToast();
  const [queries, setQueries] = useState<StudentQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [respondingTo, setRespondingTo] = useState<number | null>(null);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchQueries = async () => {
    try {
      const data = await queriesApi.getAll();
      setQueries(data.queries || []);
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch queries", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, []);

  const handleRespond = async (queryId: number, status: 'accepted' | 'rejected' | 'resolved') => {
    if (!responseText.trim() && status !== 'rejected') {
      toast({ title: "Error", description: "Please enter a response", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await queriesApi.respond(queryId, responseText, status);
      toast({ title: "Success", description: `Query ${status} successfully` });
      setRespondingTo(null);
      setResponseText('');
      fetchQueries();
    } catch (error) {
      toast({ title: "Error", description: "Failed to respond to query", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredQueries = queries.filter(q => {
    const matchesFilter = filter === 'all' || 
      (filter === 'pending' && q.status === 'pending') ||
      (filter === 'resolved' && ['accepted', 'rejected', 'resolved'].includes(q.status));
    const matchesSearch = q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingCount = queries.filter(q => q.status === 'pending').length;

  if (loading) {
    return <div className="flex justify-center py-8"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')} className="gap-2">
            <Filter className="h-4 w-4" /> All Queries
          </Button>
          <Button variant={filter === 'pending' ? 'default' : 'outline'} onClick={() => setFilter('pending')} className="gap-2">
            <Clock className="h-4 w-4" /> Pending ({pendingCount})
          </Button>
          <Button variant={filter === 'resolved' ? 'default' : 'outline'} onClick={() => setFilter('resolved')} className="gap-2">
            <CheckCircle className="h-4 w-4" /> Resolved
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search queries..." 
            className="pl-10 w-64" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {pendingCount > 0 && (
        <Alert className="border-yellow-500/50 bg-yellow-500/10">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-yellow-500">
            You have {pendingCount} pending queries that need attention.
          </AlertDescription>
        </Alert>
      )}

      {filteredQueries.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No queries found</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {filteredQueries.map((query) => (
            <Card key={query.id} className={query.status === "pending" ? "border-yellow-500/30" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${
                      query.priority === "urgent" || query.priority === "high" ? "bg-red-500/10 text-red-500" :
                      query.priority === "medium" ? "bg-yellow-500/10 text-yellow-500" :
                      "bg-green-500/10 text-green-500"
                    }`}>
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{query.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{query.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Category: {query.category}</span>
                        <span>Submitted: {new Date(query.created_at).toLocaleDateString()}</span>
                      </div>
                      {query.file_path && (
                        <Button size="sm" variant="link" className="p-0 h-auto mt-1 gap-1">
                          <FileText className="h-3 w-3" /> Attachment
                        </Button>
                      )}
                      {query.response && (
                        <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm font-medium text-green-500">Response:</p>
                          <p className="text-sm">{query.response}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={query.priority === "urgent" || query.priority === "high" ? "destructive" : query.priority === "medium" ? "default" : "secondary"}>
                        {query.priority}
                      </Badge>
                      <Badge variant={query.status === "pending" ? "outline" : query.status === "accepted" || query.status === "resolved" ? "default" : "destructive"}>
                        {query.status}
                      </Badge>
                    </div>
                    {query.status === "pending" && (
                      <Button size="sm" className="gap-1" onClick={() => setRespondingTo(respondingTo === query.id ? null : query.id)}>
                        <Send className="h-4 w-4" />
                        {respondingTo === query.id ? 'Cancel' : 'Respond'}
                      </Button>
                    )}
                  </div>
                </div>
                {respondingTo === query.id && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <Textarea 
                      placeholder="Enter your response..." 
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="destructive" onClick={() => handleRespond(query.id, 'rejected')} disabled={submitting}>
                        <XCircle className="h-4 w-4 mr-1" /> Reject
                      </Button>
                      <Button size="sm" variant="default" onClick={() => handleRespond(query.id, 'accepted')} disabled={submitting}>
                        <CheckCircle className="h-4 w-4 mr-1" /> Accept
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleRespond(query.id, 'resolved')} disabled={submitting}>
                        <Star className="h-4 w-4 mr-1" /> Resolve
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AssignmentManagementTab() {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [maxMarks, setMaxMarks] = useState('100');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Submissions view
  const [viewingAssignmentId, setViewingAssignmentId] = useState<number | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Grading
  const [gradingSubmissionId, setGradingSubmissionId] = useState<number | null>(null);
  const [gradeMarks, setGradeMarks] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');

  const fetchAssignments = async () => {
    try {
      const data = await assignmentsApi.getAll();
      setAssignments(data.assignments || []);
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch assignments", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        toast({ title: "Error", description: "File size must be less than 15MB", variant: "destructive" });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleCreateAssignment = async () => {
    if (!title || !subject || !deadline) {
      toast({ title: "Error", description: "Please fill in title, subject and deadline", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      await assignmentsApi.create(title, subject, description, deadline, parseInt(maxMarks) || 100, selectedFile || undefined);
      toast({ title: "Success", description: "Assignment created successfully" });
      // Reset form
      setTitle('');
      setSubject('');
      setDescription('');
      setDeadline('');
      setMaxMarks('100');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchAssignments();
    } catch (error) {
      toast({ title: "Error", description: "Failed to create assignment", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleViewSubmissions = async (assignmentId: number) => {
    if (viewingAssignmentId === assignmentId) {
      setViewingAssignmentId(null);
      return;
    }
    setViewingAssignmentId(assignmentId);
    setLoadingSubmissions(true);
    try {
      const data = await assignmentsApi.getSubmissions(assignmentId);
      setSubmissions(data);
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch submissions", variant: "destructive" });
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleGrade = async (submissionId: number) => {
    if (!gradeMarks) {
      toast({ title: "Error", description: "Please enter marks", variant: "destructive" });
      return;
    }
    try {
      await assignmentsApi.grade(submissionId, parseFloat(gradeMarks), gradeFeedback);
      toast({ title: "Success", description: "Submission graded successfully" });
      setGradingSubmissionId(null);
      setGradeMarks('');
      setGradeFeedback('');
      if (viewingAssignmentId) handleViewSubmissions(viewingAssignmentId);
    } catch (error) {
      toast({ title: "Error", description: "Failed to grade submission", variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Create Assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Assignment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Subject</label>
              <Input placeholder="e.g., CS301" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium mb-2 block">Title</label>
              <Input placeholder="Assignment title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Max Marks</label>
              <Input type="number" placeholder="100" value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Deadline</label>
              <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Question File (PDF/DOC, max 15MB)</label>
              <Input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleFileSelect} />
              {selectedFile && <p className="text-xs text-muted-foreground mt-1">{selectedFile.name}</p>}
            </div>
          </div>
          <Textarea placeholder="Assignment description and instructions..." rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          <Button className="gap-2" onClick={handleCreateAssignment} disabled={creating}>
            <Plus className="h-4 w-4" />
            {creating ? 'Creating...' : 'Create Assignment'}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>Active Assignments</CardTitle>
          <CardDescription>Monitor student submissions</CardDescription>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No assignments created yet</p>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => {
                const submissionCount = assignment.submissions_count || 0;
                const isViewing = viewingAssignmentId === assignment.id;
                return (
                  <div key={assignment.id} className="border border-border/20 rounded-lg overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium">{assignment.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {assignment.subject} • Due: {new Date(assignment.deadline).toLocaleDateString()} {new Date(assignment.deadline).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                          {assignment.description && <p className="text-sm mt-1">{assignment.description}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          {assignment.file_path && (
                            <Button size="sm" variant="outline" className="gap-1">
                              <Download className="h-4 w-4" /> Question
                            </Button>
                          )}
                          <Badge variant="secondary">{submissionCount} submitted</Badge>
                          <Badge variant={assignment.status === 'active' ? 'default' : 'outline'}>{assignment.status}</Badge>
                          <Button size="sm" variant="outline" className="gap-1" onClick={() => handleViewSubmissions(assignment.id)}>
                            <Eye className="h-4 w-4" />
                            {isViewing ? 'Hide' : 'View'} Submissions
                          </Button>
                        </div>
                      </div>
                    </div>
                    {isViewing && (
                      <div className="border-t bg-muted/20 p-4">
                        {loadingSubmissions ? (
                          <div className="flex justify-center py-4"><div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" /></div>
                        ) : submissions.length === 0 ? (
                          <p className="text-center text-muted-foreground py-2">No submissions yet</p>
                        ) : (
                          <div className="space-y-3">
                            {submissions.map((sub) => (
                              <div key={sub.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                                <div>
                                  <p className="font-medium">Student ID: {sub.student_id}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Submitted: {new Date(sub.submitted_at).toLocaleString()} • Status: {sub.status}
                                  </p>
                                  {sub.marks !== null && (
                                    <p className="text-sm text-green-500 mt-1">Marks: {sub.marks}/{assignment.max_marks}</p>
                                  )}
                                  {sub.feedback && <p className="text-sm mt-1">Feedback: {sub.feedback}</p>}
                                </div>
                                <div className="flex items-center gap-2">
                                  {sub.file_path && (
                                    <Button size="sm" variant="outline" className="gap-1">
                                      <Download className="h-4 w-4" /> Download
                                    </Button>
                                  )}
                                  {sub.status !== 'graded' && (
                                    <Button size="sm" onClick={() => setGradingSubmissionId(gradingSubmissionId === sub.id ? null : sub.id)}>
                                      {gradingSubmissionId === sub.id ? 'Cancel' : 'Grade'}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                            {gradingSubmissionId && submissions.find(s => s.id === gradingSubmissionId) && (
                              <div className="p-3 bg-background rounded-lg border space-y-3">
                                <div className="flex gap-3">
                                  <div className="flex-1">
                                    <label className="text-sm font-medium block mb-1">Marks (out of {assignment.max_marks})</label>
                                    <Input type="number" value={gradeMarks} onChange={(e) => setGradeMarks(e.target.value)} max={assignment.max_marks} />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium block mb-1">Feedback</label>
                                  <Textarea value={gradeFeedback} onChange={(e) => setGradeFeedback(e.target.value)} rows={2} />
                                </div>
                                <Button onClick={() => handleGrade(gradingSubmissionId)}>Submit Grade</Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StudentPerformanceTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Class Performance" subtitle="Module-wise average scores">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={studentPerformance}>
              <XAxis dataKey="name" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }} />
              <YAxis tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }} domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="average" name="Average" fill="hsl(168, 100%, 48%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="highest" name="Highest" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="lowest" name="Lowest" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Attendance Overview" subtitle="Subject-wise attendance">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={attendanceStats} layout="vertical">
              <XAxis type="number" domain={[0, 100]} tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }} />
              <YAxis dataKey="subject" type="category" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }} width={60} />
              <Tooltip />
              <Bar dataKey="attendance" fill="hsl(239, 84%, 67%)" radius={[0, 4, 4, 0]}>
                {attendanceStats.map((entry, index) => (
                  <Cell key={index} fill={entry.attendance >= 75 ? "hsl(168, 100%, 48%)" : "hsl(0, 84%, 60%)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Student List */}
      <Card>
        <CardHeader>
          <CardTitle>Student List - CS301</CardTitle>
          <CardDescription>Monitor individual student performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left py-3 px-4">Student</th>
                  <th className="text-left py-3 px-4">Reg No</th>
                  <th className="text-center py-3 px-4">Attendance</th>
                  <th className="text-center py-3 px-4">IA Marks</th>
                  <th className="text-center py-3 px-4">Status</th>
                  <th className="text-center py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {classStudents.map((student) => (
                  <tr key={student.id} className="border-b border-border/20 hover:bg-muted/20">
                    <td className="py-3 px-4 font-medium">{student.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{student.regNo}</td>
                    <td className="text-center py-3 px-4">
                      <span className={student.attendance >= 75 ? 'text-green-500' : 'text-red-500'}>
                        {student.attendance}%
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">{student.ia}/60</td>
                    <td className="text-center py-3 px-4">
                      <Badge variant={
                        student.status === "good" ? "default" :
                        student.status === "warning" ? "secondary" : "destructive"
                      }>
                        {student.status}
                      </Badge>
                    </td>
                    <td className="text-center py-3 px-4">
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
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

// ==================== MAIN COMPONENT ====================

export default function StaffDashboard() {
  return (
    <DashboardLayout title="Staff Portal">
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-5 gap-2 h-auto p-1">
          <TabsTrigger value="overview" className="gap-1 text-xs">
            <Calendar className="h-3 w-3" /> Overview
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-1 text-xs">
            <Upload className="h-3 w-3" /> Notes Upload
          </TabsTrigger>
          <TabsTrigger value="queries" className="gap-1 text-xs">
            <MessageSquare className="h-3 w-3" /> Queries
          </TabsTrigger>
          <TabsTrigger value="assignments" className="gap-1 text-xs">
            <ClipboardCheck className="h-3 w-3" /> Assignments
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-1 text-xs">
            <GraduationCap className="h-3 w-3" /> Students
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><OverviewTab /></TabsContent>
        <TabsContent value="notes"><NotesUploadTab /></TabsContent>
        <TabsContent value="queries"><QueryManagementTab /></TabsContent>
        <TabsContent value="assignments"><AssignmentManagementTab /></TabsContent>
        <TabsContent value="performance"><StudentPerformanceTab /></TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
