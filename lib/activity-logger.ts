"use server";

import { prisma } from "@/lib/db";
import { ActivityType } from "@/lib/enums";

export interface ActivityLogData {
  userId: string;
  type: ActivityType;
  description?: string;
  xpEarned?: number;
  streakUpdated?: boolean;
  previousStreak?: number;
  newStreak?: number;
  previousLevel?: number;
  newLevel?: number;
  metadata?: any;
}

export async function logActivity(data: ActivityLogData) {
  try {
    await prisma.activityLog.create({
      data: {
        userId: data.userId,
        type: data.type,
        description: data.description,
        xpEarned: data.xpEarned,
        streakUpdated: data.streakUpdated || false,
        previousStreak: data.previousStreak,
        newStreak: data.newStreak,
        previousLevel: data.previousLevel,
        newLevel: data.newLevel,
        metadata: data.metadata,
        createdAt: new Date()
      }
    });
  } catch (error) {
    console.error("Error logging activity:", error);
    // Don't throw to avoid breaking the main flow
  }
}

// Convenience functions for common activities
export async function logUserRegistration(userId: string, role: string = "MURID") {
  await logActivity({
    userId,
    type: "OTHER",
    description: `New ${role.toLowerCase()} registered`,
    metadata: { action: "USER_REGISTRATION", role }
  });
}

export async function logUserLogin(userId: string) {
  await logActivity({
    userId,
    type: "LOGIN",
    description: "User logged in"
  });
}

export async function logLessonCompletion(userId: string, lessonId: number, xpEarned?: number) {
  await logActivity({
    userId,
    type: "COMPLETE_MATERI",
    description: "Completed lesson",
    xpEarned,
    metadata: { lessonId }
  });
}

export async function logClassCompletion(userId: string, classId: number, xpEarned?: number) {
  await logActivity({
    userId,
    type: "COMPLETE_KELAS",
    description: "Completed class",
    xpEarned,
    metadata: { classId }
  });
}

export async function logQuizCompletion(userId: string, quizId: number, score: number, xpEarned?: number) {
  await logActivity({
    userId,
    type: "COMPLETE_QUIZ",
    description: "Completed quiz",
    xpEarned,
    metadata: { quizId, score }
  });
}

export async function logVocabularyPractice(userId: string, setId: number, wordsLearned: number, xpEarned?: number) {
  await logActivity({
    userId,
    type: "VOCABULARY_PRACTICE",
    description: "Practiced vocabulary",
    xpEarned,
    metadata: { setId, wordsLearned }
  });
}

export async function logPostCreation(userId: string, postId: number) {
  await logActivity({
    userId,
    type: "CREATE_POST",
    description: "Created new post",
    metadata: { postId }
  });
}

export async function logPostComment(userId: string, postId: number, commentId: number) {
  await logActivity({
    userId,
    type: "COMMENT_POST",
    description: "Commented on post",
    metadata: { postId, commentId }
  });
}

export async function logPostLike(userId: string, postId: number) {
  await logActivity({
    userId,
    type: "LIKE_POST",
    description: "Liked post",
    metadata: { postId }
  });
}

export async function logLiveSessionParticipation(userId: string, sessionId: string) {
  await logActivity({
    userId,
    type: "PARTICIPATE_LIVE_SESSION",
    description: "Joined live session",
    metadata: { sessionId }
  });
}
