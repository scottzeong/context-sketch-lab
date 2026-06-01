import { AppShell } from "@/components/AppShell";
import { AdminUsers } from "@/components/AdminUsers";

export default function AdminUsersPage() {
  return (
    <AppShell
      title="User Management"
      eyebrow="Admin"
      description="현재 organization의 사용자 role, 표시 이름, 학습 정보를 관리합니다."
    >
      <AdminUsers />
    </AppShell>
  );
}
