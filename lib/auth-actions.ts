import { auth } from "./auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

type UserRole = "MURID" | "GURU" | "ADMIN";
type UserTier = "FREE" | "PREMIUM" | "CUSTOM";





/**
 * Wrapper for server actions that require authentication
 */
export async function withAuth<T extends unknown[], R>(
  action: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const session = await auth.api.getSession({
      headers: await headers()
    });
    if (!session) {
      redirect("/auth");
    }
    return action(...args);
  };
}

/**
 * Wrapper for server actions that require specific role
 */
export async function withRole<T extends unknown[], R>(
  requiredRole: string,
  action: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const session = await auth.api.getSession({
      headers: await headers()
    });
    if (!session) {
      redirect("/auth");
    }
    
    const userRole = session.user.role as UserRole;
    if (userRole !== requiredRole) {
      throw new Error(`Access denied. Required role: ${requiredRole}`);
    }
    
    return action(...args);
  };
}

/**
 * Wrapper for server actions that require specific plan
 */
export async function withPlan<T extends unknown[], R>(
  requiredPlan: string,
  action: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const session = await auth.api.getSession({
      headers: await headers()
    });
    if (!session) {
      redirect("/auth");
    }
    
    const userPlan = (session.user as any).accessTier as UserTier;
    if (userPlan !== requiredPlan && userPlan !== "CUSTOM") {
      throw new Error(`Access denied. Required plan: ${requiredPlan}`);
    }
    
    return action(...args);
  };
}

/**
 * Example server actions demonstrating usage
 */

// Protected action that requires authentication
export const getUserProfile = withAuth(async () => {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  return {
    user: session!.user,
    message: "This is a protected action",
  };
});

// Action that requires GURU role
export const createCourse = withRole("GURU", async (title: string, description: string) => {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  
  // Your course creation logic here
  return {
    success: true,
    message: `Course "${title}" with description "${description}" created by ${session!.user.email}`,
  };
});

// Action that requires PREMIUM plan
export const accessPremiumFeature = withPlan("PREMIUM", async () => {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  
  // Your premium feature logic here
  return {
    success: true,
    message: `Premium feature accessed by ${session!.user.email}`,
  };
});

// Admin-only action
export const manageUsers = withRole("ADMIN", async () => {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  
  // Your user management logic here
  return {
    success: true,
    message: `User management accessed by ${session!.user.email}`,
  };
});

/**
 * Utility functions for common checks in server actions
 */

export async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  return session?.user || null;
}

/**
 * Cached session getter - deduplicates calls within the same server request
 * Using React's cache() ensures only one DB/network call per request lifecycle
 */
export const getSessionCached = cache(async () => {
  return auth.api.getSession({
    headers: await headers()
  });
});

export async function assertAuthenticated() {
  const session = await getSessionCached();
  if (!session) {
    throw new Error("Authentication required");
  }
  return session;
}

export async function assertRole(requiredRole: string) {
  const session = await assertAuthenticated();
  const userRole = session.user.role as UserRole;
  
  if (userRole !== requiredRole) {
    throw new Error(`Access denied. Required role: ${requiredRole}`);
  }
  
  return session;
}

export async function assertPlan(requiredPlan: string) {
  const session = await assertAuthenticated();
  const userPlan = (session.user as any).accessTier as UserTier;
  
  if (userPlan !== requiredPlan && userPlan !== "CUSTOM") {
    throw new Error(`Access denied. Required plan: ${requiredPlan}`);
  }
  
  return session;
}
