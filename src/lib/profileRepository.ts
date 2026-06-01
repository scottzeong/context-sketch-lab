import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { requireCurrentProfile } from "@/lib/supabase/currentUser";
import type { AgeRange, UserRole } from "@/lib/supabase/database.types";

export type ManagedProfileRecord = {
  id: string;
  role: UserRole;
  displayName: string;
  email: string;
  organizationId: string;
  birthDate?: string;
  ageRange?: AgeRange;
  readingLevel?: string;
  createdAt: string;
  updatedAt: string;
};

function mapProfile(row: {
  id: string;
  role: UserRole;
  display_name: string | null;
  email: string | null;
  organization_id: string | null;
  birth_date: string | null;
  age_range: AgeRange | null;
  reading_level: string | null;
  created_at: string;
  updated_at: string;
}): ManagedProfileRecord {
  return {
    id: row.id,
    role: row.role,
    displayName: row.display_name || row.email || "Unnamed user",
    email: row.email || "",
    organizationId: row.organization_id || "",
    birthDate: row.birth_date || undefined,
    ageRange: row.age_range || undefined,
    readingLevel: row.reading_level || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function getManagedProfiles(): Promise<ManagedProfileRecord[]> {
  const { supabase, profile } = await requireCurrentProfile();

  if (profile.role !== "admin") {
    throw new Error("관리자만 사용자 목록을 볼 수 있습니다.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("role", { ascending: true })
    .order("display_name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []).map(mapProfile);
}

export async function updateManagedProfile(
  id: string,
  updates: {
    role: UserRole;
    displayName: string;
    ageRange?: AgeRange | "";
    readingLevel?: string;
  }
) {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      role: updates.role,
      display_name: updates.displayName || null,
      age_range: updates.ageRange || null,
      reading_level: updates.readingLevel || null,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapProfile(data);
}
