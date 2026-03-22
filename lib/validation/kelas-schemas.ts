import { z } from "zod";
import { KelasType, Difficulty, VocabularyType, PartOfSpeech } from "@/app/generated/prisma/client";

// Kelas Meta Schema
export const KelasMetaSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title must be less than 255 characters"),
  description: z.string().optional(),
  jsonDescription: z.any().optional(),
  htmlDescription: z.string().optional(),
  type: z.nativeEnum(KelasType).default(KelasType.REGULAR),
  level: z.nativeEnum(Difficulty),
  thumbnail: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  icon: z.string().optional(),
  isPaidClass: z.boolean().default(false),
  price: z.number().min(0, "Price must be 0 or greater").optional(),
  discount: z.number().min(0, "Discount must be 0 or greater").optional(),
  promoCode: z.string().optional(),
});

// Materi Quick Schema
export const MateriQuickSchema = z.object({
  materis: z.array(
    z.object({
      title: z.string().min(1, "Title is required").max(255, "Title must be less than 255 characters"),
      description: z.string().min(1, "Description is required"),
      jsonDescription: z.any().default({}),
      htmlDescription: z.string().min(1, "HTML description is required"),
      order: z.number().int().min(0).optional(),
      isDemo: z.boolean().default(false),
    })
  ).min(1, "At least one materi is required"),
});

// Vocabulary Item Schema
export const VocabularyItemSchema = z.object({
  korean: z.string().min(1, "Korean word is required"),
  indonesian: z.string().min(1, "Indonesian translation is required"),
  type: z.nativeEnum(VocabularyType).default(VocabularyType.WORD),
  pos: z.nativeEnum(PartOfSpeech).optional(),
  audioUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  exampleSentences: z.array(z.string()).default([]),
  order: z.number().int().min(0).optional(),
});

// Vocabulary Quick Schema
export const VocabularyQuickSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title must be less than 255 characters"),
  description: z.string().optional(),
  icon: z.string().default("FaBook"),
  isPublic: z.boolean().default(false),
  items: z.array(VocabularyItemSchema).min(1, "At least one vocabulary item is required"),
});

// Soal Collection Schemas
export const SoalOpsiSchema = z.object({
  opsiText: z.string().min(1, "Option text is required").max(500, "Option text must be less than 500 characters"),
  isCorrect: z.boolean().default(false),
  order: z.number().int().min(0).default(0),
});

export const SoalSchema = z.object({
  pertanyaan: z.any().optional(), // Rich content (JSON)
  pertanyaanText: z.string().min(1, "Question text is required").max(1000, "Question must be less than 1000 characters").optional(),
  pertanyaanHtml: z.string().optional(),
  difficulty: z.nativeEnum(Difficulty).optional(),
  explanation: z.any().optional(), // Rich content (JSON)
  explanationText: z.string().max(2000, "Explanation must be less than 2000 characters").optional(),
  explanationHtml: z.string().optional(),
  isActive: z.boolean().default(true),
  opsis: z.array(SoalOpsiSchema)
    .min(2, "At least 2 options are required")
    .max(5, "Maximum 5 options allowed")
    .refine(
      (opsis) => opsis.filter(opsi => opsi.isCorrect).length === 1,
      { message: "Exactly one option must be marked as correct" }
    ),
});

export const KoleksiSoalSchema = z.object({
  nama: z.string().min(1, "Collection name is required").max(255, "Collection name must be less than 255 characters"),
  deskripsi: z.string().max(1000, "Description must be less than 1000 characters").optional(),
  isPrivate: z.boolean().default(false),
  isDraft: z.boolean().default(true),
  soals: z.array(SoalSchema).min(1, "At least one question is required"),
});

// Soal Set Link Schema
export const SoalSetLinkSchema = z.object({
  koleksiSoalId: z.number().int().positive("Please select a valid question collection"),
  title: z.string().min(1, "Title is required").max(255, "Title must be less than 255 characters"),
  description: z.string().optional(),
});

// Reorder Schema
export const ReorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.number().int().positive(),
      order: z.number().int().min(0),
    })
  ).min(1, "At least one item is required"),
});

// Step-specific schemas for multi-step forms
export const StepMetaSchema = KelasMetaSchema.pick({
  title: true,
  description: true,
  type: true,
  level: true,
  thumbnail: true,
  icon: true,
});

export const StepContentSchema = z.object({
  materis: z.array(
    z.object({
      title: z.string().min(1, "Title is required"),
      description: z.string().min(1, "Description is required"),
      htmlDescription: z.string().min(1, "Content is required"),
      isDemo: z.boolean().default(false),
    })
  ).min(1, "At least one lesson is required"),
});

export const StepPricingSchema = z.object({
  isPaidClass: z.boolean().default(false),
  price: z.number().min(0, "Price must be 0 or greater").optional(),
  discount: z.number().min(0, "Discount must be 0 or greater").optional(),
  promoCode: z.string().optional(),
});

// Combined schema for complete validation
export const CompleteKelasSchema = KelasMetaSchema.merge(
  z.object({
    materis: MateriQuickSchema.shape.materis,
    vocabSets: z.array(VocabularyQuickSchema).optional(),
    soalSets: z.array(SoalSetLinkSchema).optional(),
  })
);

// Export types for TypeScript
export type KelasMetaFormData = z.infer<typeof KelasMetaSchema>;
export type MateriQuickFormData = z.infer<typeof MateriQuickSchema>;
export type VocabularyItemFormData = z.infer<typeof VocabularyItemSchema>;
export type VocabularyQuickFormData = z.infer<typeof VocabularyQuickSchema>;
export type SoalOpsiFormData = z.infer<typeof SoalOpsiSchema>;
export type SoalFormData = z.infer<typeof SoalSchema>;
export type KoleksiSoalFormData = z.infer<typeof KoleksiSoalSchema>;
export type SoalSetLinkFormData = z.infer<typeof SoalSetLinkSchema>;
export type ReorderFormData = z.infer<typeof ReorderSchema>;
export type StepMetaFormData = z.infer<typeof StepMetaSchema>;
export type StepContentFormData = z.infer<typeof StepContentSchema>;
export type StepPricingFormData = z.infer<typeof StepPricingSchema>;
export type CompleteKelasFormData = z.infer<typeof CompleteKelasSchema>;

// Validation helpers
export const validateKelasForPublish = (data: any) => {
  const errors: string[] = [];
  
  if (!data.title || data.title.trim() === '') {
    errors.push('Title is required');
  }
  
  if (!data.description || data.description.trim() === '') {
    errors.push('Description is required');
  }
  
  if (!data.materis || data.materis.length === 0) {
    errors.push('At least one lesson is required');
  }
  
  if (data.isPaidClass && (!data.price || data.price <= 0)) {
    errors.push('Price is required for paid classes');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Schema refinements for complex validation
export const RefinedKelasMetaSchema = KelasMetaSchema.refine(
  (data) => {
    if (data.isPaidClass && (!data.price || data.price <= 0)) {
      return false;
    }
    return true;
  },
  {
    message: "Price is required for paid classes",
    path: ["price"],
  }
).refine(
  (data) => {
    if (data.discount && data.price && data.discount >= data.price) {
      return false;
    }
    return true;
  },
  {
    message: "Discount cannot be greater than or equal to the price",
    path: ["discount"],
  }
);

// Form field configurations for different steps
export const formFieldConfigs = {
  meta: {
    title: { required: true, placeholder: "Enter class title" },
    description: { required: false, placeholder: "Enter class description" },
    type: { required: true, options: Object.values(KelasType) },
    level: { required: true, options: Object.values(Difficulty) },
    thumbnail: { required: false, placeholder: "Enter thumbnail URL" },
    icon: { required: false, placeholder: "Enter icon name" },
  },
  content: {
    title: { required: true, placeholder: "Enter lesson title" },
    description: { required: true, placeholder: "Enter lesson description" },
    htmlDescription: { required: true, placeholder: "Enter lesson content" },
    isDemo: { required: false, defaultValue: false },
  },
  vocabulary: {
    title: { required: true, placeholder: "Enter vocabulary set title" },
    description: { required: false, placeholder: "Enter vocabulary set description" },
    korean: { required: true, placeholder: "Enter Korean word" },
    indonesian: { required: true, placeholder: "Enter Indonesian translation" },
    type: { required: true, options: Object.values(VocabularyType) },
    pos: { required: false, options: Object.values(PartOfSpeech) },
    audioUrl: { required: false, placeholder: "Enter audio URL" },
    exampleSentences: { required: false, placeholder: "Enter example sentences" },
  },
  pricing: {
    isPaidClass: { required: false, defaultValue: false },
    price: { required: false, placeholder: "Enter price" },
    discount: { required: false, placeholder: "Enter discount amount" },
    promoCode: { required: false, placeholder: "Enter promo code" },
  },
};
