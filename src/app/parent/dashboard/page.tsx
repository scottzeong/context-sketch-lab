import { ParentDashboard } from "@/components/ParentDashboard";
import { ParentShell } from "@/components/ParentShell";

export default function ParentDashboardPage() {
  return (
    <ParentShell
      title="Parent Dashboard"
      description="연결된 학생의 공개 피드백과 성장 기록을 확인합니다."
    >
      <ParentDashboard />
    </ParentShell>
  );
}
