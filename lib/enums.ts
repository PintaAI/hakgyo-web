// Enums that match Prisma schema
// These are defined here to avoid importing Prisma client in client-side code

export const UserRoles = {
  GURU: "GURU",
  MURID: "MURID",
  ADMIN: "ADMIN",
} as const;
export type UserRoles = (typeof UserRoles)[keyof typeof UserRoles];

export const TryoutStatus = {
  IN_PROGRESS: "IN_PROGRESS",
  SUBMITTED: "SUBMITTED",
  EXPIRED: "EXPIRED",
  CANCELLED: "CANCELLED",
} as const;
export type TryoutStatus = (typeof TryoutStatus)[keyof typeof TryoutStatus];

export const KelasType = {
  REGULAR: "REGULAR",
  EVENT: "EVENT",
  GROUP: "GROUP",
  PRIVATE: "PRIVATE",
  FUN: "FUN",
} as const;
export type KelasType = (typeof KelasType)[keyof typeof KelasType];

export const Difficulty = {
  BEGINNER: "BEGINNER",
  INTERMEDIATE: "INTERMEDIATE",
  ADVANCED: "ADVANCED",
} as const;
export type Difficulty = (typeof Difficulty)[keyof typeof Difficulty];

export const LiveSessionStatus = {
  SCHEDULED: "SCHEDULED",
  LIVE: "LIVE",
  ENDED: "ENDED",
} as const;
export type LiveSessionStatus = (typeof LiveSessionStatus)[keyof typeof LiveSessionStatus];

export const VocabularyType = {
  WORD: "WORD",
  SENTENCE: "SENTENCE",
  IDIOM: "IDIOM",
} as const;
export type VocabularyType = (typeof VocabularyType)[keyof typeof VocabularyType];

export const PartOfSpeech = {
  KATA_KERJA: "KATA_KERJA",
  KATA_BENDA: "KATA_BENDA",
  KATA_SIFAT: "KATA_SIFAT",
  KATA_KETERANGAN: "KATA_KETERANGAN",
} as const;
export type PartOfSpeech = (typeof PartOfSpeech)[keyof typeof PartOfSpeech];

export const ActivityType = {
  LOGIN: "LOGIN",
  COMPLETE_MATERI: "COMPLETE_MATERI",
  COMPLETE_KELAS: "COMPLETE_KELAS",
  COMPLETE_QUIZ: "COMPLETE_QUIZ",
  VOCABULARY_PRACTICE: "VOCABULARY_PRACTICE",
  DAILY_CHALLENGE: "DAILY_CHALLENGE",
  PARTICIPATE_LIVE_SESSION: "PARTICIPATE_LIVE_SESSION",
  PLAY_GAME: "PLAY_GAME",
  CREATE_POST: "CREATE_POST",
  COMMENT_POST: "COMMENT_POST",
  LIKE_POST: "LIKE_POST",
  LIKE_COMMENT: "LIKE_COMMENT",
  SHARE_POST: "SHARE_POST",
  OTHER: "OTHER",
} as const;
export type ActivityType = (typeof ActivityType)[keyof typeof ActivityType];

export const PostType = {
  DISCUSSION: "DISCUSSION",
  ANNOUNCEMENT: "ANNOUNCEMENT",
  QUESTION: "QUESTION",
  SHARE: "SHARE",
  TUTORIAL: "TUTORIAL",
} as const;
export type PostType = (typeof PostType)[keyof typeof PostType];

export const SharePlatform = {
  TWITTER: "TWITTER",
  FACEBOOK: "FACEBOOK",
  TELEGRAM: "TELEGRAM",
  WHATSAPP: "WHATSAPP",
  COPY_LINK: "COPY_LINK",
  EMAIL: "EMAIL",
} as const;
export type SharePlatform = (typeof SharePlatform)[keyof typeof SharePlatform];

export const MidtransStatus = {
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  CHALLENGE: "CHALLENGE",
  SETTLEMENT: "SETTLEMENT",
  CAPTURE: "CAPTURE",
  DENY: "DENY",
  CANCEL: "CANCEL",
  REFUND: "REFUND",
  PARTIAL_REFUND: "PARTIAL_REFUND",
  EXPIRE: "EXPIRE",
} as const;
export type MidtransStatus = (typeof MidtransStatus)[keyof typeof MidtransStatus];