import { NextResponse } from "next/server";
import type { UserRole } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AuthorizedApiContext = {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  userId: string;
  role: UserRole;
  organizationId: string;
};

type RequireApiRoleResult =
  | { context: AuthorizedApiContext; error?: never }
  | { context?: never; error: NextResponse };

export async function requireApiRole(
  allowedRoles: UserRole[]
): Promise<RequireApiRoleResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      error: NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 })
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, organization_id, account_status")
    .eq("id", user.id)
    .single();

  if (
    profileError ||
    !profile ||
    profile.account_status === "disabled" ||
    !allowedRoles.includes(profile.role)
  ) {
    return {
      error: NextResponse.json({ ok: false, error: "권한이 없습니다." }, { status: 403 })
    };
  }

  if (!profile.organization_id) {
    return {
      error: NextResponse.json(
        { ok: false, error: "프로필에 organization_id가 없습니다." },
        { status: 400 }
      )
    };
  }

  return {
    context: {
      supabase,
      userId: user.id,
      role: profile.role,
      organizationId: profile.organization_id
    }
  };
}
