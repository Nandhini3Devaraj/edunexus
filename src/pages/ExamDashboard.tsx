import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ChartCard } from "@/components/shared/ChartCard";
import { KPICard } from "@/components/shared/KPICard";
import { 
  ClipboardList, Users, Grid3X3, Printer,
  Brain, Shield, AlertTriangle, Accessibility, Zap,
  RefreshCw, Plus, Minus, Lock, Shuffle, BookOpen
} from "lucide-react";
import { useState, useCallback } from "react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger 
} from "@/components/ui/tooltip";
import { hallTicketsApi, smartSeatingApi } from "@/lib/api";
import type { 
  CoordinatorHallTicket,
  BulkHallTicketGenerationResponse,
  SmartSeatingManualRequest, SmartSeatingResult,
  SmartSeatingExamInput, SmartSeatingRoomInput,
  SmartSeatingStudentAllocation
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";


// ============================================================
// DEPARTMENT COLORS - Vibrant & Distinct
// ============================================================

const DEPT_COLORS: Record<string, { bg: string; text: string; border: string; dark: string }> = {
  "Computer Science": { bg: "bg-blue-500", text: "text-white", border: "border-blue-600", dark: "bg-blue-600" },
  "CSE": { bg: "bg-blue-500", text: "text-white", border: "border-blue-600", dark: "bg-blue-600" },
  "Electronics": { bg: "bg-emerald-500", text: "text-white", border: "border-emerald-600", dark: "bg-emerald-600" },
  "ECE": { bg: "bg-emerald-500", text: "text-white", border: "border-emerald-600", dark: "bg-emerald-600" },
  "Mechanical": { bg: "bg-orange-500", text: "text-white", border: "border-orange-600", dark: "bg-orange-600" },
  "ME": { bg: "bg-orange-500", text: "text-white", border: "border-orange-600", dark: "bg-orange-600" },
  "Civil": { bg: "bg-purple-500", text: "text-white", border: "border-purple-600", dark: "bg-purple-600" },
  "CE": { bg: "bg-purple-500", text: "text-white", border: "border-purple-600", dark: "bg-purple-600" },
  "Information Technology": { bg: "bg-pink-500", text: "text-white", border: "border-pink-600", dark: "bg-pink-600" },
  "IT": { bg: "bg-pink-500", text: "text-white", border: "border-pink-600", dark: "bg-pink-600" },
  "Electrical": { bg: "bg-amber-500", text: "text-white", border: "border-amber-600", dark: "bg-amber-600" },
  "EEE": { bg: "bg-amber-500", text: "text-white", border: "border-amber-600", dark: "bg-amber-600" },
};

function getDeptColor(dept: string) {
  const key = Object.keys(DEPT_COLORS).find(k => 
    k.toLowerCase() === dept.toLowerCase() || 
    k.toLowerCase() === dept.substring(0, 3).toLowerCase()
  );
  return DEPT_COLORS[key || ""] || { bg: "bg-slate-500", text: "text-white", border: "border-slate-600", dark: "bg-slate-600" };
}


// ============================================================
// ENHANCED SEATING GRID - Better Visibility
// ============================================================

function SeatingGrid({ 
  grid, 
  roomName,
  rows,
  columns
}: { 
  grid: (SmartSeatingStudentAllocation | null)[][];
  roomName: string;
  rows: number;
  columns: number;
}) {
  const [hoveredSeat, setHoveredSeat] = useState<string | null>(null);

  if (!grid || grid.length === 0) return null;

  const allocatedCount = grid.flat().filter(Boolean).length;
  const totalSeats = rows * columns;

  return (
    <div className="space-y-4">
      {/* Room Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Grid3X3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">{roomName}</h3>
            <p className="text-xs text-muted-foreground">{rows} rows × {columns} columns</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-sm font-semibold px-3 py-1">
          {allocatedCount} / {totalSeats} seats
        </Badge>
      </div>

      {/* Seating Grid */}
      <div className="rounded-2xl border-2 border-border/50 bg-gradient-to-b from-muted/30 to-muted/10 p-6 overflow-x-auto">
        {/* Blackboard */}
        <div className="mb-6 mx-auto max-w-md rounded-xl bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 py-3 text-center shadow-lg">
          <span className="text-sm font-bold uppercase tracking-[0.3em] text-slate-200">
            Blackboard
          </span>
        </div>

        {/* Grid */}
        <div className="space-y-2 inline-block min-w-fit">
          {grid.map((row, ri) => (
            <div key={ri} className="flex items-center gap-2">
              {/* Row Label */}
              <span className="flex items-center justify-center w-8 h-14 text-sm font-bold text-muted-foreground bg-muted/30 rounded-lg">
                {String.fromCharCode(65 + ri)}
              </span>
              
              {/* Seats */}
              <div className="flex gap-2">
                {row.map((seat, ci) => {
                  const seatId = `${roomName}-${ri}-${ci}`;
                  const isHovered = hoveredSeat === seatId;
                  
                  if (!seat) {
                    return (
                      <div
                        key={ci}
                        className="h-14 w-14 rounded-lg border-2 border-dashed border-border/30 bg-muted/20 flex items-center justify-center"
                      >
                        <span className="text-xs text-muted-foreground/50">{ci + 1}</span>
                      </div>
                    );
                  }

                  const colors = getDeptColor(seat.department);
                  
                  return (
                    <TooltipProvider key={ci} delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            onMouseEnter={() => setHoveredSeat(seatId)}
                            onMouseLeave={() => setHoveredSeat(null)}
                            className={cn(
                              "relative h-14 w-14 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all duration-200 shadow-md",
                              colors.bg, colors.text,
                              isHovered && "ring-4 ring-primary ring-offset-2 scale-110 z-20 shadow-xl",
                              seat.is_repeat_offender && "ring-2 ring-red-400",
                              seat.is_high_risk && !seat.is_repeat_offender && "ring-2 ring-amber-400",
                              seat.has_special_needs && "ring-2 ring-cyan-400"
                            )}
                          >
                            {/* Department Code - Large & Bold */}
                            <span className="text-sm font-black tracking-tight leading-none">
                              {seat.department.substring(0, 3).toUpperCase()}
                            </span>
                            {/* Roll Number */}
                            <span className="text-[10px] font-semibold opacity-90 leading-none mt-1">
                              {seat.roll_number.slice(-4)}
                            </span>
                            
                            {/* Flag Indicators */}
                            {seat.is_repeat_offender && (
                              <div className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 border-2 border-white flex items-center justify-center shadow-md">
                                <Lock className="h-3 w-3 text-white" />
                              </div>
                            )}
                            {seat.is_high_risk && !seat.is_repeat_offender && (
                              <div className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center shadow-md">
                                <AlertTriangle className="h-3 w-3 text-white" />
                              </div>
                            )}
                            {seat.has_special_needs && (
                              <div className="absolute -bottom-1.5 -right-1.5 h-5 w-5 rounded-full bg-cyan-500 border-2 border-white flex items-center justify-center shadow-md">
                                <Accessibility className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[220px] p-3">
                          <div className="space-y-2">
                            <p className="font-bold text-sm">{seat.name}</p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                              <span className="text-muted-foreground">Department:</span>
                              <span className="font-medium">{seat.department}</span>
                              <span className="text-muted-foreground">Roll No:</span>
                              <span className="font-mono font-medium">{seat.roll_number}</span>
                              <span className="text-muted-foreground">Seat:</span>
                              <span className="font-mono font-medium">{seat.bench}</span>
                              <span className="text-muted-foreground">Subject:</span>
                              <span className="font-medium">{seat.subject_code}</span>
                            </div>
                            {(seat.is_repeat_offender || seat.is_high_risk || seat.has_special_needs) && (
                              <div className="flex gap-1 flex-wrap pt-1 border-t border-border/50">
                                {seat.is_repeat_offender && <Badge variant="destructive" className="text-[10px]">Offender</Badge>}
                                {seat.is_high_risk && <Badge className="text-[10px] bg-amber-500">High Risk</Badge>}
                                {seat.has_special_needs && <Badge className="text-[10px] bg-cyan-500">Special Needs</Badge>}
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            </div>
          ))}
          
          {/* Column Numbers */}
          <div className="flex items-center gap-2 mt-2">
            <span className="w-8" />
            <div className="flex gap-2">
              {Array.from({ length: columns }).map((_, ci) => (
                <span key={ci} className="w-14 text-center text-xs font-medium text-muted-foreground">
                  {ci + 1}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// ============================================================
// SMART SEATING TAB
// ============================================================

function SmartSeatingTab() {
  // --- Exams ---
  const [exams, setExams] = useState<SmartSeatingExamInput[]>([
    { 
      subject_code: "MA201", 
      subject_name: "Mathematics-II", 
      departments: ["Computer Science", "Electronics", "Mechanical"],
      students_per_dept: { "Computer Science": 25, "Electronics": 20, "Mechanical": 15 }
    },
  ]);

  // --- Rooms ---
  const [rooms, setRooms] = useState<SmartSeatingRoomInput[]>([
    { id: "hall-a-101", name: "Hall A-101", rows: 8, columns: 8, has_cctv: true, ground_floor: true },
    { id: "hall-a-102", name: "Hall A-102", rows: 8, columns: 8, has_cctv: true, ground_floor: false },
  ]);

  // --- Constraints ---
  const [config, setConfig] = useState({
    mix_departments: true,
    separate_high_risk: true,
    isolate_offenders: true,
    prioritize_special_needs: true,
    separate_same_paper: true,
    buffer_seats: 1,
  });

  // --- Risk Percentages ---
  const [highRiskPct, setHighRiskPct] = useState(5);
  const [offenderPct, setOffenderPct] = useState(3);
  const [specialNeedsPct, setSpecialNeedsPct] = useState(2);

  // --- State ---
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [result, setResult] = useState<SmartSeatingResult | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalStudents = exams.reduce((sum, e) => 
    sum + Object.values(e.students_per_dept).reduce((a, b) => a + b, 0), 0
  );
  const totalSeats = rooms.reduce((sum, r) => sum + r.rows * r.columns, 0);

  // --- Handlers ---
  const addExam = () => {
    setExams([...exams, {
      subject_code: `SUB${exams.length + 1}01`,
      subject_name: "New Subject",
      departments: ["Computer Science"],
      students_per_dept: { "Computer Science": 20 }
    }]);
  };

  const removeExam = (index: number) => {
    if (exams.length > 1) {
      setExams(exams.filter((_, i) => i !== index));
    }
  };

  const updateExam = (index: number, field: keyof Pick<SmartSeatingExamInput, 'subject_code' | 'subject_name'>, value: string) => {
    const updated = [...exams];
    updated[index] = { ...updated[index], [field]: value };
    setExams(updated);
  };

  const updateExamDeptCount = (examIndex: number, dept: string, count: number) => {
    const updated = [...exams];
    updated[examIndex].students_per_dept[dept] = Math.max(0, count);
    setExams(updated);
  };

  const addDeptToExam = (examIndex: number, dept: string) => {
    const updated = [...exams];
    if (!updated[examIndex].departments.includes(dept)) {
      updated[examIndex].departments.push(dept);
      updated[examIndex].students_per_dept[dept] = 15;
    }
    setExams(updated);
  };

  const removeDeptFromExam = (examIndex: number, dept: string) => {
    const updated = [...exams];
    if (updated[examIndex].departments.length > 1) {
      updated[examIndex].departments = updated[examIndex].departments.filter(d => d !== dept);
      delete updated[examIndex].students_per_dept[dept];
    }
    setExams(updated);
  };

  const addRoom = () => {
    const num = rooms.length + 1;
    setRooms([...rooms, { 
      id: `hall-${num}`, 
      name: `Hall ${String.fromCharCode(64 + num)}-${100 + num}`, 
      rows: 6, 
      columns: 6, 
      has_cctv: true, 
      ground_floor: false 
    }]);
  };

  const removeRoom = (index: number) => {
    if (rooms.length > 1) {
      setRooms(rooms.filter((_, i) => i !== index));
    }
  };

  const updateRoom = (index: number, field: keyof SmartSeatingRoomInput, value: number | string | boolean) => {
    const updated = [...rooms];
    updated[index] = { ...updated[index], [field]: value } as SmartSeatingRoomInput;
    setRooms(updated);
  };

  const runOptimization = useCallback(async () => {
    setIsOptimizing(true);
    setError(null);
    setResult(null);
    
    try {
      const request: SmartSeatingManualRequest = {
        exams: exams,
        rooms: rooms,
        config: config,
        high_risk_pct: highRiskPct,
        offender_pct: offenderPct,
        special_needs_pct: specialNeedsPct,
      };

      const res = await smartSeatingApi.preview(request);
      setResult(res);
      
      // Select first room by default
      if (res.room_grids) {
        const roomNames = Object.keys(res.room_grids);
        if (roomNames.length > 0) setSelectedRoom(roomNames[0]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Optimization failed");
    } finally {
      setIsOptimizing(false);
    }
  }, [exams, rooms, config, highRiskPct, offenderPct, specialNeedsPct]);

  const availableDepts = ["Computer Science", "Electronics", "Mechanical", "Civil", "Information Technology", "Electrical"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Dynamic Smart Seating Optimizer
            </h2>
            <p className="text-sm text-muted-foreground">
              GA-powered exam-aware seating with subject & department separation
            </p>
          </div>
        </div>
        <Button 
          onClick={runOptimization} 
          disabled={isOptimizing || totalStudents === 0 || totalSeats < totalStudents}
          size="lg"
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg"
        >
          {isOptimizing ? (
            <>
              <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
              Optimizing...
            </>
          ) : (
            <>
              <Zap className="h-5 w-5 mr-2" />
              Generate Seating
            </>
          )}
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-6 p-4 rounded-xl bg-muted/30 border border-border/30">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-500" />
          <span className="font-bold text-lg">{totalStudents}</span>
          <span className="text-muted-foreground text-sm">students</span>
        </div>
        <div className="h-6 w-px bg-border" />
        <div className="flex items-center gap-2">
          <Grid3X3 className="h-5 w-5 text-emerald-500" />
          <span className="font-bold text-lg">{totalSeats}</span>
          <span className="text-muted-foreground text-sm">seats</span>
        </div>
        <div className="h-6 w-px bg-border" />
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-purple-500" />
          <span className="font-bold text-lg">{exams.length}</span>
          <span className="text-muted-foreground text-sm">exams</span>
        </div>
        <div className="flex-1" />
        <Badge 
          variant={totalSeats >= totalStudents ? "default" : "destructive"}
          className="text-sm px-4 py-1"
        >
          {totalSeats >= totalStudents ? "✓ Sufficient Capacity" : "✗ Need More Seats"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT: Control Panel (2 columns) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Exams Configuration */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-purple-500" /> Exam Configuration
                </CardTitle>
                <Button variant="outline" size="sm" onClick={addExam} className="h-8">
                  <Plus className="h-3 w-3 mr-1" /> Add Exam
                </Button>
              </div>
              <CardDescription className="text-xs">
                Configure exams with subjects and department enrollment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[300px] overflow-y-auto">
              {exams.map((exam, ei) => (
                <div key={ei} className="p-3 rounded-xl border border-border/50 bg-muted/20 space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      value={exam.subject_code}
                      onChange={(e) => updateExam(ei, "subject_code", e.target.value)}
                      placeholder="Code"
                      className="w-20 text-xs font-mono font-bold bg-background rounded px-2 py-1.5 border border-border/50"
                    />
                    <input
                      value={exam.subject_name}
                      onChange={(e) => updateExam(ei, "subject_name", e.target.value)}
                      placeholder="Subject Name"
                      className="flex-1 text-sm font-medium bg-background rounded px-2 py-1.5 border border-border/50"
                    />
                    <button onClick={() => removeExam(ei)} className="text-muted-foreground hover:text-destructive p-1">
                      <Minus className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {/* Departments in this exam */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {exam.departments.map((dept) => {
                        const colors = getDeptColor(dept);
                        return (
                          <div key={dept} className={cn("flex items-center gap-2 px-2 py-1 rounded-lg text-xs", colors.bg, colors.text)}>
                            <span className="font-bold">{dept.substring(0, 3).toUpperCase()}</span>
                            <input
                              type="number"
                              value={exam.students_per_dept[dept] || 0}
                              onChange={(e) => updateExamDeptCount(ei, dept, parseInt(e.target.value) || 0)}
                              className="w-12 text-center text-xs font-mono bg-white/20 rounded px-1 py-0.5 border-0"
                            />
                            <button onClick={() => removeDeptFromExam(ei, dept)} className="opacity-70 hover:opacity-100">
                              <Minus className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    {/* Add department dropdown */}
                    <select
                      onChange={(e) => { addDeptToExam(ei, e.target.value); e.target.value = ""; }}
                      className="text-xs bg-background rounded px-2 py-1 border border-border/50 text-muted-foreground"
                      value=""
                    >
                      <option value="">+ Add Department</option>
                      {availableDepts.filter(d => !exam.departments.includes(d)).map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Rooms Configuration */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Grid3X3 className="h-5 w-5 text-emerald-500" /> Exam Rooms
                </CardTitle>
                <Button variant="outline" size="sm" onClick={addRoom} className="h-8">
                  <Plus className="h-3 w-3 mr-1" /> Add Room
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {rooms.map((room, i) => (
                <div key={i} className="p-3 rounded-xl border border-border/50 bg-muted/20 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      value={room.name}
                      onChange={(e) => updateRoom(i, "name", e.target.value)}
                      className="flex-1 text-sm font-semibold bg-background rounded px-2 py-1.5 border border-border/50"
                    />
                    <Badge variant="secondary" className="text-xs">
                      {room.rows * room.columns} seats
                    </Badge>
                    <button onClick={() => removeRoom(i)} className="text-muted-foreground hover:text-destructive p-1">
                      <Minus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground w-10">Rows</Label>
                      <input
                        type="number"
                        value={room.rows}
                        onChange={(e) => updateRoom(i, "rows", Math.max(1, parseInt(e.target.value) || 0))}
                        className="flex-1 text-xs font-mono bg-background rounded px-2 py-1 border border-border/50"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground w-10">Cols</Label>
                      <input
                        type="number"
                        value={room.columns}
                        onChange={(e) => updateRoom(i, "columns", Math.max(1, parseInt(e.target.value) || 0))}
                        className="flex-1 text-xs font-mono bg-background rounded px-2 py-1 border border-border/50"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Seating Control Panel */}
          <Card className="border-emerald-200/50 dark:border-emerald-800/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-500" /> Seating Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Toggles */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Shuffle className="h-4 w-4 text-blue-500" />
                    <Label className="text-xs">Mix Depts</Label>
                  </div>
                  <Switch
                    checked={config.mix_departments}
                    onCheckedChange={(v) => setConfig({ ...config, mix_departments: v })}
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-purple-500" />
                    <Label className="text-xs">Sep. Papers</Label>
                  </div>
                  <Switch
                    checked={config.separate_same_paper}
                    onCheckedChange={(v) => setConfig({ ...config, separate_same_paper: v })}
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <Label className="text-xs">High Risk</Label>
                  </div>
                  <Switch
                    checked={config.separate_high_risk}
                    onCheckedChange={(v) => setConfig({ ...config, separate_high_risk: v })}
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-red-500" />
                    <Label className="text-xs">Isolate Off.</Label>
                  </div>
                  <Switch
                    checked={config.isolate_offenders}
                    onCheckedChange={(v) => setConfig({ ...config, isolate_offenders: v })}
                  />
                </div>
              </div>

              {/* Risk Percentages */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/30">
                <div className="text-center">
                  <Label className="text-[10px] text-amber-600">High Risk %</Label>
                  <input
                    type="number"
                    value={highRiskPct}
                    onChange={(e) => setHighRiskPct(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full text-center text-sm font-mono bg-amber-50 dark:bg-amber-950/30 rounded px-1 py-1 border border-amber-200 dark:border-amber-800"
                  />
                </div>
                <div className="text-center">
                  <Label className="text-[10px] text-red-600">Offenders %</Label>
                  <input
                    type="number"
                    value={offenderPct}
                    onChange={(e) => setOffenderPct(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full text-center text-sm font-mono bg-red-50 dark:bg-red-950/30 rounded px-1 py-1 border border-red-200 dark:border-red-800"
                  />
                </div>
                <div className="text-center">
                  <Label className="text-[10px] text-cyan-600">Special %</Label>
                  <input
                    type="number"
                    value={specialNeedsPct}
                    onChange={(e) => setSpecialNeedsPct(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full text-center text-sm font-mono bg-cyan-50 dark:bg-cyan-950/30 rounded px-1 py-1 border border-cyan-200 dark:border-cyan-800"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Seating Grid (3 columns) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Room Selector */}
          {result?.room_grids && Object.keys(result.room_grids).length > 1 && (
            <div className="flex items-center gap-2 flex-wrap">
              {Object.keys(result.room_grids).map((room) => (
                <Button
                  key={room}
                  variant={selectedRoom === room ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedRoom(room)}
                  className="text-sm"
                >
                  {room}
                </Button>
              ))}
            </div>
          )}

          {/* Seating Grid */}
          {result?.room_grids && selectedRoom && result.room_grids[selectedRoom] && (
            <SeatingGrid
              grid={result.room_grids[selectedRoom]}
              roomName={selectedRoom}
              rows={rooms.find(r => r.name === selectedRoom)?.rows || 8}
              columns={rooms.find(r => r.name === selectedRoom)?.columns || 8}
            />
          )}

          {/* Legend */}
          {result && (
            <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-muted/20 border border-border/30">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Legend:</span>
              {exams.flatMap(e => e.departments).filter((d, i, a) => a.indexOf(d) === i).map(dept => {
                const colors = getDeptColor(dept);
                return (
                  <div key={dept} className="flex items-center gap-2">
                    <div className={cn("h-5 w-5 rounded shadow", colors.bg)} />
                    <span className="text-xs font-medium">{dept}</span>
                  </div>
                );
              })}
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-red-500 flex items-center justify-center">
                  <Lock className="h-2.5 w-2.5 text-white" />
                </div>
                <span className="text-xs">Offender</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-amber-500 flex items-center justify-center">
                  <AlertTriangle className="h-2.5 w-2.5 text-white" />
                </div>
                <span className="text-xs">High Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-cyan-500 flex items-center justify-center">
                  <Accessibility className="h-2.5 w-2.5 text-white" />
                </div>
                <span className="text-xs">Special Needs</span>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!result && !isOptimizing && (
            <Card className="border-dashed border-2">
              <CardContent className="p-16 flex flex-col items-center justify-center text-center">
                <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/30 dark:to-teal-950/30 mb-6">
                  <Brain className="h-16 w-16 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Configure & Generate
                </h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                  Set up your exams with subjects and departments, configure rooms, then click 
                  <span className="font-semibold text-emerald-600"> "Generate Seating"</span> to create 
                  an AI-optimized arrangement.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {isOptimizing && (
            <Card>
              <CardContent className="p-16 flex flex-col items-center justify-center text-center">
                <RefreshCw className="h-16 w-16 text-emerald-500 animate-spin mb-6" />
                <h3 className="text-xl font-bold">Running Genetic Algorithm...</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Evolving optimal seating arrangement across 100 generations
                </p>
              </CardContent>
            </Card>
          )}

          {/* Error State */}
          {error && (
            <Card className="border-destructive">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                  <div>
                    <p className="font-semibold text-destructive">Optimization Failed</p>
                    <p className="text-sm text-muted-foreground mt-1">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}


// ============================================================
// MAIN DASHBOARD
// ============================================================

export default function ExamDashboard() {
  const [activeTab, setActiveTab] = useState<"create" | "seating" | "hallticket">("seating");
  const { toast } = useToast();
  const examOptions = [
    { id: 301, code: "CS301", name: "Data Structures", date: "2026-03-15" },
    { id: 201, code: "MA201", name: "Linear Algebra", date: "2026-03-18" },
    { id: 202, code: "EC202", name: "Signals", date: "2026-03-20" },
  ];
  const [selectedExamId, setSelectedExamId] = useState<number>(examOptions[0].id);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("All Departments");
  const [isGeneratingTickets, setIsGeneratingTickets] = useState(false);
  const [bulkSummary, setBulkSummary] = useState<BulkHallTicketGenerationResponse | null>(null);
  const [generatedTickets, setGeneratedTickets] = useState<CoordinatorHallTicket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);

  const loadGeneratedTickets = useCallback(async () => {
    setIsLoadingTickets(true);
    try {
      const response = await hallTicketsApi.getGeneratedTickets({
        exam_id: selectedExamId,
        department: selectedDepartment,
      });
      setGeneratedTickets(response.hall_tickets);
    } catch (error) {
      const description = error instanceof Error ? error.message : "Failed to fetch generated tickets";
      toast({
        title: "Load Failed",
        description,
        variant: "destructive",
      });
    } finally {
      setIsLoadingTickets(false);
    }
  }, [selectedExamId, selectedDepartment, toast]);

  useEffect(() => {
    if (activeTab !== "hallticket") return;
    loadGeneratedTickets();
  }, [activeTab, selectedExamId, selectedDepartment, loadGeneratedTickets]);

  const handleGenerateAllTickets = async () => {
    const selectedExam = examOptions.find((exam) => exam.id === selectedExamId);
    if (!selectedExam) {
      toast({
        title: "Error",
        description: "Please select a valid exam",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingTickets(true);
    try {
      const result = await hallTicketsApi.generateBulkTickets({
        exam_id: selectedExam.id,
        exam_name: `${selectedExam.code} - ${selectedExam.name}`,
        exam_date: selectedExam.date,
        department: selectedDepartment === "All Departments" ? undefined : selectedDepartment,
      });
      setBulkSummary(result);
      await loadGeneratedTickets();
      toast({
        title: "Hall Tickets Generated",
        description: `Generated ${result.generated_count} tickets (${result.existing_count} already existed).`,
      });
    } catch (error) {
      const description = error instanceof Error ? error.message : "Bulk hall ticket generation failed";
      toast({
        title: "Generation Failed",
        description,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingTickets(false);
    }
  };

  const completedTickets = bulkSummary ? bulkSummary.generated_count + bulkSummary.existing_count : 265;
  const totalStudents = bulkSummary?.total_students ?? 284;
  const progressPercent = totalStudents > 0 ? Math.min(100, Math.round((completedTickets / totalStudents) * 100)) : 0;

  const tabs = [
    { id: "create" as const, label: "Create Exam", icon: ClipboardList },
    { id: "seating" as const, label: "Smart Seating", icon: Grid3X3 },
    { id: "hallticket" as const, label: "Hall Tickets", icon: Printer },
  ];

  return (
    <DashboardLayout title="Exam Coordinator">
      {/* KPIs */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Active Exams" value={18} icon={ClipboardList} delay={0} />
        <KPICard title="Students Registered" value={2847} icon={Users} delay={100} />
        <KPICard title="Rooms Allocated" value={42} icon={Grid3X3} delay={200} />
        <KPICard title="Tickets Generated" value={2650} icon={Printer} delay={300} />
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border border-border/30 bg-muted/20 p-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "create" && (
        <ChartCard title="Create New Exam" subtitle="Configure exam parameters">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Subject Code</label>
              <input className="w-full rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none" placeholder="e.g. CS301" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Subject Name</label>
              <input className="w-full rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none" placeholder="e.g. Data Structures" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Date</label>
              <input type="date" className="w-full rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Duration (minutes)</label>
              <input type="number" className="w-full rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none" placeholder="180" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Max Marks</label>
              <input type="number" className="w-full rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none" placeholder="100" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Department</label>
              <select className="w-full rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none">
                <option>Computer Science</option>
                <option>Electronics</option>
                <option>Mechanical</option>
                <option>Civil</option>
              </select>
            </div>
          </div>
          <button className="mt-6 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90">
            Create Exam
          </button>
        </ChartCard>
      )}

      {activeTab === "seating" && <SmartSeatingTab />}

      {activeTab === "hallticket" && (
        <ChartCard title="Bulk Hall Ticket Generation" subtitle="Generate and distribute hall tickets">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Select Exam</label>
                <select
                  value={selectedExamId}
                  onChange={(event) => setSelectedExamId(Number(event.target.value))}
                  className="w-full rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none"
                >
                  {examOptions.map((exam) => (
                    <option key={exam.id} value={exam.id}>{`${exam.code} - ${exam.name} (${exam.date})`}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Department Filter</label>
                <select
                  value={selectedDepartment}
                  onChange={(event) => setSelectedDepartment(event.target.value)}
                  className="w-full rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none"
                >
                  <option>All Departments</option>
                  <option>Computer Science</option>
                  <option>Electronics</option>
                  <option>Mechanical</option>
                  <option>Civil</option>
                  <option>Information Technology</option>
                  <option>Electrical</option>
                </select>
              </div>
            </div>
            <div className="rounded-lg border border-border/20 bg-muted/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Ready to Generate</p>
                  <p className="text-xs text-muted-foreground">
                    {bulkSummary
                      ? `${bulkSummary.total_students} students considered • ${bulkSummary.skipped_ineligible} ineligible`
                      : "Generate hall tickets for eligible students"}
                  </p>
                </div>
                <button
                  onClick={handleGenerateAllTickets}
                  disabled={isGeneratingTickets}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Printer className="h-4 w-4" />
                  {isGeneratingTickets ? "Generating..." : "Generate All"}
                </button>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted/30">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressPercent}%` }} />
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">{completedTickets} / {totalStudents} generated or existing</p>
            </div>

            <div className="rounded-lg border border-border/20 bg-background p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Generated Hall Tickets</p>
                <Button variant="outline" size="sm" onClick={loadGeneratedTickets} disabled={isLoadingTickets}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingTickets ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>

              {generatedTickets.length === 0 ? (
                <p className="text-sm text-muted-foreground">No generated hall tickets found for the selected filters.</p>
              ) : (
                <div className="max-h-80 overflow-auto rounded-md border border-border/40">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-muted/40">
                      <tr>
                        <th className="px-3 py-2 font-medium">Student</th>
                        <th className="px-3 py-2 font-medium">Register No</th>
                        <th className="px-3 py-2 font-medium">Department</th>
                        <th className="px-3 py-2 font-medium">Ticket No</th>
                        <th className="px-3 py-2 font-medium">Generated At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {generatedTickets.map((ticket) => (
                        <tr key={ticket.id} className="border-t border-border/30">
                          <td className="px-3 py-2">{ticket.student_name}</td>
                          <td className="px-3 py-2 font-mono">{ticket.register_number || "N/A"}</td>
                          <td className="px-3 py-2">{ticket.department || "N/A"}</td>
                          <td className="px-3 py-2 font-mono">{ticket.ticket_number}</td>
                          <td className="px-3 py-2">{new Date(ticket.created_at || "").toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </ChartCard>
      )}
    </DashboardLayout>
  );
}
