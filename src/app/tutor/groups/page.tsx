import { AppShell } from "@/components/AppShell";
import { GroupManager } from "@/components/GroupManager";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function TutorGroupsPage() {
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
      title="Groups"
      eyebrow={isAdmin ? "Admin Reference" : "Tutor Workspace"}
      description={
        isAdmin
          ? "관리자는 그룹과 학생 배정 현황을 참조만 합니다."
          : "수업 그룹을 만들고 학생을 배정해 세션 배포 대상을 관리합니다."
      }
    >
      <GroupManager readOnly={isAdmin} />
    </AppShell>
  );
}
