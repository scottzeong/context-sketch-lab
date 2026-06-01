import {
  BarChart3,
  BookOpenText,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LibraryBig,
  LogIn,
  GraduationCap,
  Settings,
  Sparkles,
  Users
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

const navItems = [
  { href: "/tutor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tutor/workbench", label: "AI Workbench", icon: Sparkles },
  { href: "/tutor/groups", label: "Groups", icon: Users },
  { href: "/tutor/texts", label: "Texts", icon: BookOpenText },
  { href: "/tutor/sessions", label: "Sessions", icon: ClipboardCheck },
  { href: "/tutor/reports", label: "Reports", icon: BarChart3 },
  { href: "/student/dashboard", label: "Student View", icon: GraduationCap },
  { href: "/manual", label: "Manual", icon: LibraryBig }
];

type AppShellProps = {
  children: ReactNode;
  title: string;
  eyebrow?: string;
  description?: string;
  action?: ReactNode;
};

export function AppShell({
  children,
  title,
  eyebrow = "Context Sketch Lab",
  description,
  action
}: AppShellProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/tutor/dashboard">
          <span className="brand-mark">CS</span>
          <span>
            <strong>SketchFlow</strong>
            <small>Tutor Workspace</small>
          </span>
        </Link>

        <nav className="nav-list" aria-label="Primary navigation">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link className="nav-item" href={item.href} key={item.href}>
                <Icon aria-hidden="true" size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <FileText aria-hidden="true" size={18} />
          <span>v1 planning build</span>
        </div>
        <Link className="nav-item login-nav-item" href="/login">
          <LogIn aria-hidden="true" size={18} />
          <span>Sign in</span>
        </Link>
      </aside>

      <div className="shell-main">
        <header className="topbar">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            {description ? <p className="topbar-copy">{description}</p> : null}
          </div>
          <div className="topbar-actions">
            {action}
            <button className="icon-button" type="button" aria-label="Settings">
              <Settings aria-hidden="true" size={18} />
            </button>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
