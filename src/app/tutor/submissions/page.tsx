import { AppShell } from "@/components/AppShell";
import { TutorSubmissions } from "@/components/TutorSubmissions";

export default function TutorSubmissionsPage() {
  return (
    <AppShell
      title="Submissions"
      eyebrow="Tutor Workspace"
      description="학생이 제출한 스케치 사진과 설명을 확인하고 다음 리뷰 단계로 넘깁니다."
    >
      <TutorSubmissions />
    </AppShell>
  );
}
