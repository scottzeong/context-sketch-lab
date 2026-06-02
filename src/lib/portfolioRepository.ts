import type { StoredTutorReviewRecord } from "@/lib/reviewRepository";
import type { StoredSubmissionRecord } from "@/lib/submissionRepository";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const SUBMISSION_IMAGES_BUCKET = "submission-images";
const SIGNED_IMAGE_URL_TTL_SECONDS = 60 * 30;

type MaybeArray<T> = T | T[] | null | undefined;

type PortfolioFeedbackRow = {
  student_facing: string | null;
  parent_summary: string | null;
  ai_draft_json: unknown | null;
  status: "draft" | "approved" | "published";
};

type PortfolioReviewRow = {
  id: string;
  submission_id: string;
  observation: string | null;
  key_connections: string[] | null;
  strengths: string[] | null;
  misconceptions: string[] | null;
  next_step: string | null;
  review_status: "draft" | "ai_drafted" | "approved" | "published";
  created_at: string;
  updated_at: string;
  feedbacks?: MaybeArray<PortfolioFeedbackRow>;
};

type PortfolioSubmissionRow = {
  id: string;
  session_id: string;
  student_id: string | null;
  student_name: string | null;
  student_explanation: string | null;
  important_connection: string | null;
  difficult_part: string | null;
  status: "submitted" | "under_review" | "feedback_published";
  submitted_at: string | null;
  updated_at: string;
  learning_sessions?: MaybeArray<{ title: string | null }>;
  submission_images?: MaybeArray<{ storage_path: string }>;
  tutor_reviews?: MaybeArray<PortfolioReviewRow>;
};

export type PortfolioEntry = {
  submission: StoredSubmissionRecord;
  review: StoredTutorReviewRecord;
};

const publishedPortfolioSelect = `
  id,
  session_id,
  student_id,
  student_name,
  student_explanation,
  important_connection,
  difficult_part,
  status,
  submitted_at,
  updated_at,
  learning_sessions(title),
  submission_images(storage_path),
  tutor_reviews!inner(
    id,
    submission_id,
    observation,
    key_connections,
    strengths,
    misconceptions,
    next_step,
    review_status,
    created_at,
    updated_at,
    feedbacks!inner(student_facing, parent_summary, ai_draft_json, status)
  )
`;

function firstItem<T>(value: MaybeArray<T>): T | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value || undefined;
}

function getImagePath(row: PortfolioSubmissionRow) {
  return firstItem(row.submission_images)?.storage_path;
}

async function getSignedImageUrls(rows: PortfolioSubmissionRow[]) {
  const paths = Array.from(
    new Set(rows.map(getImagePath).filter((path): path is string => Boolean(path)))
  );

  if (!paths.length) {
    return new Map<string, string>();
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.storage
    .from(SUBMISSION_IMAGES_BUCKET)
    .createSignedUrls(paths, SIGNED_IMAGE_URL_TTL_SECONDS);

  if (error) {
    console.warn("Portfolio image signed URL failed", error.message);
    return new Map<string, string>();
  }

  return new Map(
    paths.map((path, index) => [path, data?.[index]?.signedUrl || ""])
  );
}

function mapPortfolioEntry(
  row: PortfolioSubmissionRow,
  signedImageUrls: Map<string, string>
): PortfolioEntry | null {
  const reviewRow = firstItem(row.tutor_reviews);
  const feedback = firstItem(reviewRow?.feedbacks);

  if (!reviewRow || !feedback) {
    return null;
  }

  const imagePath = getImagePath(row);
  const session = firstItem(row.learning_sessions);
  const submission: StoredSubmissionRecord = {
    id: row.id,
    sessionId: row.session_id,
    studentId: row.student_id || undefined,
    sessionTitle: session?.title || "제목 없는 세션",
    studentName: row.student_name || "학생",
    studentExplanation: row.student_explanation || "",
    importantConnection: row.important_connection || "",
    difficultPart: row.difficult_part || "",
    imageName: imagePath?.split("/").pop(),
    imagePath,
    imageDataUrl: imagePath ? signedImageUrls.get(imagePath) || undefined : undefined,
    status: row.status,
    submittedAt: row.submitted_at || row.updated_at,
    updatedAt: row.updated_at
  };

  const review: StoredTutorReviewRecord = {
    id: reviewRow.id,
    submissionId: reviewRow.submission_id,
    tutorObservation: reviewRow.observation || "",
    keyConnections: reviewRow.key_connections || [],
    strengths: reviewRow.strengths || [],
    misconceptions: reviewRow.misconceptions || [],
    nextStep: reviewRow.next_step || "",
    evaluationJson: feedback.ai_draft_json || undefined,
    feedbackDraft: {
      studentFacing: feedback.student_facing || "",
      tutorNotes: "",
      parentSummary: feedback.parent_summary || ""
    },
    status: reviewRow.review_status,
    createdAt: reviewRow.created_at,
    updatedAt: reviewRow.updated_at
  };

  return { submission, review };
}

async function selectPublishedPortfolioRows(submissionId?: string) {
  const supabase = createSupabaseBrowserClient();
  let query = supabase
    .from("submissions")
    .select(publishedPortfolioSelect)
    .eq("status", "feedback_published")
    .eq("tutor_reviews.review_status", "published")
    .eq("tutor_reviews.feedbacks.status", "published")
    .order("updated_at", { ascending: false });

  if (submissionId) {
    query = query.eq("id", submissionId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`포트폴리오를 불러오지 못했습니다. ${error.message}`);
  }

  return (data || []) as unknown as PortfolioSubmissionRow[];
}

export async function getPublishedPortfolioEntries(): Promise<PortfolioEntry[]> {
  const rows = await selectPublishedPortfolioRows();
  const signedImageUrls = await getSignedImageUrls(rows);

  return rows
    .map((row) => mapPortfolioEntry(row, signedImageUrls))
    .filter((entry): entry is PortfolioEntry => Boolean(entry));
}

export async function getPublishedFeedbackForSubmission(submissionId: string) {
  const rows = await selectPublishedPortfolioRows(submissionId);
  const signedImageUrls = await getSignedImageUrls(rows);
  const [entry] = rows
    .map((row) => mapPortfolioEntry(row, signedImageUrls))
    .filter((item): item is PortfolioEntry => Boolean(item));

  return entry || null;
}
