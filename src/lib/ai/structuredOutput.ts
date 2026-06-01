import { z } from "zod";
import { getOpenAIClient, openaiTextModel } from "@/lib/ai/openai";

type StructuredOutputParams<TSchema extends z.ZodTypeAny> = {
  name: string;
  systemPrompt: string;
  userPayload: unknown;
  jsonSchema: Record<string, unknown>;
  zodSchema: TSchema;
};

function getResponseText(response: unknown) {
  const maybeOutputText = response as { output_text?: string };

  if (typeof maybeOutputText.output_text === "string") {
    return maybeOutputText.output_text;
  }

  const output = (response as { output?: Array<{ content?: unknown[] }> }).output;
  const textParts =
    output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => {
        const part = content as { type?: string; text?: string };
        return part.type === "output_text" ? part.text : undefined;
      })
      .filter(Boolean) ?? [];

  return textParts.join("");
}

export async function createStructuredOutput<TSchema extends z.ZodTypeAny>({
  name,
  systemPrompt,
  userPayload,
  jsonSchema,
  zodSchema
}: StructuredOutputParams<TSchema>): Promise<z.infer<TSchema>> {
  const client = getOpenAIClient();

  const response = await client.responses.create({
    model: openaiTextModel,
    input: [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: JSON.stringify(userPayload, null, 2)
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name,
        strict: true,
        schema: jsonSchema
      }
    }
  });

  const rawText = getResponseText(response);
  const json = JSON.parse(rawText);

  return zodSchema.parse(json);
}
