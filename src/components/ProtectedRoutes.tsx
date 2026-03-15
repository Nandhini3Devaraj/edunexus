/**
 * Protected Route Components
 * These components wrap dashboards with role-based access control
 */

import { withAuth } from '@/hooks/useAuth';
import AdminDashboard from '@/pages/AdminDashboard';
import StudentDashboard from '@/pages/StudentDashboard';
import StaffDashboard from '@/pages/StaffDashboard';
import ClubDashboard from '@/pages/ClubDashboard';
import ExamDashboard from '@/pages/ExamDashboard';

// Admin Dashboard - Only admins can access
export const ProtectedAdminDashboard = withAuth(AdminDashboard, ['admin']);

// Student Dashboard - Only students can access  
export const ProtectedStudentDashboard = withAuth(StudentDashboard, ['student']);

// Staff Dashboard - Only staff can access
export const ProtectedStaffDashboard = withAuth(StaffDashboard, ['staff']);

// Club Dashboard - Only club coordinators can access
export const ProtectedClubDashboard = withAuth(ClubDashboard, ['club_coordinator']);

// Exam Dashboard - Only exam coordinators can access
export const ProtectedExamDashboard = withAuth(ExamDashboard, ['exam_coordinator']);
