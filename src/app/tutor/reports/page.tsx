import { AppShell } from "@/components/AppShell";
import { StudentReports } from "@/components/StudentReports";

export default function TutorReportsPage() {
  return (
    <AppShell
      title="Reports"
      eyebrow="Tutor Workspace"
      description="공개된 피드백을 바탕으로 학생별 성장 리포트와 학부모 공유용 초안을 확인합니다."
    >
      <StudentReports />
    </AppShell>
  );
}
