"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Eye, Star, TrendingUp, Activity } from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Label
} from "recharts";
import { motion } from "framer-motion";

const viewsData = [
  { month: "Jan", views: 400 },
  { month: "Feb", views: 600 },
  { month: "Mar", views: 800 },
  { month: "Apr", views: 1000 },
  { month: "Mei", views: 1200 },
  { month: "Jun", views: 1250 },
];

const engagementData = [
  { name: "Selesai", value: 78, color: "#10b981" },
  { name: "Dalam Progres", value: 15, color: "#f59e0b" },
  { name: "Belum Dimulai", value: 7, color: "#ef4444" },
];

const ratingData = [
  { rating: "5★", count: 45 },
  { rating: "4★", count: 32 },
  { rating: "3★", count: 15 },
  { rating: "2★", count: 6 },
  { rating: "1★", count: 2 },
];

const activityData = [
  { day: "Sen", activity: 85 },
  { day: "Sel", activity: 92 },
  { day: "Rab", activity: 78 },
  { day: "Kam", activity: 95 },
  { day: "Jum", activity: 88 },
  { day: "Sab", activity: 65 },
  { day: "Min", activity: 72 },
];

// helpers
const fmtNumber = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`);
const fmtPercent = (n: number) => `${n}%`;

export function GuruDashboardStatistics() {
  const [range] = useState<"6m" | "12m">("6m");

  const viewsSeries = useMemo(() => {
    if (range === "12m") {
      return [
        { month: "Jan", views: 400 },
        { month: "Feb", views: 600 },
        { month: "Mar", views: 800 },
        { month: "Apr", views: 1000 },
        { month: "Mei", views: 1200 },
        { month: "Jun", views: 1250 },
        { month: "Jul", views: 1320 },
        { month: "Agu", views: 1390 },
        { month: "Sep", views: 1460 },
        { month: "Okt", views: 1520 },
        { month: "Nov", views: 1600 },
        { month: "Des", views: 1710 },
      ];
    }
    return viewsData;
  }, [range]);

  const renderTooltip = (props: any) => {
    const { active, payload, label } = props || {};
    if (!active || !payload?.length) return null;
    const p = payload[0];
    return (
      <div className="rounded-md border bg-background/95 p-2 shadow-sm backdrop-blur text-xs">
        <div className="font-medium">{label}</div>
        <div className="text-muted-foreground">{p.value}</div>
      </div>
    );
  };

  const donutColors = engagementData.map((e) => e.color);

  const viewsDeltaPct = useMemo(() => {
    if (!viewsSeries?.length) return 0;
    const first = viewsSeries[0].views || 0;
    const last = viewsSeries[viewsSeries.length - 1].views || 0;
    if (first === 0) return 0;
    return Math.round(((last - first) / first) * 100);
  }, [viewsSeries]);

  const completedPct = useMemo(
    () => engagementData.find((e) => e.name === "Completed")?.value ?? 0,
    []
  );

  return (
    <div className="space-y-6">


      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-4">
        <StatsCard
          title="Total Tayangan"
          value={1250}
          description="Tayangan konten bulan ini"
          icon={<Eye className="h-4 w-4" />}
        />

        <StatsCard
          title="Rating Rata-rata"
          value={4.8}
          description="Kepuasan siswa"
          icon={<Star className="h-4 w-4" />}
        />

        <StatsCard
          title="Tingkat Penyelesaian"
          value="78%"
          description="Penyelesaian kursus"
          icon={<TrendingUp className="h-4 w-4" />}
        />

        <StatsCard
          title="Keterlibatan Siswa"
          value="92%"
          description="Partisipasi aktif"
          icon={<Activity className="h-4 w-4" />}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Views Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: 0.08 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Tayangan dari Waktu ke Waktu
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${viewsDeltaPct >= 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400"}`}>
                  {viewsDeltaPct >= 0 ? `+${viewsDeltaPct}%` : `${viewsDeltaPct}%`}
                </span>
              </CardTitle>
              <CardDescription>Tayangan konten bulanan</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={viewsSeries}>
                  <defs>
                    <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={fmtNumber} />
                  <RechartsTooltip content={renderTooltip} />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="#3b82f6"
                    fill="url(#viewsGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Completion Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status Penyelesaian</CardTitle>
            <CardDescription>Distribusi progres siswa • {completedPct}% selesai</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={engagementData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  innerRadius={50}
                  outerRadius={84}
                  dataKey="value"
                >
                  {engagementData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={donutColors[index % donutColors.length]} />
                  ))}
                  <Label value={`${completedPct}%`} position="center" fill="#10b981" fontSize={16} />
                </Pie>
                <Legend verticalAlign="bottom" height={24} />
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribusi Rating</CardTitle>
            <CardDescription>Detail rating siswa</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ratingData}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rating" />
                <YAxis tickFormatter={fmtNumber} />
                <RechartsTooltip />
                <Bar dataKey="count" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekly Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Aktivitas Mingguan</CardTitle>
            <CardDescription>Persentase keterlibatan harian</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis domain={[0, 100]} tickFormatter={(v) => fmtPercent(v)} />
                <RechartsTooltip />
                <Line
                  type="monotone"
                  dataKey="activity"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ fill: "#f59e0b", strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
