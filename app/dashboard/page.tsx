import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminDashboard } from "../../components/dashboard/admin-dashboard";
import { GuruDashboard } from "../../components/dashboard/guru-dashboard";
import { getGuruDashboardData } from "../actions/dashboard/guru";
import { getAdminDashboardData } from "../actions/dashboard/admin";
import { getUserKelasList } from "../actions/kelas";
import { getSessionCached } from "../../lib/auth-actions";
import DashboardLoading from "./loading";

type UserRoles = "GURU" | "MURID" | "ADMIN";

interface DashboardUser {
  id: string;
  email: string;
  name?: string;
  role: UserRoles;
}

export default async function DashboardPage() {
  const session = await getSessionCached();

  // Session is guaranteed to exist due to middleware protection
  const user = session!.user as DashboardUser;

  // Only allow admin and guru roles access to this dashboard
  if (user.role === "ADMIN") {
    // Fetch real admin dashboard data
    try {
      const adminData = await getAdminDashboardData();
      return <AdminDashboard user={user} dashboardData={adminData} />;
    } catch (error) {
      console.error("Failed to fetch admin dashboard data:", error);
      // Fallback to component without data (will show loading or empty state)
      return <AdminDashboard user={user} />;
    }
  } else if (user.role === "GURU") {
    return (
      <Suspense fallback={<DashboardLoading />}>
        <GuruDashboardContent user={user} />
      </Suspense>
    );
  }

  // Redirect students to another page (they shouldn't access this dashboard)
  redirect("/");
}

// Separate async component for guru dashboard data fetching
async function GuruDashboardContent({ user }: { user: DashboardUser }) {
  // Fetch real guru dashboard data in parallel to avoid waterfall
  const [dashboardResult, classesResult] = await Promise.all([
    getGuruDashboardData(),
    getUserKelasList()
  ]);

  if (!dashboardResult.success) {
    // Fallback to empty data if fetch fails
    const emptyData = {
      stats: {
        totalClasses: 0,
        publishedClasses: 0,
        draftClasses: 0,
        totalStudents: 0,
        totalMateris: 0
      },
      recentClasses: [],
      classes: classesResult.success ? classesResult.data || [] : [],
      user
    };
    return <GuruDashboard {...emptyData} />;
  }

  return <GuruDashboard
    stats={dashboardResult.data!.stats}
    recentClasses={dashboardResult.data!.recentClasses}
    classes={classesResult.success ? classesResult.data || [] : []}
    user={user}
  />;
}
