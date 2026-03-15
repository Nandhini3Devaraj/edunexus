/**
 * ==========================================================
 * EDUNEXUS Login Page
 * ==========================================================
 * 
 * User authentication page with role-based redirect.
 * After successful login, users are redirected to their role-specific dashboard:
 * 
 * - admin         → /admin
 * - student       → /student
 * - staff         → /staff
 * - club_coordinator  → /club
 * - exam_coordinator  → /exam
 * 
 * Features:
 * - Modern glassmorphism UI design
 * - Form validation with error feedback
 * - Loading state during authentication
 * - Demo account information display
 * 
 * Prerequisites:
 * - Users must register first via /register or Swagger (/api/docs)
 * - Backend must be running on localhost:8000
 * 
 * ==========================================================
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getUser, clearToken } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GraduationCap, Loader2, AlertCircle, Shield, User, Users, Calendar, ClipboardList } from 'lucide-react';

const loginIdentifierMeta: Record<string, { label: string; placeholder: string }> = {
  admin: { label: 'Email', placeholder: 'admin@example.com' },
  student: { label: 'Email or Register Number', placeholder: 'you@example.com or REG2026001' },
  staff: { label: 'Email or Staff ID', placeholder: 'you@example.com or STF1023' },
  club_coordinator: { label: 'Email or Club Coordinator ID', placeholder: 'you@example.com or CLUB204' },
  exam_coordinator: { label: 'Email or Exam Coordinator ID', placeholder: 'you@example.com or EXAM330' },
};

/**
 * LoginPage Component
 * 
 * Renders the login form and handles authentication flow.
 * Uses shadcn/ui components for consistent styling.
 */
export default function LoginPage() {
  // Form state
  const [identifier, setIdentifier] = useState('');       // Email or register number value
  const [password, setPassword] = useState(''); // Password input value
  const [selectedRole, setSelectedRole] = useState<string | null>(null); // Selected role for login
  const [error, setError] = useState('');       // Error message to display
  const [isLoading, setIsLoading] = useState(false);  // Loading state for submit button
  
  // Auth context and navigation
  const { login } = useAuth();      // Login function from auth context
  const navigate = useNavigate();   // React Router navigation

  // Role options with icons and descriptions
  const roles = [
    { id: 'admin', name: 'Admin', icon: Shield, description: 'Full system access', color: 'text-red-500' },
    { id: 'student', name: 'Student', icon: User, description: 'View grades & attendance', color: 'text-blue-500' },
    { id: 'staff', name: 'Staff', icon: Users, description: 'Manage courses', color: 'text-green-500' },
    { id: 'club_coordinator', name: 'Club Coordinator', icon: Calendar, description: 'Manage events', color: 'text-purple-500' },
    { id: 'exam_coordinator', name: 'Exam Coordinator', icon: ClipboardList, description: 'Manage exams', color: 'text-orange-500' },
  ];

  /**
   * handleSubmit - Process login form submission
   * 
   * Flow:
   * 1. Prevent default form behavior
   * 2. Clear any previous errors
   * 3. Call auth context login function
   * 4. On success: Parse user role and redirect to appropriate dashboard
   * 5. On failure: Display error message
   * 
   * @param e - Form submit event
   */
  const identifierConfig = loginIdentifierMeta[selectedRole || 'student'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();  // Prevent page reload
    setError('');        // Clear previous errors

    if (!selectedRole) {
      setError('Please select a role to login as');
      return;
    }

    setIsLoading(true);  // Show loading state

    try {
      // Attempt login via auth context
      await login(identifier, password);
      
      // Read user via centralized API helpers so key names stay consistent.
      const user = getUser();
      if (user) {
        
        // Verify user role matches selected role
        if (user.role !== selectedRole) {
          setError(`You are registered as ${user.role}, not ${selectedRole}. Please select the correct role.`);
          // Clear auth session since role doesn't match selected portal.
          clearToken();
          setIsLoading(false);
          return;
        }
        
        // Role-based redirect mapping
        // Each role has a dedicated dashboard with role-specific features
        switch (user.role) {
          case 'admin':
            navigate('/admin');    // Full system access
            break;
          case 'student':
            navigate('/student');  // Grades, hall tickets, schedules
            break;
          case 'staff':
            navigate('/staff');    // Course management, attendance
            break;
          case 'club_coordinator':
            navigate('/club');     // Event proposals, approvals
            break;
          case 'exam_coordinator':
            navigate('/exam');     // Exam scheduling, seating
            break;
          default:
            navigate('/');         // Fallback to home
        }
      } else {
        navigate('/');
      }
    } catch (err: any) {
      // Display error message from API or generic message
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);  // Reset loading state
    }
  };

  // If no role selected, show role selection screen
  if (!selectedRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <Card className="w-full max-w-lg relative backdrop-blur-sm bg-card/95 border-border/50">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                EDUNEXUS
              </CardTitle>
              <CardDescription className="mt-2">
                Select your role to continue
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className="w-full flex items-center gap-4 p-4 rounded-lg border border-border/30 hover:border-primary/50 hover:bg-primary/5 transition-all group"
              >
                <div className={`p-2 rounded-lg bg-muted/50 ${role.color}`}>
                  <role.icon className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                    Login as {role.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{role.description}</p>
                </div>
              </button>
            ))}
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <p className="text-xs text-center text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:underline">
                Register here
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // ==========================================================
  // RENDER: Login Page UI
  // ==========================================================
  // Uses glassmorphism design with gradient background decorations.
  // Card contains: logo, title, form, error display, and demo info.
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      {/* Background decoration - Gradient blurred circles for visual appeal */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Login Card - Glass effect with backdrop blur */}
      <Card className="w-full max-w-md relative backdrop-blur-sm bg-card/95 border-border/50">
        {/* Card Header - Logo and branding */}
        <CardHeader className="space-y-4 text-center">
          {/* App Icon */}
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
          {/* App Name and Tagline */}
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              EDUNEXUS
            </CardTitle>
            <CardDescription className="mt-2">
              Login as {roles.find(r => r.id === selectedRole)?.name}
            </CardDescription>
            <button
              onClick={() => setSelectedRole(null)}
              className="mt-2 text-xs text-primary hover:underline"
            >
              ← Change role
            </button>
          </div>
        </CardHeader>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Error Alert - Shows on authentication failure */}
            {error && (
              <Alert variant="destructive" className="animate-in fade-in-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Role-aware identifier input field */}
            <div className="space-y-2">
              <Label htmlFor="identifier">{identifierConfig.label}</Label>
              <Input
                id="identifier"
                type="text"
                placeholder={identifierConfig.placeholder}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                disabled={isLoading}
                className="bg-background/50"
              />
            </div>

            {/* Password Input Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="bg-background/50"
              />
            </div>
          </CardContent>

          {/* Form Footer - Submit button and register link */}
          <CardFooter className="flex flex-col space-y-4">
            {/* Submit Button - Shows loading spinner during auth */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            {/* Registration Link */}
            <p className="text-xs text-center text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:underline">
                Register here
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
