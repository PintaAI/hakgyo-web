"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  RefreshCw, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  KeyRound,
  Users,
  Activity,
  UserX,
  RefreshCcw
} from "lucide-react";
import { 
  SessionInfo, 
  SessionStats, 
  getAllSessions, 
  getSessionStats, 
  findDuplicateTokens, 
  cleanupExpiredSessions,
  revokeSession,
  revokeUserSessions 
} from "@/app/actions/dashboard/admin";

type UserRoles = "GURU" | "MURID" | "ADMIN";

interface DashboardUser {
  id: string;
  email: string;
  name?: string;
  role: UserRoles;
}

interface SessionManagementContentProps {
  initialSessions: SessionInfo[];
  totalSessions: number;
  stats: SessionStats;
  duplicates: { token: string; count: number; sessions: SessionInfo[] }[];
  user?: DashboardUser;
}

export function SessionManagementContent({
  initialSessions,
  totalSessions,
  stats,
  duplicates,
}: Omit<SessionManagementContentProps, 'user'>) {
  const [sessions, setSessions] = useState<SessionInfo[]>(initialSessions);
  const [sessionStats, setSessionStats] = useState<SessionStats>(stats);
  const [sessionDuplicates, setSessionDuplicates] = useState(duplicates);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "EXPIRED" | "EXPIRING_SOON">("ALL");
  const [isLoading, setIsLoading] = useState(false);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const [sessionsData, newStats, newDuplicates] = await Promise.all([
        getAllSessions({ search: searchQuery, status: statusFilter, limit: 50 }),
        getSessionStats(),
        findDuplicateTokens()
      ]);
      setSessions(sessionsData.sessions);
      setSessionStats(newStats);
      setSessionDuplicates(newDuplicates);
    } catch (error) {
      console.error("Error loading sessions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanupExpired = async () => {
    setIsLoading(true);
    try {
      const result = await cleanupExpiredSessions();
      alert(`Cleaned up ${result.count} expired sessions`);
      await loadSessions();
    } catch (error) {
      console.error("Error cleaning up sessions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to revoke this session?")) return;
    
    try {
      await revokeSession(sessionId);
      await loadSessions();
    } catch (error) {
      console.error("Error revoking session:", error);
    }
  };

  const handleRevokeUserSessions = async (userId: string) => {
    if (!confirm("Are you sure you want to revoke ALL sessions for this user?")) return;
    
    try {
      const result = await revokeUserSessions(userId);
      alert(`Revoked ${result.count} sessions for this user`);
      await loadSessions();
    } catch (error) {
      console.error("Error revoking user sessions:", error);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString();
  };

  const getExpiryStatus = (session: SessionInfo) => {
    if (session.isExpired) {
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Expired</Badge>;
    }
    if (session.isExpiringSoon) {
      return <Badge variant="outline" className="gap-1 text-orange-500 border-orange-500"><Clock className="h-3 w-3" /> Expiring Soon</Badge>;
    }
    return <Badge variant="secondary" className="gap-1 bg-green-100 text-green-700 border-green-300"><CheckCircle className="h-3 w-3" /> Active</Badge>;
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Badge variant="default" className="bg-purple-500">Admin</Badge>;
      case "GURU":
        return <Badge variant="default" className="bg-blue-500">Guru</Badge>;
      default:
        return <Badge variant="outline">Murid</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Session Management</h1>
          <p className="text-muted-foreground">
            View active sessions, debug token issues, and manage user sessions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCleanupExpired} disabled={isLoading}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Cleanup Expired
          </Button>
          <Button variant="outline" onClick={loadSessions} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <p className="text-2xl font-bold">{sessionStats.totalSessions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Active</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{sessionStats.activeSessions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-muted-foreground">Expiring Soon</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">{sessionStats.expiringSoonSessions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserX className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Expired</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{sessionStats.expiredSessions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Unique Users</span>
            </div>
            <p className="text-2xl font-bold">{sessionStats.uniqueUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Duplicates</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{sessionDuplicates.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="sessions" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="sessions">All Sessions</TabsTrigger>
          <TabsTrigger value="duplicates" className="gap-1">
            Duplicate Tokens
            {sessionDuplicates.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                {sessionDuplicates.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Session List</CardTitle>
              <CardDescription>
                Showing {sessions.length} of {totalSessions} sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex gap-4 mb-4">
                <Input
                  placeholder="Search by name, email, or token..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
                <Select 
                  value={statusFilter} 
                  onValueChange={(v) => setStatusFilter(v as any)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Sessions</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="EXPIRING_SOON">Expiring Soon</SelectItem>
                    <SelectItem value="EXPIRED">Expired</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={loadSessions} disabled={isLoading}>
                  Apply Filters
                </Button>
              </div>

              {/* Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Token (first 20 chars)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{session.userName || "Unknown"}</p>
                          <p className="text-sm text-muted-foreground">{session.userEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(session.userRole)}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {session.token.substring(0, 20)}...
                      </TableCell>
                      <TableCell>{getExpiryStatus(session)}</TableCell>
                      <TableCell className="text-sm">{formatDate(session.expiresAt)}</TableCell>
                      <TableCell className="text-sm">{formatDate(session.createdAt)}</TableCell>
                      <TableCell className="text-sm">{session.ipAddress || "N/A"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevokeSession(session.id)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevokeUserSessions(session.userId)}
                            className="text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                            title="Revoke all user sessions"
                          >
                            <UserX className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {sessions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No sessions found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="duplicates">
          <Card>
            <CardHeader>
              <CardTitle>Duplicate Token Groups</CardTitle>
              <CardDescription>
                These token prefixes have multiple sessions associated with them
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sessionDuplicates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>No duplicate tokens found!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sessionDuplicates.map((group, index) => (
                    <Card key={index} className="border-yellow-200 bg-yellow-50">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            Token Group {index + 1}
                          </CardTitle>
                          <Badge variant="outline" className="bg-yellow-100">
                            {group.count} sessions
                          </Badge>
                        </div>
                        <CardDescription className="font-mono text-xs">
                          {group.token}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>User</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Expires</TableHead>
                              <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {group.sessions.map((session) => (
                              <TableRow key={session.id}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{session.userName || "Unknown"}</p>
                                    <p className="text-sm text-muted-foreground">{session.userEmail}</p>
                                  </div>
                                </TableCell>
                                <TableCell>{getRoleBadge(session.userRole)}</TableCell>
                                <TableCell>{getExpiryStatus(session)}</TableCell>
                                <TableCell className="text-sm">{formatDate(session.expiresAt)}</TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRevokeSession(session.id)}
                                    className="text-red-500 hover:text-red-600"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}