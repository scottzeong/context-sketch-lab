import { NextResponse } from "next/server";
import { createStructuredOutput } from "@/lib/ai/structuredOutput";
import { openaiTextModel } from "@/lib/ai/openai";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  tutorFeedbackEvaluationInputSchema,
  tutorFeedbackEvaluationJsonSchema,
  tutorFeedbackEvaluationSchema
} from "@/lib/schemas/tutorFeedbackEvaluation";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are the Tutor Feedback Evaluation Agent for Roter Faden.

Write every human-readable field in Korean.
All feedbackDraft fields, rubric rationales, and recommendedNextActivities must be Korean.
Rubric axis ids may remain in English, but all labels, rationales, and feedback must be Korean.
Use only the tutor's observation, student explanation, strengths, misconceptions, key connections, and next step.
Do not invent sketch details the tutor did not provide.
Create a draft rubric evaluation and feedback that a tutor can revise before publishing.
The student-facing feedback should be warm, concrete, and age-appropriate.
The result is never a final judgment; needsTutorReview should be true.`;

export async function POST(request: Request) {
  try {
    const input = tutorFeedbackEvaluationInputSchema.parse(await request.json());
    const supabase = await createSupabaseServerClient();
    const { data: rubricOptions } = await supabase
      .from("config_options")
      .select("label, value, sort_order")
      .eq("category", "rubric_axis")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    const evaluation = await createStructuredOutput({
      name: "tutor_feedback_evaluation",
      systemPrompt: SYSTEM_PROMPT,
      userPayload: {
        ...input,
        rubricAxes:
          rubricOptions?.length
            ? rubricOptions.map((option) => ({ axis: option.value, label: option.label }))
            : [
                { axis: "situation_inference", label: "상황 추론" },
                { axis: "structure", label: "구조 이해" },
                { axis: "abstraction", label: "추상화" },
                { axis: "perspective_shift", label: "관점 전환" },
                { axis: "expression_integration", label: "표현 통합" }
              ]
      },
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

