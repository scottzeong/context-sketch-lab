import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { requireCurrentProfile } from "@/lib/supabase/currentUser";

export type StoredTutorReviewRecord = {
  id: string;
  submissionId: string;
  tutorObservation: string;
  keyConnections: string[];
  strengths: string[];
  misconceptions: string[];
  nextStep: string;
  evaluationJson?: unknown;
  feedbackDraft?: {
    studentFacing: string;
    tutorNotes: string;
    parentSummary: string;
  };
  status: "draft" | "ai_drafted" | "approved" | "published";
  createdAt: string;
  updatedAt: string;
};

type ReviewRow = {
  id: string;
  submission_id: string;
  observation: string | null;
  key_connections: string[];
  strengths: string[];
  misconceptions: string[];
  next_step: string | null;
  review_status: "draft" | "ai_drafted" | "approved" | "published";
  created_at: string;
  updated_at: string;
  feedbacks?: Array<{
    student_facing: string | null;
    tutor_notes: string | null;
    parent_summary: string | null;
    ai_draft_json: unknown | null;
  }> | null;
};

function emitReviewRepositoryChange() {
  window.dispatchEvent(new Event("review-repository-change"));
}

function mapReview(row: ReviewRow): StoredTutorReviewRecord {
  const feedback = row.feedbacks?.[0];

  return {
    id: row.id,
    submissionId: row.submission_id,
    tutorObservation: row.observation || "",
    keyConnections: row.key_connections || [],
    strengths: row.strengths || [],
    misconceptions: row.misconceptions || [],
    nextStep: row.next_step || "",
    evaluationJson: feedback?.ai_draft_json || undefined,
    feedbackDraft: feedback
      ? {
          studentFacing: feedback.student_facing || "",
          tutorNotes: feedback.tutor_notes || "",
          parentSummary: feedback.parent_summary || ""
        }
      : undefined,
    status: row.review_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function selectReviews(submissionId?: string) {
  const supabase = createSupabaseBrowserClient();
  let query = supabase
    .from("tutor_reviews")
    .select(
      "*, feedbacks(student_facing, tutor_notes, parent_summary, ai_draft_json)"
    )
    .order("updated_at", { ascending: false });

  if (submissionId) {
    query = query.eq("submission_id", submissionId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return ((data || []) as unknown as ReviewRow[]).map(mapReview);
}

export async function getStoredTutorReviews(): Promise<StoredTutorReviewRecord[]> {
  return selectReviews();
}

export async function getReviewForSubmission(submissionId: string) {
  const [review] = await selectReviews(submissionId);
  return review || null;
}

export async function saveStoredTutorReview(
  record: Omit<StoredTutorReviewRecord, "id" | "createdAt" | "updatedAt"> & {
    id?: string;
  }
) {
  const { supabase, user } = await requireCurrentProfile();
  const now = new Date().toISOString();
  const basePayload = {
    observation: record.tutorObservation || null,
    key_connections: record.keyConnections,
    strengths: record.strengths,
    misconceptions: record.misconceptions,
    next_step: record.nextStep || null,
    review_status: record.status,
    updated_at: now
  };

  const query = record.id
    ? supabase
        .from("tutor_reviews")
        .update(basePayload)
        .eq("id", record.id)
        .select(
          "*, feedbacks(student_facing, tutor_notes, parent_summary, ai_draft_json)"
        )
        .single()
    : supabase
        .from("tutor_reviews")
        .insert({
          ...basePayload,
          submission_id: record.submissionId,
          tutor_id: user.id
        })
        .select(
          "*, feedbacks(student_facing, tutor_notes, parent_summary, ai_draft_json)"
        )
        .single();

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const savedReview = data as unknown as ReviewRow;

  if (record.feedbackDraft || record.evaluationJson) {
    const feedbackStatus: "draft" | "published" =
      record.status === "published" ? "published" : "draft";
    const feedbackPayload = {
      tutor_review_id: savedReview.id,
      student_facing: record.feedbackDraft?.studentFacing || null,
      tutor_notes: record.feedbackDraft?.tutorNotes || null,
      parent_summary: record.feedbackDraft?.parentSummary || null,
      ai_draft_json: record.evaluationJson || null,
      status: feedbackStatus,
      published_at: record.status === "published" ? now : null,
      updated_at: now
    };

    const existing = savedReview.feedbacks?.[0];
    const feedbackQuery = existing
      ? supabase
          .from("feedbacks")
          .update(feedbackPayload)
          .eq("tutor_review_id", savedReview.id)
      : supabase
          .from("feedbacks")
          .insert({ ...feedbackPayload, submission_id: record.submissionId });

    const { error: feedbackError } = await feedbackQuery;

    if (feedbackError) {
      throw feedbackError;
    }
  }

  emitReviewRepositoryChange();
  const fresh = await getReviewForSubmission(record.submissionId);
  return fresh || mapReview(savedReview);
}
