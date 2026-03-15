/**
 * ==========================================================
 * EDUNEXUS App Root Component
 * ==========================================================
 * 
 * Main entry point for the React application. Configures:
 * - React Query for server state management
 * - Authentication context provider
 * - React Router for client-side navigation
 * - Toast notifications (Toaster + Sonner)
 * - Tooltip provider for UI hints
 * 
 * Route Structure:
 * - /          → Redirect to /login
 * - /login     → Login page
 * - /admin     → Admin dashboard
 * - /student   → Student dashboard
 * - /staff     → Staff dashboard
 * - /club      → Club coordinator dashboard
 * - /exam      → Exam coordinator dashboard
 * - *          → 404 Not Found
 * 
 * ==========================================================
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";

// Page Components
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import NotFound from "./pages/NotFound";

// Protected Route Components (with role-based access control)
import {
  ProtectedAdminDashboard,
  ProtectedStudentDashboard,
  ProtectedStaffDashboard,
  ProtectedClubDashboard,
  ProtectedExamDashboard,
} from "./components/ProtectedRoutes";

// Initialize React Query client for data fetching/caching
const queryClient = new QueryClient();

/**
 * App Component
 * 
 * Wraps the application with necessary providers and defines routes.
 * Provider hierarchy (outer to inner):
 * 1. QueryClientProvider - React Query for API data
 * 2. AuthProvider - User authentication state
 * 3. TooltipProvider - shadcn/ui tooltips
 * 4. BrowserRouter - Client-side routing
 */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        {/* Toast notifications for user feedback */}
        <Toaster />
        <Sonner />
        
        {/* Application Routes */}
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            {/* Default redirect to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Authentication */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Role-specific Dashboards (Protected by RBAC) */}
            <Route path="/admin" element={<ProtectedAdminDashboard />} />
            <Route path="/student" element={<ProtectedStudentDashboard />} />
            <Route path="/staff" element={<ProtectedStaffDashboard />} />
            <Route path="/club" element={<ProtectedClubDashboard />} />
            <Route path="/exam" element={<ProtectedExamDashboard />} />
            
            {/* 404 Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
