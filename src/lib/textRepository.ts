import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { requireCurrentProfile } from "@/lib/supabase/currentUser";

export type StoredTextRecord = {
  id: string;
  title: string;
  body: string;
  ageRange: string;
  difficultyLevel: string;
  textType: string;
  structureType: string;
  status: "draft" | "approved" | "archived";
  sourceType: "ai_generated" | "tutor_written" | "imported";
  learningGoal?: string;
  analysisJson?: unknown;
  createdAt: string;
  updatedAt: string;
};

function mapText(row: {
  id: string;
  title: string;
  body: string;
  age_range: string | null;
  difficulty_level: string | null;
  text_type: string | null;
  structure_type: string | null;
  status: "draft" | "approved" | "archived";
  source_type: "ai_generated" | "tutor_written" | "imported";
  created_at: string;
  updated_at: string;
  text_analyses?: Array<{
    learning_goal: string | null;
    analysis_json: unknown;
  }>;
}): StoredTextRecord {
  const latestAnalysis = row.text_analyses?.[0];

  return {
    id: row.id,
    title: row.title,
    body: row.body,
    ageRange: row.age_range || "",
    difficultyLevel: row.difficulty_level || "",
    textType: row.text_type || "",
    structureType: row.structure_type || "",
    status: row.status,
    sourceType: row.source_type,
    learningGoal: latestAnalysis?.learning_goal || undefined,
    analysisJson: latestAnalysis?.analysis_json,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function getStoredTexts(): Promise<StoredTextRecord[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("texts")
    .select(
      "*, text_analyses(learning_goal, analysis_json, created_at)"
    )
    .order("updated_at", { ascending: false })
    .order("created_at", {
      ascending: false,
      referencedTable: "text_analyses"
    });

  if (error) {
    throw error;
  }

  return (data || []).map(mapText);
}

export async function saveStoredText(
  record: Omit<StoredTextRecord, "id" | "createdAt" | "updatedAt"> & {
    id?: string;
  }
) {
  const { supabase, user, profile } = await requireCurrentProfile();
  const now = new Date().toISOString();
  const basePayload = {
    title: record.title,
    body: record.body,
    source_type: record.sourceType,
    age_range: record.ageRange,
    difficulty_level: record.difficultyLevel,
    text_type: record.textType,
    structure_type: record.structureType,
    status: record.status,
    updated_at: now
  };

  const { data: text, error } = record.id
    ? await supabase.from("texts").update(basePayload).eq("id", record.id).select("*").single()
    : await supabase
        .from("texts")
        .insert({
          ...basePayload,
          organization_id: profile.organization_id,
          created_by: user.id
        })
        .select("*")
        .single();

  if (error) {
    throw error;
  }

  if (record.analysisJson) {
    const { error: analysisError } = await supabase.from("text_analyses").insert({
      text_id: text.id,
      analysis_json: record.analysisJson,
      structure_type: record.structureType,
      learning_goal: record.learningGoal || null,
      created_by: user.id
    });

    if (analysisError) {
      throw analysisError;
    }
  }

  return mapText({
    ...text,
    text_analyses: record.analysisJson
      ? [
          {
            learning_goal: record.learningGoal || null,
            analysis_json: record.analysisJson
          }
        ]
      : []
  });
}

export async function deleteStoredText(id: string) {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from("texts").delete().eq("id", id);

  if (error) {
    throw error;
  }
}
