import {
  BookOpenText,
  ClipboardCheck,
  FolderOpen,
  Home,
  LibraryBig
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

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
    <div className="student-shell">
      <header className="student-topbar">
        <Link className="student-brand" href="/student/dashboard">
          <span className="brand-mark">CS</span>
          <span>
            <strong>SketchFlow</strong>
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
          <p>종이에 그린 맥락스케치는 튜터가 검토합니다. AI가 그림을 판정하지 않습니다.</p>
        </div>

        {children}
      </main>
    </div>
  );
}
