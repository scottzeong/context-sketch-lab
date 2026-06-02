import { ClipboardCheck } from "lucide-react";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";

type StudentShellProps = {
  children: ReactNode;
  title: string;
  eyebrow?: string;
  description?: string;
  action?: ReactNode;
};

export function StudentShell({
  children,
  title,
  eyebrow = "Student Workspace",
  description,
  action
}: StudentShellProps) {
  return (
    <AppShell title={title} eyebrow={eyebrow} description={description} action={action}>
      <div className="student-reminder">
        <ClipboardCheck aria-hidden="true" size={18} />
        <p>
          종이에 그린 맥락 스케치는 튜터가 직접 확인합니다. AI는 그림을 판정하지 않고,
          글 생성과 구조 분석을 돕습니다.
        </p>
      </div>

      {children}
    </AppShell>
  );
}
