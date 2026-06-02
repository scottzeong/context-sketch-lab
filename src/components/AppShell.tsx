import {
  BarChart3,
  BookOpenText,
  ClipboardCheck,
  LayoutDashboard,
  LibraryBig,
  Settings,
  Sparkles,
  Users,
  UserRoundCog
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { UserAccountSummary } from "@/components/UserAccountSummary";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/database.types";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: UserRole[];
};

const navItems: NavItem[] = [
  { href: "/tutor/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["tutor"] },
  { href: "/tutor/workbench", label: "AI Workbench", icon: Sparkles, roles: ["admin", "tutor"] },
  { href: "/tutor/groups", label: "Groups", icon: Users, roles: ["admin", "tutor"] },
  { href: "/tutor/texts", label: "Texts", icon: BookOpenText, roles: ["admin", "tutor"] },
  { href: "/tutor/sessions", label: "Sessions", icon: ClipboardCheck, roles: ["admin", "tutor"] },
  { href: "/tutor/reports", label: "Reports", icon: BarChart3, roles: ["admin", "tutor"] },
  { href: "/admin/users", label: "Admin Users", icon: UserRoundCog, roles: ["admin"] },
  { href: "/manual", label: "Manual", icon: LibraryBig, roles: ["admin", "tutor"] }
];

const workspaceLabel: Record<UserRole, string> = {
  admin: "Admin Workspace",
  tutor: "Tutor Workspace",
  student: "Student Workspace",
  parent: "Parent Workspace"
};

const workspaceHome: Record<UserRole, string> = {
  admin: "/admin/users",
  tutor: "/tutor/dashboard",
  student: "/student/dashboard",
  parent: "/parent/dashboard"
};

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
  eyebrow = "Roter Faden",
  description,
  action
}: AppShellProps) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };
  const role = profile?.role || "student";
  const visibleNavItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href={workspaceHome[role]}>
          <span className="brand-mark">
            <Image src="/brand/logo-mark.svg" alt="" width={38} height={38} priority />
          </span>
          <span>
            <strong>Roter Faden</strong>
            <small>{workspaceLabel[role]}</small>
          </span>
        </Link>

        <nav className="nav-list" aria-label="Primary navigation">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link className="nav-item" href={item.href} key={item.href}>
                <Icon aria-hidden="true" size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

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

