import { UserRoles } from "@/app/generated/prisma/client";

export interface UserWithStats {
  id: string;
  email: string;
  name: string | null;
  role: UserRoles;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  currentStreak: number;
  xp: number;
  level: number;
  // Calculated fields
  isActive: boolean;
  lastLoginAt?: Date;
  totalPosts: number;
  totalClasses: number;
}

export interface UserManagementData {
  users: UserWithStats[];
  totalUsers: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  databaseStats: DatabaseUserStats;
}

export interface UserFormData {
  name: string;
  email: string;
  role: UserRoles;
}

export interface UserFilters {
  searchTerm: string;
  roleFilter: UserRoles | "ALL";
  statusFilter: "ALL" | "ACTIVE" | "INACTIVE";
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  teachers: number;
  students: number;
  newUsersThisWeek: number;
}

export interface DatabaseUserStats {
  totalUsers: number;
  activeUsers: number;
  teacherCount: number;
  studentCount: number;
  adminCount: number;
  newUsersThisWeek: number;
  verifiedUsers: number;
}
