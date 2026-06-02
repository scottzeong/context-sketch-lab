import { z } from "zod";

export const ageRangeSchema = z.enum([
  "AGE_7_8",
  "AGE_9_10",
  "AGE_11_12",
  "AGE_13_15",
  "AGE_16_18",
  "ADULT"
]);

export const textStructureTypeSchema = z.enum([
  "narrative",
  "cause_effect",
  "compare_contrast",
  "problem_solution",
  "claim_evidence",
  "sequence",
  "perspective_shift"
]);

export const textGenerationInputSchema = z.object({
  topic: z.string().min(1),
  ageRange: z.string().min(1),
  difficultyLevel: z.string().min(1),
  targetLength: z.string().min(1),
  textType: z.string().min(1),
  textStructure: z.string().min(1),
  learningGoal: z.string().min(1),
  mustInclude: z.array(z.string()).default([]),
  avoid: z.array(z.string()).default([]),
  tone: z.string().min(1)
});

export const generatedTextSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  estimatedReadingLevel: z.string().min(1),
  difficultyLevel: z.string().min(1),
  structureType: z.string().min(1),
  tutorRevisionNotes: z.array(z.string()),
  safetyNotes: z.array(z.string())
});

export type TextGenerationInput = z.infer<typeof textGenerationInputSchema>;
export type GeneratedText = z.infer<typeof generatedTextSchema>;

export const generatedTextJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "body",
    "estimatedReadingLevel",
    "difficultyLevel",
    "structureType",
    "tutorRevisionNotes",
    "safetyNotes"
  ],
  properties: {
    title: { type: "string" },
    body: { type: "string" },
    estimatedReadingLevel: { type: "string" },
    difficultyLevel: { type: "string" },
    structureType: { type: "string" },
    tutorRevisionNotes: { type: "array", items: { type: "string" } },
    safetyNotes: { type: "array", items: { type: "string" } }
  }
} as const;
