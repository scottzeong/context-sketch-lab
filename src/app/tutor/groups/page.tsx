import { AppShell } from "@/components/AppShell";
import { GroupManager } from "@/components/GroupManager";

export default function TutorGroupsPage() {
  return (
    <AppShell
      title="Groups"
      eyebrow="Tutor Workspace"
      description="수업 그룹을 만들고 학생을 배정해 세션 배포 대상을 관리합니다."
    >
      <GroupManager />
    </AppShell>
  );
}
