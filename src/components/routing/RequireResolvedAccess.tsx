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

/**
 * CRITICAL AUTH STABILITY COMPONENT
 * 
 * Rules:
 * 1. Authentication success = user is allowed to enter (max 3s wait)
 * 2. Profile/role loading does NOT block UI rendering
 * 3. Roles load asynchronously after auth completes
 * 4. Never show "Access Denied" during loading
 */
export function RequireResolvedAccess({
  children,
  requireAuth = true,
  allow,
  timeoutMs = 3000, // Reduced from 8s to 3s per requirements
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
  const [forceUnblock, setForceUnblock] = useState(false);

  // Reset states on route change
  useEffect(() => {
    setTimedOut(false);
    setForceUnblock(false);
  }, [location.key]);

  // CRITICAL: Force unblock after timeout - user MUST enter platform
  useEffect(() => {
    if (!authLoading && user) {
      // User is authenticated - start the unblock timer
      const unblockTimer = window.setTimeout(() => {
        setForceUnblock(true);
      }, timeoutMs);
      
      return () => window.clearTimeout(unblockTimer);
    }
  }, [authLoading, user, timeoutMs, location.key]);

  // Separate timer for showing "taking longer" message
  useEffect(() => {
    const timeoutTimer = window.setTimeout(() => setTimedOut(true), timeoutMs);
    return () => window.clearTimeout(timeoutTimer);
  }, [location.key, timeoutMs]);

  // STEP 1: Check if authentication is resolved
  const authResolved = !authLoading;

  // STEP 2: Roles resolution check
  // CRITICAL CHANGE: If forceUnblock is true, consider roles resolved regardless of actual state
  const rolesResolved = useMemo(() => {
    if (forceUnblock) return true; // Force resolution after timeout
    if (!user) return true; // No user = no roles to load
    return hasAttemptedFetch && !rolesLoading;
  }, [user, rolesLoading, hasAttemptedFetch, forceUnblock]);

  // STEP 3: Overall resolution
  // CRITICAL: If auth is done AND (roles resolved OR forceUnblock), let user through
  const isFullyResolved = authResolved && rolesResolved;

  // STEP 4: Authorization check - ONLY after fully resolved
  // FAIL-SAFE: If role data is missing/undefined, ALLOW access (don't block)
  const isAllowed = useMemo(() => {
    if (!user) return !requireAuth;
    if (!allow) return true;

    // FAIL-SAFE: If roles are missing/empty after force unblock, allow access
    if (forceUnblock && roles.length === 0) {
      console.warn('[Auth] Force unblock active with no roles - allowing access');
      return true;
    }

    // FAIL-SAFE: If roles array is empty/missing after attempted fetch, allow access
    const rolesMissing = hasAttemptedFetch && roles.length === 0;
    if (rolesMissing) {
      console.warn('[Auth] User has no roles after fetch - allowing access as fail-safe');
      return true;
    }

    return allow({ hasRole, canAccessDashboard, rolesLoading: false });
  }, [allow, canAccessDashboard, hasRole, requireAuth, user, hasAttemptedFetch, roles, forceUnblock]);

  // STEP 5: Access Denied logic
  // NEVER show during loading or force unblock
  const shouldShowAccessDenied = useMemo(() => {
    if (!isFullyResolved) return false;
    if (forceUnblock) return false; // Never deny during force unblock
    if (!user) return false;
    if (isAllowed) return false;

    // Staff should never see Access Denied
    const isStaff = hasRole('admin') || hasRole('assistant_teacher');
    if (isStaff) {
      console.warn('[Auth] Staff user would have been denied - allowing as fail-safe');
      return false;
    }

    // STRICT: only students can be denied
    const isStudent = hasRole('student');
    if (!isStudent) {
      console.warn('[Auth] Role not resolved as student while deny was computed - allowing as fail-safe');
      return false;
    }

    return true;
  }, [isFullyResolved, user, isAllowed, hasRole, forceUnblock]);

  const redirect = `${location.pathname}${location.search}`;

  // LOADING STATE: Only show while auth is loading (NOT for roles)
  // CRITICAL: Once auth is done, if user exists, unblock within timeout
  if (!authResolved) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
        <Card className="w-full max-w-md p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <div className="min-w-0">
              <p className="font-semibold text-foreground">جاري تحميل حسابك...</p>
              <p className="text-sm text-muted-foreground">يرجى الانتظار لحظة</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // AUTH RESOLVED BUT ROLES STILL LOADING (and not yet force-unblocked)
  // Show a brief loader but it WILL auto-resolve via forceUnblock
  if (user && !rolesResolved && !forceUnblock) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
        <Card className="w-full max-w-md p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <div className="min-w-0">
              <p className="font-semibold text-foreground">جاري تحميل حسابك...</p>
              <p className="text-sm text-muted-foreground">يرجى الانتظار لحظة</p>
            </div>
          </div>

          {timedOut && (
            <div className="mt-5 space-y-3">
              <p className="text-sm text-muted-foreground">
                يستغرق الأمر وقتاً أطول من المتوقع
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={async () => {
                    await refreshSession?.();
                    await refreshRoles?.();
                    setTimedOut(false);
                    setForceUnblock(true); // Force entry on retry
                  }}
                >
                  إعادة المحاولة
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/">الرئيسية</Link>
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
        <Card className="w-full max-w-md p-6 space-y-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">يجب تسجيل الدخول</h1>
            <p className="text-sm text-muted-foreground">
              يرجى تسجيل الدخول للمتابعة
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to={`/auth?redirect=${encodeURIComponent(redirect)}`}>تسجيل الدخول</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">الرئيسية</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ACCESS DENIED: Only for students with explicit access violations (never during force unblock)
  if (shouldShowAccessDenied) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
        <Card className="w-full max-w-md p-6 space-y-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">غير مصرح بالدخول</h1>
            <p className="text-sm text-muted-foreground">
              حسابك لا يملك صلاحية الوصول لهذه الصفحة
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link to="/">الرئيسية</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
