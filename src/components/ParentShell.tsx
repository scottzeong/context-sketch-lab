import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";

type ParentShellProps = {
  children: ReactNode;
  title: string;
  eyebrow?: string;
  description?: string;
};

export function ParentShell({
  children,
  title,
  eyebrow = "Parent Workspace",
  description
}: ParentShellProps) {
  return (
    <AppShell title={title} eyebrow={eyebrow} description={description}>
      {children}
    </AppShell>
  );
}
