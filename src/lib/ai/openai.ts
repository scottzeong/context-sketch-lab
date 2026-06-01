import OpenAI from "openai";

let cachedClient: OpenAI | null = null;

export function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  cachedClient ??= new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  return cachedClient;
}

export const openaiTextModel =
  process.env.OPENAI_TEXT_MODEL?.trim() || "gpt-4.1-mini";
