/**
 * Admin Dashboard - Central Administration Portal
 * Features: Query Management, Performance Analytics, User Management, System Overview
 */

import { useState, useEffect } from "react";
import { queriesApi, StudentQuery } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, ClipboardList, Calendar, AlertTriangle, MessageSquare,
  CheckCircle, XCircle, Send, Filter, Search, Eye, Building,
  GraduationCap, UserCheck, FileText, TrendingUp, Bell, Settings, Star
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar 
} from "recharts";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KPICard } from "@/components/shared/KPICard";
import { ChartCard } from "@/components/shared/ChartCard";
import { AIInsightPanel } from "@/components/shared/AIInsightPanel";
import { DataTable } from "@/components/shared/DataTable";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

// ==================== DATA ====================

const performanceData = [
  { month: "Jan", score: 72 },
  { month: "Feb", score: 75 },
  { month: "Mar", score: 78 },
  { month: "Apr", score: 74 },
  { month: "May", score: 82 },
  { month: "Jun", score: 86 },
  { month: "Jul", score: 84 },
  { month: "Aug", score: 88 },
];

const eventData = [
  { name: "Technical", value: 35, color: "hsl(168, 100%, 48%)" },
  { name: "Cultural", value: 25, color: "hsl(239, 84%, 67%)" },
  { name: "Sports", value: 20, color: "hsl(48, 96%, 53%)" },
  { name: "Academic", value: 20, color: "hsl(142, 76%, 36%)" },
];

const scheduleData = [
  { subject: "CS301 - Data Structures", date: "Mar 15, 2026", time: "10:00 AM", status: "Confirmed" },
  { subject: "MA201 - Linear Algebra", date: "Mar 18, 2026", time: "2:00 PM", status: "Pending" },
  { subject: "EC202 - Signals", date: "Mar 20, 2026", time: "10:00 AM", status: "Confirmed" },
  { subject: "PH101 - Quantum Physics", date: "Mar 22, 2026", time: "11:00 AM", status: "Draft" },
];

// pendingQueries mock data removed - now fetched from API

const departmentStats = [
  { dept: "Computer Science", students: 450, staff: 25, attendance: 86 },
  { dept: "Electronics", students: 380, staff: 22, attendance: 82 },
  { dept: "Mechanical", students: 320, staff: 18, attendance: 78 },
  { dept: "Civil", students: 280, staff: 15, attendance: 84 },
];

const recentActivities = [
  { action: "Query Accepted", user: "Admin", details: "Re-evaluation request for CS301", time: "2 hours ago" },
  { action: "Event Approved", user: "Admin", details: "Tech Fest 2026", time: "4 hours ago" },
  { action: "New Staff Added", user: "Admin", details: "Dr. Robert Smith - CS Dept", time: "1 day ago" },
  { action: "Fee Structure Updated", user: "Admin", details: "Semester 4 fees updated", time: "2 days ago" },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-lg border border-border/30 bg-card/95 px-3 py-2 shadow-xl backdrop-blur-xl">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-primary">{payload[0].value}%</p>
      </div>
    );
  }
  return null;
};

// ==================== TAB COMPONENTS ====================

function OverviewTab() {
  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Total Students" value={2847} icon={Users} change="+12.5% from last month" changeType="positive" delay={0} />
        <KPICard title="Active Exams" value={18} icon={ClipboardList} change="3 starting this week" changeType="neutral" delay={100} />
        <KPICard title="Pending Queries" value="--"  icon={MessageSquare} change="View in Queries tab" changeType="neutral" delay={200} />
        <KPICard title="At-Risk Students" value={12} icon={AlertTriangle} change="-3 from last week" changeType="positive" delay={300} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard title="Performance Trend" subtitle="Average student scores over time">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(168, 100%, 48%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(168, 100%, 48%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} domain={[60, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="score" stroke="hsl(168, 100%, 48%)" strokeWidth={2} fill="url(#perfGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <ChartCard title="Event Categories" subtitle="Distribution by type">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={eventData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
                {eventData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            {eventData.map((e, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: e.color }} />
                <span className="text-[10px] text-muted-foreground">{e.name}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard title="Upcoming Schedules" subtitle="Exam and event calendar">
            <DataTable
              columns={[
                { header: "Subject", accessor: "subject" },
                { header: "Date", accessor: "date" },
                { header: "Time", accessor: "time" },
                {
                  header: "Status",
                  accessor: (row) => (
                    <RiskBadge level={row.status === "Confirmed" ? "safe" : row.status === "Pending" ? "low" : "medium"} />
                  ),
                },
              ]}
              data={scheduleData}
            />
          </ChartCard>
        </div>

        <AIInsightPanel />
      </div>
    </div>
  );
}

function QueryManagementTab() {
  const { toast } = useToast();
  const [queries, setQueries] = useState<StudentQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'pending' | 'accepted' | 'rejected'>('pending');
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
    if (!responseText.trim() && status === 'accepted') {
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
    const matchesTab = 
      (selectedTab === 'pending' && q.status === 'pending') ||
      (selectedTab === 'accepted' && (q.status === 'accepted' || q.status === 'resolved')) ||
      (selectedTab === 'rejected' && q.status === 'rejected');
    const matchesSearch = q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const pendingCount = queries.filter(q => q.status === 'pending').length;
  const highPriorityCount = queries.filter(q => q.status === 'pending' && (q.priority === 'high' || q.priority === 'urgent')).length;

  if (loading) {
    return <div className="flex justify-center py-8"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Alert for pending queries */}
      {highPriorityCount > 0 && (
        <Alert className="border-red-500/50 bg-red-500/10">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-500">
            {highPriorityCount} high priority queries need immediate attention!
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button variant={selectedTab === "pending" ? "default" : "outline"} onClick={() => setSelectedTab("pending")} className="gap-2">
            <MessageSquare className="h-4 w-4" /> Pending ({pendingCount})
          </Button>
          <Button variant={selectedTab === "accepted" ? "default" : "outline"} onClick={() => setSelectedTab("accepted")} className="gap-2">
            <CheckCircle className="h-4 w-4" /> Accepted
          </Button>
          <Button variant={selectedTab === "rejected" ? "default" : "outline"} onClick={() => setSelectedTab("rejected")} className="gap-2">
            <XCircle className="h-4 w-4" /> Rejected
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

      <Card>
        <CardHeader>
          <CardTitle>Query Queue</CardTitle>
          <CardDescription>
            Review and route queries to appropriate staff members.
            <span className="block mt-1 text-primary">Flow: Student/Staff → Admin (Accept/Reject) → Staff (Resolve)</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredQueries.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No queries found</p>
          ) : (
            <div className="space-y-4">
              {filteredQueries.map((query) => (
                <div key={query.id} className={`p-4 rounded-lg border transition-colors hover:border-primary/30 ${
                  query.priority === "high" || query.priority === "urgent" ? "border-red-500/30 bg-red-500/5" : "border-border/20"
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-blue-500/10 text-blue-500">
                        <GraduationCap className="h-5 w-5" />
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
                        <Badge variant={
                          query.priority === "high" || query.priority === "urgent" ? "destructive" : 
                          query.priority === "medium" ? "default" : "secondary"
                        }>
                          {query.priority}
                        </Badge>
                        <Badge variant={query.status === "pending" ? "outline" : query.status === "accepted" || query.status === "resolved" ? "default" : "destructive"}>
                          {query.status}
                        </Badge>
                      </div>
                      {query.status === "pending" && (
                        <div className="flex gap-1">
                          <Button size="sm" className="gap-1" onClick={() => setRespondingTo(respondingTo === query.id ? null : query.id)}>
                            <Send className="h-4 w-4" />
                            {respondingTo === query.id ? 'Cancel' : 'Respond'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  {respondingTo === query.id && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <Textarea 
                        placeholder="Enter your response (optional for reject)..." 
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        rows={3}
                      />
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="destructive" onClick={() => handleRespond(query.id, 'rejected')} disabled={submitting}>
                          <XCircle className="h-4 w-4 mr-1" /> Reject
                        </Button>
                        <Button size="sm" className="gap-1 bg-green-600 hover:bg-green-700" onClick={() => handleRespond(query.id, 'accepted')} disabled={submitting}>
                          <CheckCircle className="h-4 w-4" /> Accept
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleRespond(query.id, 'resolved')} disabled={submitting}>
                          <Star className="h-4 w-4 mr-1" /> Resolve
                        </Button>
                      </div>
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

function DepartmentOverviewTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Department Statistics" subtitle="Student and staff distribution">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentStats}>
              <XAxis dataKey="dept" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }} />
              <YAxis tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="students" name="Students" fill="hsl(168, 100%, 48%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="staff" name="Staff" fill="hsl(239, 84%, 67%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Attendance by Department" subtitle="Current semester average">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentStats} layout="vertical">
              <XAxis type="number" domain={[0, 100]} tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }} />
              <YAxis dataKey="dept" type="category" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }} width={100} />
              <Tooltip />
              <Bar dataKey="attendance" fill="hsl(142, 76%, 36%)" radius={[0, 4, 4, 0]}>
                {departmentStats.map((entry, index) => (
                  <Cell key={index} fill={entry.attendance >= 75 ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 60%)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Department Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left py-3 px-4">Department</th>
                  <th className="text-center py-3 px-4">Students</th>
                  <th className="text-center py-3 px-4">Staff</th>
                  <th className="text-center py-3 px-4">Attendance</th>
                  <th className="text-center py-3 px-4">Status</th>
                  <th className="text-center py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {departmentStats.map((dept, i) => (
                  <tr key={i} className="border-b border-border/20 hover:bg-muted/20">
                    <td className="py-3 px-4 font-medium">{dept.dept}</td>
                    <td className="text-center py-3 px-4">{dept.students}</td>
                    <td className="text-center py-3 px-4">{dept.staff}</td>
                    <td className="text-center py-3 px-4">
                      <span className={dept.attendance >= 75 ? 'text-green-500' : 'text-red-500'}>
                        {dept.attendance}%
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <Badge variant={dept.attendance >= 75 ? "default" : "destructive"}>
                        {dept.attendance >= 75 ? "Good" : "Alert"}
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

function ActivityLogTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>System-wide activity log</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-lg border border-border/20">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{activity.action}</p>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{activity.details}</p>
                  <p className="text-xs text-muted-foreground mt-1">By: {activity.user}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Bell className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
            <p className="text-2xl font-bold">24</p>
            <p className="text-sm text-muted-foreground">Notifications Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold">+15%</p>
            <p className="text-sm text-muted-foreground">System Activity</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Settings className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold">3</p>
            <p className="text-sm text-muted-foreground">Pending Approvals</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================

export default function AdminDashboard() {
  return (
    <DashboardLayout title="Admin Portal">
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-4 gap-2 h-auto p-1">
          <TabsTrigger value="overview" className="gap-1 text-xs">
            <TrendingUp className="h-3 w-3" /> Overview
          </TabsTrigger>
          <TabsTrigger value="queries" className="gap-1 text-xs">
            <MessageSquare className="h-3 w-3" /> Queries
          </TabsTrigger>
          <TabsTrigger value="departments" className="gap-1 text-xs">
            <Building className="h-3 w-3" /> Departments
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-1 text-xs">
            <FileText className="h-3 w-3" /> Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><OverviewTab /></TabsContent>
        <TabsContent value="queries"><QueryManagementTab /></TabsContent>
        <TabsContent value="departments"><DepartmentOverviewTab /></TabsContent>
        <TabsContent value="activity"><ActivityLogTab /></TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
