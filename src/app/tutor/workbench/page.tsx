import { AppShell } from "@/components/AppShell";
import { TutorAIWorkbench } from "@/components/TutorAIWorkbench";

export default function TutorWorkbenchPage() {
  return (
    <AppShell
      title="Tutor AI Workbench"
      eyebrow="Phase 0 Text AI"
      description="글 생성, 글 구조 분석, 튜터 피드백 기반 평가 초안을 한 흐름에서 검증합니다."
    >
      <TutorAIWorkbench />
    </AppShell>
  );
}
