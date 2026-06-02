import Link from "next/link";
import { FilePlus2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TextRepository } from "@/components/TextRepository";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function TutorTextsPage() {
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
      title="Texts"
      eyebrow={isAdmin ? "Admin Reference" : "Tutor Workspace"}
      description={
        isAdmin
          ? "관리자는 저장된 글과 구조 분석 결과를 참조만 합니다."
          : "AI 생성 글, 튜터 작성 글, 구조 분석 결과를 관리합니다."
      }
      action={
        !isAdmin ? (
          <Link className="primary-link" href="/tutor/workbench">
            <FilePlus2 aria-hidden="true" size={18} />
            <span>글 작성</span>
          </Link>
        ) : null
      }
    >
      <TextRepository readOnly={isAdmin} />
    </AppShell>
  );
}
