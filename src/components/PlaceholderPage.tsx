import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";

type PlaceholderPageProps = {
  title: string;
  eyebrow: string;
  description: string;
  children?: ReactNode;
};

export function PlaceholderPage({
  title,
  eyebrow,
  description,
  children
}: PlaceholderPageProps) {
  return (
    <AppShell title={title} eyebrow={eyebrow} description={description}>
      <section className="panel empty-state">
        <strong>{title}</strong>
        <p>
          이 영역은 v1 개발 흐름에서 Supabase/Auth 연결 이후 실제 데이터와
          연결됩니다.
        </p>
        {children}
      </section>
    </AppShell>
  );
}
