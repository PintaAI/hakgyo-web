import { UserRoles } from "@/lib/enums";
import { UserWithStats } from "./types";

export const getRoleBadgeVariant = (role: UserRoles) => {
  switch (role) {
    case "ADMIN":
      return "destructive";
    case "GURU":
      return "default";
    case "MURID":
      return "secondary";
    default:
      return "outline";
  }
};

export const formatDate = (date: Date) => {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const calculateUserStats = (users: UserWithStats[]) => {
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.isActive).length;
  const teachers = users.filter(u => u.role === "GURU").length;
  const students = users.filter(u => u.role === "MURID").length;
  const newUsersThisWeek = users.filter(u => 
    new Date(u.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;

  return {
    totalUsers,
    activeUsers,
    teachers,
    students,
    newUsersThisWeek,
  };
};

export const filterUsers = (
  users: UserWithStats[],
  searchTerm: string,
  roleFilter: UserRoles | "ALL",
  statusFilter: "ALL" | "ACTIVE" | "INACTIVE"
) => {
  return users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
    const matchesStatus = statusFilter === "ALL" || 
      (statusFilter === "ACTIVE" && user.isActive) ||
      (statusFilter === "INACTIVE" && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });
};

type SortField = "name" | "email" | "role" | "level" | "xp" | "createdAt";
type SortDirection = "asc" | "desc";

export const sortUsers = (
  users: UserWithStats[],
  sortField: SortField | null,
  sortDirection: SortDirection
) => {
  if (!sortField) return users;

  return [...users].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case "name":
        aValue = a.name?.toLowerCase() || "";
        bValue = b.name?.toLowerCase() || "";
        break;
      case "email":
        aValue = a.email.toLowerCase();
        bValue = b.email.toLowerCase();
        break;
      case "role":
        aValue = a.role;
        bValue = b.role;
        break;
      case "level":
        aValue = a.level;
        bValue = b.level;
        break;
      case "xp":
        aValue = a.xp;
        bValue = b.xp;
        break;
      case "createdAt":
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      default:
        return 0;
    }

    if (aValue < bValue) {
      return sortDirection === "asc" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortDirection === "asc" ? 1 : -1;
    }
    return 0;
  });
};
