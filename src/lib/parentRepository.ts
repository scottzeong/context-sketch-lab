import {
  getPublishedFeedbackForSubmission,
  PortfolioEntry
} from "@/lib/portfolioRepository";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getStoredSubmissions } from "@/lib/submissionRepository";

export type ParentStudentRecord = {
  id: string;
  displayName: string;
  email: string;
};

export async function getLinkedParentStudents(): Promise<ParentStudentRecord[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("parent_student_links")
    .select("student_id, profiles!parent_student_links_student_id_fkey(id, display_name, email)")
    .eq("status", "approved");

  if (error) {
    throw error;
  }

  return ((data || []) as unknown as Array<{
    student_id: string;
    profiles?: { id: string; display_name: string | null; email: string | null } | null;
  }>).map((row) => ({
    id: row.student_id,
    displayName: row.profiles?.display_name || row.profiles?.email || "Student",
    email: row.profiles?.email || ""
  }));
}

export async function getParentPortfolioEntries(): Promise<PortfolioEntry[]> {
  const submissions = await getStoredSubmissions();
  const entries = await Promise.all(
    submissions
      .filter((submission) => submission.status === "feedback_published")
      .map((submission) => getPublishedFeedbackForSubmission(submission.id))
  );

  return entries.filter((entry): entry is PortfolioEntry => Boolean(entry));
}
