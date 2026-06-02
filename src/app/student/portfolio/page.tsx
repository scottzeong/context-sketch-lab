import { StudentPortfolio } from "@/components/StudentPortfolio";
import { StudentShell } from "@/components/StudentShell";

export default function StudentPortfolioPage() {
  return (
    <StudentShell
      title="Portfolio"
      description="튜터가 공개한 피드백과 학습 기록을 차곡차곡 모아 봅니다."
    >
      <StudentPortfolio />
    </StudentShell>
  );
}
