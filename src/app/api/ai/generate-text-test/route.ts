import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/api/auth";
import { enforceRateLimit } from "@/lib/api/rateLimit";
import { createStructuredOutput } from "@/lib/ai/structuredOutput";
import { openaiTextModel } from "@/lib/ai/openai";
import {
  generatedTextJsonSchema,
  generatedTextSchema,
  textGenerationInputSchema
} from "@/lib/schemas/textGeneration";

export const runtime = "nodejs";
const AI_RATE_LIMIT = { limit: 20, windowMs: 60_000 };

const SYSTEM_PROMPT = `You are the Text Generator Agent for Roter Faden.

Create a Korean learning text for tutor-led reading lessons.
Write every human-readable field in Korean.
The title, body, tutorRevisionNotes, and safetyNotes must be Korean.
Only schema enum ids such as AGE_9_10 or cause_effect may remain in English.
The text should fit the tutor's topic, age range, difficulty, length, structure, learning goal, and tone.
If textStructurePrompt is provided, treat it as the admin-defined instruction for the selected writing structure and follow it closely.
Target length is a hard requirement. Interpret Korean values like "600자" as the target number of Korean characters for body only, excluding title and notes.
The body length must stay within +/-10% of the target character count whenever a numeric target is provided.
Before returning, mentally count and revise the body if it is clearly outside the requested range.
Do not over-explain the lesson inside the story.
Avoid moralizing endings unless requested.
Return a practical draft a tutor can edit quickly.`;

export async function POST(request: Request) {
  try {
    const auth = await requireApiRole(["tutor"]);
    if (auth.error) {
      return auth.error;
    }

    const rateLimit = enforceRateLimit(
      `ai:generate-text:${auth.context.userId}`,
      AI_RATE_LIMIT
    );
    if (rateLimit) {
      return rateLimit;
    }

    const input = textGenerationInputSchema.parse(await request.json());
    const { data: structureOptions } = await auth.context.supabase
      .from("config_options")
      .select("*")
      .eq("category", "text_structure")
      .eq("value", input.textStructure)
      .eq("is_active", true)
      .limit(1);
    const textStructurePrompt =
      (structureOptions?.[0] as { prompt_text?: string | null } | undefined)?.prompt_text || "";

    const generatedText = await createStructuredOutput({
      name: "generated_learning_text",
      systemPrompt: SYSTEM_PROMPT,
      userPayload: {
        ...input,
        textStructurePrompt
      },
      jsonSchema: generatedTextJsonSchema,
      zodSchema: generatedTextSchema
    });

    return NextResponse.json({
      ok: true,
      model: openaiTextModel,
      generatedText
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
