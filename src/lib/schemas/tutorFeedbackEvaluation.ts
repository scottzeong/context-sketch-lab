import { z } from "zod";

export const tutorFeedbackEvaluationInputSchema = z.object({
  studentExplanation: z.string().min(1),
  tutorObservation: z.string().min(1),
  keyConnections: z.array(z.string()).min(1),
  strengths: z.array(z.string()).default([]),
  misconceptions: z.array(z.string()).default([]),
  nextStep: z.string().min(1)
});

export const tutorFeedbackEvaluationSchema = z.object({
  rubricScores: z.array(
    z.object({
      axis: z.enum([
        "situation_inference",
        "structure",
        "abstraction",
        "perspective_shift",
        "expression_integration"
      ]),
      score: z.number().int().min(1).max(5),
      rationale: z.string().min(1)
    })
  ),
  feedbackDraft: z.object({
    studentFacing: z.string().min(1),
    tutorNotes: z.string().min(1),
    parentSummary: z.string().min(1)
  }),
  recommendedNextActivities: z.array(z.string()),
  needsTutorReview: z.boolean()
});

export type TutorFeedbackEvaluationInput = z.infer<
  typeof tutorFeedbackEvaluationInputSchema
>;
export type TutorFeedbackEvaluation = z.infer<typeof tutorFeedbackEvaluationSchema>;

export const tutorFeedbackEvaluationJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "rubricScores",
    "feedbackDraft",
    "recommendedNextActivities",
    "needsTutorReview"
  ],
  properties: {
    rubricScores: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["axis", "score", "rationale"],
        properties: {
          axis: {
            type: "string",
            enum: [
              "situation_inference",
              "structure",
              "abstraction",
              "perspective_shift",
              "expression_integration"
            ]
          },
          score: { type: "number", minimum: 1, maximum: 5 },
          rationale: { type: "string" }
        }
      }
    },
    feedbackDraft: {
      type: "object",
      additionalProperties: false,
      required: ["studentFacing", "tutorNotes", "parentSummary"],
      properties: {
        studentFacing: { type: "string" },
        tutorNotes: { type: "string" },
        parentSummary: { type: "string" }
      }
    },
    recommendedNextActivities: { type: "array", items: { type: "string" } },
    needsTutorReview: { type: "boolean" }
  }
} as const;
