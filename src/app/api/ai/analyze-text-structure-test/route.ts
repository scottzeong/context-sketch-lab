import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/api/auth";
import { enforceRateLimit } from "@/lib/api/rateLimit";
import { createStructuredOutput } from "@/lib/ai/structuredOutput";
import { openaiTextModel } from "@/lib/ai/openai";
import {
  textStructureAnalysisInputSchema,
  textStructureAnalysisJsonSchema,
  textStructureAnalysisSchema
} from "@/lib/schemas/textStructureAnalysis";

export const runtime = "nodejs";
const AI_RATE_LIMIT = { limit: 30, windowMs: 60_000 };

const SYSTEM_PROMPT = `You are the Text Structure Analyzer Agent for Roter Faden.

Write every human-readable field in Korean.
The summary, mainIdea, paragraph roles/summaries/details, relation explanations, inference points, vocabulary meanings, discussion questions, and worksheet suggestions must be Korean.
Only schema enum ids such as narrative, cause_effect, compare_contrast, problem_solution, claim_evidence, sequence, and perspective_shift may remain in English.
Analyze the text for tutor-led context sketch lessons.
Focus on structure, inference points, relations, vocabulary, discussion questions, and worksheet suggestions.
The output should help a tutor design a session, not merely summarize the text.
Return only schema-compliant JSON.`;

export async function POST(request: Request) {
  try {
    const auth = await requireApiRole(["tutor"]);
    if (auth.error) {
      return auth.error;
    }

    const rateLimit = enforceRateLimit(
      `ai:analyze-text-structure:${auth.context.userId}`,
      AI_RATE_LIMIT
    );
    if (rateLimit) {
      return rateLimit;
    }

    const input = textStructureAnalysisInputSchema.parse(await request.json());
    const analysis = await createStructuredOutput({
      name: "text_structure_analysis",
      systemPrompt: SYSTEM_PROMPT,
      userPayload: input,
      jsonSchema: textStructureAnalysisJsonSchema,
      zodSchema: textStructureAnalysisSchema
    });

    return NextResponse.json({
      ok: true,
      model: openaiTextModel,
      analysis
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."
      },
      { status: 400 }
    );
  }
}

