import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

type ProfileWithOrganization =
  Database["public"]["Tables"]["profiles"]["Row"] & { organization_id: string };

export async function requireCurrentProfile() {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    throw new Error("사용자 profile이 없습니다. 관리자에게 profile 생성을 요청하세요.");
  }

  if (profile.account_status === "disabled") {
    throw new Error("비활성화된 계정입니다. 관리자에게 문의해 주세요.");
  }

  if (!profile.organization_id) {
    throw new Error("profile에 organization_id가 없습니다.");
  }

  return { supabase, user, profile: profile as ProfileWithOrganization };
}
