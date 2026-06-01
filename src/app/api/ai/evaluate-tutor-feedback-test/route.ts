import { NextResponse } from "next/server";
import { createStructuredOutput } from "@/lib/ai/structuredOutput";
import { openaiTextModel } from "@/lib/ai/openai";
import {
  tutorFeedbackEvaluationInputSchema,
  tutorFeedbackEvaluationJsonSchema,
  tutorFeedbackEvaluationSchema
} from "@/lib/schemas/tutorFeedbackEvaluation";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are the Tutor Feedback Evaluation Agent for Context Sketch Lab.

Write every human-readable field in Korean.
All feedbackDraft fields, rubric rationales, and recommendedNextActivities must be Korean.
Only schema enum ids such as situation_inference, structure, abstraction, perspective_shift, and expression_integration may remain in English.
Use only the tutor's observation, student explanation, strengths, misconceptions, key connections, and next step.
Do not invent sketch details the tutor did not provide.
Create a draft rubric evaluation and feedback that a tutor can revise before publishing.
The student-facing feedback should be warm, concrete, and age-appropriate.
The result is never a final judgment; needsTutorReview should be true.`;

export async function POST(request: Request) {
  try {
    const input = tutorFeedbackEvaluationInputSchema.parse(await request.json());
    const evaluation = await createStructuredOutput({
      name: "tutor_feedback_evaluation",
      systemPrompt: SYSTEM_PROMPT,
      userPayload: input,
      jsonSchema: tutorFeedbackEvaluationJsonSchema,
      zodSchema: tutorFeedbackEvaluationSchema
    });

    return NextResponse.json({
      ok: true,
      model: openaiTextModel,
      evaluation: {
        ...evaluation,
        needsTutorReview: true
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 400 }
    );
  }
}
