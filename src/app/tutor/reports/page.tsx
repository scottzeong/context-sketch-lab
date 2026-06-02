import { AppShell } from "@/components/AppShell";
import { StudentReports } from "@/components/StudentReports";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function TutorReportsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };
  const isAdmin = profile?.role === "admin";

  return (
    <AppShell
      title="Reports"
      eyebrow={isAdmin ? "Admin Reference" : "Tutor Workspace"}
      description={
        isAdmin
          ? "관리자는 공개 피드백 기반 리포트를 참조만 합니다."
          : "공개 피드백을 바탕으로 학생별 성장 리포트와 공유용 초안을 확인합니다."
      }
    >
      <StudentReports readOnly={isAdmin} />
    </AppShell>
  );
}
