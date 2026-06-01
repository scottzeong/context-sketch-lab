import { AppShell } from "@/components/AppShell";
import { SessionBuilder } from "@/components/SessionBuilder";

export default function NewTutorSessionPage() {
  return (
    <AppShell
      title="Session Builder"
      eyebrow="Tutor Workspace"
      description="Text 저장소에 보관한 글을 선택하고 학습 목표, 활동지 템플릿, 배포 그룹을 묶어 세션을 만듭니다."
    >
      <SessionBuilder />
    </AppShell>
  );
}
