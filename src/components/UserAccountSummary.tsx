import { ShieldCheck } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { UserSignOutButton } from "@/components/UserSignOutButton";

const roleLabels = {
  admin: "관리자",
  tutor: "튜터",
  student: "학생",
  parent: "보호자"
} as const;

type UserAccountSummaryProps = {
  compact?: boolean;
};

export async function UserAccountSummary({ compact = false }: UserAccountSummaryProps) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, display_name, email")
      .eq("id", user.id)
      .single();

    const email = profile?.email || user.email || "로그인됨";
    const displayName = profile?.display_name || email;
    const role = profile?.role ? roleLabels[profile.role] : "사용자";

    return (
      <div className={compact ? "user-summary compact" : "user-summary"}>
        <div className="user-summary-main">
          <span className="user-avatar" aria-hidden="true">
            {displayName.slice(0, 1).toUpperCase()}
          </span>
          <span>
            <strong>{displayName}</strong>
            <small>{email}</small>
          </span>
        </div>
        <span className="user-role-pill">
          <ShieldCheck aria-hidden="true" size={14} />
          {role}
        </span>
        <UserSignOutButton />
      </div>
    );
  } catch {
    return null;
  }
}
