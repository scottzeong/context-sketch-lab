import { StudentShell } from "@/components/StudentShell";
import { StudentSubmissionForm } from "@/components/StudentSubmissionForm";

type StudentSubmitPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default async function StudentSubmitPage({ params }: StudentSubmitPageProps) {
  const { sessionId } = await params;

  return (
    <StudentShell
      title="스케치 제출"
      description="스케치 사진과 짧은 설명을 제출하면 튜터 검토 대기 상태로 저장됩니다."
    >
      <StudentSubmissionForm sessionId={sessionId} />
    </StudentShell>
  );
}
