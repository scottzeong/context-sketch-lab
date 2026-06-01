import { NextResponse } from "next/server";
import { createStructuredOutput } from "@/lib/ai/structuredOutput";
import {
  generatedTextJsonSchema,
  generatedTextSchema,
  textGenerationInputSchema
} from "@/lib/schemas/textGeneration";
import { openaiTextModel } from "@/lib/ai/openai";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are the Text Generator Agent for Context Sketch Lab.

Create a Korean learning text for tutor-led reading lessons.
Write every human-readable field in Korean.
The title, body, tutorRevisionNotes, and safetyNotes must be Korean.
Only schema enum ids such as AGE_9_10 or cause_effect may remain in English.
The text should fit the tutor's topic, age range, difficulty, length, structure, learning goal, and tone.
Do not over-explain the lesson inside the story.
Avoid moralizing endings unless requested.
Return a practical draft a tutor can edit quickly.`;

export async function POST(request: Request) {
  try {
    const input = textGenerationInputSchema.parse(await request.json());
    const generatedText = await createStructuredOutput({
      name: "generated_learning_text",
      systemPrompt: SYSTEM_PROMPT,
      userPayload: input,
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
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 400 }
    );
  }
}
