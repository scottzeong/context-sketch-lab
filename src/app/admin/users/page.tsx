import { AppShell } from "@/components/AppShell";
import { AdminUsers } from "@/components/AdminUsers";

export default function AdminUsersPage() {
  return (
    <AppShell
      title="Set Management"
      eyebrow="Admin"
      description="운영 옵션, 루브릭, 사용자 권한을 관리합니다."
    >
      <AdminUsers />
    </AppShell>
  );
}
