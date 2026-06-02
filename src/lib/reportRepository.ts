import { requireCurrentProfile } from "@/lib/supabase/currentUser";

export type StoredReportDraft = {
  id: string;
  studentId?: string;
  studentName: string;
  title: string;
  body: string;
  periodStart?: string;
  periodEnd?: string;
  updatedAt: string;
};

function mapReport(row: {
  id: string;
  student_id: string | null;
  student_name: string;
  title: string;
  body: string;
  period_start: string | null;
  period_end: string | null;
  updated_at: string;
}): StoredReportDraft {
  return {
    id: row.id,
    studentId: row.student_id || undefined,
    studentName: row.student_name,
    title: row.title,
    body: row.body,
    periodStart: row.period_start || undefined,
    periodEnd: row.period_end || undefined,
    updatedAt: row.updated_at
  };
}

export async function getReportDrafts(): Promise<StoredReportDraft[]> {
  const { supabase, profile } = await requireCurrentProfile();

  if (!["admin", "tutor"].includes(profile.role)) {
    throw new Error("리포트 초안은 튜터와 관리자만 볼 수 있습니다.");
  }

  const { data, error } = await supabase
    .from("report_drafts")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map(mapReport);
}

export async function saveReportDraft(input: {
  studentId?: string;
  studentName: string;
  title: string;
  body: string;
  periodStart?: string;
  periodEnd?: string;
}): Promise<StoredReportDraft> {
  const { supabase, user, profile } = await requireCurrentProfile();

  if (!["admin", "tutor"].includes(profile.role)) {
    throw new Error("리포트 초안은 튜터와 관리자만 저장할 수 있습니다.");
  }

  const { data, error } = await supabase
    .from("report_drafts")
    .upsert(
      {
        organization_id: profile.organization_id,
        student_id: input.studentId || null,
        student_name: input.studentName,
        title: input.title,
        body: input.body,
        period_start: input.periodStart || null,
        period_end: input.periodEnd || null,
        created_by: user.id,
        updated_at: new Date().toISOString()
      },
      { onConflict: "organization_id,student_name" }
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapReport(data);
}
