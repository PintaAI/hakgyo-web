import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
  sessionOptions: {
    // Disable automatic session refetch on window focus to reduce repeated requests
    refetchOnWindowFocus: false,
    // Set refetch interval to 0 (disabled) to prevent polling
    refetchInterval: 0,
  },
});

export const {
  signIn,
  signOut,
  signUp,
  useSession,
  getSession,
} = authClient;

// Social login functions
export const signInWithGoogle = async () => {
  const data = await signIn.social({
    provider: "google",
  });
  return data;
};

export const signInWithEmailPassword = async (email: string, password: string) => {
  const data = await signIn.email({
    email,
    password,
  });
  return data;
};

export const signUpWithEmailPassword = async (email: string, password: string, name: string) => {
  const data = await signUp.email({
    email,
    password,
    name,
  });
  return data;
};
