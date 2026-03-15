/**
 * ==========================================================
 * EDUNEXUS Authentication Context
 * ==========================================================
 * 
 * This module provides centralized authentication state management
 * using React Context. It handles:
 * 
 * - User login/logout flows
 * - JWT token persistence (localStorage)
 * - Session validation on app startup
 * - Role-based access control helpers (HOC)
 * 
 * Architecture:
 * - AuthProvider wraps the entire app in App.tsx
 * - useAuth() hook provides auth state to any component
 * - withAuth() HOC protects routes based on user roles
 * 
 * Usage Examples:
 * ```tsx
 * // In a component
 * const { user, login, logout, isLoggedIn } = useAuth();
 * 
 * // Protected route
 * const ProtectedDashboard = withAuth(Dashboard, ['admin', 'staff']);
 * ```
 * 
 * ==========================================================
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, getUser, clearToken, isAuthenticated, User } from '@/lib/api';

/**
 * AuthContextType - Shape of the authentication context value
 * This interface defines all auth-related state and functions available
 * to components that consume the auth context.
 */
interface AuthContextType {
  user: User | null;           // Current logged-in user (null if not logged in)
  isLoading: boolean;          // True during login process
  isLoggedIn: boolean;         // Convenience flag for conditional rendering
  login: (email: string, password: string) => Promise<void>;  // Login function
  logout: () => void;          // Logout and clear session
  refreshUser: () => Promise<void>;  // Re-fetch user data from server
}

// Create context with undefined default (will be set by provider)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider - Context provider component
 * 
 * Wraps the app and provides authentication state to all children.
 * Handles initial session restoration from localStorage and validates
 * tokens with the backend on mount.
 * 
 * Key features:
 * - Synchronous initialization from localStorage (no loading flash)
 * - Background token validation (non-blocking)
 * - Automatic logout on token expiration
 * 
 * @param children - Child components to render
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  /**
   * User state - Initialize from localStorage synchronously
   * This prevents a loading flash on page refresh for logged-in users
   */
  const [user, setUser] = useState<User | null>(() => {
    // Initialize from localStorage synchronously
    try {
      return getUser();  // Returns cached user or null
    } catch {
      return null;
    }
  });
  
  // Loading state - only true during active login attempt
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Token Validation Effect
   * -----------------------
   * Validates the stored JWT token with the backend on mount.
   * Runs in the background (non-blocking) to avoid UI delays.
   * 
   * If token is invalid/expired:
   * - Clears localStorage
   * - Sets user to null
   * - User will be redirected to login on next protected route access
   */
  useEffect(() => {
    const validateToken = async () => {
      // Only validate if we have a token and cached user
      if (isAuthenticated() && user) {
        try {
          // Call /api/auth/me to validate token and get fresh user data
          const currentUser = await authApi.getCurrentUser();
          setUser(currentUser);  // Update with fresh data
        } catch (error) {
          // Token expired or invalid - silently clear session
          console.log('Token validation failed, clearing auth');
          clearToken();
          setUser(null);
        }
      }
    };

    // Don't block rendering, validate in background
    validateToken();
  }, []);  // Empty deps - only run on mount

  /**
   * login - Authenticate user with email and password
   * 
   * Calls the backend auth endpoint, stores JWT token, and updates user state.
   * On success, user is stored in both state and localStorage.
   * 
   * @param email - User's email address
   * @param password - User's password
   * @throws ApiError on authentication failure
   */
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Use JSON login endpoint (authApi.loginJson stores token & user)
      const response = await authApi.loginJson(email, password);
      setUser(response.user);  // Update React state
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * logout - Clear session and sign out user
   * 
   * Removes token from localStorage and clears user state.
   * Components should redirect to /login after calling this.
   */
  const logout = () => {
    authApi.logout();  // Clears localStorage
    setUser(null);     // Clear React state
  };

  /**
   * refreshUser - Fetch latest user data from server
   * 
   * Useful after profile updates or permission changes.
   * Logs out user if token is no longer valid.
   */
  const refreshUser = async () => {
    if (isAuthenticated()) {
      try {
        const currentUser = await authApi.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        logout();  // Token invalid, force logout
      }
    }
  };

  // Provide auth context value to children
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isLoggedIn: !!user,  // Convert user to boolean
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth - Hook to access authentication context
 * 
 * Must be used within an AuthProvider. Use this hook in any component
 * that needs access to auth state or functions.
 * 
 * @returns AuthContextType with user, login, logout, etc.
 * @throws Error if used outside AuthProvider
 * 
 * @example
 * function ProfileButton() {
 *   const { user, logout } = useAuth();
 *   return user ? <button onClick={logout}>Logout</button> : <Link to="/login">Login</Link>;
 * }
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * withAuth - Higher-Order Component for route protection
 * 
 * Wraps a component to enforce authentication and optionally role-based access.
 * Use this to protect dashboard pages from unauthorized access.
 * 
 * Features:
 * - Shows loading spinner during auth state resolution
 * - Redirects to /login if not authenticated
 * - Shows "Access Denied" if user lacks required role
 * 
 * @param WrappedComponent - Component to protect
 * @param allowedRoles - Optional array of roles that can access (e.g., ['admin', 'staff'])
 * @returns Protected component
 * 
 * @example
 * // Protect admin dashboard - only admins can access
 * const ProtectedAdminDashboard = withAuth(AdminDashboard, ['admin']);
 * 
 * // Protect student page - students and admins can access
 * const ProtectedStudentPage = withAuth(StudentPage, ['admin', 'student']);
 * 
 * // Any logged-in user can access
 * const ProtectedProfile = withAuth(ProfilePage);
 */
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  allowedRoles?: string[]
) {
  return function AuthenticatedComponent(props: P) {
    const { user, isLoading, isLoggedIn } = useAuth();

    // Show loading spinner while auth state is resolving
    if (isLoading) {
      return (
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
    }

    // Not logged in - redirect to login page
    if (!isLoggedIn) {
      window.location.href = '/login';
      return null;
    }

    // Check role-based access if roles are specified
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      return (
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
            <p className="text-muted-foreground mt-2">You don't have permission to view this page.</p>
          </div>
        </div>
      );
    }

    // User is authenticated and authorized - render the component
    return <WrappedComponent {...props} />;
  };
}
