import { FilePlus2 } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { SessionRepository } from "@/components/SessionRepository";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function TutorSessionsPage() {
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
      title="Sessions"
      eyebrow={isAdmin ? "Admin Reference" : "Tutor Workspace"}
      description={
        isAdmin
          ? "관리자는 세션 목록과 상태를 참조만 합니다."
          : "저장된 글을 수업 세션으로 만들고 공개 상태를 관리합니다."
      }
      action={
        !isAdmin ? (
          <Link className="primary-link" href="/tutor/sessions/new">
            <FilePlus2 aria-hidden="true" size={18} />
            <span>새 세션</span>
          </Link>
        ) : null
      }
    >
      <SessionRepository readOnly={isAdmin} />
    </AppShell>
  );
}
