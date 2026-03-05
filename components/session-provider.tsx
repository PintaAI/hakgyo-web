"use client";

import { createContext, useContext, useMemo, ReactNode } from "react";
import { useSession as useBetterAuthSession } from "@/lib/auth-client";

type UserRole = "MURID" | "GURU" | "ADMIN";

interface ExtendedUser {
  role: UserRole;
  currentStreak: number;
  xp: number;
  level: number;
  email: string;
  name?: string;
  [key: string]: unknown;
}

interface SessionContextValue {
  session: ReturnType<typeof useBetterAuthSession>["data"];
  user: ExtendedUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: ReturnType<typeof useBetterAuthSession>["error"];
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const { data: session, isPending, error } = useBetterAuthSession();

  const user = useMemo(() => {
    if (!session?.user) return null;

    const rawUser = session.user as Record<string, unknown>;
    return {
      ...session.user,
      role: (rawUser.role as UserRole) || "MURID",
      currentStreak: (rawUser.currentStreak as number) || 0,
      xp: (rawUser.xp as number) || 0,
      level: (rawUser.level as number) || 1,
    } as ExtendedUser;
  }, [session]);

  const isAuthenticated = !!session;
  const isLoading = isPending;

  // Memoize the context value to prevent unnecessary re-renders
  // This ensures that child components only re-render when the session actually changes
  const value = useMemo(() => ({
    session,
    user,
    isAuthenticated,
    isLoading,
    error,
  }), [session, user, isAuthenticated, isLoading, error]);

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

/**
 * Hook to access session context
 * This deduplicates session requests across the component tree
 */
export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}

/**
 * Hook to check if user has specific role
 */
export function useRole(requiredRole: string) {
  const { user, isLoading } = useSession();

  return useMemo(() => ({
    hasRole: user?.role === requiredRole,
    isLoading,
    userRole: user?.role,
  }), [user?.role, requiredRole, isLoading]);
}

/**
 * Hook to require authentication (throws error if not authenticated)
 */
export function useRequireAuth() {
  const { session, isLoading, error } = useSession();

  if (!isLoading && !session) {
    throw new Error("Authentication required");
  }

  return { session, isLoading, error };
}

/**
 * Hook for user permissions and role-based access
 */
export function usePermissions() {
  const { user, isLoading } = useSession();

  const permissions = useMemo(() => {
    if (!user) return {
      canCreateCourse: false,
      canManageUsers: false,
      canAccessPremium: false,
      isGuru: false,
      isAdmin: false,
      isMurid: false,
    };

    const role = user.role;

    return {
      canCreateCourse: role === "GURU" || role === "ADMIN",
      canManageUsers: role === "ADMIN",
      canAccessPremium: role === "ADMIN",
      isGuru: role === "GURU",
      isAdmin: role === "ADMIN",
      isMurid: role === "MURID",
    };
  }, [user]);

  return useMemo(() => ({
    ...permissions,
    isLoading,
    user,
  }), [permissions, isLoading, user]);
}

/**
 * Get permissions from session data without hook
 */
export function getPermissions(user: ExtendedUser | null) {
  if (!user) return {
    canCreateCourse: false,
    canManageUsers: false,
    canAccessPremium: false,
    isGuru: false,
    isAdmin: false,
    isMurid: false,
  };

  const role = user.role;

  return {
    canCreateCourse: role === "GURU" || role === "ADMIN",
    canManageUsers: role === "ADMIN",
    canAccessPremium: role === "ADMIN",
    isGuru: role === "GURU",
    isAdmin: role === "ADMIN",
    isMurid: role === "MURID",
  };
}
