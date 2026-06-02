import {
  BookOpenText,
  ClipboardCheck,
  FolderOpen,
  Home,
  LibraryBig
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { UserAccountSummary } from "@/components/UserAccountSummary";

type StudentShellProps = {
  children: ReactNode;
  title: string;
  eyebrow?: string;
  description?: string;
  action?: ReactNode;
};

export async function StudentShell({
  children,
  title,
  eyebrow = "Student Workspace",
  description,
  action
}: StudentShellProps) {
  return (
    <div className="student-shell">
      <header className="student-topbar">
        <Link className="student-brand" href="/student/dashboard">
          <span className="brand-mark">
            <Image src="/brand/logo-mark.svg" alt="" width={38} height={38} priority />
          </span>
          <span>
            <strong>Roter Faden</strong>
            <small>Student</small>
          </span>
        </Link>
        <nav className="student-nav" aria-label="Student navigation">
          <Link href="/student/dashboard">
            <Home aria-hidden="true" size={17} />
            Home
          </Link>
          <Link href="/student/dashboard">
            <BookOpenText aria-hidden="true" size={17} />
            Sessions
          </Link>
          <Link href="/student/portfolio">
            <FolderOpen aria-hidden="true" size={17} />
            Portfolio
          </Link>
          <Link href="/manual">
            <LibraryBig aria-hidden="true" size={17} />
            Manual
          </Link>
        </nav>
        <UserAccountSummary compact />
      </header>

      <main className="student-main">
        <section className="student-hero">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            {description ? <p>{description}</p> : null}
          </div>
          {action ? <div className="topbar-actions">{action}</div> : null}
        </section>

        <div className="student-reminder">
          <ClipboardCheck aria-hidden="true" size={18} />
          <p>종이에 그린 맥락 스케치는 튜터가 직접 확인합니다. AI는 그림을 판정하지 않고, 글 생성과 구조 분석을 돕습니다.</p>
        </div>

        {children}
      </main>
    </div>
  );
}

