import { StudentPortfolio } from "@/components/StudentPortfolio";
import { StudentShell } from "@/components/StudentShell";

export default function StudentPortfolioPage() {
  return (
    <StudentShell
      title="Portfolio"
      description="튜터가 승인한 피드백과 학습 기록이 차곡차곡 쌓입니다."
    >
      <StudentPortfolio />
    </StudentShell>
  );
}
