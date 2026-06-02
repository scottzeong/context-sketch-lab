import { StudentDashboard } from "@/components/StudentDashboard";
import { StudentShell } from "@/components/StudentShell";

export default function StudentDashboardPage() {
  return (
    <StudentShell
      title="Student Dashboard"
      description="튜터가 공개한 세션을 확인하고, 작성한 맥락 스케치를 제출합니다."
    >
      <StudentDashboard />
    </StudentShell>
  );
}
