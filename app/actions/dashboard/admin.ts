"use server";

import { prisma } from "@/lib/db";
import { UserRoles } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { daysAgo, weeksAgo, isWithinDays, formatRelativeTime } from "@/lib/utils";

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

export interface UserFilters {
  search?: string;
  role?: UserRoles | "ALL";
  status?: "ALL" | "ACTIVE" | "INACTIVE";
  page?: number;
  limit?: number;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  teacherCount: number;
  studentCount: number;
  adminCount: number;
  newUsersThisWeek: number;
  verifiedUsers: number;
}

// Get all users with pagination and filtering
export async function getAllUsers(filters: UserFilters = {}) {
  try {
    const {
      search = "",
      role = "ALL",
      status = "ALL", 
      page = 1,
      limit = 10
    } = filters;

    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {};

    // Search filter
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } }
      ];
    }

    // Role filter
    if (role !== "ALL") {
      whereClause.role = role;
    }

    // Status filter (moved to database level for correct pagination)
    if (status === "ACTIVE") {
      whereClause.sessions = {
        some: {
          createdAt: {
            gte: daysAgo(30)
          }
        }
      };
    } else if (status === "INACTIVE") {
      whereClause.OR = [
        // Users with no sessions
        {
          sessions: {
            none: {}
          }
        },
        // Users with sessions but none within 30 days
        {
          sessions: {
            every: {
              createdAt: {
                lt: daysAgo(30)
              }
            }
          }
        }
      ];
    }

    // Run queries in parallel for better performance
    const [users, totalUsers] = await Promise.all([
      // Get users with related data - optimize sessions to only select createdAt
      prisma.user.findMany({
        where: whereClause,
        include: {
          sessions: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { createdAt: true }
          },
          _count: {
            select: {
              authoredPosts: true,
              authoredKelas: true,
              sessions: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      
      // Get total count for pagination (now includes status filtering)
      prisma.user.count({
        where: whereClause
      })
    ]);

    // Transform data to include calculated fields
    const usersWithStats: UserWithStats[] = users.map(user => {
      const lastSession = user.sessions[0];
      const isActive = lastSession 
        ? isWithinDays(lastSession.createdAt, 30) // Active if logged in within 30 days
        : false;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
        image: user.image,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        currentStreak: user.currentStreak,
        xp: user.xp,
        level: user.level,
        isActive, // Always reflects actual activity state
        lastLoginAt: lastSession?.createdAt,
        totalPosts: user._count.authoredPosts,
        totalClasses: user._count.authoredKelas
      };
    });

    return {
      users: usersWithStats,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
      hasNextPage: page < Math.ceil(totalUsers / limit),
      hasPrevPage: page > 1
    };

  } catch (error) {
    console.error("Error fetching users:", error);
    throw new Error("Failed to fetch users");
  }
}

// Get user statistics
export async function getUserStats(): Promise<UserStats> {
  try {
    const [
      totalUsers,
      roleStats,
      verifiedUsers,
      newUsersThisWeek,
      activeUsers
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // Role statistics
      prisma.user.groupBy({
        by: ["role"],
        _count: true
      }),
      
      // Verified users
      prisma.user.count({
        where: { emailVerified: true }
      }),
      
      // New users this week
      prisma.user.count({
        where: {
          createdAt: {
            gte: weeksAgo(1)
          }
        }
      }),
      
      // Active users (logged in within 30 days)
      prisma.user.count({
        where: {
          sessions: {
            some: {
              createdAt: {
                gte: daysAgo(30)
              }
            }
          }
        }
      })
    ]);

    // Process role stats
    const roleStatsMap = roleStats.reduce((acc, stat) => {
      acc[stat.role] = stat._count;
      return acc;
    }, {} as Record<UserRoles, number>);

    return {
      totalUsers,
      activeUsers,
      teacherCount: roleStatsMap.GURU || 0,
      studentCount: roleStatsMap.MURID || 0,
      adminCount: roleStatsMap.ADMIN || 0,
      newUsersThisWeek,
      verifiedUsers
    };

  } catch (error) {
    console.error("Error fetching user stats:", error);
    throw new Error("Failed to fetch user statistics");
  }
}

// Get user by ID - optimized to select only needed session fields
export async function getUserById(id: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        sessions: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { 
            id: true,
            createdAt: true,
            expiresAt: true
          }
        },
        authoredKelas: {
          select: { id: true, title: true, createdAt: true }
        },
        authoredPosts: {
          select: { id: true, title: true, createdAt: true },
          take: 5
        },
        _count: {
          select: {
            authoredPosts: true,
            authoredKelas: true,
            sessions: true,
            activityLogs: true
          }
        }
      }
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  } catch (error) {
    console.error("Error fetching user:", error);
    throw new Error("Failed to fetch user");
  }
}

// Update user
export async function updateUser(id: string, data: {
  name?: string;
  email?: string;
  role?: UserRoles;
  emailVerified?: boolean;
}) {
  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });

    revalidatePath("/dashboard/admin/users");
    return user;
  } catch (error) {
    console.error("Error updating user:", error);
    throw new Error("Failed to update user");
  }
}

// Delete user
export async function deleteUser(id: string) {
  try {
    await prisma.user.delete({
      where: { id }
    });

    revalidatePath("/dashboard/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    throw new Error("Failed to delete user");
  }
}

// Toggle user email verification
export async function toggleUserEmailVerification(id: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { emailVerified: true }
    });

    if (!user) {
      throw new Error("User not found");
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        emailVerified: !user.emailVerified,
        updatedAt: new Date()
      }
    });

    revalidatePath("/dashboard/admin/users");
    return updatedUser;
  } catch (error) {
    console.error("Error toggling email verification:", error);
    throw new Error("Failed to toggle email verification");
  }
}

// Create new user
export async function createUser(data: {
  name: string;
  email: string;
  role: UserRoles;
  emailVerified?: boolean;
}) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        emailVerified: data.emailVerified || false
      }
    });

    revalidatePath("/dashboard/admin/users");
    return user;
  } catch (error) {
    console.error("Error creating user:", error);
    throw new Error("Failed to create user");
  }
}

// Get recent user activities
export async function getRecentUserActivities(limit: number = 10) {
  try {
    const activities = await prisma.activityLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: limit
    });

    return activities;
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    throw new Error("Failed to fetch recent activities");
  }
}

// Bulk update users
export async function bulkUpdateUsers(userIds: string[], data: {
  role?: UserRoles;
  emailVerified?: boolean;
}) {
  try {
    const result = await prisma.user.updateMany({
      where: {
        id: { in: userIds }
      },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });

    revalidatePath("/dashboard/admin/users");
    return result;
  } catch (error) {
    console.error("Error bulk updating users:", error);
    throw new Error("Failed to bulk update users");
  }
}

// Bulk delete users
export async function bulkDeleteUsers(userIds: string[]) {
  try {
    const result = await prisma.user.deleteMany({
      where: {
        id: { in: userIds }
      }
    });

    revalidatePath("/dashboard/admin/users");
    return result;
  } catch (error) {
    console.error("Error bulk deleting users:", error);
    throw new Error("Failed to bulk delete users");
  }
}

// Search users
export async function searchUsers(query: string, limit: number = 10) {
  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true
      },
      take: limit,
      orderBy: { createdAt: "desc" }
    });

    return users;
  } catch (error) {
    console.error("Error searching users:", error);
    throw new Error("Failed to search users");
  }
}

// ========== CONTENT MANAGEMENT FUNCTIONS ==========

export interface ClassFilters {
  search?: string;
  status?: "ALL" | "PUBLISHED" | "DRAFT";
  type?: "ALL" | "REGULAR" | "EVENT" | "GROUP" | "PRIVATE" | "FUN";
  level?: "ALL" | "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  authorId?: string;
  page?: number;
  limit?: number;
}

export interface ClassWithAuthor {
  id: number;
  title: string;
  description: string | null;
  type: string;
  level: string;
  thumbnail: string | null;
  isPaidClass: boolean;
  price: number | null;
  discount: number | null;
  isDraft: boolean;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string | null;
    email: string;
  };
  _count: {
    materis: number;
    members: number;
  };
}

// Get all classes with filtering and pagination - optimized with parallel queries
export async function getAllClasses(filters: ClassFilters = {}) {
  try {
    const {
      search = "",
      status = "ALL",
      type = "ALL",
      level = "ALL",
      authorId,
      page = 1,
      limit = 12
    } = filters;

    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {};

    // Search filter
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { author: { 
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } }
          ]
        }}
      ];
    }

    // Status filter
    if (status === "PUBLISHED") {
      whereClause.isDraft = false;
    } else if (status === "DRAFT") {
      whereClause.isDraft = true;
    }

    // Type filter
    if (type !== "ALL") {
      whereClause.type = type;
    }

    // Level filter
    if (level !== "ALL") {
      whereClause.level = level;
    }

    // Author filter
    if (authorId) {
      whereClause.authorId = authorId;
    }

    // Run queries in parallel for better performance
    const [classes, totalClasses] = await Promise.all([
      // Get classes with author and counts
      prisma.kelas.findMany({
        where: whereClause,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              materis: true,
              members: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),

      // Get total count for pagination
      prisma.kelas.count({
        where: whereClause
      })
    ]);

    // Convert Decimal fields to numbers for client components
    const serializedClasses: ClassWithAuthor[] = classes.map(kelas => ({
      ...kelas,
      price: kelas.price ? Number(kelas.price) : null,
      discount: kelas.discount ? Number(kelas.discount) : null,
    }));

    return {
      classes: serializedClasses,
      totalClasses,
      totalPages: Math.ceil(totalClasses / limit),
      currentPage: page,
      hasNextPage: page < Math.ceil(totalClasses / limit),
      hasPrevPage: page > 1
    };

  } catch (error) {
    console.error("Error fetching classes:", error);
    throw new Error("Failed to fetch classes");
  }
}

// Get content statistics
export async function getContentStats() {
  try {
    const [
      totalClasses,
      publishedClasses,
      draftClasses,
      totalMaterials,
      totalEnrollments,
      classesThisWeek
    ] = await Promise.all([
      // Total classes
      prisma.kelas.count(),
      
      // Published classes
      prisma.kelas.count({
        where: { isDraft: false }
      }),
      
      // Draft classes
      prisma.kelas.count({
        where: { isDraft: true }
      }),
      
      // Total materials
      prisma.materi.count(),
      
      // Total enrollments - optimized by using raw query to count join table
      prisma.$queryRaw<[{count: bigint}]>`
        SELECT COUNT(*) as count 
        FROM "_KelasMembers"
      `.then(result => Number(result[0]?.count || 0)),
      
      // Classes created this week
      prisma.kelas.count({
        where: {
          createdAt: {
            gte: weeksAgo(1)
          }
        }
      })
    ]);

    return {
      totalClasses,
      publishedClasses,
      draftClasses,
      totalMaterials,
      totalEnrollments,
      classesThisWeek
    };

  } catch (error) {
    console.error("Error fetching content stats:", error);
    throw new Error("Failed to fetch content statistics");
  }
}

// Admin force publish/unpublish class
export async function adminToggleClassStatus(id: number) {
  try {
    const kelas = await prisma.kelas.findUnique({
      where: { id },
      select: { isDraft: true, title: true }
    });

    if (!kelas) {
      throw new Error("Class not found");
    }

    const updatedKelas = await prisma.kelas.update({
      where: { id },
      data: {
        isDraft: !kelas.isDraft,
        updatedAt: new Date()
      }
    });

    return {
      success: true,
      message: `Class ${kelas.isDraft ? 'published' : 'unpublished'} successfully`,
      data: updatedKelas
    };

  } catch (error) {
    console.error("Error toggling class status:", error);
    throw new Error("Failed to toggle class status");
  }
}

// Admin delete class
export async function adminDeleteClass(id: number) {
  try {
    await prisma.kelas.delete({
      where: { id }
    });

    return { success: true, message: "Class deleted successfully" };
  } catch (error) {
    console.error("Error deleting class:", error);
    throw new Error("Failed to delete class");
  }
}

// Get top teachers by class count - optimized query
export async function getTopTeachers(limit: number = 10) {
  try {
    const teachers = await prisma.user.findMany({
      where: { role: "GURU" },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        _count: { 
          select: { authoredKelas: true } 
        },
        authoredKelas: {
          select: { 
            _count: { 
              select: { members: true } 
            } 
          }
        }
      },
      orderBy: { 
        authoredKelas: { 
          _count: 'desc' 
        } 
      },
      take: limit
    });

    return teachers.map(teacher => ({
      ...teacher,
      totalStudents: teacher.authoredKelas.reduce(
        (sum, kelas) => sum + kelas._count.members, 
        0
      )
    }));

  } catch (error) {
    console.error("Error fetching top teachers:", error);
    throw new Error("Failed to fetch top teachers");
  }
}

// ========== ADMIN DASHBOARD DATA AGGREGATION ==========

export interface AdminDashboardData {
  userStats: UserStats;
  contentStats: {
    totalClasses: number;
    publishedClasses: number;
    draftClasses: number;
    totalMaterials: number;
    totalEnrollments: number;
    classesThisWeek: number;
  };
  recentActivities: Array<{
    action: string;
    user: string;
    time: string;
    type: 'user' | 'content' | 'system' | 'issue';
  }>;
}

// Get comprehensive admin dashboard data
export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  try {
    const [userStats, contentStats, activities] = await Promise.all([
      getUserStats(),
      getContentStats(),
      getRecentUserActivities(10)
    ]);

    // Format activities on the server side
    const formattedActivities = await Promise.all(
      activities.map(activity => formatActivityForDisplay(activity))
    );

    return {
      userStats,
      contentStats,
      recentActivities: formattedActivities
    };

  } catch (error) {
    console.error("Error fetching admin dashboard data:", error);
    throw new Error("Failed to fetch admin dashboard data");
  }
}

// Activity type to human readable mapping
export async function formatActivityForDisplay(activity: any) {
  const activityTypeMap: Record<string, { action: string; type: 'user' | 'content' | 'system' | 'issue' }> = {
    LOGIN: { action: "User logged in", type: "user" },
    COMPLETE_MATERI: { action: "Completed lesson", type: "content" },
    COMPLETE_KELAS: { action: "Completed class", type: "content" },
    COMPLETE_QUIZ: { action: "Completed quiz", type: "content" },
    VOCABULARY_PRACTICE: { action: "Practiced vocabulary", type: "content" },
    DAILY_CHALLENGE: { action: "Completed daily challenge", type: "content" },
    PARTICIPATE_LIVE_SESSION: { action: "Joined live session", type: "content" },
    PLAY_GAME: { action: "Played game", type: "content" },
    CREATE_POST: { action: "Created post", type: "content" },
    COMMENT_POST: { action: "Commented on post", type: "content" },
    LIKE_POST: { action: "Liked post", type: "user" },
    LIKE_COMMENT: { action: "Liked comment", type: "user" },
    SHARE_POST: { action: "Shared post", type: "user" },
    OTHER: { action: "System activity", type: "system" }
  };

  const mapping = activityTypeMap[activity.type] || activityTypeMap.OTHER;
  
  // Handle special case for user registration activities
  if (activity.type === "OTHER" && activity.metadata?.action === "USER_REGISTRATION") {
    const role = activity.metadata?.role || "user";
    return {
      action: `New ${role.toLowerCase()} registered`,
      user: activity.user.name || activity.user.email,
      time: formatRelativeTime(activity.createdAt),
      type: "user" as const
    };
  }
  
  return {
    action: activity.description || mapping.action,
    user: activity.user.name || activity.user.email,
    time: formatRelativeTime(activity.createdAt),
    type: mapping.type
  };
}

// ========== SESSION MANAGEMENT ==========

export interface SessionInfo {
  id: string;
  token: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  userRole: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  isExpired: boolean;
  isExpiringSoon: boolean;
}

export interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  expiredSessions: number;
  expiringSoonSessions: number;
  uniqueUsers: number;
  sessionsByRole: {
    ADMIN: number;
    GURU: number;
    MURID: number;
  };
}

// Get all sessions with user info
export async function getAllSessions(filters: {
  search?: string;
  status?: 'ALL' | 'ACTIVE' | 'EXPIRED' | 'EXPIRING_SOON';
  page?: number;
  limit?: number;
} = {}): Promise<{ sessions: SessionInfo[]; total: number }> {
  try {
    const { search = "", status = "ALL", page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    // Build where clause
    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { token: { contains: search, mode: "insensitive" } }
      ];
    }

    // Status filter
    if (status === "ACTIVE") {
      whereClause.expiresAt = { gt: now };
    } else if (status === "EXPIRED") {
      whereClause.expiresAt = { lte: now };
    } else if (status === "EXPIRING_SOON") {
      whereClause.AND = [
        { expiresAt: { gt: now } },
        { expiresAt: { lte: oneHourFromNow } }
      ];
    }

    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.session.count({ where: whereClause })
    ]);

    return {
      sessions: sessions.map(s => ({
        id: s.id,
        token: s.token,
        userId: s.userId,
        userName: s.user.name,
        userEmail: s.user.email,
        userRole: s.user.role,
        expiresAt: s.expiresAt,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
        isExpired: s.expiresAt <= now,
        isExpiringSoon: s.expiresAt > now && s.expiresAt <= oneHourFromNow
      })),
      total
    };
  } catch (error) {
    console.error("Error fetching sessions:", error);
    throw new Error("Failed to fetch sessions");
  }
}

// Get session statistics
export async function getSessionStats(): Promise<SessionStats> {
  try {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    const [totalSessions, activeSessions, expiredSessions, expiringSoonSessions, uniqueUsers, sessionsByRole] = await Promise.all([
      prisma.session.count(),
      prisma.session.count({ where: { expiresAt: { gt: now } } }),
      prisma.session.count({ where: { expiresAt: { lte: now } } }),
      prisma.session.count({
        where: {
          AND: [
            { expiresAt: { gt: now } },
            { expiresAt: { lte: oneHourFromNow } }
          ]
        }
      }),
      prisma.session.findMany({
        select: { userId: true },
        distinct: ['userId']
      }),
      prisma.session.groupBy({
        by: ['userId'],
        where: { expiresAt: { gt: now } },
        _count: true
      })
    ]);

    // Get roles for active sessions
    const activeUserIds = sessionsByRole.map(s => s.userId);
    const usersWithRoles = await prisma.user.findMany({
      where: { id: { in: activeUserIds } },
      select: { id: true, role: true }
    });

    const roleCount = { ADMIN: 0, GURU: 0, MURID: 0 };
    usersWithRoles.forEach(user => {
      if (user.role in roleCount) {
        roleCount[user.role as keyof typeof roleCount]++;
      }
    });

    return {
      totalSessions,
      activeSessions,
      expiredSessions,
      expiringSoonSessions,
      uniqueUsers: uniqueUsers.length,
      sessionsByRole: roleCount
    };
  } catch (error) {
    console.error("Error fetching session stats:", error);
    throw new Error("Failed to fetch session statistics");
  }
}

// Revoke a specific session
export async function revokeSession(sessionId: string): Promise<{ success: boolean }> {
  try {
    await prisma.session.delete({
      where: { id: sessionId }
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error revoking session:", error);
    throw new Error("Failed to revoke session");
  }
}

// Revoke all sessions for a user
export async function revokeUserSessions(userId: string): Promise<{ success: boolean; count: number }> {
  try {
    const result = await prisma.session.deleteMany({
      where: { userId }
    });
    revalidatePath("/dashboard");
    return { success: true, count: result.count };
  } catch (error) {
    console.error("Error revoking user sessions:", error);
    throw new Error("Failed to revoke user sessions");
  }
}

// Revoke all expired sessions (cleanup)
export async function cleanupExpiredSessions(): Promise<{ success: boolean; count: number }> {
  try {
    const result = await prisma.session.deleteMany({
      where: { expiresAt: { lte: new Date() } }
    });
    revalidatePath("/dashboard");
    return { success: true, count: result.count };
  } catch (error) {
    console.error("Error cleaning up expired sessions:", error);
    throw new Error("Failed to cleanup expired sessions");
  }
}

// Find sessions with duplicate tokens (debug)
export async function findDuplicateTokens(): Promise<{ token: string; count: number; sessions: SessionInfo[] }[]> {
  try {
    // Get all sessions and group by token prefix (first 20 chars for comparison)
    const sessions = await prisma.session.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const now = new Date();
    const tokenGroups = new Map<string, typeof sessions>();

    sessions.forEach(session => {
      // Group by token prefix (first 20 characters)
      const prefix = session.token.substring(0, 20);
      if (!tokenGroups.has(prefix)) {
        tokenGroups.set(prefix, []);
      }
      tokenGroups.get(prefix)!.push(session);
    });

    // Find groups with more than one session
    const duplicates: { token: string; count: number; sessions: SessionInfo[] }[] = [];
    tokenGroups.forEach((groupSessions, prefix) => {
      if (groupSessions.length > 1) {
        duplicates.push({
          token: prefix + "...",
          count: groupSessions.length,
          sessions: groupSessions.map(s => ({
            id: s.id,
            token: s.token,
            userId: s.userId,
            userName: s.user.name,
            userEmail: s.user.email,
            userRole: s.user.role,
            expiresAt: s.expiresAt,
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
            ipAddress: s.ipAddress,
            userAgent: s.userAgent,
            isExpired: s.expiresAt <= now,
            isExpiringSoon: false
          }))
        });
      }
    });

    return duplicates;
  } catch (error) {
    console.error("Error finding duplicate tokens:", error);
    throw new Error("Failed to find duplicate tokens");
  }
}
