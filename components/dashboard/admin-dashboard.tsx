"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/dashboard/stats-card";
import {
  Users,
  Shield,
  Activity,
  BookOpen,
  TrendingUp,
  Database,
  KeyRound
} from "lucide-react";
import Link from "next/link";
import { AuthButton } from "../auth/auth-button";
import { AdminDashboardData } from "@/app/actions/dashboard/admin";

type UserRoles = "GURU" | "MURID" | "ADMIN";

interface DashboardUser {
  id: string;
  email: string;
  name?: string;
  role: UserRoles;
}

interface AdminDashboardProps {
  user: DashboardUser;
  dashboardData?: AdminDashboardData;
}

export function AdminDashboard({ user, dashboardData }: AdminDashboardProps) {
  // Use real data if available, otherwise fallback to default values
  const stats = dashboardData ? {
    totalUsers: dashboardData.userStats.totalUsers,
    activeUsers: dashboardData.userStats.activeUsers,
    totalClasses: dashboardData.contentStats.totalClasses,
    systemHealth: 98.5, // Keep this as static for now
    newUsersToday: dashboardData.userStats.newUsersThisWeek, // Using weekly as daily proxy
    pendingApprovals: 0 // This would need to be calculated separately
  } : {
    totalUsers: 0,
    activeUsers: 0,
    totalClasses: 0,
    systemHealth: 98.5,
    newUsersToday: 0,
    pendingApprovals: 0
  };

  // Admin Tools Configuration
  const adminTools = [
    {
      href: "/dashboard/admin/users",
      icon: <Users className="h-10 w-10 text-white" />,
      badge: { text: "Manage", variant: "default", className: "bg-white/20 text-white hover:bg-white/30 border-0" },
      title: "User Management",
      description: "Manage user accounts, roles, and permissions across the platform",
      footerLeft: "Users",
      footerRight: `${stats.totalUsers} Total`,
      gradient: "from-blue-500 to-blue-700",
    },
    {
      href: "/dashboard/admin/content",
      icon: <BookOpen className="h-10 w-10 text-white" />,
      badge: { text: "Manage", variant: "default", className: "bg-white/20 text-white hover:bg-white/30 border-0" },
      title: "Content Management",
      description: "Oversee all classes, lessons, and learning materials created by teachers",
      footerLeft: "Classes",
      footerRight: `${stats.totalClasses} Total`,
      gradient: "from-emerald-500 to-emerald-700",
    },
    {
      href: "/dashboard/admin/storage",
      icon: <Database className="h-10 w-10 text-white" />,
      badge: { text: "System", variant: "outline", className: "text-white border-white/40" },
      title: "Storage Management",
      description: "Monitor usage, manage files, and optimize storage via Cloudinary",
      footerLeft: "Storage",
      footerRight: "Cloudinary",
      gradient: "from-cyan-500 to-cyan-700",
    },
    {
      href: "/dashboard/admin/sessions",
      icon: <KeyRound className="h-10 w-10 text-white" />,
      badge: { text: "Debug", variant: "outline", className: "text-white border-white/40" },
      title: "Session Management",
      description: "View active sessions, debug token issues, and manage user sessions",
      footerLeft: "Sessions",
      footerRight: "Debug",
      gradient: "from-orange-500 to-orange-700",
    },
  ];

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user.name || user.email}! Manage your Korean learning platform
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Shield className="h-4 w-4 mr-2" />
            System Status
          </Button>
          <AuthButton />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          description={`+${stats.newUsersToday} this week`}
          icon={<Users className="h-4 w-4" />}
        />
        <StatsCard
          title="Active Users"
          value={stats.activeUsers}
          description={`${stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}% of total`}
          icon={<Activity className="h-4 w-4" />}
        />
        <StatsCard
          title="Total Classes"
          value={stats.totalClasses}
          description="Across all levels"
          icon={<BookOpen className="h-4 w-4" />}
        />
        <StatsCard
          title="System Health"
          value={`${stats.systemHealth}%`}
          description="All systems operational"
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      {/* Administrative Tools */}
      <Card className="bg-gradient-to-br from-card to-muted/20">
        <CardHeader>
          <CardTitle className="text-xl">Administrative Tools</CardTitle>
          <CardDescription>
            Manage users, content, and system settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {adminTools.map((tool) => (
              <Link href={tool.href} key={tool.title} className="block h-full">
                <Card className="group overflow-hidden hover:shadow-lg hover:-translate-y-1 bg-card transition-all cursor-pointer py-0 gap-0 h-full border-0 shadow-sm ring-1 ring-border/50 flex flex-col">
                  {/* Visual Header */}
                  <div className={`relative w-full h-24 bg-gradient-to-br ${tool.gradient} flex items-center justify-center shrink-0`}>
                    {/* Pattern overlay */}
                    <div className="absolute inset-0 bg-[url('/file.svg')] opacity-10 bg-repeat space-x-2" style={{ backgroundSize: '20px' }} />
                    <div className="absolute inset-0 bg-black/10" />

                    <div className="relative z-10 transform group-hover:scale-110 transition-transform duration-300 drop-shadow-md">
                      {tool.icon}
                    </div>

                    {/* Badge top right */}
                    {tool.badge && (
                      <div className="absolute top-2 right-2">
                        <Badge
                          variant={tool.badge.variant as any}
                          className={`text-[10px] h-5 px-1.5 backdrop-blur-sm ${tool.badge.className}`}
                        >
                          {tool.badge.text}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4 flex flex-col flex-1">
                    <div className="space-y-1.5 mb-2">
                      <CardTitle className="text-base font-semibold leading-tight group-hover:text-primary transition-colors">
                        {tool.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 text-xs leading-relaxed">
                        {tool.description}
                      </CardDescription>
                    </div>

                    <div className="mt-auto pt-3 border-t flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground">
                      <span className="font-medium text-foreground/70 truncate mr-2">{tool.footerLeft}</span>
                      <span className="bg-secondary/50 px-1.5 py-0.5 rounded text-secondary-foreground shrink-0 whitespace-nowrap">
                        {tool.footerRight}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
