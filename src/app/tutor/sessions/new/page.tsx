import { AppShell } from "@/components/AppShell";
import { SessionBuilder } from "@/components/SessionBuilder";

export default function NewSessionPage() {
  return (
    <AppShell
      title="New Session"
      eyebrow="Tutor Workspace"
      description="Text 저장소에 보관한 글을 선택하고 학습 목표, 활동지 템플릿, 배포 Class를 묶어 세션을 만듭니다."
    >
      <SessionBuilder />
    </AppShell>
  );
}
