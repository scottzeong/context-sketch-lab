import { ParentShell } from "@/components/ParentShell";
import { StudentFeedbackDetail } from "@/components/StudentFeedbackDetail";

type ParentFeedbackPageProps = {
  params: Promise<{
    submissionId: string;
  }>;
};

export default async function ParentFeedbackPage({
  params
}: ParentFeedbackPageProps) {
  const { submissionId } = await params;

  return (
    <ParentShell
      title="Student Feedback"
      description="튜터가 공개한 학생 피드백과 다음 과제를 확인합니다."
    >
      <StudentFeedbackDetail submissionId={submissionId} />
    </ParentShell>
  );
}
