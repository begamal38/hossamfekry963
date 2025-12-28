import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

type AccessPredicate = (ctx: {
  hasRole: (role: "admin" | "assistant_teacher" | "student") => boolean;
  canAccessDashboard: () => boolean;
  rolesLoading: boolean;
}) => boolean;

interface RequireResolvedAccessProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allow?: AccessPredicate;
  timeoutMs?: number;
}

export function RequireResolvedAccess({
  children,
  requireAuth = true,
  allow,
  timeoutMs = 8000,
}: RequireResolvedAccessProps) {
  const location = useLocation();
  const { user, loading: authLoading, refreshSession } = useAuth();
  const {
    loading: rolesLoading,
    hasAttemptedFetch,
    hasRole,
    canAccessDashboard,
    refreshRoles,
    roles,
  } = useUserRole();

  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    setTimedOut(false);
    const id = window.setTimeout(() => setTimedOut(true), timeoutMs);
    return () => window.clearTimeout(id);
  }, [location.key, timeoutMs]);

  // STEP 1: Check if authentication is resolved
  const authResolved = !authLoading;

  // STEP 2: Check if roles are resolved (only matters if user is authenticated)
  // "Resolved" here means: we actually finished at least one fetch attempt AND we are no longer loading.
  // This prevents premature authorization decisions on slow networks / first login.
  const rolesResolved = useMemo(() => {
    if (!user) return true; // No user = no roles to load
    return hasAttemptedFetch && !rolesLoading;
  }, [user, rolesLoading, hasAttemptedFetch]);

  // STEP 3: Overall resolution - both auth and roles must be resolved
  const isFullyResolved = authResolved && rolesResolved;

  // STEP 4: Authorization check - ONLY after fully resolved
  // FAIL-SAFE: If role data is missing/undefined, ALLOW access (don't block)
  const isAllowed = useMemo(() => {
    // If not authenticated and auth is required, deny (will show login prompt)
    if (!user) return !requireAuth;

    // No predicate means allow all authenticated users
    if (!allow) return true;

    // FAIL-SAFE: If roles array is empty/missing after attempted fetch,
    // allow access and log the issue (don't block user)
    const rolesMissing = hasAttemptedFetch && roles.length === 0;
    if (rolesMissing) {
      console.warn('[Auth] User has no roles after fetch - allowing access as fail-safe');
      return true;
    }

    // Apply the predicate - pass rolesLoading=false since we're resolved
    return allow({ hasRole, canAccessDashboard, rolesLoading: false });
  }, [allow, canAccessDashboard, hasRole, requireAuth, user, hasAttemptedFetch, roles]);

  // STEP 5: Determine if we should show Access Denied
  // Access Denied is ONLY shown when ALL are true:
  // - Auth is confirmed
  // - Roles are fully resolved
  // - Authorization check explicitly failed
  // - Role is explicitly "student"
  const shouldShowAccessDenied = useMemo(() => {
    if (!isFullyResolved) return false; // Still loading (never deny)
    if (!user) return false; // Not authenticated (will show login prompt)
    if (isAllowed) return false; // Access is allowed

    // Staff should never see Access Denied.
    const isStaff = hasRole('admin') || hasRole('assistant_teacher');
    if (isStaff) {
      console.warn('[Auth] Staff user would have been denied - allowing as fail-safe');
      return false;
    }

    // STRICT: only students can be denied. If role is missing/unknown, allow (fail-safe).
    const isStudent = hasRole('student');
    if (!isStudent) {
      console.warn('[Auth] Role not resolved as student while deny was computed - allowing as fail-safe');
      return false;
    }

    return true;
  }, [isFullyResolved, user, isAllowed, hasRole]);

  const redirect = `${location.pathname}${location.search}`;

  // LOADING STATE: Show while auth or roles are still resolving
  if (!isFullyResolved) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <div className="min-w-0">
              <p className="font-semibold text-foreground">Loading your account…</p>
              <p className="text-sm text-muted-foreground">Please wait a moment.</p>
            </div>
          </div>

          {timedOut && (
            <div className="mt-5 space-y-3">
              <p className="text-sm text-muted-foreground">
                This is taking longer than expected.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={async () => {
                    await refreshSession?.();
                    await refreshRoles?.();
                    setTimedOut(false);
                  }}
                >
                  Retry
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/">Go to home</Link>
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // LOGIN PROMPT: Only after auth is resolved and user is not authenticated
  if (requireAuth && !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 space-y-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">Sign in required</h1>
            <p className="text-sm text-muted-foreground">
              Please sign in to continue.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to={`/auth?redirect=${encodeURIComponent(redirect)}`}>Sign in</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">Go to home</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ACCESS DENIED: Only for students with explicit access violations
  if (shouldShowAccessDenied) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 space-y-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">Access denied</h1>
            <p className="text-sm text-muted-foreground">
              Your account doesn't have permission to view this page.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link to="/">Go to home</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
