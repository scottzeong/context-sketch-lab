import { StudentSessionDetail } from "@/components/StudentSessionDetail";
import { StudentShell } from "@/components/StudentShell";

type StudentSessionPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default async function StudentSessionPage({
  params
}: StudentSessionPageProps) {
  const { sessionId } = await params;

  return (
    <StudentShell
      title="Reading Session"
      description="글을 읽고 종이에 맥락 스케치를 작성한 뒤 제출합니다."
    >
      <StudentSessionDetail sessionId={sessionId} />
    </StudentShell>
  );
}
