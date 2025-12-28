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
    hasRole,
    canAccessDashboard,
    refreshRoles,
  } = useUserRole();

  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    setTimedOut(false);
    const id = window.setTimeout(() => setTimedOut(true), timeoutMs);
    return () => window.clearTimeout(id);
  }, [location.key, timeoutMs]);

  const isResolved = useMemo(() => {
    if (authLoading) return false;
    if (requireAuth && !user) return true; // resolved: unauthenticated
    if (!user) return true; // resolved: no user and auth not required
    return !rolesLoading;
  }, [authLoading, requireAuth, rolesLoading, user]);

  const isAllowed = useMemo(() => {
    if (!user) return !requireAuth;
    if (!allow) return true;
    return allow({ hasRole, canAccessDashboard, rolesLoading });
  }, [allow, canAccessDashboard, hasRole, requireAuth, rolesLoading, user]);

  const redirect = `${location.pathname}${location.search}`;

  if (!isResolved) {
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

  if (!isAllowed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 space-y-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">Access denied</h1>
            <p className="text-sm text-muted-foreground">
              Your account doesn’t have permission to view this page.
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
