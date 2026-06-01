import { StudentFeedbackDetail } from "@/components/StudentFeedbackDetail";
import { StudentShell } from "@/components/StudentShell";

type StudentFeedbackPageProps = {
  params: Promise<{
    submissionId: string;
  }>;
};

export default async function StudentFeedbackPage({
  params
}: StudentFeedbackPageProps) {
  const { submissionId } = await params;

  return (
    <StudentShell
      title="Feedback"
      description="튜터가 승인한 피드백을 확인하고 다음 학습 방향을 살펴봅니다."
    >
      <StudentFeedbackDetail submissionId={submissionId} />
    </StudentShell>
  );
}
