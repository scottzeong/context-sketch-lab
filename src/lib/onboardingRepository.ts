import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { requireCurrentProfile } from "@/lib/supabase/currentUser";
import type { AccountStatus, AgeRange } from "@/lib/supabase/database.types";

export type OnboardingProfile = {
  id: string;
  role: string;
  displayName: string;
  email: string;
  ageRange?: AgeRange;
  readingLevel?: string;
  accountStatus: AccountStatus;
};

export async function getOnboardingProfile(): Promise<OnboardingProfile> {
  const { profile } = await requireCurrentProfile();

  return {
    id: profile.id,
    role: profile.role,
    displayName: profile.display_name || profile.email || "",
    email: profile.email || "",
    ageRange: profile.age_range || undefined,
    readingLevel: profile.reading_level || undefined,
    accountStatus: profile.account_status || "active"
  };
}

export async function updateOwnOnboardingProfile(input: {
  displayName: string;
  ageRange?: AgeRange | "";
}) {
  const supabase = createSupabaseBrowserClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      display_name: input.displayName || null,
      age_range: input.ageRange || null,
      updated_at: new Date().toISOString()
    })
    .eq("id", authData.user.id)
    .select("id, role, display_name, email, age_range, reading_level, account_status")
    .single();

  if (error) {
    throw error;
  }

  return {
    id: data.id,
    role: data.role,
    displayName: data.display_name || data.email || "",
    email: data.email || "",
    ageRange: data.age_range || undefined,
    readingLevel: data.reading_level || undefined,
    accountStatus: data.account_status || "active"
  };
}

export async function updateOwnPassword(password: string) {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    throw error;
  }
}
