import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { requireCurrentProfile } from "@/lib/supabase/currentUser";

const SUBMISSION_IMAGES_BUCKET = "submission-images";

export type StoredSubmissionRecord = {
  id: string;
  sessionId: string;
  sessionTitle: string;
  studentName: string;
  studentExplanation: string;
  importantConnection: string;
  difficultPart: string;
  imageName?: string;
  imageDataUrl?: string;
  imagePath?: string;
  status: "submitted" | "under_review" | "feedback_published";
  submittedAt: string;
  updatedAt: string;
};

type SubmissionRow = {
  id: string;
  session_id: string;
  learning_sessions?: { title: string | null } | null;
  student_name: string | null;
  student_explanation: string | null;
  important_connection: string | null;
  difficult_part: string | null;
  status: "submitted" | "under_review" | "feedback_published";
  submitted_at: string | null;
  updated_at: string;
  submission_images?: Array<{ storage_path: string }> | null;
};

function emitSubmissionRepositoryChange() {
  window.dispatchEvent(new Event("submission-repository-change"));
}

async function signedImageUrl(path?: string) {
  if (!path) {
    return undefined;
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.storage
    .from(SUBMISSION_IMAGES_BUCKET)
    .createSignedUrl(path, 60 * 30);

  if (error) {
    return undefined;
  }

  return data.signedUrl;
}

async function mapSubmission(row: SubmissionRow): Promise<StoredSubmissionRecord> {
  const imagePath = row.submission_images?.[0]?.storage_path;

  return {
    id: row.id,
    sessionId: row.session_id,
    sessionTitle: row.learning_sessions?.title || "Untitled session",
    studentName: row.student_name || "Student",
    studentExplanation: row.student_explanation || "",
    importantConnection: row.important_connection || "",
    difficultPart: row.difficult_part || "",
    imageName: imagePath?.split("/").pop(),
    imagePath,
    imageDataUrl: await signedImageUrl(imagePath),
    status: row.status,
    submittedAt: row.submitted_at || row.updated_at,
    updatedAt: row.updated_at
  };
}

async function selectSubmissions(sessionId?: string) {
  const supabase = createSupabaseBrowserClient();
  let query = supabase
    .from("submissions")
    .select("*, learning_sessions(title), submission_images(storage_path)")
    .order("updated_at", { ascending: false });

  if (sessionId) {
    query = query.eq("session_id", sessionId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return Promise.all(((data || []) as unknown as SubmissionRow[]).map(mapSubmission));
}

export async function getStoredSubmissions(): Promise<StoredSubmissionRecord[]> {
  return selectSubmissions();
}

export async function getSubmissionsForSession(sessionId: string) {
  return selectSubmissions(sessionId);
}

export async function saveStoredSubmission(
  record: Omit<
    StoredSubmissionRecord,
    "id" | "submittedAt" | "updatedAt" | "imageDataUrl" | "imagePath"
  > & {
    id?: string;
    imageFile?: File | null;
  }
) {
  const { supabase, user, profile } = await requireCurrentProfile();
  const now = new Date().toISOString();
  const basePayload = {
    student_explanation: record.studentExplanation || null,
    important_connection: record.importantConnection || null,
    difficult_part: record.difficultPart || null,
    status: record.status,
    updated_at: now
  };

  const query = record.id
    ? supabase
        .from("submissions")
        .update(basePayload)
        .eq("id", record.id)
        .select("*, learning_sessions(title), submission_images(storage_path)")
        .single()
    : supabase
        .from("submissions")
        .insert({
          ...basePayload,
          session_id: record.sessionId,
          student_id: user.id,
          student_name: record.studentName || profile.display_name || user.email,
          submitted_at: now
        })
        .select("*, learning_sessions(title), submission_images(storage_path)")
        .single();

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const submission = data as unknown as SubmissionRow;

  if (record.imageFile) {
    const safeName = record.imageFile.name.replace(/[^\w.\-]+/g, "_");
    const path = `${profile.organization_id}/${record.sessionId}/${user.id}/${submission.id}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from(SUBMISSION_IMAGES_BUCKET)
      .upload(path, record.imageFile, { upsert: true });

    if (uploadError) {
      throw uploadError;
    }

    const { error: imageError } = await supabase.from("submission_images").insert({
      submission_id: submission.id,
      storage_path: path,
      image_kind: "original"
    });

    if (imageError) {
      throw imageError;
    }
  }

  emitSubmissionRepositoryChange();
  const [fresh] = await selectSubmissions(record.sessionId);
  return fresh;
}

export async function updateStoredSubmissionStatus(
  id: string,
  status: StoredSubmissionRecord["status"]
) {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("submissions")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*, learning_sessions(title), submission_images(storage_path)")
    .single();

  if (error) {
    throw error;
  }

  emitSubmissionRepositoryChange();
  return mapSubmission(data as unknown as SubmissionRow);
}
