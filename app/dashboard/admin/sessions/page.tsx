import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSessionCached } from "@/lib/auth-actions";
import { getAllSessions, getSessionStats, findDuplicateTokens } from "@/app/actions/dashboard/admin";
import { SessionManagementContent } from "./session-content";

type UserRoles = "GURU" | "MURID" | "ADMIN";

interface DashboardUser {
  id: string;
  email: string;
  name?: string;
  role: UserRoles;
}

export default async function SessionManagementPage() {
  const session = await getSessionCached();
  
  if (!session) {
    redirect("/sign-in");
  }
  
  const user = session.user as DashboardUser;
  
  // Only allow admin role
  if (user.role !== "ADMIN") {
    redirect("/");
  }

  // Fetch initial data
  const [sessionsData, stats, duplicates] = await Promise.all([
    getAllSessions({ limit: 50 }),
    getSessionStats(),
    findDuplicateTokens()
  ]);

  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <SessionManagementContent
        initialSessions={sessionsData.sessions}
        totalSessions={sessionsData.total}
        stats={stats}
        duplicates={duplicates}
      />
    </Suspense>
  );
}