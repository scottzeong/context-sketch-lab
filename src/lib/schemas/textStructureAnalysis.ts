import { z } from "zod";
import { ageRangeSchema, textStructureTypeSchema } from "@/lib/schemas/textGeneration";

export const textStructureAnalysisInputSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  learningGoal: z.string().min(1),
  targetAgeRange: ageRangeSchema
});

export const textStructureAnalysisSchema = z.object({
  summary: z.string().min(1),
  mainIdea: z.string().min(1),
  structureType: textStructureTypeSchema,
  paragraphs: z.array(
    z.object({
      index: z.number().int().positive(),
      role: z.string().min(1),
      summary: z.string().min(1),
      keyDetails: z.array(z.string())
    })
  ),
  keyRelations: z.array(
    z.object({
      from: z.string().min(1),
      to: z.string().min(1),
      relationType: z.string().min(1),
      explanation: z.string().min(1)
    })
  ),
  inferencePoints: z.array(z.string()),
  vocabulary: z.array(
    z.object({
      term: z.string().min(1),
      meaning: z.string().min(1),
      whyItMatters: z.string().min(1)
    })
  ),
  discussionQuestions: z.array(z.string()),
  worksheetSuggestions: z.array(z.string())
});

export type TextStructureAnalysisInput = z.infer<
  typeof textStructureAnalysisInputSchema
>;
export type TextStructureAnalysis = z.infer<typeof textStructureAnalysisSchema>;

export const textStructureAnalysisJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "summary",
    "mainIdea",
    "structureType",
    "paragraphs",
    "keyRelations",
    "inferencePoints",
    "vocabulary",
    "discussionQuestions",
    "worksheetSuggestions"
  ],
  properties: {
    summary: { type: "string" },
    mainIdea: { type: "string" },
    structureType: {
      type: "string",
      enum: [
        "narrative",
        "cause_effect",
        "compare_contrast",
        "problem_solution",
        "claim_evidence",
        "sequence",
        "perspective_shift"
      ]
    },
    paragraphs: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["index", "role", "summary", "keyDetails"],
        properties: {
          index: { type: "number" },
          role: { type: "string" },
          summary: { type: "string" },
          keyDetails: { type: "array", items: { type: "string" } }
        }
      }
    },
    keyRelations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["from", "to", "relationType", "explanation"],
        properties: {
          from: { type: "string" },
          to: { type: "string" },
          relationType: { type: "string" },
          explanation: { type: "string" }
        }
      }
    },
    inferencePoints: { type: "array", items: { type: "string" } },
    vocabulary: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["term", "meaning", "whyItMatters"],
        properties: {
          term: { type: "string" },
          meaning: { type: "string" },
          whyItMatters: { type: "string" }
        }
      }
    },
    discussionQuestions: { type: "array", items: { type: "string" } },
    worksheetSuggestions: { type: "array", items: { type: "string" } }
  }
} as const;
