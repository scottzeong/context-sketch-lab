import { AppShell } from "@/components/AppShell";
import { TutorAIWorkbench } from "@/components/TutorAIWorkbench";

export default function TutorWorkbenchPage() {
  return (
    <AppShell
      title="AI Workbench"
      eyebrow="TUTOR WORKSPACE"
      description="글 생성, 직접 입력, 구조 분석, 저장 흐름을 한 화면에서 진행합니다."
    >
      <TutorAIWorkbench />
    </AppShell>
  );
}
