import { requireCurrentProfile } from "@/lib/supabase/currentUser";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type WorksheetTemplateType =
  | "basic"
  | "cause_effect"
  | "compare_contrast"
  | "problem_solution"
  | "claim_evidence";

export type StoredSessionRecord = {
  id: string;
  title: string;
  textId: string;
  textTitle: string;
  groupId?: string;
  learningGoal: string;
  worksheetTemplate: WorksheetTemplateType;
  groupName: string;
  status: "draft" | "published" | "closed";
  scheduledFor?: string;
  createdAt: string;
  updatedAt: string;
};

type SessionRow = {
  id: string;
  title: string;
  text_id: string | null;
  texts?: { title: string | null } | null;
  learning_group_id: string | null;
  learning_goal: string | null;
  worksheet_template: string | null;
  group_name: string | null;
  status: "draft" | "published" | "closed";
  scheduled_for: string | null;
  created_at: string;
  updated_at: string;
};

function emitSessionRepositoryChange() {
  window.dispatchEvent(new Event("session-repository-change"));
}

function mapSession(row: SessionRow): StoredSessionRecord {
  return {
    id: row.id,
    title: row.title,
    textId: row.text_id || "",
    textTitle: row.texts?.title || "Untitled text",
    groupId: row.learning_group_id || undefined,
    learningGoal: row.learning_goal || "",
    worksheetTemplate: (row.worksheet_template || "basic") as WorksheetTemplateType,
    groupName: row.group_name || "",
    status: row.status,
    scheduledFor: row.scheduled_for || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function getStoredSessions(): Promise<StoredSessionRecord[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("learning_sessions")
    .select("*, texts(title)")
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data || []) as unknown as SessionRow[]).map(mapSession);
}

export async function saveStoredSession(
  record: Omit<StoredSessionRecord, "id" | "createdAt" | "updatedAt"> & {
    id?: string;
  }
) {
  const { supabase, user, profile } = await requireCurrentProfile();
  const now = new Date().toISOString();
  const publishedAt = record.status === "published" ? now : null;

  const basePayload = {
    title: record.title,
    learning_group_id: record.groupId || null,
    text_id: record.textId || null,
    learning_goal: record.learningGoal || null,
    worksheet_template: record.worksheetTemplate,
    group_name: record.groupName || null,
    status: record.status,
    scheduled_for: record.scheduledFor || null,
    published_at: publishedAt,
    updated_at: now
  };

  const query = record.id
    ? supabase
        .from("learning_sessions")
        .update(basePayload)
        .eq("id", record.id)
        .select("*, texts(title)")
        .single()
    : supabase
        .from("learning_sessions")
        .insert({
          ...basePayload,
          organization_id: profile.organization_id,
          created_by: user.id
        })
        .select("*, texts(title)")
        .single();

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  emitSessionRepositoryChange();
  return mapSession(data as unknown as SessionRow);
}

export async function updateStoredSessionStatus(
  id: string,
  status: StoredSessionRecord["status"]
) {
  const supabase = createSupabaseBrowserClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("learning_sessions")
    .update({
      status,
      published_at: status === "published" ? now : null,
      updated_at: now
    })
    .eq("id", id)
    .select("*, texts(title)")
    .single();

  if (error) {
    throw error;
  }

  emitSessionRepositoryChange();
  return mapSession(data as unknown as SessionRow);
}

export async function deleteStoredSession(id: string) {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from("learning_sessions").delete().eq("id", id);

  if (error) {
    throw error;
  }

  emitSessionRepositoryChange();
}
