import { FilePlus2 } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { SessionRepository } from "@/components/SessionRepository";

export default function TutorSessionsPage() {
  return (
    <AppShell
      title="Sessions"
      eyebrow="Tutor Workspace"
      description="저장된 글을 수업 세션으로 만들고 draft, published, closed 상태를 관리합니다."
      action={
        <Link className="primary-link" href="/tutor/sessions/new">
          <FilePlus2 aria-hidden="true" size={18} />
          <span>새 세션</span>
        </Link>
      }
    >
      <SessionRepository />
    </AppShell>
  );
}
