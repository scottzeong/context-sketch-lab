import Link from "next/link";
import { FilePlus2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TextRepository } from "@/components/TextRepository";

export default function TutorTextsPage() {
  return (
    <AppShell
      title="Texts"
      eyebrow="Tutor Workspace"
      description="AI 생성 글, 튜터 작성 글, 구조 분석 결과를 관리하는 화면입니다."
      action={
        <Link className="primary-link" href="/tutor/workbench">
          <FilePlus2 aria-hidden="true" size={18} />
          <span>AI 글 생성</span>
        </Link>
      }
    >
      <TextRepository />
    </AppShell>
  );
}
