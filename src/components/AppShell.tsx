import {
  BarChart3,
  BookOpenText,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LibraryBig,
  GraduationCap,
  Settings,
  Sparkles,
  Users,
  UserRoundCog
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { UserAccountSummary } from "@/components/UserAccountSummary";

const navItems = [
  { href: "/tutor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tutor/workbench", label: "AI Workbench", icon: Sparkles },
  { href: "/tutor/groups", label: "Groups", icon: Users },
  { href: "/tutor/texts", label: "Texts", icon: BookOpenText },
  { href: "/tutor/sessions", label: "Sessions", icon: ClipboardCheck },
  { href: "/tutor/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/users", label: "Admin Users", icon: UserRoundCog },
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

export async function AppShell({
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
        <UserAccountSummary compact />
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
            <Link className="icon-button" href="/onboarding" aria-label="Profile settings">
              <Settings aria-hidden="true" size={18} />
            </Link>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
