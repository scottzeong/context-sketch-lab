import { FolderOpen, Home, LibraryBig } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { UserAccountSummary } from "@/components/UserAccountSummary";

type ParentShellProps = {
  children: ReactNode;
  title: string;
  eyebrow?: string;
  description?: string;
};

export async function ParentShell({
  children,
  title,
  eyebrow = "Parent Workspace",
  description
}: ParentShellProps) {
  return (
    <div className="student-shell">
      <header className="student-topbar">
        <Link className="student-brand" href="/parent/dashboard">
          <span className="brand-mark">
            <Image src="/brand/logo-mark.svg" alt="" width={38} height={38} priority />
          </span>
          <span>
            <strong>Roter Faden</strong>
            <small>Parent</small>
          </span>
        </Link>
        <nav className="student-nav" aria-label="Parent navigation">
          <Link href="/parent/dashboard">
            <Home aria-hidden="true" size={17} />
            Home
          </Link>
          <Link href="/parent/dashboard">
            <FolderOpen aria-hidden="true" size={17} />
            Feedback
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
        </section>

        {children}
      </main>
    </div>
  );
}

