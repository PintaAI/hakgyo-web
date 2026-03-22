"use server";

import { prisma } from "@/lib/db";
import { KelasType, Difficulty } from "@/app/generated/prisma/client";

export interface GetKelasListParams {
  type?: KelasType;
  level?: Difficulty;
  search?: string;
  limit?: number;
  offset?: number;
}

// Client-side action for filtering (called from client components)
export async function filterKelas(params: GetKelasListParams) {
  return getPublishedKelasList(params);
}

// Get published kelas list for public display
export async function getPublishedKelasList({
  type,
  level,
  search,
  limit = 12,
  offset = 0,
}: GetKelasListParams = {}) {
  try {
    const where: any = {
      isDraft: false, // Only show published classes
    };

    if (type) where.type = type;
    if (level) where.level = level;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [kelas, total] = await Promise.all([
      prisma.kelas.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          _count: {
            select: {
              materis: true,
              members: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.kelas.count({ where }),
    ]);

    // Convert Decimal fields to numbers for client components
    const serializedKelas = kelas.map(kelasItem => ({
      ...kelasItem,
      price: kelasItem.price ? Number(kelasItem.price) : null,
      discount: kelasItem.discount ? Number(kelasItem.discount) : null,
    }));

    return {
      success: true,
      data: serializedKelas,
      meta: {
        total,
        offset,
        limit,
        hasMore: offset + limit < total,
      },
    };
  } catch (error) {
    console.error("Get published kelas list error:", error);
    return {
      success: false,
      error: "Failed to fetch classes",
      data: [],
      meta: { total: 0, offset: 0, limit: 0, hasMore: false },
    };
  }
}

// Get classes joined by a murid (user is a member)
export async function getJoinedKelasList(
  userId: string,
  { type, level, search, limit = 12, offset = 0 }: GetKelasListParams = {}
) {
  try {
    const where: any = {
      isDraft: false,
      members: { some: { id: userId } },
    };
    if (type) where.type = type;
    if (level) where.level = level;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [kelas, total] = await Promise.all([
      prisma.kelas.findMany({
        where,
        include: {
          author: {
            select: { id: true, name: true, image: true },
          },
          _count: { select: { materis: true, members: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.kelas.count({ where }),
    ]);

    const serializedKelas = kelas.map(kelasItem => ({
      ...kelasItem,
      price: kelasItem.price ? Number(kelasItem.price) : null,
      discount: kelasItem.discount ? Number(kelasItem.discount) : null,
    }));

    return {
      success: true,
      data: serializedKelas,
      meta: {
        total,
        offset,
        limit,
        hasMore: offset + limit < total,
      },
    };
  } catch (error) {
    console.error("Get joined kelas list error:", error);
    return {
      success: false,
      error: "Failed to fetch joined classes",
      data: [],
      meta: { total: 0, offset: 0, limit: 0, hasMore: false },
    };
  }
}

// Get classes authored by a guru (user is author)
export async function getUserKelasList(
  userId: string,
  { type, level, search, limit = 12, offset = 0 }: GetKelasListParams = {}
) {
  try {
    const where: any = {
      isDraft: false,
      authorId: userId,
    };
    if (type) where.type = type;
    if (level) where.level = level;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [kelas, total] = await Promise.all([
      prisma.kelas.findMany({
        where,
        include: {
          author: {
            select: { id: true, name: true, image: true },
          },
          _count: { select: { materis: true, members: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.kelas.count({ where }),
    ]);

    const serializedKelas = kelas.map(kelasItem => ({
      ...kelasItem,
      price: kelasItem.price ? Number(kelasItem.price) : null,
      discount: kelasItem.discount ? Number(kelasItem.discount) : null,
    }));

    return {
      success: true,
      data: serializedKelas,
      meta: {
        total,
        offset,
        limit,
        hasMore: offset + limit < total,
      },
    };
  } catch (error) {
    console.error("Get user kelas list error:", error);
    return {
      success: false,
      error: "Failed to fetch user classes",
      data: [],
      meta: { total: 0, offset: 0, limit: 0, hasMore: false },
    };
  }
}

// Get kelas statistics
export async function getKelasStats() {
  try {
    const [totalClasses, totalStudents, typeStats, levelStats] = await Promise.all([
      prisma.kelas.count({ where: { isDraft: false } }),
      prisma.user.count({ where: { role: "MURID" } }),
      prisma.kelas.groupBy({
        by: ["type"],
        where: { isDraft: false },
        _count: { id: true },
      }),
      prisma.kelas.groupBy({
        by: ["level"],
        where: { isDraft: false },
        _count: { id: true },
      }),
    ]);

    return {
      success: true,
      data: {
        totalClasses,
        totalStudents,
        typeStats,
        levelStats,
      },
    };
  } catch (error) {
    console.error("Get kelas stats error:", error);
    return {
      success: false,
      error: "Failed to fetch statistics",
      data: null,
    };
  }
}
