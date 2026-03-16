import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { expo } from "@better-auth/expo";
import { createAuthMiddleware } from "better-auth/api";
import { prisma } from "./db";
import { logUserRegistration, logUserLogin } from "./activity-logger";

// Auto-enroll new users in kelas ID 14
const DEFAULT_KELAS_ID = 14;

async function ensureUserHasKelas(userId: string) {
  try {
    // Check if user has any kelas enrolled
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        joinedKelas: {
          select: { id: true }
        }
      }
    });

    if (!user) {
      console.warn(`User ${userId} not found`);
      return;
    }

    // If user has no kelas, enroll them in the default kelas
    if (user.joinedKelas.length === 0) {
      console.log(`User ${userId} has no kelas, auto-enrolling in kelas ${DEFAULT_KELAS_ID}`);
      await autoEnrollInDefaultKelas(userId);
    } else {
      console.log(`User ${userId} already has ${user.joinedKelas.length} kelas enrolled`);
    }
  } catch (error) {
    console.error(`Error checking kelas enrollment for user ${userId}:`, error);
  }
}

async function autoEnrollInDefaultKelas(userId: string) {
  try {
    // Check if kelas exists and is available
    const kelas = await prisma.kelas.findUnique({
      where: { id: DEFAULT_KELAS_ID },
      select: {
        id: true,
        isDraft: true,
        isPaidClass: true,
        authorId: true,
        members: {
          where: { id: userId },
          select: { id: true }
        }
      }
    });

    if (!kelas) {
      console.warn(`Default kelas ID ${DEFAULT_KELAS_ID} not found`);
      return;
    }

    if (kelas.isDraft) {
      console.warn(`Default kelas ID ${DEFAULT_KELAS_ID} is in draft mode`);
      return;
    }

    // Check if user is the author
    if (kelas.authorId === userId) {
      console.log(`User ${userId} is the author of kelas ${DEFAULT_KELAS_ID}, skipping auto-enrollment`);
      return;
    }

    // Check if already enrolled
    if (kelas.members.length > 0) {
      console.log(`User ${userId} is already enrolled in kelas ${DEFAULT_KELAS_ID}`);
      return;
    }

    // Enroll user in the default kelas
    await prisma.kelas.update({
      where: { id: DEFAULT_KELAS_ID },
      data: {
        members: {
          connect: { id: userId }
        }
      }
    });

    console.log(`Auto-enrolled user ${userId} in kelas ${DEFAULT_KELAS_ID}`);
  } catch (error) {
    console.error(`Error auto-enrolling user ${userId} in kelas ${DEFAULT_KELAS_ID}:`, error);
  }
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    autoSignIn: true,
  },
  experimental: {
    joins: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "MURID",
      },
      currentStreak: {
        type: "number",
        defaultValue: 0,
      },
      longestStreak: {
        type: "number",
        defaultValue: 0,
      },
      xp: {
        type: "number",
        defaultValue: 0,
      },
      level: {
        type: "number",
        defaultValue: 1,
      },
    }
  },
  trustedOrigins: [
    "http://localhost:3000",
    "http://10.0.2.2:3000",
    "http://192.168.0.102:3000",
    "https://hakgyo.vercel.app",
    "exp://",
    "exp://*",
    "hakgyo://",
    
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
    process.env.NEXT_PUBLIC_APP_URL || ""
  ].filter(Boolean),
  logger: {
    disabled: true,
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      // Handle sign-up
      if (ctx.path.startsWith("/sign-up")) {
        const newSession = ctx.context.newSession;
        if (newSession?.user) {
          try {
            await logUserRegistration(
              newSession.user.id,
              newSession.user.role || "MURID"
            );
            // Auto-enroll new user in default kelas
            await autoEnrollInDefaultKelas(newSession.user.id);
          } catch (error) {
            console.error("Error logging registration activity:", error);
          }
        }
      }

      // Handle sign-in
      if (ctx.path.startsWith("/sign-in")) {
        const newSession = ctx.context.newSession;
        if (newSession?.user) {
          try {
            await logUserLogin(newSession.user.id);
            // Check if user has any kelas, if not assign default kelas
            await ensureUserHasKelas(newSession.user.id);
          } catch (error) {
            console.error("Error logging login activity:", error);
          }
        }
      }

      // Handle social sign-in
      if (ctx.path.startsWith("/sign-in/social")) {
        const newSession = ctx.context.newSession;
        // Check if user has any kelas, if not assign default kelas
        if (newSession?.user) {
          try {
            await ensureUserHasKelas(newSession.user.id);
          } catch (error) {
            console.error("Error checking/enrolling social sign-in user:", error);
          }
        }
      }
    }),
  },
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },
  plugins: [
    expo(),
    nextCookies()
  ],
});

export type Session = typeof auth.$Infer.Session;
